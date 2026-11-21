// Consultas de predicciones de riesgo (R-05).
// Las pantallas solo necesitan la ÚLTIMA predicción de cada estudiante. En vez de
// traer todo el historial y descartarlo en memoria (lo que crece sin límite),
// la base de datos agrupa por estudiante (GROUP BY) y solo se leen esas filas.
// Nota: `distinct` de Prisma 5 sin la opción nativeDistinct se resuelve en
// memoria, por eso se usa groupBy.
const prisma = require('../lib/prisma');
const { filtroModeloVigente } = require('./iaService');

const TAMANO_BLOQUE = 2000;   // estudiantes por consulta (límite de parámetros de PostgreSQL)

/**
 * ids de la última predicción del modelo vigente de cada estudiante.
 * where: condiciones extra (p. ej. { estudianteId: { in: [...] }, trimestre: 2 }).
 */
async function idsUltimasPredicciones(where = {}, cliente = prisma) {
  const grupos = await cliente.prediccionRiesgo.groupBy({
    by: ['estudianteId'],
    where: { ...where, ...filtroModeloVigente() },
    _max: { generadoEn: true },
  });
  const ids = [];
  const vistos = new Set();
  for (let i = 0; i < grupos.length; i += TAMANO_BLOQUE) {
    const bloque = grupos.slice(i, i + TAMANO_BLOQUE);
    const filas = await cliente.prediccionRiesgo.findMany({
      where: { OR: bloque.map((g) => ({ estudianteId: g.estudianteId, generadoEn: g._max.generadoEn })) },
      select: { id: true, estudianteId: true },
      orderBy: { generadoEn: 'desc' },
    });
    for (const f of filas) {
      // Si dos filas tuvieran exactamente la misma fecha, se toma una sola
      if (!vistos.has(f.estudianteId)) {
        vistos.add(f.estudianteId);
        ids.push(f.id);
      }
    }
  }
  return ids;
}

module.exports = { idsUltimasPredicciones };
