// Pruebas del QR dinámico de asistencia (sin base de datos).
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.QR_SECRET = crypto.randomBytes(32).toString('hex'); // clave solo para la prueba
const qr = require('../src/services/qrAsistenciaService');

const A = 'estudiante-a';
const B = 'estudiante-b';
const T0 = Date.UTC(2026, 10, 18, 14, 0, 5); // un instante fijo

test('el QR identifica al estudiante correcto y no contiene datos personales', () => {
  const { contenido, segundosRestantes } = qr.generarContenido(A, T0);
  assert.ok(contenido.startsWith(qr.PREFIJO));
  assert.ok(!contenido.includes(A), 'no debe incluir el id del estudiante');
  assert.ok(qr.esFormatoValido(contenido));
  assert.ok(segundosRestantes > 0 && segundosRestantes <= 30);
  assert.equal(qr.identificar(contenido, [B, A], T0), A);
});

test('dos estudiantes nunca reciben el mismo código', () => {
  const ids = Array.from({ length: 500 }, (_, i) => `est-${i}`);
  const codigos = new Set(ids.map((id) => qr.generarContenido(id, T0).contenido));
  assert.equal(codigos.size, ids.length);
});

test('el código cambia cada 30 s y vence después de la ventana anterior', () => {
  const { contenido } = qr.generarContenido(A, T0);
  assert.notEqual(qr.generarContenido(A, T0 + qr.VENTANA_MS).contenido, contenido);
  assert.equal(qr.identificar(contenido, [A], T0 + qr.VENTANA_MS), A, 'sigue valiendo en la ventana siguiente');
  assert.equal(qr.identificar(contenido, [A], T0 + 2 * qr.VENTANA_MS), null, 'una captura vieja ya no sirve');
  assert.equal(qr.identificar(contenido, [A], T0 - qr.VENTANA_MS), null, 'no vale antes de tiempo');
});

test('rechaza códigos inválidos, alterados o de estudiantes fuera de la lista', () => {
  const { contenido } = qr.generarContenido(A, T0);
  const ultimo = contenido.at(-1) === 'A' ? 'B' : 'A';
  for (const malo of [
    '', 'hola', null, 123, { a: 1 }, A,
    contenido.slice(0, -1) + ultimo,            // alterado
    contenido + 'x',                             // largo incorrecto
    'otro-prefijo:' + contenido.slice(qr.PREFIJO.length),
  ]) {
    assert.equal(qr.identificar(malo, [A, B], T0), null, `debe rechazar ${String(malo).slice(0, 30)}`);
  }
  assert.equal(qr.identificar(contenido, [B], T0), null, 'estudiante no está entre los candidatos');
});

test('con otra clave del servidor el código no es válido (no se puede fabricar)', () => {
  const { contenido } = qr.generarContenido(A, T0);
  const original = process.env.QR_SECRET;
  process.env.QR_SECRET = crypto.randomBytes(32).toString('hex');
  try {
    assert.equal(qr.identificar(contenido, [A], T0), null);
  } finally {
    process.env.QR_SECRET = original;
  }
});

test('sin QR_SECRET el registro por QR queda desactivado', () => {
  const original = process.env.QR_SECRET;
  delete process.env.QR_SECRET;
  try {
    assert.equal(qr.qrConfigurado(), false);
    assert.throws(() => qr.generarContenido(A, T0));
    assert.equal(qr.identificar('UELPA-QR1:' + 'a'.repeat(22), [A], T0), null);
  } finally {
    process.env.QR_SECRET = original;
  }
});

test('registrarPresente crea PRESENTE + auditoría y nunca modifica un registro existente', async () => {
  const llamadas = [];
  const tablaAsistencia = new Map();
  const tx = {
    asistencia: {
      findUnique: async ({ where }) => tablaAsistencia.get(JSON.stringify(where)) || null,
      create: async ({ data }) => { llamadas.push(['create', data]); },
      update: async () => { throw new Error('no debe modificar'); },
      upsert: async () => { throw new Error('no debe modificar'); },
    },
    auditoriaCambio: { createMany: async ({ data }) => { llamadas.push(['auditoria', data]); } },
  };
  const datos = {
    estudianteId: A, materiaProgramadaId: 'mp-1', fecha: '2026-11-18',
    fechaDate: new Date('2026-11-18T12:00:00.000Z'), usuarioId: 'docente-1',
  };

  const nuevo = await qr.registrarPresente(tx, datos);
  assert.deepEqual(nuevo, { creado: true, estado: 'PRESENTE' });
  assert.equal(llamadas[0][1].estado, 'PRESENTE');
  assert.equal(llamadas[1][1][0].valorNuevo.origen, 'QR');
  assert.equal(llamadas[1][1][0].usuarioId, 'docente-1');

  // Si ya tenía un registro (p. ej. JUSTIFICADO), se respeta tal cual
  for (const estado of ['PRESENTE', 'AUSENTE', 'JUSTIFICADO']) {
    llamadas.length = 0;
    tablaAsistencia.set(JSON.stringify({
      estudianteId_materiaProgramadaId_fecha: { estudianteId: A, materiaProgramadaId: 'mp-1', fecha: datos.fechaDate },
    }), { estado });
    const repetido = await qr.registrarPresente(tx, datos);
    assert.deepEqual(repetido, { creado: false, estado });
    assert.equal(llamadas.length, 0, 'no escribe nada si ya existe');
  }
});
