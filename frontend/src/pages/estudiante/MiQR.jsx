import { useEffect, useState } from 'react';
import { QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

// Código QR dinámico de asistencia: el servidor lo genera y cambia cada 30 s.
// El estudiante lo muestra desde su celular y el docente lo escanea.
const MiQR = () => {
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [intento, setIntento] = useState(0); // "Reintentar" vuelve a empezar

  // Pide el código y vuelve a pedirlo justo cuando cambia
  useEffect(() => {
    let vigente = true;
    let temporizador;
    const pedir = () => {
      estudianteService.getMiQR()
        .then((datos) => {
          if (!vigente) return;
          setQr(datos);
          setSegundos(datos.segundosRestantes);
          setError('');
          temporizador = setTimeout(pedir, Math.max(datos.segundosRestantes, 1) * 1000 + 300);
        })
        .catch((err) => {
          if (!vigente) return;
          setQr(null);
          setError(err.response?.data?.error || 'No se pudo cargar tu código QR');
        });
    };
    pedir();
    return () => { vigente = false; clearTimeout(temporizador); };
  }, [intento]);

  // Cuenta regresiva visible
  useEffect(() => {
    if (!qr) return undefined;
    const intervalo = setInterval(() => setSegundos((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(intervalo);
  }, [qr]);

  return (
    <div className="space-y-5 max-w-md mx-auto">
      <div className="ios-card p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode size={18} style={{ color: 'var(--ios-blue)' }} />
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--ios-label)' }}>Mi código QR de asistencia</h2>
        </div>
        <p className="text-[12px] mb-5" style={{ color: 'var(--ios-secondary)' }}>
          Muéstraselo a tu docente al inicio de la clase para registrar tu asistencia.
        </p>

        {error ? (
          <div className="py-10 space-y-3">
            <div className="text-[13px]" style={{ color: 'var(--ios-red)' }}>{error}</div>
            <button type="button" onClick={() => { setError(''); setIntento((n) => n + 1); }} className="ios-btn-ghost text-[12px] mx-auto">
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        ) : !qr ? (
          <div className="py-16 text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Generando tu código…</div>
        ) : (
          <>
            {/* Fondo blanco siempre: el QR debe leerse también en modo oscuro */}
            <div className="inline-block rounded-2xl p-3" style={{ backgroundColor: '#ffffff' }}>
              <img src={qr.imagen} alt="Tu código QR de asistencia" width={260} height={260} className="block" />
            </div>
            <div className="mt-4 text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              Se renueva en <strong style={{ color: 'var(--ios-label)' }}>{segundos} s</strong>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-separator)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${(segundos / 30) * 100}%`, backgroundColor: 'var(--ios-blue)' }}
              />
            </div>
          </>
        )}
      </div>

      <div className="ios-card p-4 flex gap-3 items-start">
        <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ios-green)' }} />
        <div className="text-[12px] leading-relaxed" style={{ color: 'var(--ios-secondary)' }}>
          El código cambia cada 30 segundos y no contiene tus datos personales.
          Una foto o captura deja de servir en menos de un minuto, así que nadie puede marcar asistencia por ti.
          Si faltas o tienes justificativo, tu docente lo registra como siempre.
        </div>
      </div>
    </div>
  );
};

export default MiQR;
