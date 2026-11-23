import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { useAuth } from '../../context/AuthContext';
import ResumenRiesgoProfesor from '../../components/ResumenRiesgoProfesor';
import { getMisMaterias, getPeriodoActual, getPlanilla } from '../../services/notas.service';

// Panel del profesor con datos reales: usa los mismos endpoints que la planilla
// de notas (el servidor solo devuelve las materias y estudiantes del docente).

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',             dotHex: '#007AFF', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',       dotHex: '#FF9500' },
      { label: 'Asistencia',      path: '/profesor/asistencia',  dotHex: '#34C759' },
    ],
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA',   path: '/profesor/predicciones', dotHex: '#AF52DE' },
      { label: 'Mi horario',      path: '/profesor/horario',      dotHex: '#FF9500' },
      { label: 'Reportes',        path: '/profesor/reportes',     dotHex: '#8E8E93' },
    ],
  },
];

const LIMITE_ASISTENCIA_BAJA = 80; // % por debajo del cual se marca al estudiante

// a / b redondeado a entero (0,5 sube), igual que en el resto del sistema
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));

// % de asistencia: (PRESENTE + JUSTIFICADO) / clases registradas; null si no hubo clases
const porcentajeAsistencia = ({ presentes = 0, justificados = 0, total = 0 } = {}) => (
  total > 0 ? dividirRedondeando((presentes + justificados) * 100, total) : null
);

const promedioEntero = (valores) => (
  valores.length ? dividirRedondeando(valores.reduce((s, v) => s + v, 0), valores.length) : null
);

const formatoFecha = (iso) => (iso
  ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  : '');

// Resumen de una planilla (una materia en un trimestre)
function resumirPlanilla(materia, planilla) {
  const umbral = planilla.umbralAprobacion ?? 51;
  const filas = planilla.estudiantes.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    total: e.tieneNota ? e.total : null,
    aprobado: e.tieneNota ? e.aprobado : null,
    asistencia: porcentajeAsistencia(e.asistencia),
    faltas: e.asistencia?.ausentes ?? 0,
  }));
  const conNota = filas.filter((f) => f.total !== null);
  const conAsistencia = filas.filter((f) => f.asistencia !== null);
  return {
    id: materia.id,
    materia: materia.materia?.nombre ?? '—',
    curso: materia.curso ? `${materia.curso.nivel}° ${materia.curso.paralelo}` : '—',
    horario: materia.horario,
    umbral,
    filas,
    estudiantes: filas.length,
    conNota: conNota.length,
    // Notas iniciadas pero incompletas («Calificación pendiente»): no se promedian
    pendientes: planilla.estudiantes.filter((e) => e.tieneNota && e.total === null).length,
    promedio: promedioEntero(conNota.map((f) => f.total)),
    aprobados: conNota.filter((f) => f.aprobado).length,
    reprobados: conNota.filter((f) => !f.aprobado).length,
    asistencia: promedioEntero(conAsistencia.map((f) => f.asistencia)),
  };
}

const Kpi = ({ valor, etiqueta, color }) => (
  <div className="ios-card p-4 text-center">
    <div className="text-[26px] font-bold" style={{ color }}>{valor ?? '—'}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>
      {etiqueta}
    </div>
  </div>
);

const BarraAsistencia = ({ valor }) => {
  if (valor === null) return <span style={{ color: 'var(--ios-tertiary)' }}>Sin clases</span>;
  return (
    <div className="flex flex-col w-24">
      <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ios-label)' }}>{valor}%</div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${valor}%`,
            backgroundColor: valor < LIMITE_ASISTENCIA_BAJA ? 'var(--ios-red)' : 'var(--ios-green)',
          }}
        />
      </div>
    </div>
  );
};

const ProfesorDashboard = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState(null);
  const [trimestre, setTrimestre] = useState(null);
  const [materias, setMaterias] = useState(null);
  // Resúmenes guardados junto con su trimestre: al cambiarlo, los anteriores dejan de mostrarse
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  // Materias del docente y trimestre activo
  useEffect(() => {
    let vigente = true;
    Promise.all([getMisMaterias(), getPeriodoActual()])
      .then(([lista, actual]) => {
        if (!vigente) return;
        setPeriodo(actual);
        setTrimestre(actual?.trimestre || 1);
        // Solo la gestión en curso (si no hay trimestre activo, todas)
        setMaterias((lista || []).filter((m) => !actual?.gestion || m.gestion === actual.gestion));
      })
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudieron cargar tus materias'));
    return () => { vigente = false; };
  }, []);

  // Planilla de cada materia en el trimestre elegido
  useEffect(() => {
    if (!materias || !trimestre) return undefined;
    let vigente = true;
    Promise.all(materias.map((m) => getPlanilla(m.id, trimestre).then((p) => resumirPlanilla(m, p))))
      .then((lista) => vigente && setDatos({ trimestre, lista }))
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudieron cargar las notas y la asistencia'));
    return () => { vigente = false; };
  }, [materias, trimestre]);

  const resumenes = datos && datos.trimestre === trimestre ? datos.lista : null;

  const totales = useMemo(() => {
    if (!resumenes) return null;
    const filas = resumenes.flatMap((r) => r.filas);
    const conNota = filas.filter((f) => f.total !== null);
    const conAsistencia = filas.filter((f) => f.asistencia !== null);
    return {
      estudiantes: new Set(filas.map((f) => f.id)).size,
      promedio: promedioEntero(conNota.map((f) => f.total)),
      aprobados: conNota.filter((f) => f.aprobado).length,
      reprobados: conNota.filter((f) => !f.aprobado).length,
      asistencia: promedioEntero(conAsistencia.map((f) => f.asistencia)),
    };
  }, [resumenes]);

  // Estudiantes que necesitan atención: reprobados o con asistencia baja
  const atencion = useMemo(() => (resumenes || [])
    .flatMap((r) => r.filas
      .filter((f) => f.aprobado === false || (f.asistencia !== null && f.asistencia < LIMITE_ASISTENCIA_BAJA))
      .map((f) => ({ ...f, clave: `${r.id}|${f.id}`, materia: r.materia, curso: r.curso })))
    .sort((a, b) => (a.total ?? 101) - (b.total ?? 101) || (a.asistencia ?? 101) - (b.asistencia ?? 101)),
  [resumenes]);

  const subtitulo = periodo?.trimestre
    ? `Prof. ${user?.nombre ?? ''} · Gestión ${periodo.gestion} · Trimestre ${periodo.trimestre} activo (${formatoFecha(periodo.fechaInicio)} al ${formatoFecha(periodo.fechaFin)})`
    : `Prof. ${user?.nombre ?? ''} · Hoy no hay un trimestre activo`;

  const selectorTrimestre = (
    <select
      className="ios-select"
      value={trimestre ?? ''}
      onChange={(e) => setTrimestre(Number(e.target.value))}
      disabled={!trimestre}
      aria-label="Trimestre"
    >
      {[1, 2, 3].map((t) => (
        <option key={t} value={t}>Trimestre {t}{periodo?.trimestre === t ? ' (activo)' : ''}</option>
      ))}
    </select>
  );

  const cargando = !error && (!materias || (materias.length > 0 && !resumenes));

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      headerTitle="Mi panel"
      headerSubtitle={subtitulo}
      headerRightContent={selectorTrimestre}
    >
      <div className="space-y-6">
        {error && (
          <div className="ios-card p-4 text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>
        )}

        {cargando && (
          <div className="ios-card p-6 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando…</div>
        )}

        {!cargando && materias?.length === 0 && (
          <div className="ios-card p-6 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
            Todavía no tienes materias asignadas en esta gestión. El personal administrativo las asigna desde Horarios.
          </div>
        )}

        {resumenes && resumenes.length > 0 && totales && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi valor={resumenes.length} etiqueta="Materias" color="var(--ios-blue)" />
              <Kpi valor={totales.estudiantes} etiqueta="Estudiantes" color="var(--ios-label)" />
              <Kpi valor={totales.promedio} etiqueta="Promedio /100" color="var(--ios-label)" />
              <Kpi valor={`${totales.aprobados} / ${totales.reprobados}`} etiqueta="Aprobados / Reprobados" color="var(--ios-green)" />
              <Kpi valor={totales.asistencia === null ? null : `${totales.asistencia}%`} etiqueta="Asistencia" color="var(--ios-orange)" />
            </div>

            <div className="ios-card overflow-x-auto">
              <div className="px-4 pt-4 pb-2 text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                Mis materias · Trimestre {trimestre}
              </div>
              <table className="ios-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Materia</th>
                    <th>Horario</th>
                    <th className="text-center">Estudiantes</th>
                    <th className="text-center">Promedio</th>
                    <th className="text-center">Aprob. / Reprob.</th>
                    <th>Asistencia</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {resumenes.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.curso}</td>
                      <td>{r.materia}</td>
                      <td style={{ color: 'var(--ios-secondary)' }}>{r.horario || '—'}</td>
                      <td className="text-center">{r.estudiantes}</td>
                      <td className="text-center font-semibold">
                        {r.promedio ?? <span style={{ color: 'var(--ios-tertiary)' }}>{r.pendientes ? 'Pendiente' : 'Sin notas'}</span>}
                        {r.pendientes > 0 && (
                          <span className="block text-[10px] font-normal" style={{ color: 'var(--ios-tertiary)' }}>
                            {r.pendientes} pendiente{r.pendientes === 1 ? '' : 's'}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {r.conNota ? (
                          <>
                            <span style={{ color: 'var(--ios-green)' }}>{r.aprobados}</span>
                            {' / '}
                            <span style={{ color: 'var(--ios-red)' }}>{r.reprobados}</span>
                          </>
                        ) : '—'}
                      </td>
                      <td><BarraAsistencia valor={r.asistencia} /></td>
                      <td className="whitespace-nowrap text-[12px]">
                        <Link to="/profesor/notas" className="ios-btn-ghost text-[12px]">Notas</Link>{' '}
                        <Link to="/profesor/asistencia" className="ios-btn-ghost text-[12px]">Asistencia</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ios-card overflow-x-auto">
              <div className="px-4 pt-4 pb-2">
                <div className="text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                  Estudiantes que necesitan atención
                </div>
                <div className="text-[11px]" style={{ color: 'var(--ios-secondary)' }}>
                  Reprobados (menos de {resumenes[0].umbral} puntos) o con asistencia menor a {LIMITE_ASISTENCIA_BAJA}% en el trimestre
                </div>
              </div>
              {atencion.length === 0 ? (
                <div className="px-4 pb-4 text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
                  Ningún estudiante en esta situación.
                </div>
              ) : (
                <table className="ios-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Curso · Materia</th>
                      <th className="text-center">Nota</th>
                      <th>Asistencia</th>
                      <th className="text-center">Faltas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atencion.map((f) => (
                      <tr key={f.clave}>
                        <td className="font-medium">{f.nombre}</td>
                        <td style={{ color: 'var(--ios-secondary)' }}>{f.curso} · {f.materia}</td>
                        <td className="text-center">
                          {f.total === null
                            ? <span style={{ color: 'var(--ios-tertiary)' }}>—</span>
                            : <span className={f.aprobado ? 'ios-badge ios-badge-success' : 'ios-badge ios-badge-danger'}>{f.total}</span>}
                        </td>
                        <td><BarraAsistencia valor={f.asistencia} /></td>
                        <td className="text-center font-medium">{f.faltas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Riesgo de mis estudiantes (o el aviso si la IA está pausada) */}
        <ResumenRiesgoProfesor />
      </div>
    </SidebarLayout>
  );
};

export default ProfesorDashboard;
