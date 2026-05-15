import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PrivateRoute from './routes/PrivateRoute';
import DirectorLayout from './pages/director/DirectorLayout';
import DirectorDashboard from './pages/director/Dashboard';
import Usuarios from './pages/director/Usuarios';
import ProfesorDashboard from './pages/profesor/Dashboard';
import RegistroNotas from './pages/profesor/RegistroNotas';
import RegistroAsistencia from './pages/profesor/RegistroAsistencia';
import PrediccionIA from './pages/profesor/PrediccionIA';
import AdminLayout from './pages/administrativo/AdminLayout';
import AdminDashboard from './pages/administrativo/Dashboard';
import Horarios from './pages/administrativo/Horarios';
import Notificaciones from './pages/shared/Notificaciones';


import EstudianteDashboard from './pages/estudiante/Dashboard';
import EstudianteLayout from './pages/estudiante/EstudianteLayout';
import Notas from './pages/estudiante/Notas';
import Horario from './pages/estudiante/Horario';
import Asistencia from './pages/estudiante/Asistencia';
import Prediccion from './pages/estudiante/Prediccion';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Ruta pública */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* Redirección raíz */}
      <Route 
        path="/" 
        element={
          <PrivateRoute />
        } 
      />

      {/* Rutas protegidas por Rol */}
      <Route element={<PrivateRoute allowedRoles={['DIRECTOR']} />}>
        <Route path="/director" element={<DirectorLayout />}>
          <Route index element={<DirectorDashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['PROFESOR']} />}>
        <Route path="/profesor" element={<ProfesorDashboard />} />
        <Route path="/profesor/notas" element={<RegistroNotas />} />
        <Route path="/profesor/asistencia" element={<RegistroAsistencia />} />
        <Route path="/profesor/predicciones" element={<PrediccionIA />} />
      </Route>

      <Route element={<PrivateRoute allowedRoles={['ADMINISTRATIVO']} />}>
        <Route path="/administrativo" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="horarios" element={<Horarios />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['ESTUDIANTE']} />}>
        <Route path="/estudiante" element={<EstudianteLayout />}>
          <Route index element={<EstudianteDashboard />} />
          <Route path="notas" element={<Notas />} />
          <Route path="horario" element={<Horario />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="prediccion" element={<Prediccion />} />
        </Route>
      </Route>

      {/* Ruta por defecto (404 catch-all) que redirige al login o al dashboard correspondiente */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
