import api from './api';

export const getEstadoPredicciones = async () => {
  const response = await api.get('/api/predicciones/estado');
  return response.data;
};

export const getPrediccionesEstudiantes = async (params = {}) => {
  const response = await api.get('/api/predicciones/estudiantes', { params });
  return response.data;
};

// Riesgo de los estudiantes de los cursos del docente autenticado (solo PROFESOR)
export const getPrediccionesProfesor = async (materiaProgramadaId = '') => {
  const response = await api.get('/api/predicciones/profesor', {
    params: materiaProgramadaId ? { materiaProgramadaId } : {},
  });
  return response.data;
};
