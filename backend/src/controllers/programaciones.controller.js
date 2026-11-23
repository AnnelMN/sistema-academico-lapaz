const prisma = require('../lib/prisma');
const { esIdValido } = require('../lib/acceso');
const { normalizarHorario } = require('../lib/horario');

const getProgramaciones = async (req, res) => {
  try {
    const { cursoId } = req.query;
    let whereClause = {};
    
    // Si queremos filtrar por un curso específico (para la "Vista de malla")
    if (cursoId) {
      whereClause.cursoId = cursoId;
    }

    const programaciones = await prisma.materiaProgramada.findMany({
      where: whereClause,
      include: {
        materia: true,
        docente: {
          include: {
            usuario: { select: { nombre: true, activo: true } }
          }
        },
        curso: true
      }
    });
    res.json(programaciones);
  } catch (error) {
    console.error('Error fetching programaciones:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createProgramacion = async (req, res) => {
  try {
    const { materiaId, docenteId, cursoId } = req.body || {};

    if (![materiaId, docenteId, cursoId].every(esIdValido) || !req.body?.horario) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Formato único "Día-HH:MM" (lunes a viernes): los conflictos se comparan
    // siempre con el mismo texto
    const horario = normalizarHorario(req.body.horario);
    if (!horario) {
      return res.status(400).json({ error: 'Horario inválido: use el formato Día-HH:MM, de lunes a viernes (por ejemplo Lunes-07:30)' });
    }

    const gestion = new Date().getFullYear();

    // Solo se asignan docentes activos
    const docente = await prisma.docente.findUnique({
      where: { id: docenteId },
      select: { usuario: { select: { activo: true } } },
    });
    if (!docente?.usuario?.activo) {
      return res.status(400).json({ error: 'El docente no existe o está inactivo' });
    }

    // 1. Validar Conflicto: ¿El Docente ya tiene clase en ese horario?
    const docenteConflict = await prisma.materiaProgramada.findFirst({
      where: {
        docenteId,
        horario,
        gestion
      },
      include: {
        curso: true
      }
    });

    if (docenteConflict) {
      return res.status(409).json({ 
        error: `Conflicto: El docente ya tiene una clase asignada en el curso ${docenteConflict.curso.nivel}ro ${docenteConflict.curso.paralelo} en ese horario (${horario}).` 
      });
    }

    // 2. Validar Conflicto: ¿El Curso ya tiene otra materia en ese horario?
    const cursoConflict = await prisma.materiaProgramada.findFirst({
      where: {
        cursoId,
        horario,
        gestion,
        // La clase de un docente inactivo no ocupa el espacio del curso
        docente: { usuario: { activo: true } }
      },
      include: {
        materia: true
      }
    });

    if (cursoConflict) {
      return res.status(409).json({ 
        error: `Conflicto: El curso ya tiene asignada la materia ${cursoConflict.materia.nombre} en ese horario (${horario}).` 
      });
    }

    // Si no hay conflictos, creamos la programación
    const nuevaProgramacion = await prisma.materiaProgramada.create({
      data: {
        materiaId,
        docenteId,
        cursoId,
        horario,
        gestion
      },
      include: {
        materia: true,
        docente: {
          include: { usuario: { select: { nombre: true } } }
        }
      }
    });

    res.status(201).json(nuevaProgramacion);

  } catch (error) {
    console.error('Error creating programacion:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getProgramaciones,
  createProgramacion
};
