import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { MENU_PROFESOR } from '../../constants/menuProfesor';
import { getMisMaterias, getPeriodoActual } from '../../services/notas.service';
import { DIAS_SEMANA, agruparPorDia, leerHorario } from '../../utils/horario';

// Horario semanal del docente: sus clases (materia, curso y hora) de lunes a viernes.
// El servidor solo devuelve las materias programadas de este docente.

export default function MiHorario() {
  const [clases, setClases] = useState(null);
  const [gestion, setGestion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    Promise.all([getMisMaterias(), getPeriodoActual()])
      .then(([lista, actual]) => {
        if (!vigente) return;
        const anio = actual?.gestion ?? null;
        setGestion(anio);
        // Solo la gestión en curso (si hoy no hay trimestre activo, todas)
        setClases((lista || []).filter((m) => !anio || m.gestion === anio));
      })
      .catch((err) => vigente && setError(err.response?.data?.error || 'No se pudo cargar tu horario'));
    return () => { vigente = false; };
  }, []);

  const porDia = useMemo(() => agruparPorDia(clases || []), [clases]);
  const sinHorario = useMemo(() => (clases || []).filter((c) => !leerHorario(c.horario).dia), [clases]);
  // Dos clases del docente el mismo día y hora
  const choques = useMemo(() => DIAS_SEMANA.flatMap((dia) => {
    const lista = porDia[dia];
    return lista.filter((c, i) => lista.some((o, j) => j !== i && o.hora === c.hora)).map((c) => `${dia} ${c.hora}`);
  }), [porDia]);
  const cursos = useMemo(() => new Set((clases || []).map((c) => c.cursoId)).size, [clases]);

  return (
    <SidebarLayout
      menuGroups={MENU_PROFESOR}
      headerTitle="Mi horario"
      headerSubtitle={gestion ? `Clases de la gestión ${gestion}` : 'Clases asignadas'}
    >
      <div className="space-y-5">
        {error && <div className="ios-card p-4 text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>}

        {!clases && !error && (
          <div className="text-center py-12 text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando horario...</div>
        )}

        {clases && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="ios-card p-4 text-center">
                <div className="text-[26px] font-bold" style={{ color: 'var(--ios-blue)' }}>{clases.length}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Clases por semana</div>
              </div>
              <div className="ios-card p-4 text-center">
                <div className="text-[26px] font-bold" style={{ color: 'var(--ios-green)' }}>{cursos}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Cursos</div>
              </div>
              <div className="ios-card p-4 text-center col-span-2 md:col-span-1">
                <div className="text-[26px] font-bold" style={{ color: 'var(--ios-orange)' }}>
                  {DIAS_SEMANA.filter((d) => porDia[d].length).length}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--ios-secondary)' }}>Días con clases</div>
              </div>
            </div>

            {choques.length > 0 && (
              <div className="ios-card p-4 flex gap-2 text-[12px]" style={{ color: 'var(--ios-red)' }}>
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>
                  Tienes más de una clase a la misma hora ({[...new Set(choques)].join(', ')}).
                  Avisa al Administrativo para que corrija el horario.
                </span>
              </div>
            )}

            {clases.length === 0 ? (
              <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
                Aún no tienes materias asignadas en esta gestión.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {DIAS_SEMANA.map((dia) => (
                  <section key={dia} className="ios-card overflow-hidden flex flex-col" aria-label={dia}>
                    <div className="px-4 py-3 flex items-center gap-2"
                      style={{ borderBottom: '1px solid var(--ios-separator)', backgroundColor: 'var(--ios-bg)' }}>
                      <Calendar size={13} style={{ color: 'var(--ios-blue)' }} />
                      <span className="text-[12px] font-semibold uppercase tracking-tight" style={{ color: 'var(--ios-label)' }}>{dia}</span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col gap-2">
                      {porDia[dia].length === 0 ? (
                        <div className="text-center text-[11px] py-4 flex-1 flex items-center justify-center" style={{ color: 'var(--ios-tertiary)' }}>
                          Sin clases
                        </div>
                      ) : porDia[dia].map((c) => (
                        <div key={c.id} className="rounded-xl p-3"
                          style={{ backgroundColor: 'var(--ios-blue-light)', border: '1px solid rgba(0,122,255,0.15)' }}>
                          <div className="text-[12px] font-semibold mb-2 leading-tight" style={{ color: 'var(--ios-blue)' }}>
                            {c.materia?.nombre ?? '—'}
                          </div>
                          <div className="flex flex-col gap-1 text-[10px]" style={{ color: 'var(--ios-secondary)' }}>
                            <span className="flex items-center gap-1.5"><Clock size={10} /> {c.hora}</span>
                            <span className="flex items-center gap-1.5">
                              <Users size={10} /> {c.curso ? `${c.curso.nivel}° ${c.curso.paralelo}` : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {sinHorario.length > 0 && (
              <div className="ios-card p-4 text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
                Clases con un horario que no se pudo leer:{' '}
                {sinHorario.map((c) => `${c.materia?.nombre ?? '—'} (${c.horario || 'sin horario'})`).join(', ')}.
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
