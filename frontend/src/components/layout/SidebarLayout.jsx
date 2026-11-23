import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Search, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const SidebarLayout = ({ 
  children, 
  menuGroups, 
  headerTitle,
  headerSubtitle,
  headerRightContent 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="flex h-screen overflow-hidden font-sans p-3 sm:p-4 gap-4 print:block print:h-auto print:overflow-visible print:p-0" style={{ backgroundColor: 'var(--ios-bg)' }}>
      
      {/* ── Sidebar Soft UI Elevado ─────────────────────────── */}
      <aside
        className="w-[230px] flex flex-col flex-shrink-0 rounded-3xl transition-all print:hidden"
        style={{
          backgroundColor: 'var(--ios-surface)',
          boxShadow: 'var(--soft-shadow-flat)',
          border: '1px solid rgba(255, 255, 255, 0.7)'
        }}
      >
        {/* Logo / Institución */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--ios-separator-2)' }}>
          <div className="flex items-center gap-3">
            {/* Ícono institucional Soft UI */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--ios-blue), var(--ios-blue-dark))' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 8l10 5 10-5-10-5z" fill="white" opacity="0.95"/>
                <path d="M2 16l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--ios-label)' }}>
                U.E. La Paz &quot;A&quot;
              </div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
                Gestión Académica
              </div>
            </div>
          </div>
        </div>

        {/* Navegación Soft UI */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-5">
              <h3
                className="px-3 text-[10px] font-bold uppercase tracking-[1.3px] mb-2"
                style={{ color: 'var(--ios-tertiary)' }}
              >
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-200 ${
                          isActive ? 'shadow-md scale-[1.02]' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                        }`
                      }
                      style={({ isActive }) => isActive
                        ? { 
                            backgroundColor: 'var(--ios-active-bg)', 
                            color: 'var(--ios-active-text)',
                            boxShadow: 'var(--ios-active-shadow)'
                          }
                        : { color: 'var(--ios-secondary)' }
                      }
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.dotHex || item.dotColor?.replace('bg-[', '').replace(']', '') || 'var(--ios-blue)' }}
                      />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Info Usuario + Logout Soft UI */}
        <div className="px-4 pb-4 pt-3 border-t" style={{ borderColor: 'var(--ios-separator-2)' }}>
          <div className="flex items-center gap-2.5 p-2 rounded-2xl mb-2" style={{ backgroundColor: 'var(--ios-surface-2)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--ios-blue), var(--ios-blue-dark))' }}
            >
              {getInitials(user?.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold truncate" style={{ color: 'var(--ios-label)' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div className="text-[10px] font-semibold truncate" style={{ color: 'var(--ios-secondary)' }}>
                {user?.rol}
              </div>
            </div>
          </div>

          <div className="px-2 py-1 text-[10px] capitalize font-medium mb-1" style={{ color: 'var(--ios-tertiary)' }}>
            {today}
          </div>

          <NavLink
            to="/2fa-setup"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 mb-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
            style={{ color: 'var(--ios-blue)', backgroundColor: 'var(--ios-blue-light)' }}
          >
            <ShieldCheck size={14} />
            Seguridad 2FA
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            style={{ color: 'var(--ios-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ios-red)'; e.currentTarget.style.backgroundColor = 'var(--ios-red-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ios-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Área de contenido principal Soft UI ────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-3xl print:block print:overflow-visible print:rounded-none" style={{ backgroundColor: 'var(--ios-surface)', boxShadow: 'var(--soft-shadow-flat)', border: '1px solid rgba(255, 255, 255, 0.7)' }}>

        {/* Header superior estilo Cápsula Soft UI */}
        <header
          className="px-6 py-4 flex justify-between items-center flex-shrink-0 border-b hidden md:flex print:hidden"
          style={{
            backgroundColor: 'var(--ios-surface)',
            borderColor: 'var(--ios-separator-2)',
          }}
        >
          <div>
            <h1 className="text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--ios-label)' }}>
              {headerTitle}
            </h1>
            {headerSubtitle && (
              <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
                {headerSubtitle}
              </p>
            )}
          </div>

          {/* Barra de búsqueda cápsula estilo Neumorphism */}
          <div className="relative flex-1 max-w-xs mx-6 hidden xl:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ios-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Buscar estudiante, materia..." 
              className="w-full pl-10 pr-4 py-2 text-[12px] font-medium rounded-full outline-none transition-all"
              style={{
                backgroundColor: 'var(--ios-bg)',
                color: 'var(--ios-label)',
                boxShadow: 'var(--soft-shadow-inset)'
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {headerRightContent}
            <ThemeToggle showLabel={true} />
          </div>
        </header>

        {/* Área scrollable principal */}
        <div className="flex-1 overflow-auto p-6 print:overflow-visible print:p-0" style={{ backgroundColor: 'var(--ios-bg)' }}>
          {/* Mobile header */}
          <div className="md:hidden mb-5 flex justify-between items-start print:hidden">
            <div>
              <h1 className="text-[18px] font-extrabold" style={{ color: 'var(--ios-label)' }}>{headerTitle}</h1>
              <p className="text-[12px] font-medium" style={{ color: 'var(--ios-secondary)' }}>{headerSubtitle}</p>
            </div>
            <ThemeToggle showLabel={false} />
          </div>
          {children}
        </div>
      </main>

    </div>
  );
};

export default SidebarLayout;
