// Al inicio de tu ClientCatalog.js, agrega esta línea:

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmailVerification from '../components/EmailVerification';
import PasswordRecovery from '../components/PasswordRecovery';
import './ClientCatalog.css'; // 👈 AGREGA ESTA LÍNEA

const ClientCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [procesandoPedido, setProcesandoPedido] = useState(false);

  // Estados para el formulario de pedido
  const [clienteData, setClienteData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    notas: ''
  });

  // Estados para errores y mensajes
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { user, login, logout } = useAuth();

  // Estados para modales
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registroData, setRegistroData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: ''
  });

  // Estados para verificación y recuperación
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [emailPendiente, setEmailPendiente] = useState('');

  useEffect(() => {
    fetchProductos();
    // Cargar carrito del localStorage (específico por usuario o general)
    const carritoKey = user ? `carrito_${user._id}` : 'carrito_guest';
    const carritoGuardado = localStorage.getItem(carritoKey);
    if (carritoGuardado) {
      setCarrito(JSON.parse(carritoGuardado));
    }
  }, [categoria, user]);

  // Guardar carrito en localStorage cuando cambie (específico por usuario)
  useEffect(() => {
    const carritoKey = user ? `carrito_${user._id}` : 'carrito_guest';
    localStorage.setItem(carritoKey, JSON.stringify(carrito));
  }, [carrito, user]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || mensaje) {
      const timer = setTimeout(() => {
        setError('');
        setMensaje('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, mensaje]);

  // Prellenar datos del cliente si está logueado
  useEffect(() => {
    if (user && user.rol === 'cliente') {
      setClienteData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        email: user.email || '',
        notas: ''
      });
    }
  }, [user]);

  const fetchProductos = async () => {
    try {
      const response = await axios.get('/api/catalog');
      let productosData = response.data.productos || [];

      if (categoria !== 'todos') {
        productosData = productosData.filter(producto => producto.categoria === categoria);
      }

      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item._id === producto._id);

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        setError(`Stock máximo disponible para ${producto.nombre}: ${producto.stock} unidades`);
        return;
      }
      setCarrito(prev => prev.map(item =>
        item._id === producto._id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito(prev => [...prev, { ...producto, cantidad: 1 }]);
    }
    setMensaje(`${producto.nombre} agregado al carrito`);
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    const producto = productos.find(p => p._id === id) || carrito.find(c => c._id === id);
    if (producto && nuevaCantidad > producto.stock) {
      setError(`Stock máximo disponible: ${producto.stock} unidades`);
      return;
    }

    setCarrito(prev => prev.map(item =>
      item._id === id ? { ...item, cantidad: nuevaCantidad } : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item._id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precioVenta * item.cantidad), 0);
  };

  const validarFormulario = () => {
    const errores = [];

    if (!clienteData.nombre.trim()) {
      errores.push('El nombre es obligatorio');
    }

    if (!clienteData.telefono.trim()) {
      errores.push('El teléfono es obligatorio');
    } else {
      const telefonoLimpio = clienteData.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length < 8) {
        errores.push('El teléfono debe tener al menos 8 dígitos');
      }
    }

    if (clienteData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteData.email)) {
      errores.push('El formato del email no es válido');
    }

    return errores;
  };

  const procesarPedido = async (e) => {
    e.preventDefault();
    setError('');

    const erroresValidacion = validarFormulario();
    if (erroresValidacion.length > 0) {
      setError(`Por favor corrige los siguientes errores:\n• ${erroresValidacion.join('\n• ')}`);
      return;
    }

    if (carrito.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setProcesandoPedido(true);

    try {
      const telefonoLimpio = clienteData.telefono.replace(/\D/g, '');

      const pedidoData = {
        cliente: {
          nombre: clienteData.nombre.trim(),
          telefono: telefonoLimpio,
          email: clienteData.email.trim() || undefined
        },
        items: carrito.map(item => ({
          producto: item._id,
          cantidad: item.cantidad
        })),
        notasCliente: clienteData.notas.trim() || undefined
      };

      const response = await axios.post('/api/pedidos', pedidoData);

      if (response.data.success) {
        setPedidoCreado(response.data.pedido);
        setCarrito([]);
        setMostrarCheckout(false);
        setClienteData({ nombre: '', telefono: '', email: '', notas: '' });
        const carritoKey = user ? `carrito_${user._id}` : 'carrito_guest';
        localStorage.removeItem(carritoKey);
        setMensaje('¡Pedido creado exitosamente!');
      }

    } catch (error) {
      console.error('Error al procesar pedido:', error);

      if (error.response?.data?.details) {
        const detalles = error.response.data.details.map(d => d.msg).join('\n• ');
        setError(`Errores de validación:\n• ${detalles}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Error al procesar el pedido. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setProcesandoPedido(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria = categoria === 'todos' || producto.categoria === categoria;
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda && producto.stock > 0;
  });

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

  // ========== FUNCIONES DE AUTENTICACIÓN ==========

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      setMostrarLogin(false);
      setLoginData({ email: '', password: '' });
      setMensaje('¡Bienvenido de vuelta!');
    } else {
      setError(result.error);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/auth/registro-cliente', {
        nombre: registroData.nombre,
        email: registroData.email,
        password: registroData.password,
        telefono: registroData.telefono,
        rol: 'cliente'
      });

      if (response.data.success || response.data.token) {
        setMostrarRegistro(false);
        setEmailPendiente(registroData.email);
        setMostrarVerificacion(true);
        setRegistroData({ nombre: '', email: '', password: '', telefono: '' });
        setMensaje('¡Cuenta creada! Verifica tu email para continuar.');
      }

    } catch (error) {
      if (error.response?.data?.details) {
        const detalles = error.response.data.details.map(d => d.msg).join('\n• ');
        setError(`Errores de validación:\n• ${detalles}`);
      } else {
        setError(error.response?.data?.message || 'Error al crear cuenta');
      }
    }
  };

  const handleEmailVerificado = () => {
    setMostrarVerificacion(false);
    setMensaje('¡Email verificado! Ahora puedes iniciar sesión.');
    setMostrarLogin(true);
  };

  const handleLogout = () => {
    logout();
    setCarrito([]);
    setClienteData({ nombre: '', telefono: '', email: '', notas: '' });
    setMensaje('Sesión cerrada');
  };

  // ========== RENDER ==========

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
              <h3>📋 Instrucciones:</h3>
              <ul>
                <li>Guarda tu código de seguimiento: <strong>{pedidoCreado.codigoSeguimiento}</strong></li>
                <li>Recibirás una confirmación cuando tu pedido esté listo</li>
                <li>Puedes consultar el estado de tu pedido en cualquier momento</li>
                <li>El pago se realiza al momento de recoger tu pedido</li>
              </ul>
            </div>
            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setPedidoCreado(null);
                  window.location.reload();
                }}
              >
                Hacer Otro Pedido
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.open('/seguimiento', '_blank')}
              >
                Seguir Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="client-container">
        <div className="loading">
          <h3>Cargando productos...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="client-container">
      {/* Header */}
      <header className="client-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🎈 Globos y Fiesta</h1>
            <p>Todo para hacer tu celebración especial</p>
          </div>

          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <span>Hola, {user.nombre}!</span>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button
                  onClick={() => setMostrarLogin(true)}
                  className="btn btn-outline"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setMostrarRegistro(true)}
                  className="btn btn-primary"
                >
                  Registrarse
                </button>
              </div>
            )}

            <button
              onClick={() => setMostrarCarrito(true)}
              className="btn btn-cart"
            >
              🛒 Carrito ({carrito.reduce((total, item) => total + item.cantidad, 0)})
            </button>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-error">
          {error.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {['todos', 'globos', 'decoraciones', 'articulos-fiesta', 'servicios', 'otros'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`filter-btn ${categoria === cat ? 'active' : ''}`}
            >
              {getCategoriaIcon(cat)} {cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div className="productos-grid">
        {productosFiltrados.length === 0 ? (
          <div className="no-productos">
            <h3>No se encontraron productos</h3>
            <p>Intenta cambiar los filtros o la búsqueda.</p>
          </div>
        ) : (
          productosFiltrados.map(producto => (
            <div key={producto._id} className="producto-card">
              <img
                src={producto.imagenUrl || '/NoImagen.jpg'}
                alt={producto.nombre}
                className="producto-imagen"
                onError={(e) => {
                  e.target.src = '/NoImagen.jpg';
                }}
              />
              <div className="producto-info">
                <h3>{producto.nombre}</h3>
                <p className="producto-descripcion">{producto.descripcion}</p>
                <div className="producto-details">
                  <span className="precio">Q{producto.precioVenta?.toFixed(2)}</span>
                  <span className="stock">Stock: {producto.stock}</span>
                </div>
                <button
                  onClick={() => agregarAlCarrito(producto)}
                  className="btn btn-primary"
                  disabled={producto.stock === 0}
                >
                  {producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Carrito */}
      {mostrarCarrito && (
        <div className="modal-overlay">
          <div className="modal-carrito">
            <div className="modal-header">
              <h3>🛒 Tu Carrito</h3>
              <button className="btn-close" onClick={() => setMostrarCarrito(false)}>×</button>
            </div>

            <div className="modal-body">
              {carrito.length === 0 ? (
                <p>Tu carrito está vacío</p>
              ) : (
                <>
                  {carrito.map(item => (
                    <div key={item._id} className="carrito-item">
                      <div className="item-info">
                        <h4>{item.nombre}</h4>
                        <p>Q{item.precioVenta?.toFixed(2)} c/u</p>
                      </div>
                      <div className="item-controls">
                        <button
                          onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}
                          className="btn btn-sm"
                        >
                          -
                        </button>
                        <span className="cantidad">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}
                          className="btn btn-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => eliminarDelCarrito(item._id)}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="item-total">
                        Q{(item.precioVenta * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  <div className="carrito-total">
                    <h3>Total: Q{calcularTotal().toFixed(2)}</h3>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setMostrarCarrito(false)}
                className="btn btn-secondary"
              >
                Seguir Comprando
              </button>
              {carrito.length > 0 && (
                <button
                  onClick={() => {
                    setMostrarCarrito(false);
                    setMostrarCheckout(true);
                  }}
                  className="btn btn-primary"
                >
                  Proceder al Checkout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      {mostrarCheckout && (
        <div className="modal-overlay">
          <div className="modal-checkout">
            <div className="modal-header">
              <h3>📝 Finalizar Pedido</h3>
              <button className="btn-close" onClick={() => setMostrarCheckout(false)}>×</button>
            </div>

            <form onSubmit={procesarPedido}>
              <div className="modal-body">
                <div className="checkout-section">
                  <h4>Resumen del Pedido</h4>
                  {carrito.map(item => (
                    <div key={item._id} className="checkout-item">
                      <span>{item.nombre} x{item.cantidad}</span>
                      <span>Q{(item.precioVenta * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="checkout-total">
                    <strong>Total: Q{calcularTotal().toFixed(2)}</strong>
                  </div>
                </div>

                <div className="checkout-section">
                  <h4>Información del Cliente</h4>
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      value={clienteData.nombre}
                      onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                      placeholder="Tu nombre completo"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      value={clienteData.telefono}
                      onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })}
                      placeholder="12345678"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email (opcional)</label>
                    <input
                      type="email"
                      value={clienteData.email}
                      onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
                      placeholder="tu@email.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notas del Pedido (opcional)</label>
                    <textarea
                      value={clienteData.notas}
                      onChange={(e) => setClienteData({ ...clienteData, notas: e.target.value })}
                      placeholder="Instrucciones especiales, colores preferidos, etc."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setMostrarCheckout(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={procesandoPedido}
                >
                  {procesandoPedido ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Login */}
      {mostrarLogin && (
        <div className="modal-overlay">
          <div className="modal-auth">
            <div className="modal-header">
              <h3>🔐 Iniciar Sesión</h3>
              <button className="btn-close" onClick={() => setMostrarLogin(false)}>×</button>
            </div>

            <div className="modal-body">
              {error && (
                <div style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña:</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Tu contraseña"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setMostrarLogin(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Ingresar
                  </button>
                </div>
              </form>

              {/* Botón para recuperar contraseña */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarLogin(false);
                    setMostrarRecuperacion(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <span>¿No tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarLogin(false);
                    setMostrarRegistro(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {mostrarRegistro && (
        <div className="modal-overlay">
          <div className="modal-auth">
            <div className="modal-header">
              <h3>📝 Crear Cuenta</h3>
              <button className="btn-close" onClick={() => setMostrarRegistro(false)}>×</button>
            </div>

            <div className="modal-body">
              {error && (
                <div style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegistro}>
                <div className="form-group">
                  <label>Nombre Completo:</label>
                  <input
                    type="text"
                    value={registroData.nombre}
                    onChange={(e) => setRegistroData({ ...registroData, nombre: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={registroData.email}
                    onChange={(e) => setRegistroData({ ...registroData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña:</label>
                  <input
                    type="password"
                    value={registroData.password}
                    onChange={(e) => setRegistroData({ ...registroData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="tel"
                    value={registroData.telefono}
                    onChange={(e) => setRegistroData({ ...registroData, telefono: e.target.value })}
                    placeholder="12345678"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setMostrarRegistro(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crear Cuenta
                  </button>
                </div>
              </form>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <span>¿Ya tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRegistro(false);
                    setMostrarLogin(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Verificación de Email */}
      {mostrarVerificacion && (
        <EmailVerification
          email={emailPendiente}
          onVerified={handleEmailVerificado}
          onClose={() => {
            setMostrarVerificacion(false);
            setEmailPendiente('');
          }}
        />
      )}

      {/* Modal de Recuperación de Contraseña */}
      {mostrarRecuperacion && (
        <PasswordRecovery
          onClose={() => {
            setMostrarRecuperacion(false);
            setMostrarLogin(true); // Volver al login después de cerrar
          }}
        />
      )}
    </div>
  );
};



export default ClientCatalog;