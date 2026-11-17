// La predicción automática está PAUSADA salvo que IA_HABILITADA=true.
// Motivo: el modelo actual se entrenó con un dataset que no corresponde al colegio
// y sus resultados no son confiables. Mientras esté pausada no se guardan
// predicciones nuevas ni se envían correos de Riesgo Alto (los de exceso de
// faltas sí se siguen enviando, porque no dependen de la IA).
const iaHabilitada = () => process.env.IA_HABILITADA === 'true';

exports.iaHabilitada = iaHabilitada;

exports.predecirRiesgo = async ({ totalScore, attendancePercentage }) => {
  if (!iaHabilitada()) {
    return null;
  }

  const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://localhost:8000';
  
  const payload = {
    attendance_percentage: attendancePercentage,
    total_score: totalScore,
    class_participation: 5.0, // Valor por defecto solicitado
    weekly_self_study_hours: 10.0 // Valor por defecto solicitado
  };

  try {
    const response = await fetch(`${iaServiceUrl}/predecir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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
