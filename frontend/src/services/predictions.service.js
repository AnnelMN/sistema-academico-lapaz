import api from './api';

export const getEstadoPredicciones = async () => {
  const response = await api.get('/api/predicciones/estado');
  return response.data;
};

export const getPrediccionesEstudiantes = async (params = {}) => {
  const response = await api.get('/api/predicciones/estudiantes', { params });
  return response.data;
};
