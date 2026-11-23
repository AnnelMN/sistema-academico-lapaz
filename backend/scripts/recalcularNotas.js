// Recalcula el resumen trimestral (tabla notas) con la regla vigente de
// calificacionService.js — desde el 2026-11-23, la de "Calificación pendiente".
//   node scripts/recalcularNotas.js --ensayo   → muestra qué cambiaría y lo deshace
//   node scripts/recalcularNotas.js            → aplica el recálculo
// Solo recalcula a los estudiantes ACTIVOS (las notas de los desactivados quedan
// congeladas como historial). No borra casillas ni calificaciones: solo actualiza
// (o, si ya no hay evaluación, quita) el resumen calculado.
// Nunca imprime nombres ni datos personales: solo cantidades.
require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { recalcularNotas } = require('../src/services/calificacionService');

const ensayo = process.argv.includes('--ensayo');
class Ensayo extends Error {}

const clave = (n) => `${n.estudianteId}|${n.materiaProgramadaId}|${n.trimestre}`;
const resumen = (n) => `${n.ser}|${n.saber}|${n.hacer}|${n.autoevaluacion}|${n.total}|${n.aprobado}`;

async function main() {
  const cambios = { actualizadas: 0, aPendiente: 0, aCompleta: 0, creadas: 0, quitadas: 0, sinCambios: 0 };

  await prisma.$transaction(async (tx) => {
    const antes = new Map((await tx.nota.findMany()).map((n) => [clave(n), n]));
    // Toda materia y trimestre que tenga casillas o notas
    const [conCasillas, conNotas] = await Promise.all([
      tx.casilla.findMany({ select: { materiaProgramadaId: true, trimestre: true }, distinct: ['materiaProgramadaId', 'trimestre'] }),
      tx.nota.findMany({ select: { materiaProgramadaId: true, trimestre: true }, distinct: ['materiaProgramadaId', 'trimestre'] }),
    ]);
    const grupos = new Map([...conCasillas, ...conNotas].map((g) => [`${g.materiaProgramadaId}|${g.trimestre}`, g]));
    console.log(`Materias × trimestre a recalcular: ${grupos.size} · notas guardadas antes: ${antes.size}`);

    for (const g of grupos.values()) {
      await recalcularNotas(g.materiaProgramadaId, g.trimestre, { cliente: tx });
    }

    const despues = new Map((await tx.nota.findMany()).map((n) => [clave(n), n]));
    for (const [k, a] of antes) {
      const d = despues.get(k);
      if (!d) { cambios.quitadas += 1; continue; }
      if (resumen(a) === resumen(d)) { cambios.sinCambios += 1; continue; }
      cambios.actualizadas += 1;
      if (a.total !== null && d.total === null) cambios.aPendiente += 1;
      if (a.total === null && d.total !== null) cambios.aCompleta += 1;
    }
    for (const k of despues.keys()) if (!antes.has(k)) cambios.creadas += 1;
    const pendientes = [...despues.values()].filter((n) => n.total === null).length;

    console.log(`Sin cambios: ${cambios.sinCambios} · actualizadas: ${cambios.actualizadas} `
      + `(pasan a «Calificación pendiente»: ${cambios.aPendiente}; pasan a completas: ${cambios.aCompleta}) `
      + `· creadas: ${cambios.creadas} · quitadas: ${cambios.quitadas}`);
    console.log(`Notas después: ${despues.size} (completas: ${despues.size - pendientes}, pendientes: ${pendientes})`);
    if (ensayo) throw new Ensayo();
  }, { maxWait: 10000, timeout: 120000 });
}

main()
  .then(() => console.log('Listo: notas recalculadas.'))
  .catch((error) => {
    if (error instanceof Ensayo) { console.log('Ensayo: no se guardó ningún cambio.'); return; }
    console.error('Error: no se guardó ningún cambio.', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
