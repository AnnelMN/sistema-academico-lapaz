import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle, Info, CheckCircle, Activity, BookOpen } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const Prediccion = () => {
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPrediccion();
  }, []);

  const cargarPrediccion = async () => {
    try {
      const data = await estudianteService.getMiPrediccion();
      setPrediccion(data);
    } catch (error) {
      console.error('Error cargando predicción:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Analizando datos académicos...</div>;
  }

  const sinEvaluar = !prediccion || prediccion.nivelRiesgo === 'SIN_EVALUAR';

  const riesgoConfig = {
    RIESGO_ALTO: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertTriangle size={32} className="text-red-500" />,
      titulo: 'Riesgo Alto',
      mensaje: 'El modelo indica una alta probabilidad de reprobación. Es urgente tomar medidas para mejorar tus notas y asistencia.'
    },
    RIESGO_MEDIO: {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Info size={32} className="text-amber-500" />,
      titulo: 'Riesgo Medio',
      mensaje: 'Presta atención a tu rendimiento. Estás en el límite y podrías reprobar si no mantienes la constancia.'
    },
    SIN_RIESGO: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle size={32} className="text-green-500" />,
      titulo: 'Sin Riesgo',
      mensaje: '¡Excelente trabajo! Continúa con este nivel de dedicación.'
    },
    SIN_EVALUAR: {
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: <BrainCircuit size={32} className="text-slate-400" />,
      titulo: 'Aún no evaluado',
      mensaje: 'El modelo no tiene suficientes datos aún para generar una predicción en este trimestre.'
    }
  };

  const currentConfig = riesgoConfig[prediccion?.nivelRiesgo || 'SIN_EVALUAR'];

  return (
    <div className="space-y-6 max-w-4xl">
      
      <div>
        <h2 className="text-[16px] font-bold text-[#1a1a2e]">Mi Predicción de Rendimiento</h2>
        <p className="text-[11px] text-slate-500">
          Análisis predictivo basado en Machine Learning utilizando tu historial y asistencia.
        </p>
      </div>

      {/* Main Alert Card */}
      <div className={`rounded-xl p-6 border ${currentConfig.border} ${currentConfig.bg} flex flex-col md:flex-row gap-6 items-start md:items-center`}>
        <div className="bg-white p-4 rounded-full shadow-sm">
          {currentConfig.icon}
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Estado Actual IA</div>
          <h3 className={`text-[24px] font-black ${currentConfig.color} mb-2 leading-none`}>
            {currentConfig.titulo}
          </h3>
          <p className="text-[13px] text-slate-700 leading-relaxed max-w-2xl">
            {currentConfig.mensaje}
          </p>
        </div>
        {!sinEvaluar && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 text-center min-w-[140px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Probabilidad</div>
            <div className={`text-[28px] font-bold ${currentConfig.color} leading-none`}>
              {(prediccion.probabilidad * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-slate-400 mt-1">de reprobación</div>
          </div>
        )}
      </div>

      {!sinEvaluar && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Factores de influencia */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
            <h4 className="text-[13px] font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <BrainCircuit size={16} className="text-blue-500" />
              Factores principales analizados
            </h4>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <div className="text-[12px] font-semibold text-slate-700 flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-400" /> Promedio de Notas
                  </div>
                  <div className="text-[13px] font-bold text-slate-800">{prediccion.promedioNotas.toFixed(1)} pts</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${prediccion.promedioNotas < 51 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(prediccion.promedioNotas, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <div className="text-[12px] font-semibold text-slate-700 flex items-center gap-2">
                    <Activity size={14} className="text-slate-400" /> Asistencia Global
                  </div>
                  <div className="text-[13px] font-bold text-slate-800">{prediccion.porcentajeAsistencia.toFixed(1)}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${prediccion.porcentajeAsistencia < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(prediccion.porcentajeAsistencia, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-blue-50 rounded-md text-[11px] text-blue-800 leading-relaxed border border-blue-100">
              <strong>Nota técnica:</strong> Este cálculo utiliza el algoritmo de Random Forest comparando tu rendimiento histórico con el de gestiones pasadas de la Unidad Educativa. Trimestre analizado: <strong>{prediccion.trimestre}</strong>.
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
            <h4 className="text-[13px] font-bold text-[#1a1a2e] mb-4">Recomendaciones del sistema</h4>
            <ul className="space-y-3">
              {prediccion.nivelRiesgo === 'RIESGO_ALTO' && (
                <>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" /> Habla con tus profesores para identificar las áreas exactas donde necesitas reforzar.</li>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" /> No faltes a más clases; la inasistencia es un factor crítico en el modelo predictivo.</li>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" /> Se enviará una notificación a tus tutores para buscar apoyo en conjunto.</li>
                </>
              )}
              {prediccion.nivelRiesgo === 'RIESGO_MEDIO' && (
                <>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Organiza un horario de estudio extra en casa.</li>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Si tienes dudas, consulta al profesor durante la clase.</li>
                </>
              )}
              {prediccion.nivelRiesgo === 'SIN_RIESGO' && (
                <>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" /> Sigue participando activamente en todas las materias.</li>
                  <li className="flex gap-2 text-[12px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" /> Si tienes compañeros con dificultades, considera apoyarlos en grupos de estudio.</li>
                </>
              )}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};

export default Prediccion;
