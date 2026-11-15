import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getMaterias, createMateria } from '../../services/academico.service';

const Materias = () => {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nombre: '', cargaHoraria: '', nivel: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadMaterias = async () => {
    try {
      setLoading(true);
      const data = await getMaterias();
      setMaterias(data || []);
    } catch (err) {
      console.error('Error cargando materias:', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar las materias' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterias();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.cargaHoraria || !formData.nivel) {
      setMessage({ type: 'error', text: 'Todos los campos son requeridos' });
      return;
    }

    try {
      setSaving(true);
      await createMateria({
        nombre: formData.nombre,
        cargaHoraria: parseInt(formData.cargaHoraria),
        nivel: parseInt(formData.nivel)
      });
      setMessage({ type: 'success', text: 'Materia creada correctamente' });
      setFormData({ nombre: '', cargaHoraria: '', nivel: '' });
      await loadMaterias();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'No se pudo crear la materia' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando materias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Gestión de Materias
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Registra las materias de la institución con su carga horaria y nivel.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nombre
            </label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej. Matemáticas"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Carga horaria
            </label>
            <input
              name="cargaHoraria"
              type="number"
              value={formData.cargaHoraria}
              onChange={handleInputChange}
              placeholder="4"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nivel
            </label>
            <select
              name="nivel"
              value={formData.nivel}
              onChange={handleInputChange}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}ro</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !formData.nombre || !formData.cargaHoraria || !formData.nivel}
            className="ios-btn-primary w-full text-[12px]"
          >
            {saving ? 'Guardando...' : 'Guardar materia'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg flex items-center gap-2 text-[12px] font-medium"
          style={{
            backgroundColor: message.type === 'success' ? 'var(--ios-green-light)' : 'var(--ios-red-light)',
            color: message.type === 'success' ? 'var(--ios-green)' : 'var(--ios-red)'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Nivel
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Carga horaria
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {materias.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                  No hay materias registradas.
                </td>
              </tr>
            ) : (
              materias.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-medium text-slate-700">
                    {m.nombre}
                  </td>
                  <td className="px-4 py-3 text-center text-[12px]">
                    {m.nivel}ro
                  </td>
                  <td className="px-4 py-3 text-center text-[12px]">
                    {m.cargaHoraria} hrs
                  </td>
                  <td className="px-4 py-3 text-center text-[10px] text-right">
                    <button className="text-blue-500 hover:underline text-[11px] font-bold">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Materias;