const crypto = require('crypto');

// ════════════════════════════════════════════════════════════════════
// Cifrado de los secretos 2FA en la base de datos (hallazgo LB-08).
// AES-256-GCM con la clave TOTP_ENC_KEY (64 caracteres hexadecimales = 32 bytes).
// Formato guardado: v1:<iv>:<etiqueta>:<texto cifrado>  (base64url)
//
// Lee también valores antiguos en texto plano (antes de la migración), así el
// sistema sigue funcionando mientras se cifran los existentes.
//
// ⚠️ Si se pierde TOTP_ENC_KEY, los secretos no se pueden recuperar y todos los
//    usuarios deberán volver a escanear su código QR. Guárdala en un lugar seguro
//    y usa la MISMA en todos los entornos que compartan la base de datos.
// ════════════════════════════════════════════════════════════════════

const PREFIJO = 'v1:';
const CONTEXTO = Buffer.from('usuarios.twoFactorSecret');

function obtenerClave() {
  const hex = process.env.TOTP_ENC_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return Buffer.from(hex, 'hex');
}

const estaCifrado = (valor) => typeof valor === 'string' && valor.startsWith(PREFIJO);

function cifrar(texto) {
  if (texto === null || texto === undefined) return texto;
  const clave = obtenerClave();
  if (!clave) {
    // Sin clave no se guardan secretos nuevos (en producción la validación de
    // arranque ya exige TOTP_ENC_KEY)
    throw new Error('TOTP_ENC_KEY no está configurada: no se puede guardar el secreto 2FA');
  }
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
  cifrador.setAAD(CONTEXTO);
  const datos = Buffer.concat([cifrador.update(String(texto), 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return `${PREFIJO}${iv.toString('base64url')}:${etiqueta.toString('base64url')}:${datos.toString('base64url')}`;
}

function descifrar(valor) {
  if (valor === null || valor === undefined) return valor;
  if (!estaCifrado(valor)) return valor; // valor antiguo en texto plano
  const clave = obtenerClave();
  if (!clave) throw new Error('TOTP_ENC_KEY no está configurada: no se puede leer el secreto 2FA');
  const [, ivB64, etiquetaB64, datosB64] = valor.split(':');
  const descifrador = crypto.createDecipheriv('aes-256-gcm', clave, Buffer.from(ivB64, 'base64url'));
  descifrador.setAAD(CONTEXTO);
  descifrador.setAuthTag(Buffer.from(etiquetaB64, 'base64url'));
  return Buffer.concat([descifrador.update(Buffer.from(datosB64, 'base64url')), descifrador.final()]).toString('utf8');
}

module.exports = { cifrar, descifrar, estaCifrado, obtenerClave };
