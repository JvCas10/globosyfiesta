// frontend/src/pages/Productos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Productos.css';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');

  // Estado de paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'globos',
    precioCompra: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '',
    tipoGlobo: 'latex',
    color: '',
    tamano: 'pequeno',
    tipoServicio: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, [categoria, pagination.currentPage]);

  // Reiniciar a página 1 cuando cambian los filtros
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [categoria, busqueda]);

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams();
      if (categoria !== 'todos') params.append('categoria', categoria);
      if (busqueda) params.append('buscar', busqueda);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);

      const response = await axios.get(`/api/productos?${params}`);
      setProductos(response.data.productos);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
      setError('Error al cargar los productos');
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const toastId = toast.loading(editingProduct ? 'Actualizando producto...' : 'Creando producto...');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }

      if (editingProduct) {
        await axios.put(`/api/productos/${editingProduct._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('✅ Producto actualizado correctamente');
      } else {
        await axios.post('/api/productos', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('✅ Producto creado correctamente');
      }

      toast.dismiss(toastId);
      fetchProductos();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar el producto';
      toast.error(`❌ ${errorMessage}`);
      toast.dismiss(toastId);
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      tipoGlobo: producto.tipoGlobo || 'latex',
      color: producto.color || '',
      tamano: producto.tamano || 'pequeno',
      tipoServicio: producto.tipoServicio || ''
    });
    if (producto.imagenUrl) {
      setImagePreview(producto.imagenUrl);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    const toastId = toast.loading('Eliminando producto...');
    try {
      await axios.delete(`/api/productos/${id}`);
      toast.success('✅ Producto eliminado correctamente');
      toast.dismiss(toastId);
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al eliminar el producto');
      toast.dismiss(toastId);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('❌ La imagen no debe superar los 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'globos',
      precioCompra: '',
      precioVenta: '',
      stock: '',
      stockMinimo: '',
      tipoGlobo: 'latex',
      color: '',
      tamano: 'pequeno',
      tipoServicio: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  if (!hasPermission('productos')) {
    return (
      <div className="productos-container">
        <div className="productos-page-header">
          <h1 className="productos-title">🎈 Productos</h1>
        </div>
        <div className="productos-alert-error">
          No tienes permisos para gestionar productos.
        </div>
      </div>
    );
  }

  return (
    <div className="productos-container">
      <div className="productos-page-header">
        <h1 className="productos-title">🎈 Gestión de Productos</h1>
        <button 
          className="productos-btn-new"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Nuevo Producto
        </button>
      </div>

      {error && <div className="productos-alert-error">{error}</div>}

      {/* Filtros */}
      <div className="productos-filters-card">
        <div className="productos-filters-header">
          🔍 Filtros
        </div>
        <div className="productos-filters-body">
          <div className="productos-filters-grid">
            <div className="productos-form-field">
              <label className="productos-form-label">Categoría</label>
              <select
                className="productos-form-select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="todos">Todas las categorías</option>
                <option value="globos">Globos</option>
                <option value="decoraciones">Decoraciones</option>
                <option value="articulos-fiesta">Artículos de fiesta</option>
                <option value="servicios">Servicios</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="productos-form-field">
              <label className="productos-form-label">Buscar</label>
              <input
                type="text"
                className="productos-form-input"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px', color: '#6c757d', fontSize: '14px' }}>
            Total de productos: {pagination.totalItems}
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="productos-card">
        <div className="productos-card-header">
          📋 Lista de Productos (Página {pagination.currentPage} de {pagination.totalPages})
        </div>
        <div className="productos-card-body">
          {loading ? (
            <div className="productos-loading">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <p className="productos-empty">No hay productos para mostrar</p>
          ) : (
            <>
              <div className="productos-table-wrapper">
                <table className="productos-table">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio Venta</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr key={producto._id}>
                        <td>
                          <img
                            src={producto.imagenUrl || '/placeholder-product.png'}
                            alt={producto.nombre}
                            className="productos-product-image"
                            onError={(e) => {
                              e.target.onerror = null; // Prevenir bucle infinito
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect width="60" height="60" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23999"%3E📦%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </td>
                        <td className="productos-product-name">
                          {producto.nombre}
                        </td>
                        <td>
                          <span className="productos-category-badge">
                            {producto.categoria}
                          </span>
                        </td>
                        <td className="productos-price">
                          Q{producto.precioVenta.toFixed(2)}
                        </td>
                        <td>
                          <span className={`productos-stock ${
                            producto.stock <= producto.stockMinimo
                              ? 'productos-stock-low'
                              : 'productos-stock-ok'
                          }`}>
                            {producto.stock}
                          </span>
                          {producto.stock <= producto.stockMinimo && (
                            <div className="productos-stock-warning">
                              ⚠️ Stock bajo
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={
                            producto.activo
                              ? 'productos-status-active'
                              : 'productos-status-inactive'
                          }>
                            {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="productos-actions">
                            <button
                              className="productos-btn-edit"
                              onClick={() => handleEdit(producto)}
                            >
                              Editar
                            </button>
                            <button
                              className="productos-btn-delete"
                              onClick={() => handleDelete(producto._id)}
                            >
                              Eliminar
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
                <div className="productos-pagination">
                  <button
                    className="productos-pagination-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                  >
                    ⏮️ Primera
                  </button>
                  
                  <button
                    className="productos-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    ◀️ Anterior
                  </button>

                  <div className="productos-pagination-info">
                    <span className="productos-pagination-current">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    <span className="productos-pagination-total">
                      ({pagination.totalItems} productos en total)
                    </span>
                  </div>

                  <button
                    className="productos-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Siguiente ▶️
                  </button>

                  <button
                    className="productos-pagination-btn"
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

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="productos-modal-overlay" onClick={() => {
          setShowModal(false);
          resetForm();
        }}>
          <div className="productos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="productos-modal-header">
              <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
              <button 
                className="productos-modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="productos-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="productos-form-grid">
                  <div className="productos-form-field">
                    <label className="productos-form-label">Nombre *</label>
                    <input
                      type="text"
                      className="productos-form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                    />
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Categoría *</label>
                    <select
                      className="productos-form-select"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      required
                    >
                      <option value="globos">Globos</option>
                      <option value="decoraciones">Decoraciones</option>
                      <option value="articulos-fiesta">Artículos de fiesta</option>
                      <option value="servicios">Servicios</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Precio Compra *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="productos-form-input"
                      value={formData.precioCompra}
                      onChange={(e) => setFormData({...formData, precioCompra: e.target.value})}
                      required
                    />
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Precio Venta *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="productos-form-input"
                      value={formData.precioVenta}
                      onChange={(e) => setFormData({...formData, precioVenta: e.target.value})}
                      required
                    />
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Stock *</label>
                    <input
                      type="number"
                      className="productos-form-input"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Stock Mínimo *</label>
                    <input
                      type="number"
                      className="productos-form-input"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
                      required
                    />
                  </div>

                  {formData.categoria === 'globos' && (
                    <>
                      <div className="productos-form-field">
                        <label className="productos-form-label">Tipo de Globo</label>
                        <select
                          className="productos-form-select"
                          value={formData.tipoGlobo}
                          onChange={(e) => setFormData({...formData, tipoGlobo: e.target.value})}
                        >
                          <option value="latex">Látex</option>
                          <option value="foil">Foil</option>
                          <option value="metalico">Metálico</option>
                          <option value="transparente">Transparente</option>
                          <option value="biodegradable">Biodegradable</option>
                          <option value="otros">Otros</option>
                        </select>
                      </div>

                      <div className="productos-form-field">
                        <label className="productos-form-label">Color</label>
                        <input
                          type="text"
                          className="productos-form-input"
                          value={formData.color}
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          placeholder="Ej: Rojo, Azul..."
                        />
                      </div>

                      <div className="productos-form-field">
                        <label className="productos-form-label">Tamaño</label>
                        <select
                          className="productos-form-select"
                          value={formData.tamano}
                          onChange={(e) => setFormData({...formData, tamano: e.target.value})}
                        >
                          <option value="pequeno">Pequeño</option>
                          <option value="mediano">Mediano</option>
                          <option value="grande">Grande</option>
                          <option value="gigante">Gigante</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="productos-form-field full-width">
                    <label className="productos-form-label">Descripción</label>
                    <textarea
                      className="productos-form-textarea"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      rows="3"
                    />
                  </div>

                  <div className="productos-form-field full-width">
                    <label className="productos-form-label">Imagen del Producto</label>
                    <input
                      type="file"
                      className="productos-form-input"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="productos-image-preview">
                        <p className="productos-preview-label">Vista previa:</p>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="productos-preview-img"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="productos-form-actions">
                  <button
                    type="button"
                    className="productos-btn-cancel"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="productos-btn-submit"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear Producto'}
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

export default Productos;