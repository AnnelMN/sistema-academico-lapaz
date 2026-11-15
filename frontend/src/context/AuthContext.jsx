import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Error restoring session:', err);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login(email.trim().toLowerCase(), password);
      if (data.requires2FA || data.requiresSetup2FA) return data;
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message, { cause: err });
    }
  };

  const authenticate2FA = async (tempToken, code) => {
    try {
      setError(null);
      const data = await authService.authenticate2FA(tempToken, code.trim());
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Código 2FA inválido';
      setError(message);
      throw new Error(message, { cause: err });
    }
  };

  const activate2FA = async (tempToken, code) => {
    try {
      setError(null);
      const data = await authService.activate2FA(tempToken, code.trim());
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Código 2FA inválido';
      setError(message);
      throw new Error(message, { cause: err });
    }
  };

  const refreshUser = async () => {
    const userData = await authService.getMe();
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        authenticate2FA,
        activate2FA,
        refreshUser,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
