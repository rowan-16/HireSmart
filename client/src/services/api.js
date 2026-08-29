import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? (window.location.origin.includes('vercel.app') ? 'https://hiresmart-4jfl.onrender.com/api' : `${window.location.origin}/api`)
    : 'https://hiresmart-4jfl.onrender.com/api');

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const API = axios.create({ baseURL: API_BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthPath = typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/login') ||
       window.location.pathname.startsWith('/register') ||
       window.location.pathname.startsWith('/auth'));

    if (err.response?.status === 401 && !isAuthPath) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
