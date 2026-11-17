import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle, Info, CheckCircle, Activity, BookOpen } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';
import { prediccionNoDisponible } from '../../constants/ia';

const riesgoConfig = {
  RIESGO_ALTO: {
    iconBg: 'var(--ios-red-light)',
    iconColor: 'var(--ios-red)',
    icon: AlertTriangle,
    titulo: 'Riesgo Alto',
    color: 'var(--ios-red)',
    cardBg: 'var(--ios-red-light)',
    mensaje: 'El modelo indica una alta probabilidad de reprobación. Es urgente tomar medidas para mejorar tus notas y asistencia.',
    dotColor: 'var(--ios-red)',
  },
  RIESGO_MEDIO: {
    iconBg: 'var(--ios-orange-light)',
    iconColor: 'var(--ios-orange)',
    icon: Info,
    titulo: 'Riesgo Medio',
    color: 'var(--ios-orange)',
    cardBg: 'var(--ios-orange-light)',
    mensaje: 'Presta atención a tu rendimiento. Estás en el límite y podrías reprobar si no mantienes la constancia.',
    dotColor: 'var(--ios-orange)',
  },
  SIN_RIESGO: {
    iconBg: 'var(--ios-green-light)',
    iconColor: 'var(--ios-green)',
    icon: CheckCircle,
    titulo: 'Sin Riesgo',
    color: 'var(--ios-green)',
    cardBg: 'var(--ios-green-light)',
    mensaje: '¡Excelente trabajo! Continúa con este nivel de dedicación.',
    dotColor: 'var(--ios-green)',
  },
  SIN_EVALUAR: {
    iconBg: 'var(--ios-bg)',
    iconColor: 'var(--ios-tertiary)',
    icon: BrainCircuit,
    titulo: 'Aún no evaluado',
    color: 'var(--ios-secondary)',
    cardBg: 'var(--ios-bg)',
    mensaje: 'El modelo no tiene suficientes datos aún para generar una predicción en este trimestre.',
    dotColor: 'var(--ios-tertiary)',
  },
};

const recomendaciones = {
  RIESGO_ALTO: [
    'Habla con tus profesores para identificar las áreas exactas donde necesitas reforzar.',
    'No faltes a más clases; la inasistencia es un factor crítico en el modelo predictivo.',
    'Se enviará una notificación a tus tutores para buscar apoyo en conjunto.',
  ],
  RIESGO_MEDIO: [
    'Organiza un horario de estudio extra en casa.',
    'Si tienes dudas, consulta al profesor durante la clase.',
  ],
  SIN_RIESGO: [
    'Sigue participando activamente en todas las materias.',
    'Si tienes compañeros con dificultades, considera apoyarlos en grupos de estudio.',
  ],
};

const Prediccion = () => {
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { cargarPrediccion(); }, []);

  const cargarPrediccion = async () => {
    try {
      setPrediccion(await estudianteService.getMiPrediccion());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>Analizando datos académicos...</div>
      </div>
    );
  }

  if (prediccionNoDisponible(prediccion)) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
            Mi Predicción de Rendimiento
          </h2>
        </div>
        <PrediccionNoDisponible />
      </div>
    );
  }

  const nivel = prediccion?.nivelRiesgo || 'SIN_EVALUAR';
  const cfg = riesgoConfig[nivel] || riesgoConfig.SIN_EVALUAR;
  const Icon = cfg.icon;
  const sinEvaluar = !prediccion || nivel === 'SIN_EVALUAR';
  const recoms = recomendaciones[nivel] || [];

  return (
    <div className="space-y-5 max-w-4xl">

      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Mi Predicción de Rendimiento
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Análisis predictivo basado en Machine Learning con tu historial y asistencia.
        </p>
      </div>

      {/* Main card */}
      <div
        className="ios-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center"
        style={{ backgroundColor: cfg.cardBg }}
      >
        <div
          className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
        >
          <Icon size={28} style={{ color: cfg.iconColor }} />
        </div>

        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'var(--ios-secondary)' }}>
            Estado actual · IA
          </div>
          <h3 className="text-[26px] font-bold mb-2 leading-none" style={{ color: cfg.color }}>
            {cfg.titulo}
          </h3>
          <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: 'var(--ios-label-2)' }}>
            {cfg.mensaje}
          </p>
        </div>

        {!sinEvaluar && (
          <div
            className="rounded-2xl p-5 text-center min-w-[130px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--ios-secondary)' }}>
              Probabilidad
            </div>
            <div className="text-[30px] font-bold leading-none" style={{ color: cfg.color }}>
              {(prediccion.probabilidad * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>de reprobación</div>
          </div>
        )}
      </div>

      {!sinEvaluar && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Factores */}
          <div className="ios-card p-5">
            <h4 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--ios-label)' }}>
              <BrainCircuit size={15} style={{ color: 'var(--ios-blue)' }} />
              Factores analizados
            </h4>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: 'var(--ios-label)' }}>
                    <BookOpen size={13} style={{ color: 'var(--ios-secondary)' }} />
                    Promedio de Notas
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: 'var(--ios-label)' }}>
                    {prediccion.promedioNotas?.toFixed(1)} pts
                  </div>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(prediccion.promedioNotas, 100)}%`,
                      backgroundColor: prediccion.promedioNotas < 51 ? 'var(--ios-red)' : 'var(--ios-blue)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: 'var(--ios-label)' }}>
                    <Activity size={13} style={{ color: 'var(--ios-secondary)' }} />
                    Asistencia Global
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: 'var(--ios-label)' }}>
                    {prediccion.porcentajeAsistencia?.toFixed(1)}%
                  </div>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(prediccion.porcentajeAsistencia, 100)}%`,
                      backgroundColor: prediccion.porcentajeAsistencia < 80 ? 'var(--ios-orange)' : 'var(--ios-green)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="mt-5 p-3 rounded-xl text-[11px] leading-relaxed"
              style={{ backgroundColor: 'var(--ios-blue-light)', color: 'var(--ios-blue)' }}
            >
              <strong>Nota técnica:</strong> Este cálculo utiliza el algoritmo Random Forest comparando tu
              rendimiento histórico con el de gestiones pasadas. Trimestre analizado: <strong>{prediccion.trimestre}</strong>.
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="ios-card p-5">
            <h4 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
              Recomendaciones del sistema
            </h4>
            <ul className="space-y-3">
              {recoms.map((rec, i) => (
                <li key={i} className="flex gap-2.5 text-[12px]" style={{ color: 'var(--ios-label-2)' }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};

export default Prediccion;
