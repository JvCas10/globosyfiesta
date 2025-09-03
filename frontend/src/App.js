// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Componentes de páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Pedidos from './pages/Pedidos';  // Reemplaza Clientes
import POS from './pages/POS';          // Reemplaza Ventas
import Reportes from './pages/Reportes';

// Componentes públicos para clientes
import ClientCatalog from './pages/ClientCatalog';
import OrderTracking from './pages/OrderTracking';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas para clientes */}
            <Route path="/catalogo" element={<ClientCatalog />} />
            <Route path="/seguimiento" element={<OrderTracking />} />
            
            {/* Ruta de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas para administradores */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Dashboard />
                </main>
              </ProtectedRoute>
            } />
            
            <Route path="/productos" element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Productos />
                </main>
              </ProtectedRoute>
            } />
            
            <Route path="/pedidos" element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Pedidos />
                </main>
              </ProtectedRoute>
            } />
            
            <Route path="/pos" element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <POS />
                </main>
              </ProtectedRoute>
            } />
            
            <Route path="/reportes" element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Reportes />
                </main>
              </ProtectedRoute>
            } />
            
            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column' 
              }}>
                <h1>404 - Página no encontrada</h1>
                <p>La página que buscas no existe.</p>
                <a href="/" style={{ color: '#3498db', textDecoration: 'none' }}>
                  Volver al inicio
                </a>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;