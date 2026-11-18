// C-01: los valores de ejemplo de .env.example nunca se aceptan como claves.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { esMarcador, esClaveValida } = require('../src/lib/secretos');

const ejemplo = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const valorEjemplo = (nombre) => (ejemplo.match(new RegExp(`^${nombre}="?([^"\n]*)`, 'm')) || [])[1];

// Ejecuta validarEntorno con variables temporales y restaura el entorno
function validarCon(vars) {
  const copia = { ...process.env };
  Object.assign(process.env, vars);
  try {
    delete require.cache[require.resolve('../src/config/entorno')];
    return require('../src/config/entorno').validarEntorno();
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in copia)) delete process.env[k];
    Object.assign(process.env, copia);
  }
}

test('reconoce los marcadores de .env.example', () => {
  for (const nombre of ['JWT_SECRET', 'IA_API_KEY', 'QR_SECRET', 'TOTP_ENC_KEY']) {
    assert.ok(esMarcador(valorEjemplo(nombre)), `${nombre} de ejemplo debe reconocerse`);
    assert.equal(esClaveValida(valorEjemplo(nombre)), false);
  }
  assert.equal(esClaveValida(crypto.randomBytes(32).toString('hex')), true);
  assert.equal(esClaveValida('corta'), false);
});

test('en producción, QR_SECRET e IA_API_KEY de ejemplo detienen el arranque', () => {
  const r = validarCon({
    NODE_ENV: 'production', IA_HABILITADA: 'true', IA_SERVICE_URL: 'https://ia.example.com',
    QR_SECRET: valorEjemplo('QR_SECRET'), IA_API_KEY: valorEjemplo('IA_API_KEY'),
  });
  assert.ok(r.errores.some((e) => e.includes('QR_SECRET')), 'QR_SECRET de ejemplo debe ser error');
  assert.ok(r.errores.some((e) => e.includes('IA_API_KEY')), 'IA_API_KEY de ejemplo debe ser error');
});

test('en producción, una QR_SECRET de 32 caracteres no basta (se exigen 64)', () => {
  const r = validarCon({ NODE_ENV: 'production', QR_SECRET: crypto.randomBytes(16).toString('hex') });
  assert.ok(r.errores.some((e) => e.includes('QR_SECRET')));
});

test('el servicio QR queda desactivado con la clave de ejemplo (falla cerrada)', () => {
  const original = process.env.QR_SECRET;
  process.env.QR_SECRET = valorEjemplo('QR_SECRET');
  try {
    const qr = require('../src/services/qrAsistenciaService');
    assert.equal(qr.qrConfigurado(), false);
    assert.throws(() => qr.generarContenido('cualquiera'));
  } finally {
    if (original === undefined) delete process.env.QR_SECRET; else process.env.QR_SECRET = original;
  }
});
