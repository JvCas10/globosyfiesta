// backend/routes/ventas.js
const express = require('express');
const { body, param, query } = require('express-validator');
const saleController = require('../controllers/saleController');
const { authenticateToken, requirePermission, requirePropietario } = require('../middleware/auth');

const router = express.Router();

// Validaciones para crear venta
const validacionCrearVenta = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Debe incluir al menos un item'),
    
    body('items.*.producto')
        .isMongoId()
        .withMessage('ID de producto no válido'),
    
    body('items.*.cantidad')
        .isInt({ min: 1 })
        .withMessage('La cantidad debe ser mayor a 0'),
    
    body('items.*.precioUnitario')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio unitario debe ser positivo'),
    
    body('cliente')
        .optional()
        .isMongoId()
        .withMessage('ID de cliente no válido'),
    
    body('datosCliente.nombre')
        .if(body('cliente').not().exists())
        .notEmpty()
        .withMessage('Nombre del cliente requerido si no hay cliente registrado'),
    
    body('datosCliente.telefono')
        .if(body('cliente').not().exists())
        .notEmpty()
        .withMessage('Teléfono del cliente requerido si no hay cliente registrado'),
    
    body('descuento')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El descuento debe ser positivo'),
    
    body('metodoPago')
        .optional()
        .isIn(['efectivo', 'tarjeta', 'transferencia', 'mixto'])
        .withMessage('Método de pago no válido'),
    
    body('tipoVenta')
        .optional()
        .isIn(['directa', 'con-servicio', 'solo-servicio'])
        .withMessage('Tipo de venta no válido'),
    
    body('serviciosRealizados.*.tipo')
        .optional()
        .isIn(['inflado', 'decoracion-basica', 'entrega-local', 'arreglo-globos'])
        .withMessage('Tipo de servicio no válido'),
    
    body('serviciosRealizados.*.precio')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio del servicio debe ser positivo')
];

// Validaciones para parámetros
const validacionIdVenta = [
    param('id')
        .isMongoId()
        .withMessage('ID de venta no válido')
];

// Validaciones para fechas
const validacionFechas = [
    query('fechaInicio')
        .isISO8601()
        .withMessage('Fecha de inicio no válida'),
    
    query('fechaFin')
        .isISO8601()
        .withMessage('Fecha de fin no válida')
];

// @route   POST /api/ventas
// @desc    Crear nueva venta
// @access  Private (requiere permiso de ventas)
router.post('/', 
    authenticateToken,
    requirePermission('ventas'),
    validacionCrearVenta,
    saleController.crearVenta
);

// @route   GET /api/ventas
// @desc    Obtener todas las ventas con filtros y paginación
// @access  Private (requiere permiso de ventas)
router.get('/', 
    authenticateToken,
    requirePermission('ventas'),
    saleController.obtenerVentas
);

// @route   GET /api/ventas/del-dia
// @desc    Obtener ventas del día actual o fecha específica
// @access  Private (requiere permiso de ventas)
router.get('/del-dia',
    authenticateToken,
    requirePermission('ventas'),
    saleController.ventasDelDia
);

// @route   GET /api/ventas/estadisticas
// @desc    Obtener estadísticas de ventas por rango de fechas
// @access  Private (requiere permiso de reportes)
router.get('/estadisticas',
    authenticateToken,
    requirePermission('reportes'),
    validacionFechas,
    saleController.estadisticasVentas
);

// @route   GET /api/ventas/:id
// @desc    Obtener venta por ID
// @access  Private (requiere permiso de ventas)
router.get('/:id',
    authenticateToken,
    requirePermission('ventas'),
    validacionIdVenta,
    saleController.obtenerVentaPorId
);

// @route   PUT /api/ventas/:id/cancelar
// @desc    Cancelar venta
// @access  Private (requiere permiso de ventas)
router.put('/:id/cancelar',
    authenticateToken,
    requirePermission('ventas'),
    validacionIdVenta,
    body('motivo')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('El motivo no puede exceder 200 caracteres'),
    saleController.cancelarVenta
);

module.exports = router;