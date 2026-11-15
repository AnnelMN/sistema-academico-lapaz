import { useEffect, useState, useCallback } from 'react';
import { Users, Clock, Loader2, AlertCircle, Info, FileText } from 'lucide-react';
import { getMisMaterias } from '../../services/notas.service';
import { getEstudiantesConAsistencia, getHistorialAsistencia } from '../../services/asistencia.service';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short' }).format(date);
};
const ESTADO_CONFIG = {
  PRESENTE: { label: 'Presente', class: 'bg-green-100 text-green-700' },
  AUSENTE:  { label: 'Ausente',  class: 'bg-red-100 text-red-700' },
  JUSTIFICADO: { label: 'Justificado', class: 'bg-amber-100 text-amber-700' },
  null: { label: 'Sin marcar', class: 'bg-slate-100 text-slate-600' },
};

export default function DirectorAsistencia() {
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialEstudiante, setHistorialEstudiante] = useState(null);
  const [historialData, setHistorialData] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        const data = await getMisMaterias();
        setMaterias(data || []);
        if (data.length > 0) setMateriaId(data[0].id);
      } catch (err) {
        console.error('Error cargando materias:', err);
        setError('No se pudieron cargar las materias');
      }
    };
    cargarMaterias();
  }, []);

  const cargarAsistencia = useCallback(async () => {
    if (!materiaId || !fecha) return;
    try {
      setLoading(true);
      setError('');
      const data = await getEstudiantesConAsistencia(materiaId, fecha);
      setEstudiantes(data || []);
    } catch (err) {
      console.error('Error cargando asistencia:', err);
      setError(err.response?.data?.error || 'No se pudo cargar la asistencia');
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  }, [materiaId, fecha]);

  useEffect(() => {
    cargarAsistencia();
  }, [cargarAsistencia]);

  const kpis = {
    presentes: estudiantes.filter((e) => e.estadoHoy === 'PRESENTE').length,
    ausentes: estudiantes.filter((e) => e.estadoHoy === 'AUSENTE').length,
    justificados: estudiantes.filter((e) => e.estadoHoy === 'JUSTIFICADO').length,
    sinMarcar: estudiantes.filter((e) => e.estadoHoy === null).length,
  };

  const abrirHistorial = async (estudiante) => {
    setHistorialEstudiante(estudiante);
    setHistorialLoading(true);
    try {
      const data = await getHistorialAsistencia(estudiante.id, materiaId);
      setHistorialData(data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setHistorialData([]);
      setError(err.response?.data?.error || 'No se pudo cargar el historial');
    } finally {
      setHistorialLoading(false);
      setHistorialOpen(true);
    }
  };

  const cerrarHistorial = () => {
    setHistorialOpen(false);
    setHistorialEstudiante(null);
    setHistorialData([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando asistencia...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="ios-card p-5 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
      >
        {error}
      </div>
    );
  }

    return (<>
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Asistencia del Director
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Consulta de asistencia por materia, curso y fecha
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Materia y curso
          </label>
          <select
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.curso?.nivel}° {m.curso?.paralelo} — {m.materia?.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="text-[12px] font-semibold" style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)', padding: '10px', borderRadius: 'var(--ios-radius-lg)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Presentes', value: kpis.presentes, color: 'text-[#16a34a]' },
          { label: 'Ausentes', value: kpis.ausentes, color: 'text-[#ef4444]' },
          { label: 'Justificados', value: kpis.justificados, color: 'text-[#f59e0b]' },
          { label: 'Sin marcar', value: kpis.sinMarcar, color: 'text-[#9ca3af]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="ios-card p-4 text-center">
            <div className={`text-[22px] font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Estudiante</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia acum.</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Faltas</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Historial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {estudiantes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-slate-400 text-[12px]">
                  No hay estudiantes registrados en este curso y fecha.
                </td>
              </tr>
            ) : (
              estudiantes.map((est) => {
                const cfg = ESTADO_CONFIG[est.estadoHoy] || ESTADO_CONFIG[null];
                return (
                  <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-[12px] font-medium text-slate-700">{est.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cfg.class}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              est.porcentajeAsistencia >= 80
                                ? 'bg-green-500'
                                : est.porcentajeAsistencia >= 60
                                  ? 'bg-amber-400'
                                  : 'bg-red-500'
                            } rounded-full`}
                            style={{ width: `${est.porcentajeAsistencia ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                          {est.porcentajeAsistencia ?? '-'}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[13px] font-bold ${
                        est.faltas > 0 ? 'text-red-600' : 'text-slate-600'
                      }`}>{est.faltas}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => abrirHistorial(est)}
                        className="text-[11px] font-bold text-blue-500 hover:underline px-2 py-1 rounded-md hover:bg-blue-50"
                      >
                        Ver historial
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${historialOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={cerrarHistorial}
      />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: 'var(--ios-label)' }}>
              Historial — {historialEstudiante?.nombre}
            </h3>
            <p className="text-[11px] text-slate-500">{historialEstudiante?.materia?.nombre}</p>
          </div>
          <button
            onClick={cerrarHistorial}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
          >
            Cerrar
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {historialLoading ? (
            <div className="p-4 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-[12px]">Cargando historial...</span>
            </div>
          ) : historialData.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-slate-500">
              Sin registros de asistencia en esta materia.
            </div>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialData.map((h) => {
                  const cfg = ESTADO_CONFIG[h.estado] || ESTADO_CONFIG[null];
                  return (
                    <tr key={h.id}>
                      <td className="px-3 py-2 text-slate-600">{formatDate(h.fecha)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.class}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </>
  );
}