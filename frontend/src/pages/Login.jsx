import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, BookOpen, Briefcase, GraduationCap, Eye, EyeOff } from 'lucide-react';

const roles = [
  { id: 'DIRECTOR', label: 'Director', icon: User },
  { id: 'PROFESOR', label: 'Docente', icon: BookOpen },
  { id: 'ADMINISTRATIVO', label: 'Admin', icon: Briefcase },
  { id: 'ESTUDIANTE', label: 'Estudiante', icon: GraduationCap },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('ADMINISTRATIVO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const { login, error, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectByRole(user.rol);
    }
  }, [user, navigate]);

  const redirectByRole = (rol) => {
    switch (rol) {
      case 'DIRECTOR':
        navigate('/director');
        break;
      case 'PROFESOR':
        navigate('/profesor');
        break;
      case 'ADMINISTRATIVO':
        navigate('/administrativo');
        break;
      case 'ESTUDIANTE':
        navigate('/estudiante');
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Por favor ingrese usuario y contraseña');
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);
      redirectByRole(data.user.rol);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-sans">
      
      {/* Main Card */}
      <div className="w-full max-w-[900px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex overflow-hidden min-h-[480px]">
        
        {/* Left Column: Form */}
        <div className="w-full md:w-[60%] p-10 md:p-12 flex flex-col justify-center">
          
          <div className="text-[11px] font-bold text-[#4a90e2] tracking-[2px] mb-5 uppercase">
            U.E. LA PAZ "A"
          </div>

          <div className="mb-6">
            <h1 className="text-[26px] font-bold text-[#1a1a2e] mb-1">Login</h1>
            <p className="text-[12px] text-slate-400">
              Bienvenido al sistema de gestión académica integral.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Role Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[1.5px]">Selecciona tu rol</label>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => {
                  const isActive = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all border-[1.5px] ${
                        isActive 
                          ? 'bg-[#4a90e2] text-white border-[#4a90e2]' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@lapaz.edu.bo"
                className="w-full bg-transparent border-b-[1.5px] border-slate-200 py-2 text-[13px] text-slate-700 outline-none focus:border-[#4a90e2] transition-colors placeholder:text-slate-300"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full bg-transparent border-b-[1.5px] border-slate-200 py-2 text-[13px] text-slate-700 outline-none focus:border-[#4a90e2] transition-colors placeholder:text-slate-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4a90e2] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(localError || error) && (
              <div className="text-[11px] text-red-500 font-medium">
                {localError || error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4a90e2] hover:bg-[#357abd] text-white text-[13px] font-bold tracking-[1px] px-10 py-3 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center min-w-[140px]"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'LOGIN'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Illustration */}
        <div className="hidden md:flex w-[40%] bg-gradient-to-br from-[#4a90e2] to-[#1e3a8a] relative items-center justify-center">
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" className="opacity-90">
            <rect x="30" y="30" width="120" height="90" rx="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <circle cx="52" cy="52" r="10" fill="rgba(255,255,255,0.4)"/>
            <circle cx="52" cy="78" r="10" fill="rgba(255,255,255,0.3)"/>
            <circle cx="52" cy="104" r="10" fill="rgba(255,255,255,0.2)"/>
            <rect x="70" y="47" width="60" height="8" rx="4" fill="rgba(255,255,255,0.4)"/>
            <rect x="70" y="73" width="45" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>
            <rect x="70" y="99" width="52" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
            <circle cx="130" cy="40" r="20" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            <circle cx="130" cy="40" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="6 4"/>
            <rect x="20" y="135" width="140" height="18" rx="9" fill="rgba(255,255,255,0.15)"/>
            <rect x="20" y="158" width="90" height="12" rx="6" fill="rgba(255,255,255,0.1)"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Login;

