// frontend/src/pages/Pedidos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  
  const { hasPermission } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });

  // Estado para actualización
  const [updateData, setUpdateData] = useState({
    estado: '',
    notasAdmin: ''
  });

  useEffect(() => {
    fetchPedidos();
  }, [filtros]);

  const fetchPedidos = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      
      const response = await axios.get(`/api/pedidos/admin?${params}`);
      setPedidos(response.data.pedidos);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (pedidoId) => {
    try {
      const response = await axios.get(`/api/pedidos/admin/${pedidoId}`);
      setSelectedPedido(response.data.pedido);
      setShowDetails(true);
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
    }
  };

  const handleUpdateStatus = (pedido) => {
    setSelectedPedido(pedido);
    setUpdateData({
      estado: pedido.estado,
      notasAdmin: pedido.notasAdmin || ''
    });
    setShowUpdateStatus(true);
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/pedidos/admin/${selectedPedido._id}/estado`, updateData);
      alert('Estado actualizado exitosamente');
      setShowUpdateStatus(false);
      setSelectedPedido(null);
      fetchPedidos();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert(error.response?.data?.message || 'Error al actualizar el estado');
    }
  };

  const getEstadoInfo = (estado) => {
    const estadosInfo = {
      'en-proceso': {
        color: '#f39c12',
        icon: '⏳',
        texto: 'En Proceso',
        bgColor: '#fff3cd',
        textColor: '#856404'
      },
      'cancelado': {
        color: '#e74c3c',
        icon: '❌',
        texto: 'Cancelado',
        bgColor: '#f8d7da',
        textColor: '#721c24'
      },
      'listo-entrega': {
        color: '#27ae60',
        icon: '✅',
        texto: 'Listo para Entrega',
        bgColor: '#d4edda',
        textColor: '#155724'
      },
      'entregado': {
        color: '#95a5a6',
        icon: '📦',
        texto: 'Entregado',
        bgColor: '#e2e3e5',
        textColor: '#383d41'
      }
    };
    return estadosInfo[estado] || estadosInfo['en-proceso'];
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTiempoTranscurrido = (fecha) => {
    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const diferencia = ahora - fechaPedido;
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Recién creado';
  };

  if (!hasPermission('ventas')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">📦 Pedidos</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para gestionar pedidos.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Gestión de Pedidos</h1>
        <div className="header-stats">
          <span>Total: {pedidos.length}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          🔍 Filtros de Búsqueda
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Estado</label>
              <select
                className="form-control"
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              >
                <option value="todos">Todos los Estados</option>
                <option value="en-proceso">En Proceso</option>
                <option value="listo-entrega">Listo para Entrega</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

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
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="card">
        <div className="card-header">
          📋 Lista de Pedidos ({pedidos.length})
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No hay pedidos para mostrar
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Tiempo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido._id}>
                      <td>
                        <div>
                          <strong>{pedido.numero}</strong>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            Código: {pedido.codigoSeguimiento}
                          </div>
                          <div style={{ fontSize: '12px', color: '#3498db' }}>
                            {pedido.items.length} producto{pedido.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{pedido.cliente.nombre}</strong>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            📞 {pedido.cliente.telefono}
                          </div>
                          {pedido.cliente.email && (
                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                              ✉️ {pedido.cliente.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '14px' }}>
                          {formatearFecha(pedido.fechaPedido)}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#27ae60' }}>
                          Q{pedido.total.toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getEstadoInfo(pedido.estado).bgColor,
                          color: getEstadoInfo(pedido.estado).textColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {getEstadoInfo(pedido.estado).icon} {getEstadoInfo(pedido.estado).texto}
                        </span>
                        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                          <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '4px' }}>
                            {getTiempoTranscurrido(pedido.fechaPedido)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {getTiempoTranscurrido(pedido.fechaEstadoActual)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                            onClick={() => handleViewDetails(pedido._id)}
                          >
                            👁️ Ver
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                            onClick={() => handleUpdateStatus(pedido)}
                          >
                            ✏️ Estado
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {showDetails && selectedPedido && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>📦 Detalle del Pedido {selectedPedido.numero}</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetails(false)}
              >
                Cerrar
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Información del pedido */}
              <div>
                <h4>📋 Información del Pedido</h4>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <p><strong>Número:</strong> {selectedPedido.numero}</p>
                  <p><strong>Código de Seguimiento:</strong> {selectedPedido.codigoSeguimiento}</p>
                  <p><strong>Fecha:</strong> {formatearFecha(selectedPedido.fechaPedido)}</p>
                  <p><strong>Total:</strong> Q{selectedPedido.total.toFixed(2)}</p>
                  <p>
                    <strong>Estado:</strong> 
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getEstadoInfo(selectedPedido.estado).bgColor,
                      color: getEstadoInfo(selectedPedido.estado).textColor,
                      marginLeft: '8px'
                    }}>
                      {getEstadoInfo(selectedPedido.estado).icon} {getEstadoInfo(selectedPedido.estado).texto}
                    </span>
                  </p>
                  {selectedPedido.fechaEstadoActual !== selectedPedido.fechaPedido && (
                    <p><strong>Última actualización:</strong> {formatearFecha(selectedPedido.fechaEstadoActual)}</p>
                  )}
                </div>
              </div>

              {/* Información del cliente */}
              <div>
                <h4>👤 Información del Cliente</h4>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <p><strong>Nombre:</strong> {selectedPedido.cliente.nombre}</p>
                  <p><strong>Teléfono:</strong> {selectedPedido.cliente.telefono}</p>
                  {selectedPedido.cliente.email && (
                    <p><strong>Email:</strong> {selectedPedido.cliente.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items del pedido */}
            <div style={{ marginBottom: '20px' }}>
              <h4>🛍️ Productos del Pedido</h4>
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
                    {selectedPedido.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.imagenUrl && (
                              <img
                                src={item.imagenUrl}
                                alt={item.nombre}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                            )}
                            <div>
                              <strong>{item.nombre}</strong>
                              {item.producto?.categoria && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  {item.producto.categoria}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{item.cantidad}</td>
                        <td>Q{item.precioUnitario.toFixed(2)}</td>
                        <td><strong>Q{item.subtotal.toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <h3 style={{ color: '#27ae60' }}>Total: Q{selectedPedido.total.toFixed(2)}</h3>
              </div>
            </div>

            {/* Notas */}
            {(selectedPedido.notasCliente || selectedPedido.notasAdmin) && (
              <div>
                <h4>📝 Notas</h4>
                {selectedPedido.notasCliente && (
                  <div style={{ marginBottom: '15px' }}>
                    <h5 style={{ color: '#3498db' }}>Notas del cliente:</h5>
                    <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
                      {selectedPedido.notasCliente}
                    </div>
                  </div>
                )}
                {selectedPedido.notasAdmin && (
                  <div>
                    <h5 style={{ color: '#e67e22' }}>Notas del administrador:</h5>
                    <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
                      {selectedPedido.notasAdmin}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de actualización de estado */}
      {showUpdateStatus && selectedPedido && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>✏️ Actualizar Estado del Pedido</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowUpdateStatus(false)}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Pedido: {selectedPedido.numero}</h4>
              <p><strong>Cliente:</strong> {selectedPedido.cliente.nombre}</p>
              <p><strong>Total:</strong> Q{selectedPedido.total.toFixed(2)}</p>
              <p>
                <strong>Estado actual:</strong> 
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: getEstadoInfo(selectedPedido.estado).bgColor,
                  color: getEstadoInfo(selectedPedido.estado).textColor,
                  marginLeft: '8px'
                }}>
                  {getEstadoInfo(selectedPedido.estado).texto}
                </span>
              </p>
            </div>

            <form onSubmit={submitStatusUpdate}>
              <div className="form-group">
                <label>Nuevo Estado *</label>
                <select
                  className="form-control"
                  value={updateData.estado}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, estado: e.target.value }))}
                  required
                >
                  <option value="en-proceso">⏳ En Proceso</option>
                  <option value="listo-entrega">✅ Listo para Entrega</option>
                  <option value="entregado">📦 Entregado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notas del Administrador</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={updateData.notasAdmin}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, notasAdmin: e.target.value }))}
                  placeholder="Agregar notas internas sobre el estado del pedido..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowUpdateStatus(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;