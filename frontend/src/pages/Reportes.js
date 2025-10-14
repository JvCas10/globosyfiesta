// frontend/src/pages/Reportes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  generarPDFDashboard, 
  generarPDFVentas, 
  generarPDFInventario, 
} from '../utils/pdfGenerator.js';
import './Reportes.css';

const Reportes = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [reporteVentas, setReporteVentas] = useState(null);
  const [reporteInventario, setReporteInventario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { hasPermission, isOwner } = useAuth();

  const [filtrosVentas, setFiltrosVentas] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  const [filtrosInventario, setFiltrosInventario] = useState({
    categoria: 'todos',
    stockBajo: false
  });


  useEffect(() => {
    if (hasPermission('reportes')) {
      fetchDashboard();
    }
  }, [hasPermission]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/reportes/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReporteVentas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reportes/ventas', {
        params: filtrosVentas
      });
      setReporteVentas(response.data);
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
      setError('Error al cargar el reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchReporteInventario = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reportes/inventario', {
        params: filtrosInventario
      });
      setReporteInventario(response.data);
    } catch (error) {
      console.error('Error al cargar reporte de inventario:', error);
      setError('Error al cargar el reporte de inventario');
    } finally {
      setLoading(false);
    }
  };


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    
    switch (tab) {
      case 'ventas':
        if (!reporteVentas) fetchReporteVentas();
        break;
      case 'inventario':
        if (!reporteInventario) fetchReporteInventario();
        break;
      default:
        break;
    }
  };

  // Handlers para descargar PDFs
  const handleDescargarDashboard = () => {
    if (dashboardData) {
      generarPDFDashboard(dashboardData, isOwner());
    }
  };

  const handleDescargarVentas = () => {
    if (reporteVentas) {
      generarPDFVentas(reporteVentas, isOwner());
    }
  };

  const handleDescargarInventario = () => {
    if (reporteInventario) {
      generarPDFInventario(reporteInventario, isOwner());
    }
  };

  if (!hasPermission('reportes')) {
    return (
      <div className="reportes-container">
        <div className="reportes-page-header">
          <h1 className="reportes-title">📈 Reportes</h1>
        </div>
        <div className="reportes-alert-error">
          No tienes permisos para ver los reportes.
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-container">
      <div className="reportes-page-header">
        <h1 className="reportes-title">📈 Reportes y Estadísticas</h1>
        {/* Botón de descarga según la pestaña activa */}
        {activeTab === 'dashboard' && dashboardData && (
          <button className="reportes-btn-download" onClick={handleDescargarDashboard}>
            📥 Descargar Dashboard PDF
          </button>
        )}
        {activeTab === 'ventas' && reporteVentas && (
          <button className="reportes-btn-download" onClick={handleDescargarVentas}>
            📥 Descargar Ventas PDF
          </button>
        )}
        {activeTab === 'inventario' && reporteInventario && (
          <button className="reportes-btn-download" onClick={handleDescargarInventario}>
            📥 Descargar Inventario PDF
          </button>
        )}
      </div>

      {error && (
        <div className="reportes-alert-error">
          {error}
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="reportes-tabs-card">
        <div className="reportes-tabs-container">
          <button
            className={`reportes-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`reportes-tab-btn ${activeTab === 'ventas' ? 'active' : ''}`}
            onClick={() => handleTabChange('ventas')}
          >
            💰 Ventas
          </button>
          <button
            className={`reportes-tab-btn ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => handleTabChange('inventario')}
          >
            📦 Inventario
          </button>
        </div>
      </div>

      {loading && <div className="reportes-loading">Cargando datos...</div>}

      {/* Dashboard Principal */}
      {activeTab === 'dashboard' && dashboardData && (
        <div>
          {/* Resumen del día */}
          <div className="reportes-card">
            <div className="reportes-card-header">
              📊 Resumen del Día - {new Date().toLocaleDateString()}
            </div>
            <div className="reportes-card-body">
              <div className="reportes-stats-grid">
                <div className="reportes-stat-box">
                  <div className="reportes-stat-value reportes-stat-blue">
                    {dashboardData.resumenDiario.ventasHoy}
                  </div>
                  <div className="reportes-stat-label">Ventas Hoy</div>
                </div>
                <div className="reportes-stat-box">
                  <div className="reportes-stat-value reportes-stat-green">
                    Q{dashboardData.resumenDiario.montoHoy.toFixed(2)}
                  </div>
                  <div className="reportes-stat-label">Ingresos Hoy</div>
                </div>
                {isOwner() && dashboardData.resumenDiario.gananciaHoy !== null && (
                  <div className="reportes-stat-box">
                    <div className="reportes-stat-value reportes-stat-orange">
                      Q{dashboardData.resumenDiario.gananciaHoy.toFixed(2)}
                    </div>
                    <div className="reportes-stat-label">Ganancia Hoy</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen del mes */}
          <div className="reportes-card">
            <div className="reportes-card-header">
              📅 Resumen del Mes
            </div>
            <div className="reportes-card-body">
              <div className="reportes-stats-grid">
                <div className="reportes-stat-box reportes-stat-box-green">
                  <div className="reportes-stat-value reportes-stat-green">
                    {dashboardData.resumenMensual.ventasMes}
                  </div>
                  <div className="reportes-stat-label">Ventas del Mes</div>
                </div>
                <div className="reportes-stat-box reportes-stat-box-green">
                  <div className="reportes-stat-value reportes-stat-green">
                    Q{dashboardData.resumenMensual.montoMes.toFixed(2)}
                  </div>
                  <div className="reportes-stat-label">Ingresos del Mes</div>
                </div>
                {isOwner() && dashboardData.resumenMensual.gananciaMes !== null && (
                  <div className="reportes-stat-box reportes-stat-box-green">
                    <div className="reportes-stat-value reportes-stat-green">
                      Q{dashboardData.resumenMensual.gananciaMes.toFixed(2)}
                    </div>
                    <div className="reportes-stat-label">Ganancia del Mes</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="reportes-two-column-grid">
            {/* Productos con stock bajo */}
            <div className="reportes-card">
              <div className="reportes-card-header">
                ⚠️ Productos con Stock Bajo
              </div>
              <div className="reportes-card-body">
                {dashboardData.inventario.listaBajo.length === 0 ? (
                  <p className="reportes-message-success">
                    ✅ Todos los productos tienen stock suficiente
                  </p>
                ) : (
                  <div className="reportes-table-wrapper">
                    <table className="reportes-table">
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
                            <td className="reportes-stock-low">
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

            {/* Top productos */}
            <div className="reportes-card">
              <div className="reportes-card-header">
                🏆 Productos Más Vendidos
              </div>
              <div className="reportes-card-body">
                {dashboardData.topProductos.length === 0 ? (
                  <p className="reportes-message-empty">
                    No hay ventas este mes
                  </p>
                ) : (
                  <div className="reportes-table-wrapper">
                    <table className="reportes-table">
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

          {/* Clientes frecuentes */}
          <div className="reportes-card">
            <div className="reportes-card-header">
              💎 Clientes Frecuentes
            </div>
            <div className="reportes-card-body">
              {dashboardData.clientesFrecuentes.length === 0 ? (
                <p className="reportes-message-empty">
                  No hay clientes frecuentes aún
                </p>
              ) : (
                <div className="reportes-table-wrapper">
                  <table className="reportes-table">
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
        </div>
      )}

      {/* Reporte de Ventas */}
      {activeTab === 'ventas' && (
        <div>
          <div className="reportes-card">
            <div className="reportes-card-header">
              💰 Filtros del Reporte de Ventas
            </div>
            <div className="reportes-card-body">
              <div className="reportes-filters-grid">
                <div className="reportes-form-field">
                  <label className="reportes-form-label">Fecha Inicio</label>
                  <input
                    type="date"
                    className="reportes-form-input"
                    value={filtrosVentas.fechaInicio}
                    onChange={(e) => setFiltrosVentas(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  />
                </div>
                <div className="reportes-form-field">
                  <label className="reportes-form-label">Fecha Fin</label>
                  <input
                    type="date"
                    className="reportes-form-input"
                    value={filtrosVentas.fechaFin}
                    onChange={(e) => setFiltrosVentas(prev => ({ ...prev, fechaFin: e.target.value }))}
                  />
                </div>
                <button className="reportes-btn-generate" onClick={fetchReporteVentas}>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {reporteVentas && (
            <div>
              <div className="reportes-card">
                <div className="reportes-card-header">
                  📊 Resumen del Período
                </div>
                <div className="reportes-card-body">
                  <div className="reportes-stats-grid">
                    <div className="reportes-stat-box">
                      <div className="reportes-stat-value reportes-stat-blue">
                        {reporteVentas.resumen.totalVentas}
                      </div>
                      <div className="reportes-stat-label">Total Ventas</div>
                    </div>
                    <div className="reportes-stat-box">
                      <div className="reportes-stat-value reportes-stat-green">
                        Q{reporteVentas.resumen.montoTotal.toFixed(2)}
                      </div>
                      <div className="reportes-stat-label">Monto Total</div>
                    </div>
                    <div className="reportes-stat-box">
                      <div className="reportes-stat-value reportes-stat-purple">
                        Q{reporteVentas.resumen.promedioVenta.toFixed(2)}
                      </div>
                      <div className="reportes-stat-label">Promedio por Venta</div>
                    </div>
                    {isOwner() && reporteVentas.resumen.gananciaTotal !== null && (
                      <div className="reportes-stat-box">
                        <div className="reportes-stat-value reportes-stat-orange">
                          Q{reporteVentas.resumen.gananciaTotal.toFixed(2)}
                        </div>
                        <div className="reportes-stat-label">Ganancia Total</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="reportes-card">
                <div className="reportes-card-header">
                  📈 Ventas por Día
                </div>
                <div className="reportes-card-body">
                  <div className="reportes-table-wrapper">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Número de Ventas</th>
                          <th>Monto Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteVentas.ventasPorDia.map((dia) => (
                          <tr key={dia.fecha}>
                            <td>{new Date(dia.fecha).toLocaleDateString()}</td>
                            <td>{dia.cantidad}</td>
                            <td>Q{dia.monto.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte de Inventario */}
      {activeTab === 'inventario' && (
        <div>
          <div className="reportes-card">
            <div className="reportes-card-header">
              📦 Filtros del Reporte de Inventario
            </div>
            <div className="reportes-card-body">
              <div className="reportes-filters-grid">
                <div className="reportes-form-field">
                  <label className="reportes-form-label">Categoría</label>
                  <select
                    className="reportes-form-select"
                    value={filtrosInventario.categoria}
                    onChange={(e) => setFiltrosInventario(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    <option value="todos">Todas</option>
                    <option value="globos">Globos</option>
                    <option value="decoraciones">Decoraciones</option>
                    <option value="articulos-fiesta">Artículos de Fiesta</option>
                    <option value="servicios">Servicios</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div className="reportes-form-field">
                  <label className="reportes-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtrosInventario.stockBajo}
                      onChange={(e) => setFiltrosInventario(prev => ({ ...prev, stockBajo: e.target.checked }))}
                    />
                    Solo Stock Bajo
                  </label>
                </div>
                <button className="reportes-btn-generate" onClick={fetchReporteInventario}>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {reporteInventario && (
            <div>
              <div className="reportes-card">
                <div className="reportes-card-header">
                  📊 Resumen de Inventario
                </div>
                <div className="reportes-card-body">
                  <div className="reportes-stats-grid">
                    <div className="reportes-stat-box">
                      <div className="reportes-stat-value reportes-stat-blue">
                        {reporteInventario.resumen.totalProductos}
                      </div>
                      <div className="reportes-stat-label">Total Productos</div>
                    </div>
                    <div className="reportes-stat-box">
                      <div className="reportes-stat-value reportes-stat-red">
                        {reporteInventario.resumen.productosStockBajo}
                      </div>
                      <div className="reportes-stat-label">Stock Bajo</div>
                    </div>
                    {isOwner() && reporteInventario.resumen.valorInventarioTotal !== null && (
                      <div className="reportes-stat-box">
                        <div className="reportes-stat-value reportes-stat-green">
                          Q{reporteInventario.resumen.valorInventarioTotal.toFixed(2)}
                        </div>
                        <div className="reportes-stat-label">Valor Inventario</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {reporteInventario.productosPorCategoria.map((categoria) => (
                <div key={categoria.categoria} className="reportes-card reportes-category-section">
                  <div className="reportes-card-header">
                    📦 {categoria.categoria.charAt(0).toUpperCase() + categoria.categoria.slice(1)} ({categoria.cantidadProductos} productos)
                  </div>
                  <div className="reportes-card-body">
                    <div className="reportes-table-wrapper">
                      <table className="reportes-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Stock</th>
                            <th>Precio Venta</th>
                            {isOwner() && <th>Margen %</th>}
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoria.productos.map((producto) => (
                            <tr key={producto._id}>
                              <td>{producto.nombre}</td>
                              <td className={producto.stockBajo ? 'reportes-stock-low' : 'reportes-stock-ok'}>
                                {producto.stock}
                                {producto.stockBajo && ' ⚠️'}
                              </td>
                              <td>Q{producto.precioVenta.toFixed(2)}</td>
                              {isOwner() && <td>{producto.margen}%</td>}
                              <td>
                                {producto.stockBajo ? (
                                  <span className="reportes-status-low">Stock Bajo</span>
                                ) : (
                                  <span className="reportes-status-normal">Normal</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reportes;