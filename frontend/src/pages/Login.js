// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    <div className="login-container">
      <div className="login-form">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>🎈 Globos y Fiesta</h1>
          <h2 style={{ color: '#7f8c8d', fontSize: '18px', fontWeight: 'normal' }}>
            Panel de Administración
          </h2>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ingresa tu email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              background: loading ? '#bdc3c7' : '#3498db',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          <strong>¿Eres cliente?</strong><br />
          <a 
            href="/catalogo" 
            style={{ color: '#3498db', textDecoration: 'none' }}
          >
            Ir al catálogo público
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;