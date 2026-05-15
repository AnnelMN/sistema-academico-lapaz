import React from 'react';
import { UserPlus, Download, Bell, Key } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-bold text-[#1a1a2e]">Panel Administrativo</h2>
          <p className="text-[11px] text-slate-400">Control de matrícula, usuarios y reportes institucionales</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Estudiantes</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">487</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Profesores</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">24</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Usuarios sist.</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">31</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pendientes</div>
          <div className="text-[22px] font-bold text-[#ef4444]">12</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Course Progress */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Estado de matrícula por curso</div>
          <div className="space-y-3">
            {[
              { curso: '1ro A', total: 82, estado: 'Completo', color: '#16a34a' },
              { curso: '2do A', total: 78, estado: 'Completo', color: '#16a34a' },
              { curso: '3ro A', total: 84, estado: 'En proceso', color: '#f59e0b' },
              { curso: '4to A', total: 80, estado: 'Completo', color: '#16a34a' },
              { curso: '5to A', total: 76, estado: 'Completo', color: '#16a34a' },
              { curso: '6to A', total: 87, estado: 'Pendiente', color: '#ef4444' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-[12px] font-bold text-[#1a1a2e] w-12 inline-block">{item.curso}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{item.total} estudiantes</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.estado}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tasks & Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Tareas críticas</div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1 h-8 bg-[#ef4444] rounded-full"></div>
                <div>
                  <div className="text-[11px] font-bold text-[#1a1a2e]">Completar matrícula 6to A</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Vence en 2 días</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 h-8 bg-[#f59e0b] rounded-full"></div>
                <div>
                  <div className="text-[11px] font-bold text-[#1a1a2e]">Actualizar contactos 3ro A</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Vence mañana</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 h-8 bg-[#4a90e2] rounded-full"></div>
                <div>
                  <div className="text-[11px] font-bold text-[#1a1a2e]">Generar reporte asistencia Marzo</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Pendiente</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Actividad reciente</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1">
                <UserPlus size={14} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-[11px] text-[#1a1a2e]"><span className="font-bold">Nuevo estudiante</span> matriculado en 2do A</div>
                  <div className="text-[9px] text-slate-400">Hace 15 min</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Download size={14} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-[11px] text-[#1a1a2e]"><span className="font-bold">Reporte de notas</span> exportado por Director</div>
                  <div className="text-[9px] text-slate-400">Hoy, 08:45</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Key size={14} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-[11px] text-[#1a1a2e]"><span className="font-bold">Contraseña restablecida</span> — Prof. Lima</div>
                  <div className="text-[9px] text-slate-400">Ayer, 11:30</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
