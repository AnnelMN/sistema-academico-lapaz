import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#4a90e2]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Redirigir al dashboard correcto según el rol del usuario
    switch (user.rol) {
      case 'DIRECTOR':
        return <Navigate to="/director" replace />;
      case 'PROFESOR':
        return <Navigate to="/profesor" replace />;
      case 'ADMINISTRATIVO':
        return <Navigate to="/administrativo" replace />;
      case 'ESTUDIANTE':
        return <Navigate to="/estudiante" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;
