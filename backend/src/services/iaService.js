const { esProduccion } = require('../config/entorno');
const { esClaveValida } = require('../lib/secretos');

// La predicción automática está PAUSADA salvo que IA_HABILITADA=true.
// El modelo actual se entrenó con el dataset SINTÉTICO (docs/DATASET_SINTETICO.md):
// sus métricas no representan el desempeño real, así que activarla es una
// decisión de la Dirección. Mientras esté pausada no se guardan predicciones ni
// se envían correos de Riesgo Alto (los de exceso de faltas sí, porque no
// dependen de la IA).
const iaHabilitada = () => process.env.IA_HABILITADA === 'true';

exports.iaHabilitada = iaHabilitada;

// Fecha desde la que se usan las predicciones (IA_MODELO_DESDE=AAAA-MM-DD): las
// anteriores se hicieron con el modelo antiguo, que no era válido, y se ignoran
// en las pantallas y en el control de avisos (no se borran de la base de datos).
// Si la fecha no es válida no se muestra ninguna predicción (falla cerrada).
const prediccionesDesde = () => {
  const valor = (process.env.IA_MODELO_DESDE || '').trim();
  if (!valor) return null;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00.000Z`) : null;
  return fecha && !Number.isNaN(fecha.getTime()) ? fecha : new Date(8.64e15);
};
exports.prediccionesDesde = prediccionesDesde;

// Condición para Prisma: solo predicciones del modelo vigente
exports.filtroModeloVigente = () => {
  const desde = prediccionesDesde();
  return desde ? { generadoEn: { gte: desde } } : {};
};

// Respuesta común cuando las predicciones están pausadas (no se envía ningún dato de riesgo)
exports.PREDICCION_NO_DISPONIBLE = Object.freeze({
  disponible: false,
  mensaje: 'Predicción no disponible por ahora',
});

// Variables que espera el modelo (microservicio-ia/main.py), en este orden
const VARIABLES_MODELO = ['promedio_notas', 'porcentaje_asistencia', 'areas_reprobadas', 'nivel', 'trimestre'];
exports.VARIABLES_MODELO = VARIABLES_MODELO;

// variables: resultado de calcularVariablesRiesgo (variablesRiesgoService.js)
exports.predecirRiesgo = async (variables) => {
  if (!iaHabilitada()) {
    return null;
  }

  // localhost solo como respaldo en desarrollo; en producción la URL es obligatoria
  const iaServiceUrl = process.env.IA_SERVICE_URL || (esProduccion() ? null : 'http://localhost:8000');
  if (!iaServiceUrl) throw new Error('IA_SERVICE_URL no está configurada');
  
  // Solo se envían las 5 variables del modelo (el microservicio rechaza campos extra)
  const payload = Object.fromEntries(VARIABLES_MODELO.map((k) => [k, variables?.[k]]));
  if (VARIABLES_MODELO.some((k) => typeof payload[k] !== 'number' || !Number.isFinite(payload[k]))) {
    throw new Error('Variables de riesgo incompletas');
  }

  // Clave compartida con el microservicio (solo el backend puede pedir predicciones)
  const iaApiKey = process.env.IA_API_KEY;
  if (!esClaveValida(iaApiKey)) throw new Error('IA_API_KEY no está configurada o tiene el valor de ejemplo');

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
    console.error('Error al comunicarse con el microservicio IA:', error.message);
    throw error;
  }
};
