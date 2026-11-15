import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';

const AdminLayout = () => {
  const menuGroups = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard',       path: '/administrativo',               dotHex: '#007AFF', exact: true },
      ]
    },
      {
        title: 'Gestión',
        items: [
          { label: 'Cursos', path: '/administrativo/cursos', dotHex: '#FF9500' },
          { label: 'Materias', path: '/administrativo/materias', dotHex: '#FF9500' },
          { label: 'Horarios', path: '/administrativo/horarios', dotHex: '#34C759' },
        ]
      }
  ];

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      headerTitle="Panel Administrativo"
      headerSubtitle="U.E. La Paz 'A' · Gestión 2026"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default AdminLayout;
