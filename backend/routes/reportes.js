// backend/routes/reportes.js
const express = require('express');
const { query } = require('express-validator');
const reportController = require('../controllers/reportController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Validaciones para fechas
const validacionFechas = [
    query('fechaInicio')
        .isISO8601()
        .withMessage('Fecha de inicio no válida (formato: YYYY-MM-DD)'),
    
    query('fechaFin')
        .isISO8601()
        .withMessage('Fecha de fin no válida (formato: YYYY-MM-DD)')
];

// @route   GET /api/reportes/dashboard
// @desc    Dashboard principal con métricas clave
// @access  Private (requiere permiso de reportes)
router.get('/dashboard',
    authenticateToken,
    requirePermission('reportes'),
    reportController.dashboard
);

// @route   GET /api/reportes/ventas
// @desc    Reporte detallado de ventas por rango de fechas
// @access  Private (requiere permiso de reportes)
router.get('/ventas',
    authenticateToken,
    requirePermission('reportes'),
    validacionFechas,
    reportController.reporteVentas
);

// @route   GET /api/reportes/inventario
// @desc    Reporte de inventario por categoría
// @access  Private (requiere permiso de reportes)
router.get('/inventario',
    authenticateToken,
    requirePermission('reportes'),
    reportController.reporteInventario
);

// @route   GET /api/reportes/clientes
// @desc    Reporte de clientes y estadísticas
// @access  Private (requiere permiso de reportes)
router.get('/clientes',
    authenticateToken,
    requirePermission('reportes'),
    reportController.reporteClientes
);

module.exports = router;