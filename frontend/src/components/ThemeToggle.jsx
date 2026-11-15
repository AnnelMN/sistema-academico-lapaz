import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Contrast } from 'lucide-react';

const ThemeToggle = ({ showLabel = true, className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const getThemeInfo = () => {
    switch (theme) {
      case 'bw':
        return {
          label: 'Blanco y Negro',
          icon: <Contrast size={14} className="text-black" />,
          style: {
            backgroundColor: '#FFFFFF',
            color: '#000000',
            boxShadow: 'var(--soft-shadow-sm)',
            border: '1px solid rgba(0,0,0,0.1)'
          }
        };
      case 'dark':
        return {
          label: 'Modo Oscuro',
          icon: <Moon size={14} className="text-blue-400" />,
          style: {
            backgroundColor: '#272D3C',
            color: '#F8FAFC',
            boxShadow: 'var(--soft-shadow-sm)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        };
      case 'light':
      default:
        return {
          label: 'Modo Color',
          icon: <Sun size={14} className="text-amber-500" />,
          style: {
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            boxShadow: 'var(--soft-shadow-sm)',
            border: '1px solid rgba(255,255,255,0.8)'
          }
        };
    }
  };

  const { label, icon, style } = getThemeInfo();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
      style={style}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </button>
  );
};

export default ThemeToggle;
