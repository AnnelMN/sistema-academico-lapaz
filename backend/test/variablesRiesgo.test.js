// Variables del modelo de riesgo y contrato con el microservicio de IA (sin base de datos).
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { resumirVariables } = require('../src/services/variablesRiesgoService');

const asis = (p, j, a) => [
  ...Array(p).fill({ estado: 'PRESENTE' }), ...Array(j).fill({ estado: 'JUSTIFICADO' }), ...Array(a).fill({ estado: 'AUSENTE' }),
];

test('promedio y áreas reprobadas con la nota ACUMULADA de cada materia (como el centralizador)', () => {
  const v = resumirVariables({
    nivel: 4, trimestre: 2,
    notasPorMateria: {
      mate: [40, 55],   // acumulada 47,5 → 48 → reprobada
      fisica: [50, 51], // 50,5 → 51 → aprobada (0,5 sube)
      lengua: [80, 90], // 85
      musica: [],       // sin notas todavía: no cuenta
    },
    asistencias: asis(18, 2, 5),
  });
  assert.equal(v.promedio_notas, 61);            // (47,5 + 50,5 + 85) / 3
  assert.equal(v.areas_reprobadas, 1);
  assert.equal(v.porcentaje_asistencia, 80);     // (18 + 2 justificados) / 25
  assert.equal(v.materias_con_nota, 3);
  assert.deepEqual([v.nivel, v.trimestre], [4, 2]);
});

test('JUSTIFICADO cuenta como asistencia y AUSENTE resta', () => {
  assert.equal(resumirVariables({ nivel: 1, trimestre: 1, notasPorMateria: { a: [70] }, asistencias: asis(0, 10, 0) }).porcentaje_asistencia, 100);
  assert.equal(resumirVariables({ nivel: 1, trimestre: 1, notasPorMateria: { a: [70] }, asistencias: asis(0, 0, 4) }).porcentaje_asistencia, 0);
});

test('sin notas no se predice; sin asistencia registrada se asume 100 %', () => {
  assert.equal(resumirVariables({ nivel: 3, trimestre: 1, notasPorMateria: { a: [], b: [] }, asistencias: [] }), null);
  assert.equal(resumirVariables({ nivel: 3, trimestre: 1, notasPorMateria: { a: [60] }, asistencias: [] }).porcentaje_asistencia, 100);
});

test('los valores siempre quedan dentro de los rangos que acepta el microservicio', () => {
  const muchas = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m${i}`, [10]]));
  const v = resumirVariables({ nivel: 9, trimestre: 7, notasPorMateria: muchas, asistencias: [] });
  assert.equal(v.areas_reprobadas, 13);
  assert.equal(v.nivel, 6);
  assert.equal(v.trimestre, 3);
});

test('predecirRiesgo envía EXACTAMENTE las 5 variables del modelo, con la clave', async () => {
  const anterior = { ...process.env };
  const fetchOriginal = global.fetch;
  process.env.IA_HABILITADA = 'true';
  process.env.IA_SERVICE_URL = 'http://ia.local';
  process.env.IA_API_KEY = crypto.randomBytes(32).toString('hex');
  let enviado;
  global.fetch = async (url, opciones) => {
    enviado = { url, opciones, cuerpo: JSON.parse(opciones.body) };
    return { ok: true, json: async () => ({ nivel_riesgo: 'RIESGO_MEDIO', probabilidad: 0.6 }) };
  };
  try {
    delete require.cache[require.resolve('../src/services/iaService')];
    const ia = require('../src/services/iaService');
    const variables = { promedio_notas: 61, porcentaje_asistencia: 80, areas_reprobadas: 1, nivel: 4, trimestre: 2,
      materias_con_nota: 3, clases_registradas: 25 };
    const r = await ia.predecirRiesgo(variables);
    assert.deepEqual(r, { nivel_riesgo: 'RIESGO_MEDIO', probabilidad: 0.6 });
    assert.equal(enviado.url, 'http://ia.local/predecir');
    assert.deepEqual(Object.keys(enviado.cuerpo), ia.VARIABLES_MODELO);   // sin campos informativos ni antiguos
    assert.equal(enviado.opciones.headers['X-API-Key'], process.env.IA_API_KEY);
    await assert.rejects(ia.predecirRiesgo({ promedio_notas: 61 }), /incompletas/);
  } finally {
    global.fetch = fetchOriginal;
    for (const k of Object.keys(process.env)) if (!(k in anterior)) delete process.env[k];
    Object.assign(process.env, anterior);
  }
});

test('con la IA pausada no se llama al microservicio', async () => {
  const anterior = process.env.IA_HABILITADA;
  process.env.IA_HABILITADA = 'false';
  const fetchOriginal = global.fetch;
  global.fetch = async () => { throw new Error('no debía llamarse'); };
  try {
    delete require.cache[require.resolve('../src/services/iaService')];
    assert.equal(await require('../src/services/iaService').predecirRiesgo({}), null);
  } finally {
    global.fetch = fetchOriginal;
    if (anterior === undefined) delete process.env.IA_HABILITADA; else process.env.IA_HABILITADA = anterior;
  }
});
