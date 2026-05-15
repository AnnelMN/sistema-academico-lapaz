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
        { label: 'Dashboard', path: '/profesor', dotColor: 'bg-[#60a5fa]', exact: true },
        { label: 'Registrar notas', path: '/profesor/notas', dotColor: 'bg-[#fb923c]' },
        { label: 'Asistencia', path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
      ]
    },
    {
      title: 'Consultas',
      items: [
        { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
        { label: 'Mi horario', path: '/profesor/horario', dotColor: 'bg-[#fbbf24]' },
        { label: 'Reportes', path: '/profesor/reportes', dotColor: 'bg-[#9ca3af]' },
      ]
    }
  ];

  const headerRightContent = (
    <div className="flex gap-2">
      <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-600 font-semibold text-[11px] flex items-center">
        <Download size={14} className="mr-2" /> Exportar PDF
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
      sidebarColor="bg-[#8B0000]"
      headerTitle="Registro de asistencia"
      headerSubtitle="Prof. Laura Rojas · 3ro A · Matemáticas · 08:00"
      headerRightContent={headerRightContent}
    >
      <div className="space-y-6">
        
        {/* KPI Cards for Attendance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
            <div className="text-[22px] font-bold text-[#16a34a]">4</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Presentes</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
            <div className="text-[22px] font-bold text-[#ef4444]">1</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ausentes</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
            <div className="text-[22px] font-bold text-[#f59e0b]">1</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Justificados</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
            <div className="text-[22px] font-bold text-[#9ca3af]">0</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sin marcar</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
          <select className="border border-slate-200 rounded-md px-3 py-1.5 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 min-w-[200px]">
            <option>3ro A — Matemáticas</option>
          </select>
          <select className="border border-slate-200 rounded-md px-3 py-1.5 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500">
            <option>Lunes 22/03</option>
          </select>
          <button className="bg-[#4a90e2] text-white text-[11px] font-bold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Guardar asistencia
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">
            Marcar todos presente
          </button>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Justificación</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia %</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faltas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {estudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{est.nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <div className="inline-flex rounded-md overflow-hidden border border-slate-200">
                        <button 
                          onClick={() => handleEstadoChange(est.id, 'P')}
                          className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 ${
                            est.estado === 'P' ? 'bg-[#d1fae5] text-[#065f46] border-[#34d399]' : 'bg-white text-slate-400'
                          }`}
                        >P</button>
                        <button 
                          onClick={() => handleEstadoChange(est.id, 'A')}
                          className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold border-r border-slate-200 ${
                            est.estado === 'A' ? 'bg-[#fee2e2] text-[#b91c1c] border-[#f87171]' : 'bg-white text-slate-400'
                          }`}
                        >A</button>
                        <button 
                          onClick={() => handleEstadoChange(est.id, 'J')}
                          className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold ${
                            est.estado === 'J' ? 'bg-[#fef3c7] text-[#92400e] border-[#fbbf24]' : 'bg-white text-slate-400'
                          }`}
                        >J</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 italic">Motivo...</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col w-24">
                      <div className="text-[11px] font-bold text-slate-600 mb-1">{est.asistencia}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${est.asistencia < 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${est.asistencia}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{est.faltas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* IA Alert Banner */}
        <div className="bg-[#fffbeb] border border-[#fcd34d] p-3 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} className="text-[#92400e]" />
          <div className="text-[11px] text-[#92400e]">
            <span className="font-bold uppercase tracking-tight mr-2">Aviso de riesgo:</span>
            El sistema ha detectado 2 estudiantes con tendencia de inasistencia crítica. Se sugiere revisión pedagógica.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfesorDashboard;
