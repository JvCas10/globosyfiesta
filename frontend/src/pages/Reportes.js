// frontend/src/pages/Reportes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Reportes = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [reporteVentas, setReporteVentas] = useState(null);
  const [reporteInventario, setReporteInventario] = useState(null);
  const [reporteClientes, setReporteClientes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { hasPermission, isOwner } = useAuth();

  // Estados para filtros de reportes
  const [filtrosVentas, setFiltrosVentas] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  const [filtrosInventario, setFiltrosInventario] = useState({
    categoria: 'todos',
    stockBajo: false
  });

  const [filtrosClientes, setFiltrosClientes] = useState({
    tipoCliente: 'todos'
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

  const fetchReporteClientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reportes/clientes', {
        params: filtrosClientes
      });
      setReporteClientes(response.data);
    } catch (error) {
      console.error('Error al cargar reporte de clientes:', error);
      setError('Error al cargar el reporte de clientes');
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
      case 'clientes':
        if (!reporteClientes) fetchReporteClientes();
        break;
      default:
        break;
    }
  };

  if (!hasPermission('reportes')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">📈 Reportes</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para ver los reportes.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Reportes y Estadísticas</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`btn ${activeTab === 'ventas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('ventas')}
            >
              💰 Ventas
            </button>
            <button
              className={`btn ${activeTab === 'inventario' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('inventario')}
            >
              📦 Inventario
            </button>
            <button
              className={`btn ${activeTab === 'clientes' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('clientes')}
            >
              👥 Clientes
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Cargando datos...</div>}

      {/* Dashboard Principal */}
      {activeTab === 'dashboard' && dashboardData && (
        <div>
          {/* Resumen del día */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              📊 Resumen del Día - {new Date().toLocaleDateString()}
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>
                    {dashboardData.resumenDiario.ventasHoy}
                  </div>
                  <div>Ventas Hoy</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>
                    Q{dashboardData.resumenDiario.montoHoy.toFixed(2)}
                  </div>
                  <div>Ingresos Hoy</div>
                </div>
                {isOwner() && dashboardData.resumenDiario.gananciaHoy !== null && (
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22' }}>
                      Q{dashboardData.resumenDiario.gananciaHoy.toFixed(2)}
                    </div>
                    <div>Ganancia Hoy</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen del mes */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              📅 Resumen del Mes
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                    {dashboardData.resumenMensual.ventasMes}
                  </div>
                  <div>Ventas del Mes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                    Q{dashboardData.resumenMensual.montoMes.toFixed(2)}
                  </div>
                  <div>Ingresos del Mes</div>
                </div>
                {isOwner() && dashboardData.resumenMensual.gananciaMes !== null && (
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                      Q{dashboardData.resumenMensual.gananciaMes.toFixed(2)}
                    </div>
                    <div>Ganancia del Mes</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Productos con stock bajo */}
            <div className="card">
              <div className="card-header">
                ⚠️ Productos con Stock Bajo
              </div>
              <div className="card-body">
                {dashboardData.inventario.listaBajo.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#27ae60' }}>
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

            {/* Top productos */}
            <div className="card">
              <div className="card-header">
                🏆 Productos Más Vendidos
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

          {/* Clientes frecuentes */}
          <div className="card" style={{ marginTop: '20px' }}>
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
        </div>
      )}

      {/* Reporte de Ventas */}
      {activeTab === 'ventas' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              💰 Filtros del Reporte de Ventas
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filtrosVentas.fechaInicio}
                    onChange={(e) => setFiltrosVentas(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Fecha Fin</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filtrosVentas.fechaFin}
                    onChange={(e) => setFiltrosVentas(prev => ({ ...prev, fechaFin: e.target.value }))}
                  />
                </div>
                <button className="btn btn-primary" onClick={fetchReporteVentas}>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {reporteVentas && (
            <div>
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  📊 Resumen del Período
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                        {reporteVentas.resumen.totalVentas}
                      </div>
                      <div>Total Ventas</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                        Q{reporteVentas.resumen.montoTotal.toFixed(2)}
                      </div>
                      <div>Monto Total</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                        Q{reporteVentas.resumen.promedioVenta.toFixed(2)}
                      </div>
                      <div>Promedio por Venta</div>
                    </div>
                    {isOwner() && reporteVentas.resumen.gananciaTotal !== null && (
                      <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>
                          Q{reporteVentas.resumen.gananciaTotal.toFixed(2)}
                        </div>
                        <div>Ganancia Total</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  📈 Ventas por Día
                </div>
                <div className="card-body">
                  <div className="table-container">
                    <table className="table">
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
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              📦 Filtros del Reporte de Inventario
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Categoría</label>
                  <select
                    className="form-control"
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={filtrosInventario.stockBajo}
                      onChange={(e) => setFiltrosInventario(prev => ({ ...prev, stockBajo: e.target.checked }))}
                    />
                    Solo Stock Bajo
                  </label>
                </div>
                <button className="btn btn-primary" onClick={fetchReporteInventario}>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {reporteInventario && (
            <div>
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  📊 Resumen de Inventario
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                        {reporteInventario.resumen.totalProductos}
                      </div>
                      <div>Total Productos</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {reporteInventario.resumen.productosStockBajo}
                      </div>
                      <div>Stock Bajo</div>
                    </div>
                    {isOwner() && reporteInventario.resumen.valorInventarioTotal !== null && (
                      <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                          Q{reporteInventario.resumen.valorInventarioTotal.toFixed(2)}
                        </div>
                        <div>Valor Inventario</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {reporteInventario.productosPorCategoria.map((categoria) => (
                <div key={categoria.categoria} className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-header">
                    📦 {categoria.categoria.charAt(0).toUpperCase() + categoria.categoria.slice(1)} ({categoria.cantidadProductos} productos)
                  </div>
                  <div className="card-body">
                    <div className="table-container">
                      <table className="table">
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
                              <td style={{ 
                                color: producto.stockBajo ? '#e74c3c' : '#27ae60',
                                fontWeight: producto.stockBajo ? 'bold' : 'normal'
                              }}>
                                {producto.stock}
                                {producto.stockBajo && ' ⚠️'}
                              </td>
                              <td>Q{producto.precioVenta.toFixed(2)}</td>
                              {isOwner() && <td>{producto.margen}%</td>}
                              <td>
                                {producto.stockBajo ? (
                                  <span style={{ color: '#e74c3c' }}>Stock Bajo</span>
                                ) : (
                                  <span style={{ color: '#27ae60' }}>Normal</span>
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

      {/* Reporte de Clientes */}
      {activeTab === 'clientes' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              👥 Filtros del Reporte de Clientes
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tipo de Cliente</label>
                  <select
                    className="form-control"
                    value={filtrosClientes.tipoCliente}
                    onChange={(e) => setFiltrosClientes(prev => ({ ...prev, tipoCliente: e.target.value }))}
                  >
                    <option value="todos">Todos</option>
                    <option value="individual">Individual</option>
                    <option value="frecuente">Frecuente</option>
                    <option value="evento">Evento</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={fetchReporteClientes}>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {reporteClientes && (
            <div>
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  📊 Resumen de Clientes
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                        {reporteClientes.resumen.totalClientes}
                      </div>
                      <div>Total Clientes</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                        {reporteClientes.resumen.clientesActivos}
                      </div>
                      <div>Clientes Activos</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                        {reporteClientes.resumen.clientesFrecuentes}
                      </div>
                      <div>Clientes Frecuentes</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>
                        {reporteClientes.resumen.clientesNuevos}
                      </div>
                      <div>Clientes Nuevos</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  🏆 Top 10 Clientes
                </div>
                <div className="card-body">
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Tipo</th>
                          <th>Compras</th>
                          <th>Total Gastado</th>
                          <th>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteClientes.topClientes.map((cliente, index) => (
                          <tr key={cliente._id}>
                            <td>
                              {index < 3 && ['🥇', '🥈', '🥉'][index] + ' '}
                              {cliente.nombre}
                            </td>
                            <td>{cliente.tipoCliente}</td>
                            <td>{cliente.numeroVentas}</td>
                            <td>Q{cliente.totalCompras.toFixed(2)}</td>
                            <td>Q{cliente.promedioCompra.toFixed(2)}</td>
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
    </div>
  );
};

export default Reportes;