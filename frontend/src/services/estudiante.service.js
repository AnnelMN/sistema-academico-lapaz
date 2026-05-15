import api from './api';

const estudianteService = {
  getMisNotas: async (trimestre = 1) => {
    const response = await api.get(`/estudiante/notas?trimestre=${trimestre}`);
    return response.data;
  },

  getMiHorario: async () => {
    const response = await api.get('/estudiante/horario');
    return response.data;
  },

  getMiAsistencia: async () => {
    const response = await api.get('/estudiante/asistencia');
    return response.data;
  },

  getMiPrediccion: async () => {
    const response = await api.get('/estudiante/prediccion');
    return response.data;
  }
};

export default estudianteService;
