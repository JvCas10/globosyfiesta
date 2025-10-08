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
  
  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'globos',
    precioCompra: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '',
    tipoGlobo: '',
    color: '',
    tamaño: '',
    tipoServicio: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, [categoria]);

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams();
      if (categoria !== 'todos') params.append('categoria', categoria);
      
      const response = await axios.get(`/api/productos?${params}`);
      setProductos(response.data.productos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mostrar toast de carga
    const toastId = toast.loading(editingProduct ? 'Actualizando producto...' : 'Creando producto...');

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }

      if (editingProduct) {
        await axios.put(`/api/productos/${editingProduct._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.update(toastId, {
          render: '✅ Producto actualizado exitosamente',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      } else {
        await axios.post('/api/productos', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.update(toastId, {
          render: '✅ Producto creado exitosamente',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      }
      
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar el producto';
      
      toast.update(toastId, {
        render: `❌ ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
      
      setError(errorMessage);
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
      tipoGlobo: producto.tipoGlobo || '',
      color: producto.color || '',
      tamaño: producto.tamaño || '',
      tipoServicio: producto.tipoServicio || ''
    });
    setImagePreview(producto.imagenUrl || null);
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      const toastId = toast.loading('Eliminando producto...');
      
      try {
        await axios.delete(`/api/productos/${id}`);
        
        toast.update(toastId, {
          render: '🗑️ Producto eliminado exitosamente',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        
        fetchProductos();
      } catch (error) {
        console.error('Error:', error);
        
        toast.update(toastId, {
          render: '❌ Error al eliminar el producto',
          type: 'error',
          isLoading: false,
          autoClose: 4000
        });
      }
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
      tipoGlobo: '',
      color: '',
      tamaño: '',
      tipoServicio: ''
    });
    setEditingProduct(null);
    setShowModal(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning('⚠️ Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('⚠️ La imagen no puede ser mayor a 5MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      toast.success('📷 Imagen seleccionada correctamente');
    }
  };

  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        <h1 className="productos-title">🎈 Productos</h1>
        <button className="productos-btn-new" onClick={() => setShowModal(true)}>
          + Nuevo Producto
        </button>
      </div>

      {error && <div className="productos-alert-error">{error}</div>}

      {showModal && (
        <div className="productos-modal-overlay" onClick={resetForm}>
          <div className="productos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="productos-modal-header">
              <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
              <button className="productos-modal-close" onClick={resetForm}>×</button>
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
                      <option value="articulos-fiesta">Artículos de Fiesta</option>
                      <option value="servicios">Servicios</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Precio Compra (Q) *</label>
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
                    <label className="productos-form-label">Precio Venta (Q) *</label>
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
                    <label className="productos-form-label">Stock</label>
                    <input
                      type="number"
                      className="productos-form-input"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>

                  <div className="productos-form-field">
                    <label className="productos-form-label">Stock Mínimo</label>
                    <input
                      type="number"
                      className="productos-form-input"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
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
                          <option value="">Seleccionar...</option>
                          <option value="latex">Latex</option>
                          <option value="foil">Foil</option>
                          <option value="metálico">Metálico</option>
                          <option value="transparente">Transparente</option>
                          <option value="biodegradable">Biodegradable</option>
                        </select>
                      </div>

                      <div className="productos-form-field">
                        <label className="productos-form-label">Tamaño</label>
                        <select
                          className="productos-form-select"
                          value={formData.tamaño}
                          onChange={(e) => setFormData({...formData, tamaño: e.target.value})}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="pequeño">Pequeño</option>
                          <option value="mediano">Mediano</option>
                          <option value="grande">Grande</option>
                          <option value="gigante">Gigante</option>
                        </select>
                      </div>

                      <div className="productos-form-field">
                        <label className="productos-form-label">Color</label>
                        <input
                          type="text"
                          className="productos-form-input"
                          value={formData.color}
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          placeholder="Ej: Rojo, Azul, Multicolor"
                        />
                      </div>
                    </>
                  )}

                  {formData.categoria === 'servicios' && (
                    <div className="productos-form-field">
                      <label className="productos-form-label">Tipo de Servicio</label>
                      <select
                        className="productos-form-select"
                        value={formData.tipoServicio}
                        onChange={(e) => setFormData({...formData, tipoServicio: e.target.value})}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="inflado">Inflado</option>
                        <option value="decoracion-basica">Decoración Básica</option>
                        <option value="entrega-local">Entrega Local</option>
                        <option value="arreglo-globos">Arreglo de Globos</option>
                      </select>
                    </div>
                  )}

                  <div className="productos-form-field full-width">
                    <label className="productos-form-label">Imagen del Producto</label>
                    <input
                      type="file"
                      className="productos-form-input"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <small className="productos-form-hint">
                      Formatos: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB
                    </small>
                    
                    {imagePreview && (
                      <div className="productos-image-preview">
                        <p className="productos-preview-label">Vista previa:</p>
                        <img src={imagePreview} alt="Preview" className="productos-preview-img" />
                      </div>
                    )}
                  </div>

                  <div className="productos-form-field full-width">
                    <label className="productos-form-label">Descripción</label>
                    <textarea
                      className="productos-form-textarea"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Descripción del producto..."
                    />
                  </div>
                </div>

                <div className="productos-form-actions">
                  <button type="button" className="productos-btn-cancel" onClick={resetForm}>
                    Cancelar
                  </button>
                  <button type="submit" className="productos-btn-submit">
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="productos-filters-card">
        <div className="productos-filters-grid">
          <div className="productos-form-field">
            <label className="productos-form-label">Buscar productos</label>
            <input
              type="text"
              className="productos-form-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
          </div>
          
          <div className="productos-form-field">
            <label className="productos-form-label">Categoría</label>
            <select
              className="productos-form-select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="globos">Globos</option>
              <option value="decoraciones">Decoraciones</option>
              <option value="articulos-fiesta">Artículos de Fiesta</option>
              <option value="servicios">Servicios</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
      </div>

      <div className="productos-card">
        <div className="productos-card-header">
          Productos ({productosFiltrados.length})
        </div>
        <div className="productos-card-body">
          {loading ? (
            <div className="productos-loading">Cargando productos...</div>
          ) : productosFiltrados.length === 0 ? (
            <p className="productos-empty">No hay productos para mostrar</p>
          ) : (
            <div className="productos-table-wrapper">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => (
                    <tr key={producto._id}>
                      <td>
                        <div className="productos-product-info">
                          {producto.imagenUrl && (
                            <img
                              src={producto.imagenUrl}
                              alt={producto.nombre}
                              className="productos-product-image"
                            />
                          )}
                          <div className="productos-product-details">
                            <div className="productos-product-name">{producto.nombre}</div>
                            {producto.descripcion && (
                              <div className="productos-product-desc">
                                {producto.descripcion}
                              </div>
                            )}
                            {producto.color && (
                              <div className="productos-product-color">
                                Color: {producto.color}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="productos-category">
                          {producto.categoria}
                          {producto.tipoGlobo && (
                            <div className="productos-category-type">
                              {producto.tipoGlobo} - {producto.tamaño}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>Q{producto.precioVenta.toFixed(2)}</td>
                      <td>
                        <span className={`productos-stock-value ${
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Productos;