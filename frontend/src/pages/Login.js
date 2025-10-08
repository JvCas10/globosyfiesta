// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const { login, logout, user, isAuthenticated } = useAuth();

  // Logout automático al acceder a la página de login
  useEffect(() => {
    if (isAuthenticated) {
      logout();
      console.log('Sesión cerrada automáticamente al acceder al login');
    }
  }, []); // Solo se ejecuta una vez al montar el componente

  // Si el usuario está autenticado después del login exitoso, redirigir
  if (user && user.rol === 'propietario') {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (user && user.rol === 'empleado') {
    return <Navigate to="/pos" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // La redirección se maneja arriba con Navigate
        console.log('Login exitoso');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo-container">
            {!logoError ? (
              <img
                src="/LogoGlobosFiesta2.jpg"
                alt="Globos&Fiesta Logo"
                className="admin-logo-image"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="admin-logo-fallback">
                🎈
              </div>
            )}
          </div>
          <h1 className="admin-login-title">Globos&Fiesta</h1>
          <p className="admin-login-subtitle">Panel de Administración</p>
        </div>

        <div className="admin-login-body">
          {error && (
            <div className="admin-alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-form-field">
              <label htmlFor="email" className="admin-form-label">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                className="admin-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="password" className="admin-form-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="admin-form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu contraseña"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="admin-submit-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <div className="admin-login-footer">
          <p className="admin-footer-text">¿Eres cliente?</p>
          <a 
            href="/catalogo" 
            className="admin-catalog-link"
          >
            Ir al catálogo público →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;