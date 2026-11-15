import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertCircle, Info, FileText } from 'lucide-react';
import { getCursos, getMaterias } from '../../services/academico.service';
import { getReporteConsolidado } from '../../services/reportes.service';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short' }).format(date);
};

export default function DirectorReportes() {
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [filtros, setFiltros] = useState({
    cursoId: '',
    materiaId: '',
    trimestre: '',
    gestion: String(new Date().getFullYear()),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [cursosData, materiasData] = await Promise.all([
          getCursos(),
          getMaterias(),
        ]);
        setCursos(cursosData || []);
        setMaterias(materiasData || []);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    cargar();
  }, []);

  const cargarReporte = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filtros.cursoId) params.cursoId = filtros.cursoId;
      if (filtros.materiaId) params.materiaId = filtros.materiaId;
      if (filtros.trimestre) params.trimestre = filtros.trimestre;
      if (filtros.gestion) params.gestion = filtros.gestion;
      const data = await getReporteConsolidado(params);
      setReporte(data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setError(err.response?.data?.error || 'No se pudo cargar el reporte');
      setReporte(null);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const exportarCSV = () => {
    if (!reporte?.recientes?.length) return;
    const filas = reporte.recientes.map((r) => [
      r.estudiante,
      r.curso,
      r.materia,
      r.trimestre,
      r.total,
      r.aprobado ? 'Aprobado' : 'Reprobado',
      formatDate(r.creadoEn),
    ]);
    const csv = [
      ['Estudiante', 'Curso', 'Materia', 'Trimestre', 'Total', 'Estado', 'Fecha'],
      ...filas,
    ]
      .map((fila) => fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_notas_${filtros.gestion}_T${filtros.trimestre || 'T'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resumen = reporte?.resumen;
  const porCurso = reporte?.porCurso || [];
  const porMateria = reporte?.porMateria || [];
  const recientes = reporte?.recientes || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando reporte...
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Reportes Consolidados
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Consulta de notas, aprobación y asistencia por curso, materia y trimestre.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Gestión
          </label>
          <select
            value={filtros.gestion}
            onChange={(e) => setFiltros((f) => ({ ...f, gestion: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {[2024, 2025, 2026, 2027].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Curso
          </label>
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
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Materia
          </label>
          <select
            value={filtros.materiaId}
            onChange={(e) => setFiltros((f) => ({ ...f, materiaId: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas las materias</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Trimestre
          </label>
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
        <div className="flex items-end">
          <button
            onClick={cargarReporte}
            disabled={loading}
            className="ios-btn-primary"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
          <button
            onClick={exportarCSV}
            disabled={loading || !recientes?.length}
            className="ml-2 border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2.5 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FileText size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[12px] font-semibold" style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)', padding: '10px', borderRadius: 'var(--ios-radius-lg)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Estudiantes con notas', value: resumen?.totalEstudiantesConNotas ?? 0 },
          { label: 'Notas registradas', value: resumen?.totalNotas ?? 0 },
          { label: 'Promedio general', value: resumen?.promedioNotas ?? 0 },
          { label: 'Aprobados', value: resumen?.aprobados ?? 0 },
          { label: 'Reprobados', value: resumen?.reprobados ?? 0 },
          { label: 'Asistencia media', value: resumen?.asistenciaPromedio ?? 0 },
          { label: 'Riesgo Alto', value: resumen?.riesgoAlto ?? 0 },
          { label: 'Umbral aprobación', value: resumen?.umbralAprobacion ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="ios-card p-4 text-center">
            <div className="text-[22px] font-extrabold leading-none" style={{ color: 'var(--ios-label)' }}>
              {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ios-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curso</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estudiantes</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Notas</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Promedio</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aprobados</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Reprobados</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Riesgo Alto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {porCurso.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    Sin datos de cursos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                porCurso.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{c.label}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.estudiantes}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.notasRegistradas}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.promedio}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.aprobados}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.reprobados}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{c.riesgoAlto}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ios-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Materia</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Notas</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Promedio</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aprobados</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Reprobados</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Riesgo Alto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {porMateria.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                    Sin datos de materias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                porMateria.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{m.label}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{m.notasRegistradas}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{m.promedio}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{m.aprobados}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{m.reprobados}</td>
                    <td className="px-4 py-3 text-center text-[12px]">{m.riesgoAlto}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ios-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curso</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Materia</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Trimestre</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Total</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recientes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                  No hay notas registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              recientes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[12px]">{r.estudiante}</td>
                  <td className="px-4 py-3 text-[12px]">{r.curso}</td>
                  <td className="px-4 py-3 text-[12px]">{r.materia}</td>
                  <td className="px-4 py-3 text-center text-[12px]">{r.trimestre}</td>
                  <td className="px-4 py-3 text-center text-[12px] font-bold">{r.total}</td>
                  <td className="px-4 py-3 text-center text-[12px]">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        r.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.aprobado ? 'Aprobado' : 'Reprobado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[12px] text-slate-600">{formatDate(r.creadoEn)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
