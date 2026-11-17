const prisma = require('../lib/prisma');
const iaService = require('./iaService');
const emailService = require('./emailService');

// Evalúa el riesgo de un estudiante tras un cambio de notas.
// Mientras IA_HABILITADA no sea "true", predecirRiesgo devuelve null y aquí no
// se guarda nada ni se envían correos.
async function evaluarRiesgo({ estudianteId, materiaProgramadaId, trimestre, total, porcentajeAsistencia }) {
  let prediccion = null;
  try {
    prediccion = await iaService.predecirRiesgo({
      totalScore: total,
      attendancePercentage: porcentajeAsistencia ?? 100,
    });
  } catch (error) {
    console.warn('IA no disponible, se omite la predicción:', error.message);
  }
  if (!prediccion) return null;

  await prisma.prediccionRiesgo.create({
    data: {
      estudianteId,
      nivelRiesgo: prediccion.nivel_riesgo,
      probabilidad: prediccion.probabilidad,
      promedioNotas: total,
      porcentajeAsistencia: porcentajeAsistencia ?? 100,
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
        mensaje: `Alerta enviada por Riesgo Alto (${(prediccion.probabilidad * 100).toFixed(1)}%) en la materia ${materia}`,
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
