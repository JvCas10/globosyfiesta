// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes de páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Pedidos from './pages/Pedidos';
import POS from './pages/POS';
import Reportes from './pages/Reportes';

// Componentes públicos para clientes
import ClientCatalog from './pages/ClientCatalog';
import OrderTracking from './pages/OrderTracking';

import './App.css';

// Componente para proteger rutas de admin (ALTERNATIVA a AdminRoute)
const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    toast.error('Debes iniciar sesión para acceder', {
      icon: '🔒'
    });
    return <Navigate to="/catalogo" replace />;
  }
  
  if (user.rol !== 'propietario' && user.rol !== 'empleado') {
    toast.error('No tienes permisos de administrador', {
      icon: '⛔'
    });
    return <Navigate to="/catalogo" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"  
            style={{ zIndex: 9999 }}
          />
          
          <Routes>
            {/* Ruta principal - redirige al catálogo público */}
            <Route path="/" element={<Navigate to="/catalogo" replace />} />
            
            {/* Rutas públicas para clientes */}
            <Route path="/catalogo" element={<ClientCatalog />} />
            <Route path="/catalog" element={<Navigate to="/catalogo" replace />} />
            <Route path="/seguimiento" element={<OrderTracking />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            {/* Login para administradores */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/admin-login" element={<Login />} />
            
            {/* Rutas protegidas para administradores */}
            <Route 
              path="/dashboard" 
              element={
                <AdminRoute>
                  <Navbar />
                  <main className="main-content">
                    <Dashboard />
                  </main>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/productos" 
              element={
                <AdminRoute>
                  <Navbar />
                  <main className="main-content">
                    <Productos />
                  </main>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/pedidos" 
              element={
                <AdminRoute>
                  <Navbar />
                  <main className="main-content">
                    <Pedidos />
                  </main>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <AdminRoute>
                  <Navbar />
                  <main className="main-content">
                    <POS />
                  </main>
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/reportes" 
              element={
                <AdminRoute>
                  <Navbar />
                  <main className="main-content">
                    <Reportes />
                  </main>
                </AdminRoute>
              } 
            />
            
            {/* Ruta 404 */}
            <Route 
              path="*" 
              element={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '40px',
                    borderRadius: '15px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h1 style={{ fontSize: '72px', margin: '0 0 20px 0' }}>404</h1>
                    <h2 style={{ margin: '0 0 15px 0' }}>Página no encontrada</h2>
                    <p style={{ margin: '0 0 25px 0', opacity: 0.9 }}>
                      La página que buscas no existe.
                    </p>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a 
                        href="/catalogo" 
                        style={{ 
                          color: 'white', 
                          textDecoration: 'none',
                          background: 'rgba(255,255,255,0.2)',
                          padding: '10px 20px',
                          borderRadius: '25px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🛍️ Ir al Catálogo
                      </a>
                      <a 
                        href="/admin" 
                        style={{ 
                          color: 'white', 
                          textDecoration: 'none',
                          background: 'rgba(255,255,255,0.2)',
                          padding: '10px 20px',
                          borderRadius: '25px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🛡️ Acceso Admin
                      </a>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;