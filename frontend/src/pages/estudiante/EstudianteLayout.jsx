import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { useAuth } from '../../context/AuthContext';

const EstudianteLayout = () => {
  const { user } = useAuth();

  const menuGroups = [
    {
      title: 'Mi Portal',
      items: [
        { label: 'Inicio',        path: '/estudiante',             dotHex: '#007AFF', exact: true },
        { label: 'Mis notas',     path: '/estudiante/notas',       dotHex: '#FF9500' },
        { label: 'Mi horario',    path: '/estudiante/horario',     dotHex: '#34C759' },
        { label: 'Mi asistencia', path: '/estudiante/asistencia',  dotHex: '#FF3B30' },
        { label: 'Mi código QR',  path: '/estudiante/qr',          dotHex: '#5856D6' },
        { label: 'Mi predicción', path: '/estudiante/prediccion',  dotHex: '#AF52DE' },
      ]
    }
  ];

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      headerTitle={`Bienvenido, ${user?.nombre?.split(' ')[0] || 'Estudiante'}`}
      headerSubtitle="3ro A · Gestión 2026"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default EstudianteLayout;
