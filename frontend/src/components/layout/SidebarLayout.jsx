import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const SidebarLayout = ({ 
  children, 
  menuGroups, 
  sidebarColor = 'bg-[#1e3a5f]', 
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

  const getAvatarColor = () => {
    switch (user?.rol) {
      case 'DIRECTOR': return 'bg-[#f59e0b]';
      case 'PROFESOR': return 'bg-[#f59e0b]';
      case 'ADMINISTRATIVO': return 'bg-[#d97706]';
      case 'ESTUDIANTE': return 'bg-[#16a34a]';
      default: return 'bg-blue-500';
    }
  };

  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`w-[200px] ${sidebarColor} text-white flex flex-col flex-shrink-0 transition-colors duration-300`}>
        
        {/* User Info Section */}
        <div className="px-4 py-5 border-b border-white/10 mb-2">
          <div className={`w-9 h-9 rounded-full ${getAvatarColor()} flex items-center justify-center font-bold text-[13px] text-white mb-2 shadow-sm`}>
            {getInitials(user?.nombre)}
          </div>
          <div className="text-[12px] font-bold text-white truncate">{user?.nombre || 'Usuario'}</div>
          <div className="text-[10px] text-white/60 truncate uppercase tracking-tight">
            {user?.rol} — U.E. La Paz "A"
          </div>
          <div className="text-[10px] text-white/50 mt-0.5 capitalize">
            {today}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-2">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <h3 className="px-3 text-[9px] font-bold text-white/40 tracking-[1.5px] uppercase mb-1.5">
                {group.title}
              </h3>
              <ul className="space-y-[1px]">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all ${
                          isActive 
                            ? 'bg-white/15 text-white font-semibold' 
                            : 'text-white/75 hover:bg-white/8 hover:text-white'
                        }`
                      }
                    >
                      <div className={`w-[14px] h-[14px] rounded-[3px] flex-shrink-0 ${item.dotColor || 'bg-blue-400'}`}></div>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="mx-2 mt-2 mb-4 pt-3 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] text-white/50 hover:text-white transition-colors"
          >
            <span className="text-[14px]">⏻</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header - Removed based on wireframe having title inside main content */}
        {/* But I will keep it for better UX, just simplified */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center flex-shrink-0 hidden md:flex">
          <div>
            <h1 className="text-lg font-bold text-[#1a1a2e]">{headerTitle}</h1>
            {headerSubtitle && <p className="text-[11px] text-slate-400">{headerSubtitle}</p>}
          </div>
          
          <div className="flex items-center space-x-4">
            {headerRightContent}
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 bg-[#f8fafc]">
          {/* Mobile Header (simplified) */}
          <div className="md:hidden mb-6">
            <h1 className="text-lg font-bold text-[#1a1a2e]">{headerTitle}</h1>
            <p className="text-[11px] text-slate-400">{headerSubtitle}</p>
          </div>
          
          {children}
        </div>
      </main>

    </div>
  );
};

export default SidebarLayout;
