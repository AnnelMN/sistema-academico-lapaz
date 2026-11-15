import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const roles = [
  { id: 'DIRECTOR', label: 'Director' },
  { id: 'PROFESOR', label: 'Docente' },
  { id: 'ADMINISTRATIVO', label: 'Administrativo' },
  { id: 'ESTUDIANTE', label: 'Estudiante' },
];

const dashboardRoutes = {
  DIRECTOR: '/director',
  PROFESOR: '/profesor',
  ADMINISTRATIVO: '/administrativo',
  ESTUDIANTE: '/estudiante',
};

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('DIRECTOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('login');
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [setupQr, setSetupQr] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [resetTempToken, setResetTempToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const { login, authenticate2FA, activate2FA, error, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && dashboardRoutes[user.rol]) navigate(dashboardRoutes[user.rol]);
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Ingrese sus credenciales institucionales');
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setRequiresSetup(false);
        setCode('');
        setStep(2);
        return;
      }
      if (data.requiresSetup2FA) {
        setTempToken(data.tempToken);
        setRequiresSetup(true);
        setSetupQr(data.qrDataUrl || '');
        setManualKey(data.manualKey || '');
        setCode('');
        setStep(2);
        return;
      }
      if (dashboardRoutes[data.user.rol]) navigate(dashboardRoutes[data.user.rol]);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!/^\d{6}$/.test(code)) {
      setLocalError('Ingrese el código de 6 dígitos de su app Authenticator');
      return;
    }

    try {
      setLoading(true);
      const data = requiresSetup
        ? await activate2FA(tempToken, code)
        : await authenticate2FA(tempToken, code);
      if (dashboardRoutes[data.user.rol]) navigate(dashboardRoutes[data.user.rol]);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e) => {
    e.preventDefault();
    setLocalError('');
    setFormMessage('');

    if (!email.trim()) {
      setLocalError('Ingrese su correo');
      return;
    }

    try {
      setLoading(true);
      const data = await authService.forgotPassword(email.trim());
      setResetTempToken(data.tempToken);
      setResetCode('');
      setFormMessage(data.message);
      setMode('forgot-reset');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'No se pudo iniciar la recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    setFormMessage('');

    if (!/^\d{6}$/.test(resetCode)) {
      setLocalError('Ingrese el código de 6 dígitos de su app Authenticator');
      return;
    }
    if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setLocalError('La contraseña debe tener al menos 10 caracteres, una letra y un número');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(resetTempToken, resetCode, newPassword);
      setMode('login');
      setStep(1);
      setPassword('');
      setFormMessage('Contraseña actualizada. Inicie sesión con su nueva contraseña.');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const resetForgot = () => {
    setMode('login');
    setStep(1);
    setResetTempToken('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setLocalError('');
    setFormMessage('');
  };

  const resetLogin = () => {
    setStep(1);
    setTempToken('');
    setCode('');
    setRequiresSetup(false);
    setSetupQr('');
    setManualKey('');
    setLocalError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 font-sans relative"
      style={{ backgroundColor: 'var(--ios-bg)' }}
    >
      <div className="absolute top-5 right-5">
        <ThemeToggle showLabel={true} />
      </div>

      <div
        className="w-full max-w-[860px] flex overflow-hidden"
        style={{
          backgroundColor: 'var(--ios-surface)',
          borderRadius: 'var(--ios-radius-lg)',
          boxShadow: 'var(--ios-shadow-md)',
          minHeight: '500px',
        }}
      >
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 8l10 5 10-5-10-5z" fill="white" opacity="0.9" />
                <path d="M2 16l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--ios-blue)' }}>
                U.E. La Paz &quot;A&quot;
              </div>
              <div className="text-[11px]" style={{ color: 'var(--ios-secondary)' }}>
                Sistema Académico 2026
              </div>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-[26px] font-bold mb-1" style={{ color: 'var(--ios-label)' }}>
              {mode === 'forgot-email'
                ? 'Recuperar contraseña'
                : mode === 'forgot-reset'
                  ? 'Verificar recuperación'
                  : step === 1 ? 'Iniciar sesión' : requiresSetup ? 'Configurar 2FA' : 'Verificación en dos pasos'}
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
              {mode === 'forgot-email'
                ? 'No se envía ningún correo; se usará el código de Authenticator.'
                : mode === 'forgot-reset'
                  ? 'Ingrese el código de 6 dígitos de su app y una nueva contraseña.'
                    : step === 1
                    ? 'Ingresa tus credenciales para acceder al sistema.'
                    : requiresSetup
                      ? 'Escanea el QR y confirma el código para activar 2FA.'
                      : 'Abre tu app Authenticator y escribe el código actual.'}
            </p>
          </div>

          {formMessage && (
            <div
              className="mb-5 text-[12px] font-medium px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--ios-green-light)', color: 'var(--ios-green)' }}
            >
              {formMessage}
            </div>
          )}

          {mode === 'forgot-email' ? (
            <form onSubmit={handleForgotEmail} className="space-y-5">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Email de la cuenta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@lapaz.edu.bo"
                  className="ios-input"
                  autoComplete="email"
                  autoFocus
                />
                <p className="text-[11px] mt-2" style={{ color: 'var(--ios-secondary)' }}>
                  Si la cuenta existe y tiene 2FA activo, se solicitará el código de Authenticator. No se envía ningún correo.
                </p>
              </div>

              {localError && (
                <div
                  className="text-[12px] font-medium px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
                >
                  {localError}
                </div>
              )}

              <div className="space-y-2">
                <button type="submit" disabled={loading} className="ios-btn-primary w-full">
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
                <button
                  type="button"
                  onClick={resetForgot}
                  className="w-full flex items-center justify-center gap-1 text-[12px] font-semibold py-2"
                  style={{ color: 'var(--ios-secondary)' }}
                >
                  <ArrowLeft size={14} />
                  Volver al inicio
                </button>
              </div>
            </form>
          ) : mode === 'forgot-reset' ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="ios-input text-center text-2xl tracking-[0.45em]"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 10 caracteres"
                    className="ios-input pr-12"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--ios-tertiary)' }}
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--ios-secondary)' }}>
                  Debe tener al menos 10 caracteres, una letra y un número.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Confirmar nueva contraseña
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="ios-input"
                  autoComplete="new-password"
                />
              </div>

              {localError && (
                <div
                  className="text-[12px] font-medium px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
                >
                  {localError}
                </div>
              )}

              <div className="space-y-2">
                <button type="submit" disabled={loading} className="ios-btn-primary w-full">
                  {loading ? 'Actualizando...' : 'Restablecer contraseña'}
                </button>
                <button
                  type="button"
                  onClick={resetForgot}
                  className="w-full flex items-center justify-center gap-1 text-[12px] font-semibold py-2"
                  style={{ color: 'var(--ios-secondary)' }}
                >
                  <ArrowLeft size={14} />
                  Cancelar
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              {requiresSetup && setupQr && (
                <div className="text-center">
                  <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--ios-label)' }}>
                    Escanea este QR con Authenticator
                  </p>
                  <img
                    src={setupQr}
                    alt="QR para activar 2FA"
                    className="w-48 h-48 mx-auto border rounded-2xl"
                    style={{ borderColor: 'var(--ios-separator-2)' }}
                  />
                  {manualKey && (
                    <code className="block text-[11px] font-mono break-all mt-3 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--ios-bg)', color: 'var(--ios-label)' }}>
                      {manualKey}
                    </code>
                  )}
                </div>
              )}
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  {requiresSetup ? 'Código de 6 dígitos de la app' : 'Código de 6 dígitos'}
                </label>
                <input
                  id="login-2fa"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="ios-input text-center text-2xl tracking-[0.45em]"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="text-[11px] mt-2" style={{ color: 'var(--ios-secondary)' }}>
                  {requiresSetup
                    ? 'Después de escanear, escribe el código actual de UE La Paz A para activarlo.'
                    : 'El código expira cada 30 segundos. Si falla, espera el siguiente intento.'}
                </p>
              </div>

              {(localError || error) && (
                <div
                  className="text-[12px] font-medium px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
                >
                  {localError || error}
                </div>
              )}

              <div className="pt-1 space-y-2">
                <button type="submit" disabled={loading || code.length !== 6} className="ios-btn-primary w-full">
                  {loading
                    ? requiresSetup ? 'Activando...' : 'Verificando...'
                    : requiresSetup ? 'Confirmar y activar 2FA' : 'Verificar y entrar'}
                </button>
                <button
                  type="button"
                  onClick={resetLogin}
                  className="w-full flex items-center justify-center gap-1 text-[12px] font-semibold py-2"
                  style={{ color: 'var(--ios-secondary)' }}
                >
                  <ArrowLeft size={14} />
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-[11px] font-semibold mb-2.5 uppercase tracking-wider"
                  style={{ color: 'var(--ios-secondary)' }}
                >
                  Tu rol
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const isActive = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                        style={isActive
                          ? { backgroundColor: 'var(--ios-blue)', color: '#fff', boxShadow: 'var(--ios-shadow-blue)' }
                          : { backgroundColor: 'var(--ios-bg)', color: 'var(--ios-secondary)' }}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Email institucional
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@lapaz.edu.bo"
                  className="ios-input"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--ios-secondary)' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="ios-input pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--ios-tertiary)' }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-email');
                    setLocalError('');
                    setFormMessage('');
                  }}
                  className="text-[12px] font-semibold"
                  style={{ color: 'var(--ios-blue)' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {(localError || error) && (
                <div
                  className="text-[12px] font-medium px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
                >
                  {localError || error}
                </div>
              )}

              <div className="pt-1">
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="ios-btn-primary w-full"
                >
                  {loading ? 'Validando...' : 'Ingresar al sistema'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          className="hidden md:flex w-[38%] flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, var(--ios-blue) 0%, var(--ios-blue-dark) 100%)' }}
        >
          <div
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          />

          <div className="relative z-10 text-center px-8">
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 8l10 5 10-5-10-5z" fill="white" opacity="0.95" />
                <path d="M2 16l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            <h2 className="text-white text-[18px] font-bold mb-2 leading-snug">
              Gestión Académica
            </h2>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Unidad Educativa<br />La Paz &quot;A&quot; · Bolivia
            </p>

            <div className="mt-8 space-y-2">
              {[
                'Registro de notas y asistencia',
                'Predicción con IA · Random Forest',
                'Acceso protegido con 2FA',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
