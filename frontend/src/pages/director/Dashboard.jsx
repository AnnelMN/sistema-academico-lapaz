import React from 'react';
import { Download } from 'lucide-react';

const DirectorDashboard = () => {
  return (
    <div className="space-y-6">
      
      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-[18px] font-bold text-[#1a1a2e]">Panel general — Director</h2>
        <p className="text-[11px] text-slate-400">Gestión escolar 2026 · Trimestre 1</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">Total estudiantes</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">487</div>
          <div className="bg-[#dbeafe] text-[#1e40af] text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">6 cursos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">Tasa aprobación</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">78%</div>
          <div className="bg-[#d1fae5] text-[#065f46] text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">+3% vs 2025</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">En riesgo alto</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">34</div>
          <div className="bg-[#fee2e2] text-[#991b1b] text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">7% del total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">Asistencia media</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">91%</div>
          <div className="bg-[#fef3c7] text-[#92400e] text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">Trimestre 1</div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Aprobación por Curso */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Aprobación por curso — T1</div>
          <div className="space-y-3">
            {[
              { label: '1ro A', val: 85, color: '#4a90e2' },
              { label: '2do A', val: 79, color: '#4a90e2' },
              { label: '3ro A', val: 72, color: '#ef4444' },
              { label: '4to A', val: 81, color: '#4a90e2' },
              { label: '5to A', val: 76, color: '#f59e0b' },
              { label: '6to A', val: 83, color: '#4a90e2' },
            ].map((course, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 text-[11px] text-slate-500 font-bold">{course.label}</div>
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${course.val}%`, backgroundColor: course.color }}></div>
                </div>
                <div className="w-8 text-right text-[11px] text-slate-500 font-bold">{course.val}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Estudiantes en Riesgo */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Estudiantes en riesgo alto</div>
          <div className="divide-y divide-slate-50">
            {[
              { name: 'Juan Mamani', info: '3ro A · Matemáticas', risk: 'Alto', riskClass: 'bg-[#fee2e2] text-[#b91c1c]' },
              { name: 'María Quispe', info: '3ro A · Física', risk: 'Alto', riskClass: 'bg-[#fee2e2] text-[#b91c1c]' },
              { name: 'Carlos Flores', info: '5to A · Química', risk: 'Medio', riskClass: 'bg-[#fef3c7] text-[#92400e]' },
              { name: 'Ana Condori', info: '2do A · Lenguaje', risk: 'Medio', riskClass: 'bg-[#fef3c7] text-[#92400e]' },
            ].map((student, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5">
                <div>
                  <div className="text-[11px] font-bold text-[#1a1a2e]">{student.name}</div>
                  <div className="text-[10px] text-slate-400">{student.info}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${student.riskClass}`}>
                  {student.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-2 pt-2">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          <Download size={14} /> Reporte institucional PDF
        </button>
      </div>

    </div>
  );
};

export default DirectorDashboard;
