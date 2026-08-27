import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API, { API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // Automatically sync fresh user profile from backend on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(r => {
          if (r.data.success && r.data.user) {
            localStorage.setItem('user', JSON.stringify(r.data.user));
            setUser(r.data.user);
          }
        })
        .catch(err => console.log('Auth check error:', err));
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const login = useCallback(async (email, password, role) => {
    const { data } = await API.post('/auth/login', { email, password, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const { data } = await API.post('/auth/register', { name, email, password, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback((role = 'recruiter', email = '', name = '') => {
    let url = `${API_BASE_URL}/auth/google?role=${role}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (typeof window !== 'undefined' && window.location.origin) {
      url += `&client_origin=${encodeURIComponent(window.location.origin)}`;
    }
    window.location.href = url;
  }, []);

  const loginFromToken = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await API.delete('/auth/delete-account');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, register, loginWithGoogle, loginFromToken, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
