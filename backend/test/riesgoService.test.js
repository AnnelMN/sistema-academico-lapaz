// Servicio de riesgo con base de datos, IA y correo simulados:
//   R-01 un solo correo de Riesgo Alto por trimestre
//   R-02 predicciones en segundo plano (el docente no espera)
//   R-05 una fila por cambio de nivel + consulta de la última predicción por estudiante
//   R-06 cola única con límite de simultaneidad, sin duplicados y con pausa si la IA falla
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ruta = (m) => require.resolve(path.join(__dirname, '..', 'src', m));
const simular = (modulo, exportaciones) => {
  require.cache[ruta(modulo)] = { id: ruta(modulo), filename: ruta(modulo), loaded: true, exports: exportaciones };
};

// ── Dobles de prueba ─────────────────────────────────────────────────────
const bd = { notificaciones: [], predicciones: [] };
const correos = [];
const ia = { desde: null, habilitada: true, respuesta: { nivel_riesgo: 'RIESGO_ALTO', probabilidad: 0.9 },
  demoraMs: 0, falla: false, llamadas: 0, enCurso: 0, maxEnCurso: 0 };
let idSecuencia = 0;
let reloj = Date.parse('2026-11-21T12:00:00Z');

simular('lib/prisma', {
  prediccionRiesgo: {
    create: async ({ data }) => { bd.predicciones.push({ id: `p${++idSecuencia}`, ...data, generadoEn: new Date(reloj++) }); },
    update: async ({ where, data }) => { Object.assign(bd.predicciones.find((p) => p.id === where.id), data, { generadoEn: new Date(reloj++) }); },
    findFirst: async ({ where }) => bd.predicciones
      .filter((p) => p.estudianteId === where.estudianteId && p.trimestre === where.trimestre)
      .sort((a, b) => b.generadoEn - a.generadoEn)[0] || null,
    groupBy: async () => {
      const max = new Map();
      for (const p of bd.predicciones) if (!max.has(p.estudianteId) || p.generadoEn > max.get(p.estudianteId)) max.set(p.estudianteId, p.generadoEn);
      return [...max].map(([estudianteId, generadoEn]) => ({ estudianteId, _max: { generadoEn } }));
    },
    findMany: async ({ where }) => bd.predicciones
      .filter((p) => where.OR.some((c) => c.estudianteId === p.estudianteId && +c.generadoEn === +p.generadoEn))
      .map(({ id, estudianteId }) => ({ id, estudianteId })),
  },
  notificacion: {
    findFirst: async ({ where }) => bd.notificaciones.find((n) => n.estudianteId === where.estudianteId
      && n.tipo === where.tipo && n.estadoEnvio === where.estadoEnvio
      && (!where.enviadoEn?.gte || n.enviadoEn >= where.enviadoEn.gte)
      && (!where.enviadoEn?.lte || n.enviadoEn <= where.enviadoEn.lte)) || null,
    create: async ({ data }) => { bd.notificaciones.push({ ...data, enviadoEn: data.enviadoEn || new Date('2026-10-15T12:00:00Z') }); },
  },
  estudiante: { findUnique: async () => ({ emailTutor: 'tutor@example.com', usuario: { nombre: 'Estudiante ficticio' } }) },
  materiaProgramada: { findUnique: async () => ({ materia: { nombre: 'Matemática' } }) },
});
simular('services/iaService', {
  iaHabilitada: () => ia.habilitada,
  prediccionesDesde: () => ia.desde,
  filtroModeloVigente: () => ({}),
  predecirRiesgo: async () => {
    ia.llamadas += 1;
    ia.enCurso += 1;
    ia.maxEnCurso = Math.max(ia.maxEnCurso, ia.enCurso);
    try {
      if (ia.demoraMs) await new Promise((r) => setTimeout(r, ia.demoraMs));
      if (ia.falla) throw new Error('microservicio caído');
      return ia.respuesta;
    } finally {
      ia.enCurso -= 1;
    }
  },
});
simular('services/emailService', { enviarAlertaRiesgo: async (...a) => { correos.push(a); } });
simular('services/variablesRiesgoService', {
  calcularVariablesRiesgo: async () => ({ promedio_notas: 45, porcentaje_asistencia: 70, areas_reprobadas: 4,
    nivel: 3, trimestre: 3, gestion: 2026 }),
});
simular('services/periodoService', {
  rangoDeTrimestre: async (gestion, t) => (t === 3
    ? { inicio: new Date('2026-09-01T00:00:00Z'), fin: new Date('2026-12-02T23:59:59Z') }
    : { inicio: new Date('2026-05-12T00:00:00Z'), fin: new Date('2026-08-29T23:59:59Z') }),
});

const { evaluarRiesgo, evaluarRiesgoEnSegundoPlano, _reiniciarCola } = require('../src/services/riesgoService');
const { idsUltimasPredicciones } = require('../src/services/prediccionesService');

const reiniciar = () => {
  bd.notificaciones.length = 0; bd.predicciones.length = 0; correos.length = 0;
  Object.assign(ia, { desde: null, habilitada: true, respuesta: { nivel_riesgo: 'RIESGO_ALTO', probabilidad: 0.9 },
    demoraMs: 0, falla: false, llamadas: 0, enCurso: 0, maxEnCurso: 0 });
  _reiniciarCola();
};
const base = { materiaProgramadaId: 'mp-1', trimestre: 3 };

// ── R-01 ─────────────────────────────────────────────────────────────────
test('R-01: varias predicciones de Riesgo Alto en el mismo trimestre → un solo correo', async () => {
  reiniciar();
  for (let i = 0; i < 5; i++) await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(correos.length, 1, 'solo un correo al tutor');
  assert.equal(bd.notificaciones.filter((n) => n.estadoEnvio === 'ENVIADO').length, 1);
});

test('R-01: un aviso de OTRO trimestre no impide avisar en el actual', async () => {
  reiniciar();
  bd.notificaciones.push({ estudianteId: 'e-1', tipo: 'RIESGO_ALTO', estadoEnvio: 'ENVIADO', enviadoEn: new Date('2026-06-10T12:00:00Z') });
  await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(correos.length, 1);
});

test('R-01: un envío FALLIDO no cuenta como aviso (se reintenta la próxima vez)', async () => {
  reiniciar();
  bd.notificaciones.push({ estudianteId: 'e-1', tipo: 'RIESGO_ALTO', estadoEnvio: 'FALLIDO', enviadoEn: new Date('2026-10-01T12:00:00Z') });
  await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(correos.length, 1);
});

test('R-01: otros estudiantes sí reciben su propio aviso', async () => {
  reiniciar();
  await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  await evaluarRiesgo({ ...base, estudianteId: 'e-2' });
  assert.equal(correos.length, 2);
});

test('IA_MODELO_DESDE: un aviso del modelo ANTIGUO (antes de la fecha) no bloquea la alerta nueva', async () => {
  reiniciar();
  ia.desde = new Date('2026-11-21T00:00:00Z');
  bd.notificaciones.push({ estudianteId: 'e-1', tipo: 'RIESGO_ALTO', estadoEnvio: 'ENVIADO', enviadoEn: new Date('2026-10-01T12:00:00Z') });
  await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(correos.length, 1, 'el aviso de octubre era del modelo antiguo');
});

test('IA_MODELO_DESDE: un aviso del modelo vigente sí cuenta', async () => {
  reiniciar();
  ia.desde = new Date('2026-09-15T00:00:00Z');
  bd.notificaciones.push({ estudianteId: 'e-1', tipo: 'RIESGO_ALTO', estadoEnvio: 'ENVIADO', enviadoEn: new Date('2026-10-01T12:00:00Z') });
  await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(correos.length, 0);
});

// ── R-05 ─────────────────────────────────────────────────────────────────
test('R-05: mismo nivel de riesgo → se actualiza la fila (no se acumulan filas)', async () => {
  reiniciar();
  for (let i = 0; i < 10; i++) {
    ia.respuesta = { nivel_riesgo: 'RIESGO_MEDIO', probabilidad: 0.5 + i / 100 };
    await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  }
  assert.equal(bd.predicciones.length, 1, '10 predicciones iguales → 1 fila');
  assert.equal(bd.predicciones[0].probabilidad, 0.59, 'con los datos más recientes');
});

test('R-05: cambio de nivel → nueva fila (el historial guarda los cambios)', async () => {
  reiniciar();
  for (const nivel of ['SIN_RIESGO', 'SIN_RIESGO', 'RIESGO_MEDIO', 'RIESGO_MEDIO', 'RIESGO_ALTO']) {
    ia.respuesta = { nivel_riesgo: nivel, probabilidad: 0.7 };
    await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  }
  assert.deepEqual(bd.predicciones.map((p) => p.nivelRiesgo), ['SIN_RIESGO', 'RIESGO_MEDIO', 'RIESGO_ALTO']);
});

test('R-05: idsUltimasPredicciones devuelve UNA predicción (la última) por estudiante', async () => {
  reiniciar();
  for (const [est, nivel] of [['e-1', 'SIN_RIESGO'], ['e-1', 'RIESGO_ALTO'], ['e-2', 'RIESGO_MEDIO']]) {
    ia.respuesta = { nivel_riesgo: nivel, probabilidad: 0.7 };
    await evaluarRiesgo({ ...base, estudianteId: est });
  }
  const ids = await idsUltimasPredicciones();
  const elegidas = bd.predicciones.filter((p) => ids.includes(p.id));
  assert.equal(ids.length, 2);
  assert.equal(elegidas.find((p) => p.estudianteId === 'e-1').nivelRiesgo, 'RIESGO_ALTO');
});

// ── R-02 y R-06 ──────────────────────────────────────────────────────────
test('R-02: la función vuelve de inmediato aunque la IA tarde (el docente no espera)', async () => {
  reiniciar();
  ia.demoraMs = 300;
  const ids = Array.from({ length: 12 }, (_, i) => `e-${i}`);
  const inicio = Date.now();
  const tanda = evaluarRiesgoEnSegundoPlano(ids, { ...base, origen: 'notas' });
  assert.ok(Date.now() - inicio < 50, 'no bloquea la respuesta');
  assert.equal(ia.llamadas, 0, 'todavía no empezó: se ejecuta después de responder');
  await tanda;
  assert.equal(ia.llamadas, 12);
  assert.ok(Date.now() - inicio < 12 * 300, 'se procesan varias a la vez');
});

test('R-06: varias solicitudes al mismo tiempo nunca superan 4 predicciones simultáneas', async () => {
  reiniciar();
  ia.demoraMs = 50;
  const lotes = Array.from({ length: 5 }, (_, k) => Array.from({ length: 6 }, (_, i) => `e-${k}-${i}`));
  await Promise.all(lotes.map((ids) => evaluarRiesgoEnSegundoPlano(ids, { ...base, origen: 'asistencia' })));
  assert.equal(ia.llamadas, 30);
  assert.ok(ia.maxEnCurso <= 4, `máximo en curso: ${ia.maxEnCurso}`);
});

test('R-06: un estudiante que ya está en espera no se repite', async () => {
  reiniciar();
  const a = evaluarRiesgoEnSegundoPlano(['e-1', 'e-2'], { ...base, origen: 'asistencia' });
  const b = evaluarRiesgoEnSegundoPlano(['e-1'], { ...base, origen: 'notas' });   // e-1 otra vez (p. ej. QR repetido)
  await Promise.all([a, b]);
  assert.equal(ia.llamadas, 2, 'e-1 se evaluó una sola vez');
});

test('R-06: si la IA falla, se pausa y lo pendiente no se reintenta', async () => {
  reiniciar();
  ia.falla = true;
  await evaluarRiesgoEnSegundoPlano(Array.from({ length: 30 }, (_, i) => `e-${i}`), { ...base, origen: 'asistencia' });
  assert.ok(ia.llamadas <= 4, `como máximo las 4 que ya estaban en curso (hubo ${ia.llamadas})`);
  const antes = ia.llamadas;
  ia.falla = false;
  await evaluarRiesgoEnSegundoPlano(['e-x'], { ...base, origen: 'notas' });
  assert.equal(ia.llamadas, antes, 'durante la pausa no se vuelve a consultar la IA');
  assert.equal(bd.predicciones.length, 0);
});

test('R-02: con la IA pausada no se hace nada', async () => {
  reiniciar();
  ia.habilitada = false;
  await evaluarRiesgoEnSegundoPlano(['e-1', 'e-2'], { ...base, origen: 'notas' });
  assert.equal(ia.llamadas, 0);
});
