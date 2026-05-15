import api from './api';

const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
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
  getMe,
  logout,
};

export default authService;
