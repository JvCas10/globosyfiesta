// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>🎈 Globos y Fiesta</h2>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#7f8c8d' }}>
          Iniciar Sesión
        </p>

        {error && (
          <div className="alert alert-error">
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
            placeholder="tu-email@ejemplo.com"
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
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
          <p>Usuario de prueba:</p>
          <p><strong>Email:</strong> propietario@globosyfiesta.com</p>
          <p><strong>Contraseña:</strong> 123456</p>
        </div>
      </form>
    </div>
  );
};

export default Login;