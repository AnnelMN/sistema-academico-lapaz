import { useMemo } from 'react';
import {
  DIMENSIONES, PESOS, MAX_CASILLA, MAX_AUTOEVALUACION, calcularFila, leerEntero, claveCelda, claveAuto, textoPendientes,
} from '../../utils/calculoNotas';

// Planilla de notas por casillas, compartida por el profesor (editable) y el
// Director (solo lectura).
// cambios: { 'estudianteId|casillaId': texto, 'auto|estudianteId': texto } — lo que el
// docente escribió y aún no guardó. onCambio(clave, texto) actualiza ese borrador.

const COLOR_DIMENSION = {
  SER: 'var(--ios-blue)',
  SABER: 'var(--ios-orange)',
  HACER: 'var(--ios-green)',
};

const celdaBase = 'px-1.5 py-2 text-center text-[12px] whitespace-nowrap';

function Entrada({ valor, max, onChange, invalido, pendiente, etiqueta }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={etiqueta}
      title={pendiente && !invalido ? `${etiqueta} — sin guardar` : etiqueta}
      value={valor}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
      className="w-11 rounded-md px-1 py-1 text-center text-[12px] outline-none"
      style={{
        border: `1px solid ${invalido ? 'var(--ios-red)' : pendiente ? 'var(--ios-orange)' : 'var(--ios-separator)'}`,
        backgroundColor: invalido ? 'var(--ios-red-light)' : pendiente ? 'var(--ios-orange-light)' : 'transparent',
        color: 'var(--ios-label)',
      }}
      placeholder="—"
      maxLength={max === MAX_AUTOEVALUACION ? 1 : 3}
    />
  );
}

export default function PlanillaNotas({ planilla, editable, cambios = {}, onCambio }) {
  const columnas = useMemo(() => {
    const porDimension = {};
    for (const d of DIMENSIONES) {
      porDimension[d] = planilla.casillas.filter((c) => c.dimension === d).sort((a, b) => a.orden - b.orden);
    }
    return porDimension;
  }, [planilla]);

  // Nota máxima de cada casilla según su dimensión (SER 10, SABER 45, HACER 40)
  const maximoDe = useMemo(
    () => new Map(planilla.casillas.map((c) => [c.id, MAX_CASILLA[c.dimension]])),
    [planilla]
  );

  // Valor efectivo de una celda: lo escrito (si hay) o lo guardado
  const valorDe = (estudiante, casillaId) => {
    const clave = claveCelda(estudiante.id, casillaId);
    if (clave in cambios) {
      const v = leerEntero(cambios[clave], maximoDe.get(casillaId));
      return Number.isNaN(v) ? null : v;
    }
    return estudiante.valores[casillaId] ?? null;
  };

  const autoDe = (estudiante) => {
    const clave = claveAuto(estudiante.id);
    if (clave in cambios) {
      const v = leerEntero(cambios[clave], MAX_AUTOEVALUACION);
      return Number.isNaN(v) ? null : v;
    }
    return estudiante.autoevaluacion;
  };

  // Una casilla cuenta si al menos un estudiante tiene nota en ella
  const calificadas = new Set();
  for (const c of planilla.casillas) {
    if (c.esAsistencia) continue;
    if (planilla.estudiantes.some((e) => valorDe(e, c.id) !== null)) calificadas.add(c.id);
  }

  const textoCelda = (estudiante, casillaId) => {
    const clave = claveCelda(estudiante.id, casillaId);
    if (clave in cambios) return cambios[clave];
    const v = estudiante.valores[casillaId];
    return v === undefined || v === null ? '' : String(v);
  };

  // Texto guardado de una celda (para saber si lo escrito es un cambio pendiente)
  const guardadoCelda = (estudiante, casillaId) => {
    const v = estudiante.valores[casillaId];
    return v === undefined || v === null ? '' : String(v);
  };
  const guardadoAuto = (estudiante) => (estudiante.autoevaluacion === null || estudiante.autoevaluacion === undefined ? '' : String(estudiante.autoevaluacion));

  const textoAuto = (estudiante) => {
    const clave = claveAuto(estudiante.id);
    if (clave in cambios) return cambios[clave];
    return estudiante.autoevaluacion === null || estudiante.autoevaluacion === undefined ? '' : String(estudiante.autoevaluacion);
  };

  if (!planilla.estudiantes.length) {
    return (
      <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
        No hay estudiantes inscritos en este curso.
      </div>
    );
  }

  const encabezadoGrupo = (dimension) => {
    const n = Math.max(columnas[dimension].length, 1);
    return (
      <th
        key={dimension}
        colSpan={n + 1}
        className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider"
        style={{ color: COLOR_DIMENSION[dimension], borderLeft: '2px solid var(--ios-separator)' }}
      >
        {dimension} ({PESOS[dimension]})
      </th>
    );
  };

  return (
    <div className="ios-card overflow-x-auto p-0">
      <table className="min-w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--ios-bg)' }}>
            <th
              rowSpan={2}
              className="sticky left-0 z-10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--ios-bg)', color: 'var(--ios-secondary)', minWidth: 180 }}
            >
              Estudiante
            </th>
            {DIMENSIONES.map(encabezadoGrupo)}
            <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8e44ad', borderLeft: '2px solid var(--ios-separator)' }}>
              Autoev.<br />(5)
            </th>
            <th rowSpan={2} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-label)', borderLeft: '2px solid var(--ios-separator)' }}>
              Total<br />(100)
            </th>
            <th rowSpan={2} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
              Estado
            </th>
          </tr>
          <tr style={{ backgroundColor: 'var(--ios-bg)' }}>
            {DIMENSIONES.map((dimension) => {
              const lista = columnas[dimension];
              return [
                ...(lista.length ? lista.map((c, i) => (
                  <th
                    key={c.id}
                    title={`${c.esAsistencia ? 'Asistencia (automática)' : c.nombre || `Casilla ${i + 1}`} — sobre ${MAX_CASILLA[dimension]}`}
                    className="px-1.5 py-1.5 text-center text-[10px] font-semibold max-w-[70px] truncate"
                    style={{
                      color: c.esAsistencia ? 'var(--ios-tertiary)' : 'var(--ios-secondary)',
                      borderLeft: i === 0 ? '2px solid var(--ios-separator)' : undefined,
                      opacity: !c.esAsistencia && !calificadas.has(c.id) ? 0.6 : 1,
                    }}
                  >
                    {c.esAsistencia ? 'Asist.' : (c.nombre || `C${i + 1}`)}
                  </th>
                )) : [
                  <th key={`${dimension}-vacia`} className="px-2 py-1.5 text-center text-[10px] italic" style={{ color: 'var(--ios-tertiary)', borderLeft: '2px solid var(--ios-separator)' }}>
                    sin casillas
                  </th>,
                ]),
                <th key={`${dimension}-sub`} className="px-2 py-1.5 text-center text-[10px] font-bold" style={{ color: COLOR_DIMENSION[dimension] }}>
                  /{PESOS[dimension]}
                </th>,
              ];
            })}
          </tr>
        </thead>
        <tbody>
          {planilla.estudiantes.map((est) => {
            // Estudiante desactivado (solo lo ve el Director): su nota guardada, sin recalcular
            const inactivo = est.activo === false;
            const fila = inactivo ? {
              SER: est.ser, SABER: est.saber, HACER: est.hacer, total: est.total, aprobado: est.aprobado,
              pendientes: est.total === null ? ['SER', 'SABER', 'HACER', 'AUTOEVALUACION'].filter((d) => (d === 'AUTOEVALUACION' ? est.autoevaluacion : est[d.toLowerCase()]) === null) : [],
            } : calcularFila({
              casillas: planilla.casillas,
              valorDe: (casillaId) => valorDe(est, casillaId),
              asistencia: est.asistencia?.valor ?? null,
              autoevaluacion: autoDe(est),
              umbral: planilla.umbralAprobacion,
            });
            return (
              <tr key={est.id} style={{ borderTop: '1px solid var(--ios-separator)' }}>
                <td
                  className="sticky left-0 z-10 px-4 py-2 text-[12px] font-medium"
                  style={{ backgroundColor: 'var(--ios-surface)', color: 'var(--ios-label)', borderTop: '1px solid var(--ios-separator)' }}
                >
                  {est.nombre}
                  {inactivo && (
                    <span className="ios-badge ios-badge-neutral ml-2" title="Estudiante desactivado: se muestra su historial, sin cambios">
                      Inactivo
                    </span>
                  )}
                </td>
                {DIMENSIONES.map((dimension) => {
                  const lista = columnas[dimension];
                  return [
                    ...(lista.length ? lista.map((c, i) => {
                      const borde = { borderTop: '1px solid var(--ios-separator)', borderLeft: i === 0 ? '2px solid var(--ios-separator)' : undefined };
                      if (c.esAsistencia) {
                        const a = est.asistencia || {};
                        return (
                          <td key={c.id} className={celdaBase} style={{ ...borde, color: 'var(--ios-tertiary)' }}
                            title={a.total ? `Presentes ${a.presentes} · Justificados ${a.justificados} · Ausentes ${a.ausentes} · Clases ${a.total}` : 'Aún no hay listas en este trimestre'}>
                            {a.valor ?? '—'}
                          </td>
                        );
                      }
                      const texto = textoCelda(est, c.id);
                      const maximo = MAX_CASILLA[dimension];
                      const invalido = Number.isNaN(leerEntero(texto, maximo));
                      return (
                        <td key={c.id} className={celdaBase} style={borde}>
                          {editable ? (
                            <Entrada
                              valor={texto}
                              max={maximo}
                              invalido={invalido}
                              pendiente={texto !== guardadoCelda(est, c.id)}
                              etiqueta={`${est.nombre} — ${dimension} — ${c.nombre || `Casilla ${i + 1}`} (0 a ${maximo})`}
                              onChange={(t) => onCambio(claveCelda(est.id, c.id), t)}
                            />
                          ) : (
                            <span style={{ color: 'var(--ios-label)' }}>{texto || '—'}</span>
                          )}
                        </td>
                      );
                    }) : [
                      <td key={`${dimension}-vacia`} className={celdaBase} style={{ borderTop: '1px solid var(--ios-separator)', borderLeft: '2px solid var(--ios-separator)', color: 'var(--ios-tertiary)' }}>—</td>,
                    ]),
                    <td
                      key={`${dimension}-sub`}
                      className={`${celdaBase} ${fila[dimension] === null ? 'text-[10px] italic' : 'font-bold'}`}
                      style={{ borderTop: '1px solid var(--ios-separator)', color: fila[dimension] === null ? 'var(--ios-tertiary)' : COLOR_DIMENSION[dimension] }}
                      title={fila[dimension] === null ? `${dimension} pendiente: falta calificar alguna casilla${lista.filter((c) => !c.esAsistencia).length ? '' : ' (no hay casillas)'}` : undefined}
                    >
                      {fila[dimension] === null ? 'Pend.' : fila[dimension]}
                    </td>,
                  ];
                })}
                <td className={celdaBase} style={{ borderTop: '1px solid var(--ios-separator)', borderLeft: '2px solid var(--ios-separator)' }}>
                  {editable ? (
                    <Entrada
                      valor={textoAuto(est)}
                      max={MAX_AUTOEVALUACION}
                      invalido={Number.isNaN(leerEntero(textoAuto(est), MAX_AUTOEVALUACION))}
                      pendiente={textoAuto(est) !== guardadoAuto(est)}
                      etiqueta={`${est.nombre} — Autoevaluación (0 a 5)`}
                      onChange={(t) => onCambio(claveAuto(est.id), t)}
                    />
                  ) : (
                    <span style={{ color: 'var(--ios-label)' }}>{textoAuto(est) || '—'}</span>
                  )}
                </td>
                <td
                  className={`${celdaBase} text-[14px] font-extrabold`}
                  style={{ borderTop: '1px solid var(--ios-separator)', borderLeft: '2px solid var(--ios-separator)', color: fila.total === null ? 'var(--ios-tertiary)' : fila.aprobado ? 'var(--ios-green)' : 'var(--ios-red)' }}
                  title={fila.total === null ? textoPendientes(fila.pendientes) : undefined}
                >
                  {fila.total === null ? '—' : fila.total}
                </td>
                <td className={celdaBase} style={{ borderTop: '1px solid var(--ios-separator)' }}>
                  {fila.total === null ? (
                    <span className="ios-badge ios-badge-neutral" title={textoPendientes(fila.pendientes)}>
                      Calificación pendiente
                    </span>
                  ) : (
                    <span className={fila.aprobado ? 'ios-badge ios-badge-success' : 'ios-badge ios-badge-danger'}>
                      {fila.aprobado ? 'Aprobado' : 'Reprobado'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
