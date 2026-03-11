import React, { useState, useEffect } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { authAPI } from './api/client';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('idToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        <DashboardPage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
