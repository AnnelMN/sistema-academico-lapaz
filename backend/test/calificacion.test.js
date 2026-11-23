// Pruebas del cálculo de notas (escala de la UE La Paz "A").
// Ejecutar: npm test   (desde backend/)
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  dividirRedondeando, valorAsistencia, puntajeDimension, notaAnual, calcularNotaEstudiante, MAX_CASILLA,
} = require('../src/services/calificacionService');

const casilla = (id, dimension, esAsistencia = false) => ({ id, dimension, esAsistencia });

test('redondeo: 0,5 o más sube, menos de 0,5 baja', () => {
  assert.equal(dividirRedondeando(75, 10), 8);   // 7,5 → 8
  assert.equal(dividirRedondeando(74, 10), 7);   // 7,4 → 7
  assert.equal(dividirRedondeando(78, 10), 8);   // 7,8 → 8
  assert.equal(dividirRedondeando(335, 10), 34); // 33,5 → 34
  assert.equal(dividirRedondeando(0, 7), 0);
});

test('cada casilla se califica sobre los puntos de su dimensión', () => {
  assert.deepEqual({ ...MAX_CASILLA }, { SER: 10, SABER: 45, HACER: 40 });
});

test('casilla de asistencia: Presente + Justificado sobre los registros, sobre 10', () => {
  assert.equal(valorAsistencia({ presentes: 22, justificados: 0, total: 22 }), 10);
  assert.equal(valorAsistencia({ presentes: 11, justificados: 0, total: 22 }), 5);
  assert.equal(valorAsistencia({ presentes: 9, justificados: 2, total: 22 }), 5);   // justificado cuenta
  assert.equal(valorAsistencia({ presentes: 17, justificados: 0, total: 22 }), 8);  // 7,73 → 8
  assert.equal(valorAsistencia({ presentes: 16, justificados: 0, total: 22 }), 7);  // 7,27 → 7
  assert.equal(valorAsistencia({ total: 0 }), null);                                // sin clases: vacía
});

test('HACER con 12 casillas sobre 40 que suman 384 → promedio 32 de 40', () => {
  const valores = [32, 36, 28, 40, 24, 34, 30, 36, 38, 28, 32, 26];
  assert.equal(valores.reduce((s, v) => s + v, 0), 384);
  assert.equal(puntajeDimension(valores), 32);
});

test('SABER sobre 45: el promedio se redondea (0,5 sube)', () => {
  assert.equal(puntajeDimension([40, 35]), 38);     // 37,5 → 38
  assert.equal(puntajeDimension([40, 35, 36]), 37); // 37,0
  assert.equal(puntajeDimension([45, 44, 44]), 44); // 44,33 → 44
  assert.equal(puntajeDimension([]), 0);
});

test('ejemplo de AGENTS.md: SER 9, 8, 10, 7 + asistencia 5 → 7,8 → 8 de 10', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s1', 'SER'), casilla('s2', 'SER'), casilla('s3', 'SER'), casilla('s4', 'SER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['s1', 9], ['s2', 8], ['s3', 10], ['s4', 7]]),
    asistencia: { presentes: 11, justificados: 0, total: 22 },
    autoevaluacion: null,
  });
  assert.equal(r.asistencia, 5);
  assert.equal(r.ser, 8);
});

test('total = dimensiones ya redondeadas + autoevaluación; aprueba con 51', () => {
  // SER (8+7)/2 = 7,5 → 8 | SABER (34+33)/2 = 33,5 → 34 | HACER (28+29+28)/3 = 28,3 → 28 | AUTO 4 → 74
  const casillas = [
    casilla('ser1', 'SER'), casilla('ser2', 'SER'),
    casilla('sab1', 'SABER'), casilla('sab2', 'SABER'),
    casilla('hac1', 'HACER'), casilla('hac2', 'HACER'), casilla('hac3', 'HACER'),
  ];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['ser1', 8], ['ser2', 7], ['sab1', 34], ['sab2', 33], ['hac1', 28], ['hac2', 29], ['hac3', 28]]),
    asistencia: null,
    autoevaluacion: 4,
  });
  assert.deepEqual([r.ser, r.saber, r.hacer, r.total], [8, 34, 28, 74]);
  assert.equal(r.aprobado, true);
});

test('aprobado con 51, reprobado con 50 (todo completo)', () => {
  const casillas = [casilla('r', 'SER'), casilla('h', 'HACER'), casilla('s', 'SABER')];
  const base = { casillas, asistencia: null };
  // SER 1 ; SABER 45 ; HACER 5 ; AUTO 0 → 51
  const aprobado = calcularNotaEstudiante({ ...base, valoresEstudiante: new Map([['r', 1], ['s', 45], ['h', 5]]), autoevaluacion: 0 });
  assert.equal(aprobado.total, 51);
  assert.equal(aprobado.aprobado, true);
  // SER 0 ; SABER 45 ; HACER 5 ; AUTO 0 → 50
  const reprobado = calcularNotaEstudiante({ ...base, valoresEstudiante: new Map([['r', 0], ['s', 45], ['h', 5]]), autoevaluacion: 0 });
  assert.equal(reprobado.total, 50);
  assert.equal(reprobado.aprobado, false);
});

// ── Regla "Calificación pendiente" (2026-11-23) ─────────────────────
const completo = () => ({
  casillas: [casilla('r', 'SER'), casilla('b', 'SABER'), casilla('h', 'HACER')],
  valoresEstudiante: new Map([['r', 8], ['b', 40], ['h', 32]]),
  asistencia: null,
  autoevaluacion: 4,
});

test('ejemplo de la usuaria: SER asistencia 8, responsabilidad 10, valores 9 → 27/3 = 9 de 10', () => {
  const casillas = [casilla('a', 'SER', true), casilla('resp', 'SER'), casilla('val', 'SER')];
  // 8 de 10 en asistencia = 8 clases asistidas de 10
  const r = calcularNotaEstudiante({
    casillas, valoresEstudiante: new Map([['resp', 10], ['val', 9]]),
    asistencia: { presentes: 8, justificados: 0, total: 10 }, autoevaluacion: null,
  });
  assert.equal(r.asistencia, 8);
  assert.equal(r.ser, 9);
});

test('una casilla vacía deja el componente PENDIENTE (no cuenta como 0)', () => {
  const casillas = [casilla('t1', 'SABER'), casilla('t2', 'SABER')];
  const r = calcularNotaEstudiante({ casillas, valoresEstudiante: new Map([['t1', 36]]), asistencia: null, autoevaluacion: 5 });
  assert.equal(r.saber, null);
  assert.equal(r.casillasVacias.SABER, 1);
  assert.ok(r.pendientes.includes('SABER'));
});

test('un 0 sí cuenta: el componente se calcula', () => {
  const casillas = [casilla('t1', 'SABER'), casilla('t2', 'SABER')];
  const r = calcularNotaEstudiante({ casillas, valoresEstudiante: new Map([['t1', 36], ['t2', 0]]), asistencia: null, autoevaluacion: 5 });
  assert.equal(r.saber, 18); // (36 + 0) / 2
});

test('casilla que nadie calificó también deja pendiente', () => {
  const c = completo();
  c.casillas.push(casilla('nueva', 'HACER'));
  const r = calcularNotaEstudiante(c);
  assert.equal(r.hacer, null);
  assert.equal(r.total, null);
});

test('componente sin casillas queda pendiente', () => {
  const c = completo();
  c.casillas = c.casillas.filter((x) => x.dimension !== 'HACER');
  const r = calcularNotaEstudiante(c);
  assert.equal(r.hacer, null);
  assert.deepEqual(r.pendientes, ['HACER']);
});

test('sin listas de asistencia, la casilla de asistencia no cuenta ni deja pendiente', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s1', 'SER')];
  const r = calcularNotaEstudiante({ casillas, valoresEstudiante: new Map([['s1', 9]]), asistencia: { total: 0 }, autoevaluacion: null });
  assert.equal(r.casillasContadas.SER, 1);
  assert.equal(r.ser, 9);
  assert.ok(!r.pendientes.includes('SER'));
});

test('SER solo con la asistencia (con listas) está completo', () => {
  const r = calcularNotaEstudiante({ casillas: [casilla('a', 'SER', true)], valoresEstudiante: new Map(), asistencia: { presentes: 7, total: 10 }, autoevaluacion: null });
  assert.equal(r.ser, 7);
});

test('autoevaluación vacía: componentes calculados pero nota final pendiente', () => {
  const c = completo();
  c.autoevaluacion = null;
  const r = calcularNotaEstudiante(c);
  assert.deepEqual([r.ser, r.saber, r.hacer], [8, 40, 32]);
  assert.equal(r.total, null);
  assert.equal(r.aprobado, null);
  assert.equal(r.completa, false);
  assert.deepEqual(r.pendientes, ['AUTOEVALUACION']);
});

test('todo completo: nota final sobre 100', () => {
  const r = calcularNotaEstudiante(completo());
  assert.deepEqual([r.ser, r.saber, r.hacer, r.autoevaluacion, r.total], [8, 40, 32, 4, 84]);
  assert.equal(r.completa, true);
  assert.deepEqual(r.pendientes, []);
});

test('notas perfectas dan 100 y nunca más', () => {
  const casillas = [casilla('a', 'SER', true), casilla('s', 'SER'), casilla('b', 'SABER'), casilla('h', 'HACER')];
  const r = calcularNotaEstudiante({
    casillas,
    valoresEstudiante: new Map([['s', 10], ['b', 45], ['h', 40]]),
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
