// backend/routes/clientes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Validaciones para crear cliente
const validacionCrearCliente = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('telefono')
        .trim()
        .isLength({ min: 8, max: 15 })
        .isNumeric()
        .withMessage('El teléfono debe tener entre 8 y 15 dígitos'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),
    
    body('direccion')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres'),
    
    body('tipoCliente')
        .optional()
        .isIn(['individual', 'frecuente', 'evento', 'empresa'])
        .withMessage('Tipo de cliente no válido'),
    
    body('notas')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
];

// Validaciones para actualizar cliente
const validacionActualizarCliente = [
    param('id')
        .isMongoId()
        .withMessage('ID de cliente no válido'),
    
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('telefono')
        .optional()
        .trim()
        .isLength({ min: 8, max: 15 })
        .isNumeric()
        .withMessage('El teléfono debe tener entre 8 y 15 dígitos'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),
    
    body('direccion')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres'),
    
    body('tipoCliente')
        .optional()
        .isIn(['individual', 'frecuente', 'evento', 'empresa'])
        .withMessage('Tipo de cliente no válido'),
    
    body('notas')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres'),
    
    body('activo')
        .optional()
        .isBoolean()
        .withMessage('Activo debe ser verdadero o falso')
];

// Validaciones para parámetros
const validacionIdCliente = [
    param('id')
        .isMongoId()
        .withMessage('ID de cliente no válido')
];

// Validaciones para búsqueda
const validacionBusqueda = [
    query('q')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Término de búsqueda requerido')
];

// @route   POST /api/clientes
// @desc    Crear nuevo cliente
// @access  Private (requiere permiso de clientes)
router.post('/', 
    authenticateToken,
    requirePermission('clientes'),
    validacionCrearCliente,
    clientController.crearCliente
);

// @route   GET /api/clientes
// @desc    Obtener todos los clientes con filtros y paginación
// @access  Private (requiere permiso de clientes)
router.get('/', 
    authenticateToken,
    requirePermission('clientes'),
    clientController.obtenerClientes
);

// @route   GET /api/clientes/buscar
// @desc    Buscar clientes por nombre, teléfono o email
// @access  Private (requiere permiso de clientes)
router.get('/buscar',
    authenticateToken,
    requirePermission('clientes'),
    validacionBusqueda,
    clientController.buscarClientes
);

// @route   GET /api/clientes/frecuentes
// @desc    Obtener clientes frecuentes
// @access  Private (requiere permiso de clientes)
router.get('/frecuentes',
    authenticateToken,
    requirePermission('clientes'),
    clientController.clientesFrecuentes
);

// @route   GET /api/clientes/inactivos
// @desc    Obtener clientes inactivos
// @access  Private (requiere permiso de clientes)
router.get('/inactivos',
    authenticateToken,
    requirePermission('clientes'),
    clientController.clientesInactivos
);

// @route   GET /api/clientes/:id
// @desc    Obtener cliente por ID
// @access  Private (requiere permiso de clientes)
router.get('/:id',
    authenticateToken,
    requirePermission('clientes'),
    validacionIdCliente,
    clientController.obtenerClientePorId
);

// @route   GET /api/clientes/:id/estadisticas
// @desc    Obtener estadísticas de un cliente específico
// @access  Private (requiere permiso de clientes)
router.get('/:id/estadisticas',
    authenticateToken,
    requirePermission('clientes'),
    validacionIdCliente,
    clientController.estadisticasCliente
);

// @route   PUT /api/clientes/:id
// @desc    Actualizar cliente
// @access  Private (requiere permiso de clientes)
router.put('/:id',
    authenticateToken,
    requirePermission('clientes'),
    validacionActualizarCliente,
    clientController.actualizarCliente
);

// @route   DELETE /api/clientes/:id
// @desc    Eliminar cliente (desactivar)
// @access  Private (requiere permiso de clientes)
router.delete('/:id',
    authenticateToken,
    requirePermission('clientes'),
    validacionIdCliente,
    clientController.eliminarCliente
);

module.exports = router;