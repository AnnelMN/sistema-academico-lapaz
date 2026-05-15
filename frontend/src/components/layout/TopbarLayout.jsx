import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Top Header */}
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Unidad Educativa La Paz "A" — Portal Estudiante</h1>
            <p className="text-sm text-blue-200 mt-0.5">Gestión 2026 · 1er Trimestre</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || 'Estudiante Demo'}</p>
              <p className="text-xs text-blue-200">3ro B</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 font-bold flex items-center justify-center border border-blue-400">
              {getInitials(user?.nombre)}
            </div>
            <button 
              onClick={handleLogout}
              className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors flex items-center justify-center"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab, idx) => (
              <NavLink
                key={idx}
                to={tab.path}
                end={tab.exact}
                className={({ isActive }) =>
                  `py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive 
                      ? 'border-blue-400 text-white' 
                      : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  );
};

export default TopbarLayout;
