import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';

const AdminLayout = () => {
  const menuGroups = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard', path: '/administrativo', dotColor: 'bg-[#60a5fa]', exact: true },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { label: 'Usuarios y roles', path: '/administrativo/usuarios', dotColor: 'bg-[#2dd4bf]' },
        { label: 'Reportes', path: '/administrativo/reportes', dotColor: 'bg-[#9ca3af]' },
        { label: 'Notificaciones', path: '/administrativo/notificaciones', dotColor: 'bg-[#fbbf24]' },
      ]
    },
    {
      title: 'Académico',
      items: [
        { label: 'Horarios', path: '/administrativo/horarios', dotColor: 'bg-[#fb923c]' },
        { label: 'Asistencia', path: '/administrativo/asistencia', dotColor: 'bg-[#34d399]' },
      ]
    }
  ];

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#4a2c0a]"
      headerTitle="Panel Administrativo"
      headerSubtitle="U.E. La Paz 'A' · Gestión 2026"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default AdminLayout;

