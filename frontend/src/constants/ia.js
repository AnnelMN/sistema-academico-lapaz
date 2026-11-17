// Texto que se muestra mientras las predicciones de IA están pausadas
// (aún no hay datos válidos para entrenar el modelo).
export const MENSAJE_IA_NO_DISPONIBLE = 'Predicción no disponible por ahora';

// El backend responde { disponible: false } cuando las predicciones están pausadas.
export const prediccionNoDisponible = (data) => data?.disponible === false;
