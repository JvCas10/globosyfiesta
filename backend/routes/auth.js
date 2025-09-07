// backend/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { generarCodigo, enviarEmailVerificacion, enviarEmailRecuperacion } = require('../services/emailService');

const router = express.Router();

// Validaciones para registro
const validacionRegistro = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),

    body('telefono')
        .optional()
        .trim()
        .isLength({ min: 8 })
        .withMessage('El teléfono debe tener al menos 8 caracteres'),

    body('rol')
        .optional()
        .isIn(['propietario', 'empleado', 'cliente'])
        .withMessage('El rol debe ser propietario, empleado o cliente')
];

// Validaciones para login
const validacionLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),

    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
];

// Validaciones para actualizar perfil
const validacionActualizarPerfil = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),

    body('telefono')
        .optional()
        .trim()
        .isLength({ min: 8 })
        .withMessage('El teléfono debe tener al menos 8 caracteres')
];

// @route   POST /api/auth/registro
// @desc    Registrar nuevo usuario
// @access  Public (pero el primer usuario será propietario automáticamente)
router.post('/registro', validacionRegistro, authController.registro);

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', validacionLogin, authController.login);

// @route   GET /api/auth/perfil
// @desc    Obtener perfil del usuario autenticado
// @access  Private
router.get('/perfil', authenticateToken, authController.perfil);

// @route   PUT /api/auth/perfil
// @desc    Actualizar perfil del usuario
// @access  Private
router.put('/perfil', authenticateToken, validacionActualizarPerfil, authController.actualizarPerfil);

// @route   PUT /api/auth/cambiar-password
// @desc    Cambiar contraseña del usuario
// @access  Private
router.put('/cambiar-password', authenticateToken, authController.cambiarPassword);

// @route   GET /api/auth/verificar-token
// @desc    Verificar si el token es válido
// @access  Private
router.get('/verificar-token', authenticateToken, authController.verificarToken);

// @route   POST /api/auth/logout
// @desc    Logout (en el frontend se eliminará el token)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        message: 'Logout exitoso',
        note: 'El token debe ser eliminado del cliente'
    });
});

// ============ RUTAS CON EMAILS REALES ============

// @route   POST /api/auth/registro-cliente
// @desc    Registro público para clientes CON EMAIL REAL
// @access  Public
router.post('/registro-cliente', [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),

    body('telefono')
        .trim()
        .isLength({ min: 8 })
        .withMessage('El teléfono debe tener al menos 8 caracteres'),
], async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({
                error: 'Usuario ya existe',
                message: 'Ya existe una cuenta con este email'
            });
        }

        // Crear usuario (sin verificar aún)
        const nuevoUsuario = new User({
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            password,
            telefono: telefono?.trim(),
            rol: 'cliente',
            emailVerificado: false // Importante: inicia como false
        });

        await nuevoUsuario.save();

        // Generar código de verificación
        const codigo = generarCodigo();

        // Guardar código en BD
        const codigoVerificacion = new VerificationCode({
            email: email.toLowerCase(),
            codigo,
            tipo: 'verificacion'
        });
        await codigoVerificacion.save();

        // Enviar email
        const emailResult = await enviarEmailVerificacion(email, nombre, codigo);

        if (emailResult.success) {
            console.log('✅ Usuario registrado y email enviado:', email);
            res.status(201).json({
                success: true,
                message: 'Cuenta creada. Revisa tu email para verificar tu cuenta.',
                email: email
            });
        } else {
            // Si falla el email, eliminar usuario creado
            await User.findByIdAndDelete(nuevoUsuario._id);
            await VerificationCode.findByIdAndDelete(codigoVerificacion._id);
            
            res.status(500).json({
                error: 'Error enviando email',
                message: 'No se pudo enviar el email de verificación. Intenta de nuevo.'
            });
        }

    } catch (error) {
        console.error('❌ Error en registro-cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el usuario'
        });
    }
});

// @route   POST /api/auth/verificar-email
// @desc    Verificar email CON CÓDIGO REAL
// @access  Public
router.post('/verificar-email', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Email y código son requeridos'
            });
        }

        // Buscar código válido
        const codigoVerificacion = await VerificationCode.findOne({
            email: email.toLowerCase(),
            codigo: codigo.trim(),
            tipo: 'verificacion',
            usado: false
        });

        if (!codigoVerificacion) {
            return res.status(400).json({
                error: 'Código inválido',
                message: 'El código no es válido o ha expirado'
            });
        }

        // Verificar intentos
        if (codigoVerificacion.intentos >= 3) {
            return res.status(400).json({
                error: 'Demasiados intentos',
                message: 'Has excedido el número máximo de intentos. Solicita un nuevo código.'
            });
        }

        // Marcar código como usado
        codigoVerificacion.usado = true;
        await codigoVerificacion.save();

        // Activar usuario
        const usuario = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { emailVerificado: true },
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'No se encontró el usuario asociado'
            });
        }

        console.log('✅ Email verificado exitosamente:', email);

        res.json({
            success: true,
            message: 'Email verificado exitosamente',
            user: usuario.datosSegurosPerfil()
        });

    } catch (error) {
        console.error('❌ Error verificando email:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo verificar el email'
        });
    }
});

// @route   POST /api/auth/reenviar-codigo
// @desc    Reenviar código de verificación
// @access  Public
router.post('/reenviar-codigo', async (req, res) => {
    try {
        const { email, tipo } = req.body; // tipo: 'verificacion' o 'recuperacion'

        if (!email || !tipo) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Email y tipo son requeridos'
            });
        }

        // Verificar que el usuario existe
        const usuario = await User.findOne({ email: email.toLowerCase() });
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'No existe una cuenta con este email'
            });
        }

        // Generar nuevo código
        const codigo = generarCodigo();

        // Eliminar códigos anteriores del mismo tipo
        await VerificationCode.deleteMany({
            email: email.toLowerCase(),
            tipo: tipo
        });

        // Crear nuevo código
        const nuevoCodigoVerificacion = new VerificationCode({
            email: email.toLowerCase(),
            codigo,
            tipo
        });
        await nuevoCodigoVerificacion.save();

        // Enviar email según el tipo
        let emailResult;
        if (tipo === 'verificacion') {
            emailResult = await enviarEmailVerificacion(email, usuario.nombre, codigo);
        } else if (tipo === 'recuperacion') {
            emailResult = await enviarEmailRecuperacion(email, usuario.nombre, codigo);
        }

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Nuevo código enviado a tu email'
            });
        } else {
            res.status(500).json({
                error: 'Error enviando email',
                message: 'No se pudo enviar el email. Intenta de nuevo.'
            });
        }

    } catch (error) {
        console.error('❌ Error reenviando código:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// @route   POST /api/auth/recuperar-password
// @desc    Enviar código de recuperación REAL
// @access  Public
router.post('/recuperar-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email requerido',
                message: 'Debes proporcionar un email'
            });
        }

        const usuario = await User.findOne({ email: email.toLowerCase() });
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'No existe una cuenta con este email'
            });
        }

        // Generar código
        const codigo = generarCodigo();

        // Eliminar códigos de recuperación anteriores
        await VerificationCode.deleteMany({
            email: email.toLowerCase(),
            tipo: 'recuperacion'
        });

        // Crear nuevo código
        const codigoRecuperacion = new VerificationCode({
            email: email.toLowerCase(),
            codigo,
            tipo: 'recuperacion'
        });
        await codigoRecuperacion.save();

        // Enviar email
        const emailResult = await enviarEmailRecuperacion(email, usuario.nombre, codigo);

        if (emailResult.success) {
            console.log('✅ Código de recuperación enviado:', email);
            res.json({
                success: true,
                message: 'Código de recuperación enviado a tu email'
            });
        } else {
            res.status(500).json({
                error: 'Error enviando email',
                message: 'No se pudo enviar el email. Intenta de nuevo.'
            });
        }

    } catch (error) {
        console.error('❌ Error enviando código de recuperación:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// @route   POST /api/auth/resetear-password
// @desc    Resetear contraseña con código REAL
// @access  Public
router.post('/resetear-password', async (req, res) => {
    try {
        const { email, codigo, nuevaPassword } = req.body;

        if (!email || !codigo || !nuevaPassword) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Email, código y nueva contraseña son requeridos'
            });
        }

        if (nuevaPassword.length < 6) {
            return res.status(400).json({
                error: 'Contraseña muy corta',
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Buscar código válido
        const codigoRecuperacion = await VerificationCode.findOne({
            email: email.toLowerCase(),
            codigo: codigo.trim(),
            tipo: 'recuperacion',
            usado: false
        });

        if (!codigoRecuperacion) {
            return res.status(400).json({
                error: 'Código inválido',
                message: 'El código no es válido o ha expirado'
            });
        }

        // Verificar intentos
        if (codigoRecuperacion.intentos >= 3) {
            return res.status(400).json({
                error: 'Demasiados intentos',
                message: 'Has excedido el número máximo de intentos. Solicita un nuevo código.'
            });
        }

        // Marcar código como usado
        codigoRecuperacion.usado = true;
        await codigoRecuperacion.save();

        // Actualizar contraseña
        const usuario = await User.findOne({ email: email.toLowerCase() });
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        usuario.password = nuevaPassword;
        await usuario.save();

        console.log('✅ Contraseña actualizada exitosamente:', email);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error reseteando contraseña:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;