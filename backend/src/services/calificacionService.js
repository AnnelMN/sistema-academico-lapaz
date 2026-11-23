const prisma = require('../lib/prisma');
const { rangoDeTrimestre } = require('./periodoService');

// ════════════════════════════════════════════════════════════════════
// Escala de la UE La Paz "A" (ver AGENTS.md, Módulo 4)
//   SER 10 + SABER 45 + HACER 40 + AUTOEVALUACIÓN 5 = 100
//   - Cada dimensión = promedio de sus casillas (enteros 0–100) × peso / 100,
//     redondeado a entero (0,5 sube) ANTES de sumar.
//   - En SER una casilla es la asistencia: (PRESENTE + JUSTIFICADO) / registros × 100.
//   - Una casilla sin nota para NINGÚN estudiante no cuenta; si tiene notas para
//     algunos, quien no tiene nota en ella recibe 0.
//   - Autoevaluación: entero 0–5 registrado por el docente.
// Todos los cálculos se hacen en el servidor; nunca se aceptan puntajes del cliente.
// ════════════════════════════════════════════════════════════════════

const PESOS = Object.freeze({ SER: 10, SABER: 45, HACER: 40 });
const DIMENSIONES = Object.freeze(['SER', 'SABER', 'HACER']);
const MAX_AUTOEVALUACION = 5;
const MAX_CASILLAS = 20;
const UMBRAL_POR_DEFECTO = 51;

// a / b redondeado a entero (0,5 sube) usando solo enteros: sin errores de decimales
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));

// Casilla de asistencia de un estudiante; null si aún no tiene registros
const valorAsistencia = ({ presentes = 0, justificados = 0, total = 0 }) => (
  total > 0 ? dividirRedondeando(100 * (presentes + justificados), total) : null
);

// Puntaje de una dimensión a partir de los valores (0–100) de las casillas que cuentan
const puntajeDimension = (valores, peso) => {
  if (!valores.length) return 0;
  const suma = valores.reduce((acumulado, valor) => acumulado + valor, 0);
  return dividirRedondeando(suma * peso, valores.length * 100);
};

// Nota anual = promedio de los totales trimestrales, redondeado a entero
const notaAnual = (totales) => {
  const validos = totales.filter((t) => Number.isInteger(t));
  if (!validos.length) return null;
  return dividirRedondeando(validos.reduce((s, t) => s + t, 0), validos.length);
};

/**
 * Calcula la nota trimestral de UN estudiante (función pura, sin base de datos).
 * @param casillas            [{ id, dimension, esAsistencia }]
 * @param valoresEstudiante   Map casillaId → valor (0–100) de este estudiante
 * @param casillasCalificadas Set de casillaId con nota para al menos un estudiante
 * @param asistencia          { presentes, justificados, total } de este estudiante
 * @param autoevaluacion      entero 0–5 o null
 * @param umbral              nota mínima de aprobación
 */
function calcularNotaEstudiante({
  casillas, valoresEstudiante, casillasCalificadas, asistencia, autoevaluacion, umbral = UMBRAL_POR_DEFECTO,
}) {
  const valorAsis = valorAsistencia(asistencia || {});
  const puntajes = {};
  const casillasContadas = {};

  for (const dimension of DIMENSIONES) {
    const valores = [];
    for (const casilla of casillas.filter((c) => c.dimension === dimension)) {
      if (casilla.esAsistencia) {
        if (valorAsis !== null) valores.push(valorAsis);
      } else if (casillasCalificadas.has(casilla.id)) {
        valores.push(valoresEstudiante.get(casilla.id) ?? 0);
      }
    }
    puntajes[dimension] = puntajeDimension(valores, PESOS[dimension]);
    casillasContadas[dimension] = valores.length;
  }

  const auto = Number.isInteger(autoevaluacion) ? autoevaluacion : null;
  const total = puntajes.SER + puntajes.SABER + puntajes.HACER + (auto ?? 0);

  return {
    ser: puntajes.SER,
    saber: puntajes.SABER,
    hacer: puntajes.HACER,
    autoevaluacion: auto,
    total,
    aprobado: total >= umbral,
    asistencia: valorAsis,
    casillasContadas,
  };
}

// ── Acceso a datos ───────────────────────────────────────────────────

const ESTADOS_ASISTIDOS = new Set(['PRESENTE', 'JUSTIFICADO']);

/**
 * Carga todo lo necesario para calcular la planilla de una materia y trimestre.
 * cliente: prisma o una transacción (tx).
 */
async function cargarContexto(materiaProgramadaId, trimestre, cliente = prisma) {
  const programacion = await cliente.materiaProgramada.findUnique({
    where: { id: materiaProgramadaId },
    select: { id: true, cursoId: true, gestion: true },
  });
  if (!programacion) return null;

  const [casillas, estudiantes, notas, config, rango] = await Promise.all([
    cliente.casilla.findMany({
      where: { materiaProgramadaId, trimestre },
      orderBy: [{ dimension: 'asc' }, { orden: 'asc' }],
      include: { calificaciones: { select: { estudianteId: true, valor: true } } },
    }),
    // Todos los del curso (también los desactivados, para que el Director vea su
    // historial); los cálculos y la planilla del docente usan solo los activos.
    cliente.estudiante.findMany({
      where: { cursoId: programacion.cursoId },
      select: { id: true, usuario: { select: { nombre: true, activo: true } } },
      orderBy: { usuario: { nombre: 'asc' } },
    }),
    cliente.nota.findMany({ where: { materiaProgramadaId, trimestre } }),
    cliente.configuracion.findFirst(),
    rangoDeTrimestre(programacion.gestion, trimestre, cliente),
  ]);

  const asistencias = rango
    ? await cliente.asistencia.findMany({
      where: { materiaProgramadaId, fecha: { gte: rango.inicio, lte: rango.fin } },
      select: { estudianteId: true, estado: true },
    })
    : [];

  const asistenciaPorEstudiante = new Map();
  for (const a of asistencias) {
    const r = asistenciaPorEstudiante.get(a.estudianteId) || { presentes: 0, justificados: 0, ausentes: 0, total: 0 };
    r.total += 1;
    if (a.estado === 'PRESENTE') r.presentes += 1;
    else if (a.estado === 'JUSTIFICADO') r.justificados += 1;
    else r.ausentes += 1;
    asistenciaPorEstudiante.set(a.estudianteId, r);
  }

  // Una casilla "cuenta" si algún estudiante ACTIVO tiene nota en ella: las notas
  // de un estudiante desactivado son historial y no obligan a nadie a tener 0.
  const idsActivos = new Set(estudiantes.filter((e) => e.usuario.activo).map((e) => e.id));
  const casillasCalificadas = new Set(
    casillas
      .filter((c) => !c.esAsistencia && c.calificaciones.some((cal) => idsActivos.has(cal.estudianteId)))
      .map((c) => c.id)
  );

  const valoresPorEstudiante = new Map();
  for (const c of casillas) {
    for (const cal of c.calificaciones) {
      if (!valoresPorEstudiante.has(cal.estudianteId)) valoresPorEstudiante.set(cal.estudianteId, new Map());
      valoresPorEstudiante.get(cal.estudianteId).set(c.id, cal.valor);
    }
  }

  return {
    programacion,
    trimestre,
    casillas,
    casillasCalificadas,
    estudiantes,
    idsActivos,
    notasPorEstudiante: new Map(notas.map((n) => [n.estudianteId, n])),
    valoresPorEstudiante,
    asistenciaPorEstudiante,
    umbral: config?.umbralAprobacion || UMBRAL_POR_DEFECTO,
    periodo: rango ? { fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin } : null,
  };
}

const calcularDesdeContexto = (ctx, estudianteId, autoevaluacionNueva) => {
  const notaActual = ctx.notasPorEstudiante.get(estudianteId);
  const autoevaluacion = autoevaluacionNueva !== undefined
    ? autoevaluacionNueva
    : notaActual?.autoevaluacion ?? null;
  return calcularNotaEstudiante({
    casillas: ctx.casillas,
    valoresEstudiante: ctx.valoresPorEstudiante.get(estudianteId) || new Map(),
    casillasCalificadas: ctx.casillasCalificadas,
    asistencia: ctx.asistenciaPorEstudiante.get(estudianteId),
    autoevaluacion,
    umbral: ctx.umbral,
  });
};

/**
 * Recalcula y guarda el resumen (tabla notas) de los estudiantes indicados.
 * - Crea la nota si el estudiante tiene alguna casilla calificada o autoevaluación.
 * - Si ya no tiene ninguna, borra su nota (no hubo evaluación).
 * autoevaluaciones: Map estudianteId → entero 0–5 o null (solo las que cambian).
 * Devuelve las notas calculadas por estudiante.
 */
async function recalcularNotas(materiaProgramadaId, trimestre, {
  estudianteIds = null, autoevaluaciones = new Map(), cliente = prisma,
} = {}) {
  const ctx = await cargarContexto(materiaProgramadaId, trimestre, cliente);
  if (!ctx) return new Map();

  // Solo estudiantes ACTIVOS del curso: la nota guardada de un estudiante
  // desactivado queda congelada como historial (no se recalcula ni se borra).
  const ids = new Set((estudianteIds ?? [...ctx.idsActivos]).filter((id) => ctx.idsActivos.has(id)));
  const resultados = new Map();

  for (const estudianteId of ids) {
    const nueva = autoevaluaciones.has(estudianteId) ? autoevaluaciones.get(estudianteId) : undefined;
    const calculo = calcularDesdeContexto(ctx, estudianteId, nueva);
    const tieneEvaluacion = calculo.casillasContadas.SABER + calculo.casillasContadas.HACER > 0
      || ctx.casillas.some((c) => c.dimension === 'SER' && !c.esAsistencia && ctx.casillasCalificadas.has(c.id))
      || calculo.autoevaluacion !== null;
    const existente = ctx.notasPorEstudiante.get(estudianteId);

    if (!tieneEvaluacion) {
      if (existente) await cliente.nota.delete({ where: { id: existente.id } });
      continue;
    }

    const datos = {
      ser: calculo.ser,
      saber: calculo.saber,
      hacer: calculo.hacer,
      autoevaluacion: calculo.autoevaluacion,
      total: calculo.total,
      aprobado: calculo.aprobado,
    };
    await cliente.nota.upsert({
      where: {
        estudianteId_materiaProgramadaId_trimestre: { estudianteId, materiaProgramadaId, trimestre },
      },
      update: datos,
      create: { estudianteId, materiaProgramadaId, trimestre, ...datos },
    });
    resultados.set(estudianteId, calculo);
  }

  return resultados;
}

module.exports = {
  PESOS,
  DIMENSIONES,
  MAX_AUTOEVALUACION,
  MAX_CASILLAS,
  ESTADOS_ASISTIDOS,
  dividirRedondeando,
  valorAsistencia,
  puntajeDimension,
  notaAnual,
  calcularNotaEstudiante,
  cargarContexto,
  calcularDesdeContexto,
  recalcularNotas,
};
