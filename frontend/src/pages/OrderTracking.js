import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './OrderTracking.css';

const OrderTracking = () => {
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const buscarPedido = async (e) => {
    e.preventDefault();
    
    if (!codigoSeguimiento || codigoSeguimiento.length !== 6) {
      setError('El código de seguimiento debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    setPedido(null);

    try {
      const response = await axios.get(`/api/pedidos/seguimiento/${codigoSeguimiento}`);
      
      if (response.data.success) {
        setPedido(response.data.pedido);
      }
    } catch (error) {
      console.error('Error al buscar pedido:', error);
      setError(error.response?.data?.message || 'Pedido no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async () => {
    if (!motivoCancelacion.trim()) {
      toast.error('Por favor indica el motivo de la cancelación', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await axios.put(`/api/pedidos/cancelar/${codigoSeguimiento}`, {
        motivo: motivoCancelacion
      });

      if (response.data.success) {
        toast.success('¡Pedido cancelado exitosamente!', {
          position: "top-center",
          autoClose: 3000,
        });
        setPedido(prev => ({
          ...prev,
          estado: 'cancelado',
          fechaEstadoActual: new Date().toISOString()
        }));
        setMostrarCancelacion(false);
        setMotivoCancelacion('');
      }
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar el pedido', {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };

  const getEstadoInfo = (estado) => {
    const estadosInfo = {
      'en-proceso': {
        color: '#f39c12',
        icon: '⏳',
        texto: 'En Proceso',
        descripcion: 'Tu pedido está siendo preparado'
      },
      'cancelado': {
        color: '#e74c3c',
        icon: '❌',
        texto: 'Cancelado',
        descripcion: 'El pedido ha sido cancelado'
      },
      'listo-entrega': {
        color: '#27ae60',
        icon: '✅',
        texto: 'Listo para Entrega',
        descripcion: '¡Tu pedido está listo! Puedes venir a recogerlo'
      },
      'entregado': {
        color: '#95a5a6',
        icon: '📦',
        texto: 'Entregado',
        descripcion: 'El pedido ha sido entregado exitosamente'
      }
    };
    return estadosInfo[estado] || estadosInfo['en-proceso'];
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const puedeSerCancelado = (estado) => {
    return estado !== 'cancelado' && estado !== 'entregado';
  };

  return (
    <div className="order-tracking-page">
      <div className="order-tracking-header">
        <h1>📦 Rastrear Tu Pedido</h1>
        <p>Ingresa tu código de seguimiento para ver el estado de tu pedido</p>
      </div>

      <div className="order-search-section">
        <form onSubmit={buscarPedido} className="order-search-form">
          <div className="order-input-group">
            <input
              type="text"
              placeholder="Código de 6 dígitos (ej: 123456)"
              value={codigoSeguimiento}
              onChange={(e) => setCodigoSeguimiento(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
              className="order-codigo-input"
            />
            <button type="submit" disabled={loading} className="order-btn-buscar">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="order-error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {pedido && (
        <div className="order-pedido-details">
          {/* Estado del pedido */}
          <div className="order-estado-card">
            <div className="order-estado-header" style={{ backgroundColor: getEstadoInfo(pedido.estado).color }}>
              <span className="order-estado-icon">{getEstadoInfo(pedido.estado).icon}</span>
              <div className="order-estado-info">
                <h2>{getEstadoInfo(pedido.estado).texto}</h2>
                <p>{getEstadoInfo(pedido.estado).descripcion}</p>
              </div>
            </div>
            <div className="order-estado-fecha">
              <p>Última actualización: {formatearFecha(pedido.fechaEstadoActual)}</p>
            </div>
          </div>

          {/* Información del pedido */}
          <div className="order-info-card">
            <h3>📋 Información del Pedido</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <strong>Número:</strong> {pedido.numero}
              </div>
              <div className="order-info-item">
                <strong>Código:</strong> {pedido.codigoSeguimiento}
              </div>
              <div className="order-info-item">
                <strong>Fecha:</strong> {formatearFecha(pedido.fechaPedido)}
              </div>
              <div className="order-info-item">
                <strong>Total:</strong> Q{pedido.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="order-info-card">
            <h3>👤 Datos del Cliente</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <strong>Nombre:</strong> {pedido.cliente.nombre}
              </div>
              <div className="order-info-item">
                <strong>Teléfono:</strong> {pedido.cliente.telefono}
              </div>
              {pedido.cliente.email && (
                <div className="order-info-item">
                  <strong>Email:</strong> {pedido.cliente.email}
                </div>
              )}
            </div>
          </div>

          {/* Items del pedido */}
          <div className="order-info-card">
            <h3>🛍️ Productos del Pedido</h3>
            <div className="order-items-list">
              {pedido.items.map((item, index) => (
                <div key={index} className="order-item-row">
                  {item.imagenUrl && (
                    <div className="order-item-imagen">
                      <img src={item.imagenUrl} alt={item.nombre} />
                    </div>
                  )}
                  <div className="order-item-info">
                    <h4>{item.nombre}</h4>
                    <p>Cantidad: {item.cantidad} × Q{item.precioUnitario.toFixed(2)}</p>
                  </div>
                  <div className="order-item-total">
                    <strong>Q{item.subtotal.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total-pedido">
              <h3>Total: Q{pedido.total.toFixed(2)}</h3>
            </div>
          </div>

          {/* Notas */}
          {(pedido.notasCliente || pedido.notasAdmin) && (
            <div className="order-info-card">
              <h3>📝 Notas</h3>
              {pedido.notasCliente && (
                <div className="order-nota-section">
                  <h4>Notas del cliente:</h4>
                  <p>{pedido.notasCliente}</p>
                </div>
              )}
              {pedido.notasAdmin && (
                <div className="order-nota-section">
                  <h4>Notas de la tienda:</h4>
                  <p>{pedido.notasAdmin}</p>
                </div>
              )}
            </div>
          )}

          {/* Progreso del pedido */}
          <div className="order-info-card">
            <h3>📈 Progreso del Pedido</h3>
            <div className="order-progress-timeline">
              <div className={`order-progress-step ${['en-proceso', 'listo-entrega', 'entregado'].includes(pedido.estado) || pedido.estado === 'cancelado' ? 'completed' : ''}`}>
                <div className="order-step-icon">📝</div>
                <div className="order-step-content">
                  <h4>Pedido Recibido</h4>
                  <p>{formatearFecha(pedido.fechaPedido)}</p>
                </div>
              </div>

              <div className={`order-progress-step ${pedido.estado === 'en-proceso' ? 'current' : ['listo-entrega', 'entregado'].includes(pedido.estado) ? 'completed' : ''}`}>
                <div className="order-step-icon">⏳</div>
                <div className="order-step-content">
                  <h4>En Proceso</h4>
                  <p>Preparando tu pedido</p>
                </div>
              </div>

              <div className={`order-progress-step ${pedido.estado === 'listo-entrega' ? 'current' : pedido.estado === 'entregado' ? 'completed' : ''}`}>
                <div className="order-step-icon">✅</div>
                <div className="order-step-content">
                  <h4>Listo para Entrega</h4>
                  <p>Puedes venir a recogerlo</p>
                </div>
              </div>

              <div className={`order-progress-step ${pedido.estado === 'entregado' ? 'completed current' : ''}`}>
                <div className="order-step-icon">📦</div>
                <div className="order-step-content">
                  <h4>Entregado</h4>
                  <p>Pedido completado</p>
                </div>
              </div>

              {pedido.estado === 'cancelado' && (
                <div className="order-progress-step cancelled">
                  <div className="order-step-icon">❌</div>
                  <div className="order-step-content">
                    <h4>Cancelado</h4>
                    <p>{formatearFecha(pedido.fechaEstadoActual)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones disponibles */}
          <div className="order-actions-card">
            {puedeSerCancelado(pedido.estado) && (
              <button 
                className="order-btn-cancelar"
                onClick={() => setMostrarCancelacion(true)}
              >
                ❌ Cancelar Pedido
              </button>
            )}
            <button 
              className="order-btn-nuevo-pedido"
              onClick={() => window.location.href = '/catalogo'}
            >
              🛍️ Hacer Nuevo Pedido
            </button>
          </div>
        </div>
      )}

      {/* Modal de cancelación */}
      {mostrarCancelacion && (
        <div className="order-modal-overlay">
          <div className="order-modal-cancelacion">
            <div className="order-modal-header">
              <h3>❌ Cancelar Pedido</h3>
              <button 
                className="order-btn-close"
                onClick={() => setMostrarCancelacion(false)}
              >
                ×
              </button>
            </div>
            <div className="order-modal-body">
              <p><strong>¿Estás seguro de que deseas cancelar este pedido?</strong></p>
              <p>Pedido: {pedido.numero} por Q{pedido.total.toFixed(2)}</p>
              
              <div className="order-form-group">
                <label>Motivo de la cancelación:</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Por favor indica por qué deseas cancelar el pedido..."
                  rows="3"
                />
              </div>
              
              <div className="order-advertencia">
                <p>⚠️ <strong>Nota:</strong> Una vez cancelado, no podrás reactivar este pedido.</p>
              </div>
            </div>
            <div className="order-modal-footer">
              <button 
                className="order-btn order-btn-secondary"
                onClick={() => setMostrarCancelacion(false)}
              >
                No Cancelar
              </button>
              <button 
                className="order-btn order-btn-danger"
                onClick={cancelarPedido}
              >
                Sí, Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;