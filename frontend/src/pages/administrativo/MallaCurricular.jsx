import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download } from 'lucide-react';
import { getMaterias, getCursos, getDocentes, getProgramaciones, createProgramacion } from '../../services/academico.service';

const Horarios = () => {
  const [materias, setMaterias] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [programaciones, setProgramaciones] = useState([]);
  
  const [formData, setFormData] = useState({
    cursoId: '',
    materiaId: '',
    docenteId: '',
    dia: 'Lunes',
    hora: '07:30'
  });

  const [loading, setLoading] = useState(true);
  const [cursoHorario, setCursoHorario] = useState('');

  const horas = ['07:30', '08:30', '09:30', '10:30', '11:30'];
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mats, curs, docs, progs] = await Promise.all([
        getMaterias(),
        getCursos(),
        getDocentes(),
        getProgramaciones()
      ]);
      
      setMaterias(mats);
      setCursos(curs);
      setDocentes(docs);
      setProgramaciones(progs);
      
      if (curs.length > 0) {
        setFormData(prev => ({ ...prev, cursoId: curs[0].id }));
        setCursoHorario(curs[0].id);
        if (mats.length > 0) setFormData(prev => ({ ...prev, materiaId: mats[0].id }));
        if (docs.length > 0) setFormData(prev => ({ ...prev, docenteId: docs[0].id }));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cursoId') setCursoHorario(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const horarioStr = `${formData.dia}-${formData.hora}`;
    try {
      await createProgramacion({
        cursoId: formData.cursoId,
        materiaId: formData.materiaId,
        docenteId: formData.docenteId,
        horario: horarioStr
      });
      const progs = await getProgramaciones();
      setProgramaciones(progs);
    } catch (err) {
      console.error('Error al guardar asignación:', err);
    }
  };

  const programacionesCurso = programaciones.filter(p => p.cursoId === cursoHorario);
  const grid = {};
  horas.forEach(h => {
    grid[h] = {};
    dias.forEach(d => {
      grid[h][d] = null;
    });
  });

  programacionesCurso.forEach(p => {
    const [diaStr, horaStr] = p.horario.split('-');
    if (grid[horaStr] && grid[horaStr][diaStr] !== undefined) {
      grid[horaStr][diaStr] = p;
    }
  });

  const cursoSeleccionadoData = cursos.find(c => c.id === cursoHorario);
  const nombreCurso = cursoSeleccionadoData ? `${cursoSeleccionadoData.nivel}ro ${cursoSeleccionadoData.paralelo}` : '';

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-[12px]">Cargando horarios...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-bold text-[#1a1a2e]">Gestión de Horarios</h2>
          <p className="text-[11px] text-slate-400">Asignación de turnos y control de carga horaria por curso</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Download size={14} /> Exportar horarios
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Materias</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{materias.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cursos activos</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{cursos.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Docentes asign.</div>
          <div className="text-[22px] font-bold text-[#1a1a2e]">{docentes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Horas libres</div>
          <div className="text-[22px] font-bold text-[#16a34a]">4</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Asignación Form */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] mb-4 uppercase tracking-tight">Asignación rápida de horario</div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Curso</label>
              <select name="cursoId" value={formData.cursoId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nivel}ro {c.paralelo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Materia</label>
              <select name="materiaId" value={formData.materiaId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.nivel}ro)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Docente</label>
              <select name="docenteId" value={formData.docenteId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                {docentes.map(d => <option key={d.id} value={d.id}>{d.usuario?.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Día</label>
                <select name="dia" value={formData.dia} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  {dias.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hora</label>
                <select name="hora" value={formData.hora} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  {horas.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full mt-2 bg-[#4a90e2] hover:bg-blue-600 text-white text-[11px] font-bold py-2.5 rounded-md transition-colors">
              Guardar horario
            </button>
          </form>
        </div>

        {/* Right: Timetable Grid */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight">Calendario Semanal — {nombreCurso}</div>
            <select 
              value={cursoHorario} 
              onChange={(e) => setCursoHorario(e.target.value)}
              className="border border-slate-200 px-3 py-1 rounded-md text-[11px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nivel}ro {c.paralelo}</option>)}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 w-16"></th>
                  {dias.map(d => (
                    <th key={d} className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horas.map((h, i) => (
                  <React.Fragment key={h}>
                    <tr className="border-t border-slate-50">
                      <td className="py-4 text-[11px] font-bold text-slate-400">{h}</td>
                      {dias.map((d, idx) => {
                        const cell = grid[h][d];
                        return (
                          <td key={idx} className="p-1">
                            <div className={`rounded-md p-2 min-h-[50px] flex flex-col justify-center transition-all ${cell ? 'bg-[#dbeafe] border border-[#bfdbfe]' : 'bg-slate-50 border border-slate-100 border-dashed'}`}>
                              {cell ? (
                                <>
                                  <div className="text-[10px] font-bold text-[#1e40af] leading-tight">{cell.materia.nombre}</div>
                                  <div className="text-[9px] text-[#3b82f6] font-medium mt-1">{cell.docente.usuario?.nombre?.split(' ')[0]}</div>
                                </>
                              ) : (
                                <span className="text-[9px] text-slate-300 font-bold tracking-widest">—</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {i === 2 && (
                      <tr>
                        <td className="py-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center" colSpan="6">
                          <div className="bg-slate-50 rounded-md py-1 border border-slate-100">Recreo</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Horarios;
