import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import estudianteService from '../../services/estudiante.service';
import { Activity, BookOpen, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const EstudianteDashboard = () => {
  const { user } = useAuth();
  
  const [notas, setNotas] = useState([]);
  const [asistencia, setAsistencia] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const [notasData, asistenciaData, prediccionData, horarioData] = await Promise.all([
          estudianteService.getMisNotas(1),
          estudianteService.getMiAsistencia(),
          estudianteService.getMiPrediccion(),
          estudianteService.getMiHorario()
        ]);
        setNotas(notasData);
        setAsistencia(asistenciaData);
        setPrediccion(prediccionData);
        setHorario(horarioData);
      } catch (error) {
        console.error('Error cargando dashboard de estudiante:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDashboard();
  }, []);

  const getStatusChipClass = (estadoStr) => {
    switch (estadoStr) {
      case 'Aprobado': return 'bg-[#d1fae5] text-[#065f46]';
      case 'Riesgo': return 'bg-[#fee2e2] text-[#b91c1c]';
      case 'Atención': return 'bg-[#fef3c7] text-[#92400e]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const calcularEstadoNota = (total) => {
    if (total >= 51) return 'Aprobado';
    if (total >= 40) return 'Atención';
    return 'Riesgo';
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando tu portal estudiantil...</div>;
  }

  // Cálculos de KPIs
  const promedioGeneral = notas.length > 0 
    ? Math.round(notas.reduce((acc, curr) => acc + curr.total, 0) / notas.length)
    : 0;
  
  const materiasAprobadas = notas.filter(n => n.total >= 51).length;
  
  const asistenciaGlobal = asistencia.length > 0
    ? Math.round(asistencia.reduce((acc, curr) => acc + curr.porcentaje, 0) / asistencia.length)
    : 0;

  let estadoGeneralLabel = 'Sin evaluar';
  let estadoGeneralBg = 'bg-slate-100 text-slate-600';
  if (prediccion?.nivelRiesgo === 'RIESGO_ALTO') {
    estadoGeneralLabel = 'En riesgo alto';
    estadoGeneralBg = 'bg-red-100 text-red-700';
  } else if (prediccion?.nivelRiesgo === 'RIESGO_MEDIO') {
    estadoGeneralLabel = 'Atención (Medio)';
    estadoGeneralBg = 'bg-amber-100 text-amber-700';
  } else if (prediccion?.nivelRiesgo === 'SIN_RIESGO') {
    estadoGeneralLabel = 'Buen rendimiento';
    estadoGeneralBg = 'bg-green-100 text-green-700';
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><BookOpen size={12}/> Promedio general</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{promedioGeneral}</div>
          <div className="bg-[#fef3c7] text-[#92400e] text-[10px] px-2 py-0.5 rounded-full inline-block mt-1">Trimestre 1</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle size={12}/> Materias aprobadas</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{materiasAprobadas}/{notas.length || 0}</div>
          <div className="bg-[#dbeafe] text-[#1e40af] text-[10px] px-2 py-0.5 rounded-full inline-block mt-1">Hasta ahora</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={12}/> Asistencia global</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{asistenciaGlobal}%</div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${asistenciaGlobal < 80 ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#d1fae5] text-[#065f46]'}`}>
            {asistenciaGlobal < 80 ? 'Alerta' : 'Óptimo'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertTriangle size={12}/> Estado general IA</div>
          <div className="text-[16px] font-bold text-[#1a1a2e] leading-tight mt-1">{estadoGeneralLabel}</div>
          <div className={`${estadoGeneralBg} text-[10px] px-2 py-0.5 rounded-full inline-block mt-1`}>IA Evaluado</div>
        </div>
      </div>

      {/* Two Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Notes Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] mb-4">Mis notas — Trimestre 1</div>
          <div className="divide-y divide-slate-50">
            {notas.length === 0 ? (
              <div className="text-[12px] text-slate-500 py-2">No hay notas registradas.</div>
            ) : (
              notas.map((nota, idx) => {
                const estado = calcularEstadoNota(nota.total);
                return (
                  <div key={idx} className="flex justify-between items-center py-2.5">
                    <span className="text-[12px] text-slate-600 font-medium">{nota.materiaProgramada.materia.nombre}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusChipClass(estado)}`}>
                        {nota.total}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusChipClass(estado)}`}>
                        {estado}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Predicción IA */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500"/> Recomendación del Sistema
            </div>
            <div className="space-y-2">
              {!prediccion || prediccion.nivelRiesgo === 'SIN_EVALUAR' ? (
                 <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">El modelo de IA aún no ha evaluado tu perfil.</div>
              ) : prediccion.nivelRiesgo === 'RIESGO_ALTO' ? (
                <div className="bg-[#fff0f0] border border-[#fca5a5] rounded-lg p-3">
                  <div className="text-[12px] font-bold text-[#b91c1c] flex items-center gap-1.5">
                    <AlertTriangle size={14}/> Riesgo Académico Alto
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1.5 leading-relaxed">
                    Probabilidad de reprobación: <strong>{(prediccion.probabilidad * 100).toFixed(1)}%</strong>. Tu promedio general de {prediccion.promedioNotas.toFixed(1)} y asistencia de {prediccion.porcentajeAsistencia.toFixed(1)}% activaron esta alerta. Contacta a tus profesores inmediatamente.
                  </div>
                </div>
              ) : prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? (
                <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-lg p-3">
                  <div className="text-[12px] font-bold text-[#92400e] flex items-center gap-1.5">
                    <AlertTriangle size={14}/> Riesgo Académico Medio
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1.5 leading-relaxed">
                    Probabilidad de reprobación: <strong>{(prediccion.probabilidad * 100).toFixed(1)}%</strong>. Estás en el límite. Necesitas mejorar tu constancia y asistencia para evitar caer en riesgo.
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-[12px] font-bold text-green-700 flex items-center gap-1.5">
                    <CheckCircle size={14}/> Sin Riesgo Detectado
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1.5 leading-relaxed">
                    ¡Excelente trabajo! Tus métricas actuales indican un rendimiento seguro. Continúa con este nivel de dedicación.
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Próximas materias */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
             <div className="text-[12px] font-bold text-[#1a1a2e] mb-3">Materias asignadas (Resumen)</div>
             <div className="text-[11px] text-slate-600">Tienes {horario.length} materias programadas para esta gestión.</div>
             <div className="mt-2 flex flex-wrap gap-1.5">
                {horario.slice(0, 5).map(h => (
                  <span key={h.id} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md">{h.materia.nombre}</span>
                ))}
                {horario.length > 5 && <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md">+{horario.length - 5} más</span>}
             </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default EstudianteDashboard;
