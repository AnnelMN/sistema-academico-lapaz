import React, { useState } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar, AlertTriangle } from 'lucide-react';

// Mock data based on the design
const estudiantesAsistencia = [
  { id: 1, nombre: 'Mamani, Juan C.', estado: 'P', asistencia: 84, faltas: 5, riesgo: 'Alto' },
  { id: 2, nombre: 'Quispe, María E.', estado: 'P', asistencia: 92, faltas: 2, riesgo: 'Bajo' },
  { id: 3, nombre: 'Flores, Carlos A.', estado: 'A', asistencia: 88, faltas: 3, riesgo: 'Medio' },
  { id: 4, nombre: 'Condori, Ana P.', estado: 'P', asistencia: 97, faltas: 1, riesgo: 'Bajo' },
  { id: 5, nombre: 'Vargas, Luis M.', estado: 'J', asistencia: 79, faltas: 6, riesgo: 'Alto' },
];

const ProfesorDashboard = () => {
  const { user } = useAuth();
  const [estudiantes, setEstudiantes] = useState(estudiantesAsistencia);

  const menuGroups = [
    {
      title: 'Mi Panel',
      items: [
        { label: 'Dashboard',      path: '/profesor',             dotHex: '#007AFF', exact: true },
        { label: 'Registrar notas',path: '/profesor/notas',        dotHex: '#FF9500' },
        { label: 'Asistencia',     path: '/profesor/asistencia',  dotHex: '#34C759' },
      ]
    },
    {
      title: 'Consultas',
      items: [
        { label: 'Predicción IA',  path: '/profesor/predicciones', dotHex: '#AF52DE' },
        { label: 'Mi horario',     path: '/profesor/horario',       dotHex: '#FF9500' },
        { label: 'Reportes',       path: '/profesor/reportes',      dotHex: '#8E8E93' },
      ]
    }
  ];

  const headerRightContent = (
    <div className="flex gap-2">
      <button className="ios-btn-ghost text-[12px]">
        <Download size={14} /> Exportar PDF
      </button>
    </div>
  );

  const handleEstadoChange = (id, nuevoEstado) => {
    setEstudiantes(estudiantes.map(est => 
      est.id === id ? { ...est, estado: nuevoEstado } : est
    ));
  };

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      headerTitle="Registro de asistencia"
      headerSubtitle="Prof. Laura Rojas · 3ro A · Matemáticas · 08:00"
      headerRightContent={headerRightContent}
    >
      <div className="space-y-6">
        
        {/* KPI Cards for Attendance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="ios-card p-4 text-center">
            <div className="text-[26px] font-bold" style={{ color: 'var(--ios-green)' }}>4</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Presentes</div>
          </div>
          <div className="ios-card p-4 text-center">
            <div className="text-[26px] font-bold" style={{ color: 'var(--ios-red)' }}>1</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Ausentes</div>
          </div>
          <div className="ios-card p-4 text-center">
            <div className="text-[26px] font-bold" style={{ color: 'var(--ios-orange)' }}>1</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Justificados</div>
          </div>
          <div className="ios-card p-4 text-center">
            <div className="text-[26px] font-bold" style={{ color: 'var(--ios-tertiary)' }}>0</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Sin marcar</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="ios-card p-4 flex flex-wrap gap-3 items-center">
          <select className="ios-select min-w-[200px]">
            <option>3ro A — Matemáticas</option>
          </select>
          <select className="ios-select">
            <option>Lunes 22/03</option>
          </select>
          <button className="ios-btn-primary text-[12px] py-2.5">
            Guardar asistencia
          </button>
          <button className="ios-btn-ghost text-[12px]">
            Marcar todos presente
          </button>
        </div>

        {/* Attendance Table */}
        <div className="ios-card overflow-hidden">
          <table className="ios-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th className="text-center">Estado</th>
                <th>Justificación</th>
                <th>Asistencia %</th>
                <th>Faltas</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id}>
                  <td className="font-medium">{est.nombre}</td>
                  <td>
                    <div className="flex justify-center">
                      <div className="inline-flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--ios-separator)' }}>
                        <button
                          onClick={() => handleEstadoChange(est.id, 'P')}
                          className="w-8 h-8 flex items-center justify-center text-[11px] font-bold transition-all"
                          style={est.estado === 'P'
                            ? { backgroundColor: 'var(--ios-green-light)', color: '#1A7A38' }
                            : { backgroundColor: 'white', color: 'var(--ios-tertiary)' }
                          }
                        >P</button>
                        <button
                          onClick={() => handleEstadoChange(est.id, 'A')}
                          className="w-8 h-8 flex items-center justify-center text-[11px] font-bold transition-all"
                          style={{
                            borderLeft: '1px solid var(--ios-separator)',
                            borderRight: '1px solid var(--ios-separator)',
                            ...(est.estado === 'A'
                              ? { backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }
                              : { backgroundColor: 'white', color: 'var(--ios-tertiary)' })
                          }}
                        >A</button>
                        <button
                          onClick={() => handleEstadoChange(est.id, 'J')}
                          className="w-8 h-8 flex items-center justify-center text-[11px] font-bold transition-all"
                          style={est.estado === 'J'
                            ? { backgroundColor: 'var(--ios-orange-light)', color: '#A05800' }
                            : { backgroundColor: 'white', color: 'var(--ios-tertiary)' }
                          }
                        >J</button>
                      </div>
                    </div>
                  </td>
                  <td className="italic" style={{ color: 'var(--ios-tertiary)' }}>Motivo...</td>
                  <td>
                    <div className="flex flex-col w-24">
                      <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ios-label)' }}>{est.asistencia}%</div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${est.asistencia}%`,
                            backgroundColor: est.asistencia < 80 ? 'var(--ios-red)' : 'var(--ios-green)'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="font-medium">{est.faltas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* IA Alert Banner */}
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: 'var(--ios-orange-light)' }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--ios-orange)', flexShrink: 0 }} />
          <div className="text-[12px]" style={{ color: '#A05800' }}>
            <span className="font-semibold mr-1">Aviso de riesgo:</span>
            El sistema ha detectado 2 estudiantes con tendencia de inasistencia crítica. Se sugiere revisión pedagógica.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfesorDashboard;
