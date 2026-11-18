const { esProduccion } = require('../config/entorno');

// La predicción automática está PAUSADA salvo que IA_HABILITADA=true.
// Motivo: el modelo actual se entrenó con un dataset que no corresponde al colegio
// y sus resultados no son confiables. Mientras esté pausada no se guardan
// predicciones nuevas ni se envían correos de Riesgo Alto (los de exceso de
// faltas sí se siguen enviando, porque no dependen de la IA).
const iaHabilitada = () => process.env.IA_HABILITADA === 'true';

exports.iaHabilitada = iaHabilitada;

// Respuesta común cuando las predicciones están pausadas (no se envía ningún dato de riesgo)
exports.PREDICCION_NO_DISPONIBLE = Object.freeze({
  disponible: false,
  mensaje: 'Predicción no disponible por ahora',
});

exports.predecirRiesgo = async ({ totalScore, attendancePercentage }) => {
  if (!iaHabilitada()) {
    return null;
  }

  // localhost solo como respaldo en desarrollo; en producción la URL es obligatoria
  const iaServiceUrl = process.env.IA_SERVICE_URL || (esProduccion() ? null : 'http://localhost:8000');
  if (!iaServiceUrl) throw new Error('IA_SERVICE_URL no está configurada');
  
  const payload = {
    attendance_percentage: attendancePercentage,
    total_score: totalScore,
    class_participation: 5.0, // Valor por defecto solicitado
    weekly_self_study_hours: 10.0 // Valor por defecto solicitado
  };

  // Clave compartida con el microservicio (solo el backend puede pedir predicciones)
  const iaApiKey = process.env.IA_API_KEY;
  if (!iaApiKey) throw new Error('IA_API_KEY no está configurada');

  try {
    const response = await fetch(`${iaServiceUrl}/predecir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': iaApiKey,
      },
      body: JSON.stringify(payload),
      // El ciclo nota → predicción debe completarse en menos de 5 segundos
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Intentar obtener detalle del error si existe
      let errorDetail = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch (e) {}
      throw new Error(`Error en el microservicio IA (${response.status}): ${errorDetail}`);
    }

    const data = await response.json();
    return data; // { nivel_riesgo: "...", probabilidad: 0.XX }
  } catch (error) {
    console.error('Error al comunicarse con el microservicio IA:', error);
    throw error;
  }
};
