import api from './api';

export const getMisMaterias = async () => {
  const response = await api.get('/api/notas/mis-materias');
  return response.data;
};

export const getNotasEstudiantes = async (materiaProgramadaId, trimestre) => {
  const response = await api.get(`/api/notas/estudiantes`, {
    params: { materiaProgramadaId, trimestre }
  });
  return response.data;
};

export const upsertNota = async (data) => {
  const response = await api.post('/api/notas', data);
  return response.data;
};
