import { useEffect, useState } from 'react';
import { Mail, Send, Bell, CheckCircle, Clock, AlertCircle, Info, Loader2 } from 'lucide-react';
import notificacionesService from '../../services/notificaciones.service';

const TIPO_CONFIG = {
  RIESGO_ALTO: { label: 'Riesgo alto', badgeClass: 'ios-badge ios-badge-danger' },
  EXCESO_FALTAS: { label: 'Exceso faltas', badgeClass: 'ios-badge ios-badge-warning' },
};

const ESTADO_CONFIG = {
  ENVIADO: { label: 'Enviado', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  FALLIDO: { label: 'Fallido', icon: AlertCircle, className: 'bg-red-100 text-red-700' },
  PENDIENTE: { label: 'Pendiente', icon: Clock, className: 'bg-amber-100 text-amber-700' },
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="ios-card p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>
          {label}
        </div>
        {Icon && <Icon size={16} style={{ color: 'var(--ios-tertiary)' }} />}
      </div>
      <div className="text-[26px] font-extrabold leading-none" style={{ color: 'var(--ios-label)' }}>
        {value}
      </div>
    </div>
  );
}

export default function Notificaciones() {
  const [data, setData] = useState({ kpis: null, historial: [], estudiantes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ estudianteId: '', tipo: 'RIESGO_ALTO', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await notificacionesService.getNotificaciones();
        setData(result);
        setForm((current) => ({
          ...current,
          estudianteId: current.estudianteId || result.estudiantes[0]?.id || '',
        }));
      } catch (err) {
        console.error('Error cargando notificaciones:', err);
        setError(err.response?.data?.error || 'No se pudieron cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const estudianteSeleccionado = data.estudiantes.find((est) => est.id === form.estudianteId);

  const refrescar = async () => {
    const result = await notificacionesService.getNotificaciones();
    setData(result);
    setForm((current) => ({
      ...current,
      estudianteId: result.estudiantes.some((est) => est.id === current.estudianteId)
        ? current.estudianteId
        : result.estudiantes[0]?.id || '',
    }));
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.estudianteId) {
      setMessage({ type: 'error', text: 'No hay estudiantes con correo de tutor registrado.' });
      return;
    }

    if (!form.mensaje.trim()) {
      setMessage({ type: 'error', text: 'El mensaje no puede estar vacío.' });
      return;
    }

    try {
      setSending(true);
      setMessage({ type: 'info', text: 'Enviando notificación...' });
      await notificacionesService.enviarNotificacionManual({
        estudianteId: form.estudianteId,
        tipo: form.tipo,
        mensaje: form.mensaje.trim(),
      });
      setMessage({ type: 'success', text: `Notificación enviada a ${estudianteSeleccionado?.emailTutor}` });
      setForm((current) => ({ ...current, mensaje: '' }));
      await refrescar();
    } catch (err) {
      console.error('Error enviando notificación:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'No se pudo enviar la notificación',
      });
      await refrescar().catch(() => {});
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando notificaciones reales...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ios-card p-5 text-[13px] font-semibold" style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}>
        {error}
      </div>
    );
  }

  const kpis = data.kpis || { enviadasHoy: 0, esteMes: 0, pendientes: 0, padresRegistrados: 0 };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Notificaciones a padres
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Historial real de correos enviados y avisos manuales al tutor.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Enviadas hoy" value={kpis.enviadasHoy} icon={Send} />
        <KpiCard label="Este mes" value={kpis.esteMes} icon={Mail} />
        <KpiCard label="Pendientes" value={kpis.pendientes} icon={Clock} />
        <KpiCard label="Padres registrados" value={kpis.padresRegistrados} icon={Bell} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 ios-card overflow-hidden">
          <div className="px-5 py-4 flex justify-between items-center border-b" style={{ borderColor: 'var(--ios-separator-2)' }}>
            <div className="text-[12px] font-bold uppercase tracking-tight" style={{ color: 'var(--ios-label)' }}>
              Historial de notificaciones
            </div>
            <span className="text-[10px]" style={{ color: 'var(--ios-secondary)' }}>
              {data.historial.length} registros
            </span>
          </div>

          {data.historial.length === 0 ? (
            <div className="p-6 text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              Aún no hay notificaciones registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: 'var(--ios-surface-2)' }}>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Estudiante</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Tipo</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--ios-secondary)' }}>Estado</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--ios-secondary)' }}>Destinatario</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--ios-secondary)' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historial.map((n) => {
                    const tipo = TIPO_CONFIG[n.tipo] || { label: n.tipo, badgeClass: 'ios-badge ios-badge-neutral' };
                    const estado = ESTADO_CONFIG[n.estado] || ESTADO_CONFIG.PENDIENTE;
                    const EstadoIcon = estado.icon;
                    return (
                      <tr key={n.id} className="border-t" style={{ borderColor: 'var(--ios-separator-2)' }}>
                        <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                          {n.estudiante}
                        </td>
                        <td className="px-4 py-3">
                          <span className={tipo.badgeClass}>{tipo.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${estado.className}`}>
                            <EstadoIcon size={10} />
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] hidden md:table-cell" style={{ color: 'var(--ios-secondary)' }}>
                          {n.destinatario}
                        </td>
                        <td className="px-4 py-3 text-[11px] hidden lg:table-cell" style={{ color: 'var(--ios-secondary)' }}>
                          {formatDate(n.fecha)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="ios-card p-5">
            <div className="text-[12px] font-bold uppercase tracking-tight mb-1" style={{ color: 'var(--ios-label)' }}>
              Alertas automáticas
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ios-secondary)' }}>
              El sistema envía alertas cuando el modelo de IA clasifica al estudiante en riesgo alto o cuando se supera el límite de faltas configurado.
            </p>
          </div>

          <form onSubmit={handleEnviar} className="ios-card p-5 space-y-3">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-tight" style={{ color: 'var(--ios-label)' }}>
                Notificación manual
              </div>
              <div className="text-[10px]" style={{ color: 'var(--ios-secondary)' }}>
                Envía un mensaje al tutor del estudiante.
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>
                Estudiante
              </label>
              <select
                value={form.estudianteId}
                onChange={(e) => setForm((current) => ({ ...current, estudianteId: e.target.value }))}
                className="ios-input"
                disabled={data.estudiantes.length === 0}
              >
                {data.estudiantes.length === 0 ? (
                  <option value="">Sin estudiantes con tutor</option>
                ) : (
                  data.estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>{est.nombre}</option>
                  ))
                )}
              </select>
            </div>

            {estudianteSeleccionado && (
              <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--ios-secondary)' }}>
                <Mail size={11} />
                <span>Destinatario: <strong>{estudianteSeleccionado.emailTutor}</strong></span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((current) => ({ ...current, tipo: e.target.value }))}
                className="ios-input"
              >
                <option value="RIESGO_ALTO">Riesgo alto IA</option>
                <option value="EXCESO_FALTAS">Exceso de faltas</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>
                Mensaje
              </label>
              <textarea
                rows={4}
                value={form.mensaje}
                onChange={(e) => setForm((current) => ({ ...current, mensaje: e.target.value }))}
                placeholder="Estimado padre/tutor, le informamos que..."
                className="ios-input resize-none"
              />
            </div>

            {message && (
              <div
                className="p-2.5 rounded-xl flex items-center gap-2 text-[11px] font-medium"
                style={{
                  backgroundColor: message.type === 'success' ? 'var(--ios-green-light)' : message.type === 'error' ? 'var(--ios-red-light)' : 'var(--ios-blue-light)',
                  color: message.type === 'success' ? 'var(--ios-green)' : message.type === 'error' ? 'var(--ios-red)' : 'var(--ios-blue)',
                }}
              >
                {message.type === 'success' ? <CheckCircle size={13} /> : message.type === 'error' ? <AlertCircle size={13} /> : <Info size={13} />}
                {message.text}
              </div>
            )}

            <button type="submit" disabled={sending || data.estudiantes.length === 0} className="ios-btn-primary w-full">
              {sending ? 'Enviando...' : 'Enviar notificación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
