import api from './api';

export const getUsuarios = async () => {
  const response = await api.get('/api/usuarios');
  return response.data;
};

export const createUsuario = async (userData) => {
  const response = await api.post('/api/usuarios', userData);
  return response.data;
};

export const updateUsuario = async (id, userData) => {
  const response = await api.put(`/api/usuarios/${id}`, userData);
  return response.data;
};

export const toggleEstadoUsuario = async (id) => {
  const response = await api.patch(`/api/usuarios/${id}/estado`);
  return response.data;
};
