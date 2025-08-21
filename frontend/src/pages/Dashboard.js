// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission, isOwner } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!hasPermission('reportes')) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/reportes/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  if (!hasPermission('reportes')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para ver el dashboard. Contacta al administrador.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard - Globos y Fiesta</h1>
        <small style={{ color: '#7f8c8d' }}>
          {new Date().toLocaleDateString('es-GT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </small>
      </div>

      {dashboardData && (
        <>
          {/* Resumen Diario */}
          <div className="card">
            <div className="card-header">
              📊 Resumen del Día - {dashboardData.periodo.hoy}
            </div>
            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{dashboardData.resumenDiario.ventasHoy}</div>
                  <div className="stat-label">Ventas Hoy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">Q{dashboardData.resumenDiario.montoHoy.toFixed(2)}</div>
                  <div className="stat-label">Ingresos Hoy</div>
                </div>
                {isOwner() && dashboardData.resumenDiario.gananciaHoy !== null && (
                  <div className="stat-card">
                    <div className="stat-number">Q{dashboardData.resumenDiario.gananciaHoy.toFixed(2)}</div>
                    <div className="stat-label">Ganancia Hoy</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen Mensual */}
          <div className="card">
            <div className="card-header">
              📅 Resumen del Mes
            </div>
            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{dashboardData.resumenMensual.ventasMes}</div>
                  <div className="stat-label">Ventas del Mes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">Q{dashboardData.resumenMensual.montoMes.toFixed(2)}</div>
                  <div className="stat-label">Ingresos del Mes</div>
                </div>
                {isOwner() && dashboardData.resumenMensual.gananciaMes !== null && (
                  <div className="stat-card">
                    <div className="stat-number">Q{dashboardData.resumenMensual.gananciaMes.toFixed(2)}</div>
                    <div className="stat-label">Ganancia del Mes</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Productos con Stock Bajo */}
            <div className="card">
              <div className="card-header">
                ⚠️ Productos con Stock Bajo ({dashboardData.inventario.productosStockBajo})
              </div>
              <div className="card-body">
                {dashboardData.inventario.listaBajo.length === 0 ? (
                  <p style={{ color: '#27ae60', textAlign: 'center' }}>
                    ✅ Todos los productos tienen stock suficiente
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Stock</th>
                          <th>Mínimo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.inventario.listaBajo.map((producto) => (
                          <tr key={producto._id}>
                            <td>{producto.nombre}</td>
                            <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                              {producto.stock}
                            </td>
                            <td>{producto.stockMinimo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Top Productos */}
            <div className="card">
              <div className="card-header">
                🏆 Productos Más Vendidos (Este Mes)
              </div>
              <div className="card-body">
                {dashboardData.topProductos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
                    No hay ventas este mes
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Vendidos</th>
                          <th>Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.topProductos.map((producto, index) => (
                          <tr key={producto._id}>
                            <td>
                              {index === 0 && '🥇 '}
                              {index === 1 && '🥈 '}
                              {index === 2 && '🥉 '}
                              {producto.nombreProducto}
                            </td>
                            <td>{producto.cantidadVendida}</td>
                            <td>Q{producto.ingresoTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clientes Frecuentes */}
          <div className="card">
            <div className="card-header">
              💎 Clientes Frecuentes
            </div>
            <div className="card-body">
              {dashboardData.clientesFrecuentes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
                  No hay clientes frecuentes aún
                </p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Compras</th>
                        <th>Total Gastado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.clientesFrecuentes.map((cliente) => (
                        <tr key={cliente._id}>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.telefono}</td>
                          <td>{cliente.numeroVentas}</td>
                          <td>Q{cliente.totalCompras.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;