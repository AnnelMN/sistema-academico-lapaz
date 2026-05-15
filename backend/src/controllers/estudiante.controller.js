const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener el perfil del estudiante autenticado
const getEstudiantePerfil = async (usuarioId) => {
  const estudiante = await prisma.estudiante.findUnique({
    where: { usuarioId }
  });
  if (!estudiante) {
    throw new Error('Perfil de estudiante no encontrado');
  }
  return estudiante;
};

// 1. Obtener notas por trimestre
exports.getMisNotas = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);
    const trimestre = parseInt(req.query.trimestre) || 1;

    const notas = await prisma.nota.findMany({
      where: {
        estudianteId: estudiante.id,
        trimestre: trimestre
      },
      include: {
        materiaProgramada: {
          include: {
            materia: true
          }
        }
      }
    });

    res.json(notas);
  } catch (error) {
    console.error('Error en getMisNotas:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

// 2. Obtener horario semanal
exports.getMiHorario = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);

    const programaciones = await prisma.materiaProgramada.findMany({
      where: { cursoId: estudiante.cursoId },
      include: {
        materia: true,
        docente: {
          include: { usuario: true }
        }
      }
    });

    res.json(programaciones);
  } catch (error) {
    console.error('Error en getMiHorario:', error);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

// 3. Obtener resumen de asistencia
exports.getMiAsistencia = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);

    // Obtener todas las asistencias del estudiante
    const asistencias = await prisma.asistencia.findMany({
      where: { estudianteId: estudiante.id },
      include: {
        materiaProgramada: {
          include: { materia: true }
        }
      }
    });

    // Agrupar por materia
    const resumen = {};
    asistencias.forEach(a => {
      const materiaNombre = a.materiaProgramada.materia.nombre;
      if (!resumen[materiaNombre]) {
        resumen[materiaNombre] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
      }
      resumen[materiaNombre].total++;
      if (a.estado === 'PRESENTE') resumen[materiaNombre].presentes++;
      if (a.estado === 'AUSENTE') resumen[materiaNombre].ausentes++;
      if (a.estado === 'JUSTIFICADO') resumen[materiaNombre].justificados++;
    });

    // Formatear a array
    const data = Object.keys(resumen).map(materia => {
      const stats = resumen[materia];
      // Según reglas, J no cuenta como falta. El % es sobre el total.
      const porcentaje = stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0;
      return {
        materia,
        faltas: stats.ausentes,
        porcentaje,
        total: stats.total
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getMiAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
};

// 4. Obtener última predicción de riesgo IA
exports.getMiPrediccion = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);

    const prediccion = await prisma.prediccionRiesgo.findFirst({
      where: { estudianteId: estudiante.id },
      orderBy: { generadoEn: 'desc' }
    });

    // Si no hay predicción todavía, devolver un estado por defecto
    if (!prediccion) {
      return res.json({
        nivelRiesgo: 'SIN_EVALUAR',
        probabilidad: 0,
        promedioNotas: 0,
        porcentajeAsistencia: 0,
        trimestre: 1
      });
    }

    res.json(prediccion);
  } catch (error) {
    console.error('Error en getMiPrediccion:', error);
    res.status(500).json({ error: 'Error al obtener predicción IA' });
  }
};
