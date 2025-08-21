// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>🎈 Globos y Fiesta</h2>
        <p>Sistema de Gestión</p>
      </div>

      <ul className="navbar-nav">
        <li className="nav-item">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
        </li>

        {hasPermission('productos') && (
          <li className="nav-item">
            <Link 
              to="/productos" 
              className={`nav-link ${isActive('/productos') ? 'active' : ''}`}
            >
              🎈 Productos
            </Link>
          </li>
        )}

        {hasPermission('clientes') && (
          <li className="nav-item">
            <Link 
              to="/clientes" 
              className={`nav-link ${isActive('/clientes') ? 'active' : ''}`}
            >
              👥 Clientes
            </Link>
          </li>
        )}

        {hasPermission('ventas') && (
          <li className="nav-item">
            <Link 
              to="/ventas" 
              className={`nav-link ${isActive('/ventas') ? 'active' : ''}`}
            >
              💰 Ventas
            </Link>
          </li>
        )}

        {hasPermission('reportes') && (
          <li className="nav-item">
            <Link 
              to="/reportes" 
              className={`nav-link ${isActive('/reportes') ? 'active' : ''}`}
            >
              📈 Reportes
            </Link>
          </li>
        )}
      </ul>

      <div className="user-info">
        <div>
          <strong>{user?.nombre}</strong>
          <br />
          <small>{user?.rol}</small>
          <br />
          <small>{user?.email}</small>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;