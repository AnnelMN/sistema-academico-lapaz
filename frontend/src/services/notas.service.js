import api from './api';

// Materias del docente autenticado (o todas, para el Director)
export const getMisMaterias = async () => {
  const response = await api.get('/api/notas/mis-materias');
  return response.data;
};

// Trimestre activo según las fechas configuradas: { gestion, trimestre, fechaInicio, fechaFin } o { trimestre: null }
export const getPeriodoActual = async () => {
  const response = await api.get('/api/notas/periodo-actual');
  return response.data;
};

// Planilla de una materia y trimestre: casillas + estudiantes con sus cálculos
export const getPlanilla = async (materiaProgramadaId, trimestre) => {
  const response = await api.get('/api/notas/planilla', {
    params: { materiaProgramadaId, ...(trimestre ? { trimestre } : {}) },
  });
  return response.data;
};

// Configura las casillas: { materiaProgramadaId, casillas: { SER: [{ id?, nombre }], SABER: [...], HACER: [...] }, confirmarEliminacion? }
export const guardarCasillas = async (datos) => {
  const response = await api.put('/api/notas/casillas', datos);
  return response.data;
};

// Guarda notas: { materiaProgramadaId, calificaciones: [{ estudianteId, casillaId, valor }], autoevaluaciones: [{ estudianteId, valor }] }
export const guardarCalificaciones = async (datos) => {
  const response = await api.put('/api/notas/calificaciones', datos);
  return response.data;
};
