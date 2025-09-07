// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useAuth();

  // Redirigir según el rol del usuario
  useEffect(() => {
    if (user) {
      if (user.rol === 'propietario' || user.rol === 'empleado') {
        // Admin va al dashboard
        window.location.href = '/dashboard';
      } else if (user.rol === 'cliente') {
        // Cliente va al catálogo
        window.location.href = '/catalogo';
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <form className="login-form" onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
      }}>
        {/* Header mejorado */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '30px'
          }}>
            🛡️
          </div>
          <h2>🎈 Globos y Fiesta</h2>
          <p style={{ textAlign: 'center', marginBottom: '0', color: '#7f8c8d' }}>
            Panel Administrativo
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@globosyfiesta.com"
            disabled={loading}
            autoComplete="email"
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
            placeholder="Tu contraseña"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ 
            width: '100%',
            background: loading 
              ? '#bdc3c7' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            padding: '15px',
            fontWeight: 'bold'
          }}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>

        {/* Información de prueba */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
          <p>Usuario de prueba:</p>
          <p><strong>Email:</strong> propietario@globosyfiesta.com</p>
          <p><strong>Contraseña:</strong> 123456</p>
        </div>

        {/* Enlace al catálogo */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link 
            to="/catalogo" 
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ← Ver Catálogo de Productos
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;