// backend/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Crear pedido (para clientes)
exports.crearPedido = async (req, res) => {
    try {
        console.log('🛒 Creando pedido:', req.body);

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Errores de validación:', errors.array());
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const {
            cliente,
            items,
            notasCliente
        } = req.body;



        // Validar que hay items
        if (!items || items.length === 0) {
            return res.status(400).json({
                error: 'Items requeridos',
                message: 'El pedido debe tener al menos un item'
            });
        }

        // Validar disponibilidad de stock y calcular totales
        let subtotal = 0;
        const itemsValidados = [];

        for (const item of items) {
            const producto = await Product.findById(item.producto);

            if (!producto) {
                return res.status(400).json({
                    error: 'Producto no encontrado',
                    message: `El producto con ID ${item.producto} no existe`
                });
            }

            if (!producto.activo) {
                return res.status(400).json({
                    error: 'Producto inactivo',
                    message: `El producto ${producto.nombre} no está disponible`
                });
            }

            if (producto.stock < item.cantidad) {
                return res.status(400).json({
                    error: 'Stock insuficiente',
                    message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`
                });
            }

            const itemValidado = {
                producto: producto._id,
                nombre: producto.nombre,
                cantidad: item.cantidad,
                precioUnitario: producto.precioVenta,
                subtotal: producto.precioVenta * item.cantidad,
                imagenUrl: producto.imagenUrl || ''
            };

            itemsValidados.push(itemValidado);
            subtotal += itemValidado.subtotal;
        }

        // Generar código de seguimiento manualmente
        const codigoSeguimiento = Math.floor(100000 + Math.random() * 900000).toString();

        let usuarioId = null;
        if (req.user && req.user.rol === 'cliente') {
            usuarioId = req.user._id;
        }

        // Crear el pedido
        const nuevoPedido = new Order({
            cliente: {
                nombre: cliente.nombre.trim(),
                telefono: cliente.telefono.trim(),
                email: cliente.email?.toLowerCase().trim()
            },
            items: itemsValidados,
            subtotal,
            total: subtotal,
            notasCliente: notasCliente?.trim(),
            codigoSeguimiento: codigoSeguimiento  // Agregar código manualmente
        });

        // Guardar el pedido
        await nuevoPedido.save();

        // Actualizar stock de productos
        for (const item of itemsValidados) {
            await Product.findByIdAndUpdate(
                item.producto,
                { $inc: { stock: -item.cantidad } }
            );
        }

        console.log('✅ Pedido creado exitosamente:', nuevoPedido.numero);

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            pedido: {
                numero: nuevoPedido.numero,
                codigoSeguimiento: nuevoPedido.codigoSeguimiento,
                total: nuevoPedido.total,
                estado: nuevoPedido.estado,
                fechaPedido: nuevoPedido.fechaPedido
            }
        });

    } catch (error) {
        console.error('❌ Error al crear pedido:', error);

        // Si es un error de validación de MongoDB
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Error de validación',
                message: errorMessages.join(', ')
            });
        }

        // Si es un error de duplicado (código de seguimiento)
        if (error.code === 11000) {
            console.log('🔄 Código duplicado, reintentando...');
            // Reintentar una vez
            return exports.crearPedido(req, res);
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo crear el pedido'
        });
    }
};

// Obtener pedidos (para administradores)
// backend/controllers/orderController.js

// Obtener pedidos (para administradores) con paginación
exports.obtenerPedidos = async (req, res) => {
    try {
        const {
            estado = 'todos',
            fechaInicio,
            fechaFin,
            page = 1,
            limit = 20  // Mantener 20 por página para mejor rendimiento
        } = req.query;

        // Construir filtros
        const filtros = {};

        if (estado && estado !== 'todos') {
            filtros.estado = estado;
        }

        // Filtro de fechas
        if (fechaInicio || fechaFin) {
            filtros.fechaPedido = {};
            if (fechaInicio) {
                filtros.fechaPedido.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const fecha = new Date(fechaFin);
                fecha.setHours(23, 59, 59, 999);
                filtros.fechaPedido.$lte = fecha;
            }
        }

        // Paginación
        const skip = (page - 1) * limit;
        const pedidos = await Order.find(filtros)
            .populate('items.producto', 'nombre categoria')
            .sort({ fechaPedido: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(filtros);

        res.json({
            pedidos,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener pedidos:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener los pedidos'
        });
    }
};

// Obtener pedido por ID (para administradores)
exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const pedido = await Order.findById(id)
            .populate('items.producto', 'nombre categoria precioCompra imagenUrl');

        if (!pedido) {
            return res.status(404).json({
                error: 'Pedido no encontrado'
            });
        }

        res.json({ pedido });

    } catch (error) {
        console.error('❌ Error al obtener pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el pedido'
        });
    }
};

// Buscar pedido por código de seguimiento (para clientes)
exports.buscarPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;

        const pedido = await Order.buscarPorCodigo(codigo);

        if (!pedido) {
            return res.status(404).json({
                error: 'Pedido no encontrado',
                message: 'No se encontró un pedido con este código de seguimiento'
            });
        }

        res.json({
            success: true,
            pedido: {
                numero: pedido.numero,
                codigoSeguimiento: pedido.codigoSeguimiento,
                cliente: pedido.cliente,
                items: pedido.items,
                total: pedido.total,
                estado: pedido.estado,
                fechaPedido: pedido.fechaPedido,
                fechaEstadoActual: pedido.fechaEstadoActual,
                notasCliente: pedido.notasCliente,
                notasAdmin: pedido.notasAdmin
            }
        });

    } catch (error) {
        console.error('❌ Error al buscar pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo buscar el pedido'
        });
    }
};

// Actualizar estado del pedido (para administradores)
exports.actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, notasAdmin } = req.body;

        const estadosValidos = ['en-proceso', 'cancelado', 'listo-entrega', 'entregado'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: 'Estado inválido',
                message: 'Los estados válidos son: en-proceso, cancelado, listo-entrega, entregado'
            });
        }

        const pedido = await Order.findById(id);
        if (!pedido) {
            return res.status(404).json({
                error: 'Pedido no encontrado'
            });
        }

        // Si se cancela el pedido, restaurar stock
        if (estado === 'cancelado' && pedido.estado !== 'cancelado') {
            for (const item of pedido.items) {
                await Product.findByIdAndUpdate(
                    item.producto,
                    { $inc: { stock: item.cantidad } }
                );
            }
        }

        // Si se reactiva un pedido cancelado, reservar stock nuevamente
        if (pedido.estado === 'cancelado' && estado !== 'cancelado') {
            for (const item of pedido.items) {
                const producto = await Product.findById(item.producto);
                if (producto.stock < item.cantidad) {
                    return res.status(400).json({
                        error: 'Stock insuficiente',
                        message: `No hay suficiente stock para ${item.nombre}. Disponible: ${producto.stock}, Necesario: ${item.cantidad}`
                    });
                }
            }

            // Reservar stock
            for (const item of pedido.items) {
                await Product.findByIdAndUpdate(
                    item.producto,
                    { $inc: { stock: -item.cantidad } }
                );
            }
        }

        pedido.estado = estado;
        pedido.fechaEstadoActual = new Date();
        if (notasAdmin) {
            pedido.notasAdmin = notasAdmin.trim();
        }

        await pedido.save();

        console.log('✅ Estado de pedido actualizado:', pedido.numero, '→', estado);

        res.json({
            success: true,
            message: 'Estado actualizado exitosamente',
            pedido: {
                id: pedido._id,
                numero: pedido.numero,
                estado: pedido.estado,
                fechaEstadoActual: pedido.fechaEstadoActual
            }
        });

    } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo actualizar el estado del pedido'
        });
    }
};

// Cancelar pedido (para clientes)
exports.cancelarPedido = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { motivo } = req.body;

        const pedido = await Order.findOne({ codigoSeguimiento: codigo });

        if (!pedido) {
            return res.status(404).json({
                error: 'Pedido no encontrado'
            });
        }

        if (pedido.estado === 'entregado') {
            return res.status(400).json({
                error: 'No se puede cancelar',
                message: 'No se puede cancelar un pedido que ya fue entregado'
            });
        }

        if (pedido.estado === 'cancelado') {
            return res.status(400).json({
                error: 'Pedido ya cancelado',
                message: 'Este pedido ya fue cancelado anteriormente'
            });
        }

        // Restaurar stock
        for (const item of pedido.items) {
            await Product.findByIdAndUpdate(
                item.producto,
                { $inc: { stock: item.cantidad } }
            );
        }

        pedido.estado = 'cancelado';
        pedido.fechaEstadoActual = new Date();
        if (motivo) {
            pedido.notasCliente = `${pedido.notasCliente || ''}\n\nCANCELADO: ${motivo}`.trim();
        }

        await pedido.save();

        console.log('✅ Pedido cancelado por cliente:', pedido.numero);

        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al cancelar pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo cancelar el pedido'
        });
    }
};

// Obtener estadísticas de pedidos (para dashboard)
exports.estadisticasPedidos = async (req, res) => {
    try {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        // Pedidos del día
        const pedidosHoy = await Order.pedidosDelDia(hoy);

        // Pedidos del mes
        const pedidosMes = await Order.find({
            fechaPedido: { $gte: inicioMes }
        });

        // Agrupar por estado
        const pedidosPorEstado = await Order.aggregate([
            {
                $group: {
                    _id: '$estado',
                    cantidad: { $sum: 1 },
                    totalMonto: { $sum: '$total' }
                }
            }
        ]);

        const estadisticas = {
            pedidosHoy: pedidosHoy.length,
            pedidosMes: pedidosMes.length,
            montoTotalMes: pedidosMes.reduce((total, pedido) => total + pedido.total, 0),
            pedidosPorEstado: pedidosPorEstado.reduce((acc, item) => {
                acc[item._id] = {
                    cantidad: item.cantidad,
                    totalMonto: item.totalMonto
                };
                return acc;
            }, {})
        };

        res.json(estadisticas);

    } catch (error) {
        console.error('❌ Error al obtener estadísticas de pedidos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};