const prisma = require('../lib/prisma');
const iaService = require('./iaService');
const emailService = require('./emailService');
const { calcularVariablesRiesgo } = require('./variablesRiesgoService');
const { rangoDeTrimestre } = require('./periodoService');

// Cuántas predicciones se hacen a la vez en segundo plano (R-02)
const PREDICCIONES_SIMULTANEAS = 4;

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

  await prisma.prediccionRiesgo.create({
    data: {
      estudianteId,
      nivelRiesgo: prediccion.nivel_riesgo,
      probabilidad: prediccion.probabilidad,
      promedioNotas: total,
      porcentajeAsistencia,
      trimestre,
    },
  });

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

/**
 * Evalúa el riesgo de varios estudiantes SIN hacer esperar al docente (R-02):
 * la función vuelve de inmediato y las predicciones se hacen después, de a
 * PREDICCIONES_SIMULTANEAS a la vez. Si la IA falla una vez, la tanda se detiene.
 * Nunca lanza errores (quedan solo en el log). Devuelve la promesa de la tanda
 * (las rutas NO la esperan; sirve para las pruebas).
 */
function evaluarRiesgoEnSegundoPlano(estudianteIds, { materiaProgramadaId, trimestre, origen }) {
  if (!iaService.iaHabilitada() || estudianteIds.length === 0) return Promise.resolve();
  const pendientes = [...new Set(estudianteIds)];
  const estado = {};
  const trabajador = async () => {
    while (pendientes.length && !estado.iaFallo) {
      const estudianteId = pendientes.shift();
      try {
        await evaluarRiesgo({ estudianteId, materiaProgramadaId, trimestre, origen }, estado);
      } catch (error) {
        console.error(`Error evaluando el riesgo del estudiante ${estudianteId}:`, error.message);
      }
    }
  };
  return new Promise((resolve) => {
    setImmediate(() => {
      Promise.all(Array.from({ length: Math.min(PREDICCIONES_SIMULTANEAS, pendientes.length) }, trabajador))
        .catch((error) => console.error('Error en las predicciones en segundo plano:', error.message))
        .finally(resolve);
    });
  });
}

module.exports = { evaluarRiesgo, evaluarRiesgoEnSegundoPlano, PREDICCIONES_SIMULTANEAS };
