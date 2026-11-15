import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

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

  const parseHorario = (str) => {
    const parts = str.split(' ');
    return { dia: parts[0] || 'Desconocido', horas: parts[1] || 'Sin hora' };
  };

  const horarioPorDia = DIAS.reduce((acc, dia) => {
    acc[dia] = programaciones
      .filter(p => parseHorario(p.horario).dia.toLowerCase() === dia.toLowerCase())
      .sort((a, b) => parseHorario(a.horario).horas.localeCompare(parseHorario(b.horario).horas));
    return acc;
  }, {});

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
                  const { horas } = parseHorario(p.horario);
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl p-3 transition-all"
                      style={{
                        backgroundColor: 'var(--ios-blue-light)',
                        border: '1px solid rgba(0,122,255,0.15)',
                      }}
                    >
                      <div className="text-[12px] font-semibold mb-2 leading-tight"
                        style={{ color: 'var(--ios-blue)' }}>
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
                            Prof. {p.docente.usuario.nombre.split(' ')[0]} {p.docente.usuario.nombre.split(' ')[1]}
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
