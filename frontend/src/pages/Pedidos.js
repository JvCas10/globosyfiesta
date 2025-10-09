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
  
  // Estado de paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
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
  }, [filtros, pagination.currentPage]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);
      
      const response = await axios.get(`/api/pedidos/admin?${params}`);
      setPedidos(response.data.pedidos);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('❌ Error al cargar los pedidos');
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar a página 1 cuando cambian los filtros
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filtros]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = async (pedidoId) => {
    const toastId = toast.loading('Cargando detalles...');
    try {
      const response = await axios.get(`/api/pedidos/admin/${pedidoId}`);
      setSelectedPedido(response.data.pedido);
      setShowDetails(true);
      toast.dismiss(toastId);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      toast.error('❌ Error al cargar los detalles del pedido');
      toast.dismiss(toastId);
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

  const submitUpdateStatus = async () => {
    if (!updateData.estado) {
      toast.error('❌ Debes seleccionar un estado');
      return;
    }

    const toastId = toast.loading('Actualizando estado...');
    try {
      await axios.put(`/api/pedidos/admin/${selectedPedido._id}/estado`, updateData);
      toast.success('✅ Estado actualizado correctamente');
      toast.dismiss(toastId);
      fetchPedidos();
      resetUpdateModal();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('❌ Error al actualizar el estado');
      toast.dismiss(toastId);
    }
  };

  const resetUpdateModal = () => {
    setShowUpdateStatus(false);
    setSelectedPedido(null);
    setUpdateData({ estado: '', notasAdmin: '' });
  };

  const getEstadoClase = (estado) => {
    const clases = {
      'en-proceso': 'pedidos-status-proceso',
      'listo-entrega': 'pedidos-status-listo',
      'entregado': 'pedidos-status-entregado',
      'cancelado': 'pedidos-status-cancelado'
    };
    return `pedidos-status-badge ${clases[estado] || ''}`;
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'en-proceso': '⏳ En Proceso',
      'listo-entrega': '📦 Listo para Entrega',
      'entregado': '✅ Entregado',
      'cancelado': '❌ Cancelado'
    };
    return textos[estado] || estado;
  };

  const calcularTiempoTranscurrido = (fecha) => {
    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const diferencia = ahora - fechaPedido;
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
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
          Total: {pagination.totalItems} pedidos
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
          📋 Lista de Pedidos (Página {pagination.currentPage} de {pagination.totalPages})
        </div>
        <div className="pedidos-card-body">
          {loading ? (
            <div className="pedidos-loading">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <p className="pedidos-empty">No hay pedidos para mostrar</p>
          ) : (
            <>
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
                            <div className="pedidos-client-detail">📞 {pedido.cliente.telefono}</div>
                            {pedido.cliente.direccion && (
                              <div className="pedidos-client-detail">📍 {pedido.cliente.direccion}</div>
                            )}
                          </div>
                        </td>
                        <td className="pedidos-date">
                          {new Date(pedido.fechaPedido).toLocaleDateString('es-GT', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="pedidos-total">Q{pedido.total.toFixed(2)}</td>
                        <td>
                          <div className={getEstadoClase(pedido.estado)}>
                            {getEstadoTexto(pedido.estado)}
                          </div>
                        </td>
                        <td className="pedidos-elapsed-time">
                          {calcularTiempoTranscurrido(pedido.fechaPedido)}
                        </td>
                        <td>
                          <div className="pedidos-actions">
                            <button
                              className="pedidos-btn pedidos-btn-view"
                              onClick={() => handleViewDetails(pedido._id)}
                              title="Ver detalles"
                            >
                              👁️
                            </button>
                            <button
                              className="pedidos-btn pedidos-btn-edit"
                              onClick={() => handleUpdateStatus(pedido)}
                              title="Actualizar estado"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Controles de paginación */}
              {pagination.totalPages > 1 && (
                <div className="pedidos-pagination">
                  <button
                    className="pedidos-pagination-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                  >
                    ⏮️ Primera
                  </button>
                  
                  <button
                    className="pedidos-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    ◀️ Anterior
                  </button>

                  <div className="pedidos-pagination-info">
                    <span className="pedidos-pagination-current">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    <span className="pedidos-pagination-total">
                      ({pagination.totalItems} pedidos en total)
                    </span>
                  </div>

                  <button
                    className="pedidos-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Siguiente ▶️
                  </button>

                  <button
                    className="pedidos-pagination-btn"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Última ⏭️
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedPedido && (
        <div className="pedidos-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="pedidos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pedidos-modal-header">
              <span>Detalles del Pedido #{selectedPedido.numero}</span>
              <button className="pedidos-modal-close" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="pedidos-modal-body">
              {/* Información general */}
              <div className="pedidos-detail-section">
                <h4 className="pedidos-section-title">📋 Información General</h4>
                <div className="pedidos-detail-grid">
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Número de Pedido:</span>
                    <span className="pedidos-detail-value">{selectedPedido.numero}</span>
                  </div>
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Código de Seguimiento:</span>
                    <span className="pedidos-detail-value pedidos-tracking-code">
                      {selectedPedido.codigoSeguimiento}
                    </span>
                  </div>
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Estado:</span>
                    <span className={getEstadoClase(selectedPedido.estado)}>
                      {getEstadoTexto(selectedPedido.estado)}
                    </span>
                  </div>
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Fecha del Pedido:</span>
                    <span className="pedidos-detail-value">
                      {new Date(selectedPedido.fechaPedido).toLocaleString('es-GT')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="pedidos-detail-section">
                <h4 className="pedidos-section-title">👤 Cliente</h4>
                <div className="pedidos-detail-grid">
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Nombre:</span>
                    <span className="pedidos-detail-value">{selectedPedido.cliente.nombre}</span>
                  </div>
                  <div className="pedidos-detail-item">
                    <span className="pedidos-detail-label">Teléfono:</span>
                    <span className="pedidos-detail-value">{selectedPedido.cliente.telefono}</span>
                  </div>
                  {selectedPedido.cliente.email && (
                    <div className="pedidos-detail-item">
                      <span className="pedidos-detail-label">Email:</span>
                      <span className="pedidos-detail-value">{selectedPedido.cliente.email}</span>
                    </div>
                  )}
                  {selectedPedido.cliente.direccion && (
                    <div className="pedidos-detail-item pedidos-detail-full">
                      <span className="pedidos-detail-label">Dirección:</span>
                      <span className="pedidos-detail-value">{selectedPedido.cliente.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="pedidos-detail-section">
                <h4 className="pedidos-section-title">🎈 Productos</h4>
                <div className="pedidos-items-list">
                  {selectedPedido.items.map((item, index) => (
                    <div key={index} className="pedidos-item">
                      <div className="pedidos-item-info">
                        <span className="pedidos-item-name">{item.producto?.nombre || 'Producto no disponible'}</span>
                        <span className="pedidos-item-quantity">Cantidad: {item.cantidad}</span>
                      </div>
                      <div className="pedidos-item-prices">
                        <span className="pedidos-item-price">Q{item.precioUnitario.toFixed(2)} c/u</span>
                        <span className="pedidos-item-subtotal">Subtotal: Q{item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pedidos-total-section">
                  <span className="pedidos-total-label">Total del Pedido:</span>
                  <span className="pedidos-total-amount">Q{selectedPedido.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notas */}
              {(selectedPedido.notasCliente || selectedPedido.notasAdmin) && (
                <div className="pedidos-detail-section">
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
                  <span className={getEstadoClase(selectedPedido.estado)}>
                    {getEstadoTexto(selectedPedido.estado)}
                  </span>
                </div>
              </div>

              <div className="pedidos-update-form">
                <div className="pedidos-form-field">
                  <label className="pedidos-form-label">Nuevo Estado *</label>
                  <select
                    className="pedidos-form-select"
                    value={updateData.estado}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="en-proceso">⏳ En Proceso</option>
                    <option value="listo-entrega">📦 Listo para Entrega</option>
                    <option value="entregado">✅ Entregado</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>
                </div>

                <div className="pedidos-form-field">
                  <label className="pedidos-form-label">Notas del Administrador</label>
                  <textarea
                    className="pedidos-form-textarea"
                    value={updateData.notasAdmin}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, notasAdmin: e.target.value }))}
                    placeholder="Notas internas sobre el pedido..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="pedidos-modal-actions">
                <button
                  className="pedidos-btn pedidos-btn-cancel"
                  onClick={resetUpdateModal}
                >
                  Cancelar
                </button>
                <button
                  className="pedidos-btn pedidos-btn-primary"
                  onClick={submitUpdateStatus}
                >
                  Actualizar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;