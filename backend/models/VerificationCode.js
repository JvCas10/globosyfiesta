// backend/models/VerificationCode.js
const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    codigo: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['verificacion', 'recuperacion'],
        required: true
    },
    usado: {
        type: Boolean,
        default: false
    },
    intentos: {
        type: Number,
        default: 0,
        max: 3 // Máximo 3 intentos
    },
    fechaCreacion: {
        type: Date,
        default: Date.now,
        expires: 900 // Expira en 15 minutos (900 segundos)
    }
});

// Índice compuesto para búsqueda eficiente
verificationCodeSchema.index({ email: 1, tipo: 1, usado: 1 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);