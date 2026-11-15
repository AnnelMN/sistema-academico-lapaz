import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const Asistencia = () => {
  const [asistencia, setAsistencia] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { cargarAsistencia(); }, []);

  const cargarAsistencia = async () => {
    try {
      setAsistencia(await estudianteService.getMiAsistencia());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>
          Cargando reporte de asistencia...
        </div>
      </div>
    );
  }

  const asistenciaGlobal = asistencia.length > 0
    ? Math.round(asistencia.reduce((acc, curr) => acc + curr.porcentaje, 0) / asistencia.length)
    : 0;
  const materiasRiesgo = asistencia.filter(a => a.faltas > 5).length;

  return (
    <div className="space-y-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ios-card p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--ios-blue-light)' }}
          >
            <Activity size={22} style={{ color: 'var(--ios-blue)' }} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--ios-secondary)' }}>
              Asistencia Global
            </div>
            <div className="text-[30px] font-bold leading-none" style={{ color: 'var(--ios-label)' }}>
              {asistenciaGlobal}%
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>
              Promedio de todas las materias
            </div>
          </div>
        </div>

        <div className="ios-card p-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: materiasRiesgo > 0 ? 'var(--ios-red-light)' : 'var(--ios-green-light)' }}
          >
            {materiasRiesgo > 0
              ? <AlertTriangle size={22} style={{ color: 'var(--ios-red)' }} />
              : <CheckCircle size={22} style={{ color: 'var(--ios-green)' }} />
            }
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--ios-secondary)' }}>
              Alertas de Faltas
            </div>
            <div className="text-[30px] font-bold leading-none"
              style={{ color: materiasRiesgo > 0 ? 'var(--ios-red)' : 'var(--ios-green)' }}>
              {materiasRiesgo} {materiasRiesgo === 1 ? 'materia' : 'materias'}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>
              Superan el límite de 5 inasistencias
            </div>
          </div>
        </div>
      </div>

      {/* Detalle por materia */}
      <div className="ios-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ios-separator)' }}>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--ios-label)' }}>
            Detalle por materia
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {asistencia.length === 0 ? (
            <div className="col-span-2 text-center py-6" style={{ color: 'var(--ios-secondary)' }}>
              Aún no hay registros de asistencia.
            </div>
          ) : (
            asistencia.map((item, idx) => {
              const enRiesgo = item.faltas > 5;
              const barColor = enRiesgo
                ? 'var(--ios-red)'
                : item.porcentaje < 80
                  ? 'var(--ios-orange)'
                  : 'var(--ios-green)';
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                        {item.materia}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{
                        color: enRiesgo ? 'var(--ios-red)' : 'var(--ios-secondary)'
                      }}>
                        {item.faltas} faltas · {item.total} clases totales
                      </div>
                    </div>
                    <div className="text-[15px] font-bold" style={{ color: 'var(--ios-label)' }}>
                      {item.porcentaje}%
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.porcentaje}%`, backgroundColor: barColor }}
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
