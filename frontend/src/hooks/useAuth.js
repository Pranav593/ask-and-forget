import { useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password, loginFn) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginFn(email, password);
      const userData = { email, idToken: response.data.tokenId };
      localStorage.setItem('idToken', response.data.tokenId);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Authentication failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, loading, error, login, logout };
};
