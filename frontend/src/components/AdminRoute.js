// frontend/src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '18px', margin: 0 }}>Verificando credenciales...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, redirigir al login de admin
  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  // Si es cliente, redirigir al catálogo
  if (user.rol === 'cliente') {
    return <Navigate to="/catalogo" replace />;
  }

  // Solo permitir propietario y empleado en rutas administrativas
  if (user.rol !== 'propietario' && user.rol !== 'empleado') {
    return <Navigate to="/catalogo" replace />;
  }

  // Si todo está bien, mostrar el componente
  return children;
};

export default AdminRoute;