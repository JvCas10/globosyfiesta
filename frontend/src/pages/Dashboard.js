// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

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
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  if (!hasPermission('reportes')) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-page-header">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="dashboard-alert-error">
          No tienes permisos para ver el dashboard. Contacta al administrador.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-page-header">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="dashboard-alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-page-header">
        <h1 className="dashboard-title">Dashboard - Globos y Fiesta</h1>
        <small className="dashboard-date">
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
          {/* Resumen Diario y Mensual - Lado a Lado */}
          <div className="dashboard-summary-grid">
            {/* Resumen Diario */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                📊 Resumen del Día - {dashboardData.periodo.hoy}
              </div>
              <div className="dashboard-card-body">
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-item">
                    <div className="dashboard-stat-value">{dashboardData.resumenDiario.ventasHoy}</div>
                    <div className="dashboard-stat-label">Ventas Hoy</div>
                  </div>
                  <div className="dashboard-stat-item">
                    <div className="dashboard-stat-value">Q{dashboardData.resumenDiario.montoHoy.toFixed(2)}</div>
                    <div className="dashboard-stat-label">Ingresos Hoy</div>
                  </div>
                  {isOwner() && dashboardData.resumenDiario.gananciaHoy !== null && (
                    <div className="dashboard-stat-item">
                      <div className="dashboard-stat-value">Q{dashboardData.resumenDiario.gananciaHoy.toFixed(2)}</div>
                      <div className="dashboard-stat-label">Ganancia Hoy</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen Mensual */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                📅 Resumen del Mes
              </div>
              <div className="dashboard-card-body">
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-item">
                    <div className="dashboard-stat-value">{dashboardData.resumenMensual.ventasMes}</div>
                    <div className="dashboard-stat-label">Ventas del Mes</div>
                  </div>
                  <div className="dashboard-stat-item">
                    <div className="dashboard-stat-value">Q{dashboardData.resumenMensual.montoMes.toFixed(2)}</div>
                    <div className="dashboard-stat-label">Ingresos del Mes</div>
                  </div>
                  {isOwner() && dashboardData.resumenMensual.gananciaMes !== null && (
                    <div className="dashboard-stat-item">
                      <div className="dashboard-stat-value">Q{dashboardData.resumenMensual.gananciaMes.toFixed(2)}</div>
                      <div className="dashboard-stat-label">Ganancia del Mes</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Productos con Stock Bajo y Top Productos */}
          <div className="dashboard-products-grid">
            {/* Productos con Stock Bajo */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                ⚠️ Productos con Stock Bajo ({dashboardData.inventario.productosStockBajo})
              </div>
              <div className="dashboard-card-body">
                {dashboardData.inventario.listaBajo.length === 0 ? (
                  <p className="dashboard-success-message">
                    ✅ Todos los productos tienen stock suficiente
                  </p>
                ) : (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
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
                            <td className="dashboard-stock-low">
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
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                🏆 Productos Más Vendidos (Este Mes)
              </div>
              <div className="dashboard-card-body">
                {dashboardData.topProductos.length === 0 ? (
                  <p className="dashboard-empty-message">
                    No hay ventas este mes
                  </p>
                ) : (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
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
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              💎 Clientes Frecuentes
            </div>
            <div className="dashboard-card-body">
              {dashboardData.clientesFrecuentes.length === 0 ? (
                <p className="dashboard-empty-message">
                  No hay clientes frecuentes aún
                </p>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-table">
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