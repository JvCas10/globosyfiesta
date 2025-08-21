// frontend/src/pages/Ventas.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewingVenta, setViewingVenta] = useState(null);
  
  const { hasPermission, isOwner } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: 'todos',
    metodoPago: 'todos'
  });

  // Estados del formulario de venta
  const [ventaData, setVentaData] = useState({
    cliente: '',
    datosCliente: {
      nombre: '',
      telefono: ''
    },
    items: [],
    metodoPago: 'efectivo',
    descuento: 0,
    notas: ''
  });

  // Estados para agregar items
  const [selectedProducto, setSelectedProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState('');

  useEffect(() => {
    fetchVentas();
    fetchProductos();
    fetchClientes();
  }, []);

  useEffect(() => {
    if (filtros.fechaInicio || filtros.fechaFin || filtros.estado !== 'todos' || filtros.metodoPago !== 'todos') {
      fetchVentasConFiltros();
    } else {
      fetchVentas();
    }
  }, [filtros]);

  const fetchVentas = async () => {
    try {
      const response = await axios.get('/api/ventas');
      setVentas(response.data.ventas);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchVentasConFiltros = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.metodoPago !== 'todos') params.append('metodoPago', filtros.metodoPago);
      
      const response = await axios.get(`/api/ventas?${params}`);
      setVentas(response.data.ventas);
    } catch (error) {
      console.error('Error al cargar ventas filtradas:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get('/api/productos?activo=true');
      setProductos(response.data.productos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get('/api/clientes');
      setClientes(response.data.clientes);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleSubmitVenta = async (e) => {
    e.preventDefault();
    setError('');

    if (ventaData.items.length === 0) {
      setError('Debe agregar al menos un producto a la venta');
      return;
    }

    // Validar datos del cliente
    if (!ventaData.cliente && (!ventaData.datosCliente.nombre || !ventaData.datosCliente.telefono)) {
      setError('Debe seleccionar un cliente o ingresar datos del cliente');
      return;
    }

    try {
      await axios.post('/api/ventas', ventaData);
      alert('Venta creada exitosamente');
      resetForm();
      fetchVentas();
    } catch (error) {
      console.error('Error al crear venta:', error);
      setError(error.response?.data?.message || 'Error al crear la venta');
    }
  };

  const agregarItem = () => {
    if (!selectedProducto || cantidad <= 0) {
      alert('Seleccione un producto y una cantidad válida');
      return;
    }

    const producto = productos.find(p => p._id === selectedProducto);
    if (!producto) return;

    if (cantidad > producto.stock) {
      alert(`Stock insuficiente. Disponible: ${producto.stock}`);
      return;
    }

    const precio = precioUnitario || producto.precioVenta;
    const nuevoItem = {
      producto: producto._id,
      nombre: producto.nombre,
      cantidad: parseInt(cantidad),
      precioUnitario: parseFloat(precio),
      subtotal: parseInt(cantidad) * parseFloat(precio)
    };

    setVentaData(prev => ({
      ...prev,
      items: [...prev.items, nuevoItem]
    }));

    // Limpiar campos
    setSelectedProducto('');
    setCantidad(1);
    setPrecioUnitario('');
  };

  const eliminarItem = (index) => {
    setVentaData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calcularTotal = () => {
    const subtotal = ventaData.items.reduce((total, item) => total + item.subtotal, 0);
    return subtotal - (ventaData.descuento || 0);
  };

  const resetForm = () => {
    setVentaData({
      cliente: '',
      datosCliente: {
        nombre: '',
        telefono: ''
      },
      items: [],
      metodoPago: 'efectivo',
      descuento: 0,
      notas: ''
    });
    setSelectedProducto('');
    setCantidad(1);
    setPrecioUnitario('');
    setShowForm(false);
  };

  const handleClienteChange = (clienteId) => {
    if (clienteId) {
      const cliente = clientes.find(c => c._id === clienteId);
      setVentaData(prev => ({
        ...prev,
        cliente: clienteId,
        datosCliente: {
          nombre: cliente?.nombre || '',
          telefono: cliente?.telefono || ''
        }
      }));
    } else {
      setVentaData(prev => ({
        ...prev,
        cliente: '',
        datosCliente: { nombre: '', telefono: '' }
      }));
    }
  };

  const verDetalleVenta = async (ventaId) => {
    try {
      const response = await axios.get(`/api/ventas/${ventaId}`);
      setViewingVenta(response.data.venta);
    } catch (error) {
      console.error('Error al cargar detalle de venta:', error);
    }
  };

  const cancelarVenta = async (ventaId) => {
    if (window.confirm('¿Estás seguro de cancelar esta venta? Esta acción restaurará el stock de los productos.')) {
      try {
        await axios.put(`/api/ventas/${ventaId}/cancelar`, {
          motivo: 'Cancelación solicitada por el usuario'
        });
        alert('Venta cancelada exitosamente');
        fetchVentas();
      } catch (error) {
        console.error('Error al cancelar venta:', error);
        alert('Error al cancelar la venta');
      }
    }
  };

  if (!hasPermission('ventas')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">💰 Ventas</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para gestionar ventas.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💰 Ventas</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nueva Venta'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Formulario de nueva venta */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            Nueva Venta
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitVenta}>
              {/* Selección de cliente */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Cliente Registrado</label>
                  <select
                    className="form-control"
                    value={ventaData.cliente}
                    onChange={(e) => handleClienteChange(e.target.value)}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente._id} value={cliente._id}>
                        {cliente.nombre} - {cliente.telefono}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nombre del Cliente *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ventaData.datosCliente.nombre}
                    onChange={(e) => setVentaData(prev => ({
                      ...prev,
                      datosCliente: { ...prev.datosCliente, nombre: e.target.value }
                    }))}
                    placeholder="Nombre del cliente"
                    required={!ventaData.cliente}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono del Cliente *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={ventaData.datosCliente.telefono}
                    onChange={(e) => setVentaData(prev => ({
                      ...prev,
                      datosCliente: { ...prev.datosCliente, telefono: e.target.value }
                    }))}
                    placeholder="50212345678"
                    required={!ventaData.cliente}
                  />
                </div>
              </div>

              {/* Agregar productos */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  Agregar Productos
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Producto</label>
                      <select
                        className="form-control"
                        value={selectedProducto}
                        onChange={(e) => {
                          setSelectedProducto(e.target.value);
                          const producto = productos.find(p => p._id === e.target.value);
                          setPrecioUnitario(producto?.precioVenta || '');
                        }}
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.map(producto => (
                          <option key={producto._id} value={producto._id}>
                            {producto.nombre} - Q{producto.precioVenta} (Stock: {producto.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Cantidad</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Precio Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={precioUnitario}
                        onChange={(e) => setPrecioUnitario(e.target.value)}
                      />
                    </div>

                    <button type="button" className="btn btn-primary" onClick={agregarItem}>
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de items */}
              {ventaData.items.length > 0 && (
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-header">
                    Items de la Venta
                  </div>
                  <div className="card-body">
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventaData.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.nombre}</td>
                              <td>{item.cantidad}</td>
                              <td>Q{item.precioUnitario.toFixed(2)}</td>
                              <td>Q{item.subtotal.toFixed(2)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  style={{ fontSize: '12px', padding: '5px 10px' }}
                                  onClick={() => eliminarItem(index)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalles de la venta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Método de Pago</label>
                  <select
                    className="form-control"
                    value={ventaData.metodoPago}
                    onChange={(e) => setVentaData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Descuento (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={ventaData.descuento}
                    onChange={(e) => setVentaData(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="form-group">
                  <label>Total a Pagar</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`Q${calcularTotal().toFixed(2)}`}
                    readOnly
                    style={{ fontWeight: 'bold', fontSize: '18px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={ventaData.notas}
                  onChange={(e) => setVentaData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Notas adicionales de la venta..."
                />
              </div>

              <div>
                <button type="submit" className="btn btn-primary">
                  Procesar Venta
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          Filtros de Búsqueda
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Estado</label>
              <select
                className="form-control"
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              >
                <option value="todos">Todos</option>
                <option value="completada">Completada</option>
                <option value="pendiente">Pendiente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Método de Pago</label>
              <select
                className="form-control"
                value={filtros.metodoPago}
                onChange={(e) => setFiltros(prev => ({ ...prev, metodoPago: e.target.value }))}
              >
                <option value="todos">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="card">
        <div className="card-header">
          Historial de Ventas ({ventas.length})
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Cargando ventas...</div>
          ) : ventas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No hay ventas para mostrar
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Método Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta._id}>
                      <td>
                        <strong>{venta.numero}</strong>
                      </td>
                      <td>
                        <div>
                          {venta.cliente?.nombre || venta.datosCliente?.nombre}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {venta.cliente?.telefono || venta.datosCliente?.telefono}
                        </div>
                      </td>
                      <td>
                        {new Date(venta.fechaVenta).toLocaleDateString()}
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {new Date(venta.fechaVenta).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        <strong>Q{venta.total.toFixed(2)}</strong>
                        {venta.descuento > 0 && (
                          <div style={{ fontSize: '12px', color: '#e74c3c' }}>
                            Desc: Q{venta.descuento.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td>{venta.metodoPago}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            venta.estado === 'completada' ? '#d4edda' :
                            venta.estado === 'pendiente' ? '#fff3cd' : '#f8d7da',
                          color:
                            venta.estado === 'completada' ? '#155724' :
                            venta.estado === 'pendiente' ? '#856404' : '#721c24'
                        }}>
                          {venta.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                          onClick={() => verDetalleVenta(venta._id)}
                        >
                          Ver
                        </button>
                        {venta.estado === 'completada' && (
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                            onClick={() => cancelarVenta(venta._id)}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de venta */}
      {viewingVenta && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Detalle de Venta {viewingVenta.numero}</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setViewingVenta(null)}
              >
                Cerrar
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4>Información del Cliente</h4>
                <p><strong>Nombre:</strong> {viewingVenta.cliente?.nombre || viewingVenta.datosCliente?.nombre}</p>
                <p><strong>Teléfono:</strong> {viewingVenta.cliente?.telefono || viewingVenta.datosCliente?.telefono}</p>
                {viewingVenta.cliente?.email && (
                  <p><strong>Email:</strong> {viewingVenta.cliente.email}</p>
                )}
              </div>

              <div>
                <h4>Información de la Venta</h4>
                <p><strong>Fecha:</strong> {new Date(viewingVenta.fechaVenta).toLocaleString()}</p>
                <p><strong>Vendedor:</strong> {viewingVenta.vendedor?.nombre}</p>
                <p><strong>Método de Pago:</strong> {viewingVenta.metodoPago}</p>
                <p><strong>Estado:</strong> {viewingVenta.estado}</p>
              </div>
            </div>

            <h4>Items de la Venta</h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingVenta.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>Q{item.precioUnitario.toFixed(2)}</td>
                      <td>Q{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <p><strong>Subtotal: Q{viewingVenta.subtotal.toFixed(2)}</strong></p>
              {viewingVenta.descuento > 0 && (
                <p style={{ color: '#e74c3c' }}><strong>Descuento: -Q{viewingVenta.descuento.toFixed(2)}</strong></p>
              )}
              <p style={{ fontSize: '20px' }}><strong>Total: Q{viewingVenta.total.toFixed(2)}</strong></p>
              
              {isOwner() && viewingVenta.ganancia !== undefined && (
                <p style={{ color: '#27ae60' }}><strong>Ganancia: Q{viewingVenta.ganancia.toFixed(2)}</strong></p>
              )}
            </div>

            {viewingVenta.notas && (
              <div style={{ marginTop: '20px' }}>
                <h4>Notas</h4>
                <p>{viewingVenta.notas}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;