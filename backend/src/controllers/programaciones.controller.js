const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            usuario: { select: { nombre: true } }
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
    const { materiaId, docenteId, cursoId, horario } = req.body;
    
    if (!materiaId || !docenteId || !cursoId || !horario) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const gestion = new Date().getFullYear();

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
        gestion
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
