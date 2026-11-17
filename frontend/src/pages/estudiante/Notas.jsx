import { Fragment, useEffect, useState } from 'react';
import { Download, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';
import { prediccionNoDisponible } from '../../constants/ia';

// Mis notas: SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5 = 100 (aprueba con 51).
// Muestra el detalle de mis casillas, los totales de cada trimestre y la nota anual.

const ETIQUETA_TRIMESTRE = { 1: '1.er', 2: '2.º', 3: '3.er' };
const DIMENSIONES = [
  { clave: 'SER', puntos: 10, color: 'var(--ios-blue)' },
  { clave: 'SABER', puntos: 45, color: 'var(--ios-orange)' },
  { clave: 'HACER', puntos: 40, color: 'var(--ios-green)' },
];

const estado = (aprobado) => (aprobado
  ? { label: 'Aprobado', cls: 'ios-badge ios-badge-success' }
  : { label: 'Reprobado', cls: 'ios-badge ios-badge-danger' });

function DetalleCasillas({ materia }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
      {DIMENSIONES.map(({ clave, puntos, color }) => (
        <div key={clave}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color }}>
            {clave} ({puntos}) — {materia.nota ? `${materia.nota[clave.toLowerCase()]} pts` : 'sin notas'}
          </div>
          {materia.detalle[clave].length === 0 ? (
            <div className="text-[12px]" style={{ color: 'var(--ios-tertiary)' }}>El profesor aún no creó casillas.</div>
          ) : (
            <ul className="space-y-1">
              {materia.detalle[clave].map((c, i) => (
                <li key={`${clave}-${i}`} className="flex justify-between gap-2 text-[12px]" style={{ color: c.cuenta ? 'var(--ios-label)' : 'var(--ios-tertiary)' }}>
                  <span>
                    {c.esAsistencia ? 'Asistencia' : (c.nombre || `Casilla ${i + (clave === 'SER' ? 0 : 1)}`)}
                    {c.esAsistencia && c.asistencia?.total > 0 && (
                      <span style={{ color: 'var(--ios-tertiary)' }}> ({c.asistencia.presentes + c.asistencia.justificados} de {c.asistencia.total})</span>
                    )}
                  </span>
                  <span className="font-semibold">{c.cuenta ? c.valor : (c.esAsistencia ? 'sin listas aún' : 'aún no calificada')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

const Notas = () => {
  const [trimestre, setTrimestre] = useState(null); // null = trimestre activo
  const [datos, setDatos] = useState(null);
  const [prediccion, setPrediccion] = useState(null);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      estudianteService.getMisNotas(trimestre),
      estudianteService.getMiPrediccion().catch(() => null),
    ])
      .then(([notas, pred]) => {
        if (!vigente) return;
        setDatos(notas);
        setPrediccion(pred);
        setError('');
      })
      .catch(() => vigente && setError('No se pudieron cargar tus notas'));
    return () => { vigente = false; };
  }, [trimestre]);

  const cargando = !datos || (trimestre !== null && datos.trimestre !== trimestre);

  if (error) {
    return <div className="ios-card p-5 text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>;
  }
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>Cargando información académica...</div>
      </div>
    );
  }

  const { materias } = datos;

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>Mis notas</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
            Gestión {datos.gestion} · SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5 · apruebas con {datos.umbralAprobacion}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={datos.trimestre}
            onChange={(e) => { setTrimestre(Number(e.target.value)); setAbierta(null); }}
            className="ios-input text-[13px]"
          >
            {[1, 2, 3].map((t) => (
              <option key={t} value={t}>{ETIQUETA_TRIMESTRE[t]} trimestre{datos.trimestreActivo === t ? ' (actual)' : ''}</option>
            ))}
          </select>
          <button onClick={() => window.print()} className="ios-btn-ghost text-[13px]">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Encabezado de impresión */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">Boletín de Calificaciones</h1>
        <p className="text-sm">Gestión {datos.gestion} — {ETIQUETA_TRIMESTRE[datos.trimestre]} trimestre</p>
      </div>

      {/* Notas del trimestre */}
      <div className="ios-card overflow-x-auto print:shadow-none print:border print:border-gray-300">
        <table className="ios-table">
          <thead>
            <tr>
              <th>Materia</th>
              {DIMENSIONES.map((d) => <th key={d.clave} className="text-center">{d.clave} ({d.puntos})</th>)}
              <th className="text-center">Autoev. (5)</th>
              <th className="text-center font-bold">Total (100)</th>
              <th className="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {materias.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10" style={{ color: 'var(--ios-secondary)' }}>
                  Tu curso aún no tiene materias programadas.
                </td>
              </tr>
            ) : materias.map((m) => {
              const est = m.nota ? estado(m.nota.aprobado) : null;
              const abiertaAqui = abierta === m.materiaProgramadaId;
              return (
                <Fragment key={m.materiaProgramadaId}>
                  <tr className="cursor-pointer print:cursor-auto" onClick={() => setAbierta(abiertaAqui ? null : m.materiaProgramadaId)}>
                    <td className="font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="print:hidden">{abiertaAqui ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                        {m.materia}
                      </span>
                      {m.docente && <div className="text-[11px] font-normal" style={{ color: 'var(--ios-tertiary)' }}>{m.docente}</div>}
                    </td>
                    {m.nota ? (
                      <>
                        <td className="text-center">{m.nota.ser}</td>
                        <td className="text-center">{m.nota.saber}</td>
                        <td className="text-center">{m.nota.hacer}</td>
                        <td className="text-center">{m.nota.autoevaluacion ?? '—'}</td>
                        <td className="text-center font-bold text-[15px]" style={{ color: m.nota.aprobado ? 'var(--ios-green)' : 'var(--ios-red)' }}>{m.nota.total}</td>
                        <td className="text-center"><span className={est.cls}>{est.label}</span></td>
                      </>
                    ) : (
                      <td colSpan={6} className="text-center text-[12px]" style={{ color: 'var(--ios-tertiary)' }}>
                        Sin notas registradas en este trimestre
                      </td>
                    )}
                  </tr>
                  {abiertaAqui && (
                    <tr className="print:hidden">
                      <td colSpan={7} style={{ backgroundColor: 'var(--ios-bg)' }}>
                        <DetalleCasillas materia={m} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] print:hidden" style={{ color: 'var(--ios-tertiary)' }}>
        Toca una materia para ver el detalle de tus casillas. Cada dimensión es el promedio de sus casillas, redondeado.
      </p>

      {/* Resumen anual */}
      {materias.length > 0 && (
        <div className="ios-card overflow-x-auto print:shadow-none print:border print:border-gray-300">
          <div className="px-4 pt-4 text-[14px] font-semibold" style={{ color: 'var(--ios-label)' }}>
            Resumen de la gestión {datos.gestion}
          </div>
          <table className="ios-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th className="text-center">1.er trim.</th>
                <th className="text-center">2.º trim.</th>
                <th className="text-center">3.er trim.</th>
                <th className="text-center font-bold">Nota anual</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m.materiaProgramadaId}>
                  <td className="font-semibold">{m.materia}</td>
                  {[1, 2, 3].map((t) => (
                    <td key={t} className="text-center">{m.trimestres[t] ?? '—'}</td>
                  ))}
                  <td className="text-center font-bold" style={{ color: m.anual.nota === null ? 'var(--ios-tertiary)' : m.anual.nota >= datos.umbralAprobacion ? 'var(--ios-green)' : 'var(--ios-red)' }}>
                    {m.anual.nota ?? '—'}
                    {m.anual.nota !== null && m.anual.parcial && (
                      <span className="block text-[10px] font-normal" style={{ color: 'var(--ios-tertiary)' }}>
                        parcial ({m.anual.trimestresConNota} de 3)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bloque IA */}
      {prediccionNoDisponible(prediccion) && (
        <div className="print:hidden">
          <PrediccionNoDisponible compacto />
        </div>
      )}
      {prediccion && !prediccionNoDisponible(prediccion) && prediccion.nivelRiesgo !== 'SIN_EVALUAR' && (
        <div className="ios-card p-5 flex items-start gap-4 print:hidden">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor:
                prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'var(--ios-red-light)' :
                prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'var(--ios-orange-light)' :
                'var(--ios-green-light)'
            }}
          >
            {prediccion.nivelRiesgo === 'RIESGO_ALTO' ? (
              <AlertTriangle size={20} style={{ color: 'var(--ios-red)' }} />
            ) : prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? (
              <Info size={20} style={{ color: 'var(--ios-orange)' }} />
            ) : (
              <CheckCircle size={20} style={{ color: 'var(--ios-green)' }} />
            )}
          </div>
          <div>
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ios-label)' }}>
              Análisis Predictivo de Rendimiento
            </h3>
            <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              Basado en tu historial académico y asistencia, el modelo de IA estima que tu nivel actual es de{' '}
              <strong style={{
                color:
                  prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'var(--ios-red)' :
                  prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'var(--ios-orange)' :
                  'var(--ios-green)'
              }}>
                {prediccion.nivelRiesgo.replace('_', ' ')}
              </strong>.
            </p>
            <div className="mt-1.5 text-[11px]" style={{ color: 'var(--ios-tertiary)' }}>
              Probabilidad estimada de dificultades: {(prediccion.probabilidad * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notas;
