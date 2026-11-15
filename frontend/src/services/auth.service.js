import api from './api';

const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const authenticate2FA = async (tempToken, code) => {
  const response = await api.post('/api/auth/2fa/authenticate', { tempToken, code });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const activate2FA = async (tempToken, code) => {
  const response = await api.post('/api/auth/2fa/setup-authenticate', { tempToken, code });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

const resetPassword = async (tempToken, code, newPassword) => {
  const response = await api.post('/api/auth/reset-password', { tempToken, code, newPassword });
  return response.data;
};

const setup2FA = async () => {
  const response = await api.post('/api/auth/2fa/setup');
  return response.data; // { qrDataUrl, manualKey }
};

const verify2FASetup = async (code) => {
  const response = await api.post('/api/auth/2fa/verify-setup', { code });
  return response.data;
};

const disable2FA = async (password) => {
  const response = await api.post('/api/auth/2fa/disable', { password });
  return response.data;
};

const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

const authService = {
  login,
  authenticate2FA,
  activate2FA,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getMe,
  logout,
};

export default authService;
