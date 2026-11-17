const prisma = require('../lib/prisma');
const iaService = require('../services/iaService');
const emailService = require('../services/emailService');
const { verificarAccesoProgramacion, verificarEstudiantesEnCurso } = require('../lib/acceso');

// Obtener materias asignadas al docente autenticado o todas si es Director
exports.getMisMaterias = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const isDirector = req.user.rol === 'DIRECTOR';

    let docente;
    if (!isDirector) {
      docente = await prisma.docente.findUnique({
        where: { usuarioId },
      });

      if (!docente) {
        return res.status(404).json({ error: 'Perfil de docente no encontrado' });
      }
    }

    const materiasProgramadas = await prisma.materiaProgramada.findMany({
      where: isDirector ? {} : { docenteId: docente.id },
      include: {
        materia: true,
        curso: true,
        docente: {
          include: {
            usuario: { select: { nombre: true } },
          },
        },
      },
    });

    res.json(materiasProgramadas);
  } catch (error) {
    console.error('Error en getMisMaterias:', error);
    res.status(500).json({ error: 'Error al obtener materias' });
  }
};

// Obtener estudiantes y sus notas para una materia y trimestre
exports.getNotasEstudiantes = async (req, res) => {
  try {
    const { materiaProgramadaId, trimestre } = req.query;

    if (!materiaProgramadaId || !trimestre) {
      return res.status(400).json({ error: 'Faltan parámetros: materiaProgramadaId y trimestre' });
    }

    // Verificar que la materia le pertenece al docente autenticado
    const docente = await prisma.docente.findUnique({ where: { usuarioId: req.user.id } });
    if (!docente && req.user.rol !== 'DIRECTOR') {
      return res.status(404).json({ error: 'Perfil de docente no encontrado' });
    }
    const programacionCheck = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      select: { docenteId: true }
    });
    if (
      !programacionCheck ||
      (req.user.rol !== 'DIRECTOR' && programacionCheck.docenteId !== docente.id)
    ) {
      return res.status(403).json({ error: 'No tienes acceso a esta materia' });
    }

    // 1. Obtener la programación para saber el curso
    const programacion = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      select: { cursoId: true }
    });

    if (!programacion) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    // 2. Obtener estudiantes del curso
    const estudiantes = await prisma.estudiante.findMany({
      where: { cursoId: programacion.cursoId },
      include: {
        usuario: {
          select: { nombre: true }
        },
        notas: {
          where: {
            materiaProgramadaId: materiaProgramadaId,
            trimestre: parseInt(trimestre)
          }
        }
      },
      orderBy: {
        usuario: { nombre: 'asc' }
      }
    });

    // 3. Formatear la respuesta
    const data = estudiantes.map(est => {
      const nota = est.notas[0] || { ser: 0, saber: 0, hacer: 0, total: 0 };
      return {
        id: est.id,
        nombre: est.usuario.nombre,
        ser: nota.ser,
        saber: nota.saber,
        hacer: nota.hacer,
        total: nota.total,
        notaId: nota.id || null
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getNotasEstudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes y notas' });
  }
};

// Registrar o actualizar nota
exports.upsertNota = async (req, res) => {
  try {
    const { estudianteId, materiaProgramadaId, trimestre, ser, saber, hacer } = req.body;

    if (!estudianteId || !materiaProgramadaId || !trimestre) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que la materia le pertenece al docente autenticado (el Director puede cualquiera)
    const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
    if (acceso.error) {
      return res.status(acceso.status).json({ error: acceso.error });
    }

    // Verificar que el estudiante pertenece al curso de esta materia
    // (evita registrar notas y disparar correos a tutores de otros cursos)
    const pertenencia = await verificarEstudiantesEnCurso([estudianteId], acceso.programacion.cursoId);
    if (pertenencia.error) {
      return res.status(pertenencia.status).json({ error: pertenencia.error });
    }

    // Validar que el trimestre coincida con el activo
    const config = await prisma.configuracion.findFirst();
    if (config && parseInt(trimestre) !== config.trimestreActivo) {
      return res.status(403).json({ 
        error: `Solo se pueden registrar notas en el trimestre activo (${config.trimestreActivo}). Trimestre solicitado: ${trimestre}` 
      });
    }

    // Validar rangos de nota: Ser 0-15, Saber 0-35, Hacer >= 0
    const serNum = parseFloat(ser);
    const saberNum = parseFloat(saber);
    const hacerNum = parseFloat(hacer);

    if (isNaN(serNum) || isNaN(saberNum) || isNaN(hacerNum)) {
      return res.status(400).json({ error: 'Los valores de nota deben ser numericos' });
    }
    if (serNum < 0 || serNum > 15) {
      return res.status(400).json({ error: 'Ser debe estar entre 0 y 15' });
    }
    if (saberNum < 0 || saberNum > 35) {
      return res.status(400).json({ error: 'Saber debe estar entre 0 y 35' });
    }
    if (hacerNum < 0) {
      return res.status(400).json({ error: 'Hacer no puede ser negativo' });
    }

    const total = serNum + saberNum + hacerNum;
    const aprobado = total >= 51;

    const nota = await prisma.nota.upsert({
      where: {
        estudianteId_materiaProgramadaId_trimestre: {
          estudianteId,
          materiaProgramadaId,
          trimestre: parseInt(trimestre)
        }
      },
      update: {
        ser: serNum,
        saber: saberNum,
        hacer: hacerNum,
        total,
        aprobado
      },
      create: {
        estudianteId,
        materiaProgramadaId,
        trimestre: parseInt(trimestre),
        ser: serNum,
        saber: saberNum,
        hacer: hacerNum,
        total,
        aprobado
      }
    });

    // --- INTEGRACIÓN CON IA Y NOTIFICACIONES ---
    
    // 1. Obtener datos del estudiante y materia
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      include: {
        usuario: true
      }
    });

    const programacion = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      include: { materia: true }
    });

    // 2. Calcular porcentaje de asistencia del estudiante en esta materia
    const asistencias = await prisma.asistencia.findMany({
      where: {
        estudianteId,
        materiaProgramadaId
      }
    });

    let attendancePercentage = 100.0;
    if (asistencias.length > 0) {
      const presentes = asistencias.filter(a => a.estado === 'PRESENTE').length;
      attendancePercentage = (presentes / asistencias.length) * 100;
    }

    // 3. Obtener predicción de riesgo
    let prediccionData;
    try {
      prediccionData = await iaService.predecirRiesgo({
        totalScore: total,
        attendancePercentage
      });
    } catch (iaError) {
      console.warn('No se pudo obtener predicción IA, omitiendo guardado de riesgo:', iaError.message);
    }

    if (prediccionData) {
      // 4. Guardar predicción en la base de datos
      const nuevaPrediccion = await prisma.prediccionRiesgo.create({
        data: {
          estudianteId,
          nivelRiesgo: prediccionData.nivel_riesgo,
          probabilidad: prediccionData.probabilidad,
          promedioNotas: total, // usamos la nota total actual de este trimestre
          porcentajeAsistencia: attendancePercentage,
          trimestre: parseInt(trimestre)
        }
      });

      // 5. Si es riesgo alto, enviar correo
      if (prediccionData.nivel_riesgo === 'RIESGO_ALTO' && estudiante.emailTutor) {
        try {
          await emailService.enviarAlertaRiesgo(
            estudiante.usuario.nombre,
            programacion.materia.nombre,
            prediccionData,
            estudiante.emailTutor
          );

          // 6. Registrar la notificación enviada
          await prisma.notificacion.create({
            data: {
              estudianteId,
              tipo: 'RIESGO_ALTO',
              emailDestino: estudiante.emailTutor,
              estadoEnvio: 'ENVIADO',
              mensaje: `Alerta enviada por Riesgo Alto (${(prediccionData.probabilidad * 100).toFixed(1)}%) en la materia ${programacion.materia.nombre}`
            }
          });
        } catch (emailError) {
          console.error('Error al enviar correo de alerta o registrar notificación:', emailError);
          // Registramos como FALLIDO
          await prisma.notificacion.create({
            data: {
              estudianteId,
              tipo: 'RIESGO_ALTO',
              emailDestino: estudiante.emailTutor || 'desconocido',
              estadoEnvio: 'FALLIDO',
              mensaje: `Fallo al enviar correo: ${emailError.message}`
            }
          }).catch(() => {}); // ignorar error secundario
        }
      }
    }

    res.json(nota);
  } catch (error) {
    console.error('Error en upsertNota:', error);
    res.status(500).json({ error: 'Error al guardar la nota' });
  }
};
