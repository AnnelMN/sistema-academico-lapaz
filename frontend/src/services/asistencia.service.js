import api from './api';

export const getEstudiantesConAsistencia = async (materiaProgramadaId, fecha) => {
  const response = await api.get('/api/asistencia/estudiantes', {
    params: { materiaProgramadaId, fecha }
  });
  return response.data;
};

export const registrarAsistencia = async (data) => {
  const response = await api.post('/api/asistencia', data);
  return response.data;
};

export const getHistorialAsistencia = async (estudianteId, materiaProgramadaId) => {
  const response = await api.get('/api/asistencia/historial', {
    params: { estudianteId, materiaProgramadaId }
  });
  return response.data;
};

// Registro rápido por QR: el servidor valida el código y marca PRESENTE de hoy.
// Respuesta: { resultado: 'REGISTRADO' | 'YA_REGISTRADO', estudiante: { id, nombre }, estado, fecha, resumen }
export const registrarAsistenciaQR = async (materiaProgramadaId, codigo) => {
  const response = await api.post('/api/asistencia/qr', { materiaProgramadaId, codigo });
  return response.data;
};
