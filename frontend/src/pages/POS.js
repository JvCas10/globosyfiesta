import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './POS.css';

const POS = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: ''
  });
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  
  const { hasPermission } = useAuth();

  // Estado de paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // useEffect para cargar productos cuando cambian filtros o página
  useEffect(() => {
    fetchProductos();
  }, [categoriaFiltro, pagination.currentPage]);

  // Reiniciar a página 1 cuando cambian los filtros
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [categoriaFiltro, busquedaProducto]);

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams();
      params.append('activo', 'true');
      if (categoriaFiltro !== 'todos') params.append('categoria', categoriaFiltro);
      if (busquedaProducto) params.append('buscar', busquedaProducto);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);
      
      const response = await axios.get(`/api/productos?${params}`);
      setProductos(response.data.productos || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('❌ Error al cargar los productos');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const agregarProducto = (producto) => {
    if (producto.stock <= 0) {
      toast.warning('⚠️ Producto sin stock disponible');
      return;
    }

    const itemExistente = carrito.find(item => item._id === producto._id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.warning(`⚠️ Stock máximo disponible: ${producto.stock}`);
        return;
      }
      setCarrito(prev => prev.map(item =>
        item._id === producto._id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioVenta }
          : item
      ));
      toast.success(`✅ ${producto.nombre} actualizado en el carrito`);
    } else {
      setCarrito(prev => [...prev, {
        ...producto,
        cantidad: 1,
        subtotal: producto.precioVenta
      }]);
    }
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    const producto = productos.find(p => p._id === id);
    if (producto && nuevaCantidad > producto.stock) {
      toast.warning(`⚠️ Stock máximo disponible: ${producto.stock}`);
      return;
    }

    setCarrito(prev => prev.map(item =>
      item._id === id
        ? { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioVenta
          }
        : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    const item = carrito.find(item => item._id === id);
    setCarrito(prev => prev.filter(item => item._id !== id));
  };

  const limpiarCarrito = () => {
    if (carrito.length === 0) {
      toast.info('ℹ️ El carrito ya está vacío');
      return;
    }
    setCarrito([]);
    setCliente({ nombre: '', telefono: '' });
    setDescuento(0);
    setMetodoPago('efectivo');
    toast.success('🧹 Carrito limpiado correctamente');
  };

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() - descuento;
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast.warning('⚠️ El carrito está vacío');
      return;
    }

    if (!cliente.nombre.trim()) {
      toast.warning('⚠️ Ingrese el nombre del cliente');
      return;
    }

    if (!cliente.telefono.trim()) {
      toast.warning('⚠️ Ingrese el teléfono del cliente');
      return;
    }

    const total = calcularTotal();
    if (total <= 0) {
      toast.error('❌ El total debe ser mayor a 0');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('⏳ Procesando venta...');

    try {
      const ventaData = {
        datosCliente: {
          nombre: cliente.nombre.trim(),
          telefono: cliente.telefono.trim()
        },
        items: carrito.map(item => ({
          producto: item._id,
          cantidad: item.cantidad,
          precioUnitario: item.precioVenta
        })),
        metodoPago,
        descuento,
        tipoVenta: 'directa',
        notas: 'Venta realizada en POS'
      };

      const response = await axios.post('/api/ventas', ventaData);
      
      toast.update(toastId, {
        render: '🎉 ¡Venta procesada exitosamente!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });

      setVentaCompletada({
        numero: response.data.venta.numero,
        total: response.data.venta.total,
        metodoPago: response.data.venta.metodoPago,
        items: carrito.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        })),
        cliente: cliente.nombre,
        descuento
      });

      limpiarCarrito();
      
    } catch (error) {
      console.error('Error al procesar venta:', error);
      const errorMessage = error.response?.data?.message || 'Error al procesar la venta';
      
      toast.update(toastId, {
        render: `❌ ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const imprimirTicket = () => {
    const contenido = `
      <div style="width: 300px; font-family: monospace; font-size: 12px; margin: 0 auto;">
        <h2 style="text-align: center; margin: 10px 0;">🎈 GLOBOS Y FIESTA</h2>
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
          <p>Sistema de Gestión</p>
          <p>Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <p><strong>Ticket: ${ventaCompletada.numero}</strong></p>
        </div>
        
        <div style="margin-bottom: 10px;">
          <p><strong>Cliente:</strong> ${ventaCompletada.cliente}</p>
          <p><strong>Método de Pago:</strong> ${ventaCompletada.metodoPago}</p>
        </div>
        
        <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
          ${ventaCompletada.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <div>
                <div>${item.nombre}</div>
                <div>${item.cantidad} x Q${(item.subtotal / item.cantidad).toFixed(2)}</div>
              </div>
              <div>Q${item.subtotal.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        
        <div>
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>Q${(ventaCompletada.total + ventaCompletada.descuento).toFixed(2)}</span>
          </div>
          ${ventaCompletada.descuento > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Descuento:</span>
              <span>-Q${ventaCompletada.descuento.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>Q${ventaCompletada.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 10px;">
          <p>¡Gracias por su compra!</p>
          <p>🎈 Hacemos tus fiestas inolvidables 🎉</p>
        </div>
      </div>
    `;

    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Ticket - ${ventaCompletada.numero}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${contenido}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    toast.success('🖨️ Ticket enviado a impresión');
  };

  const cerrarModalVenta = () => {
    setVentaCompletada(null);
  };

  const productosVisibles = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    producto.descripcion?.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  if (!hasPermission('ventas')) {
    return (
      <div className="pos-main-container">
        <div className="pos-alert-error">
          No tienes permisos para usar el sistema POS.
        </div>
      </div>
    );
  }

  return (
    <div className="pos-main-container">
      {/* Modal de venta completada */}
      {ventaCompletada && (
        <div className="pos-modal-overlay" onClick={cerrarModalVenta}>
          <div className="pos-modal-completed" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              🎉 ¡Venta Completada!
              <button className="pos-modal-close" onClick={cerrarModalVenta}>×</button>
            </div>
            
            <div className="pos-modal-body">
              <div className="pos-sale-details">
                <div className="pos-detail-row">
                  <span className="pos-detail-label">Ticket:</span>
                  <span className="pos-detail-value">{ventaCompletada.numero}</span>
                </div>
                <div className="pos-detail-row">
                  <span className="pos-detail-label">Cliente:</span>
                  <span className="pos-detail-value">{ventaCompletada.cliente}</span>
                </div>
                <div className="pos-detail-row">
                  <span className="pos-detail-label">Método de Pago:</span>
                  <span className="pos-detail-value">{ventaCompletada.metodoPago}</span>
                </div>
                {ventaCompletada.descuento > 0 && (
                  <div className="pos-detail-row">
                    <span className="pos-detail-label">Descuento:</span>
                    <span className="pos-detail-value pos-discount-value">
                      -Q{ventaCompletada.descuento.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pos-detail-row pos-detail-total">
                  <span className="pos-detail-label">Total:</span>
                  <span className="pos-detail-value">Q{ventaCompletada.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pos-items-section">
                <h4 className="pos-items-title">📦 Productos Vendidos</h4>
                <div className="pos-items-list">
                  {ventaCompletada.items.map((item, index) => (
                    <div key={index} className="pos-item-row">
                      <div className="pos-item-name">
                        {item.nombre}
                        <span className="pos-item-qty"> x{item.cantidad}</span>
                      </div>
                      <div className="pos-item-price">Q{item.subtotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pos-modal-actions">
                <button className="pos-btn-print" onClick={imprimirTicket}>
                  🖨️ Imprimir Ticket
                </button>
                <button 
                  className="pos-btn-new-sale" 
                  onClick={cerrarModalVenta}
                >
                  ➕ Nueva Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pos-main-layout">
        {/* Panel de productos */}
        <div className="pos-products-panel">
          <div className="pos-panel-header">
            <h2 className="pos-panel-title">🛍️ Productos</h2>
          </div>

          {/* Filtros de productos */}
          <div className="pos-filters-section">
            <input
              type="text"
              className="pos-search-input"
              placeholder="🔍 Buscar producto..."
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
            />
            <select
              className="pos-category-select"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="todos">📦 Todas</option>
              <option value="globos">🎈 Globos</option>
              <option value="decoracion">🎊 Decoración</option>
              <option value="accesorios">🎉 Accesorios</option>
              <option value="servicios">🛠️ Servicios</option>
            </select>
          </div>

          {/* Grid de productos */}
          <div className="pos-products-grid">
            {productosVisibles.map(producto => (
              <div 
                key={producto._id} 
                className={`pos-product-card ${producto.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => agregarProducto(producto)}
              >
                {producto.imagenUrl && (
                  <div className="pos-product-image-container">
                    <img 
                      src={producto.imagenUrl} 
                      alt={producto.nombre} 
                      className="pos-product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect width="60" height="60" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23999"%3E📦%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
                <div className="pos-product-details">
                  <h3>{producto.nombre}</h3>
                  <div className="pos-product-price-stock">
                    <span className="pos-product-price">Q{producto.precioVenta.toFixed(2)}</span>
                    <span className={`pos-product-stock ${producto.stock <= producto.stockMinimo ? 'low' : ''}`}>
                      Stock: {producto.stock}
                    </span>
                  </div>
                  {producto.color && (
                    <div className="pos-product-extra">
                      Color: {producto.color}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          {pagination.totalPages > 1 && (
            <div className="pos-pagination">
              <button
                className="pos-pagination-btn"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
              >
                ⏮️
              </button>
              
              <button
                className="pos-pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                ◀️
              </button>

              <div className="pos-pagination-info">
                <span className="pos-pagination-text">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
              </div>

              <button
                className="pos-pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                ▶️
              </button>

              <button
                className="pos-pagination-btn"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                ⏭️
              </button>
            </div>
          )}
        </div>

        {/* Panel de carrito */}
        <div className="pos-cart-panel">
          <div className="pos-panel-header">
            <h2 className="pos-panel-title">🛒 Carrito de Venta</h2>
            {carrito.length > 0 && (
              <button className="pos-btn-clear" onClick={limpiarCarrito}>
                🗑️ Limpiar
              </button>
            )}
          </div>

          {/* Datos del cliente */}
          <div className="pos-client-section">
            <h3 className="pos-client-title">👤 Datos del Cliente</h3>
            <div className="pos-client-inputs">
              <input
                type="text"
                className="pos-client-input"
                placeholder="Nombre del cliente *"
                value={cliente.nombre}
                onChange={(e) => setCliente(prev => ({...prev, nombre: e.target.value}))}
              />
              <input
                type="tel"
                className="pos-client-input"
                placeholder="Teléfono *"
                value={cliente.telefono}
                onChange={(e) => setCliente(prev => ({...prev, telefono: e.target.value}))}
              />
            </div>
          </div>

          {/* Items del carrito */}
          <div className="pos-cart-items">
            {carrito.length === 0 ? (
              <div className="pos-cart-empty">
                <p>🛒</p>
                <p>El carrito está vacío</p>
                <p>Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item._id} className="pos-cart-item">
                  <div className="pos-item-info">
                    <h4>{item.nombre}</h4>
                    <p>Q{item.precioVenta.toFixed(2)} c/u</p>
                  </div>
                  <div className="pos-item-controls">
                    <div className="pos-quantity-controls">
                      <button 
                        className="pos-quantity-btn"
                        onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}
                      >
                        -
                      </button>
                      <span className="pos-quantity-value">{item.cantidad}</span>
                      <button 
                        className="pos-quantity-btn"
                        onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="pos-item-subtotal">
                      Q{item.subtotal.toFixed(2)}
                    </div>
                    <button 
                      className="pos-btn-remove"
                      onClick={() => eliminarDelCarrito(item._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y pago */}
          {carrito.length > 0 && (
            <div className="pos-payment-section">
              <div className="pos-payment-options">
                <div className="pos-form-group">
                  <label className="pos-form-label">💳 Método de Pago</label>
                  <select
                    className="pos-form-select"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="mixto">🔄 Mixto</option>
                  </select>
                </div>

                <div className="pos-form-group">
                  <label className="pos-form-label">🏷️ Descuento (Q)</label>
                  <input
                    type="number"
                    className="pos-form-input"
                    min="0"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="pos-totals">
                <div className="pos-subtotal">
                  <span>Subtotal:</span>
                  <span>Q{calcularSubtotal().toFixed(2)}</span>
                </div>
                {descuento > 0 && (
                  <div className="pos-discount">
                    <span>Descuento:</span>
                    <span>-Q{descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="pos-total">
                  <span>TOTAL:</span>
                  <span>Q{calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <button 
                className="pos-btn-process"
                onClick={procesarVenta}
                disabled={loading || calcularTotal() <= 0}
              >
                {loading ? '⏳ Procesando...' : '💰 Procesar Venta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;