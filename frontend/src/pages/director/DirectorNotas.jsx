import { useEffect, useState } from 'react';
import { AlertCircle, Eye } from 'lucide-react';
import PlanillaNotas from '../../components/notas/PlanillaNotas';
import { getMisMaterias, getPeriodoActual, getPlanilla } from '../../services/notas.service';

// Notas para el Director: SOLO LECTURA (las registra el profesor de cada materia).

const ETIQUETA_TRIMESTRE = { 1: '1.er', 2: '2.º', 3: '3.er' };
const fechaCorta = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

const DirectorNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [materiaId, setMateriaId] = useState('');
  const [trimestre, setTrimestre] = useState(null); // null = trimestre activo
  const [planilla, setPlanilla] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    Promise.all([getMisMaterias(), getPeriodoActual()])
      .then(([lista, actual]) => {
        if (!vigente) return;
        setMaterias(lista || []);
        setPeriodo(actual);
        if (lista?.length) setMateriaId(lista[0].id);
      })
      .catch(() => vigente && setError('No se pudieron cargar las materias'));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!materiaId) return undefined;
    let vigente = true;
    getPlanilla(materiaId, trimestre)
      .then((datos) => { if (vigente) { setPlanilla(datos); setError(''); } })
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudo cargar la planilla'));
    return () => { vigente = false; };
  }, [materiaId, trimestre]);

  const cargando = !planilla || planilla.materiaProgramadaId !== materiaId || (trimestre !== null && planilla.trimestre !== trimestre);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Notas por materia
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5 = 100 · aprueba con 51
        </p>
      </div>

      <div className="ios-card p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>
            Materia y curso
          </label>
          <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="ios-input w-full text-[12px]">
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.curso?.nivel}° {m.curso?.paralelo} — {m.materia?.nombre}
                {m.docente?.usuario?.nombre ? ` (${m.docente.usuario.nombre})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>
            Trimestre
          </label>
          <select
            value={trimestre ?? planilla?.trimestre ?? ''}
            disabled={!planilla}
            onChange={(e) => setTrimestre(Number(e.target.value))}
            className="ios-input w-full text-[12px]"
          >
            {[1, 2, 3].map((t) => (
              <option key={t} value={t}>{ETIQUETA_TRIMESTRE[t]} trimestre{periodo?.trimestre === t ? ' (activo)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
        <Eye size={14} /> Vista de solo lectura: las notas las registra el profesor de cada materia.
        {planilla?.periodo && !cargando && (
          <span>· Trimestre {planilla.trimestre}: {fechaCorta(planilla.periodo.fechaInicio)} al {fechaCorta(planilla.periodo.fechaFin)}</span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl flex items-center gap-2 text-[12px] font-medium" style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {!error && materias.length === 0 && (
        <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>No hay materias programadas.</div>
      )}

      {!error && materiaId && (cargando
        ? <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando planilla…</div>
        : <PlanillaNotas planilla={planilla} editable={false} />)}
    </div>
  );
};

export default DirectorNotas;
