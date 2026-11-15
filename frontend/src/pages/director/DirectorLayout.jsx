import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';

const DirectorLayout = () => {
  const [trimestre, setTrimestre] = useState('1er Trimestre 2026');

  const menuGroups = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard',    path: '/director',             dotHex: '#007AFF', exact: true },
        { label: 'Horarios',     path: '/director/horarios',    dotHex: '#FF9500' },
        { label: 'Asistencia',   path: '/director/asistencia',  dotHex: '#34C759' },
        { label: 'Notas',        path: '/director/notas',       dotHex: '#FF9500' },
        { label: 'Predicción IA',path: '/director/predicciones', dotHex: '#AF52DE' },
        { label: 'Reportes',     path: '/director/reportes',    dotHex: '#8E8E93' },
      ]
    },
    {
      title: 'Administración',
      items: [
        { label: 'Usuarios',       path: '/director/usuarios',       dotHex: '#007AFF' },
        { label: 'Notificaciones', path: '/director/notificaciones',  dotHex: '#FF9500' },
      ]
    }
  ];

  const headerRightContent = (
    <select
      value={trimestre}
      onChange={(e) => setTrimestre(e.target.value)}
      className="ios-select"
    >
      <option>1er Trimestre 2026</option>
      <option>2do Trimestre 2026</option>
      <option>3er Trimestre 2026</option>
    </select>
  );

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      headerTitle="Panel institucional"
      headerSubtitle="Gestión escolar 2026 · Turno mañana"
      headerRightContent={headerRightContent}
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default DirectorLayout;
