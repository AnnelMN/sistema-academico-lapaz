import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const TopbarLayout = ({ children, tabs }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'E';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[var(--ios-bg)] font-sans p-4">
      
      {/* Top Header Soft UI */}
      <header className="max-w-7xl mx-auto rounded-3xl mb-6 overflow-hidden transition-all" style={{ backgroundColor: 'var(--ios-surface)', boxShadow: 'var(--soft-shadow-flat)', border: '1px solid rgba(255, 255, 255, 0.7)' }}>
        <div className="px-8 py-5 flex justify-between items-center border-b" style={{ borderColor: 'var(--ios-separator-2)' }}>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--ios-label)' }}>
              Unidad Educativa La Paz "A" — Portal Estudiante
            </h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
              Gestión 2026 · 1er Trimestre
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <NavLink
              to="/2fa-setup"
              className="p-2 rounded-xl transition-all active:scale-95"
              style={{ color: 'var(--ios-blue)', backgroundColor: 'var(--ios-blue-light)' }}
              title="Seguridad 2FA"
              aria-label="Configurar 2FA"
            >
              <ShieldCheck size={18} />
            </NavLink>
            <ThemeToggle showLabel={true} />
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: 'var(--ios-label)' }}>{user?.nombre || 'Estudiante Demo'}</p>
              <p className="text-[10px] font-semibold" style={{ color: 'var(--ios-secondary)' }}>3ro B</p>
            </div>
            <div className="w-9 h-9 rounded-full font-extrabold text-xs text-white flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, var(--ios-blue), var(--ios-blue-dark))' }}>
              {getInitials(user?.nombre)}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              style={{ color: 'var(--ios-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--ios-red)'; e.currentTarget.style.backgroundColor = 'var(--ios-red-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ios-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Soft UI Pills */}
        <div className="px-8 py-3 bg-[var(--ios-bg)]">
          <nav className="flex space-x-3">
            {tabs.map((tab, idx) => (
              <NavLink
                key={idx}
                to={tab.path}
                end={tab.exact}
                className={({ isActive }) =>
                  `py-2 px-5 text-xs font-bold rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-white shadow-md text-blue-600 scale-[1.02]' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area Soft UI */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

    </div>
  );
};

export default TopbarLayout;
