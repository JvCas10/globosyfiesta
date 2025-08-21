// backend/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        trim: true,
        match: [/^\d{8,15}$/, 'Por favor ingresa un número de teléfono válido']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor ingresa un email válido'
        ]
    },
    direccion: {
        type: String,
        trim: true,
        maxlength: [200, 'La dirección no puede exceder 200 caracteres']
    },
    // Campos específicos para el negocio de globos
    tipoCliente: {
        type: String,
        enum: ['individual', 'frecuente', 'evento', 'empresa'],
        default: 'individual'
    },
    preferencias: {
        colores: [String],
        tiposGlobos: [String],
        ocasionesFrecuentes: [String]
    },
    notas: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    // Estadísticas del cliente
    totalCompras: {
        type: Number,
        default: 0,
        min: [0, 'El total de compras no puede ser negativo']
    },
    numeroVentas: {
        type: Number,
        default: 0,
        min: [0, 'El número de ventas no puede ser negativo']
    },
    promedioCompra: {
        type: Number,
        default: 0,
        min: [0, 'El promedio de compra no puede ser negativo']
    },
    ultimaCompra: {
        type: Date
    },
    // Control de estado
    activo: {
        type: Boolean,
        default: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para búsquedas eficientes
clientSchema.index({ nombre: 'text', telefono: 'text' });
clientSchema.index({ telefono: 1 });
clientSchema.index({ tipoCliente: 1 });
clientSchema.index({ activo: 1 });
clientSchema.index({ ultimaCompra: -1 });

// Método para actualizar estadísticas después de una venta
clientSchema.methods.actualizarEstadisticas = function(montoVenta) {
    this.numeroVentas += 1;
    this.totalCompras += montoVenta;
    this.promedioCompra = this.totalCompras / this.numeroVentas;
    this.ultimaCompra = new Date();
    
    // Actualizar tipo de cliente basado en número de compras
    if (this.numeroVentas >= 10) {
        this.tipoCliente = 'frecuente';
    }
    
    return this.save();
};

// Método para verificar si es cliente frecuente
clientSchema.methods.esFrecuente = function() {
    return this.tipoCliente === 'frecuente' || this.numeroVentas >= 5;
};

// Método para obtener días desde última compra
clientSchema.methods.diasDesdeUltimaCompra = function() {
    if (!this.ultimaCompra) return null;
    const ahora = new Date();
    const diferencia = ahora - this.ultimaCompra;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};

// Método estático para buscar clientes
clientSchema.statics.buscarClientes = function(termino) {
    return this.find({
        $and: [
            { activo: true },
            {
                $or: [
                    { nombre: { $regex: termino, $options: 'i' } },
                    { telefono: { $regex: termino, $options: 'i' } },
                    { email: { $regex: termino, $options: 'i' } }
                ]
            }
        ]
    });
};

// Método estático para obtener clientes frecuentes
clientSchema.statics.clientesFrecuentes = function() {
    return this.find({
        activo: true,
        $or: [
            { tipoCliente: 'frecuente' },
            { numeroVentas: { $gte: 5 } }
        ]
    }).sort({ ultimaCompra: -1 });
};

// Método estático para clientes inactivos (sin compras recientes)
clientSchema.statics.clientesInactivos = function(diasInactividad = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);
    
    return this.find({
        activo: true,
        ultimaCompra: { $lt: fechaLimite }
    }).sort({ ultimaCompra: -1 });
};

module.exports = mongoose.model('Client', clientSchema);