const prisma = require('../lib/prisma');
const iaService = require('./iaService');
const { calcularVariablesRiesgo } = require('./variablesRiesgoService');
const emailService = require('./emailService');

// Evalúa el riesgo de un estudiante tras un cambio de notas o de asistencia.
// Las variables se calculan con TODAS sus materias (no solo la que cambió).
// Mientras IA_HABILITADA no sea "true" no se consulta la base de datos ni la IA,
// no se guarda nada y no se envían correos.
// origen: 'notas' | 'asistencia' (solo para el texto de la notificación)
async function evaluarRiesgo({ estudianteId, materiaProgramadaId, trimestre, origen = 'notas' }) {
  if (!iaService.iaHabilitada()) return null;

  const variables = await calcularVariablesRiesgo({ estudianteId, materiaProgramadaId, trimestre });
  if (!variables) return null;   // todavía no tiene notas: no hay con qué predecir

  let prediccion = null;
  try {
    prediccion = await iaService.predecirRiesgo(variables);
  } catch (error) {
    console.warn('IA no disponible, se omite la predicción:', error.message);
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

module.exports = { evaluarRiesgo };
