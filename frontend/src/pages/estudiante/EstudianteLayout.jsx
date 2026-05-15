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
        { label: 'Inicio', path: '/estudiante', dotColor: 'bg-[#60a5fa]', exact: true },
        { label: 'Mis notas', path: '/estudiante/notas', dotColor: 'bg-[#fb923c]' },
        { label: 'Mi horario', path: '/estudiante/horario', dotColor: 'bg-[#fbbf24]' },
        { label: 'Mi asistencia', path: '/estudiante/asistencia', dotColor: 'bg-[#34d399]' },
        { label: 'Mi predicción', path: '/estudiante/prediccion', dotColor: 'bg-[#a78bfa]' },
      ]
    }
  ];

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#1a4731]"
      headerTitle={`Bienvenido, ${user?.nombre?.split(' ')[0] || 'Estudiante'}`}
      headerSubtitle="3ro A · Gestión 2026"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default EstudianteLayout;
