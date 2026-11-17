import SidebarLayout from '../../components/layout/SidebarLayout';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';

// Esta página mostraba datos de ejemplo (estudiantes y métricas inventadas).
// Se reemplazó por el aviso de "Predicción no disponible por ahora" mientras el
// modelo de IA no tenga datos válidos para entrenarse.
// Pendiente (cuando se habilite la IA): endpoint de predicciones limitado a los
// cursos del docente — hoy /api/predicciones/estudiantes es solo para el Director.

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',            dotColor: 'bg-[#60a5fa]', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',      dotColor: 'bg-[#fb923c]' },
      { label: 'Asistencia',      path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
    ]
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
      { label: 'Mi horario',    path: '/profesor/horario',       dotColor: 'bg-[#fbbf24]' },
      { label: 'Reportes',      path: '/profesor/reportes',      dotColor: 'bg-[#9ca3af]' },
    ]
  }
];

export default function PrediccionIA() {
  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Predicción IA de Riesgo"
      headerSubtitle="Gestión 2026"
    >
      <PrediccionNoDisponible />
    </SidebarLayout>
  );
}
