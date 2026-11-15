import api from './api';

export const getPrediccionesEstudiantes = async (params = {}) => {
  const response = await api.get('/api/predicciones/estudiantes', { params });
  return response.data;
};
