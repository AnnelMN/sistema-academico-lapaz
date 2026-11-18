// Validación de la configuración al arrancar (control G de la Skill de seguridad).
// En PRODUCCIÓN (NODE_ENV=production) el servidor NO arranca si falta algo
// importante o si hay una configuración insegura. En desarrollo solo avisa.

const esProduccion = () => process.env.NODE_ENV === 'production';

const ORIGEN_DESARROLLO = 'http://localhost:5173';

function validarEntorno() {
  const errores = [];
  const avisos = [];
  const requerida = (nombre) => { if (!process.env[nombre]) errores.push(`Falta la variable ${nombre}`); };

  requerida('DATABASE_URL');
  requerida('JWT_SECRET');

  const secreto = process.env.JWT_SECRET || '';
  if (secreto && secreto.length < 32) {
    errores.push('JWT_SECRET debe tener al menos 32 caracteres (recomendado 64 o más)');
  } else if (secreto && secreto.length < 64) {
    (esProduccion() ? errores : avisos).push('JWT_SECRET debería tener 64 caracteres o más');
  }

  if (esProduccion()) {
    ['FRONTEND_URL', 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'].forEach(requerida);
    for (const origen of origenesPermitidos()) {
      if (!origen.startsWith('https://')) errores.push(`FRONTEND_URL debe usar https:// en producción (${origen})`);
    }
    if (process.env.SEED_DEMO_DATA === 'true') {
      errores.push('SEED_DEMO_DATA debe ser false en producción');
    }
    if (process.env.IA_HABILITADA === 'true') {
      requerida('IA_SERVICE_URL');
      const url = process.env.IA_SERVICE_URL || '';
      if (url && !url.startsWith('https://')) errores.push('IA_SERVICE_URL debe usar https:// en producción');
    }
  } else if (!process.env.FRONTEND_URL) {
    avisos.push(`FRONTEND_URL no está definida: CORS solo aceptará ${ORIGEN_DESARROLLO}`);
  }

  return { errores, avisos };
}

// Orígenes permitidos por CORS. Nunca '*': si falta FRONTEND_URL, en desarrollo
// se permite solo el frontend local y en producción ninguno.
function origenesPermitidos() {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return esProduccion() ? [] : [ORIGEN_DESARROLLO];
}

// Ejecuta la validación: avisa en consola y, en producción, detiene el proceso si hay errores
function aplicarValidacionEntorno() {
  const { errores, avisos } = validarEntorno();
  avisos.forEach((a) => console.warn(`⚠️  Configuración: ${a}`));
  if (errores.length) {
    errores.forEach((e) => console.error(`❌ Configuración: ${e}`));
    if (esProduccion()) {
      console.error('El servidor no se inicia en producción con una configuración insegura o incompleta.');
      process.exit(1);
    }
  }
}

module.exports = { esProduccion, validarEntorno, origenesPermitidos, aplicarValidacionEntorno };
