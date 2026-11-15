import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Copy, Check, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

const formatSecret = (secret = '') => secret.replace(/(.{4})/g, '$1 ').trim();

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [qr, setQr] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const generate = async () => {
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const data = await authService.setup2FA();
      setQr(data.qrDataUrl);
      setManualKey(data.manualKey);
      setCode('');
    } catch (e) {
      setErr(e.response?.data?.error || 'No se pudo generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const activate = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!/^\d{6}$/.test(code)) {
      setErr('Ingrese el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await authService.verify2FASetup(code);
      await refreshUser();
      setMsg('2FA activado. La próxima vez que inicies sesión deberás ingresar el código de tu app.');
      setQr('');
      setManualKey('');
      setCode('');
    } catch (e) {
      setErr(e.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const disable = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!password) {
      setErr('Ingrese su contraseña para desactivar 2FA');
      return;
    }

    setDisabling(true);
    try {
      await authService.disable2FA(password);
      await refreshUser();
      setMsg('2FA desactivado correctamente');
      setPassword('');
    } catch (e) {
      setErr(e.response?.data?.error || 'No se pudo desactivar 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(manualKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErr('No se pudo copiar la clave');
    }
  };

  return (
    <div className="min-h-screen p-5 flex items-center justify-center" style={{ backgroundColor: 'var(--ios-bg)' }}>
      <div className="w-full max-w-lg">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] font-semibold mb-4"
          style={{ color: 'var(--ios-secondary)' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        <div
          className="rounded-3xl p-6 sm:p-7"
          style={{ backgroundColor: 'var(--ios-surface)', boxShadow: 'var(--ios-shadow-md)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold leading-tight" style={{ color: 'var(--ios-label)' }}>
                Verificación en dos pasos
              </h1>
              <p className="text-[11px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
                Google Authenticator · Microsoft Authenticator
              </p>
            </div>
          </div>

          {user?.twoFactorEnabled ? (
            <div className="space-y-5">
              <div
                className="rounded-2xl px-4 py-3 text-[12px] font-semibold"
                style={{ backgroundColor: 'var(--ios-green-light)', color: 'var(--ios-green)' }}
              >
                2FA está activado para tu cuenta. Cada inicio de sesión solicitará el código de la app.
              </div>

              <form onSubmit={disable} className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--ios-separator-2)' }}>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                  Desactivar 2FA
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    className="ios-input pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--ios-tertiary)' }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={disabling} className="ios-btn-primary w-full" style={{ backgroundColor: 'var(--ios-red)' }}>
                  {disabling ? 'Desactivando...' : 'Desactivar 2FA'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ios-secondary)' }}>
                Genera un código QR, escanéalo con tu app autenticadora y confirma el código de 6 dígitos.
              </p>

              {!qr && (
                <button onClick={generate} disabled={loading} className="ios-btn-primary w-full">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Generando...
                    </span>
                  ) : (
                    'Generar código QR'
                  )}
                </button>
              )}

              {qr && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={qr}
                      alt="Código QR para configurar 2FA"
                      className="w-52 h-52 border rounded-2xl"
                      style={{ borderColor: 'var(--ios-separator-2)' }}
                    />
                  </div>

                  {manualKey && (
                    <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--ios-bg)' }}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-tertiary)' }}>
                          Clave manual
                        </span>
                        <button
                          type="button"
                          onClick={copyKey}
                          className="inline-flex items-center gap-1 text-[10px] font-bold"
                          style={{ color: 'var(--ios-blue)' }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copiada' : 'Copiar'}
                        </button>
                      </div>
                      <code className="block text-[13px] font-mono break-all leading-6" style={{ color: 'var(--ios-label)' }}>
                        {formatSecret(manualKey)}
                      </code>
                    </div>
                  )}

                  <form onSubmit={activate} className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--ios-separator-2)' }}>
                    <label className="block text-[11px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
                      Código generado por la app
                    </label>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      inputMode="numeric"
                      maxLength={6}
                      className="ios-input text-center text-xl tracking-[0.4em]"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                    <button type="submit" disabled={loading || code.length !== 6} className="ios-btn-primary w-full">
                      {loading ? 'Verificando...' : 'Confirmar y activar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {msg && (
            <div
              className="mt-4 text-[12px] font-medium px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--ios-green-light)', color: 'var(--ios-green)' }}
            >
              {msg}
            </div>
          )}
          {err && (
            <div
              className="mt-4 text-[12px] font-medium px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
            >
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
