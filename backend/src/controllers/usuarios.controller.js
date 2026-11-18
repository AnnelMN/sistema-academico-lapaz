const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { esIdValido } = require('../lib/acceso');
const {
  MENSAJE_CONTRASENA, normalizarEmail, esContrasenaRobusta, normalizarNombre, esRolValido,
} = require('../lib/validaciones');

// Gestión de usuarios (solo DIRECTOR; ver usuarios.routes.js).
// Todas las entradas se validan aquí: email con formato (y en minúsculas),
// nombre, rol permitido y contraseña robusta. El Director no puede cambiar su
// propio rol ni desactivar su propia cuenta (evita quedarse sin acceso).

const COSTO_BCRYPT = 12;

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  estudiante: {
    select: {
      curso: { select: { nivel: true, paralelo: true } },
    },
  },
};

const esEmailDuplicado = (error) => error?.code === 'P2002';

// Get all users
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { ...SELECT_USUARIO, creadoEn: true },
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
    const { cursoId } = req.body || {};
    const nombre = normalizarNombre(req.body?.nombre);
    const email = normalizarEmail(req.body?.email);
    const { password, rol } = req.body || {};

    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio (máximo 100 caracteres)' });
    if (!email) return res.status(400).json({ error: 'El correo electrónico no es válido' });
    if (!esRolValido(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (!esContrasenaRobusta(password)) return res.status(400).json({ error: MENSAJE_CONTRASENA });

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const data = {
      nombre,
      email,
      password: await bcrypt.hash(password, COSTO_BCRYPT),
      rol,
    };

    if (rol === 'ESTUDIANTE') {
      let curso;
      if (cursoId !== undefined && cursoId !== null && cursoId !== '') {
        if (!esIdValido(cursoId)) return res.status(400).json({ error: 'Curso inválido' });
        curso = await prisma.curso.findUnique({ where: { id: cursoId } });
        if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
      } else {
        curso = await prisma.curso.findFirst({ orderBy: [{ nivel: 'asc' }, { paralelo: 'asc' }] });
        if (!curso) return res.status(400).json({ error: 'Primero debe existir al menos un curso' });
      }
      data.estudiante = {
        create: {
          cursoId: curso.id,
          gestion: new Date().getFullYear(),
          emailTutor: `tutor_${email}`,
        },
      };
    } else if (rol === 'PROFESOR') {
      data.docente = { create: { especialidad: 'General' } };
    }

    const newUser = await prisma.usuario.create({ data, select: SELECT_USUARIO });
    res.status(201).json(newUser);
  } catch (error) {
    if (esEmailDuplicado(error)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    console.error('Error creating usuario:', error);
    res.status(500).json({ error: 'Server error creating usuario' });
  }
};

// Update a user
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursoId, password, rol } = req.body || {};

    const actual = await prisma.usuario.findUnique({ where: { id }, select: { id: true, email: true, rol: true } });
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updateData = {};

    if (req.body?.nombre !== undefined && req.body.nombre !== '') {
      const nombre = normalizarNombre(req.body.nombre);
      if (!nombre) return res.status(400).json({ error: 'El nombre no es válido (máximo 100 caracteres)' });
      updateData.nombre = nombre;
    }

    if (req.body?.email !== undefined && req.body.email !== '') {
      const email = normalizarEmail(req.body.email);
      if (!email) return res.status(400).json({ error: 'El correo electrónico no es válido' });
      if (email !== actual.email) {
        const ocupado = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
        if (ocupado) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
      }
      updateData.email = email;
    }

    if (rol !== undefined && rol !== '') {
      if (!esRolValido(rol)) return res.status(400).json({ error: 'Rol inválido' });
      if (id === req.user.id && rol !== actual.rol) {
        return res.status(403).json({ error: 'No puedes cambiar tu propio rol' });
      }
      updateData.rol = rol;
    }

    if (password !== undefined && password !== '') {
      if (!esContrasenaRobusta(password)) return res.status(400).json({ error: MENSAJE_CONTRASENA });
      updateData.password = await bcrypt.hash(password, COSTO_BCRYPT);
    }

    let estudianteNested;
    const rolFinal = updateData.rol || actual.rol;
    if (rolFinal === 'ESTUDIANTE' && cursoId) {
      if (!esIdValido(cursoId)) return res.status(400).json({ error: 'Curso inválido' });
      const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
      if (!curso) {
        return res.status(404).json({ error: 'Curso no encontrado' });
      }
      estudianteNested = {
        upsert: {
          where: { usuarioId: id },
          create: {
            cursoId,
            gestion: new Date().getFullYear(),
            emailTutor: `tutor_${updateData.email || actual.email}`,
          },
          update: { cursoId },
        },
      };
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: {
        ...updateData,
        ...(estudianteNested ? { estudiante: estudianteNested } : {}),
      },
      select: SELECT_USUARIO,
    });

    res.json(updatedUser);
  } catch (error) {
    if (esEmailDuplicado(error)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    console.error('Error updating usuario:', error);
    res.status(500).json({ error: 'Server error updating usuario' });
  }
};

// Toggle user status (activo/inactivo)
const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(403).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

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
      },
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
