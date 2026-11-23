import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';
import { DIAS_SEMANA as DIAS, agruparPorDia, leerHorario } from '../../utils/horario';

const docenteInactivo = (p) => p.docente?.usuario?.activo === false;
const claveHorario = (p) => {
  const { dia, hora } = leerHorario(p.horario);
  return `${dia}|${hora}`;
};

// La clase de un docente inactivo se oculta si ese mismo día y hora ya tiene
// una clase con docente activo (el reemplazo); si no, se muestra "por asignar".
function clasesVigentes(programaciones) {
  const ocupados = new Set(programaciones.filter((p) => !docenteInactivo(p)).map(claveHorario));
  return programaciones.filter((p) => !docenteInactivo(p) || !ocupados.has(claveHorario(p)));
}

const Horario = () => {
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarHorario(); }, []);

  const cargarHorario = async () => {
    try {
      setProgramaciones(await estudianteService.getMiHorario());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Acepta "Lunes-07:30" (formato oficial) y el antiguo "Lunes 07:30"
  const horarioPorDia = agruparPorDia(clasesVigentes(programaciones));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>Cargando horario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Mi Horario Semanal
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Materias programadas para el curso actual.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {DIAS.map(dia => (
          <div
            key={dia}
            className="ios-card overflow-hidden flex flex-col"
          >
            {/* Header del día */}
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--ios-separator)', backgroundColor: 'var(--ios-bg)' }}
            >
              <Calendar size={13} style={{ color: 'var(--ios-blue)' }} />
              <span className="text-[12px] font-semibold uppercase tracking-tight" style={{ color: 'var(--ios-label)' }}>
                {dia}
              </span>
            </div>

            {/* Materias del día */}
            <div className="p-3 flex-1 flex flex-col gap-2">
              {horarioPorDia[dia].length === 0 ? (
                <div className="text-center text-[11px] py-4 flex-1 flex items-center justify-center"
                  style={{ color: 'var(--ios-tertiary)' }}>
                  Día libre
                </div>
              ) : (
                horarioPorDia[dia].map(p => {
                  const horas = p.hora;
                  const porAsignar = docenteInactivo(p);
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl p-3 transition-all"
                      style={porAsignar
                        ? { backgroundColor: 'var(--ios-bg)', border: '1px dashed var(--ios-separator)', opacity: 0.7 }
                        : { backgroundColor: 'var(--ios-blue-light)', border: '1px solid rgba(0,122,255,0.15)' }}
                    >
                      <div className="text-[12px] font-semibold mb-2 leading-tight"
                        style={{ color: porAsignar ? 'var(--ios-secondary)' : 'var(--ios-blue)' }}>
                        {p.materia.nombre}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px]"
                          style={{ color: 'var(--ios-secondary)' }}>
                          <Clock size={10} />
                          <span>{horas}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]"
                          style={{ color: 'var(--ios-secondary)' }}>
                          <User size={10} />
                          <span className="truncate">
                            {porAsignar
                              ? 'Docente por asignar'
                              : `Prof. ${p.docente.usuario.nombre.split(' ').slice(0, 2).join(' ')}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Horario;
