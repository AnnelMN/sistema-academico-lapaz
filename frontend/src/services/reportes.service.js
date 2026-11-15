import api from './api';

export const getReporteConsolidado = async (params = {}) => {
  const response = await api.get('/api/reportes/consolidado', { params });
  return response.data;
};
