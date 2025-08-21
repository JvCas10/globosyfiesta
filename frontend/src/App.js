// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Reportes from './pages/Reportes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Navigate to="/dashboard" replace />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/productos" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Productos />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Clientes />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/ventas" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Ventas />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/reportes" element={
              <ProtectedRoute>
                <Navbar />
                <div className="main-content">
                  <Reportes />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;