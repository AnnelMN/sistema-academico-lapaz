import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Info, AlertTriangle, Users } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';
import { getPrediccionesProfesor } from '../../services/predictions.service';
import { prediccionNoDisponible } from '../../constants/ia';

// Riesgo académico de los estudiantes de los cursos del docente.
// El servidor solo devuelve estudiantes de SUS cursos y predicciones del modelo vigente.

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',            dotColor: 'bg-[#60a5fa]', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',      dotColor: 'bg-[#fb923c]' },
      { label: 'Asistencia',      path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
    ]
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
      { label: 'Mi horario',    path: '/profesor/horario',       dotColor: 'bg-[#fbbf24]' },
      { label: 'Reportes',      path: '/profesor/reportes',      dotColor: 'bg-[#9ca3af]' },
    ]
  }
];

const RIESGO = {
  RIESGO_ALTO:  { label: 'Riesgo alto',  clase: 'ios-badge ios-badge-danger',  color: 'var(--ios-red)' },
  RIESGO_MEDIO: { label: 'Riesgo medio', clase: 'ios-badge ios-badge-warning', color: 'var(--ios-orange)' },
  SIN_RIESGO:   { label: 'Sin riesgo',   clase: 'ios-badge ios-badge-success', color: 'var(--ios-green)' },
};

const formatoFecha = (v) => (v ? new Date(v).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' }) : '—');
const porcentaje = (v) => (v === null || v === undefined ? '—' : `${Math.round(v)}%`);

const Kpi = ({ valor, etiqueta, color, activo, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="ios-card p-4 text-center transition-all"
    style={activo ? { outline: `2px solid ${color}` } : undefined}
    aria-pressed={activo}
  >
    <div className="text-[26px] font-bold" style={{ color }}>{valor}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>
      {etiqueta}
    </div>
  </button>
);

export default function PrediccionIA() {
  const [materiaId, setMateriaId] = useState('');
  const [datos, setDatos] = useState(null);       // { materiaId, respuesta }
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');       // '' | nivel | 'SIN_PREDICCION'

  useEffect(() => {
    let vigente = true;
    getPrediccionesProfesor(materiaId)
      .then((respuesta) => vigente && (setDatos({ materiaId, respuesta }), setError('')))
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudieron cargar las predicciones'));
    return () => { vigente = false; };
  }, [materiaId]);

  const respuesta = datos?.materiaId === materiaId ? datos.respuesta : null;
  const noDisponible = prediccionNoDisponible(respuesta);

  const visibles = useMemo(() => {
    const lista = respuesta?.estudiantes || [];
    if (!filtro) return lista;
    return lista.filter((e) => (filtro === 'SIN_PREDICCION' ? e.nivelRiesgo === null : e.nivelRiesgo === filtro));
  }, [respuesta, filtro]);

  const alternar = (valor) => setFiltro((f) => (f === valor ? '' : valor));
  const r = respuesta?.resumen;

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Predicción IA de Riesgo"
      headerSubtitle={respuesta?.gestion ? `Mis estudiantes · Gestión ${respuesta.gestion}` : 'Mis estudiantes'}
    >
      <div className="space-y-5">
        {error && <div className="ios-card p-4 text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>}

        {noDisponible ? (
          <PrediccionNoDisponible />
        ) : !respuesta && !error ? (
          <div className="ios-card p-6 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando…</div>
        ) : respuesta && (
          <>
            {/* Supervisión humana: la predicción orienta, la decisión es del docente */}
            <div className="ios-card p-4 flex gap-3 items-start">
              <Info size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ios-blue)' }} />
              <div className="text-[12px] leading-relaxed" style={{ color: 'var(--ios-secondary)' }}>
                La predicción es <strong>orientativa</strong>: estima si el estudiante podría terminar el año con áreas
                reprobadas (riesgo medio: 1 o 2; riesgo alto: 3 o más), a partir de su promedio y asistencia en
                <strong> todas sus materias</strong>, las áreas que hoy reprueba, su curso y el trimestre. La decisión
                pedagógica es siempre del docente. Se actualiza cada vez que se registran notas o asistencia.
              </div>
            </div>

            <div className="ios-card p-4 flex flex-wrap gap-3 items-center">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--ios-secondary)' }} htmlFor="materia">
                Curso y materia
              </label>
              <select id="materia" className="ios-select min-w-[240px]" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                <option value="">Todos mis cursos</option>
                {respuesta.materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.curso} — {m.materia}</option>
                ))}
              </select>
              {filtro && (
                <button type="button" className="ios-btn-ghost text-[12px]" onClick={() => setFiltro('')}>
                  Quitar filtro
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi valor={r.alto} etiqueta="Riesgo alto" color="var(--ios-red)" activo={filtro === 'RIESGO_ALTO'} onClick={() => alternar('RIESGO_ALTO')} />
              <Kpi valor={r.medio} etiqueta="Riesgo medio" color="var(--ios-orange)" activo={filtro === 'RIESGO_MEDIO'} onClick={() => alternar('RIESGO_MEDIO')} />
              <Kpi valor={r.sinRiesgo} etiqueta="Sin riesgo" color="var(--ios-green)" activo={filtro === 'SIN_RIESGO'} onClick={() => alternar('SIN_RIESGO')} />
              <Kpi valor={r.sinPrediccion} etiqueta="Sin predicción aún" color="var(--ios-tertiary)" activo={filtro === 'SIN_PREDICCION'} onClick={() => alternar('SIN_PREDICCION')} />
            </div>

            <div className="ios-card overflow-x-auto">
              {respuesta.estudiantes.length === 0 ? (
                <div className="p-6 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
                  <Users size={20} className="mx-auto mb-2" />
                  No tienes estudiantes en tus cursos de esta gestión.
                </div>
              ) : (
                <table className="ios-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Curso</th>
                      <th>Nivel de riesgo</th>
                      <th>Probabilidad</th>
                      <th className="text-center">Promedio general</th>
                      <th className="text-center">Asistencia general</th>
                      <th className="text-center">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((e) => {
                      const cfg = RIESGO[e.nivelRiesgo];
                      return (
                        <tr key={e.estudianteId}>
                          <td className="font-medium">
                            <span className="inline-flex items-center gap-2">
                              {e.nivelRiesgo === 'RIESGO_ALTO' && <AlertTriangle size={13} style={{ color: 'var(--ios-red)' }} />}
                              {e.nombre}
                            </span>
                          </td>
                          <td style={{ color: 'var(--ios-secondary)' }}>{e.curso}</td>
                          <td>
                            {cfg ? <span className={cfg.clase}>{cfg.label}</span>
                              : <span className="text-[12px]" style={{ color: 'var(--ios-tertiary)' }}>Sin notas registradas aún</span>}
                          </td>
                          <td>
                            {e.probabilidad === null ? '—' : (
                              <div className="flex items-center gap-2 w-28">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${Math.round(e.probabilidad * 100)}%`, backgroundColor: cfg?.color }} />
                                </div>
                                <span className="text-[11px] font-semibold w-9 text-right">{Math.round(e.probabilidad * 100)}%</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center">{e.promedioNotas === null ? '—' : Math.round(e.promedioNotas)}</td>
                          <td className="text-center">{porcentaje(e.porcentajeAsistencia)}</td>
                          <td className="text-center text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
                            {e.trimestre ? `T${e.trimestre} · ${formatoFecha(e.generadoEn)}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {visibles.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
                        Ningún estudiante con este filtro.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--ios-tertiary)' }}>
              <BrainCircuit size={13} />
              La probabilidad indica qué tan seguro está el modelo (proporción de árboles del Random Forest que coinciden).
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
