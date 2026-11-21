const prisma = require('../lib/prisma');
const iaService = require('./iaService');
const emailService = require('./emailService');
const { calcularVariablesRiesgo } = require('./variablesRiesgoService');
const { rangoDeTrimestre } = require('./periodoService');

// Cuántas predicciones se hacen a la vez en segundo plano, en TODO el servidor (R-02, R-06)
const PREDICCIONES_SIMULTANEAS = 4;
// Si la IA falla, se deja de consultarla durante este tiempo (R-06)
const PAUSA_TRAS_FALLO_MS = 30 * 1000;

// ¿Ya se avisó al tutor de este estudiante por Riesgo Alto en este trimestre? (R-01)
// Se avisa como máximo UNA vez por trimestre: así un estudiante en riesgo no
// genera un correo por cada nota o asistencia registrada.
async function yaAvisadoEnTrimestre(estudianteId, gestion, trimestre) {
  const rango = gestion ? await rangoDeTrimestre(gestion, trimestre) : null;
  // Los avisos enviados con el modelo antiguo (antes de IA_MODELO_DESDE) no cuentan
  const desde = iaService.prediccionesDesde();
  const inicio = [rango?.inicio, desde].filter(Boolean).reduce((a, b) => (a > b ? a : b), undefined);
  const enviadoEn = { ...(inicio ? { gte: inicio } : {}), ...(rango ? { lte: rango.fin } : {}) };
  const aviso = await prisma.notificacion.findFirst({
    where: {
      estudianteId,
      tipo: 'RIESGO_ALTO',
      estadoEnvio: 'ENVIADO',
      ...(Object.keys(enviadoEn).length ? { enviadoEn } : {}),
    },
    select: { id: true },
  });
  return Boolean(aviso);
}

// Evalúa el riesgo de un estudiante tras un cambio de notas o de asistencia.
// Las variables se calculan con TODAS sus materias (no solo la que cambió).
// Mientras IA_HABILITADA no sea "true" no se consulta la base de datos ni la IA,
// no se guarda nada y no se envían correos.
// origen: 'notas' | 'asistencia' (solo para el texto de la notificación)
// estado: objeto compartido por una tanda de predicciones; si la IA falla, se
//         marca estado.iaFallo y el resto de la tanda no vuelve a intentarlo (R-02).
async function evaluarRiesgo({ estudianteId, materiaProgramadaId, trimestre, origen = 'notas' }, estado = {}) {
  if (!iaService.iaHabilitada() || estado.iaFallo) return null;

  const variables = await calcularVariablesRiesgo({ estudianteId, materiaProgramadaId, trimestre });
  if (!variables) return null;   // todavía no tiene notas: no hay con qué predecir

  let prediccion = null;
  try {
    prediccion = await iaService.predecirRiesgo(variables);
  } catch (error) {
    estado.iaFallo = true;
    console.warn('IA no disponible, se omiten las predicciones de esta operación:', error.message);
  }
  if (!prediccion) return null;
  const total = variables.promedio_notas;
  const porcentajeAsistencia = variables.porcentaje_asistencia;

  // R-05: si el nivel de riesgo no cambió desde la última predicción del trimestre,
  // se ACTUALIZA esa fila (datos y fecha) en lugar de crear otra. Así el historial
  // guarda solo los cambios de nivel y no una fila por cada nota o asistencia.
  const anterior = await prisma.prediccionRiesgo.findFirst({
    where: { estudianteId, trimestre, ...iaService.filtroModeloVigente() },
    orderBy: { generadoEn: 'desc' },
    select: { id: true, nivelRiesgo: true },
  });
  const datos = {
    probabilidad: prediccion.probabilidad,
    promedioNotas: total,
    porcentajeAsistencia,
    generadoEn: new Date(),
  };
  if (anterior && anterior.nivelRiesgo === prediccion.nivel_riesgo) {
    await prisma.prediccionRiesgo.update({ where: { id: anterior.id }, data: datos });
  } else {
    await prisma.prediccionRiesgo.create({
      data: { estudianteId, nivelRiesgo: prediccion.nivel_riesgo, trimestre, ...datos },
    });
  }

  if (prediccion.nivel_riesgo !== 'RIESGO_ALTO') return prediccion;
  if (await yaAvisadoEnTrimestre(estudianteId, variables.gestion, trimestre)) return prediccion;

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { emailTutor: true, usuario: { select: { nombre: true } } },
  });
  if (!estudiante?.emailTutor) return prediccion;

  const programacion = await prisma.materiaProgramada.findUnique({
    where: { id: materiaProgramadaId },
    select: { materia: { select: { nombre: true } } },
  });
  const materia = programacion?.materia?.nombre || 'General';

  try {
    await emailService.enviarAlertaRiesgo(estudiante.usuario.nombre, materia, prediccion, estudiante.emailTutor);
    await prisma.notificacion.create({
      data: {
        estudianteId,
        tipo: 'RIESGO_ALTO',
        emailDestino: estudiante.emailTutor,
        estadoEnvio: 'ENVIADO',
        mensaje: `Alerta enviada por Riesgo Alto (${(prediccion.probabilidad * 100).toFixed(1)}%) tras registrar ${origen === 'asistencia' ? 'asistencia' : 'notas'} en ${materia} · promedio ${total} · áreas reprobadas ${variables.areas_reprobadas}`,
      },
    });
  } catch (error) {
    console.error('Error al enviar la alerta de Riesgo Alto:', error.message);
    await prisma.notificacion.create({
      data: {
        estudianteId,
        tipo: 'RIESGO_ALTO',
        emailDestino: estudiante.emailTutor,
        estadoEnvio: 'FALLIDO',
        mensaje: 'No se pudo enviar el correo de alerta',
      },
    }).catch(() => {});
  }
  return prediccion;
}

// ── Cola ÚNICA de predicciones en segundo plano (R-02, R-06) ─────────────────
// - Las rutas no esperan: el docente recibe su respuesta de inmediato.
// - Como máximo PREDICCIONES_SIMULTANEAS a la vez en todo el servidor, aunque
//   varios docentes registren notas o escaneen QR al mismo tiempo.
// - Un estudiante que ya está en espera no se repite: se usa el pedido más reciente.
// - Si la IA falla, se pausa PAUSA_TRAS_FALLO_MS y lo pendiente se omite (la
//   próxima nota o asistencia vuelve a intentarlo).
const cola = new Map();          // estudianteId → { params, avisos: [resolve, …] }
let activas = 0;
let pausaHasta = 0;

function despachar() {
  while (activas < PREDICCIONES_SIMULTANEAS && cola.size > 0) {
    const [estudianteId, item] = cola.entries().next().value;
    cola.delete(estudianteId);
    activas += 1;
    (async () => {
      try {
        if (Date.now() >= pausaHasta) {
          const estado = {};
          await evaluarRiesgo(item.params, estado);
          if (estado.iaFallo) pausaHasta = Date.now() + PAUSA_TRAS_FALLO_MS;
        }
      } catch (error) {
        console.error(`Error evaluando el riesgo del estudiante ${estudianteId}:`, error.message);
      } finally {
        activas -= 1;
        item.avisos.forEach((avisar) => avisar());
        despachar();
      }
    })();
  }
}

/**
 * Encola la evaluación de riesgo de varios estudiantes SIN hacer esperar al
 * docente. Nunca lanza errores (quedan en el log). Devuelve una promesa que se
 * cumple cuando terminan (las rutas NO la esperan; sirve para las pruebas).
 */
function evaluarRiesgoEnSegundoPlano(estudianteIds, { materiaProgramadaId, trimestre, origen }) {
  if (!iaService.iaHabilitada() || estudianteIds.length === 0) return Promise.resolve();
  const promesas = [...new Set(estudianteIds)].map((estudianteId) => new Promise((resolve) => {
    const params = { estudianteId, materiaProgramadaId, trimestre, origen };
    const enEspera = cola.get(estudianteId);
    if (enEspera) {
      enEspera.params = params;          // ya estaba en la cola: se usa el pedido más reciente
      enEspera.avisos.push(resolve);
    } else {
      cola.set(estudianteId, { params, avisos: [resolve] });
    }
  }));
  setImmediate(despachar);
  return Promise.all(promesas).then(() => undefined);
}

// Solo para pruebas: reinicia la pausa y la cola
function _reiniciarCola() {
  cola.clear();
  pausaHasta = 0;
}

module.exports = { evaluarRiesgo, evaluarRiesgoEnSegundoPlano, PREDICCIONES_SIMULTANEAS, _reiniciarCola };
