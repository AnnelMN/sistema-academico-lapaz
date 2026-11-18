// Validaciones compartidas (la validación del frontend es solo ayuda visual;
// la que cuenta es esta, en el servidor).

const ROLES = Object.freeze(['DIRECTOR', 'PROFESOR', 'ADMINISTRATIVO', 'ESTUDIANTE']);

const MAX_NOMBRE = 100;
const MAX_EMAIL = 254;
const MIN_CONTRASENA = 10;
const MAX_BYTES_CONTRASENA = 72; // bcrypt ignora lo que pase de 72 bytes

// Normaliza un email (minúsculas, sin espacios) o devuelve null si no es válido
const normalizarEmail = (valor) => {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  if (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
};

// Política única de contraseñas: 10+ caracteres, al menos una letra y un número, máx. 72 bytes
const esContrasenaRobusta = (valor) => (
  typeof valor === 'string'
  && valor.length >= MIN_CONTRASENA
  && Buffer.byteLength(valor, 'utf8') <= MAX_BYTES_CONTRASENA
  && /[A-Za-z]/.test(valor)
  && /\d/.test(valor)
);

const MENSAJE_CONTRASENA = `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres, una letra y un número (máximo ${MAX_BYTES_CONTRASENA} bytes)`;

// Nombre de persona: texto de 1 a 100 caracteres, sin caracteres de control
const normalizarNombre = (valor) => {
  if (typeof valor !== 'string') return null;
  const nombre = valor.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return nombre.length >= 1 && nombre.length <= MAX_NOMBRE ? nombre : null;
};

const esRolValido = (valor) => ROLES.includes(valor);

module.exports = {
  ROLES,
  MAX_NOMBRE,
  MENSAJE_CONTRASENA,
  normalizarEmail,
  esContrasenaRobusta,
  normalizarNombre,
  esRolValido,
};
