// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        enum: {
            values: ['globos', 'decoraciones', 'articulos-fiesta', 'servicios', 'otros'],
            message: 'Categoría no válida'
        }
    },
    precioCompra: {
        type: Number,
        required: [true, 'El precio de compra es obligatorio'],
        min: [0, 'El precio de compra no puede ser negativo']
    },
    precioVenta: {
        type: Number,
        required: [true, 'El precio de venta es obligatorio'],
        min: [0, 'El precio de venta no puede ser negativo']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser negativo'],
        default: 0
    },
    stockMinimo: {
        type: Number,
        default: 5,
        min: [0, 'El stock mínimo no puede ser negativo']
    },
    imagenUrl: {
        type: String,
        default: ''
    },
    imagenPublicId: {
        type: String,
        default: ''
    },
    activo: {
        type: Boolean,
        default: true
    },
    // Campos específicos para globos
    tipoGlobo: {
        type: String,
        enum: ['latex', 'foil', 'metálico', 'transparente', 'biodegradable', 'otros'],
        required: function() {
            return this.categoria === 'globos';
        }
    },
    color: {
        type: String,
        trim: true
    },
    tamaño: {
        type: String,
        enum: ['pequeño', 'mediano', 'grande', 'gigante'],
        required: function() {
            return this.categoria === 'globos';
        }
    },
    // Campo para servicios
    tipoServicio: {
        type: String,
        enum: ['inflado', 'decoracion-basica', 'entrega-local', 'arreglo-globos'],
        required: function() {
            return this.categoria === 'servicios';
        }
    },
    // Metadatos
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware para actualizar fechaActualizacion
productSchema.pre('save', function(next) {
    this.fechaActualizacion = new Date();
    next();
});

// Índices para mejorar búsquedas
productSchema.index({ nombre: 'text', descripcion: 'text' });
productSchema.index({ categoria: 1 });
productSchema.index({ activo: 1 });
productSchema.index({ stock: 1 });

// Métodos del esquema
productSchema.methods.stockBajo = function() {
    return this.stock <= this.stockMinimo;
};

productSchema.methods.calcularGanancia = function() {
    return this.precioVenta - this.precioCompra;
};

productSchema.methods.calcularMargen = function() {
    if (this.precioVenta === 0) return 0;
    return ((this.precioVenta - this.precioCompra) / this.precioVenta) * 100;
};

// Método estático para buscar productos
productSchema.statics.buscarProductos = function(termino) {
    return this.find({
        $and: [
            { activo: true },
            {
                $or: [
                    { nombre: { $regex: termino, $options: 'i' } },
                    { descripcion: { $regex: termino, $options: 'i' } },
                    { categoria: { $regex: termino, $options: 'i' } }
                ]
            }
        ]
    });
};

module.exports = mongoose.model('Product', productSchema);