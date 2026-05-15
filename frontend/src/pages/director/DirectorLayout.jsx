import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BookOpen, Calendar, Sparkles, Settings } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';

const DirectorLayout = () => {
  const [trimestre, setTrimestre] = useState('1er Trimestre 2026');

  const menuGroups = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard', path: '/director', dotColor: 'bg-[#60a5fa]', exact: true },
        { label: 'Horarios', path: '/director/horarios', dotColor: 'bg-[#fbbf24]' },
      ]
    },
    {
      title: 'Académico',
      items: [
        { label: 'Asistencia', path: '/director/asistencia', dotColor: 'bg-[#34d399]' },
        { label: 'Notas', path: '/director/notas', dotColor: 'bg-[#fb923c]' },
        { label: 'Predicción IA', path: '/director/predicciones', dotColor: 'bg-[#a78bfa]' },
      ]
    },
    {
      title: 'Admin',
      items: [
        { label: 'Usuarios',       path: '/director/usuarios',       dotColor: 'bg-[#2dd4bf]' },
        { label: 'Notificaciones', path: '/director/notificaciones', dotColor: 'bg-[#fbbf24]' },
        { label: 'Reportes',       path: '/director/reportes',       dotColor: 'bg-[#9ca3af]' },
      ]
    }
  ];


  const headerRightContent = (
    <select 
      value={trimestre}
      onChange={(e) => setTrimestre(e.target.value)}
      className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
    >
      <option>1er Trimestre 2026</option>
      <option>2do Trimestre 2026</option>
      <option>3er Trimestre 2026</option>
    </select>
  );

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#1e3a5f]"
      headerTitle="Panel institucional"
      headerSubtitle="Gestión escolar 2026 · Turno mañana"
      headerRightContent={headerRightContent}
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default DirectorLayout;
