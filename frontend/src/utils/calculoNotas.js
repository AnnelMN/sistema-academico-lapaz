// Vista previa del cálculo de notas mientras el docente escribe.
// Es una copia de backend/src/services/calificacionService.js: el SERVIDOR siempre
// recalcula al guardar y su resultado es el oficial.

export const PESOS = Object.freeze({ SER: 10, SABER: 45, HACER: 40 });
export const DIMENSIONES = Object.freeze(['SER', 'SABER', 'HACER']);
export const MAX_AUTOEVALUACION = 5;

// Claves del borrador de la planilla
export const claveCelda = (estudianteId, casillaId) => `${estudianteId}|${casillaId}`;
export const claveAuto = (estudianteId) => `auto|${estudianteId}`;

// a / b redondeado a entero (0,5 sube) usando solo enteros
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));

const puntajeDimension = (valores, peso) => {
  if (!valores.length) return 0;
  const suma = valores.reduce((s, v) => s + v, 0);
  return dividirRedondeando(suma * peso, valores.length * 100);
};

/**
 * casillas:        [{ id, dimension, esAsistencia }]
 * valorDe:         (casillaId) => entero 0–100 o null para ESTE estudiante
 * calificadas:     Set de casillaId con nota para al menos un estudiante
 * asistencia:      valor 0–100 de la casilla de asistencia o null
 * autoevaluacion:  entero 0–5 o null
 */
export function calcularFila({ casillas, valorDe, calificadas, asistencia, autoevaluacion, umbral = 51 }) {
  const puntajes = {};
  for (const dimension of DIMENSIONES) {
    const valores = [];
    for (const c of casillas) {
      if (c.dimension !== dimension) continue;
      if (c.esAsistencia) {
        if (asistencia !== null && asistencia !== undefined) valores.push(asistencia);
      } else if (calificadas.has(c.id)) {
        valores.push(valorDe(c.id) ?? 0);
      }
    }
    puntajes[dimension] = puntajeDimension(valores, PESOS[dimension]);
  }
  const auto = Number.isInteger(autoevaluacion) ? autoevaluacion : 0;
  const total = puntajes.SER + puntajes.SABER + puntajes.HACER + auto;
  return { ...puntajes, total, aprobado: total >= umbral };
}

// Convierte lo escrito en una celda: '' → null; entero en rango → número; otro → NaN (inválido)
export function leerEntero(texto, max) {
  if (texto === '' || texto === null || texto === undefined) return null;
  if (!/^\d+$/.test(String(texto).trim())) return Number.NaN;
  const n = Number(texto);
  return n >= 0 && n <= max ? n : Number.NaN;
}
