import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import estudianteService from '../../services/estudiante.service';
import { Activity, BookOpen, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';
import { prediccionNoDisponible } from '../../constants/ia';

const EstudianteDashboard = () => {
  const { user } = useAuth();
  
  const [notas, setNotas]           = useState([]);
  const [asistencia, setAsistencia] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [horario, setHorario]       = useState([]);
  const [loading, setLoading]       = useState(true);

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

  const calcularEstadoNota = (total) => {
    if (total >= 51) return { label: 'Aprobado', cls: 'ios-badge ios-badge-success' };
    if (total >= 40) return { label: 'Atención', cls: 'ios-badge ios-badge-warning' };
    return { label: 'En riesgo', cls: 'ios-badge ios-badge-danger' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>
          Cargando tu portal estudiantil...
        </div>
      </div>
    );
  }

  const promedioGeneral = notas.length > 0
    ? Math.round(notas.reduce((acc, curr) => acc + curr.total, 0) / notas.length)
    : 0;
  const materiasAprobadas = notas.filter(n => n.total >= 51).length;
  const asistenciaGlobal  = asistencia.length > 0
    ? Math.round(asistencia.reduce((acc, curr) => acc + curr.porcentaje, 0) / asistencia.length)
    : 0;

  // Badge de predicción
  let riesgoLabel = 'Sin evaluar';
  let riesgoCls   = 'ios-badge ios-badge-neutral';
  if (prediccionNoDisponible(prediccion)) {
    riesgoLabel = 'No disponible';
  } else if (prediccion?.nivelRiesgo === 'RIESGO_ALTO') {
    riesgoLabel = 'Riesgo alto'; riesgoCls = 'ios-badge ios-badge-danger';
  } else if (prediccion?.nivelRiesgo === 'RIESGO_MEDIO') {
    riesgoLabel = 'Riesgo medio'; riesgoCls = 'ios-badge ios-badge-warning';
  } else if (prediccion?.nivelRiesgo === 'SIN_RIESGO') {
    riesgoLabel = 'Sin riesgo'; riesgoCls = 'ios-badge ios-badge-success';
  }

  // Tarjeta de alerta IA
  const renderAlertaIA = () => {
    if (prediccionNoDisponible(prediccion)) {
      return <PrediccionNoDisponible compacto />;
    }
    if (!prediccion || prediccion.nivelRiesgo === 'SIN_EVALUAR') {
      return (
        <div className="p-3 rounded-xl text-[12px]" style={{ backgroundColor: 'var(--ios-bg)', color: 'var(--ios-secondary)' }}>
          El modelo de IA aún no ha evaluado tu perfil.
        </div>
      );
    }
    if (prediccion.nivelRiesgo === 'RIESGO_ALTO') {
      return (
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--ios-red-light)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={14} style={{ color: 'var(--ios-red)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ios-red)' }}>Riesgo Académico Alto</span>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: '#C0392B' }}>
            Probabilidad de reprobación: <strong>{(prediccion.probabilidad * 100).toFixed(1)}%</strong>.
            Tu promedio de {prediccion.promedioNotas?.toFixed(1)} y asistencia de {prediccion.porcentajeAsistencia?.toFixed(1)}% activaron esta alerta. Contacta a tus profesores inmediatamente.
          </p>
        </div>
      );
    }
    if (prediccion.nivelRiesgo === 'RIESGO_MEDIO') {
      return (
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--ios-orange-light)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={14} style={{ color: 'var(--ios-orange)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ios-orange)' }}>Riesgo Académico Medio</span>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: '#A05800' }}>
            Probabilidad de reprobación: <strong>{(prediccion.probabilidad * 100).toFixed(1)}%</strong>.
            Estás en el límite. Mejora tu constancia y asistencia para evitar caer en riesgo alto.
          </p>
        </div>
      );
    }
    return (
      <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--ios-green-light)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <CheckCircle size={14} style={{ color: 'var(--ios-green)' }} />
          <span className="text-[13px] font-semibold" style={{ color: '#1A7A38' }}>Sin Riesgo Detectado</span>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: '#1A7A38' }}>
          ¡Excelente trabajo! Tus métricas actuales indican un rendimiento seguro. Continúa con este nivel de dedicación.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="ios-card p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={12} style={{ color: 'var(--ios-secondary)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
              Promedio general
            </span>
          </div>
          <div className="text-[28px] font-bold" style={{ color: 'var(--ios-label)' }}>{promedioGeneral}</div>
          <span className="ios-badge ios-badge-warning mt-2">Trimestre 1</span>
        </div>

        <div className="ios-card p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle size={12} style={{ color: 'var(--ios-secondary)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
              Aprobadas
            </span>
          </div>
          <div className="text-[28px] font-bold" style={{ color: 'var(--ios-label)' }}>
            {materiasAprobadas}/{notas.length || 0}
          </div>
          <span className="ios-badge ios-badge-info mt-2">Hasta ahora</span>
        </div>

        <div className="ios-card p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={12} style={{ color: 'var(--ios-secondary)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
              Asistencia
            </span>
          </div>
          <div className="text-[28px] font-bold" style={{ color: 'var(--ios-label)' }}>{asistenciaGlobal}%</div>
          <span className={`mt-2 ${asistenciaGlobal < 80 ? 'ios-badge ios-badge-danger' : 'ios-badge ios-badge-success'}`}>
            {asistenciaGlobal < 80 ? 'Alerta' : 'Óptimo'}
          </span>
        </div>

        <div className="ios-card p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={12} style={{ color: 'var(--ios-secondary)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
              Estado IA
            </span>
          </div>
          <div className="text-[17px] font-bold leading-tight mt-1" style={{ color: 'var(--ios-label)' }}>
            {riesgoLabel}
          </div>
          <span className={`mt-2 ${riesgoCls}`}>IA Evaluado</span>
        </div>
      </div>

      {/* Two Col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Notas */}
        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Mis notas — Trimestre 1
          </div>
          <div>
            {notas.length === 0 ? (
              <div className="text-[13px] py-4 text-center" style={{ color: 'var(--ios-secondary)' }}>
                No hay notas registradas aún.
              </div>
            ) : (
              notas.map((nota, idx) => {
                const estado = calcularEstadoNota(nota.total);
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-3"
                    style={{ borderBottom: idx < notas.length - 1 ? '1px solid var(--ios-separator-2)' : 'none' }}
                  >
                    <span className="text-[13px] font-medium" style={{ color: 'var(--ios-label)' }}>
                      {nota.materiaProgramada.materia.nombre}
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--ios-label)' }}>
                        {nota.total}
                      </span>
                      <span className={estado.cls}>{estado.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Alerta IA */}
          <div className="ios-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} style={{ color: 'var(--ios-blue)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                Recomendación del Sistema
              </span>
            </div>
            {renderAlertaIA()}
          </div>

          {/* Materias asignadas */}
          <div className="ios-card p-5">
            <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ios-label)' }}>
              Materias asignadas
            </div>
            <div className="text-[12px] mb-3" style={{ color: 'var(--ios-secondary)' }}>
              Tienes {horario.length} materias programadas para esta gestión.
            </div>
            <div className="flex flex-wrap gap-1.5">
              {horario.slice(0, 5).map(h => (
                <span key={h.id} className="ios-badge ios-badge-info">{h.materia.nombre}</span>
              ))}
              {horario.length > 5 && (
                <span className="ios-badge ios-badge-neutral">+{horario.length - 5} más</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EstudianteDashboard;
