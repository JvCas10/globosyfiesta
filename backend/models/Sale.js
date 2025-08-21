// backend/models/Sale.js - Versión Corregida
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [1, 'La cantidad debe ser mayor a 0']
    },
    precioUnitario: {
        type: Number,
        required: [true, 'El precio unitario es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'El subtotal no puede ser negativo']
    },
    // Para servicios adicionales (inflado, decoración)
    serviciosAdicionales: [{
        nombre: String,
        precio: Number
    }]
});

const saleSchema = new mongoose.Schema({
    numero: {
        type: String,
        unique: true
        // Removemos required: true porque se genera automáticamente
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: false // Permite ventas sin cliente registrado
    },
    // Datos del cliente para ventas rápidas
    datosCliente: {
        nombre: String,
        telefono: String
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [saleItemSchema],
    // Totales
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'El subtotal no puede ser negativo']
    },
    descuento: {
        type: Number,
        default: 0,
        min: [0, 'El descuento no puede ser negativo']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'El total no puede ser negativo']
    },
    // Método de pago
    metodoPago: {
        type: String,
        enum: ['efectivo', 'tarjeta', 'transferencia', 'mixto'],
        default: 'efectivo'
    },
    // Estado de la venta
    estado: {
        type: String,
        enum: ['pendiente', 'completada', 'cancelada'],
        default: 'completada'
    },
    // Tipo de venta
    tipoVenta: {
        type: String,
        enum: ['directa', 'con-servicio', 'solo-servicio'],
        default: 'directa'
    },
    // Servicios realizados
    serviciosRealizados: [{
        tipo: {
            type: String,
            enum: ['inflado', 'decoracion-basica', 'entrega-local', 'arreglo-globos']
        },
        descripcion: String,
        precio: Number,
        tiempoEmpleado: Number // en minutos
    }],
    // Notas adicionales
    notas: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    // Control de fechas
    fechaVenta: {
        type: Date,
        default: Date.now
    },
    fechaEntrega: {
        type: Date // Para servicios programados
    }
}, {
    timestamps: true
});

// Middleware para generar número de venta automáticamente ANTES de validación
saleSchema.pre('validate', async function(next) {
    if (this.isNew && !this.numero) {
        try {
            // Obtener el contador actual de ventas
            const count = await this.constructor.countDocuments();
            const fechaHoy = new Date().toISOString().split('T')[0].replace(/-/g, '');
            this.numero = `V${fechaHoy}-${(count + 1).toString().padStart(4, '0')}`;
            console.log('🔢 Número de venta generado:', this.numero);
        } catch (error) {
            console.error('❌ Error al generar número de venta:', error);
            return next(error);
        }
    }
    next();
});

// Middleware para calcular totales automáticamente
saleSchema.pre('save', function(next) {
    // Calcular subtotal de items
    this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);
    
    // Agregar servicios al subtotal
    const totalServicios = this.serviciosRealizados.reduce((total, servicio) => total + servicio.precio, 0);
    this.subtotal += totalServicios;
    
    // Calcular total final
    this.total = this.subtotal - this.descuento;
    
    next();
});

// Índices para búsquedas eficientes
saleSchema.index({ numero: 1 });
saleSchema.index({ fechaVenta: -1 });
saleSchema.index({ vendedor: 1 });
saleSchema.index({ cliente: 1 });
saleSchema.index({ estado: 1 });
saleSchema.index({ metodoPago: 1 });

// Método para obtener ganancia total de la venta
saleSchema.methods.calcularGanancia = async function() {
    await this.populate('items.producto');
    
    let gananciaTotal = 0;
    
    for (const item of this.items) {
        if (item.producto) {
            const gananciaItem = (item.precioUnitario - item.producto.precioCompra) * item.cantidad;
            gananciaTotal += gananciaItem;
        }
    }
    
    // Los servicios se consideran ganancia pura (sin costo de compra)
    const gananciaServicios = this.serviciosRealizados.reduce((total, servicio) => total + servicio.precio, 0);
    gananciaTotal += gananciaServicios;
    
    return gananciaTotal;
};

// Método estático para ventas por rango de fechas
saleSchema.statics.ventasPorFecha = function(fechaInicio, fechaFin) {
    // Crear fechas con horarios completos para incluir todo el día
    const fechaInicioDate = new Date(fechaInicio);
    fechaInicioDate.setHours(0, 0, 0, 0); // Inicio del día
    
    const fechaFinDate = new Date(fechaFin);
    fechaFinDate.setHours(23, 59, 59, 999); // Final del día
    
    console.log('🔍 Buscando ventas entre:', {
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        fechaInicioOriginal: fechaInicio,
        fechaFinOriginal: fechaFin
    });
    
    return this.find({
        fechaVenta: {
            $gte: fechaInicioDate,
            $lte: fechaFinDate
        },
        estado: 'completada'
    }).populate('vendedor', 'nombre').populate('cliente', 'nombre telefono');
};

// Método estático para ventas del día
saleSchema.statics.ventasDelDia = function(fecha = new Date()) {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);
    
    return this.find({
        fechaVenta: { $gte: inicioDia, $lte: finDia },
        estado: 'completada'
    });
};

// Método estático para estadísticas rápidas
saleSchema.statics.estadisticasVentas = async function(fechaInicio, fechaFin) {
    const ventas = await this.ventasPorFecha(fechaInicio, fechaFin);
    
    const totalVentas = ventas.length;
    const totalMonto = ventas.reduce((total, venta) => total + venta.total, 0);
    const promedioVenta = totalVentas > 0 ? totalMonto / totalVentas : 0;
    
    return {
        totalVentas,
        totalMonto,
        promedioVenta
    };
};

module.exports = mongoose.model('Sale', saleSchema);