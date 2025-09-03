import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  // Estados para el formulario de pedido
  const [clienteData, setClienteData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    notas: ''
  });

  useEffect(() => {
    fetchProductos();
    // Cargar carrito del localStorage
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      setCarrito(JSON.parse(carritoGuardado));
    }
  }, [categoria]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams();
      params.append('activo', 'true');
      if (categoria !== 'todos') params.append('categoria', categoria);
      
      const response = await axios.get(`/api/productos?${params}`);
      setProductos(response.data.productos || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item._id === producto._id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        alert(`Stock máximo disponible: ${producto.stock}`);
        return;
      }
      setCarrito(prev => prev.map(item =>
        item._id === producto._id
          ? { ...item, cantidad: item.cantidad + 1 }
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
            subtotal: item.precioVenta * nuevaCantidad
          }
        : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item._id !== id));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem('carrito');
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const pedidoData = {
        cliente: {
          nombre: clienteData.nombre,
          telefono: clienteData.telefono,
          email: clienteData.email
        },
        items: carrito.map(item => ({
          producto: item._id,
          cantidad: item.cantidad
        })),
        notasCliente: clienteData.notas
      };

      const response = await axios.post('/api/pedidos', pedidoData);
      
      if (response.data.success) {
        setPedidoCreado(response.data.pedido);
        limpiarCarrito();
        setMostrarCheckout(false);
        setClienteData({
          nombre: '',
          telefono: '',
          email: '',
          notas: ''
        });
      }

    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert(error.response?.data?.message || 'Error al crear el pedido');
    }
  };

  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getCategoriaIcon = (categoria) => {
    const icons = {
      'globos': '🎈',
      'decoraciones': '🎊',
      'articulos-fiesta': '🎉',
      'servicios': '🛠️',
      'otros': '📦'
    };
    return icons[categoria] || '📦';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'en-proceso': '#f39c12',
      'cancelado': '#e74c3c',
      'listo-entrega': '#27ae60',
      'entregado': '#95a5a6'
    };
    return colors[estado] || '#bdc3c7';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'en-proceso': 'En Proceso',
      'cancelado': 'Cancelado',
      'listo-entrega': 'Listo para Entrega',
      'entregado': 'Entregado'
    };
    return textos[estado] || estado;
  };

  if (pedidoCreado) {
    return (
      <div className="client-container">
        <div className="success-message">
          <div className="success-card">
            <h2>🎉 ¡Pedido Creado Exitosamente!</h2>
            <div className="pedido-info">
              <p><strong>Número de Pedido:</strong> {pedidoCreado.numero}</p>
              <p><strong>Código de Seguimiento:</strong> 
                <span className="codigo-seguimiento">{pedidoCreado.codigoSeguimiento}</span>
              </p>
              <p><strong>Total:</strong> Q{pedidoCreado.total.toFixed(2)}</p>
              <p><strong>Estado:</strong> {getEstadoTexto(pedidoCreado.estado)}</p>
            </div>
            <div className="instrucciones">
              <h3>📝 Instrucciones:</h3>
              <ul>
                <li>Guarda tu código de seguimiento: <strong>{pedidoCreado.codigoSeguimiento}</strong></li>
                <li>Recibirás una confirmación cuando tu pedido esté listo</li>
                <li>Puedes consultar el estado de tu pedido en cualquier momento</li>
                <li>El pago se realiza al momento de recoger tu pedido</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setPedidoCreado(null)}
              >
                Hacer Otro Pedido
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => window.location.href = '/seguimiento'}
              >
                Rastrear Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-container">
      {/* Header */}
      <header className="client-header">
        <div className="header-content">
          <h1>🎈 Globos y Fiesta</h1>
          <p>Catálogo de Productos</p>
          <div className="header-actions">
            <button
              className="btn-carrito"
              onClick={() => setMostrarCarrito(true)}
            >
              🛒 Carrito ({carrito.length})
            </button>
            <button
              className="btn-seguimiento"
              onClick={() => window.location.href = '/seguimiento'}
            >
              📦 Rastrear Pedido
            </button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-content">
          <div className="busqueda">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
          </div>
          <div className="categorias">
            {['todos', 'globos', 'decoraciones', 'articulos-fiesta', 'servicios', 'otros'].map(cat => (
              <button
                key={cat}
                className={`btn-categoria ${categoria === cat ? 'active' : ''}`}
                onClick={() => setCategoria(cat)}
              >
                {cat === 'todos' ? '🏪 Todos' : `${getCategoriaIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos */}
      <main className="productos-container">
        {loading ? (
          <div className="loading">
            <p>Cargando productos...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="no-productos">
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="productos-grid">
            {productosFiltrados.map(producto => (
              <div key={producto._id} className="producto-card">
                {producto.imagenUrl && (
                  <div className="producto-imagen">
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  </div>
                )}
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="descripcion">{producto.descripcion}</p>
                  )}
                  <div className="producto-detalles">
                    <span className="categoria">
                      {getCategoriaIcon(producto.categoria)} {producto.categoria}
                    </span>
                    {producto.color && (
                      <span className="color">Color: {producto.color}</span>
                    )}
                    {producto.tamaño && (
                      <span className="tamaño">Tamaño: {producto.tamaño}</span>
                    )}
                  </div>
                  <div className="producto-footer">
                    <div className="precio-stock">
                      <span className="precio">Q{producto.precioVenta.toFixed(2)}</span>
                      <span className="stock">Stock: {producto.stock}</span>
                    </div>
                    <button
                      className="btn-agregar"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={producto.stock === 0}
                    >
                      {producto.stock === 0 ? 'Sin Stock' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal del Carrito */}
      {mostrarCarrito && (
        <div className="modal-overlay">
          <div className="modal-carrito">
            <div className="modal-header">
              <h2>🛒 Tu Carrito</h2>
              <button 
                className="btn-close"
                onClick={() => setMostrarCarrito(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {carrito.length === 0 ? (
                <p className="carrito-vacio">Tu carrito está vacío</p>
              ) : (
                <>
                  <div className="carrito-items">
                    {carrito.map(item => (
                      <div key={item._id} className="carrito-item">
                        <div className="item-info">
                          {item.imagenUrl && (
                            <img src={item.imagenUrl} alt={item.nombre} className="item-imagen" />
                          )}
                          <div>
                            <h4>{item.nombre}</h4>
                            <p>Q{item.precioVenta.toFixed(2)} c/u</p>
                          </div>
                        </div>
                        <div className="item-cantidad">
                          <button
                            onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="item-subtotal">
                          <span>Q{item.subtotal.toFixed(2)}</span>
                          <button
                            className="btn-eliminar"
                            onClick={() => eliminarDelCarrito(item._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="carrito-total">
                    <h3>Total: Q{calcularTotal().toFixed(2)}</h3>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {carrito.length > 0 && (
                <>
                  <button 
                    className="btn btn-danger"
                    onClick={limpiarCarrito}
                  >
                    Limpiar Carrito
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setMostrarCarrito(false);
                      setMostrarCheckout(true);
                    }}
                  >
                    Proceder al Pedido
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal del Checkout */}
      {mostrarCheckout && (
        <div className="modal-overlay">
          <div className="modal-checkout">
            <div className="modal-header">
              <h2>📝 Finalizar Pedido</h2>
              <button 
                className="btn-close"
                onClick={() => setMostrarCheckout(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPedido}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={clienteData.nombre}
                    onChange={(e) => setClienteData(prev => ({...prev, nombre: e.target.value}))}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={clienteData.telefono}
                    onChange={(e) => setClienteData(prev => ({...prev, telefono: e.target.value}))}
                    placeholder="50212345678"
                  />
                </div>

                <div className="form-group">
                  <label>Email (opcional)</label>
                  <input
                    type="email"
                    value={clienteData.email}
                    onChange={(e) => setClienteData(prev => ({...prev, email: e.target.value}))}
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>Notas del Pedido (opcional)</label>
                  <textarea
                    value={clienteData.notas}
                    onChange={(e) => setClienteData(prev => ({...prev, notas: e.target.value}))}
                    placeholder="Instrucciones especiales, colores preferidos, etc."
                    rows="3"
                  />
                </div>

                <div className="resumen-pedido">
                  <h3>Resumen del Pedido</h3>
                  {carrito.map(item => (
                    <div key={item._id} className="resumen-item">
                      <span>{item.nombre} x{item.cantidad}</span>
                      <span>Q{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="resumen-total">
                    <strong>Total: Q{calcularTotal().toFixed(2)}</strong>
                  </div>
                </div>

                <div className="nota-pago">
                  <p><strong>📌 Nota:</strong> El pago se realiza cuando recojas tu pedido en la tienda.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarCheckout(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .client-container {
          font-family: Arial, sans-serif;
        }

        .client-header {
          background: linear-gradient(135deg, #3498db, #e74c3c);
          color: white;
          padding: 2rem 1rem;
          text-align: center;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
        }

        .header-content p {
          margin: 0 0 1rem 0;
          opacity: 0.9;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-carrito, .btn-seguimiento {
          padding: 0.7rem 1.5rem;
          border: 2px solid white;
          background: transparent;
          color: white;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .btn-carrito:hover, .btn-seguimiento:hover {
          background: white;
          color: #3498db;
        }

        .filtros-container {
          background: white;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          sticky: 0;
          top: 0;
          z-index: 100;
        }

        .filtros-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .input-busqueda {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid #ddd;
          border-radius: 25px;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .categorias {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-categoria {
          padding: 0.5rem 1rem;
          border: 2px solid #ddd;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-categoria.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .productos-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .productos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .producto-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }

        .producto-card:hover {
          transform: translateY(-5px);
        }

        .producto-imagen {
          height: 200px;
          overflow: hidden;
        }

        .producto-imagen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .producto-info {
          padding: 1rem;
        }

        .producto-info h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .descripcion {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .producto-detalles {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .categoria, .color, .tamaño {
          background: #ecf0f1;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .producto-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .precio-stock {
          display: flex;
          flex-direction: column;
        }

        .precio {
          font-weight: bold;
          color: #27ae60;
          font-size: 1.2rem;
        }

        .stock {
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .btn-agregar {
          background: #27ae60;
          color: white;
          border: none;
          padding: 0.7rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .btn-agregar:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
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

        .modal-carrito, .modal-checkout {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-body {
          padding: 1rem;
        }

        .carrito-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .item-imagen {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
        }

        .item-cantidad {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-cantidad button {
          background: #3498db;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
        }

        .item-subtotal {
          display: flex;
          flex-direction: column;
          align-items: end;
          gap: 0.5rem;
        }

        .btn-eliminar {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .carrito-total {
          text-align: right;
          padding-top: 1rem;
          border-top: 2px solid #eee;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          padding: 0.7rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .resumen-pedido {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .resumen-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .resumen-total {
          border-top: 2px solid #dee2e6;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
        }

        .nota-pago {
          background: #e3f2fd;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .modal-footer {
          padding: 1rem;
          border-top: 1px solid #eee;
          display: flex;
          gap: 1rem;
          justify-content: end;
        }

        .btn {
          padding: 0.7rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
        }

        .success-message {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #74b9ff, #00b894);
        }

        .success-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          max-width: 500px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .pedido-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          text-align: left;
        }

        .codigo-seguimiento {
          background: #3498db;
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-weight: bold;
          margin-left: 0.5rem;
        }

        .instrucciones {
          text-align: left;
          margin: 1.5rem 0;
        }

        .instrucciones ul {
          padding-left: 1.2rem;
        }

        .instrucciones li {
          margin-bottom: 0.5rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .loading, .no-productos {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
        }

        .carrito-vacio {
          text-align: center;
          padding: 2rem;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 2rem;
          }
          
          .productos-grid {
            grid-template-columns: 1fr;
          }
          
          .carrito-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientCatalog;