// frontend/src/components/Navbar.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      logout();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Botón de menú móvil */}
      <button 
        className="admin-mobile-menu-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Overlay para cerrar el menú en móvil */}
      <div 
        className={`admin-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <nav className={`admin-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo-wrapper">
            <img
              src="/LogoGlobosFiesta.jpg"
              alt="Globos y Fiesta Logo"
              className="admin-sidebar-logo"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "inline";
              }}
            />
            <span className="admin-sidebar-logo-fallback">🎈</span>
            <div className="admin-sidebar-brand">
              <h2>Globos y Fiesta</h2>
              <p>Sistema de Gestión</p>
            </div>
          </div>
        </div>

        <ul className="admin-sidebar-menu">
          <li className="admin-menu-item">
            <Link
              to="/dashboard"
              className={`admin-menu-link ${isActive("/dashboard") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              📊 Dashboard
            </Link>
          </li>

          {hasPermission("productos") && (
            <li className="admin-menu-item">
              <Link
                to="/productos"
                className={`admin-menu-link ${isActive("/productos") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                🎈 Productos
              </Link>
            </li>
          )}

          {hasPermission("ventas") && (
            <li className="admin-menu-item">
              <Link
                to="/pedidos"
                className={`admin-menu-link ${isActive("/pedidos") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                📦 Pedidos
              </Link>
            </li>
          )}

          {hasPermission("ventas") && (
            <li className="admin-menu-item">
              <Link
                to="/pos"
                className={`admin-menu-link ${isActive("/pos") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                🪙 POS
              </Link>
            </li>
          )}

          {hasPermission("reportes") && (
            <li className="admin-menu-item">
              <Link
                to="/reportes"
                className={`admin-menu-link ${isActive("/reportes") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                📈 Reportes
              </Link>
            </li>
          )}
          {/* Botón para volver al catálogo */}
<li className="admin-menu-item">
  <Link
    to="/catalogo"
    className="admin-menu-link admin-client-view"
    onClick={closeMobileMenu}
  >
    🛍️ Vista Cliente
  </Link>
</li>
        </ul>

        <div className="admin-sidebar-footer">
          <div className="admin-user-details">
            <span className="admin-user-name">{user?.nombre}</span>
            <span className="admin-user-role">{user?.rol}</span>
            <span className="admin-user-email">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;