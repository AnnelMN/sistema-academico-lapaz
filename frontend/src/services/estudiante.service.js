import api from './api';

const estudianteService = {
  // { gestion, trimestre, trimestreActivo, umbralAprobacion, materias: [...] }
  // Sin trimestre: el servidor usa el trimestre activo
  getMisNotas: async (trimestre = null) => {
    const response = await api.get('/api/estudiante/notas', { params: trimestre ? { trimestre } : {} });
    return response.data;
  },

  getMiHorario: async () => {
    const response = await api.get('/api/estudiante/horario');
    return response.data;
  },

  getMiAsistencia: async () => {
    const response = await api.get('/api/estudiante/asistencia');
    return response.data;
  },

  getMiPrediccion: async () => {
    const response = await api.get('/api/estudiante/prediccion');
    return response.data;
  }
};

export default estudianteService;
