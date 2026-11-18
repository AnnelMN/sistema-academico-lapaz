// Utilidades compartidas por seed.js y seed_prueba.js.
// Los datos de ejemplo usan la escala real del colegio (SER 10 · SABER 45 ·
// HACER 40 · AUTOEVALUACIÓN 5) y el MISMO cálculo que el sistema
// (src/services/calificacionService.js), así nunca quedan notas inconsistentes.
const { recalcularNotas } = require('../src/services/calificacionService');

// Fechas de los trimestres 2026 informadas por el colegio.
// Los lunes 11/05 y 31/08 son días de descanso (no pertenecen a ningún trimestre).
const PERIODOS_2026 = [
  { trimestre: 1, fechaInicio: '2026-02-03', fechaFin: '2026-05-09' },
  { trimestre: 2, fechaInicio: '2026-05-12', fechaFin: '2026-08-29' },
  { trimestre: 3, fechaInicio: '2026-09-01', fechaFin: '2026-12-02' },
];

// Crea los periodos si no existen (no sobrescribe fechas que el Director haya cambiado)
async function asegurarPeriodos(db, gestion = 2026, periodos = PERIODOS_2026) {
  for (const p of periodos) {
    await db.periodoTrimestral.upsert({
      where: { gestion_trimestre: { gestion, trimestre: p.trimestre } },
      update: {},
      create: { gestion, trimestre: p.trimestre, fechaInicio: new Date(p.fechaInicio), fechaFin: new Date(p.fechaFin) },
    });
  }
}

// Casillas de ejemplo por dimensión (en SER se agrega además la de asistencia)
const CASILLAS_EJEMPLO = {
  SER: ['Participación', 'Responsabilidad'],
  SABER: ['Examen 1', 'Examen 2', 'Práctica escrita'],
  HACER: ['Proyecto', 'Trabajo en grupo'],
};

// Perfiles de rendimiento: notas de las casillas (enteros 0–100), autoevaluación y faltas
const PERFILES = {
  alto: { notas: [95, 88, 100, 92, 85, 97, 90], autoevaluacion: 5, ausentes: 0, justificados: 1 },
  medio: { notas: [75, 70, 62, 68, 74, 80, 66], autoevaluacion: 4, ausentes: 2, justificados: 1 },
  bajo: { notas: [55, 40, 35, 48, 30, 50, 42], autoevaluacion: 3, ausentes: 5, justificados: 0 },
};

// Fechas de clase de ejemplo: lunes y miércoles a partir de una fecha
function fechasDeClase(desde, cantidad) {
  const fechas = [];
  const d = new Date(`${desde}T12:00:00.000Z`);
  while (fechas.length < cantidad) {
    const dia = d.getUTCDay();
    if (dia === 1 || dia === 3) fechas.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return fechas;
}

const INICIO_CLASES = { 1: '2026-03-02', 2: '2026-05-18', 3: '2026-09-07' };

/**
 * Crea casillas, calificaciones, autoevaluaciones y asistencias de ejemplo para
 * una materia y trimestre, y calcula las notas con el servicio del sistema.
 * Si la materia ya tiene casillas en ese trimestre no hace nada (idempotente).
 * estudiantes: [{ id, perfil: 'alto' | 'medio' | 'bajo' }]
 */
async function crearNotasDeEjemplo(db, { materiaProgramadaId, trimestre, estudiantes: solicitados, registradoPorId, clases = 12 }) {
  const existentes = await db.casilla.count({ where: { materiaProgramadaId, trimestre } });
  if (existentes > 0) return { creado: false, omitidos: [] };

  // Solo estudiantes del curso de la materia (regla de negocio 9)
  const programacion = await db.materiaProgramada.findUnique({ where: { id: materiaProgramadaId }, select: { cursoId: true } });
  const delCurso = new Set((await db.estudiante.findMany({
    where: { cursoId: programacion.cursoId, id: { in: solicitados.map((e) => e.id) } },
    select: { id: true },
  })).map((e) => e.id));
  const estudiantes = solicitados.filter((e) => delCurso.has(e.id));
  const omitidos = solicitados.filter((e) => !delCurso.has(e.id)).map((e) => e.id);
  if (!estudiantes.length) return { creado: false, omitidos };

  // Asistencias (una por clase; las primeras faltas según el perfil)
  const fechas = fechasDeClase(INICIO_CLASES[trimestre], clases);
  const asistencias = [];
  for (const e of estudiantes) {
    const perfil = PERFILES[e.perfil];
    fechas.forEach((fecha, i) => {
      let estado = 'PRESENTE';
      if (i < perfil.ausentes) estado = 'AUSENTE';
      else if (i < perfil.ausentes + perfil.justificados) estado = 'JUSTIFICADO';
      asistencias.push({ estudianteId: e.id, materiaProgramadaId, fecha, estado });
    });
  }
  await db.asistencia.createMany({ data: asistencias, skipDuplicates: true });

  // Casillas: SER empieza con la de asistencia
  const casillas = [];
  casillas.push(await db.casilla.create({
    data: { materiaProgramadaId, trimestre, dimension: 'SER', orden: 1, nombre: 'Asistencia', esAsistencia: true },
  }));
  for (const [dimension, nombres] of Object.entries(CASILLAS_EJEMPLO)) {
    let orden = dimension === 'SER' ? 2 : 1;
    for (const nombre of nombres) {
      casillas.push(await db.casilla.create({ data: { materiaProgramadaId, trimestre, dimension, orden, nombre } }));
      orden += 1;
    }
  }

  // Calificaciones de las casillas manuales (en el orden SER, SABER, HACER)
  const manuales = casillas.filter((c) => !c.esAsistencia);
  const calificaciones = [];
  for (const e of estudiantes) {
    const notas = PERFILES[e.perfil].notas;
    manuales.forEach((c, i) => {
      // Se rota la lista según el trimestre para que las notas varíen entre trimestres
      calificaciones.push({ casillaId: c.id, estudianteId: e.id, valor: notas[(i + trimestre - 1) % notas.length], registradoPorId });
    });
  }
  await db.calificacionCasilla.createMany({ data: calificaciones });

  // Resumen trimestral con el cálculo oficial (incluye la autoevaluación)
  const autoevaluaciones = new Map(estudiantes.map((e) => [e.id, PERFILES[e.perfil].autoevaluacion]));
  const resultados = await recalcularNotas(materiaProgramadaId, trimestre, { autoevaluaciones, cliente: db });
  return { creado: true, resultados, omitidos };
}

class Ensayo extends Error {}

/**
 * Ejecuta un seed. Con --ensayo corre todo dentro de una transacción y la
 * DESHACE al final: sirve para comprobar el seed sin cambiar la base de datos.
 */
async function ejecutarSeed(prisma, main) {
  const ensayo = process.argv.includes('--ensayo');
  try {
    if (!ensayo) {
      await main(prisma);
      return;
    }
    console.log('MODO ENSAYO: los cambios se desharán al terminar.\n');
    try {
      await prisma.$transaction(async (tx) => {
        await main(tx);
        throw new Ensayo();
      }, { maxWait: 20000, timeout: 180000 });
    } catch (error) {
      if (!(error instanceof Ensayo)) throw error;
      console.log('\nENSAYO COMPLETO: todo funcionó y no se guardó ningún cambio.');
    }
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  PERIODOS_2026,
  PERFILES,
  asegurarPeriodos,
  crearNotasDeEjemplo,
  ejecutarSeed,
};
