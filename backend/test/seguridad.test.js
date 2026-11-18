// Pruebas de las validaciones compartidas y del escapado de correos.
// Ejecutar: npm test   (desde backend/). No envía correos reales.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizarEmail, esContrasenaRobusta, normalizarNombre, esRolValido,
} = require('../src/lib/validaciones');

test('email: se normaliza a minúsculas y se rechaza si no tiene formato', () => {
  assert.equal(normalizarEmail('  Ana.Condori@Colegio.EDU.bo '), 'ana.condori@colegio.edu.bo');
  assert.equal(normalizarEmail('sin-arroba'), null);
  assert.equal(normalizarEmail('a@b'), null);
  assert.equal(normalizarEmail(123), null);
  assert.equal(normalizarEmail(`${'a'.repeat(250)}@x.com`), null);
});

test('contraseña: política única (10+, letra y número, máx. 72 bytes)', () => {
  assert.equal(esContrasenaRobusta('Colegio2026'), true);
  assert.equal(esContrasenaRobusta('corta1'), false);
  assert.equal(esContrasenaRobusta('soloLetrasLargas'), false);
  assert.equal(esContrasenaRobusta('1234567890'), false);
  assert.equal(esContrasenaRobusta(`A1${'x'.repeat(71)}`), false); // 73 bytes
  assert.equal(esContrasenaRobusta(undefined), false);
});

test('nombre y rol', () => {
  assert.equal(normalizarNombre('  Luis Vargas  '), 'Luis Vargas');
  assert.equal(normalizarNombre(''), null);
  assert.equal(normalizarNombre('x'.repeat(101)), null);
  assert.equal(esRolValido('PROFESOR'), true);
  assert.equal(esRolValido('PADRE'), false);
  assert.equal(esRolValido('director'), false);
});

test('correos: los datos se escapan en el HTML y el asunto no tiene saltos de línea', async () => {
  // Reemplaza nodemailer por un simulador que captura el correo
  const nodemailer = require('nodemailer');
  const original = nodemailer.createTransport;
  const enviados = [];
  nodemailer.createTransport = () => ({ sendMail: async (opts) => { enviados.push(opts); return { messageId: 'prueba' }; } });
  const logOriginal = console.log;
  const logs = [];
  console.log = (...a) => logs.push(a.join(' '));
  try {
    delete require.cache[require.resolve('../src/services/emailService')];
    const email = require('../src/services/emailService');
    const malicioso = 'Ana <a href="http://phishing.example">clic</a>\r\nBcc: otro@example.com';

    await email.enviarAlertaRiesgo(malicioso, '<script>x</script>', { probabilidad: 0.9 }, 'tutor.ana@example.com');
    await email.enviarAlertaInasistencia(malicioso, 'Física', 6, 5, 'tutor.ana@example.com');
    await email.enviarCodigoVerificacion('tutor.ana@example.com', malicioso, '123456');

    for (const correo of enviados) {
      assert.ok(!correo.html.includes('<a href'), 'no debe haber enlaces inyectados');
      assert.ok(!correo.html.includes('<script>'), 'no debe haber scripts inyectados');
      assert.ok(!/[\r\n]/.test(correo.subject), 'el asunto no debe tener saltos de línea');
    }
    assert.ok(enviados[0].html.includes('&lt;a href='), 'el texto se muestra escapado');
    assert.ok(logs.every((l) => !l.includes('tutor.ana@example.com')), 'el log no debe tener el correo completo');
    assert.ok(logs.some((l) => l.includes('t***@example.com')), 'el log muestra el correo enmascarado');
  } finally {
    nodemailer.createTransport = original;
    console.log = logOriginal;
  }
});
