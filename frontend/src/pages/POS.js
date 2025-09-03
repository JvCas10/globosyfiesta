import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    fetchProductos();
  }, [categoriaFiltro]);

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams();
      params.append('activo', 'true');
      if (categoriaFiltro !== 'todos') params.append('categoria', categoriaFiltro);
      
      const response = await axios.get(`/api/productos?${params}`);
      setProductos(response.data.productos || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const agregarProducto = (producto) => {
    if (producto.stock <= 0) {
      alert('Producto sin stock');
      return;
    }

    const itemExistente = carrito.find(item => item._id === producto._id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        alert(`Stock máximo disponible: ${producto.stock}`);
        return;
      }
      setCarrito(prev => prev.map(item =>
        item._id === producto._id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioVenta }
          : item
      ));
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
      alert(`Stock máximo disponible: ${producto.stock}`);
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
    setCarrito(prev => prev.filter(item => item._id !== id));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setCliente({ nombre: '', telefono: '' });
    setDescuento(0);
    setMetodoPago('efectivo');
  };

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() - descuento;
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!cliente.nombre.trim() || !cliente.telefono.trim()) {
      alert('Ingrese los datos del cliente');
      return;
    }

    const total = calcularTotal();
    if (total <= 0) {
      alert('El total debe ser mayor a 0');
      return;
    }

    setLoading(true);

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
      alert(error.response?.data?.message || 'Error al procesar la venta');
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
  };

  const productosVisibes = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    producto.descripcion?.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  if (!hasPermission('ventas')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">🏪 Sistema POS</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para usar el sistema POS.
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      {ventaCompletada && (
        <div className="modal-overlay">
          <div className="modal-venta-completada">
            <div className="success-header">
              <h2>🎉 ¡Venta Completada!</h2>
            </div>
            <div className="venta-detalles">
              <div className="detalle-item">
                <strong>Ticket:</strong> {ventaCompletada.numero}
              </div>
              <div className="detalle-item">
                <strong>Cliente:</strong> {ventaCompletada.cliente}
              </div>
              <div className="detalle-item">
                <strong>Total:</strong> Q{ventaCompletada.total.toFixed(2)}
              </div>
              <div className="detalle-item">
                <strong>Método de Pago:</strong> {ventaCompletada.metodoPago}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={imprimirTicket}>
                🖨️ Imprimir Ticket
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setVentaCompletada(null)}
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-layout">
        {/* Panel de productos */}
        <div className="productos-panel">
          <div className="panel-header">
            <h2>🛍️ Productos</h2>
          </div>

          {/* Filtros de productos */}
          <div className="filtros-productos">
            <div className="busqueda-input">
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
              />
            </div>
            <div className="categoria-filtro">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="todos">📦 Todas</option>
                <option value="globos">🎈 Globos</option>
                <option value="decoraciones">🎊 Decoraciones</option>
                <option value="articulos-fiesta">🎉 Artículos</option>
                <option value="servicios">🛠️ Servicios</option>
                <option value="otros">📋 Otros</option>
              </select>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="productos-grid">
            {productosVisibes.map(producto => (
              <div 
                key={producto._id} 
                className={`producto-card ${producto.stock <= 0 ? 'sin-stock' : ''}`}
                onClick={() => agregarProducto(producto)}
              >
                {producto.imagenUrl && (
                  <div className="producto-imagen">
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  </div>
                )}
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  <div className="precio-stock">
                    <span className="precio">Q{producto.precioVenta.toFixed(2)}</span>
                    <span className={`stock ${producto.stock <= producto.stockMinimo ? 'bajo' : ''}`}>
                      Stock: {producto.stock}
                    </span>
                  </div>
                  {producto.color && (
                    <div className="producto-detalle">
                      Color: {producto.color}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de carrito */}
        <div className="carrito-panel">
          <div className="panel-header">
            <h2>🛒 Carrito de Venta</h2>
            {carrito.length > 0 && (
              <button className="btn-limpiar" onClick={limpiarCarrito}>
                🗑️ Limpiar
              </button>
            )}
          </div>

          {/* Datos del cliente */}
          <div className="cliente-form">
            <h3>👤 Datos del Cliente</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre del cliente *"
                value={cliente.nombre}
                onChange={(e) => setCliente(prev => ({...prev, nombre: e.target.value}))}
              />
              <input
                type="tel"
                placeholder="Teléfono *"
                value={cliente.telefono}
                onChange={(e) => setCliente(prev => ({...prev, telefono: e.target.value}))}
              />
            </div>
          </div>

          {/* Items del carrito */}
          <div className="carrito-items">
            {carrito.length === 0 ? (
              <div className="carrito-vacio">
                <p>El carrito está vacío</p>
                <p>Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item._id} className="carrito-item">
                  <div className="item-info">
                    <h4>{item.nombre}</h4>
                    <p>Q{item.precioVenta.toFixed(2)} c/u</p>
                  </div>
                  <div className="item-controles">
                    <div className="cantidad-controles">
                      <button onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}>
                        -
                      </button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}>
                        +
                      </button>
                    </div>
                    <div className="item-subtotal">
                      Q{item.subtotal.toFixed(2)}
                    </div>
                    <button 
                      className="btn-eliminar"
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
            <div className="pago-section">
              <div className="pago-opciones">
                <div className="form-group">
                  <label>💳 Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="mixto">🔄 Mixto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>🏷️ Descuento (Q)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="totales">
                <div className="subtotal">
                  Subtotal: Q{calcularSubtotal().toFixed(2)}
                </div>
                {descuento > 0 && (
                  <div className="descuento">
                    Descuento: -Q{descuento.toFixed(2)}
                  </div>
                )}
                <div className="total">
                  TOTAL: Q{calcularTotal().toFixed(2)}
                </div>
              </div>

              <button 
                className="btn-procesar"
                onClick={procesarVenta}
                disabled={loading || calcularTotal() <= 0}
              >
                {loading ? '⏳ Procesando...' : '💰 Procesar Venta'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pos-container {
          height: 100vh;
          background: #f5f6fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .pos-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          height: 100vh;
          gap: 0;
        }

        .productos-panel, .carrito-panel {
          background: white;
          display: flex;
          flex-direction: column;
        }

        .carrito-panel {
          border-left: 1px solid #e1e8ed;
        }

        .panel-header {
          padding: 1rem;
          background: #2c3e50;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.2rem;
        }

        .btn-limpiar {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .filtros-productos {
          padding: 1rem;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
          background: #f8f9fa;
        }

        .busqueda-input input, .categoria-filtro select {
          width: 100%;
          padding: 0.7rem;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 1rem;
        }

        .productos-grid {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .producto-card {
          background: white;
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .producto-card:hover {
          border-color: #3498db;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
        }

        .producto-card.sin-stock {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .producto-imagen {
          height: 100px;
          overflow: hidden;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .producto-imagen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .producto-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #2c3e50;
        }

        .precio-stock {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .precio {
          font-weight: bold;
          color: #27ae60;
          font-size: 1.1rem;
        }

        .stock {
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .stock.bajo {
          color: #e74c3c;
          font-weight: bold;
        }

        .producto-detalle {
          font-size: 0.8rem;
          color: #7f8c8d;
          margin-top: 0.5rem;
        }

        .cliente-form {
          padding: 1rem;
          background: #f8f9fa;
        }

        .cliente-form h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #2c3e50;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .form-row input {
          padding: 0.7rem;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .carrito-items {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .carrito-vacio {
          text-align: center;
          color: #7f8c8d;
          padding: 2rem;
        }

        .carrito-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          background: #f8f9fa;
        }

        .item-info h4 {
          margin: 0 0 0.3rem 0;
          font-size: 0.9rem;
          color: #2c3e50;
        }

        .item-info p {
          margin: 0;
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .item-controles {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cantidad-controles {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cantidad-controles button {
          width: 30px;
          height: 30px;
          border: 1px solid #3498db;
          background: white;
          color: #3498db;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cantidad-controles button:hover {
          background: #3498db;
          color: white;
        }

        .item-subtotal {
          font-weight: bold;
          color: #27ae60;
          min-width: 80px;
          text-align: right;
        }

        .btn-eliminar {
          background: #e74c3c;
          color: white;
          border: none;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .pago-section {
          padding: 1rem;
          background: #f8f9fa;
          border-top: 1px solid #e1e8ed;
        }

        .pago-opciones {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: bold;
          color: #2c3e50;
        }

        .form-group select, .form-group input {
          width: 100%;
          padding: 0.6rem;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .totales {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .subtotal, .descuento {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          color: #7f8c8d;
        }

        .total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 1.3rem;
          color: #2c3e50;
          padding-top: 0.5rem;
          border-top: 2px solid #e1e8ed;
        }

        .descuento {
          color: #e74c3c;
        }

        .btn-procesar {
          width: 100%;
          padding: 1rem;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }

        .btn-procesar:hover {
          background: #229954;
        }

        .btn-procesar:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-venta-completada {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          text-align: center;
        }

        .success-header {
          color: #27ae60;
          margin-bottom: 2rem;
        }

        .success-header h2 {
          margin: 0;
          font-size: 2rem;
        }

        .venta-detalles {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          text-align: left;
        }

        .detalle-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e1e8ed;
        }

        .detalle-item:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 1.1rem;
          color: #27ae60;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        @media (max-width: 1200px) {
          .pos-layout {
            grid-template-columns: 1fr 350px;
          }
        }

        @media (max-width: 768px) {
          .pos-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 400px;
          }

          .productos-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default POS;