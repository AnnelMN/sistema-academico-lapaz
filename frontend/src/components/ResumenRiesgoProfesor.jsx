import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import PrediccionNoDisponible from './PrediccionNoDisponible';
import { getPrediccionesProfesor } from '../services/predictions.service';
import { prediccionNoDisponible } from '../constants/ia';

// Tarjeta del dashboard del profesor: cuántos de sus estudiantes están en cada
// nivel de riesgo, con enlace a la vista completa. Si la IA está pausada, muestra el aviso.
export default function ResumenRiesgoProfesor() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vigente = true;
    getPrediccionesProfesor()
      .then((r) => vigente && setDatos(r))
      .catch(() => vigente && setDatos({ error: true }));
    return () => { vigente = false; };
  }, []);

  if (!datos) return null;
  if (datos.error || prediccionNoDisponible(datos)) return <PrediccionNoDisponible compacto />;

  const r = datos.resumen;
  const items = [
    { etiqueta: 'Riesgo alto', valor: r.alto, color: 'var(--ios-red)' },
    { etiqueta: 'Riesgo medio', valor: r.medio, color: 'var(--ios-orange)' },
    { etiqueta: 'Sin riesgo', valor: r.sinRiesgo, color: 'var(--ios-green)' },
    { etiqueta: 'Sin predicción', valor: r.sinPrediccion, color: 'var(--ios-tertiary)' },
  ];
  return (
    <div className="ios-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
          <BrainCircuit size={15} style={{ color: 'var(--ios-purple, #AF52DE)' }} />
          Riesgo académico de mis estudiantes (orientativo)
        </div>
        <Link to="/profesor/predicciones" className="ios-btn-ghost text-[12px]">
          Ver detalle <ChevronRight size={13} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((i) => (
          <div key={i.etiqueta} className="text-center p-2 rounded-xl" style={{ backgroundColor: 'var(--ios-bg)' }}>
            <div className="text-[22px] font-bold" style={{ color: i.color }}>{i.valor}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>{i.etiqueta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
