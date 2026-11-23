const test = require('node:test');
const assert = require('node:assert');
const { normalizarHorario } = require('../src/lib/horario');

test('normalizarHorario: formato oficial Día-HH:MM se mantiene', () => {
  assert.strictEqual(normalizarHorario('Lunes-07:30'), 'Lunes-07:30');
  assert.strictEqual(normalizarHorario('Miércoles-11:30'), 'Miércoles-11:30');
});

test('normalizarHorario: formato antiguo con espacio, sin tilde o minúsculas se unifica', () => {
  assert.strictEqual(normalizarHorario('Lunes 07:30'), 'Lunes-07:30');
  assert.strictEqual(normalizarHorario('miercoles 9:30'), 'Miércoles-09:30');
  assert.strictEqual(normalizarHorario('  VIERNES - 10:30 '), 'Viernes-10:30');
});

test('normalizarHorario: rechaza fin de semana, horas imposibles y textos raros', () => {
  for (const malo of ['Sábado-07:30', 'Domingo 08:00', 'Lunes-25:00', 'Lunes-07:75', 'Lunes', '07:30', '', null, 5, 'Lunes-07:30; DROP']) {
    assert.strictEqual(normalizarHorario(malo), null, String(malo));
  }
});
