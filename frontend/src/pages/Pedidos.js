// frontend/src/pages/Pedidos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Pedidos.css';

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  
  const { hasPermission } = useAuth();

  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });

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
      toast.error('❌ Error al cargar los pedidos');
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (pedidoId) => {
    const toastId = toast.loading('Cargando detalles del pedido...');
    
    try {
      const response = await axios.get(`/api/pedidos/admin/${pedidoId}`);
      setSelectedPedido(response.data.pedido);
      setShowDetails(true);
      
      toast.update(toastId, {
        render: '✅ Detalles cargados',
        type: 'success',
        isLoading: false,
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
      toast.update(toastId, {
        render: '❌ Error al cargar los detalles',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
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
    
    const toastId = toast.loading('Actualizando estado del pedido...');
    
    try {
      await axios.put(`/api/pedidos/admin/${selectedPedido._id}/estado`, updateData);
      
      toast.update(toastId, {
        render: '✅ Estado actualizado exitosamente',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      setShowUpdateStatus(false);
      setSelectedPedido(null);
      fetchPedidos();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado';
      
      toast.update(toastId, {
        render: `❌ ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    }
  };

  const resetDetailsModal = () => {
    setShowDetails(false);
    setSelectedPedido(null);
  };

  const resetUpdateModal = () => {
    setShowUpdateStatus(false);
    setSelectedPedido(null);
    setUpdateData({
      estado: '',
      notasAdmin: ''
    });
  };

  const getEstadoInfo = (estado) => {
    const estadosInfo = {
      'en-proceso': {
        icon: '⏳',
        texto: 'En Proceso',
        bgColor: '#fff3cd',
        textColor: '#856404'
      },
      'cancelado': {
        icon: '❌',
        texto: 'Cancelado',
        bgColor: '#f8d7da',
        textColor: '#721c24'
      },
      'listo-entrega': {
        icon: '✅',
        texto: 'Listo para Entrega',
        bgColor: '#d4edda',
        textColor: '#155724'
      },
      'entregado': {
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
      <div className="pedidos-container">
        <div className="pedidos-page-header">
          <h1 className="pedidos-title">📦 Pedidos</h1>
        </div>
        <div className="pedidos-alert-error">
          No tienes permisos para gestionar pedidos.
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-container">
      <div className="pedidos-page-header">
        <h1 className="pedidos-title">📦 Gestión de Pedidos</h1>
        <div className="pedidos-header-stats">
          Total: {pedidos.length}
        </div>
      </div>

      {error && <div className="pedidos-alert-error">{error}</div>}

      {/* Filtros */}
      <div className="pedidos-filters-card">
        <div className="pedidos-filters-header">
          🔍 Filtros de Búsqueda
        </div>
        <div className="pedidos-filters-body">
          <div className="pedidos-filters-grid">
            <div className="pedidos-form-field">
              <label className="pedidos-form-label">Estado</label>
              <select
                className="pedidos-form-select"
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

            <div className="pedidos-form-field">
              <label className="pedidos-form-label">Fecha Inicio</label>
              <input
                type="date"
                className="pedidos-form-input"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>

            <div className="pedidos-form-field">
              <label className="pedidos-form-label">Fecha Fin</label>
              <input
                type="date"
                className="pedidos-form-input"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="pedidos-card">
        <div className="pedidos-card-header">
          📋 Lista de Pedidos ({pedidos.length})
        </div>
        <div className="pedidos-card-body">
          {loading ? (
            <div className="pedidos-loading">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <p className="pedidos-empty">No hay pedidos para mostrar</p>
          ) : (
            <div className="pedidos-table-wrapper">
              <table className="pedidos-table">
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
                        <div className="pedidos-order-info">
                          <div className="pedidos-order-number">{pedido.numero}</div>
                          <div className="pedidos-order-code">
                            Código: {pedido.codigoSeguimiento}
                          </div>
                          <div className="pedidos-order-items">
                            {pedido.items.length} producto{pedido.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pedidos-client-info">
                          <div className="pedidos-client-name">{pedido.cliente.nombre}</div>
                          <div className="pedidos-client-detail">
                            📞 {pedido.cliente.telefono}
                          </div>
                          {pedido.cliente.email && (
                            <div className="pedidos-client-detail">
                              ✉️ {pedido.cliente.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="pedidos-date">
                          {formatearFecha(pedido.fechaPedido)}
                        </div>
                      </td>
                      <td>
                        <div className="pedidos-total">
                          Q{pedido.total.toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <span className="pedidos-status-badge" style={{
                          backgroundColor: getEstadoInfo(pedido.estado).bgColor,
                          color: getEstadoInfo(pedido.estado).textColor
                        }}>
                          {getEstadoInfo(pedido.estado).icon} {getEstadoInfo(pedido.estado).texto}
                        </span>
                        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                          <div className="pedidos-status-time">
                            {getTiempoTranscurrido(pedido.fechaPedido)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="pedidos-elapsed-time">
                          {getTiempoTranscurrido(pedido.fechaEstadoActual)}
                        </div>
                      </td>
                      <td>
                        <div className="pedidos-actions">
                          <button
                            className="pedidos-btn-view"
                            onClick={() => handleViewDetails(pedido._id)}
                          >
                            👁️ Ver
                          </button>
                          <button
                            className="pedidos-btn-status"
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

      {/* Modal de detalles */}
      {showDetails && selectedPedido && (
        <div className="pedidos-modal-overlay" onClick={resetDetailsModal}>
          <div className="pedidos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pedidos-modal-header">
              Detalle del Pedido {selectedPedido.numero}
              <button className="pedidos-modal-close" onClick={resetDetailsModal}>×</button>
            </div>

            <div className="pedidos-modal-body">
              <div className="pedidos-info-grid">
                {/* Información del pedido */}
                <div className="pedidos-info-section">
                  <h4 className="pedidos-section-title">📋 Información del Pedido</h4>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Número:</span>
                    <span className="pedidos-info-value">{selectedPedido.numero}</span>
                  </div>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Código de Seguimiento:</span>
                    <span className="pedidos-info-value">{selectedPedido.codigoSeguimiento}</span>
                  </div>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Fecha:</span>
                    <span className="pedidos-info-value">{formatearFecha(selectedPedido.fechaPedido)}</span>
                  </div>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Total:</span>
                    <span className="pedidos-info-value pedidos-total-highlight">Q{selectedPedido.total.toFixed(2)}</span>
                  </div>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Estado:</span>
                    <span className="pedidos-status-badge" style={{
                      backgroundColor: getEstadoInfo(selectedPedido.estado).bgColor,
                      color: getEstadoInfo(selectedPedido.estado).textColor,
                      marginLeft: '8px'
                    }}>
                      {getEstadoInfo(selectedPedido.estado).icon} {getEstadoInfo(selectedPedido.estado).texto}
                    </span>
                  </div>
                  {selectedPedido.fechaEstadoActual !== selectedPedido.fechaPedido && (
                    <div className="pedidos-info-item">
                      <span className="pedidos-info-label">Última actualización:</span>
                      <span className="pedidos-info-value">{formatearFecha(selectedPedido.fechaEstadoActual)}</span>
                    </div>
                  )}
                </div>

                {/* Información del cliente */}
                <div className="pedidos-info-section">
                  <h4 className="pedidos-section-title">👤 Información del Cliente</h4>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Nombre:</span>
                    <span className="pedidos-info-value">{selectedPedido.cliente.nombre}</span>
                  </div>
                  <div className="pedidos-info-item">
                    <span className="pedidos-info-label">Teléfono:</span>
                    <span className="pedidos-info-value">{selectedPedido.cliente.telefono}</span>
                  </div>
                  {selectedPedido.cliente.email && (
                    <div className="pedidos-info-item">
                      <span className="pedidos-info-label">Email:</span>
                      <span className="pedidos-info-value">{selectedPedido.cliente.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items del pedido */}
              <div className="pedidos-products-section">
                <h4 className="pedidos-section-title">🛒 Productos del Pedido</h4>
                <div className="pedidos-table-wrapper">
                  <table className="pedidos-table">
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
                            <div className="pedidos-product-item">
                              {item.imagenUrl && (
                                <img
                                  src={item.imagenUrl}
                                  alt={item.nombre}
                                  className="pedidos-product-image"
                                />
                              )}
                              <div className="pedidos-product-details">
                                <div className="pedidos-product-name">{item.nombre}</div>
                                {item.producto?.categoria && (
                                  <div className="pedidos-product-category">
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
                <div className="pedidos-total-section">
                  <div className="pedidos-total-label">Total del Pedido:</div>
                  <div className="pedidos-total-amount">Q{selectedPedido.total.toFixed(2)}</div>
                </div>
              </div>

              {/* Notas */}
              {(selectedPedido.notasCliente || selectedPedido.notasAdmin) && (
                <div className="pedidos-notes-section">
                  <h4 className="pedidos-section-title">📝 Notas</h4>
                  {selectedPedido.notasCliente && (
                    <div className="pedidos-note-box pedidos-note-client">
                      <div className="pedidos-note-title">💬 Notas del cliente:</div>
                      <div className="pedidos-note-content">{selectedPedido.notasCliente}</div>
                    </div>
                  )}
                  {selectedPedido.notasAdmin && (
                    <div className="pedidos-note-box pedidos-note-admin">
                      <div className="pedidos-note-title">🔒 Notas del administrador:</div>
                      <div className="pedidos-note-content">{selectedPedido.notasAdmin}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de actualización de estado */}
      {showUpdateStatus && selectedPedido && (
        <div className="pedidos-modal-overlay" onClick={resetUpdateModal}>
          <div className="pedidos-modal pedidos-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="pedidos-modal-header">
              <span>Actualizar Estado del Pedido</span>
              <button className="pedidos-modal-close" onClick={resetUpdateModal}>×</button>
            </div>

            <div className="pedidos-modal-body">
              <div className="pedidos-update-info">
                <div className="pedidos-update-info-row">
                  <span className="pedidos-update-label">Pedido:</span>
                  <span className="pedidos-update-value">{selectedPedido.numero}</span>
                </div>
                <div className="pedidos-update-info-row">
                  <span className="pedidos-update-label">Cliente:</span>
                  <span className="pedidos-update-value">{selectedPedido.cliente.nombre}</span>
                </div>
                <div className="pedidos-update-info-row">
                  <span className="pedidos-update-label">Total:</span>
                  <span className="pedidos-update-value">Q{selectedPedido.total.toFixed(2)}</span>
                </div>
                <div className="pedidos-update-info-row">
                  <span className="pedidos-update-label">Estado actual:</span>
                  <span className="pedidos-status-badge" style={{
                    backgroundColor: getEstadoInfo(selectedPedido.estado).bgColor,
                    color: getEstadoInfo(selectedPedido.estado).textColor
                  }}>
                    {getEstadoInfo(selectedPedido.estado).icon} {getEstadoInfo(selectedPedido.estado).texto}
                  </span>
                </div>
              </div>

              <form onSubmit={submitStatusUpdate}>
                <div className="pedidos-form-field">
                  <label className="pedidos-form-label">Nuevo Estado *</label>
                  <select
                    className="pedidos-form-select"
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

                <div className="pedidos-form-field">
                  <label className="pedidos-form-label">Notas del Administrador</label>
                  <textarea
                    className="pedidos-form-textarea"
                    value={updateData.notasAdmin}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, notasAdmin: e.target.value }))}
                    placeholder="Agregar notas internas sobre el estado del pedido..."
                  />
                </div>

                <div className="pedidos-form-actions">
                  <button 
                    type="button" 
                    className="pedidos-btn-cancel" 
                    onClick={resetUpdateModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="pedidos-btn-submit">
                    Actualizar Estado
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;