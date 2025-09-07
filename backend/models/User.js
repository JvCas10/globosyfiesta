// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor ingresa un email válido'
        ]
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    rol: {
        type: String,
        enum: ['propietario', 'empleado', 'cliente'], // Agregar 'cliente'
        default: 'cliente' // Cambiar default a 'cliente'
    },
    telefono: {
        type: String,
        trim: true,
        match: [/^\d{8,15}$/, 'Por favor ingresa un número de teléfono válido']
    },
    activo: {
        type: Boolean,
        default: true
    },
    emailVerificado: {
        type: Boolean,
        default: false
    },
    // Permisos específicos para empleados
    permisos: {
        ventas: {
            type: Boolean,
            default: true
        },
        productos: {
            type: Boolean,
            default: false
        },
        clientes: {
            type: Boolean,
            default: true
        },
        servicios: {
            type: Boolean,
            default: true
        },
        reportes: {
            type: Boolean,
            default: false
        },
        configuracion: {
            type: Boolean,
            default: false
        }
    },
    ultimoAcceso: {
        type: Date,
        default: Date.now
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware para encriptar password antes de guardar
userSchema.pre('save', async function (next) {
    // Solo hashear la contraseña si ha sido modificada
    if (!this.isModified('password')) return next();

    try {
        // Hash de la contraseña con salt de 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
userSchema.methods.compararPassword = async function (passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password);
};

// Método para actualizar último acceso
userSchema.methods.actualizarUltimoAcceso = function () {
    this.ultimoAcceso = new Date();
    return this.save({ validateBeforeSave: false });
};

// Método para verificar si es propietario
userSchema.methods.esPropietario = function () {
    return this.rol === 'propietario';
};

// Método para verificar permisos
userSchema.methods.tienePermiso = function (permiso) {
    if (this.rol === 'propietario') return true;
    return this.permisos[permiso] || false;
};

// Método para obtener datos seguros (sin password)
userSchema.methods.datosSegurosPerfil = function () {
    return {
        _id: this._id,
        nombre: this.nombre,
        email: this.email,
        telefono: this.telefono,
        rol: this.rol,
        emailVerificado: this.emailVerificado, // Agregar esta línea
        fechaRegistro: this.fechaRegistro,
        ultimoAcceso: this.ultimoAcceso,
        activo: this.activo,
        permisos: this.permisos
    };
};




// Índices
userSchema.index({ email: 1 });
userSchema.index({ activo: 1 });
userSchema.index({ rol: 1 });

module.exports = mongoose.model('User', userSchema);