// Variables de entrada del modelo de riesgo (microservicio-ia/train_model.py),
// calculadas para un estudiante REAL con la misma lógica del centralizador con
// el que se generó el dataset sintético (docs/DATASET_SINTETICO.md):
//
//   promedio_notas        promedio de sus materias de la nota acumulada del año
//                         (promedio de los totales trimestrales registrados hasta T)
//   porcentaje_asistencia (PRESENTE + JUSTIFICADO) / clases registradas × 100,
//                         en todas sus materias, desde el T1 hasta el fin del T
//   areas_reprobadas      materias cuya nota acumulada, redondeada, es menor a 51
//   nivel                 curso del estudiante (1.º a 6.º)
//   trimestre             trimestre de la predicción
//
// Solo usa información registrada hasta ese momento (nunca notas futuras).
const prisma = require('../lib/prisma');
const { rangoDeTrimestre } = require('./periodoService');

const NOTA_APROBACION = 51;
const MAX_AREAS = 13;              // rango con el que se entrenó el modelo

// Redondeo del sistema y del registro oficial: 0,5 sube
const redondear = (x) => Math.floor(x + 0.5);
const limitar = (x, min, max) => Math.min(max, Math.max(min, x));

/**
 * Cálculo puro (sin base de datos), para poder probarlo.
 * notasPorMateria: Map/obj materiaProgramadaId → [total T1, total T2, …] (solo los registrados)
 * asistencias:     [{ estado }]
 * Devuelve null si todavía no hay ninguna nota (no se puede predecir).
 */
function resumirVariables({ nivel, trimestre, notasPorMateria, asistencias, gestion }) {
  const acumuladas = Object.values(notasPorMateria instanceof Map ? Object.fromEntries(notasPorMateria) : notasPorMateria)
    .filter((totales) => totales.length > 0)
    .map((totales) => totales.reduce((s, v) => s + v, 0) / totales.length);
  if (acumuladas.length === 0) return null;

  const promedio = acumuladas.reduce((s, v) => s + v, 0) / acumuladas.length;
  const reprobadas = acumuladas.filter((v) => redondear(v) < NOTA_APROBACION).length;

  // JUSTIFICADO cuenta como asistencia (regla del colegio; equivale a la licencia del registro)
  const total = asistencias.length;
  const asistio = asistencias.filter((a) => a.estado === 'PRESENTE' || a.estado === 'JUSTIFICADO').length;
  const porcentaje = total > 0 ? (asistio / total) * 100 : 100;   // sin registros: no hay faltas conocidas

  return {
    promedio_notas: Math.round(limitar(promedio, 0, 100) * 100) / 100,
    porcentaje_asistencia: Math.round(limitar(porcentaje, 0, 100) * 100) / 100,
    areas_reprobadas: limitar(reprobadas, 0, MAX_AREAS),
    nivel: limitar(Number(nivel), 1, 6),
    trimestre: limitar(Number(trimestre), 1, 3),
    materias_con_nota: acumuladas.length,     // informativo (no se envía al modelo)
    clases_registradas: total,                // informativo (no se envía al modelo)
    gestion: gestion ?? null,                 // informativo (no se envía al modelo)
  };
}

/**
 * Variables del estudiante en el trimestre indicado, dentro de la gestión de la
 * materia que originó el cambio (materiaProgramadaId).
 */
async function calcularVariablesRiesgo({ estudianteId, materiaProgramadaId, trimestre }, cliente = prisma) {
  const [estudiante, origen] = await Promise.all([
    cliente.estudiante.findUnique({ where: { id: estudianteId }, select: { cursoId: true, curso: { select: { nivel: true } } } }),
    cliente.materiaProgramada.findUnique({ where: { id: materiaProgramadaId }, select: { gestion: true } }),
  ]);
  if (!estudiante || !origen) return null;

  // Todas las materias del curso del estudiante en esa gestión
  const materias = await cliente.materiaProgramada.findMany({
    where: { cursoId: estudiante.cursoId, gestion: origen.gestion },
    select: { id: true },
  });
  const ids = materias.map((m) => m.id);
  if (ids.length === 0) return null;

  const notas = await cliente.nota.findMany({
    where: { estudianteId, materiaProgramadaId: { in: ids }, trimestre: { lte: trimestre } },
    select: { materiaProgramadaId: true, trimestre: true, total: true },
    orderBy: { trimestre: 'asc' },
  });
  const notasPorMateria = Object.fromEntries(ids.map((id) => [id, []]));
  for (const n of notas) notasPorMateria[n.materiaProgramadaId].push(n.total);

  // Asistencia desde el inicio del T1 hasta el fin del trimestre de la predicción
  const [r1, rT] = await Promise.all([
    rangoDeTrimestre(origen.gestion, 1, cliente),
    rangoDeTrimestre(origen.gestion, trimestre, cliente),
  ]);
  const asistencias = await cliente.asistencia.findMany({
    where: {
      estudianteId,
      materiaProgramadaId: { in: ids },
      ...(r1 && rT ? { fecha: { gte: r1.inicio, lte: rT.fin } } : {}),
    },
    select: { estado: true },
  });

  return resumirVariables({ nivel: estudiante.curso.nivel, trimestre, notasPorMateria, asistencias, gestion: origen.gestion });
}

module.exports = { resumirVariables, calcularVariablesRiesgo, NOTA_APROBACION };
