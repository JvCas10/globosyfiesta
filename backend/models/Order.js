// backend/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    imagenUrl: String // Para mostrar en el cliente
});

const orderSchema = new mongoose.Schema({
    numero: {
        type: String,
        unique: true
    },
    // Información del cliente
    cliente: {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        telefono: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    
    items: [orderItemSchema],
    
    // Totales
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'El subtotal no puede ser negativo']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'El total no puede ser negativo']
    },
    
    // Estado del pedido
    estado: {
        type: String,
        enum: ['en-proceso', 'cancelado', 'listo-entrega', 'entregado'],
        default: 'en-proceso'
    },
    
    // Notas del cliente y admin
    notasCliente: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    
    notasAdmin: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    
    // Control de fechas
    fechaPedido: {
        type: Date,
        default: Date.now
    },
    
    fechaEstadoActual: {
        type: Date,
        default: Date.now
    },
    
    // Para rastreo del cliente
    codigoSeguimiento: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});

// Middleware para generar número de pedido y código de seguimiento
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Generar número de pedido
            const count = await this.constructor.countDocuments();
            const fechaHoy = new Date().toISOString().split('T')[0].replace(/-/g, '');
            this.numero = `P${fechaHoy}-${(count + 1).toString().padStart(4, '0')}`;
            
            // Generar código de seguimiento (6 dígitos)
            this.codigoSeguimiento = Math.floor(100000 + Math.random() * 900000).toString();
            
            console.log('📦 Pedido generado:', this.numero);
        } catch (error) {
            console.error('❌ Error al generar número de pedido:', error);
            return next(error);
        }
    }
    
    // Actualizar fecha de estado si cambió el estado
    if (this.isModified('estado')) {
        this.fechaEstadoActual = new Date();
    }
    
    next();
});

// Middleware para calcular totales automáticamente
orderSchema.pre('save', function(next) {
    this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);
    this.total = this.subtotal;
    next();
});

// Índices para búsquedas eficientes
orderSchema.index({ numero: 1 });
orderSchema.index({ codigoSeguimiento: 1 });
orderSchema.index({ fechaPedido: -1 });
orderSchema.index({ estado: 1 });
orderSchema.index({ 'cliente.telefono': 1 });

// Métodos estáticos
orderSchema.statics.pedidosPorFecha = function(fechaInicio, fechaFin) {
    const fechaInicioDate = new Date(fechaInicio);
    fechaInicioDate.setHours(0, 0, 0, 0);
    
    const fechaFinDate = new Date(fechaFin);
    fechaFinDate.setHours(23, 59, 59, 999);
    
    return this.find({
        fechaPedido: {
            $gte: fechaInicioDate,
            $lte: fechaFinDate
        }
    }).populate('items.producto', 'nombre categoria');
};

orderSchema.statics.pedidosDelDia = function(fecha = new Date()) {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);
    
    return this.find({
        fechaPedido: { $gte: inicioDia, $lte: finDia }
    });
};

// Método para buscar pedido por código de seguimiento
orderSchema.statics.buscarPorCodigo = function(codigo) {
    return this.findOne({ codigoSeguimiento: codigo })
        .populate('items.producto', 'nombre categoria imagenUrl');
};

module.exports = mongoose.model('Order', orderSchema);