const prisma = require('../lib/prisma');
const iaService = require('../services/iaService');
const emailService = require('../services/emailService');

// ─────────────────────────────────────────────
// GET /api/asistencia/estudiantes
// Retorna estudiantes del curso con su estado del día y estadísticas acumuladas
// ─────────────────────────────────────────────
exports.getEstudiantesConAsistencia = async (req, res) => {
  try {
    const { materiaProgramadaId, fecha } = req.query;

    if (!materiaProgramadaId || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros: materiaProgramadaId y fecha' });
    }

    // Los docentes deben tener perfil de docente; el Director puede ver cualquier programación
    if (req.user.rol !== 'DIRECTOR') {
      const docente = await prisma.docente.findUnique({ where: { usuarioId: req.user.id } });
      if (!docente) {
        return res.status(404).json({ error: 'Perfil de docente no encontrado' });
      }
    }
    const programacion = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      select: { cursoId: true }
    });

    if (!programacion) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    // Los docentes solo ven sus propias programaciones; el Director puede ver cualquiera
    if (req.user.rol !== 'DIRECTOR') {
      const programacionCheck = await prisma.materiaProgramada.findUnique({
        where: { id: materiaProgramadaId },
        select: { docenteId: true }
      });
      if (!programacionCheck || programacionCheck.docenteId !== docente.id) {
        return res.status(403).json({ error: 'No tienes acceso a esta materia' });
      }
    }

    // Fecha normalizada al inicio del día UTC
    const fechaInicio = new Date(fecha);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setUTCHours(23, 59, 59, 999);

    // Obtener todos los estudiantes del curso con sus asistencias
    const estudiantes = await prisma.estudiante.findMany({
      where: { cursoId: programacion.cursoId },
      include: {
        usuario: { select: { nombre: true } },
        asistencias: {
          where: { materiaProgramadaId }
        }
      },
      orderBy: { usuario: { nombre: 'asc' } }
    });

    // Para cada estudiante, obtener el estado del día seleccionado y las estadísticas
    const data = estudiantes.map(est => {
      const todasLasAsistencias = est.asistencias;

      // Estado del día consultado
      const asistenciaHoy = todasLasAsistencias.find(a => {
        const d = new Date(a.fecha);
        return d >= fechaInicio && d <= fechaFin;
      });

      // Estadísticas acumuladas
      const totalRegistros = todasLasAsistencias.length;
      const presentes = todasLasAsistencias.filter(a => a.estado === 'PRESENTE').length;
      const faltas = todasLasAsistencias.filter(a => a.estado === 'AUSENTE').length;
      const porcentajeAsistencia = totalRegistros > 0
        ? Math.round((presentes / totalRegistros) * 100 * 10) / 10
        : null; // null = sin registros aún

      return {
        id: est.id,
        nombre: est.usuario.nombre,
        estadoHoy: asistenciaHoy ? asistenciaHoy.estado : null,
        totalRegistros,
        presentes,
        faltas,
        porcentajeAsistencia
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getEstudiantesConAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes con asistencia' });
  }
};

// ─────────────────────────────────────────────
// POST /api/asistencia
// Registra o actualiza la asistencia de todos los estudiantes para una fecha
// ─────────────────────────────────────────────
exports.registrarAsistencia = async (req, res) => {
  try {
    const { materiaProgramadaId, fecha, registros } = req.body;
    // registros = [{ estudianteId, estado }]

    if (!materiaProgramadaId || !fecha || !registros || !Array.isArray(registros)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que la materia le pertenece al docente autenticado
    const docente = await prisma.docente.findUnique({ where: { usuarioId: req.user.id } });
    if (!docente) {
      return res.status(404).json({ error: 'Perfil de docente no encontrado' });
    }
    const programacionCheck = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      select: { docenteId: true }
    });
    if (!programacionCheck || programacionCheck.docenteId !== docente.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta materia' });
    }

    const fechaDate = new Date(fecha);
    fechaDate.setUTCHours(12, 0, 0, 0); // Mediodía UTC para evitar problemas de zona horaria

    const resultados = await Promise.all(
      registros.map(({ estudianteId, estado }) =>
        prisma.asistencia.upsert({
          where: {
            estudianteId_materiaProgramadaId_fecha: {
              estudianteId,
              materiaProgramadaId,
              fecha: fechaDate
            }
          },
          update: { estado },
          create: {
            estudianteId,
            materiaProgramadaId,
            fecha: fechaDate,
            estado
          }
        })
      )
    );

    // --- INTEGRACION CON IA Y NOTIFICACIONES ---
    const config = await prisma.configuracion.findFirst();
    const limiteFaltas = config?.limiteFaltas || 25;

    // Obtener todos los estudiantes unicos afectados
    const estudianteIds = [...new Set(registros.map(r => r.estudianteId))];

    for (const estudianteId of estudianteIds) {
      try {
        // 1. Obtener datos del estudiante
        const estudiante = await prisma.estudiante.findUnique({
          where: { id: estudianteId },
          include: { usuario: true }
        });
        if (!estudiante) continue;

        // 2. Calcular porcentaje de asistencia en esta materia
        const asistencias = await prisma.asistencia.findMany({
          where: { estudianteId, materiaProgramadaId }
        });
        const presentes = asistencias.filter(a => a.estado === 'PRESENTE').length;
        const faltas = asistencias.filter(a => a.estado === 'AUSENTE').length;
        const porcentajeAsistencia = asistencias.length > 0
          ? (presentes / asistencias.length) * 100
          : 100;

        // 3. Obtener promedio de notas del trimestre activo
        const trimestreActivo = config?.trimestreActivo || 1;
        const notas = await prisma.nota.findMany({
          where: { estudianteId, trimestre: trimestreActivo }
        });
        let promedioNotas = 0;
        if (notas.length > 0) {
          promedioNotas = notas.reduce((sum, n) => sum + n.total, 0) / notas.length;
        }

        // 4. Llamar al microservicio IA
        let prediccionData;
        try {
          prediccionData = await iaService.predecirRiesgo({
            totalScore: promedioNotas,
            attendancePercentage: porcentajeAsistencia
          });
        } catch (iaError) {
          console.warn(`IA no disponible para estudiante ${estudianteId}:`, iaError.message);
        }

        // 5. Guardar prediccion si existe
        if (prediccionData) {
          await prisma.prediccionRiesgo.create({
            data: {
              estudianteId,
              nivelRiesgo: prediccionData.nivel_riesgo,
              probabilidad: prediccionData.probabilidad,
              promedioNotas,
              porcentajeAsistencia,
              trimestre: trimestreActivo
            }
          });

          // 6. Si es RIESGO_ALTO, enviar correo al tutor
          if (prediccionData.nivel_riesgo === 'RIESGO_ALTO' && estudiante.emailTutor) {
            try {
              const programacion = await prisma.materiaProgramada.findUnique({
                where: { id: materiaProgramadaId },
                include: { materia: true }
              });
              const materiaNombre = programacion?.materia?.nombre || 'General';

              await emailService.enviarAlertaRiesgo(
                estudiante.usuario.nombre,
                materiaNombre,
                prediccionData,
                estudiante.emailTutor
              );
              await prisma.notificacion.create({
                data: {
                  estudianteId,
                  tipo: 'RIESGO_ALTO',
                  emailDestino: estudiante.emailTutor,
                  estadoEnvio: 'ENVIADO',
                  mensaje: `Alerta por Riesgo Alto (${(prediccionData.probabilidad * 100).toFixed(1)}%) en asistencia`
                }
              });
            } catch (emailError) {
              console.error('Error enviando correo RIESGO_ALTO:', emailError.message);
              await prisma.notificacion.create({
                data: {
                  estudianteId,
                  tipo: 'RIESGO_ALTO',
                  emailDestino: estudiante.emailTutor || 'desconocido',
                  estadoEnvio: 'FALLIDO',
                  mensaje: `Fallo al enviar correo: ${emailError.message}`
                }
              }).catch(() => {});
            }
          }
        }

        // 7. Verificar exceso de faltas
        if (faltas > limiteFaltas && estudiante.emailTutor) {
          const yaNotificado = await prisma.notificacion.findFirst({
            where: {
              estudianteId,
              tipo: 'EXCESO_FALTAS',
              estadoEnvio: 'ENVIADO'
            }
          });
          if (!yaNotificado) {
            try {
              const programacion = await prisma.materiaProgramada.findUnique({
                where: { id: materiaProgramadaId },
                include: { materia: true }
              });
              const materiaNombre = programacion?.materia?.nombre || 'General';

              await emailService.enviarAlertaInasistencia(
                estudiante.usuario.nombre,
                materiaNombre,
                faltas,
                limiteFaltas,
                estudiante.emailTutor
              );
              await prisma.notificacion.create({
                data: {
                  estudianteId,
                  tipo: 'EXCESO_FALTAS',
                  emailDestino: estudiante.emailTutor,
                  estadoEnvio: 'ENVIADO',
                  mensaje: `Exceso de faltas: ${faltas}/${limiteFaltas} en ${materiaNombre}`
                }
              });
            } catch (emailError) {
              console.error('Error enviando correo EXCESO_FALTAS:', emailError.message);
              await prisma.notificacion.create({
                data: {
                  estudianteId,
                  tipo: 'EXCESO_FALTAS',
                  emailDestino: estudiante.emailTutor || 'desconocido',
                  estadoEnvio: 'FALLIDO',
                  mensaje: `Fallo al enviar correo: ${emailError.message}`
                }
              }).catch(() => {});
            }
          }
        }
      } catch (estError) {
        console.error(`Error procesando estudiante ${estudianteId}:`, estError.message);
      }
    }

    res.json({ guardados: resultados.length, fecha: fechaDate });
  } catch (error) {
    console.error('Error en registrarAsistencia:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
};

// ─────────────────────────────────────────────
// GET /api/asistencia/historial
// Historial de asistencias de un estudiante en una materia
// ─────────────────────────────────────────────
exports.getHistorialAsistencia = async (req, res) => {
  try {
    const { estudianteId, materiaProgramadaId } = req.query;

    if (!estudianteId || !materiaProgramadaId) {
      return res.status(400).json({ error: 'Faltan parámetros: estudianteId y materiaProgramadaId' });
    }

    const historial = await prisma.asistencia.findMany({
      where: { estudianteId, materiaProgramadaId },
      orderBy: { fecha: 'desc' }
    });

    res.json(historial);
  } catch (error) {
    console.error('Error en getHistorialAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener historial de asistencia' });
  }
};
