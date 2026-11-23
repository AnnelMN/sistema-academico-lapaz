const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { esIdValido } = require('../lib/acceso');
const {
  MENSAJE_CONTRASENA, COSTO_BCRYPT, normalizarEmail, esContrasenaRobusta, normalizarNombre, esRolGestionable,
} = require('../lib/validaciones');

// Gestión de usuarios (solo DIRECTOR; ver usuarios.routes.js).
// - El Director crea Docentes (PROFESOR), Administrativos y Estudiantes; no puede
//   crear otro Director ni asignar ese rol.
// - Las contraseñas se guardan SOLO como hash bcrypt y nunca se devuelven: el
//   Director puede asignar una nueva, pero no ver la actual de nadie.
// - Estudiante: curso y correo del tutor obligatorios. Docente: especialidad.
// - No se cambia el rol de un Estudiante o Docente (sus notas, asistencia o
//   materias dependen de ese perfil): se crea un usuario nuevo.
// - Desactivar no borra nada: el usuario no puede ingresar, deja de aparecer en
//   las listas del docente y su historial académico se conserva.
// El Director no puede cambiar su propio rol ni desactivar su propia cuenta.

const ETIQUETA_ROL = { PROFESOR: 'Docente', ADMINISTRATIVO: 'Administrativo', ESTUDIANTE: 'Estudiante', DIRECTOR: 'Director' };

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  estudiante: {
    select: {
      emailTutor: true,
      curso: { select: { id: true, nivel: true, paralelo: true } },
    },
  },
  docente: { select: { especialidad: true } },
};

const esEmailDuplicado = (error) => error?.code === 'P2002';

class ErrorUsuario extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Especialidad del docente: texto de 1 a 100 caracteres
const normalizarEspecialidad = (valor) => normalizarNombre(valor);

// Curso existente a partir del id recibido
async function cursoValido(cursoId) {
  if (!esIdValido(cursoId)) throw new ErrorUsuario(400, 'Seleccione un curso válido para el estudiante');
  const curso = await prisma.curso.findUnique({ where: { id: cursoId }, select: { id: true } });
  if (!curso) throw new ErrorUsuario(404, 'Curso no encontrado');
  return curso;
}

// Correo del tutor (obligatorio para estudiantes: recibe los avisos de riesgo y faltas)
function emailTutorValido(valor, emailEstudiante) {
  const emailTutor = normalizarEmail(valor);
  if (!emailTutor) throw new ErrorUsuario(400, 'El correo del tutor no es válido');
  if (emailTutor === emailEstudiante) {
    throw new ErrorUsuario(400, 'El correo del tutor debe ser distinto del correo del estudiante');
  }
  return emailTutor;
}

const responderError = (res, error, contexto, mensaje) => {
  if (error instanceof ErrorUsuario) return res.status(error.status).json({ error: error.message });
  if (esEmailDuplicado(error)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
  console.error(`Error en ${contexto}:`, error);
  return res.status(500).json({ error: mensaje });
};

// GET /api/usuarios
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { ...SELECT_USUARIO, creadoEn: true },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(usuarios);
  } catch (error) {
    responderError(res, error, 'getUsuarios', 'Error al obtener los usuarios');
  }
};

// POST /api/usuarios
const createUsuario = async (req, res) => {
  try {
    const body = req.body || {};
    const nombre = normalizarNombre(body.nombre);
    const email = normalizarEmail(body.email);
    const { password, rol } = body;

    if (!nombre) throw new ErrorUsuario(400, 'El nombre es obligatorio (máximo 100 caracteres)');
    if (!email) throw new ErrorUsuario(400, 'El correo electrónico no es válido');
    if (!esRolGestionable(rol)) throw new ErrorUsuario(400, 'Rol inválido: puede crear Docentes, Administrativos o Estudiantes');
    if (!esContrasenaRobusta(password)) throw new ErrorUsuario(400, MENSAJE_CONTRASENA);

    const existente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    if (existente) throw new ErrorUsuario(409, 'Ya existe un usuario con ese correo');

    const data = {
      nombre,
      email,
      password: await bcrypt.hash(password, COSTO_BCRYPT),
      rol,
    };

    if (rol === 'ESTUDIANTE') {
      const curso = await cursoValido(body.cursoId);
      data.estudiante = {
        create: {
          cursoId: curso.id,
          gestion: new Date().getFullYear(),
          emailTutor: emailTutorValido(body.emailTutor, email),
        },
      };
    } else if (rol === 'PROFESOR') {
      const especialidad = normalizarEspecialidad(body.especialidad);
      if (!especialidad) throw new ErrorUsuario(400, 'La especialidad del docente es obligatoria (máximo 100 caracteres)');
      data.docente = { create: { especialidad } };
    }

    const nuevo = await prisma.usuario.create({ data, select: SELECT_USUARIO });
    res.status(201).json(nuevo);
  } catch (error) {
    responderError(res, error, 'createUsuario', 'Error al crear el usuario');
  }
};

// PUT /api/usuarios/:id
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (!esIdValido(id)) throw new ErrorUsuario(400, 'Usuario inválido');

    const actual = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true, email: true, rol: true,
        estudiante: { select: { id: true } },
        docente: { select: { id: true } },
      },
    });
    if (!actual) throw new ErrorUsuario(404, 'Usuario no encontrado');

    const updateData = {};

    if (body.nombre !== undefined && body.nombre !== '') {
      const nombre = normalizarNombre(body.nombre);
      if (!nombre) throw new ErrorUsuario(400, 'El nombre no es válido (máximo 100 caracteres)');
      updateData.nombre = nombre;
    }

    if (body.email !== undefined && body.email !== '') {
      const email = normalizarEmail(body.email);
      if (!email) throw new ErrorUsuario(400, 'El correo electrónico no es válido');
      if (email !== actual.email) {
        const ocupado = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
        if (ocupado) throw new ErrorUsuario(409, 'Ya existe un usuario con ese correo');
      }
      updateData.email = email;
    }

    // Rol: solo se permite pasar de Administrativo a Docente (se crea su perfil).
    // El rol de un Estudiante o Docente no cambia, ni se asigna el de Director.
    let crearDocente = false;
    if (body.rol !== undefined && body.rol !== '' && body.rol !== actual.rol) {
      if (id === req.user.id) throw new ErrorUsuario(403, 'No puedes cambiar tu propio rol');
      if (!esRolGestionable(body.rol)) throw new ErrorUsuario(400, 'Rol inválido: puede asignar Docente, Administrativo o Estudiante');
      if (actual.rol === 'DIRECTOR') throw new ErrorUsuario(403, 'No se puede cambiar el rol del Director');
      if (actual.estudiante || actual.docente) {
        throw new ErrorUsuario(409, `No se puede cambiar el rol de un ${ETIQUETA_ROL[actual.rol]}: su historial depende de ese perfil. Cree un usuario nuevo con el rol correcto.`);
      }
      if (body.rol === 'ESTUDIANTE') {
        throw new ErrorUsuario(409, 'Para registrar un estudiante cree un usuario nuevo con su curso y el correo del tutor.');
      }
      crearDocente = body.rol === 'PROFESOR';
      updateData.rol = body.rol;
    }

    if (body.password !== undefined && body.password !== '') {
      if (!esContrasenaRobusta(body.password)) throw new ErrorUsuario(400, MENSAJE_CONTRASENA);
      updateData.password = await bcrypt.hash(body.password, COSTO_BCRYPT);
    }

    // Cambio de contraseña o de rol → se cierran todas las sesiones de ese usuario
    if (updateData.password || updateData.rol) {
      updateData.tokenVersion = { increment: 1 };
    }

    // Datos del perfil de estudiante: curso y correo del tutor
    if (actual.estudiante) {
      const cambios = {};
      if (body.cursoId !== undefined && body.cursoId !== '') cambios.cursoId = (await cursoValido(body.cursoId)).id;
      if (body.emailTutor !== undefined && body.emailTutor !== '') {
        cambios.emailTutor = emailTutorValido(body.emailTutor, updateData.email || actual.email);
      }
      if (Object.keys(cambios).length) updateData.estudiante = { update: cambios };
    }

    // Perfil de docente: especialidad (obligatoria al pasar de Administrativo a Docente)
    if (actual.docente || crearDocente) {
      let especialidad;
      if (body.especialidad !== undefined && body.especialidad !== '') {
        especialidad = normalizarEspecialidad(body.especialidad);
        if (!especialidad) throw new ErrorUsuario(400, 'La especialidad no es válida (máximo 100 caracteres)');
      }
      if (crearDocente) {
        if (!especialidad) throw new ErrorUsuario(400, 'La especialidad del docente es obligatoria');
        updateData.docente = { create: { especialidad } };
      } else if (especialidad) {
        updateData.docente = { update: { especialidad } };
      }
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: SELECT_USUARIO,
    });

    res.json(actualizado);
  } catch (error) {
    responderError(res, error, 'updateUsuario', 'Error al actualizar el usuario');
  }
};

// PATCH /api/usuarios/:id/estado — activar o desactivar (no borra nada)
const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esIdValido(id)) throw new ErrorUsuario(400, 'Usuario inválido');

    if (id === req.user.id) {
      throw new ErrorUsuario(403, 'No puedes desactivar tu propia cuenta');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id }, select: { activo: true, rol: true } });
    if (!usuario) throw new ErrorUsuario(404, 'Usuario no encontrado');
    if (usuario.rol === 'DIRECTOR') throw new ErrorUsuario(403, 'No se puede desactivar la cuenta del Director');

    const actualizado = await prisma.usuario.update({
      where: { id },
      // Activar o desactivar → las sesiones anteriores dejan de valer
      data: { activo: !usuario.activo, tokenVersion: { increment: 1 } },
      select: SELECT_USUARIO,
    });

    res.json(actualizado);
  } catch (error) {
    responderError(res, error, 'toggleEstado', 'Error al cambiar el estado del usuario');
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleEstado,
};
