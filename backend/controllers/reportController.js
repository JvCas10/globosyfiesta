// backend/controllers/reportController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');

// Dashboard principal
exports.dashboard = async (req, res) => {
    try {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo de esta semana

        // Ventas del día
        const ventasHoy = await Sale.ventasDelDia(hoy);
        const totalVentasHoy = ventasHoy.length;
        const montoVentasHoy = ventasHoy.reduce((total, venta) => total + venta.total, 0);

        // Ventas del mes
        const ventasMes = await Sale.find({
            fechaVenta: { $gte: inicioMes },
            estado: 'completada'
        });
        const totalVentasMes = ventasMes.length;
        const montoVentasMes = ventasMes.reduce((total, venta) => total + venta.total, 0);

        // Productos con stock bajo
        const productosStockBajo = await Product.find({ activo: true })
            .where('stock').lte(5)
            .select('nombre stock stockMinimo categoria')
            .sort({ stock: 1 })
            .limit(10);

        // Top 5 productos más vendidos del mes
        const topProductos = await Sale.aggregate([
            { $match: { fechaVenta: { $gte: inicioMes }, estado: 'completada' } },
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.producto', 
                    cantidadVendida: { $sum: '$items.cantidad' },
                    nombreProducto: { $first: '$items.nombre' },
                    ingresoTotal: { $sum: '$items.subtotal' }
                } 
            },
            { $sort: { cantidadVendida: -1 } },
            { $limit: 5 }
        ]);

        // Clientes frecuentes (más de 3 compras)
        const clientesFrecuentes = await Client.find({
            activo: true,
            numeroVentas: { $gte: 3 }
        })
        .select('nombre telefono numeroVentas totalCompras')
        .sort({ totalCompras: -1 })
        .limit(5);

        // Ventas por método de pago (del mes)
        const ventasPorMetodo = await Sale.aggregate([
            { $match: { fechaVenta: { $gte: inicioMes }, estado: 'completada' } },
            { 
                $group: { 
                    _id: '$metodoPago', 
                    cantidad: { $sum: 1 },
                    total: { $sum: '$total' }
                } 
            }
        ]);

        // Ganancias (solo para propietario)
        let gananciaHoy = null;
        let gananciaMes = null;
        
        if (req.user.rol === 'propietario') {
            gananciaHoy = 0;
            for (const venta of ventasHoy) {
                gananciaHoy += await venta.calcularGanancia();
            }

            gananciaMes = 0;
            for (const venta of ventasMes) {
                gananciaMes += await venta.calcularGanancia();
            }
        }

        res.json({
            periodo: {
                hoy: hoy.toISOString().split('T')[0],
                inicioMes: inicioMes.toISOString().split('T')[0]
            },
            resumenDiario: {
                ventasHoy: totalVentasHoy,
                montoHoy: montoVentasHoy,
                gananciaHoy
            },
            resumenMensual: {
                ventasMes: totalVentasMes,
                montoMes: montoVentasMes,
                gananciaMes
            },
            inventario: {
                productosStockBajo: productosStockBajo.length,
                listaBajo: productosStockBajo
            },
            topProductos,
            clientesFrecuentes,
            ventasPorMetodo
        });

    } catch (error) {
        console.error('❌ Error en dashboard:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Reporte de ventas por rango de fechas
exports.reporteVentas = async (req, res) => {
    try {
        console.log('🟡 Generando reporte de ventas:', req.query);
        
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                error: 'Fechas requeridas',
                message: 'Se requieren fechaInicio y fechaFin'
            });
        }

        // Validar que fechaFin sea mayor o igual a fechaInicio
        if (new Date(fechaFin) < new Date(fechaInicio)) {
            return res.status(400).json({
                error: 'Fechas inválidas',
                message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
            });
        }

        const ventas = await Sale.ventasPorFecha(fechaInicio, fechaFin);
        console.log('✅ Ventas encontradas:', ventas.length);

        // Agrupar por día
        const ventasPorDia = {};
        ventas.forEach(venta => {
            const fecha = venta.fechaVenta.toISOString().split('T')[0];
            if (!ventasPorDia[fecha]) {
                ventasPorDia[fecha] = {
                    fecha,
                    cantidad: 0,
                    monto: 0,
                    ventas: []
                };
            }
            ventasPorDia[fecha].cantidad += 1;
            ventasPorDia[fecha].monto += venta.total;
            ventasPorDia[fecha].ventas.push({
                numero: venta.numero,
                total: venta.total,
                metodoPago: venta.metodoPago,
                vendedor: venta.vendedor?.nombre
            });
        });

        // Totales del período
        const totalVentas = ventas.length;
        const montoTotal = ventas.reduce((total, venta) => total + venta.total, 0);
        const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0;

        // Ganancias (solo propietario)
        let gananciaTotal = null;
        if (req.user.rol === 'propietario') {
            gananciaTotal = 0;
            for (const venta of ventas) {
                gananciaTotal += await venta.calcularGanancia();
            }
        }

        res.json({
            periodo: { fechaInicio, fechaFin },
            resumen: {
                totalVentas,
                montoTotal,
                promedioVenta,
                gananciaTotal
            },
            ventasPorDia: Object.values(ventasPorDia).sort((a, b) => a.fecha.localeCompare(b.fecha))
        });

    } catch (error) {
        console.error('❌ Error en reporte de ventas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};

// Reporte de inventario
exports.reporteInventario = async (req, res) => {
    try {
        const { categoria, stockBajo = 'false' } = req.query;

        const filtros = { activo: true };
        
        if (categoria && categoria !== 'todos') {
            filtros.categoria = categoria;
        }

        let productos = await Product.find(filtros)
            .select('nombre categoria stock stockMinimo precioCompra precioVenta')
            .sort({ categoria: 1, nombre: 1 });

        if (stockBajo === 'true') {
            productos = productos.filter(p => p.stock <= p.stockMinimo);
        }

        // Agrupar por categoría
        const productosPorCategoria = {};
        let valorInventarioTotal = 0;

        productos.forEach(producto => {
            if (!productosPorCategoria[producto.categoria]) {
                productosPorCategoria[producto.categoria] = {
                    categoria: producto.categoria,
                    productos: [],
                    cantidadProductos: 0,
                    valorCategoria: 0
                };
            }

            const valorProducto = producto.stock * producto.precioCompra;
            valorInventarioTotal += valorProducto;

            productosPorCategoria[producto.categoria].productos.push({
                _id: producto._id,
                nombre: producto.nombre,
                stock: producto.stock,
                stockMinimo: producto.stockMinimo,
                precioCompra: producto.precioCompra,
                precioVenta: producto.precioVenta,
                valorInventario: valorProducto,
                stockBajo: producto.stock <= producto.stockMinimo,
                margen: ((producto.precioVenta - producto.precioCompra) / producto.precioVenta * 100).toFixed(2)
            });

            productosPorCategoria[producto.categoria].cantidadProductos += 1;
            productosPorCategoria[producto.categoria].valorCategoria += valorProducto;
        });

        res.json({
            resumen: {
                totalProductos: productos.length,
                valorInventarioTotal: req.user.rol === 'propietario' ? valorInventarioTotal : null,
                productosStockBajo: productos.filter(p => p.stock <= p.stockMinimo).length
            },
            productosPorCategoria: Object.values(productosPorCategoria)
        });

    } catch (error) {
        console.error('❌ Error en reporte de inventario:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Reporte de clientes
exports.reporteClientes = async (req, res) => {
    try {
        const { tipoCliente } = req.query;

        const filtros = { activo: true };
        
        if (tipoCliente && tipoCliente !== 'todos') {
            filtros.tipoCliente = tipoCliente;
        }

        const clientes = await Client.find(filtros)
            .select('nombre telefono tipoCliente numeroVentas totalCompras promedioCompra ultimaCompra')
            .sort({ totalCompras: -1 });

        // Estadísticas generales
        const totalClientes = clientes.length;
        const clientesActivos = clientes.filter(c => c.numeroVentas > 0);
        const clientesFrecuentes = clientes.filter(c => c.numeroVentas >= 5);

        // Agrupar por tipo
        const clientesPorTipo = {};
        clientes.forEach(cliente => {
            if (!clientesPorTipo[cliente.tipoCliente]) {
                clientesPorTipo[cliente.tipoCliente] = {
                    tipo: cliente.tipoCliente,
                    cantidad: 0,
                    ventasTotal: 0,
                    montosTotal: 0
                };
            }
            clientesPorTipo[cliente.tipoCliente].cantidad += 1;
            clientesPorTipo[cliente.tipoCliente].ventasTotal += cliente.numeroVentas;
            clientesPorTipo[cliente.tipoCliente].montosTotal += cliente.totalCompras;
        });

        res.json({
            resumen: {
                totalClientes,
                clientesActivos: clientesActivos.length,
                clientesFrecuentes: clientesFrecuentes.length,
                clientesNuevos: clientes.filter(c => c.numeroVentas === 0).length
            },
            clientesPorTipo: Object.values(clientesPorTipo),
            topClientes: clientes.slice(0, 10)
        });

    } catch (error) {
        console.error('❌ Error en reporte de clientes:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};