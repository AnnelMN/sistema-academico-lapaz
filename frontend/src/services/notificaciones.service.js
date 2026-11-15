import api from './api';

const getNotificaciones = async () => {
  const response = await api.get('/api/notificaciones');
  return response.data;
};

const enviarNotificacionManual = async ({ estudianteId, tipo, mensaje }) => {
  const response = await api.post('/api/notificaciones/manual', { estudianteId, tipo, mensaje });
  return response.data;
};

export default {
  getNotificaciones,
  enviarNotificacionManual,
};
