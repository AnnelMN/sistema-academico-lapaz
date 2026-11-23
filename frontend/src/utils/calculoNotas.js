// Vista previa del cálculo de notas mientras el docente escribe.
// Es una copia de backend/src/services/calificacionService.js: el SERVIDOR siempre
// recalcula al guardar y su resultado es el oficial.

export const PESOS = Object.freeze({ SER: 10, SABER: 45, HACER: 40 });
// Nota máxima de UNA casilla de cada dimensión (igual a los puntos de la dimensión)
export const MAX_CASILLA = PESOS;
export const DIMENSIONES = Object.freeze(['SER', 'SABER', 'HACER']);
export const MAX_AUTOEVALUACION = 5;

// Claves del borrador de la planilla
export const claveCelda = (estudianteId, casillaId) => `${estudianteId}|${casillaId}`;
export const claveAuto = (estudianteId) => `auto|${estudianteId}`;

// a / b redondeado a entero (0,5 sube) usando solo enteros
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));

// Promedio redondeado de las casillas que cuentan (ya están en la escala de la dimensión)
const puntajeDimension = (valores) => {
  if (!valores.length) return 0;
  const suma = valores.reduce((s, v) => s + v, 0);
  return dividirRedondeando(suma, valores.length);
};

/**
 * Regla "Calificación pendiente" (2026-11-23), idéntica al servidor:
 * - si al estudiante le falta CUALQUIER casilla de un componente, o el componente no
 *   tiene casillas, ese componente es null (pendiente); un 0 sí cuenta;
 * - la asistencia sin listas no cuenta (no deja SER pendiente);
 * - la nota final solo existe si los 3 componentes y la autoevaluación están completos.
 * casillas:        [{ id, dimension, esAsistencia }]
 * valorDe:         (casillaId) => entero (SER 0–10, SABER 0–45, HACER 0–40) o null para ESTE estudiante
 * asistencia:      valor 0–10 de la casilla de asistencia o null
 * autoevaluacion:  entero 0–5 o null
 */
export function calcularFila({ casillas, valorDe, asistencia, autoevaluacion, umbral = 51 }) {
  const puntajes = {};
  const pendientes = [];
  for (const dimension of DIMENSIONES) {
    const valores = [];
    let vacias = 0;
    for (const c of casillas) {
      if (c.dimension !== dimension) continue;
      if (c.esAsistencia) {
        if (asistencia !== null && asistencia !== undefined) valores.push(asistencia);
        continue;
      }
      const v = valorDe(c.id);
      if (Number.isInteger(v)) valores.push(v);
      else vacias += 1;
    }
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
  return { ...puntajes, total, aprobado: total === null ? null : total >= umbral, pendientes };
}

// Texto de lo que falta, para mostrar al pasar el mouse
const NOMBRE_PENDIENTE = { SER: 'SER', SABER: 'SABER', HACER: 'HACER', AUTOEVALUACION: 'autoevaluación' };
export const textoPendientes = (pendientes = []) => (pendientes.length
  ? `Falta completar: ${pendientes.map((p) => NOMBRE_PENDIENTE[p] || p).join(', ')}`
  : '');

// Convierte lo escrito en una celda: '' → null; entero en rango → número; otro → NaN (inválido)
export function leerEntero(texto, max) {
  if (texto === '' || texto === null || texto === undefined) return null;
  if (!/^\d+$/.test(String(texto).trim())) return Number.NaN;
  const n = Number(texto);
  return n >= 0 && n <= max ? n : Number.NaN;
}
