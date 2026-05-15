import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const Asistencia = () => {
  const [asistencia, setAsistencia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAsistencia();
  }, []);

  const cargarAsistencia = async () => {
    try {
      const data = await estudianteService.getMiAsistencia();
      setAsistencia(data);
    } catch (error) {
      console.error('Error cargando asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando reporte de asistencia...</div>;
  }

  // KPIs
  const asistenciaGlobal = asistencia.length > 0 
    ? Math.round(asistencia.reduce((acc, curr) => acc + curr.porcentaje, 0) / asistencia.length)
    : 0;
    
  const materiasRiesgo = asistencia.filter(a => a.faltas > 5).length;

  return (
    <div className="space-y-6">
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Asistencia Global</div>
            <div className="text-[28px] font-bold text-[#1a1a2e] leading-none">{asistenciaGlobal}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Promedio de todas las materias</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={`p-4 rounded-full ${materiasRiesgo > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {materiasRiesgo > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Alertas de Faltas</div>
            <div className={`text-[28px] font-bold leading-none ${materiasRiesgo > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {materiasRiesgo} {materiasRiesgo === 1 ? 'materia' : 'materias'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Superan el límite de 5 inasistencias</div>
          </div>
        </div>
      </div>

      {/* Detalle por materia */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-[#1a1a2e]">Detalle por materia</h2>
        </div>
        
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {asistencia.length === 0 ? (
            <div className="col-span-2 text-center text-[12px] text-slate-500 py-4">
              Aún no hay registros de asistencia para mostrar.
            </div>
          ) : (
            asistencia.map((item, idx) => {
              const enRiesgo = item.faltas > 5;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <div className="text-[13px] font-bold text-slate-800">{item.materia}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${enRiesgo ? 'text-red-500' : 'text-slate-500'}`}>
                        {item.faltas} faltas registradas (Total: {item.total} clases)
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-slate-700">{item.porcentaje}%</div>
                  </div>
                  
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        enRiesgo ? 'bg-red-500' : 
                        item.porcentaje < 80 ? 'bg-amber-400' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Asistencia;
