import axios from 'axios';

// URL del backend: en producción (Vercel) DEBE venir de VITE_API_URL; el
// localhost solo se usa al desarrollar en la computadora (P-03).
const urlBackend = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3000' : '');
if (!urlBackend) {
  console.error('Falta VITE_API_URL: configúrala en Vercel con la dirección https del backend.');
}

const api = axios.create({
  baseURL: urlBackend,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/2fa') &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
