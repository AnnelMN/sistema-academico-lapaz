import { BrainCircuit } from 'lucide-react';
import { MENSAJE_IA_NO_DISPONIBLE } from '../constants/ia';

// Aviso común para todas las pantallas que muestran predicciones de riesgo.
// compacto: versión de una línea para tarjetas pequeñas.
export default function PrediccionNoDisponible({ compacto = false }) {
  if (compacto) {
    return (
      <div
        className="p-3 rounded-xl text-[12px] flex items-center gap-2"
        style={{ backgroundColor: 'var(--ios-bg)', color: 'var(--ios-secondary)' }}
      >
        <BrainCircuit size={14} />
        {MENSAJE_IA_NO_DISPONIBLE}
      </div>
    );
  }

  return (
    <div className="ios-card p-6 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--ios-bg)' }}
      >
        <BrainCircuit size={24} style={{ color: 'var(--ios-tertiary)' }} />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--ios-label)' }}>
          {MENSAJE_IA_NO_DISPONIBLE}
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ios-secondary)' }}>
          El modelo de predicción de riesgo se habilitará cuando se cuente con datos
          suficientes para entrenarlo. Mientras tanto, puedes consultar las notas y la
          asistencia con normalidad.
        </p>
      </div>
    </div>
  );
}
