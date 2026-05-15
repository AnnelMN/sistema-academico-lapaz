import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { getMisMaterias, getNotasEstudiantes, upsertNota } from '../../services/notas.service';
import { Save, AlertCircle, CheckCircle, Info } from 'lucide-react';

const RegistroNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [trimestre, setTrimestre] = useState('1');
  const [materiaId, setMateriaId] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const menuGroups = [
    {
      title: 'Mi Panel',
      items: [
        { label: 'Dashboard', path: '/profesor', dotColor: 'bg-[#60a5fa]' },
        { label: 'Registrar notas', path: '/profesor/notas', dotColor: 'bg-[#fb923c]', exact: true },
        { label: 'Asistencia', path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
      ]
    },
    {
      title: 'Consultas',
      items: [
        { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
        { label: 'Mi horario', path: '/profesor/horario', dotColor: 'bg-[#fbbf24]' },
        { label: 'Reportes', path: '/profesor/reportes', dotColor: 'bg-[#9ca3af]' },
      ]
    }
  ];

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    try {
      const data = await getMisMaterias();
      setMaterias(data);
      if (data.length > 0) setMateriaId(data[0].id);
    } catch (error) {
      console.error('Error fetching materias:', error);
    }
  };

  useEffect(() => {
    if (materiaId && trimestre) {
      fetchNotas();
    }
  }, [materiaId, trimestre]);

  const fetchNotas = async () => {
    try {
      setLoading(true);
      const data = await getNotasEstudiantes(materiaId, trimestre);
      setEstudiantes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notas:', error);
      setLoading(false);
    }
  };

  const handleNotaChange = (index, field, value) => {
    const updated = [...estudiantes];
    const numValue = value === '' ? 0 : parseFloat(value);
    
    // Validaciones de rango
    if (field === 'ser' && (numValue < 0 || numValue > 15)) return;
    if (field === 'saber' && (numValue < 0 || numValue > 35)) return;
    if (field === 'hacer' && (numValue < 0 || numValue > 50)) return;

    updated[index][field] = value === '' ? '' : numValue;
    
    // Recalcular total
    const ser = updated[index].ser || 0;
    const saber = updated[index].saber || 0;
    const hacer = updated[index].hacer || 0;
    updated[index].total = ser + saber + hacer;
    
    setEstudiantes(updated);
  };

  const getEstado = (total) => {
    if (total >= 51) return { label: 'Aprobado', class: 'bg-green-100 text-green-700' };
    if (total >= 40) return { label: 'Atención', class: 'bg-amber-100 text-amber-700' };
    return { label: 'Riesgo', class: 'bg-red-100 text-red-700' };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: 'info', text: 'Guardando cambios...' });
      
      const promises = estudiantes.map(est => upsertNota({
        estudianteId: est.id,
        materiaProgramadaId: materiaId,
        trimestre: parseInt(trimestre),
        ser: est.ser || 0,
        saber: est.saber || 0,
        hacer: est.hacer || 0
      }));

      await Promise.all(promises);
      
      setMessage({ type: 'success', text: 'Notas guardadas correctamente' });
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving notas:', error);
      setMessage({ type: 'error', text: 'Error al guardar las notas' });
      setSaving(false);
    }
  };

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Registro de Calificaciones"
      headerSubtitle="Gestión de notas por trimestre — Escala 15+35+50"
    >
      <div className="space-y-6">
        
        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Materia y Curso</label>
            <select 
              value={materiaId} 
              onChange={(e) => setMateriaId(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 bg-white"
            >
              {materias.map(m => (
                <option key={m.id} value={m.id}>
                  {m.curso.nivel}ro {m.curso.paralelo} — {m.materia.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trimestre</label>
            <select 
              value={trimestre} 
              onChange={(e) => setTrimestre(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 bg-white"
            >
              <option value="1">1er Trimestre</option>
              <option value="2">2do Trimestre</option>
              <option value="3">3er Trimestre</option>
            </select>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#4a90e2] text-white text-[11px] font-bold px-6 py-2.5 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar todo'}
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-3 rounded-md flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
            'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : 
             message.type === 'error' ? <AlertCircle size={16} /> : 
             <Info size={16} />}
            {message.text}
          </div>
        )}

        {/* Grades Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Estudiante</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Ser (15)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Saber (35)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Hacer (50)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Total (100)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-[12px]">
                    Cargando estudiantes...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-[12px]">
                    No se encontraron estudiantes para este curso.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est, idx) => {
                  const estado = getEstado(est.total);
                  return (
                    <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[12px] font-medium text-slate-700">{est.nombre}</td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number" 
                          min="0" max="15"
                          value={est.ser}
                          onChange={(e) => handleNotaChange(idx, 'ser', e.target.value)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-center text-[12px] focus:ring-1 focus:ring-red-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number" 
                          min="0" max="35"
                          value={est.saber}
                          onChange={(e) => handleNotaChange(idx, 'saber', e.target.value)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-center text-[12px] focus:ring-1 focus:ring-red-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number" 
                          min="0" max="50"
                          value={est.hacer}
                          onChange={(e) => handleNotaChange(idx, 'hacer', e.target.value)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-center text-[12px] focus:ring-1 focus:ring-red-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[14px] font-bold ${est.total >= 51 ? 'text-green-600' : 'text-red-600'}`}>
                          {est.total}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${estado.class}`}>
                          {estado.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </SidebarLayout>
  );
};

export default RegistroNotas;
