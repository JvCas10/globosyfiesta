// backend/routes/pedidos.js
const express = require('express');
const { body, param, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, requirePermission, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validaciones para crear pedido
const validacionCrearPedido = [
    body('cliente.nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('cliente.telefono')
        .trim()
        .isLength({ min: 8, max: 15 })
        .isNumeric()
        .withMessage('El teléfono debe tener entre 8 y 15 dígitos'),
    
    body('cliente.email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),
    
    body('items')
        .isArray({ min: 1 })
        .withMessage('Debe incluir al menos un item'),
    
    body('items.*.producto')
        .isMongoId()
        .withMessage('ID de producto no válido'),
    
    body('items.*.cantidad')
        .isInt({ min: 1 })
        .withMessage('La cantidad debe ser mayor a 0'),
    
    body('notasCliente')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
];

// Validaciones para actualizar estado
const validacionActualizarEstado = [
    param('id')
        .isMongoId()
        .withMessage('ID de pedido no válido'),
    
    body('estado')
        .isIn(['en-proceso', 'cancelado', 'listo-entrega', 'entregado'])
        .withMessage('Estado no válido'),
    
    body('notasAdmin')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
];

// Validaciones para código de seguimiento
const validacionCodigoSeguimiento = [
    param('codigo')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('El código de seguimiento debe ser de 6 dígitos')
];

// RUTAS PÚBLICAS (para clientes)

// @route   POST /api/pedidos
// @desc    Crear nuevo pedido (público)
// @access  Public
router.post('/', 
    validacionCrearPedido,
    orderController.crearPedido
);

// @route   GET /api/pedidos/seguimiento/:codigo
// @desc    Buscar pedido por código de seguimiento (público)
// @access  Public
router.get('/seguimiento/:codigo',
    validacionCodigoSeguimiento,
    orderController.buscarPorCodigo
);

// @route   PUT /api/pedidos/cancelar/:codigo
// @desc    Cancelar pedido por código de seguimiento (público)
// @access  Public
router.put('/cancelar/:codigo',
    validacionCodigoSeguimiento,
    body('motivo')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('El motivo no puede exceder 200 caracteres'),
    orderController.cancelarPedido
);

// RUTAS PRIVADAS (para administradores)

// @route   GET /api/pedidos/admin
// @desc    Obtener todos los pedidos con filtros (admin)
// @access  Private (requiere permiso de ventas)
router.get('/admin',
    authenticateToken,
    requirePermission('ventas'),
    orderController.obtenerPedidos
);

// @route   GET /api/pedidos/admin/estadisticas
// @desc    Obtener estadísticas de pedidos (admin)
// @access  Private (requiere permiso de reportes)
router.get('/admin/estadisticas',
    authenticateToken,
    requirePermission('reportes'),
    orderController.estadisticasPedidos
);

// @route   GET /api/pedidos/admin/:id
// @desc    Obtener pedido por ID (admin)
// @access  Private (requiere permiso de ventas)
router.get('/admin/:id',
    authenticateToken,
    requirePermission('ventas'),
    param('id')
        .isMongoId()
        .withMessage('ID de pedido no válido'),
    orderController.obtenerPedidoPorId
);

// @route   PUT /api/pedidos/admin/:id/estado
// @desc    Actualizar estado del pedido (admin)
// @access  Private (requiere permiso de ventas)
router.put('/admin/:id/estado',
    authenticateToken,
    requirePermission('ventas'),
    validacionActualizarEstado,
    orderController.actualizarEstado
);

module.exports = router;