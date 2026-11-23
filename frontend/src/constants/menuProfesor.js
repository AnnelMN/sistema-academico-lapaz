// Menú lateral del docente (mismas opciones en todas sus pantallas)
export const MENU_PROFESOR = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',             dotHex: '#007AFF', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',       dotHex: '#FF9500' },
      { label: 'Asistencia',      path: '/profesor/asistencia',  dotHex: '#34C759' },
    ],
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA',   path: '/profesor/predicciones', dotHex: '#AF52DE' },
      { label: 'Mi horario',      path: '/profesor/horario',      dotHex: '#FF9500' },
      { label: 'Reportes',        path: '/profesor/reportes',     dotHex: '#8E8E93' },
    ],
  },
];
