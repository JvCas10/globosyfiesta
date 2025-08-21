// frontend/src/pages/Productos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  
  const { hasPermission } = useAuth();

  // Form data
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
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Agregar imagen si existe
      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }

      if (editingProduct) {
        await axios.put(`/api/productos/${editingProduct._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Producto actualizado exitosamente');
      } else {
        await axios.post('/api/productos', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Producto creado exitosamente');
      }
      
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al guardar el producto');
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
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await axios.delete(`/api/productos/${id}`);
        alert('Producto eliminado');
        fetchProductos();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
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
    setShowForm(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const buscarProductos = async () => {
    if (!busqueda.trim()) {
      fetchProductos();
      return;
    }

    try {
      const response = await axios.get(`/api/productos/buscar?q=${busqueda}`);
      setProductos(response.data.productos);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };

  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!hasPermission('productos')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">🎈 Productos</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para gestionar productos.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎈 Productos</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    className="form-control"
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

                <div className="form-group">
                  <label>Precio Compra (Q) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.precioCompra}
                    onChange={(e) => setFormData({...formData, precioCompra: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Venta (Q) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({...formData, precioVenta: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
                  />
                </div>

                {/* Imagen del producto */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Imagen del Producto</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <small style={{ color: '#7f8c8d' }}>
                    Formatos: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB
                  </small>
                  
                  {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Vista previa:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {formData.categoria === 'globos' && (
                  <>
                    <div className="form-group">
                      <label>Tipo de Globo</label>
                      <select
                        className="form-control"
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

                    <div className="form-group">
                      <label>Tamaño</label>
                      <select
                        className="form-control"
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

                    <div className="form-group">
                      <label>Color</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        placeholder="Ej: Rojo, Azul, Multicolor"
                      />
                    </div>
                  </>
                )}

                {formData.categoria === 'servicios' && (
                  <div className="form-group">
                    <label>Tipo de Servicio</label>
                    <select
                      className="form-control"
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
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del producto..."
                />
              </div>

              <div>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 150px', gap: '15px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Buscar productos</label>
              <input
                type="text"
                className="form-control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Categoría</label>
              <select
                className="form-control"
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

            <button className="btn btn-primary" onClick={buscarProductos}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="card">
        <div className="card-header">
          Productos ({productosFiltrados.length})
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Cargando productos...</div>
          ) : productosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No hay productos para mostrar
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {producto.imagenUrl && (
                            <img
                              src={producto.imagenUrl}
                              alt={producto.nombre}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                            />
                          )}
                          <div>
                            <strong>{producto.nombre}</strong>
                            {producto.descripcion && (
                              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                {producto.descripcion}
                              </div>
                            )}
                            {producto.color && (
                              <div style={{ fontSize: '12px', color: '#3498db' }}>
                                Color: {producto.color}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {producto.categoria}
                        {producto.tipoGlobo && (
                          <div style={{ fontSize: '12px' }}>
                            {producto.tipoGlobo} - {producto.tamaño}
                          </div>
                        )}
                      </td>
                      <td>Q{producto.precioVenta.toFixed(2)}</td>
                      <td>
                        <span style={{ 
                          color: producto.stock <= producto.stockMinimo ? '#e74c3c' : '#27ae60',
                          fontWeight: producto.stock <= producto.stockMinimo ? 'bold' : 'normal'
                        }}>
                          {producto.stock}
                        </span>
                        {producto.stock <= producto.stockMinimo && (
                          <div style={{ fontSize: '11px', color: '#e74c3c' }}>
                            ⚠️ Stock bajo
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          color: producto.activo ? '#27ae60' : '#e74c3c' 
                        }}>
                          {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                          onClick={() => handleEdit(producto)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleDelete(producto._id)}
                        >
                          Eliminar
                        </button>
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