const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all users
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    res.status(500).json({ error: 'Server error fetching usuarios' });
  }
};

// Create a new user
const createUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, cursoId } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare transaction or nested writes
    let prismaQuery = {
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      }
    };

    if (rol === 'ESTUDIANTE') {
      let finalCursoId = cursoId;
      if (!finalCursoId) {
        // Fallback: get first course or create a default one
        let curso = await prisma.curso.findFirst();
        if (!curso) {
          curso = await prisma.curso.create({ data: { nivel: 0, paralelo: 'S/A' } });
        }
        finalCursoId = curso.id;
      }

      prismaQuery.data.estudiante = {
        create: {
          cursoId: finalCursoId,
          gestion: new Date().getFullYear(),
          emailTutor: `tutor_${email}`,
        }
      };
    } else if (rol === 'PROFESOR') {
      prismaQuery.data.docente = {
        create: {
          especialidad: 'General',
        }
      };
    }

    const newUser = await prisma.usuario.create(prismaQuery);
    res.status(201).json(newUser);

  } catch (error) {
    console.error('Error creating usuario:', error);
    res.status(500).json({ error: 'Server error creating usuario' });
  }
};

// Update a user
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, password } = req.body;

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (rol) updateData.rol = rol;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating usuario:', error);
    res.status(500).json({ error: 'Server error updating usuario' });
  }
};

// Toggle user status (activo/inactivo)
const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuario.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: { activo: !user.activo },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error toggling usuario status:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleEstado,
};
