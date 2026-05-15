import React, { useState } from 'react';
import { Mail, Send, Bell, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TODO Sprint 9: reemplazar MOCK_DATA con llamadas a la API
// GET  /api/notificaciones
// POST /api/notificaciones/manual
// PUT  /api/notificaciones/config
// ─────────────────────────────────────────────────────────────
const MOCK_DATA = {
  kpis: {
    enviadasHoy: 3,
    esteMes: 47,
    padresRegistrados: 87,
  },
  historial: [
    { id: 1, estudiante: 'Juan Mamani',   tipo: 'RIESGO_ALTO',   estado: 'Enviado',   destinatario: 'tutor.mamani@gmail.com',  fecha: '2026-05-10 08:32' },
    { id: 2, estudiante: 'Luis Vargas',   tipo: 'RIESGO_ALTO',   estado: 'Enviado',   destinatario: 'tutor.vargas@gmail.com',  fecha: '2026-05-10 08:32' },
    { id: 3, estudiante: 'Carlos Flores', tipo: 'EXCESO_FALTAS', estado: 'Enviado',   destinatario: 'tutor.flores@gmail.com',  fecha: '2026-05-09 14:15' },
    { id: 4, estudiante: 'Diego Torrez',  tipo: 'RIESGO_ALTO',   estado: 'Pendiente', destinatario: 'tutor.torrez@gmail.com',  fecha: '2026-05-10 09:00' },
    { id: 5, estudiante: 'Rosa Choque',   tipo: 'EXCESO_FALTAS', estado: 'Pendiente', destinatario: 'tutor.choque@gmail.com',  fecha: '2026-05-10 09:00' },
  ],
  estudiantesOpciones: [
    { id: 'est-1', nombre: 'Juan Mamani',   emailTutor: 'tutor.mamani@gmail.com'  },
    { id: 'est-2', nombre: 'María Quispe',  emailTutor: 'tutor.quispe@gmail.com'  },
    { id: 'est-3', nombre: 'Carlos Flores', emailTutor: 'tutor.flores@gmail.com'  },
    { id: 'est-4', nombre: 'Ana Condori',   emailTutor: 'tutor.condori@gmail.com' },
    { id: 'est-5', nombre: 'Luis Vargas',   emailTutor: 'tutor.vargas@gmail.com'  },
  ],
};

const TIPO_CONFIG = {
  RIESGO_ALTO:   { label: 'Riesgo alto',   badge: 'bg-red-100 text-red-700'     },
  EXCESO_FALTAS: { label: 'Exceso faltas', badge: 'bg-amber-100 text-amber-700'  },
};

// ─── Sub-componentes ──────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-2">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${colorClass ?? 'text-slate-400'}`}>{label}</div>
        {Icon && <Icon size={15} className="text-slate-300" />}
      </div>
      <div className="text-[26px] font-bold text-[#1a1a2e] leading-none">{value}</div>
    </div>
  );
}

function ToggleSwitch({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-[12px] font-semibold text-slate-700">{label}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          enabled ? 'bg-[#4a90e2]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
// Este componente se monta como <Outlet /> dentro de DirectorLayout o AdminLayout.
// NO incluye SidebarLayout propio — el sidebar lo provee el layout padre.
export default function Notificaciones() {
  const [historial] = useState(MOCK_DATA.historial);

  const [alertas, setAlertas] = useState({
    riesgoAltoIA:        true,
    riesgoMedioIA:       true,
    excesoInasistencias: true,
    reporteTrimestral:   false,
  });

  const [form, setForm] = useState({
    estudianteId: MOCK_DATA.estudiantesOpciones[0].id,
    tipo: 'RIESGO_ALTO',
    mensaje: '',
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const estudianteSeleccionado = MOCK_DATA.estudiantesOpciones.find(e => e.id === form.estudianteId);
  const pendientes = historial.filter(h => h.estado === 'Pendiente').length;

  const handleToggle = (key) => {
    setAlertas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnviar = async () => {
    if (!form.mensaje.trim()) {
      setMessage({ type: 'error', text: 'El mensaje no puede estar vacío.' });
      return;
    }
    // TODO Sprint 9: POST /api/notificaciones/manual
    setSending(true);
    setMessage({ type: 'info', text: 'Enviando notificación...' });
    setTimeout(() => {
      setSending(false);
      setMessage({ type: 'success', text: `Notificación enviada a ${estudianteSeleccionado?.emailTutor}` });
      setForm(f => ({ ...f, mensaje: '' }));
      setTimeout(() => setMessage(null), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Enviadas hoy"       value={MOCK_DATA.kpis.enviadasHoy}       icon={Send}  colorClass="text-[#4a90e2]" />
        <KpiCard label="Este mes"           value={MOCK_DATA.kpis.esteMes}           icon={Mail}  colorClass="text-[#16a34a]" />
        <KpiCard label="Pendientes"         value={pendientes}                       icon={Clock} colorClass="text-[#f59e0b]" />
        <KpiCard label="Padres registrados" value={MOCK_DATA.kpis.padresRegistrados} icon={Bell}  colorClass="text-[#a78bfa]" />
      </div>

      {/* Historial + Panel derecho */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Historial (col-span 3) */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight">
              Historial de notificaciones
            </div>
            <span className="text-[10px] text-slate-400">{historial.length} registros</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Destinatario</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historial.map(n => {
                const tipoCfg = TIPO_CONFIG[n.tipo];
                return (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{n.estudiante}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${tipoCfg.badge}`}>
                        {tipoCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {n.estado === 'Enviado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Clock size={10} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 hidden md:table-cell">{n.destinatario}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 hidden lg:table-cell">{n.fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panel derecho: Config + Formulario (col-span 2) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Alertas automáticas */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight mb-1">Alertas automáticas</div>
            <div className="text-[10px] text-slate-400 mb-4">Configuración de envíos automáticos a padres</div>
            <div className="divide-y divide-slate-50">
              <ToggleSwitch label="Riesgo alto IA"          description="Cuando el modelo detecta riesgo alto"             enabled={alertas.riesgoAltoIA}        onChange={() => handleToggle('riesgoAltoIA')} />
              <ToggleSwitch label="Riesgo medio IA"         description="Cuando el modelo detecta riesgo medio"            enabled={alertas.riesgoMedioIA}       onChange={() => handleToggle('riesgoMedioIA')} />
              <ToggleSwitch label="Exceso de inasistencias" description="Cuando el estudiante supera el límite de faltas"  enabled={alertas.excesoInasistencias} onChange={() => handleToggle('excesoInasistencias')} />
              <ToggleSwitch label="Reporte trimestral"      description="Resumen de rendimiento al finalizar trimestre"    enabled={alertas.reporteTrimestral}   onChange={() => handleToggle('reporteTrimestral')} />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
              {/* TODO Sprint 9: guardar configuración en backend */}
              Los cambios se guardarán automáticamente.
            </div>
          </div>

          {/* Formulario manual */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight mb-1">Notificación manual</div>
            <div className="text-[10px] text-slate-400 mb-4">Enviar mensaje personalizado al tutor del estudiante</div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estudiante</label>
                <select
                  value={form.estudianteId}
                  onChange={e => setForm(f => ({ ...f, estudianteId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {MOCK_DATA.estudiantesOpciones.map(est => (
                    <option key={est.id} value={est.id}>{est.nombre}</option>
                  ))}
                </select>
              </div>

              {estudianteSeleccionado && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Mail size={11} />
                  Destinatario: <span className="font-semibold text-slate-500">{estudianteSeleccionado.emailTutor}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="RIESGO_ALTO">Riesgo alto IA</option>
                  <option value="EXCESO_FALTAS">Exceso de faltas</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mensaje personalizado</label>
                <textarea
                  rows={4}
                  value={form.mensaje}
                  onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                  placeholder="Estimado padre/tutor, le informamos que..."
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {message && (
                <div className={`p-2.5 rounded-md flex items-center gap-2 text-[11px] font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                  message.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-100'       :
                                               'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={13} /> :
                   message.type === 'error'   ? <AlertCircle size={13} /> :
                                                <Info size={13} />}
                  {message.text}
                </div>
              )}

              <button
                onClick={handleEnviar}
                disabled={sending}
                className="w-full bg-[#4a90e2] hover:bg-blue-600 text-white text-[11px] font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={13} />
                {sending ? 'Enviando...' : 'Enviar notificación'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
