exports.predecirRiesgo = async ({ totalScore, attendancePercentage }) => {
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
