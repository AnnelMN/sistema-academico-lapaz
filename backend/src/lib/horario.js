// Formato único del horario de una clase: "Día-HH:MM" (por ejemplo "Lunes-07:30"),
// de lunes a viernes. Se acepta también el formato antiguo con espacio
// ("Lunes 07:30") y días sin tilde ("Miercoles"), y se devuelven normalizados,
// así la detección de conflictos compara siempre el mismo texto.

const DIAS = Object.freeze(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

const sinTildes = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Devuelve "Día-HH:MM" o null si el texto no es un horario válido
function normalizarHorario(valor) {
  if (typeof valor !== 'string') return null;
  const m = /^\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s*[-\s]\s*(\d{1,2}):(\d{2})\s*$/.exec(valor);
  if (!m) return null;
  const dia = DIAS.find((d) => sinTildes(d) === sinTildes(m[1]));
  const hora = Number(m[2]);
  const minuto = Number(m[3]);
  if (!dia || hora > 23 || minuto > 59) return null;
  return `${dia}-${String(hora).padStart(2, '0')}:${m[3]}`;
}

module.exports = { DIAS, normalizarHorario };
