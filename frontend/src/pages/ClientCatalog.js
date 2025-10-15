// ClientCatalog.js - Completo con paginación integrada

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import EmailVerification from "../components/EmailVerification";
import PasswordRecovery from "../components/PasswordRecovery";
import { toast } from "react-toastify";
import "./ClientCatalog.css";
import { useNavigate } from 'react-router-dom';

const ClientCatalog = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [procesandoPedido, setProcesandoPedido] = useState(false);

  // Estados para el formulario de pedido
  const [clienteData, setClienteData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    notas: "",
  });

  // Estados para errores y mensajes
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const { user, login, logout } = useAuth();

  // Estados para modales
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registroData, setRegistroData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });

  // Estados para verificación y recuperación
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [emailPendiente, setEmailPendiente] = useState("");

  // NUEVO: Estado de paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false
  });
// REDIRECCIÓN AUTOMÁTICA PARA ADMIN/EMPLEADO
useEffect(() => {
  if (user && (user.rol === 'admin' || user.rol === 'empleado')) {
    toast.info('Acceso administrativo detectado. Usa el botón naranja para entrar al panel.', {
      icon: '🧭',
      autoClose: 2500
    });
  }
 
}, [user]);
  // Cargar productos cuando cambia la página o categoría
  useEffect(() => {
    fetchProductos();
  }, [categoria, pagination.currentPage]);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [categoria]);

  useEffect(() => {
    const carritoKey = user ? `carrito_${user._id}` : "carrito_guest";
    const carritoGuardado = localStorage.getItem(carritoKey);
    if (carritoGuardado) {
      setCarrito(JSON.parse(carritoGuardado));
    }
  }, [user]);

  useEffect(() => {
    const carritoKey = user ? `carrito_${user._id}` : "carrito_guest";
    localStorage.setItem(carritoKey, JSON.stringify(carrito));
  }, [carrito, user]);

  useEffect(() => {
    if (error || mensaje) {
      const timer = setTimeout(() => {
        setError("");
        setMensaje("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, mensaje]);

  useEffect(() => {
    if (user && user.rol === "cliente") {
      setClienteData({
        nombre: user.nombre || "",
        telefono: user.telefono || "",
        email: user.email || "",
        notas: "",
      });
    }
  }, [user]);

  // MODIFICADO: Función fetchProductos con paginación
  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Agregar parámetros de paginación
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);
      
      // Filtro por categoría
      if (categoria !== "todos") {
        params.append('categoria', categoria);
      }
      
      // Filtro de búsqueda
      if (busqueda) {
        params.append('buscar', busqueda);
      }

      const response = await axios.get(`/api/catalog?${params}`);
      
      // Reemplazar productos completamente
      setProductos(response.data.productos || []);
      
      // Actualizar información de paginación
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      
      // Scroll al inicio de los productos al cambiar de página
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar los productos. Por favor, recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  // NUEVO: Función para cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find((item) => item._id === producto._id);

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.warning(
          `Stock máximo disponible para ${producto.nombre}: ${producto.stock} unidades`,
          {
            icon: "⚠️",
          }
        );
        return;
      }
      setCarrito((prev) =>
        prev.map((item) =>
          item._id === producto._id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
      toast.success(`${producto.nombre} actualizado en el carrito`, {
        icon: "🛒",
      });
    } else {
      setCarrito((prev) => [...prev, { ...producto, cantidad: 1 }]);
      toast.success(`${producto.nombre} agregado al carrito`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    const producto =
      productos.find((p) => p._id === id) || carrito.find((c) => c._id === id);
    if (producto && nuevaCantidad > producto.stock) {
      toast.warning(`Stock máximo disponible: ${producto.stock} unidades`, {
        icon: "⚠️",
      });
      return;
    }

    setCarrito((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const eliminarDelCarrito = (id) => {
    const producto = carrito.find((item) => item._id === id);
    setCarrito((prev) => prev.filter((item) => item._id !== id));
    toast.info(`${producto?.nombre || "Producto"} eliminado del carrito`, {
      icon: "🗑️",
    });
  };

  const calcularTotal = () => {
    return carrito.reduce(
      (total, item) => total + item.precioVenta * item.cantidad,
      0
    );
  };

  // Normaliza texto removiendo tildes/diacríticos y pasando a minúsculas
  const normalizeText = (text = "") => {
    try {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    } catch (e) {
      // Fallback por si normalize no está disponible
      return String(text).toLowerCase();
    }
  };

  // Validar formulario de checkout
  const validarFormulario = () => {
    const errores = [];

    if (!clienteData.nombre.trim()) {
      errores.push("El nombre es obligatorio");
    }

    if (!clienteData.telefono.trim()) {
      errores.push("El teléfono es obligatorio");
    } else {
      const telefonoLimpio = clienteData.telefono.replace(/\D/g, "");
      if (telefonoLimpio.length !== 8) {
        errores.push("El teléfono debe tener exactamente 8 dígitos");
      }
    }

    if (clienteData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteData.email)) {
        errores.push("El formato del email no es válido");
      }
    }

    return errores;
  };

  const procesarPedido = async (e) => {
    e.preventDefault();
    setError("");

    const erroresValidacion = validarFormulario();
    if (erroresValidacion.length > 0) {
      erroresValidacion.forEach((error) => toast.error(error));
      return;
    }

    if (carrito.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setProcesandoPedido(true);

    try {
      const telefonoLimpio = clienteData.telefono.replace(/\D/g, "");

      const pedidoData = {
        cliente: {
          nombre: clienteData.nombre.trim(),
          telefono: telefonoLimpio,
          email: clienteData.email.trim() || undefined,
        },
        items: carrito.map((item) => ({
          producto: item._id,
          cantidad: item.cantidad,
        })),
        notasCliente: clienteData.notas.trim() || undefined,
      };

      const response = await axios.post("/api/pedidos", pedidoData);

      if (response.data.success) {
        setPedidoCreado(response.data.pedido);
        setCarrito([]);
        setMostrarCheckout(false);
        setClienteData({ nombre: "", telefono: "", email: "", notas: "" });
        const carritoKey = user ? `carrito_${user._id}` : "carrito_guest";
        localStorage.removeItem(carritoKey);
        toast.success("¡Pedido creado exitosamente!", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error al procesar pedido:", error);

      if (error.response?.data?.details) {
        error.response.data.details.forEach((d) => toast.error(d.msg));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          "Error al procesar el pedido. Por favor, inténtalo de nuevo."
        );
      }
    } finally {
      setProcesandoPedido(false);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const term = normalizeText(busqueda);
    const name = normalizeText(producto.nombre);
    const desc = normalizeText(producto.descripcion || '');
    const coincideBusqueda = name.includes(term) || desc.includes(term);
    return coincideBusqueda && producto.stock > 0;
  });

  const getCategoriaIcon = (categoria) => {
    const icons = {
      globos: "🎈",
      decoraciones: "🎊",
      "articulos-fiesta": "🎉",
      servicios: "🛠️",
      otros: "📦",
    };
    return icons[categoria] || "📦";
  };

  const getEstadoColor = (estado) => {
    const colors = {
      "en-proceso": "#f39c12",
      cancelado: "#e74c3c",
      "listo-entrega": "#27ae60",
      entregado: "#95a5a6",
    };
    return colors[estado] || "#bdc3c7";
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      "en-proceso": "En Proceso",
      cancelado: "Cancelado",
      "listo-entrega": "Listo para Entrega",
      entregado: "Entregado",
    };
    return textos[estado] || estado;
  };

  // ========== FUNCIONES DE AUTENTICACIÓN ==========

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validar campos
    if (!loginData.email.trim()) {
      toast.error("El email es obligatorio");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      toast.error("El formato del email no es válido");
      return;
    }

    if (!loginData.password) {
      toast.error("La contraseña es obligatoria");
      return;
    }

    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      setMostrarLogin(false);
      setLoginData({ email: "", password: "" });
      toast.success(
        `¡Bienvenido de vuelta, ${result.user?.nombre || "usuario"}!`,
        {
          icon: "👋",
        }
      );
    } else {
      toast.error(result.error || "Error al iniciar sesión");
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");

    // Validar campos
    if (!registroData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (registroData.nombre.length < 2 || registroData.nombre.length > 30) {
      toast.error("El nombre debe tener entre 2 y 30 caracteres");
      return;
    }

    if (!registroData.email.trim()) {
      toast.error("El email es obligatorio");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registroData.email)) {
      toast.error("El formato del email no es válido");
      return;
    }

    if (!registroData.password) {
      toast.error("La contraseña es obligatoria");
      return;
    }

    if (registroData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!registroData.telefono.trim()) {
      toast.error("El teléfono es obligatorio");
      return;
    }

    const telefonoLimpio = registroData.telefono.replace(/\D/g, "");
    if (telefonoLimpio.length !== 8) {
      toast.error("El teléfono debe tener exactamente 8 dígitos");
      return;
    }

    try {
      const response = await axios.post("/api/auth/registro-cliente", {
        nombre: registroData.nombre,
        email: registroData.email,
        password: registroData.password,
        telefono: registroData.telefono,
        rol: "cliente",
      });

      if (response.data.success || response.data.token) {
        setMostrarRegistro(false);
        setEmailPendiente(registroData.email);
        setMostrarVerificacion(true);
        setRegistroData({ nombre: "", email: "", password: "", telefono: "" });
        toast.success("¡Cuenta creada! Verifica tu email para continuar.", {
          autoClose: 4000,
        });
      }
    } catch (error) {
      if (error.response?.data?.details) {
        error.response.data.details.forEach((d) => toast.error(d.msg));
      } else {
        toast.error(error.response?.data?.message || "Error al crear cuenta");
      }
    }
  };

  const handleEmailVerificado = () => {
    setMostrarVerificacion(false);
    toast.success("¡Email verificado! Ahora puedes iniciar sesión.", {
      icon: "✅",
    });
    setMostrarLogin(true);
  };

  const handleLogout = () => {
    logout();
    setCarrito([]);
    setClienteData({ nombre: "", telefono: "", email: "", notas: "" });
    toast.info("Sesión cerrada", {
      icon: "👋",
    });
  };

  // Manejadores de cambio con validación de límites
  const handleNombreChange = (e, isCheckout = false) => {
    const value = e.target.value.slice(0, 30); // Límite 30 caracteres
    if (isCheckout) {
      setClienteData({ ...clienteData, nombre: value });
    } else {
      setRegistroData({ ...registroData, nombre: value });
    }
  };

  const handleTelefonoChange = (e, isCheckout = false) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8); // Solo números, límite 8
    if (isCheckout) {
      setClienteData({ ...clienteData, telefono: value });
    } else {
      setRegistroData({ ...registroData, telefono: value });
    }
  };

  const handleEmailChange = (e, isLogin = false, isCheckout = false) => {
    const value = e.target.value.slice(0, 40); // Límite 40 caracteres
    if (isLogin) {
      setLoginData({ ...loginData, email: value });
    } else if (isCheckout) {
      setClienteData({ ...clienteData, email: value });
    } else {
      setRegistroData({ ...registroData, email: value });
    }
  };

  // ========== RENDER ==========

  if (pedidoCreado) {
    return (
      <div className="client-container">
        <div className="success-message">
          <div className="success-card">
            <h2>🎉 ¡Pedido Creado Exitosamente!</h2>
            <div className="pedido-info">
              <p>
                <strong>Número de Pedido:</strong> {pedidoCreado.numero}
              </p>
              <p>
                <strong>Código de Seguimiento:</strong>
                <span className="codigo-seguimiento">
                  {pedidoCreado.codigoSeguimiento}
                </span>
              </p>
              <p>
                <strong>Total:</strong> Q{pedidoCreado.total.toFixed(2)}
              </p>
              <p>
                <strong>Estado:</strong> {getEstadoTexto(pedidoCreado.estado)}
              </p>
            </div>
            <div className="instrucciones">
              <h3>📋 Instrucciones:</h3>
              <ul>
                <li>
                  Guarda tu código de seguimiento:{" "}
                  <strong>{pedidoCreado.codigoSeguimiento}</strong>
                </li>
                <li>Recibirás una confirmación cuando tu pedido esté listo</li>
                <li>
                  Puedes consultar el estado de tu pedido en cualquier momento
                </li>
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
                onClick={() => window.open("/seguimiento", "_blank")}
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
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
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
      <div className="logo-container">
        <img
          src="/LogoGlobosFiesta.jpg"
          alt="Globos y Fiesta Logo"
          className="logo-image"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "inline";
          }}
        />
        <span className="logo-fallback">🎈</span>
        <div className="logo-text">
          <h1>Globos&Fiesta</h1>
          <p>Todo para hacer tu celebración especial</p>
        </div>
      </div>
    </div>

    <div className="header-actions">
      {user ? (
  <div className="user-menu">
  <span>Hola, {user.nombre}!</span>

  <button onClick={handleLogout} className="btn btn-secondary">
    Cerrar Sesión
  </button>

  {/* Botón para rastrear pedido - PARA TODOS LOS USUARIOS */}
  <a href="/seguimiento" className="btn-track-order">
    📍 Rastrear Pedido
  </a>

  {/* Botón Panel Admin - SOLO para admin/empleado/propietario */}
  {(['empleado', 'propietario'].includes(user.rol?.toLowerCase())) && (
    <a href="/dashboard" className="btn-admin-access">
      🎛️ Panel Admin
    </a>
  )}
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
        🛒 Carrito (
        {carrito.reduce((total, item) => total + item.cantidad, 0)})
      </button>
    </div>
  </div>
</header>
      {/* Mensajes */}
      {error && (
        <div className="alert alert-error">
          {error.split("\n").map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}

      {mensaje && <div className="alert alert-success">{mensaje}</div>}

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
          {[
            "todos",
            "globos",
            "decoraciones",
            "articulos-fiesta",
            "servicios",
            "otros",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`filter-btn ${categoria === cat ? "active" : ""}`}
            >
              {getCategoriaIcon(cat)}{" "}
              {cat === "todos"
                ? "Todos"
                : cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
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
          productosFiltrados.map((producto) => (
            <div key={producto._id} className="producto-card">
              <img
                src={producto.imagenUrl || "/NoImagen.jpg"}
                alt={producto.nombre}
                className="producto-imagen"
                onError={(e) => {
                  e.target.src = "/NoImagen.jpg";
                }}
              />
              <div className="producto-info">
                <h3>{producto.nombre}</h3>
                <p className="producto-descripcion">{producto.descripcion}</p>
                <div className="producto-details">
                  <span className="precio">
                    Q{producto.precioVenta?.toFixed(2)}
                  </span>
                  <span className="stock">Stock: {producto.stock}</span>
                </div>
                <button
                  onClick={() => agregarAlCarrito(producto)}
                  className="btn btn-primary"
                  disabled={producto.stock === 0}
                >
                  {producto.stock === 0 ? "Agotado" : "Agregar al Carrito"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
        
      {/* NUEVA SECCIÓN: Paginación */}
      {pagination.totalPages > 1 && (
        <div className="catalog-pagination">
          {/* Botón Primera Página */}
          <button
            className="pagination-btn btn-first"
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1}
            title="Primera página"
          >
            ⏮ Primera
          </button>

          {/* Botón Anterior */}
          <button
            className="pagination-btn btn-prev"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            title="Página anterior"
          >
            ◀ Anterior
          </button>

          {/* Información de página */}
          <div className="pagination-info">
            <span className="pagination-current">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <span className="pagination-total">
              ({pagination.totalItems} productos en total)
            </span>
          </div>

          {/* Botón Siguiente */}
          <button
            className="pagination-btn btn-next"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            title="Página siguiente"
          >
            Siguiente ▶
          </button>

          {/* Botón Última Página */}
          <button
            className="pagination-btn btn-last"
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            title="Última página"
          >
            Última ⏭
          </button>
        </div>
      )}

      {/* Modal de Carrito */}
      {mostrarCarrito && (
        <div className="modal-overlay">
          <div className="modal-carrito">
            <div className="modal-header">
              <h3>🛒 Tu Carrito</h3>
              <button
                className="btn-close"
                onClick={() => setMostrarCarrito(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {carrito.length === 0 ? (
                <p>Tu carrito está vacío</p>
              ) : (
                <>
                  {carrito.map((item) => (
                    <div key={item._id} className="carrito-item">
                      <div className="item-info">
                        <h4>{item.nombre}</h4>
                        <p>Q{item.precioVenta?.toFixed(2)} c/u</p>
                      </div>
                      <div className="item-controls">
                        <button
                          onClick={() =>
                            actualizarCantidad(item._id, item.cantidad - 1)
                          }
                          className="btn btn-sm"
                        >
                          -
                        </button>
                        <span className="cantidad">{item.cantidad}</span>
                        <button
                          onClick={() =>
                            actualizarCantidad(item._id, item.cantidad + 1)
                          }
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
              <button
                className="btn-close"
                onClick={() => setMostrarCheckout(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={procesarPedido}>
              <div className="modal-body">
                <div className="checkout-section">
                  <h4>Resumen del Pedido</h4>
                  {carrito.map((item) => (
                    <div key={item._id} className="checkout-item">
                      <span>
                        {item.nombre} x{item.cantidad}
                      </span>
                      <span>
                        Q{(item.precioVenta * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="checkout-total">
                    <strong>Total: Q{calcularTotal().toFixed(2)}</strong>
                  </div>
                </div>

                <div className="checkout-section">
                  <h4>Información del Cliente</h4>
                  <div className="form-group">
                    <label>Nombre Completo * (máx. 30 caracteres)</label>
                    <input
                      type="text"
                      value={clienteData.nombre}
                      onChange={(e) => handleNombreChange(e, true)}
                      placeholder="Tu nombre completo"
                      required
                      maxLength="30"
                      className="form-input"
                    />
                    <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                      {clienteData.nombre.length}/30
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Teléfono * (8 dígitos)</label>
                    <input
                      type="tel"
                      value={clienteData.telefono}
                      onChange={(e) => handleTelefonoChange(e, true)}
                      placeholder="12345678"
                      required
                      maxLength="8"
                      pattern="[0-9]{8}"
                      className="form-input"
                    />
                    <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                      {clienteData.telefono.length}/8
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Email (opcional, máx. 40 caracteres)</label>
                    <input
                      type="email"
                      value={clienteData.email}
                      onChange={(e) => handleEmailChange(e, false, true)}
                      placeholder="tu@email.com"
                      maxLength="40"
                      className="form-input"
                    />
                    <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                      {clienteData.email.length}/40
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Notas del Pedido (opcional)</label>
                    <textarea
                      value={clienteData.notas}
                      onChange={(e) =>
                        setClienteData({
                          ...clienteData,
                          notas: e.target.value,
                        })
                      }
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
                  {procesandoPedido ? "Procesando..." : "Confirmar Pedido"}
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
              <button
                className="btn-close"
                onClick={() => setMostrarLogin(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email * (máx. 40 caracteres)</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleEmailChange(e, true, false)}
                    placeholder="tu@email.com"
                    required
                    maxLength="40"
                    className="form-input"
                  />
                  <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                    {loginData.email.length}/40
                  </small>
                </div>

                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
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
              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarLogin(false);
                    setMostrarRecuperacion(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a855f7",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span>¿No tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarLogin(false);
                    setMostrarRegistro(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a855f7",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "14px",
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
              <button
                className="btn-close"
                onClick={() => setMostrarRegistro(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleRegistro}>
                <div className="form-group">
                  <label>Nombre Completo * (máx. 30 caracteres)</label>
                  <input
                    type="text"
                    value={registroData.nombre}
                    onChange={(e) => handleNombreChange(e, false)}
                    placeholder="Tu nombre completo"
                    required
                    maxLength="30"
                    className="form-input"
                  />
                  <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                    {registroData.nombre.length}/30
                  </small>
                </div>

                <div className="form-group">
                  <label>Email * (máx. 40 caracteres)</label>
                  <input
                    type="email"
                    value={registroData.email}
                    onChange={(e) => handleEmailChange(e, false, false)}
                    placeholder="tu@email.com"
                    required
                    maxLength="40"
                    className="form-input"
                  />
                  <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                    {registroData.email.length}/40
                  </small>
                </div>

                <div className="form-group">
                  <label>Contraseña * (mínimo 6 caracteres)</label>
                  <input
                    type="password"
                    value={registroData.password}
                    onChange={(e) =>
                      setRegistroData({
                        ...registroData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono * (8 dígitos)</label>
                  <input
                    type="tel"
                    value={registroData.telefono}
                    onChange={(e) => handleTelefonoChange(e, false)}
                    placeholder="12345678"
                    required
                    maxLength="8"
                    pattern="[0-9]{8}"
                    className="form-input"
                  />
                  <small style={{ color: "#7c3aed", fontSize: "12px" }}>
                    {registroData.telefono.length}/8
                  </small>
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

              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <span>¿Ya tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRegistro(false);
                    setMostrarLogin(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a855f7",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "14px",
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
            setEmailPendiente("");
          }}
        />
      )}

      {/* Modal de Recuperación de Contraseña */}
      {mostrarRecuperacion && (
        <PasswordRecovery
          onClose={() => {
            setMostrarRecuperacion(false);
            setMostrarLogin(true);
          }}
        />
      )}
    </div>
  );
};
export default ClientCatalog;