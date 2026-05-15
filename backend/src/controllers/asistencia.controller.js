const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Obtener el curso de la programación
    const programacion = await prisma.materiaProgramada.findUnique({
      where: { id: materiaProgramadaId },
      select: { cursoId: true }
    });

    if (!programacion) {
      return res.status(404).json({ error: 'Programación no encontrada' });
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
