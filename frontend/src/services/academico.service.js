import api from './api';

export const getMaterias = async () => {
  const response = await api.get('/api/academico/materias');
  return response.data;
};

export const createMateria = async (materiaData) => {
  const response = await api.post('/api/academico/materias', materiaData);
  return response.data;
};

export const getCursos = async () => {
  const response = await api.get('/api/academico/cursos');
  return response.data;
};

export const getDocentes = async () => {
  const response = await api.get('/api/academico/docentes');
  return response.data;
};

export const getProgramaciones = async (cursoId = null) => {
  const params = cursoId ? { cursoId } : {};
  const response = await api.get('/api/academico/programaciones', { params });
  return response.data;
};

export const createProgramacion = async (programacionData) => {
  const response = await api.post('/api/academico/programaciones', programacionData);
  return response.data;
};
