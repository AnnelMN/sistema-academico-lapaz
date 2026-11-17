const prisma = require('../lib/prisma');

// Los trimestres se definen por FECHAS (tabla periodos_trimestrales, configurada
// por el Director). El trimestre activo es el que contiene la fecha de hoy en
// La Paz; así nadie tiene que cambiarlo a mano.
// Los días entre trimestres (p. ej. lunes de descanso) no pertenecen a ninguno.

const ZONA_HORARIA = 'America/La_Paz';

const aFechaISO = (fecha) => fecha.toISOString().slice(0, 10);

// Fecha de hoy en La Paz, formato YYYY-MM-DD
const hoyLaPaz = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

// Valida una fecha 'YYYY-MM-DD' real (rechaza 2026-02-30, formatos raros, etc.)
const esFechaISOValida = (texto) => {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T12:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && aFechaISO(fecha) === texto;
};

// 1 = lunes … 5 = viernes
const esDiaHabil = (texto) => {
  const dia = new Date(`${texto}T12:00:00Z`).getUTCDay();
  return dia >= 1 && dia <= 5;
};

const formatearPeriodo = (p) => ({
  gestion: p.gestion,
  trimestre: p.trimestre,
  fechaInicio: aFechaISO(p.fechaInicio),
  fechaFin: aFechaISO(p.fechaFin),
});

// Periodo (gestión + trimestre) al que pertenece una fecha 'YYYY-MM-DD', o null
async function periodoDeFecha(texto, cliente = prisma) {
  if (!esFechaISOValida(texto)) return null;
  const gestion = Number(texto.slice(0, 4));
  const periodos = await cliente.periodoTrimestral.findMany({ where: { gestion } });
  const periodo = periodos.find(
    (p) => texto >= aFechaISO(p.fechaInicio) && texto <= aFechaISO(p.fechaFin)
  );
  return periodo ? formatearPeriodo(periodo) : null;
}

// Periodo activo hoy, o null si hoy no cae en ningún trimestre (vacaciones/descanso)
const periodoActivo = (cliente = prisma) => periodoDeFecha(hoyLaPaz(), cliente);

// Rango de fechas de un trimestre para filtrar asistencias, o null si no está configurado
async function rangoDeTrimestre(gestion, trimestre, cliente = prisma) {
  const periodo = await cliente.periodoTrimestral.findUnique({
    where: { gestion_trimestre: { gestion, trimestre } },
  });
  if (!periodo) return null;
  const inicio = new Date(`${aFechaISO(periodo.fechaInicio)}T00:00:00.000Z`);
  const fin = new Date(`${aFechaISO(periodo.fechaFin)}T23:59:59.999Z`);
  return { inicio, fin, ...formatearPeriodo(periodo) };
}

module.exports = {
  hoyLaPaz,
  esFechaISOValida,
  esDiaHabil,
  periodoDeFecha,
  periodoActivo,
  rangoDeTrimestre,
};
