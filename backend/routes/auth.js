// backend/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

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
        .isLength({ min: 8, max: 15 })
        .isNumeric()
        .withMessage('Debe ser un número de teléfono válido (8-15 dígitos)'),
    
    body('rol')
        .optional()
        .isIn(['propietario', 'empleado'])
        .withMessage('El rol debe ser propietario o empleado')
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
        .isLength({ min: 8, max: 15 })
        .isNumeric()
        .withMessage('Debe ser un número de teléfono válido (8-15 dígitos)')
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

module.exports = router;