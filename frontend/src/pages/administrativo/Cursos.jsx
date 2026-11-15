import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getCursos, createCurso } from '../../services/academico.service';

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nivel: '', paralelo: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadCursos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCursos();
      setCursos(data || []);
    } catch (err) {
      console.error('Error cargando cursos:', err);
      setError(err.response?.data?.error || 'No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCursos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nivel || !formData.paralelo) {
      setMessage({ type: 'error', text: 'Nivel y paralelo son requeridos' });
      return;
    }

    try {
      setSaving(true);
      await createCurso({ nivel: parseInt(formData.nivel), paralelo: formData.paralelo });
      setMessage({ type: 'success', text: 'Curso creado correctamente' });
      setFormData({ nivel: '', paralelo: '' });
      await loadCursos();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'No se pudo crear el curso' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando cursos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg text-[12px] font-medium flex items-center gap-2"
        style={{
          backgroundColor: 'var(--ios-red-light)',
          color: 'var(--ios-red)'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Gestión de Cursos
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Registra los cursos de la institución (ej. 1ro A, 3ro B).
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
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
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paralelo
            </label>
            <select
              name="paralelo"
              value={formData.paralelo}
              onChange={handleInputChange}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {['A', 'B', 'C', 'D', 'E'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !formData.nivel || !formData.paralelo}
            className="ios-btn-primary w-full text-[12px]"
          >
            {saving ? 'Guardando...' : 'Guardar curso'}
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
                Curso
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Estudiantes
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cursos.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                  No hay cursos registrados.
                </td>
              </tr>
            ) : (
              cursos.map(curso => (
                <tr key={curso.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-medium text-slate-700">
                    {curso.nivel}° {curso.paralelo}
                  </td>
                  <td className="px-4 py-3 text-center text-[12px] text-slate-600">
                    —
                  </td>
                  <td className="px-4 py-3 text-center text-[10px] text-right">
                    <button
                      className="text-blue-500 hover:underline text-[11px] font-bold"
                    >
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

export default Cursos;