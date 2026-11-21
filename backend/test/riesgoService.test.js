// R-01 (un solo correo de Riesgo Alto por trimestre) y R-02 (predicciones en
// segundo plano, con corte si la IA falla). Base de datos, IA y correo simulados.
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
const ia = { desde: null, habilitada: true, respuesta: { nivel_riesgo: 'RIESGO_ALTO', probabilidad: 0.9 }, demoraMs: 0, falla: false, llamadas: 0 };

simular('lib/prisma', {
  prediccionRiesgo: { create: async ({ data }) => { bd.predicciones.push(data); } },
  notificacion: {
    findFirst: async ({ where }) => bd.notificaciones.find((n) => n.estudianteId === where.estudianteId
      && n.tipo === where.tipo && n.estadoEnvio === where.estadoEnvio
      && (!where.enviadoEn || (n.enviadoEn >= where.enviadoEn.gte && n.enviadoEn <= where.enviadoEn.lte))) || null,
    create: async ({ data }) => { bd.notificaciones.push({ ...data, enviadoEn: data.enviadoEn || new Date('2026-10-15T12:00:00Z') }); },
  },
  estudiante: { findUnique: async () => ({ emailTutor: 'tutor@example.com', usuario: { nombre: 'Estudiante ficticio' } }) },
  materiaProgramada: { findUnique: async () => ({ materia: { nombre: 'Matemática' } }) },
});
simular('services/iaService', {
  iaHabilitada: () => ia.habilitada,
  prediccionesDesde: () => ia.desde,
  predecirRiesgo: async () => {
    ia.llamadas += 1;
    if (ia.demoraMs) await new Promise((r) => setTimeout(r, ia.demoraMs));
    if (ia.falla) throw new Error('microservicio caído');
    return ia.respuesta;
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

const { evaluarRiesgo, evaluarRiesgoEnSegundoPlano } = require('../src/services/riesgoService');

const reiniciar = () => {
  bd.notificaciones.length = 0; bd.predicciones.length = 0; correos.length = 0;
  Object.assign(ia, { desde: null, habilitada: true, demoraMs: 0, falla: false, llamadas: 0 });
};
const base = { materiaProgramadaId: 'mp-1', trimestre: 3 };

test('R-01: varias predicciones de Riesgo Alto en el mismo trimestre → un solo correo', async () => {
  reiniciar();
  for (let i = 0; i < 5; i++) await evaluarRiesgo({ ...base, estudianteId: 'e-1' });
  assert.equal(bd.predicciones.length, 5, 'cada predicción se guarda en el historial');
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
  // 12 estudiantes de a 4 → ~3 rondas de 300 ms, no 12 × 300 ms
  assert.ok(Date.now() - inicio < 12 * 300, 'se procesan varias a la vez');
});

test('R-02: si la IA falla, el resto de la tanda no vuelve a intentarlo', async () => {
  reiniciar();
  ia.falla = true;
  await evaluarRiesgoEnSegundoPlano(Array.from({ length: 30 }, (_, i) => `e-${i}`), { ...base, origen: 'asistencia' });
  assert.ok(ia.llamadas <= 4, `como máximo las ${4} que ya estaban en curso (hubo ${ia.llamadas})`);
  assert.equal(bd.predicciones.length, 0);
});

test('R-02: con la IA pausada no se hace nada', async () => {
  reiniciar();
  ia.habilitada = false;
  await evaluarRiesgoEnSegundoPlano(['e-1', 'e-2'], { ...base, origen: 'notas' });
  assert.equal(ia.llamadas, 0);
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
