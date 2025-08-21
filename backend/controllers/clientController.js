// backend/controllers/clientController.js
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Crear cliente
exports.crearCliente = async (req, res) => {
    try {
        console.log('🟡 Creando cliente:', req.body);

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const {
            nombre,
            telefono,
            email,
            direccion,
            tipoCliente,
            preferencias,
            notas
        } = req.body;

        // Verificar si ya existe un cliente con el mismo teléfono
        const clienteExistente = await Client.findOne({ telefono, activo: true });
        if (clienteExistente) {
            return res.status(400).json({
                error: 'Cliente ya existe',
                message: 'Ya existe un cliente con este número de teléfono'
            });
        }

        // Crear nuevo cliente
        const nuevoCliente = new Client({
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            email: email?.toLowerCase().trim(),
            direccion: direccion?.trim(),
            tipoCliente: tipoCliente || 'individual',
            preferencias: {
                colores: preferencias?.colores || [],
                tiposGlobos: preferencias?.tiposGlobos || [],
                ocasionesFrecuentes: preferencias?.ocasionesFrecuentes || []
            },
            notas: notas?.trim()
        });

        await nuevoCliente.save();

        console.log('✅ Cliente creado:', nuevoCliente.nombre);

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            cliente: nuevoCliente
        });

    } catch (error) {
        console.error('❌ Error al crear cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo crear el cliente'
        });
    }
};

// Obtener todos los clientes
exports.obtenerClientes = async (req, res) => {
    try {
        const {
            tipoCliente,
            activo = 'true',
            buscar,
            page = 1,
            limit = 20,
            ordenar = '-ultimaCompra'
        } = req.query;

        // Construir filtros
        const filtros = {};

        if (tipoCliente && tipoCliente !== 'todos') {
            filtros.tipoCliente = tipoCliente;
        }

        if (activo !== 'todos') {
            filtros.activo = activo === 'true';
        }

        // Filtro de búsqueda por texto
        if (buscar) {
            filtros.$or = [
                { nombre: { $regex: buscar, $options: 'i' } },
                { telefono: { $regex: buscar, $options: 'i' } },
                { email: { $regex: buscar, $options: 'i' } }
            ];
        }

        // Paginación
        const skip = (page - 1) * limit;
        const clientes = await Client.find(filtros)
            .sort(ordenar)
            .skip(skip)
            .limit(Number(limit));

        const total = await Client.countDocuments(filtros);

        res.json({
            clientes,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener clientes:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener los clientes'
        });
    }
};

// Obtener cliente por ID
exports.obtenerClientePorId = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Client.findById(id);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente no encontrado'
            });
        }

        res.json({ cliente });

    } catch (error) {
        console.error('❌ Error al obtener cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el cliente'
        });
    }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            telefono,
            email,
            direccion,
            tipoCliente,
            preferencias,
            notas,
            activo
        } = req.body;

        // Buscar cliente existente
        const cliente = await Client.findById(id);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente no encontrado'
            });
        }

        // Verificar si el nuevo teléfono ya existe en otro cliente
        if (telefono && telefono !== cliente.telefono) {
            const telefonoExistente = await Client.findOne({
                telefono,
                _id: { $ne: id },
                activo: true
            });

            if (telefonoExistente) {
                return res.status(400).json({
                    error: 'Teléfono ya existe',
                    message: 'Ya existe otro cliente con este número de teléfono'
                });
            }
        }

        // Actualizar cliente
        const clienteActualizado = await Client.findByIdAndUpdate(
            id,
            {
                nombre: nombre?.trim(),
                telefono: telefono?.trim(),
                email: email?.toLowerCase().trim(),
                direccion: direccion?.trim(),
                tipoCliente,
                preferencias: preferencias ? {
                    colores: preferencias.colores || [],
                    tiposGlobos: preferencias.tiposGlobos || [],
                    ocasionesFrecuentes: preferencias.ocasionesFrecuentes || []
                } : undefined,
                notas: notas?.trim(),
                activo: activo !== undefined ? activo === 'true' : undefined
            },
            { new: true, runValidators: true }
        );

        console.log('✅ Cliente actualizado:', clienteActualizado.nombre);

        res.json({
            message: 'Cliente actualizado exitosamente',
            cliente: clienteActualizado
        });

    } catch (error) {
        console.error('❌ Error al actualizar cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo actualizar el cliente'
        });
    }
};

// Eliminar cliente (desactivar)
exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Client.findById(id);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente no encontrado'
            });
        }

        // Desactivar en lugar de eliminar (soft delete)
        await Client.findByIdAndUpdate(id, { activo: false });

        console.log('✅ Cliente desactivado:', cliente.nombre);

        res.json({
            message: 'Cliente desactivado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo eliminar el cliente'
        });
    }
};

// Buscar clientes
exports.buscarClientes = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Parámetro de búsqueda requerido'
            });
        }

        const clientes = await Client.buscarClientes(q);

        res.json({
            clientes,
            total: clientes.length,
            termino: q
        });

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo realizar la búsqueda'
        });
    }
};

// Obtener clientes frecuentes
exports.clientesFrecuentes = async (req, res) => {
    try {
        const clientes = await Client.clientesFrecuentes();

        res.json({
            clientes,
            total: clientes.length
        });

    } catch (error) {
        console.error('❌ Error al obtener clientes frecuentes:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener clientes inactivos
exports.clientesInactivos = async (req, res) => {
    try {
        const { diasInactividad = 90 } = req.query;
        
        const clientes = await Client.clientesInactivos(Number(diasInactividad));

        res.json({
            clientes,
            total: clientes.length,
            diasInactividad: Number(diasInactividad)
        });

    } catch (error) {
        console.error('❌ Error al obtener clientes inactivos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener estadísticas de cliente
exports.estadisticasCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Client.findById(id);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente no encontrado'
            });
        }

        const estadisticas = {
            totalCompras: cliente.totalCompras,
            numeroVentas: cliente.numeroVentas,
            promedioCompra: cliente.promedioCompra,
            ultimaCompra: cliente.ultimaCompra,
            esFrecuente: cliente.esFrecuente(),
            diasDesdeUltimaCompra: cliente.diasDesdeUltimaCompra(),
            tipoCliente: cliente.tipoCliente
        };

        res.json({
            cliente: {
                id: cliente._id,
                nombre: cliente.nombre,
                telefono: cliente.telefono
            },
            estadisticas
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};