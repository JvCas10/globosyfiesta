import React, { useState } from 'react';
import axios from 'axios';

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
      alert('Por favor indica el motivo de la cancelación');
      return;
    }

    try {
      const response = await axios.put(`/api/pedidos/cancelar/${codigoSeguimiento}`, {
        motivo: motivoCancelacion
      });

      if (response.data.success) {
        alert('Pedido cancelado exitosamente');
        // Actualizar el estado del pedido
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
      alert(error.response?.data?.message || 'Error al cancelar el pedido');
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
    <div className="tracking-container">
      <div className="tracking-header">
        <h1>📦 Rastrear Tu Pedido</h1>
        <p>Ingresa tu código de seguimiento para ver el estado de tu pedido</p>
      </div>

      <div className="search-section">
        <form onSubmit={buscarPedido} className="search-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Código de 6 dígitos (ej: 123456)"
              value={codigoSeguimiento}
              onChange={(e) => setCodigoSeguimiento(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
              className="codigo-input"
            />
            <button type="submit" disabled={loading} className="btn-buscar">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {pedido && (
        <div className="pedido-details">
          {/* Estado del pedido */}
          <div className="estado-card">
            <div className="estado-header" style={{ backgroundColor: getEstadoInfo(pedido.estado).color }}>
              <span className="estado-icon">{getEstadoInfo(pedido.estado).icon}</span>
              <div className="estado-info">
                <h2>{getEstadoInfo(pedido.estado).texto}</h2>
                <p>{getEstadoInfo(pedido.estado).descripcion}</p>
              </div>
            </div>
            <div className="estado-fecha">
              <p>Última actualización: {formatearFecha(pedido.fechaEstadoActual)}</p>
            </div>
          </div>

          {/* Información del pedido */}
          <div className="info-card">
            <h3>📋 Información del Pedido</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Número:</strong> {pedido.numero}
              </div>
              <div className="info-item">
                <strong>Código:</strong> {pedido.codigoSeguimiento}
              </div>
              <div className="info-item">
                <strong>Fecha:</strong> {formatearFecha(pedido.fechaPedido)}
              </div>
              <div className="info-item">
                <strong>Total:</strong> Q{pedido.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="info-card">
            <h3>👤 Datos del Cliente</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Nombre:</strong> {pedido.cliente.nombre}
              </div>
              <div className="info-item">
                <strong>Teléfono:</strong> {pedido.cliente.telefono}
              </div>
              {pedido.cliente.email && (
                <div className="info-item">
                  <strong>Email:</strong> {pedido.cliente.email}
                </div>
              )}
            </div>
          </div>

          {/* Items del pedido */}
          <div className="info-card">
            <h3>🛍️ Productos del Pedido</h3>
            <div className="items-list">
              {pedido.items.map((item, index) => (
                <div key={index} className="item-row">
                  {item.imagenUrl && (
                    <div className="item-imagen">
                      <img src={item.imagenUrl} alt={item.nombre} />
                    </div>
                  )}
                  <div className="item-info">
                    <h4>{item.nombre}</h4>
                    <p>Cantidad: {item.cantidad} × Q{item.precioUnitario.toFixed(2)}</p>
                  </div>
                  <div className="item-total">
                    <strong>Q{item.subtotal.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="total-pedido">
              <h3>Total: Q{pedido.total.toFixed(2)}</h3>
            </div>
          </div>

          {/* Notas */}
          {(pedido.notasCliente || pedido.notasAdmin) && (
            <div className="info-card">
              <h3>📝 Notas</h3>
              {pedido.notasCliente && (
                <div className="nota-section">
                  <h4>Notas del cliente:</h4>
                  <p>{pedido.notasCliente}</p>
                </div>
              )}
              {pedido.notasAdmin && (
                <div className="nota-section">
                  <h4>Notas de la tienda:</h4>
                  <p>{pedido.notasAdmin}</p>
                </div>
              )}
            </div>
          )}

          {/* Progreso del pedido */}
          <div className="info-card">
            <h3>📈 Progreso del Pedido</h3>
            <div className="progress-timeline">
              <div className={`progress-step ${['en-proceso', 'listo-entrega', 'entregado'].includes(pedido.estado) || pedido.estado === 'cancelado' ? 'completed' : ''}`}>
                <div className="step-icon">📝</div>
                <div className="step-content">
                  <h4>Pedido Recibido</h4>
                  <p>{formatearFecha(pedido.fechaPedido)}</p>
                </div>
              </div>

              <div className={`progress-step ${pedido.estado === 'en-proceso' ? 'current' : ['listo-entrega', 'entregado'].includes(pedido.estado) ? 'completed' : ''}`}>
                <div className="step-icon">⏳</div>
                <div className="step-content">
                  <h4>En Proceso</h4>
                  <p>Preparando tu pedido</p>
                </div>
              </div>

              <div className={`progress-step ${pedido.estado === 'listo-entrega' ? 'current' : pedido.estado === 'entregado' ? 'completed' : ''}`}>
                <div className="step-icon">✅</div>
                <div className="step-content">
                  <h4>Listo para Entrega</h4>
                  <p>Puedes venir a recogerlo</p>
                </div>
              </div>

              <div className={`progress-step ${pedido.estado === 'entregado' ? 'completed current' : ''}`}>
                <div className="step-icon">📦</div>
                <div className="step-content">
                  <h4>Entregado</h4>
                  <p>Pedido completado</p>
                </div>
              </div>

              {pedido.estado === 'cancelado' && (
                <div className="progress-step cancelled">
                  <div className="step-icon">❌</div>
                  <div className="step-content">
                    <h4>Cancelado</h4>
                    <p>{formatearFecha(pedido.fechaEstadoActual)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones disponibles */}
          <div className="actions-card">
            {puedeSerCancelado(pedido.estado) && (
              <button 
                className="btn-cancelar"
                onClick={() => setMostrarCancelacion(true)}
              >
                ❌ Cancelar Pedido
              </button>
            )}
            <button 
              className="btn-nuevo-pedido"
              onClick={() => window.location.href = '/catalogo'}
            >
              🛍️ Hacer Nuevo Pedido
            </button>
          </div>
        </div>
      )}

      {/* Modal de cancelación */}
      {mostrarCancelacion && (
        <div className="modal-overlay">
          <div className="modal-cancelacion">
            <div className="modal-header">
              <h3>❌ Cancelar Pedido</h3>
              <button 
                className="btn-close"
                onClick={() => setMostrarCancelacion(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p><strong>¿Estás seguro de que deseas cancelar este pedido?</strong></p>
              <p>Pedido: {pedido.numero} por Q{pedido.total.toFixed(2)}</p>
              
              <div className="form-group">
                <label>Motivo de la cancelación:</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Por favor indica por qué deseas cancelar el pedido..."
                  rows="3"
                />
              </div>
              
              <div className="advertencia">
                <p>⚠️ <strong>Nota:</strong> Una vez cancelado, no podrás reactivar este pedido.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarCancelacion(false)}
              >
                No Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={cancelarPedido}
              >
                Sí, Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tracking-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
          font-family: Arial, sans-serif;
        }

        .tracking-header {
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }

        .tracking-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .search-section {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .search-form {
          width: 100%;
          max-width: 400px;
        }

        .input-group {
          display: flex;
          gap: 1rem;
        }

        .codigo-input {
          flex: 1;
          padding: 1rem;
          font-size: 1.2rem;
          border: none;
          border-radius: 10px;
          text-align: center;
          letter-spacing: 2px;
        }

        .btn-buscar {
          background: #27ae60;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
        }

        .btn-buscar:hover {
          background: #229954;
        }

        .btn-buscar:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .error-message {
          text-align: center;
          color: #e74c3c;
          background: rgba(231, 76, 60, 0.1);
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          border: 1px solid #e74c3c;
        }

        .pedido-details {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .estado-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .estado-header {
          padding: 2rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .estado-icon {
          font-size: 3rem;
        }

        .estado-info h2 {
          margin: 0;
          font-size: 2rem;
        }

        .estado-info p {
          margin: 0.5rem 0 0 0;
          opacity: 0.9;
        }

        .estado-fecha {
          padding: 1rem 2rem;
          background: rgba(0,0,0,0.1);
          text-align: center;
          color: white;
          font-size: 0.9rem;
        }

        .info-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .info-card h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          padding: 0.5rem;
        }

        .info-item strong {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .item-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .item-imagen {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
        }

        .item-imagen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-info {
          flex: 1;
        }

        .item-info h4 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .item-info p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .item-total {
          font-size: 1.1rem;
          color: #27ae60;
          font-weight: bold;
        }

        .total-pedido {
          text-align: right;
          padding-top: 1rem;
          border-top: 2px solid #ecf0f1;
          color: #27ae60;
        }

        .nota-section {
          margin-bottom: 1rem;
        }

        .nota-section h4 {
          color: #7f8c8d;
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .nota-section p {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin: 0;
          border-left: 4px solid #3498db;
        }

        .progress-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
          opacity: 0.5;
        }

        .progress-step.completed {
          opacity: 1;
        }

        .progress-step.current {
          opacity: 1;
          background: rgba(52, 152, 219, 0.1);
          padding: 1rem;
          border-radius: 10px;
          border-left: 4px solid #3498db;
        }

        .progress-step.cancelled {
          opacity: 1;
          background: rgba(231, 76, 60, 0.1);
          padding: 1rem;
          border-radius: 10px;
          border-left: 4px solid #e74c3c;
        }

        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ecf0f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .progress-step.completed .step-icon,
        .progress-step.current .step-icon {
          background: #3498db;
          color: white;
        }

        .progress-step.cancelled .step-icon {
          background: #e74c3c;
          color: white;
        }

        .step-content h4 {
          margin: 0 0 0.3rem 0;
          color: #2c3e50;
        }

        .step-content p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .actions-card {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-cancelar, .btn-nuevo-pedido {
          padding: 1rem 2rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .btn-cancelar {
          background: #e74c3c;
          color: white;
        }

        .btn-cancelar:hover {
          background: #c0392b;
        }

        .btn-nuevo-pedido {
          background: #3498db;
          color: white;
        }

        .btn-nuevo-pedido:hover {
          background: #2980b9;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-cancelacion {
          background: white;
          border-radius: 15px;
          width: 100%;
          max-width: 500px;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #ecf0f1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #7f8c8d;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin: 1rem 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #2c3e50;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid #ecf0f1;
          border-radius: 8px;
          font-family: inherit;
          resize: vertical;
        }

        .advertencia {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #ecf0f1;
          display: flex;
          gap: 1rem;
          justify-content: end;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
        }

        @media (max-width: 768px) {
          .tracking-header h1 {
            font-size: 2rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .item-row {
            flex-direction: column;
            text-align: center;
          }
          
          .actions-card {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTracking;