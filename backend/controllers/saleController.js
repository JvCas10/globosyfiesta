// backend/controllers/saleController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Crear venta
exports.crearVenta = async (req, res) => {
    try {
        console.log('🟡 Creando venta:', req.body);

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const {
            cliente,
            datosCliente,
            items,
            descuento = 0,
            metodoPago = 'efectivo',
            tipoVenta = 'directa',
            serviciosRealizados = [],
            notas,
            fechaEntrega
        } = req.body;

        // Validar que hay items
        if (!items || items.length === 0) {
            return res.status(400).json({
                error: 'Items requeridos',
                message: 'La venta debe tener al menos un item'
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
                    message: `El producto ${producto.nombre} está inactivo`
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
                precioUnitario: item.precioUnitario || producto.precioVenta,
                subtotal: (item.precioUnitario || producto.precioVenta) * item.cantidad,
                serviciosAdicionales: item.serviciosAdicionales || []
            };

            // Agregar servicios adicionales al subtotal del item
            if (item.serviciosAdicionales) {
                const totalServicios = item.serviciosAdicionales.reduce((total, servicio) => total + servicio.precio, 0);
                itemValidado.subtotal += totalServicios;
            }

            itemsValidados.push(itemValidado);
            subtotal += itemValidado.subtotal;
        }

        // Agregar servicios realizados al subtotal
        const totalServiciosRealizados = serviciosRealizados.reduce((total, servicio) => total + servicio.precio, 0);
        subtotal += totalServiciosRealizados;

        // Crear la venta
        const nuevaVenta = new Sale({
            cliente: cliente || undefined,
            datosCliente: datosCliente || undefined,
            vendedor: req.user.id,
            items: itemsValidados,
            subtotal,
            descuento: Number(descuento),
            total: subtotal - Number(descuento),
            metodoPago,
            tipoVenta,
            serviciosRealizados,
            notas: notas?.trim(),
            fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined
        });

        await nuevaVenta.save();

        // Actualizar stock de productos
        for (const item of itemsValidados) {
            await Product.findByIdAndUpdate(
                item.producto,
                { $inc: { stock: -item.cantidad } }
            );
        }

        // Actualizar estadísticas del cliente si existe
        if (cliente) {
            const clienteDoc = await Client.findById(cliente);
            if (clienteDoc) {
                await clienteDoc.actualizarEstadisticas(nuevaVenta.total);
            }
        }

        // Poblar la venta para la respuesta
        await nuevaVenta.populate([
            { path: 'vendedor', select: 'nombre email' },
            { path: 'cliente', select: 'nombre telefono email' },
            { path: 'items.producto', select: 'nombre categoria' }
        ]);

        console.log('✅ Venta creada:', nuevaVenta.numero);

        res.status(201).json({
            message: 'Venta creada exitosamente',
            venta: nuevaVenta
        });

    } catch (error) {
        console.error('❌ Error al crear venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo crear la venta'
        });
    }
};

// Obtener todas las ventas
exports.obtenerVentas = async (req, res) => {
    try {
        const {
            estado = 'completada',
            metodoPago,
            tipoVenta,
            vendedor,
            fechaInicio,
            fechaFin,
            page = 1,
            limit = 20
        } = req.query;

        // Construir filtros
        const filtros = {};

        if (estado && estado !== 'todos') {
            filtros.estado = estado;
        }

        if (metodoPago && metodoPago !== 'todos') {
            filtros.metodoPago = metodoPago;
        }

        if (tipoVenta && tipoVenta !== 'todos') {
            filtros.tipoVenta = tipoVenta;
        }

        if (vendedor) {
            filtros.vendedor = vendedor;
        }

        // Filtro de fechas
        if (fechaInicio || fechaFin) {
            filtros.fechaVenta = {};
            if (fechaInicio) {
                filtros.fechaVenta.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const fecha = new Date(fechaFin);
                fecha.setHours(23, 59, 59, 999); // Incluir todo el día
                filtros.fechaVenta.$lte = fecha;
            }
        }

        // Paginación
        const skip = (page - 1) * limit;
        const ventas = await Sale.find(filtros)
            .populate('vendedor', 'nombre email')
            .populate('cliente', 'nombre telefono')
            .populate('items.producto', 'nombre categoria')
            .sort({ fechaVenta: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Sale.countDocuments(filtros);

        res.json({
            ventas,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener ventas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las ventas'
        });
    }
};

// Obtener venta por ID
exports.obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const venta = await Sale.findById(id)
            .populate('vendedor', 'nombre email telefono')
            .populate('cliente', 'nombre telefono email direccion')
            .populate('items.producto', 'nombre categoria precioCompra');

        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        // Calcular ganancia si es propietario
        let ganancia = null;
        if (req.user.rol === 'propietario') {
            ganancia = await venta.calcularGanancia();
        }

        res.json({ 
            venta,
            ganancia 
        });

    } catch (error) {
        console.error('❌ Error al obtener venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la venta'
        });
    }
};

// Obtener ventas del día
exports.ventasDelDia = async (req, res) => {
    try {
        const { fecha } = req.query;
        const fechaBusqueda = fecha ? new Date(fecha) : new Date();

        const ventas = await Sale.ventasDelDia(fechaBusqueda)
            .populate('vendedor', 'nombre')
            .populate('cliente', 'nombre');

        const totalVentas = ventas.length;
        const totalMonto = ventas.reduce((total, venta) => total + venta.total, 0);
        const promedioVenta = totalVentas > 0 ? totalMonto / totalVentas : 0;

        // Ganancia total (solo para propietario)
        let gananciaTotal = null;
        if (req.user.rol === 'propietario') {
            gananciaTotal = 0;
            for (const venta of ventas) {
                gananciaTotal += await venta.calcularGanancia();
            }
        }

        res.json({
            fecha: fechaBusqueda.toISOString().split('T')[0],
            ventas,
            resumen: {
                totalVentas,
                totalMonto,
                promedioVenta,
                gananciaTotal
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener ventas del día:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Cancelar venta
exports.cancelarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const venta = await Sale.findById(id).populate('items.producto');

        if (!venta) {
            return res.status(404).json({
                error: 'Venta no encontrada'
            });
        }

        if (venta.estado === 'cancelada') {
            return res.status(400).json({
                error: 'Venta ya cancelada'
            });
        }

        // Restaurar stock de productos
        for (const item of venta.items) {
            if (item.producto) {
                await Product.findByIdAndUpdate(
                    item.producto._id,
                    { $inc: { stock: item.cantidad } }
                );
            }
        }

        // Actualizar estadísticas del cliente (restar)
        if (venta.cliente) {
            const cliente = await Client.findById(venta.cliente);
            if (cliente) {
                cliente.numeroVentas = Math.max(0, cliente.numeroVentas - 1);
                cliente.totalCompras = Math.max(0, cliente.totalCompras - venta.total);
                cliente.promedioCompra = cliente.numeroVentas > 0 ? cliente.totalCompras / cliente.numeroVentas : 0;
                await cliente.save();
            }
        }

        // Marcar venta como cancelada
        venta.estado = 'cancelada';
        venta.notas = `${venta.notas || ''}\n\nCANCELADA: ${motivo || 'Sin motivo especificado'}`.trim();
        await venta.save();

        console.log('✅ Venta cancelada:', venta.numero);

        res.json({
            message: 'Venta cancelada exitosamente',
            venta
        });

    } catch (error) {
        console.error('❌ Error al cancelar venta:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo cancelar la venta'
        });
    }
};

// Estadísticas de ventas
exports.estadisticasVentas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                error: 'Fechas requeridas',
                message: 'Se requieren fechaInicio y fechaFin'
            });
        }

        const estadisticas = await Sale.estadisticasVentas(fechaInicio, fechaFin);

        // Información adicional solo para propietario
        if (req.user.rol === 'propietario') {
            const ventas = await Sale.ventasPorFecha(fechaInicio, fechaFin);
            
            let gananciaTotal = 0;
            for (const venta of ventas) {
                gananciaTotal += await venta.calcularGanancia();
            }

            estadisticas.gananciaTotal = gananciaTotal;
            estadisticas.margenPromedio = estadisticas.totalMonto > 0 ? 
                (gananciaTotal / estadisticas.totalMonto) * 100 : 0;
        }

        res.json({
            periodo: {
                fechaInicio,
                fechaFin
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