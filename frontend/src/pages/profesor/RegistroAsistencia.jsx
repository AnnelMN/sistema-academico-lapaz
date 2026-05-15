import React, { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { getMisMaterias } from '../../services/notas.service';
import { getEstudiantesConAsistencia, registrarAsistencia } from '../../services/asistencia.service';
import { Save, CheckCircle, AlertCircle, Info, Users } from 'lucide-react';

// ─── Helpers ─────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const LIMITE_FALTAS = 5;

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',           dotColor: 'bg-[#60a5fa]', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',     dotColor: 'bg-[#fb923c]' },
      { label: 'Asistencia',      path: '/profesor/asistencia',dotColor: 'bg-[#34d399]' },
    ]
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
      { label: 'Mi horario',    path: '/profesor/horario',       dotColor: 'bg-[#fbbf24]' },
      { label: 'Reportes',      path: '/profesor/reportes',      dotColor: 'bg-[#9ca3af]' },
    ]
  }
];

// ─── Status helpers ───────────────────────────
const ESTADO_CONFIG = {
  PRESENTE:    { label: 'P', activeClass: 'bg-[#d1fae5] text-[#065f46] border-[#34d399]' },
  AUSENTE:     { label: 'A', activeClass: 'bg-[#fee2e2] text-[#b91c1c] border-[#f87171]' },
  JUSTIFICADO: { label: 'J', activeClass: 'bg-[#fef3c7] text-[#92400e] border-[#fbbf24]' },
};

function AsistenciaToggle({ estado, onChange }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-slate-200">
      {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`w-8 h-8 flex items-center justify-center text-[11px] font-bold border-r last:border-r-0 border-slate-200 transition-colors ${
            estado === key ? cfg.activeClass : 'bg-white text-slate-400 hover:bg-slate-50'
          }`}
        >
          {cfg.label}
        </button>
      ))}
    </div>
  );
}

function BarraAsistencia({ porcentaje }) {
  if (porcentaje === null) {
    return <span className="text-[10px] text-slate-300 italic">Sin registros</span>;
  }
  const color = porcentaje >= 80 ? 'bg-green-500' : porcentaje >= 60 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{porcentaje}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────
export default function RegistroAsistencia() {
  const [materias, setMaterias]       = useState([]);
  const [materiaId, setMateriaId]     = useState('');
  const [fecha, setFecha]             = useState(today());
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [message, setMessage]         = useState(null);

  // Cargar materias del docente
  useEffect(() => {
    getMisMaterias()
      .then(data => {
        setMaterias(data);
        if (data.length > 0) setMateriaId(data[0].id);
      })
      .catch(err => console.error('Error cargando materias:', err));
  }, []);

  // Cargar estudiantes y asistencia del día
  const cargarEstudiantes = useCallback(async () => {
    if (!materiaId || !fecha) return;
    try {
      setLoading(true);
      const data = await getEstudiantesConAsistencia(materiaId, fecha);
      // Si el estudiante no tiene asistencia hoy, inicializar como null (Sin marcar)
      setEstudiantes(data.map(est => ({ ...est })));
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
    } finally {
      setLoading(false);
    }
  }, [materiaId, fecha]);

  useEffect(() => {
    cargarEstudiantes();
  }, [cargarEstudiantes]);

  // KPIs en tiempo real
  const kpis = {
    presentes:    estudiantes.filter(e => e.estadoHoy === 'PRESENTE').length,
    ausentes:     estudiantes.filter(e => e.estadoHoy === 'AUSENTE').length,
    justificados: estudiantes.filter(e => e.estadoHoy === 'JUSTIFICADO').length,
    sinMarcar:    estudiantes.filter(e => e.estadoHoy === null).length,
  };

  const handleEstadoChange = (idx, nuevoEstado) => {
    setEstudiantes(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], estadoHoy: nuevoEstado };
      return updated;
    });
  };

  const marcarTodosPresente = () => {
    setEstudiantes(prev => prev.map(est => ({ ...est, estadoHoy: 'PRESENTE' })));
  };

  const handleGuardar = async () => {
    const sinMarcar = estudiantes.filter(e => e.estadoHoy === null);
    if (sinMarcar.length > 0) {
      setMessage({ type: 'error', text: `Faltan marcar ${sinMarcar.length} estudiante(s) antes de guardar.` });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: 'info', text: 'Guardando asistencia...' });

      await registrarAsistencia({
        materiaProgramadaId: materiaId,
        fecha,
        registros: estudiantes.map(est => ({
          estudianteId: est.id,
          estado: est.estadoHoy
        }))
      });

      setMessage({ type: 'success', text: `Asistencia del ${fecha} guardada correctamente` });
      // Recargar para actualizar porcentajes y faltas acumuladas
      await cargarEstudiantes();
    } catch (err) {
      console.error('Error guardando asistencia:', err);
      setMessage({ type: 'error', text: 'Error al guardar la asistencia' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // ─── Render ─────────────────────────────────
  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Registro de Asistencia"
      headerSubtitle="Control diario por materia y curso"
    >
      <div className="space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Presentes',    value: kpis.presentes,    color: 'text-[#16a34a]' },
            { label: 'Ausentes',     value: kpis.ausentes,     color: 'text-[#ef4444]' },
            { label: 'Justificados', value: kpis.justificados, color: 'text-[#f59e0b]' },
            { label: 'Sin marcar',   value: kpis.sinMarcar,    color: 'text-[#9ca3af]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
              <div className={`text-[22px] font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Materia y Curso</label>
            <select
              value={materiaId}
              onChange={e => setMateriaId(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 bg-white"
            >
              {materias.map(m => (
                <option key={m.id} value={m.id}>
                  {m.curso.nivel}ro {m.curso.paralelo} — {m.materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 bg-white"
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={saving || loading}
            className="bg-[#4a90e2] text-white text-[11px] font-bold px-5 py-2.5 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar asistencia'}
          </button>

          <button
            onClick={marcarTodosPresente}
            disabled={loading}
            className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-5 py-2.5 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Users size={14} /> Marcar todos presente
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-md flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
            message.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-100' :
                                         'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            {message.type === 'success' ? <CheckCircle size={15} /> :
             message.type === 'error'   ? <AlertCircle size={15} /> :
                                          <Info size={15} />}
            {message.text}
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-2/5">Estudiante</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado hoy</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia acum.</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Faltas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center text-slate-400 text-[12px]">
                    Cargando estudiantes...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center text-slate-400 text-[12px]">
                    No hay estudiantes registrados en este curso.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est, idx) => {
                  const enRiesgo = est.faltas > LIMITE_FALTAS;
                  return (
                    <tr
                      key={est.id}
                      className={`transition-colors ${enRiesgo ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-slate-50/50'}`}
                    >
                      {/* Nombre */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-700">{est.nombre}</span>
                          {enRiesgo && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Límite
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Toggle P/A/J */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <AsistenciaToggle
                            estado={est.estadoHoy}
                            onChange={nuevoEstado => handleEstadoChange(idx, nuevoEstado)}
                          />
                        </div>
                      </td>

                      {/* Barra de asistencia */}
                      <td className="px-4 py-3">
                        <BarraAsistencia porcentaje={est.porcentajeAsistencia} />
                      </td>

                      {/* Faltas */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[13px] font-bold ${enRiesgo ? 'text-red-600' : 'text-slate-600'}`}>
                          {est.faltas}
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
}
