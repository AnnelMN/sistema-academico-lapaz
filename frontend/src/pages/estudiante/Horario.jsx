import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const Horario = () => {
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHorario();
  }, []);

  const cargarHorario = async () => {
    try {
      const data = await estudianteService.getMiHorario();
      setProgramaciones(data);
    } catch (error) {
      console.error('Error cargando horario:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para procesar el string de horario (ej: "Lunes 08:00-09:30")
  const parseHorario = (horarioStr) => {
    const parts = horarioStr.split(' ');
    return {
      dia: parts[0] || 'Desconocido',
      horas: parts[1] || 'Sin hora'
    };
  };

  // Agrupar por día
  const horarioPorDia = DIAS.reduce((acc, dia) => {
    acc[dia] = programaciones.filter(p => {
      const { dia: diaMateria } = parseHorario(p.horario);
      // Case insensitive match
      return diaMateria.toLowerCase() === dia.toLowerCase();
    });
    // Ordenar por hora
    acc[dia].sort((a, b) => {
      const horaA = parseHorario(a.horario).horas;
      const horaB = parseHorario(b.horario).horas;
      return horaA.localeCompare(horaB);
    });
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando horario...</div>;
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-[16px] font-bold text-[#1a1a2e]">Mi Horario Semanal</h2>
        <p className="text-[11px] text-slate-500">Materias programadas para el curso actual.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DIAS.map(dia => (
          <div key={dia} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{dia}</span>
            </div>
            
            <div className="p-3 flex-1 flex flex-col gap-3">
              {horarioPorDia[dia].length === 0 ? (
                <div className="text-center text-[11px] text-slate-400 py-4 flex-1 flex items-center justify-center">
                  Día libre
                </div>
              ) : (
                horarioPorDia[dia].map(p => {
                  const { horas } = parseHorario(p.horario);
                  return (
                    <div key={p.id} className="bg-slate-50/50 rounded-md p-3 border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="text-[12px] font-bold text-[#1a1a2e] mb-1 leading-tight">
                        {p.materia.nombre}
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Clock size={11} className="text-slate-400" />
                          <span>{horas}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <User size={11} className="text-slate-400" />
                          <span className="truncate">Prof. {p.docente.usuario.nombre.split(' ')[0]} {p.docente.usuario.nombre.split(' ')[1]}</span>
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
