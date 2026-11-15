import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-bw', 'dark');
    
    if (theme === 'dark') {
      root.classList.add('theme-dark', 'dark');
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'bw') {
      root.classList.add('theme-bw', 'dark');
      root.setAttribute('data-theme', 'bw');
    } else {
      root.classList.add('theme-light');
      root.setAttribute('data-theme', 'light');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  // Cicla entre: Claro (light) -> Blanco y Negro (bw) -> Oscuro (dark) -> Claro
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'bw';
      if (prevTheme === 'bw') return 'dark';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};
