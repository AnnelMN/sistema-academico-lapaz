// Pruebas del cifrado de secretos 2FA (AES-256-GCM). Usa una clave de prueba.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const CLAVE_PRUEBA = crypto.randomBytes(32).toString('hex');

const conClave = (clave, fn) => {
  const original = process.env.TOTP_ENC_KEY;
  if (clave === undefined) delete process.env.TOTP_ENC_KEY; else process.env.TOTP_ENC_KEY = clave;
  try { return fn(); } finally {
    if (original === undefined) delete process.env.TOTP_ENC_KEY; else process.env.TOTP_ENC_KEY = original;
  }
};

const { cifrar, descifrar, estaCifrado } = require('../src/lib/cifrado');
const SECRETO = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

test('cifra y descifra el mismo secreto', () => conClave(CLAVE_PRUEBA, () => {
  const c = cifrar(SECRETO);
  assert.ok(estaCifrado(c));
  assert.ok(!c.includes(SECRETO), 'el valor guardado no contiene el secreto');
  assert.equal(descifrar(c), SECRETO);
}));

test('cada cifrado es distinto (IV aleatorio)', () => conClave(CLAVE_PRUEBA, () => {
  assert.notEqual(cifrar(SECRETO), cifrar(SECRETO));
}));

test('lee secretos antiguos en texto plano (transición)', () => conClave(CLAVE_PRUEBA, () => {
  assert.equal(descifrar(SECRETO), SECRETO);
  assert.equal(descifrar(null), null);
}));

test('con otra clave no se puede descifrar', () => {
  const c = conClave(CLAVE_PRUEBA, () => cifrar(SECRETO));
  conClave(crypto.randomBytes(32).toString('hex'), () => assert.throws(() => descifrar(c)));
});

test('un valor alterado se detecta (integridad GCM)', () => conClave(CLAVE_PRUEBA, () => {
  const c = cifrar(SECRETO);
  const partes = c.split(':');
  const datos = Buffer.from(partes[3], 'base64url');
  datos[0] ^= 1;
  partes[3] = datos.toString('base64url');
  assert.throws(() => descifrar(partes.join(':')));
}));

test('sin clave no guarda secretos nuevos', () => conClave(undefined, () => {
  assert.throws(() => cifrar(SECRETO), /TOTP_ENC_KEY/);
}));
