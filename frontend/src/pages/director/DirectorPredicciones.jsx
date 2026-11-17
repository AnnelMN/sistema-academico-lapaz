import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertCircle, Info, FileText } from 'lucide-react';
import { getCursos } from '../../services/academico.service';
import { getPrediccionesEstudiantes } from '../../services/predictions.service';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';
import { prediccionNoDisponible } from '../../constants/ia';

const RIESGO_CONFIG = {
  RIESGO_ALTO:   { label: 'Riesgo Alto',   class: 'bg-red-100 text-red-700' },
  RIESGO_MEDIO:  { label: 'Riesgo Medio',  class: 'bg-amber-100 text-amber-700' },
  SIN_RIESGO:    { label: 'Sin Riesgo',    class: 'bg-green-100 text-green-700' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short' }).format(date);
};

export default function DirectorPredicciones() {
  const [cursos, setCursos] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [filtros, setFiltros] = useState({ cursoId: '', nivelRiesgo: '', trimestre: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noDisponible, setNoDisponible] = useState(false);

  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const data = await getCursos();
        setCursos(data || []);
      } catch (err) {
        console.error('Error cargando cursos:', err);
      }
    };
    cargarCursos();
  }, []);

  const cargarPredicciones = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filtros.cursoId) params.cursoId = filtros.cursoId;
      if (filtros.nivelRiesgo) params.nivelRiesgo = filtros.nivelRiesgo;
      if (filtros.trimestre) params.trimestre = filtros.trimestre;
      const data = await getPrediccionesEstudiantes(params);
      if (prediccionNoDisponible(data)) {
        setNoDisponible(true);
        setPredicciones([]);
      } else {
        setNoDisponible(false);
        setPredicciones(data || []);
      }
    } catch (err) {
      console.error('Error cargando predicciones:', err);
      setError(err.response?.data?.error || 'No se pudieron cargar las predicciones');
      setPredicciones([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarPredicciones();
  }, [cargarPredicciones]);

  const kpis = {
    total: predicciones.length,
    alto: predicciones.filter((p) => p.nivelRiesgo === 'RIESGO_ALTO').length,
    medio: predicciones.filter((p) => p.nivelRiesgo === 'RIESGO_MEDIO').length,
    sin: predicciones.filter((p) => p.nivelRiesgo === 'SIN_RIESGO').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando predicciones...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="ios-card p-5 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
      >
        {error}
      </div>
    );
  }

  if (noDisponible) {
    return (
      <div className="space-y-5">
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Predicciones de riesgo
        </h2>
        <PrediccionNoDisponible />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Predicciones de Riesgo
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Clasificación actual por estudiante según notas y asistencia.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: kpis.total, color: 'text-[#1a73e8]' },
          { label: 'Riesgo Alto', value: kpis.alto, color: 'text-[#ef4444]' },
          { label: 'Riesgo Medio', value: kpis.medio, color: 'text-[#f59e0b]' },
          { label: 'Sin Riesgo', value: kpis.sin, color: 'text-[#16a34a]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="ios-card p-4 text-center">
            <div className={`text-[22px] font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Curso</label>
          <select
            value={filtros.cursoId}
            onChange={(e) => setFiltros((f) => ({ ...f, cursoId: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nivel}° {c.paralelo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nivel de riesgo</label>
          <select
            value={filtros.nivelRiesgo}
            onChange={(e) => setFiltros((f) => ({ ...f, nivelRiesgo: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los niveles</option>
            <option value="RIESGO_ALTO">Riesgo Alto</option>
            <option value="RIESGO_MEDIO">Riesgo Medio</option>
            <option value="SIN_RIESGO">Sin Riesgo</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trimestre</label>
          <select
            value={filtros.trimestre}
            onChange={(e) => setFiltros((f) => ({ ...f, trimestre: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los trimestres</option>
            <option value="1">1er Trimestre</option>
            <option value="2">2do Trimestre</option>
            <option value="3">3er Trimestre</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curso</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Trimestre</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Promedio</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Asistencia</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Riesgo</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Probabilidad</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Generado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {predicciones.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                  No hay predicciones registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              predicciones.map((p) => {
                const cfg = RIESGO_CONFIG[p.nivelRiesgo] || RIESGO_CONFIG.SIN_RIESGO;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-[12px] font-medium text-slate-700">{p.nombre}</td>
                    <td className="px-4 py-4 text-[12px]" style={{ color: 'var(--ios-label)' }}>{p.curso}</td>
                    <td className="px-4 py-4 text-center text-[12px]">{p.trimestre}</td>
                    <td className="px-4 py-4 text-center text-[12px]">
                      <span className={`font-bold ${(p.promedioNotas || 0) >= 51 ? 'text-green-600' : 'text-red-600'}`}>
                        {(p.promedioNotas ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-[12px]">
                      <span className={`font-bold ${(p.porcentajeAsistencia ?? 0) >= 80 ? 'text-green-600' : (p.porcentajeAsistencia ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {(p.porcentajeAsistencia ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cfg.class}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-[12px]">
                      {((p.probabilidad ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-4 text-center text-[12px] text-slate-600">{formatDate(p.generadoEn)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
