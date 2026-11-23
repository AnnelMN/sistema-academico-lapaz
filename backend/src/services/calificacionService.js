const prisma = require('../lib/prisma');
const { rangoDeTrimestre } = require('./periodoService');

// ════════════════════════════════════════════════════════════════════
// Escala de la UE La Paz "A" (ver AGENTS.md, Módulo 4)
//   SER 10 + SABER 45 + HACER 40 + AUTOEVALUACIÓN 5 = 100
//   - Cada casilla se califica en la escala de su dimensión (entero):
//     SER 0–10, SABER 0–45, HACER 0–40 (como el registro oficial).
//   - Cada dimensión = promedio de sus casillas, redondeado a entero (0,5 sube)
//     ANTES de sumar.
//   - En SER una casilla es la asistencia: (PRESENTE + JUSTIFICADO) / registros × 10.
//   - PENDIENTE (regla del 2026-11-23): si al estudiante le falta CUALQUIER casilla
//     de un componente, ese componente queda pendiente (null) y no se calcula. Un 0
//     sí cuenta. Un componente sin casillas también queda pendiente. La asistencia
//     sin listas no cuenta (no deja SER pendiente).
//   - La nota final solo existe si SER, SABER, HACER y la autoevaluación están
//     completos; si no, total = null ("Calificación pendiente").
//   - Autoevaluación: entero 0–5 registrado por el docente.
// Todos los cálculos se hacen en el servidor; nunca se aceptan puntajes del cliente.
// ════════════════════════════════════════════════════════════════════

const PESOS = Object.freeze({ SER: 10, SABER: 45, HACER: 40 });
// Nota máxima de UNA casilla de cada dimensión (igual a los puntos de la dimensión)
const MAX_CASILLA = PESOS;
const DIMENSIONES = Object.freeze(['SER', 'SABER', 'HACER']);
const MAX_AUTOEVALUACION = 5;
const MAX_CASILLAS = 20;
const UMBRAL_POR_DEFECTO = 51;

// a / b redondeado a entero (0,5 sube) usando solo enteros: sin errores de decimales
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));

// Casilla de asistencia de un estudiante; null si aún no tiene registros
const valorAsistencia = ({ presentes = 0, justificados = 0, total = 0 }) => (
  total > 0 ? dividirRedondeando(MAX_CASILLA.SER * (presentes + justificados), total) : null
);

// Puntaje de una dimensión: promedio redondeado de las casillas que cuentan
// (cada valor ya está en la escala de la dimensión)
const puntajeDimension = (valores) => {
  if (!valores.length) return 0;
  const suma = valores.reduce((acumulado, valor) => acumulado + valor, 0);
  return dividirRedondeando(suma, valores.length);
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
 * @param valoresEstudiante   Map casillaId → valor (0 a MAX_CASILLA de su dimensión)
 * @param asistencia          { presentes, justificados, total } de este estudiante
 * @param autoevaluacion      entero 0–5 o null
 * @param umbral              nota mínima de aprobación
 */
function calcularNotaEstudiante({
  casillas, valoresEstudiante, asistencia, autoevaluacion, umbral = UMBRAL_POR_DEFECTO,
}) {
  const valorAsis = valorAsistencia(asistencia || {});
  const puntajes = {};
  const casillasContadas = {};
  const casillasVacias = {};
  const pendientes = [];

  for (const dimension of DIMENSIONES) {
    const valores = [];
    let vacias = 0;
    for (const casilla of casillas.filter((c) => c.dimension === dimension)) {
      if (casilla.esAsistencia) {
        // Sin listas de asistencia la casilla no cuenta (no la llena el docente)
        if (valorAsis !== null) valores.push(valorAsis);
        continue;
      }
      const valor = valoresEstudiante.get(casilla.id);
      if (Number.isInteger(valor)) valores.push(valor); // un 0 sí cuenta
      else vacias += 1;
    }
    casillasContadas[dimension] = valores.length;
    casillasVacias[dimension] = vacias;
    // Pendiente: falta alguna casilla, o el componente no tiene ninguna
    if (vacias > 0 || valores.length === 0) {
      puntajes[dimension] = null;
      pendientes.push(dimension);
    } else {
      puntajes[dimension] = puntajeDimension(valores);
    }
  }

  const auto = Number.isInteger(autoevaluacion) ? autoevaluacion : null;
  if (auto === null) pendientes.push('AUTOEVALUACION');

  const total = pendientes.length ? null : puntajes.SER + puntajes.SABER + puntajes.HACER + auto;

  return {
    ser: puntajes.SER,
    saber: puntajes.SABER,
    hacer: puntajes.HACER,
    autoevaluacion: auto,
    total,
    aprobado: total === null ? null : total >= umbral,
    completa: total !== null,
    pendientes,
    asistencia: valorAsis,
    casillasContadas,
    casillasVacias,
  };
}

// ── Acceso a datos ───────────────────────────────────────────────────

const ESTADOS_ASISTIDOS = new Set(['PRESENTE', 'JUSTIFICADO']);

/**
 * Carga todo lo necesario para calcular la planilla de una materia y trimestre.
 * cliente: prisma o una transacción (tx).
 */
async function cargarContexto(materiaProgramadaId, trimestre, cliente = prisma, programacionConocida = null) {
  // Si quien llama ya tiene la programación (cursoId y gestión), se ahorra una consulta
  const programacion = programacionConocida?.cursoId && programacionConocida?.gestion
    ? { id: materiaProgramadaId, cursoId: programacionConocida.cursoId, gestion: programacionConocida.gestion }
    : await cliente.materiaProgramada.findUnique({
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
    asistencia: ctx.asistenciaPorEstudiante.get(estudianteId),
    autoevaluacion,
    umbral: ctx.umbral,
  });
};

/**
 * Recalcula y guarda el resumen (tabla notas) de los estudiantes indicados.
 * - Crea la nota (completa o PENDIENTE) si la evaluación ya empezó: alguna casilla
 *   del curso tiene nota de un estudiante activo, o el estudiante tiene autoevaluación.
 * - Si no, borra su nota (no hubo evaluación).
 * autoevaluaciones: Map estudianteId → entero 0–5 o null (solo las que cambian).
 * Devuelve las notas calculadas por estudiante.
 */
async function recalcularNotas(materiaProgramadaId, trimestre, {
  estudianteIds = null, autoevaluaciones = new Map(), cliente = prisma, programacion = null,
} = {}) {
  const ctx = await cargarContexto(materiaProgramadaId, trimestre, cliente, programacion);
  if (!ctx) return new Map();

  // Solo estudiantes ACTIVOS del curso: la nota guardada de un estudiante
  // desactivado queda congelada como historial (no se recalcula ni se borra).
  const ids = new Set((estudianteIds ?? [...ctx.idsActivos]).filter((id) => ctx.idsActivos.has(id)));
  const resultados = new Map();
  const notasABorrar = [];
  const filas = [];

  for (const estudianteId of ids) {
    const nueva = autoevaluaciones.has(estudianteId) ? autoevaluaciones.get(estudianteId) : undefined;
    const calculo = calcularDesdeContexto(ctx, estudianteId, nueva);
    // Así, a quien le faltan casillas que sus compañeros ya tienen le queda una nota
    // PENDIENTE (y se cuenta como pendiente en reportes), no una nota inventada.
    const tieneEvaluacion = ctx.casillasCalificadas.size > 0 || calculo.autoevaluacion !== null;
    const existente = ctx.notasPorEstudiante.get(estudianteId);

    if (!tieneEvaluacion) {
      if (existente) notasABorrar.push(existente.id);
      continue;
    }

    filas.push({ estudianteId, calculo });
    resultados.set(estudianteId, calculo);
  }

  // Todo el curso en 1 o 2 consultas (antes, una por estudiante: muy lento con la BD remota)
  if (notasABorrar.length) await cliente.nota.deleteMany({ where: { id: { in: notasABorrar } } });
  if (filas.length) await guardarNotasEnLote(cliente, materiaProgramadaId, trimestre, filas);

  return resultados;
}

// Inserta o actualiza el resumen de varios estudiantes en UNA consulta.
// Solo cambia las filas cuyos valores son distintos (así actualizadoEn refleja cambios reales).
async function guardarNotasEnLote(cliente, materiaProgramadaId, trimestre, filas) {
  const col = (f) => filas.map(({ calculo }) => f(calculo));
  await cliente.$executeRaw`
    INSERT INTO notas (id, "estudianteId", "materiaProgramadaId", trimestre, ser, saber, hacer, autoevaluacion, total, aprobado, "creadoEn", "actualizadoEn")
    SELECT gen_random_uuid()::text, t.e, ${materiaProgramadaId}, ${trimestre}::int, t.ser, t.saber, t.hacer, t.auto, t.total, t.aprobado, now(), now()
    FROM unnest(
      ${filas.map((f) => f.estudianteId)}::text[], ${col((c) => c.ser)}::int[], ${col((c) => c.saber)}::int[],
      ${col((c) => c.hacer)}::int[], ${col((c) => c.autoevaluacion)}::int[], ${col((c) => c.total)}::int[],
      ${col((c) => c.aprobado)}::boolean[]
    ) AS t(e, ser, saber, hacer, auto, total, aprobado)
    ON CONFLICT ("estudianteId", "materiaProgramadaId", trimestre) DO UPDATE SET
      ser = EXCLUDED.ser, saber = EXCLUDED.saber, hacer = EXCLUDED.hacer, autoevaluacion = EXCLUDED.autoevaluacion,
      total = EXCLUDED.total, aprobado = EXCLUDED.aprobado, "actualizadoEn" = now()
    WHERE (notas.ser, notas.saber, notas.hacer, notas.autoevaluacion, notas.total, notas.aprobado)
      IS DISTINCT FROM (EXCLUDED.ser, EXCLUDED.saber, EXCLUDED.hacer, EXCLUDED.autoevaluacion, EXCLUDED.total, EXCLUDED.aprobado)`;
}

module.exports = {
  PESOS,
  MAX_CASILLA,
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
