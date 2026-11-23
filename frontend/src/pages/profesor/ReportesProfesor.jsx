import { useEffect, useMemo, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { MENU_PROFESOR } from '../../constants/menuProfesor';
import { getMisMaterias, getPeriodoActual, getPlanilla } from '../../services/notas.service';

// Reporte de notas y asistencia de UNA materia del docente en un trimestre.
// Usa la misma planilla que el registro de notas: el servidor solo devuelve las
// materias de este docente y sus estudiantes ACTIVOS, con los cálculos oficiales.

// a / b redondeado a entero (0,5 sube), igual que en el resto del sistema
const dividirRedondeando = (a, b) => Math.floor((2 * a + b) / (2 * b));
const promedioEntero = (valores) => (
  valores.length ? dividirRedondeando(valores.reduce((s, v) => s + v, 0), valores.length) : null
);
// % de asistencia: (PRESENTE + JUSTIFICADO) / clases registradas; null si no hubo clases
const porcentajeAsistencia = ({ presentes = 0, justificados = 0, total = 0 } = {}) => (
  total > 0 ? dividirRedondeando((presentes + justificados) * 100, total) : null
);

// Neutraliza fórmulas en el CSV: una celda que empieza con = + - @ se ejecutaría en Excel
const celdaSegura = (valor) => {
  const texto = String(valor ?? '');
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
};

const nombreMateria = (m) => `${m.materia?.nombre ?? '—'} — ${m.curso ? `${m.curso.nivel}° ${m.curso.paralelo}` : '—'}`;

const Kpi = ({ valor, etiqueta, color }) => (
  <div className="ios-card p-4 text-center print:shadow-none print:border print:border-gray-300">
    <div className="text-[24px] font-bold" style={{ color }}>{valor ?? '—'}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>{etiqueta}</div>
  </div>
);

export default function ReportesProfesor() {
  const [materias, setMaterias] = useState(null);
  const [periodo, setPeriodo] = useState(null);
  const [materiaId, setMateriaId] = useState('');
  const [trimestre, setTrimestre] = useState(null);
  const [datos, setDatos] = useState(null); // { clave, planilla }
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    Promise.all([getMisMaterias(), getPeriodoActual()])
      .then(([lista, actual]) => {
        if (!vigente) return;
        const propias = (lista || []).filter((m) => !actual?.gestion || m.gestion === actual.gestion);
        setPeriodo(actual);
        setMaterias(propias);
        setMateriaId(propias[0]?.id || '');
        setTrimestre(actual?.trimestre || 1);
      })
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudieron cargar tus materias'));
    return () => { vigente = false; };
  }, []);

  const clave = materiaId && trimestre ? `${materiaId}|${trimestre}` : null;

  useEffect(() => {
    if (!clave) return undefined;
    let vigente = true;
    getPlanilla(materiaId, trimestre)
      .then((planilla) => { if (vigente) { setError(''); setDatos({ clave, planilla }); } })
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudo cargar el reporte'));
    return () => { vigente = false; };
  }, [clave, materiaId, trimestre]);

  const planilla = datos?.clave === clave ? datos.planilla : null;
  const materia = materias?.find((m) => m.id === materiaId);

  const filas = useMemo(() => (planilla?.estudiantes || []).map((e, i) => ({
    n: i + 1,
    nombre: e.nombre,
    tieneNota: e.tieneNota,
    // completa: con nota final · pendiente: evaluación iniciada pero falta alguna casilla o la autoevaluación
    completa: e.tieneNota && e.total !== null,
    pendiente: e.tieneNota && e.total === null,
    ser: e.ser,
    saber: e.saber,
    hacer: e.hacer,
    autoevaluacion: e.autoevaluacion,
    total: e.total,
    aprobado: e.aprobado,
    asistencia: porcentajeAsistencia(e.asistencia),
    faltas: e.asistencia?.ausentes ?? 0,
    clases: e.asistencia?.total ?? 0,
  })), [planilla]);

  const resumen = useMemo(() => {
    const conNota = filas.filter((f) => f.completa);
    const conAsistencia = filas.filter((f) => f.asistencia !== null);
    return {
      estudiantes: filas.length,
      promedio: promedioEntero(conNota.map((f) => f.total)),
      aprobados: conNota.filter((f) => f.aprobado).length,
      reprobados: conNota.filter((f) => !f.aprobado).length,
      sinNota: filas.filter((f) => !f.tieneNota).length,
      pendientes: filas.filter((f) => f.pendiente).length,
      asistencia: promedioEntero(conAsistencia.map((f) => f.asistencia)),
    };
  }, [filas]);

  const exportarCSV = () => {
    if (!filas.length || !materia) return;
    const encabezado = ['N°', 'Estudiante', 'SER (10)', 'SABER (45)', 'HACER (40)', 'AUTOEVALUACIÓN (5)', 'Total (100)', 'Estado', 'Asistencia (%)', 'Faltas', 'Clases'];
    const cuerpo = filas.map((f) => [
      f.n, f.nombre,
      f.tieneNota ? (f.ser ?? 'Pendiente') : '', f.tieneNota ? (f.saber ?? 'Pendiente') : '', f.tieneNota ? (f.hacer ?? 'Pendiente') : '',
      f.autoevaluacion ?? (f.tieneNota ? 'Pendiente' : ''), f.completa ? f.total : '',
      f.completa ? (f.aprobado ? 'Aprobado' : 'Reprobado') : f.pendiente ? 'Calificación pendiente' : 'Sin notas',
      f.asistencia ?? '', f.faltas, f.clases,
    ]);
    const csv = '﻿' + [encabezado, ...cuerpo]
      .map((fila) => fila.map((c) => `"${celdaSegura(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    const curso = materia.curso ? `${materia.curso.nivel}${materia.curso.paralelo}` : 'curso';
    a.download = `reporte_${(materia.materia?.nombre || 'materia').replace(/\s+/g, '_')}_${curso}_T${trimestre}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const controles = materias && materias.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="ios-select" aria-label="Materia">
        {materias.map((m) => <option key={m.id} value={m.id}>{nombreMateria(m)}</option>)}
      </select>
      <select value={trimestre || ''} onChange={(e) => setTrimestre(Number(e.target.value))} className="ios-select" aria-label="Trimestre">
        {[1, 2, 3].map((t) => (
          <option key={t} value={t}>Trimestre {t}{periodo?.trimestre === t ? ' (activo)' : ''}</option>
        ))}
      </select>
    </div>
  );

  return (
    <SidebarLayout
      menuGroups={MENU_PROFESOR}
      headerTitle="Reportes"
      headerSubtitle="Notas y asistencia de tus materias"
    >
      <div className="space-y-5">
        {error && <div className="ios-card p-4 text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>}

        {!materias && !error && (
          <div className="text-center py-12 text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando...</div>
        )}

        {materias && materias.length === 0 && (
          <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
            Aún no tienes materias asignadas en esta gestión.
          </div>
        )}

        {materias && materias.length > 0 && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-3">
              {controles}
              <div className="flex gap-2 print:hidden">
                <button type="button" onClick={exportarCSV} disabled={!filas.length} className="ios-btn-ghost text-[13px]">
                  <FileText size={14} /> Exportar CSV
                </button>
                <button type="button" onClick={() => window.print()} disabled={!planilla} className="ios-btn-ghost text-[13px]">
                  <Printer size={14} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Encabezado que solo aparece al imprimir */}
            <div className="hidden print:block text-center mb-4">
              <div className="text-[16px] font-bold">Unidad Educativa La Paz "A" — Reporte de notas y asistencia</div>
              {materia && (
                <div className="text-[12px]">
                  {nombreMateria(materia)} · Trimestre {trimestre} · Gestión {materia.gestion}
                </div>
              )}
            </div>

            {!planilla && !error && (
              <div className="text-center py-8 text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando reporte...</div>
            )}

            {planilla && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Kpi valor={resumen.estudiantes} etiqueta="Estudiantes" color="var(--ios-blue)" />
                  <Kpi valor={resumen.promedio} etiqueta="Promedio" color="var(--ios-label)" />
                  <Kpi valor={resumen.aprobados} etiqueta="Aprobados" color="var(--ios-green)" />
                  <Kpi valor={resumen.reprobados} etiqueta={resumen.pendientes ? `Reprobados · ${resumen.pendientes} pendiente(s)` : 'Reprobados'} color="var(--ios-red)" />
                  <Kpi valor={resumen.asistencia === null ? null : `${resumen.asistencia}%`} etiqueta="Asistencia" color="var(--ios-orange)" />
                </div>

                <div className="ios-card overflow-x-auto print:shadow-none print:border print:border-gray-300">
                  <table className="ios-table">
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Estudiante</th>
                        <th className="text-center">SER<br /><span className="font-normal">/10</span></th>
                        <th className="text-center">SABER<br /><span className="font-normal">/45</span></th>
                        <th className="text-center">HACER<br /><span className="font-normal">/40</span></th>
                        <th className="text-center">AUTO<br /><span className="font-normal">/5</span></th>
                        <th className="text-center">Total<br /><span className="font-normal">/100</span></th>
                        <th className="text-center">Estado</th>
                        <th className="text-center">Asistencia</th>
                        <th className="text-center">Faltas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8" style={{ color: 'var(--ios-secondary)' }}>
                            No hay estudiantes activos en este curso.
                          </td>
                        </tr>
                      ) : filas.map((f) => (
                        <tr key={f.n}>
                          <td className="text-[12px]">{f.n}</td>
                          <td className="text-[12px] font-medium">{f.nombre}</td>
                          <td className="text-center text-[12px]">{f.tieneNota ? (f.ser ?? 'Pend.') : '—'}</td>
                          <td className="text-center text-[12px]">{f.tieneNota ? (f.saber ?? 'Pend.') : '—'}</td>
                          <td className="text-center text-[12px]">{f.tieneNota ? (f.hacer ?? 'Pend.') : '—'}</td>
                          <td className="text-center text-[12px]">{f.autoevaluacion ?? '—'}</td>
                          <td className="text-center text-[13px] font-bold"
                            style={{ color: !f.completa ? 'var(--ios-tertiary)' : f.aprobado ? 'var(--ios-green)' : 'var(--ios-red)' }}>
                            {f.completa ? f.total : '—'}
                          </td>
                          <td className="text-center">
                            {f.completa ? (
                              <span className={f.aprobado ? 'ios-badge ios-badge-success' : 'ios-badge ios-badge-danger'}>
                                {f.aprobado ? 'Aprobado' : 'Reprobado'}
                              </span>
                            ) : <span className="ios-badge ios-badge-neutral">{f.pendiente ? 'Calificación pendiente' : 'Sin notas'}</span>}
                          </td>
                          <td className="text-center text-[12px]">{f.asistencia === null ? 'Sin clases' : `${f.asistencia}%`}</td>
                          <td className="text-center text-[12px]">{f.faltas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px]" style={{ color: 'var(--ios-tertiary)' }}>
                  Notas calculadas por el sistema con la escala SER 10 + SABER 45 + HACER 40 + AUTOEVALUACIÓN 5 (aprobado con {planilla.umbralAprobacion ?? 51} o más).
                  La asistencia cuenta PRESENTE y JUSTIFICADO. Solo se incluyen estudiantes activos.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
