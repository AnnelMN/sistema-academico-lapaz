// Pruebas del cálculo de notas (escala de la UE La Paz "A").
// Ejecutar: npm test   (desde backend/)
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  dividirRedondeando, valorAsistencia, puntajeDimension, notaAnual, calcularNotaEstudiante,
} = require('../src/services/calificacionService');

const casilla = (id, dimension, esAsistencia = false) => ({ id, dimension, esAsistencia });

test('redondeo: 0,5 o más sube, menos de 0,5 baja', () => {
  assert.equal(dividirRedondeando(75, 10), 8);   // 7,5 → 8
  assert.equal(dividirRedondeando(74, 10), 7);   // 7,4 → 7
  assert.equal(dividirRedondeando(78, 10), 8);   // 7,8 → 8
  assert.equal(dividirRedondeando(335, 10), 34); // 33,5 → 34
  assert.equal(dividirRedondeando(0, 7), 0);
});

test('casilla de asistencia: Presente + Justificado sobre los registros', () => {
  assert.equal(valorAsistencia({ presentes: 22, justificados: 0, total: 22 }), 100);
  assert.equal(valorAsistencia({ presentes: 11, justificados: 0, total: 22 }), 50);
  assert.equal(valorAsistencia({ presentes: 9, justificados: 2, total: 22 }), 50);  // justificado cuenta
  assert.equal(valorAsistencia({ presentes: 13, justificados: 0, total: 22 }), 59); // 59,09 → 59
  assert.equal(valorAsistencia({ total: 0 }), null);                                // sin clases: vacía
});

test('ejemplo de AGENTS.md: HACER con 12 casillas que suman 960 → 32 de 40', () => {
  const valores = [80, 90, 70, 100, 60, 85, 75, 90, 95, 70, 80, 65];
  assert.equal(valores.reduce((s, v) => s + v, 0), 960);
  assert.equal(puntajeDimension(valores, 40), 32);
});

test('ejemplo de AGENTS.md: SER con 4 casillas + asistencia 50 → 7,8 → 8 de 10', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s1', 'SER'), casilla('s2', 'SER'), casilla('s3', 'SER'), casilla('s4', 'SER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['s1', 90], ['s2', 80], ['s3', 100], ['s4', 70]]),
    casillasCalificadas: new Set(['s1', 's2', 's3', 's4']),
    asistencia: { presentes: 11, justificados: 0, total: 22 },
    autoevaluacion: null,
  });
  assert.equal(r.asistencia, 50);
  assert.equal(r.ser, 8);
});

test('total = dimensiones ya redondeadas + autoevaluación; aprueba con 51', () => {
  // SER 7,6 → 8 | SABER 33,6 → 34 | HACER 28,4 → 28 | AUTO 4 → 74
  const casillas = [casilla('ser', 'SER'), casilla('saber', 'SABER'), casilla('hacer', 'HACER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['ser', 76], ['saber', 74.67], ['hacer', 71]]),
    casillasCalificadas: new Set(['ser', 'saber', 'hacer']),
    asistencia: null,
    autoevaluacion: 4,
  });
  assert.equal(r.ser, 8);    // 76 × 10 / 100 = 7,6
  assert.equal(r.hacer, 28); // 71 × 40 / 100 = 28,4
  assert.equal(r.total, r.ser + r.saber + r.hacer + 4);
  assert.equal(r.aprobado, r.total >= 51);
});

test('aprobado con 51, reprobado con 50', () => {
  const casillas = [casilla('h', 'HACER'), casilla('s', 'SABER')];
  const base = { casillas, casillasCalificadas: new Set(['h', 's']), asistencia: null };
  // SABER 100 → 45 ; HACER 15 → 6 ; total 51
  const aprobado = calcularNotaEstudiante({ ...base, valoresEstudiante: new Map([['s', 100], ['h', 15]]), autoevaluacion: null });
  assert.equal(aprobado.total, 51);
  assert.equal(aprobado.aprobado, true);
  // SABER 100 → 45 ; HACER 12 → 4,8 → 5 ; total 50
  const reprobado = calcularNotaEstudiante({ ...base, valoresEstudiante: new Map([['s', 100], ['h', 12]]), autoevaluacion: null });
  assert.equal(reprobado.total, 50);
  assert.equal(reprobado.aprobado, false);
});

test('casilla sin nota para NINGÚN estudiante no cuenta', () => {
  const casillas = [casilla('t1', 'SABER'), casilla('t2', 'SABER'), casilla('vacia', 'SABER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['t1', 80], ['t2', 60]]),
    casillasCalificadas: new Set(['t1', 't2']), // 'vacia' nadie la tiene
    asistencia: null,
    autoevaluacion: null,
  });
  assert.equal(r.casillasContadas.SABER, 2);
  assert.equal(r.saber, 32); // (80+60)/2 = 70 → 70 × 45 / 100 = 31,5 → 32
});

test('casilla calificada para otros pero no para este estudiante cuenta como 0', () => {
  const casillas = [casilla('t1', 'SABER'), casilla('t2', 'SABER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['t1', 80]]), // no entregó t2
    casillasCalificadas: new Set(['t1', 't2']),
    asistencia: null,
    autoevaluacion: null,
  });
  assert.equal(r.casillasContadas.SABER, 2);
  assert.equal(r.saber, 18); // (80+0)/2 = 40 → 40 × 45 / 100 = 18
});

test('sin registros de asistencia, la casilla de asistencia no cuenta', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s1', 'SER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['s1', 90]]),
    casillasCalificadas: new Set(['s1']),
    asistencia: { total: 0 },
    autoevaluacion: null,
  });
  assert.equal(r.casillasContadas.SER, 1);
  assert.equal(r.ser, 9);
});

test('notas perfectas dan 100 y nunca más', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s', 'SER'), casilla('b', 'SABER'), casilla('h', 'HACER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['s', 100], ['b', 100], ['h', 100]]),
    casillasCalificadas: new Set(['s', 'b', 'h']),
    asistencia: { presentes: 20, justificados: 2, total: 22 },
    autoevaluacion: 5,
  });
  assert.deepEqual([r.ser, r.saber, r.hacer, r.autoevaluacion, r.total], [10, 45, 40, 5, 100]);
});

test('nota anual = promedio de los 3 trimestres redondeado', () => {
  assert.equal(notaAnual([70, 75, 80]), 75);
  assert.equal(notaAnual([70, 71, 71]), 71); // 70,67 → 71
  assert.equal(notaAnual([50, 51, 51]), 51); // 50,67 → 51
  assert.equal(notaAnual([]), null);
});
