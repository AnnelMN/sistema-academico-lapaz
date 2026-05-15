const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener materias asignadas al docente autenticado
exports.getMisMaterias = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Buscamos el ID de Docente asociado al Usuario
    const docente = await prisma.docente.findUnique({
      where: { usuarioId }
    });

    if (!docente) {
      return res.status(404).json({ error: 'Perfil de docente no encontrado' });
    }

    const materiasProgramadas = await prisma.materiaProgramada.findMany({
      where: { docenteId: docente.id },
      include: {
        materia: true,
        curso: true
      }
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

    const total = parseFloat(ser) + parseFloat(saber) + parseFloat(hacer);
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
        ser: parseFloat(ser),
        saber: parseFloat(saber),
        hacer: parseFloat(hacer),
        total,
        aprobado
      },
      create: {
        estudianteId,
        materiaProgramadaId,
        trimestre: parseInt(trimestre),
        ser: parseFloat(ser),
        saber: parseFloat(saber),
        hacer: parseFloat(hacer),
        total,
        aprobado
      }
    });

    res.json(nota);
  } catch (error) {
    console.error('Error en upsertNota:', error);
    res.status(500).json({ error: 'Error al guardar la nota' });
  }
};
