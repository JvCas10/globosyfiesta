// frontend/src/pages/Clientes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipoCliente, setTipoCliente] = useState('todos');
  
  const { hasPermission } = useAuth();

  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoCliente: 'individual',
    preferencias: {
      colores: [],
      tiposGlobos: [],
      ocasionesFrecuentes: []
    },
    notas: ''
  });

  // Arrays para preferencias
  const [coloresDisponibles] = useState([
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Rosa', 'Morado', 'Naranja', 
    'Negro', 'Blanco', 'Dorado', 'Plateado', 'Multicolor'
  ]);
  
  const [tiposGlobosDisponibles] = useState([
    'Latex', 'Foil', 'Metálico', 'Transparente', 'Biodegradable'
  ]);
  
  const [ocasionesDisponibles] = useState([
    'Cumpleaños', 'Aniversarios', 'Bodas', 'Baby Shower', 'Graduaciones', 
    'Quinceañeras', 'Fiestas infantiles', 'Eventos corporativos', 'Navidad', 'Año Nuevo'
  ]);

  useEffect(() => {
    fetchClientes();
  }, [tipoCliente]);

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams();
      if (tipoCliente !== 'todos') params.append('tipoCliente', tipoCliente);
      
      const response = await axios.get(`/api/clientes?${params}`);
      setClientes(response.data.clientes);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingClient) {
        await axios.put(`/api/clientes/${editingClient._id}`, formData);
        alert('Cliente actualizado exitosamente');
      } else {
        await axios.post('/api/clientes', formData);
        alert('Cliente creado exitosamente');
      }
      
      resetForm();
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al guardar el cliente');
    }
  };

  const handleEdit = (cliente) => {
    setEditingClient(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      tipoCliente: cliente.tipoCliente,
      preferencias: {
        colores: cliente.preferencias?.colores || [],
        tiposGlobos: cliente.preferencias?.tiposGlobos || [],
        ocasionesFrecuentes: cliente.preferencias?.ocasionesFrecuentes || []
      },
      notas: cliente.notas || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar este cliente?')) {
      try {
        await axios.delete(`/api/clientes/${id}`);
        alert('Cliente desactivado');
        fetchClientes();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al desactivar el cliente');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      tipoCliente: 'individual',
      preferencias: {
        colores: [],
        tiposGlobos: [],
        ocasionesFrecuentes: []
      },
      notas: ''
    });
    setEditingClient(null);
    setShowForm(false);
  };

  const buscarClientes = async () => {
    if (!busqueda.trim()) {
      fetchClientes();
      return;
    }

    try {
      const response = await axios.get(`/api/clientes/buscar?q=${busqueda}`);
      setClientes(response.data.clientes);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };

  const handlePreferenceChange = (categoria, valor) => {
    setFormData(prev => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        [categoria]: prev.preferencias[categoria].includes(valor)
          ? prev.preferencias[categoria].filter(item => item !== valor)
          : [...prev.preferencias[categoria], valor]
      }
    }));
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.telefono.includes(busqueda) ||
    cliente.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!hasPermission('clientes')) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">👥 Clientes</h1>
        </div>
        <div className="alert alert-error">
          No tienes permisos para gestionar clientes.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Clientes</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nuevo Cliente'}
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
            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="50212345678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Cliente</label>
                  <select
                    className="form-control"
                    value={formData.tipoCliente}
                    onChange={(e) => setFormData({...formData, tipoCliente: e.target.value})}
                  >
                    <option value="individual">Individual</option>
                    <option value="frecuente">Frecuente</option>
                    <option value="evento">Evento</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Dirección completa del cliente"
                  />
                </div>
              </div>

              {/* Preferencias */}
              <div style={{ marginTop: '20px' }}>
                <h4>Preferencias del Cliente</h4>
                
                <div className="form-group">
                  <label>Colores Favoritos</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {coloresDisponibles.map(color => (
                      <label key={color} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={formData.preferencias.colores.includes(color)}
                          onChange={() => handlePreferenceChange('colores', color)}
                        />
                        {color}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Tipos de Globos Preferidos</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {tiposGlobosDisponibles.map(tipo => (
                      <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={formData.preferencias.tiposGlobos.includes(tipo)}
                          onChange={() => handlePreferenceChange('tiposGlobos', tipo)}
                        />
                        {tipo}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ocasiones Frecuentes</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {ocasionesDisponibles.map(ocasion => (
                      <label key={ocasion} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={formData.preferencias.ocasionesFrecuentes.includes(ocasion)}
                          onChange={() => handlePreferenceChange('ocasionesFrecuentes', ocasion)}
                        />
                        {ocasion}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>

              <div>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Actualizar' : 'Crear'} Cliente
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
              <label>Buscar clientes</label>
              <input
                type="text"
                className="form-control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono o email..."
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tipo de Cliente</label>
              <select
                className="form-control"
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="individual">Individual</option>
                <option value="frecuente">Frecuente</option>
                <option value="evento">Evento</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={buscarClientes}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="card">
        <div className="card-header">
          Clientes ({clientesFiltrados.length})
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Cargando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No hay clientes para mostrar
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Tipo</th>
                    <th>Estadísticas</th>
                    <th>Preferencias</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente._id}>
                      <td>
                        <div>
                          <strong>{cliente.nombre}</strong>
                          {cliente.direccion && (
                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                              📍 {cliente.direccion}
                            </div>
                          )}
                          {cliente.notas && (
                            <div style={{ fontSize: '12px', color: '#3498db', fontStyle: 'italic' }}>
                              💬 {cliente.notas}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>📞 {cliente.telefono}</div>
                          {cliente.email && (
                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                              ✉️ {cliente.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            cliente.tipoCliente === 'frecuente' ? '#d4edda' :
                            cliente.tipoCliente === 'empresa' ? '#cce5ff' :
                            cliente.tipoCliente === 'evento' ? '#fff3cd' : '#f8f9fa',
                          color:
                            cliente.tipoCliente === 'frecuente' ? '#155724' :
                            cliente.tipoCliente === 'empresa' ? '#004085' :
                            cliente.tipoCliente === 'evento' ? '#856404' : '#6c757d'
                        }}>
                          {cliente.tipoCliente}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <div>🛍️ Compras: {cliente.numeroVentas}</div>
                          <div>💰 Total: Q{cliente.totalCompras.toFixed(2)}</div>
                          {cliente.numeroVentas > 0 && (
                            <div>📊 Promedio: Q{cliente.promedioCompra.toFixed(2)}</div>
                          )}
                          {cliente.ultimaCompra && (
                            <div style={{ color: '#7f8c8d' }}>
                              🕒 {new Date(cliente.ultimaCompra).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px' }}>
                          {cliente.preferencias?.colores?.length > 0 && (
                            <div>🎨 {cliente.preferencias.colores.slice(0, 3).join(', ')}</div>
                          )}
                          {cliente.preferencias?.tiposGlobos?.length > 0 && (
                            <div>🎈 {cliente.preferencias.tiposGlobos.slice(0, 2).join(', ')}</div>
                          )}
                          {cliente.preferencias?.ocasionesFrecuentes?.length > 0 && (
                            <div>🎉 {cliente.preferencias.ocasionesFrecuentes.slice(0, 2).join(', ')}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                          onClick={() => handleEdit(cliente)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleDelete(cliente._id)}
                        >
                          Desactivar
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

export default Clientes;