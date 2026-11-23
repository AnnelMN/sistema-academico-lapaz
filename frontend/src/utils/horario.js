// Lectura del horario de una clase. El formato oficial es "Día-HH:MM"
// (por ejemplo "Lunes-07:30"); se acepta también el antiguo con espacio
// ("Lunes 07:30") y días sin tilde. Mismo criterio que backend/src/lib/horario.js.

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const sinTildes = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Devuelve { dia, hora } (dia de DIAS_SEMANA, hora "HH:MM") o { dia: null, hora: null }
export function leerHorario(valor) {
  const m = /^\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s*[-\s]\s*(\d{1,2}):(\d{2})\s*$/.exec(typeof valor === 'string' ? valor : '');
  if (!m) return { dia: null, hora: null };
  const dia = DIAS_SEMANA.find((d) => sinTildes(d) === sinTildes(m[1])) ?? null;
  return { dia, hora: dia ? `${m[2].padStart(2, '0')}:${m[3]}` : null };
}

// Agrupa clases por día (lunes a viernes), ordenadas por hora
export function agruparPorDia(clases, obtenerHorario = (c) => c.horario) {
  const porDia = Object.fromEntries(DIAS_SEMANA.map((d) => [d, []]));
  for (const clase of clases) {
    const { dia, hora } = leerHorario(obtenerHorario(clase));
    if (dia) porDia[dia].push({ ...clase, hora });
  }
  for (const dia of DIAS_SEMANA) porDia[dia].sort((a, b) => a.hora.localeCompare(b.hora));
  return porDia;
}
