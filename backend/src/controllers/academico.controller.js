const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// MATERIAS
const getMaterias = async (req, res) => {
  try {
    const materias = await prisma.materia.findMany({
      orderBy: { nombre: 'asc' }
    });
    // Formato sugerido por el frontend: agregar un 'estado' ficticio si no existe en BD, o activo por defecto
    const materiasMapped = materias.map(m => ({
      ...m,
      estado: 'Activa' // Según el mockup, la mayoría están Activas
    }));
    res.json(materiasMapped);
  } catch (error) {
    console.error('Error fetching materias:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createMateria = async (req, res) => {
  try {
    const { nombre, nivel, cargaHoraria } = req.body;
    if (!nombre || !nivel || !cargaHoraria) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const nuevaMateria = await prisma.materia.create({
      data: {
        nombre,
        nivel: parseInt(nivel),
        cargaHoraria: parseInt(cargaHoraria)
      }
    });
    res.status(201).json(nuevaMateria);
  } catch (error) {
    console.error('Error creating materia:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// CURSOS
const getCursos = async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: [
        { nivel: 'asc' },
        { paralelo: 'asc' }
      ]
    });
    res.json(cursos);
  } catch (error) {
    console.error('Error fetching cursos:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DOCENTES
const getDocentes = async (req, res) => {
  try {
    // Obtenemos los docentes junto con sus datos de usuario
    const docentes = await prisma.docente.findMany({
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
            activo: true
          }
        }
      }
    });
    // Filtramos solo los activos
    const docentesActivos = docentes.filter(d => d.usuario.activo);
    res.json(docentesActivos);
  } catch (error) {
    console.error('Error fetching docentes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getMaterias,
  createMateria,
  getCursos,
  getDocentes
};
