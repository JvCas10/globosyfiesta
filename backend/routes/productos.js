// backend/routes/productos.js
const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { productImageUpload } = require('../middleware/multer');

const router = express.Router();

// Validaciones para crear producto
const validacionCrearProducto = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('categoria')
        .isIn(['globos', 'decoraciones', 'articulos-fiesta', 'servicios', 'otros'])
        .withMessage('Categoría no válida'),
    
    body('precioCompra')
        .isFloat({ min: 0 })
        .withMessage('El precio de compra debe ser un número positivo'),
    
    body('precioVenta')
        .isFloat({ min: 0 })
        .withMessage('El precio de venta debe ser un número positivo'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock debe ser un número entero positivo'),
    
    body('stockMinimo')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock mínimo debe ser un número entero positivo'),
    
    // Validaciones específicas para globos
    body('tipoGlobo')
        .if(body('categoria').equals('globos'))
        .isIn(['latex', 'foil', 'metalico', 'transparente', 'biodegradable', 'otros'])
        .withMessage('Tipo de globo no válido'),
    
    body('tamano')
        .if(body('categoria').equals('globos'))
        .isIn(['pequeno', 'mediano', 'grande', 'gigante'])
        .withMessage('Tamano no válido'),
    
    // Validaciones para servicios
    body('tipoServicio')
        .if(body('categoria').equals('servicios'))
        .isIn(['inflado', 'decoracion-basica', 'entrega-local', 'arreglo-globos'])
        .withMessage('Tipo de servicio no válido')
];

// Validaciones para actualizar producto
const validacionActualizarProducto = [
    param('id')
        .isMongoId()
        .withMessage('ID de producto no válido'),
    
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('categoria')
        .optional()
        .isIn(['globos', 'decoraciones', 'articulos-fiesta', 'servicios', 'otros'])
        .withMessage('Categoría no válida'),
    
    body('precioCompra')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio de compra debe ser un número positivo'),
    
    body('precioVenta')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio de venta debe ser un número positivo'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock debe ser un número entero positivo'),
    
    body('stockMinimo')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock mínimo debe ser un número entero positivo'),
    
    body('activo')
        .optional()
        .isBoolean()
        .withMessage('Activo debe ser verdadero o falso')
];

// Validaciones para parámetros
const validacionIdProducto = [
    param('id')
        .isMongoId()
        .withMessage('ID de producto no válido')
];

// Validaciones para búsqueda
const validacionBusqueda = [
    query('q')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Término de búsqueda requerido')
];

// @route   POST /api/productos
// @desc    Crear nuevo producto
// @access  Private (requiere permiso de productos)
router.post('/', 
    authenticateToken,
    requirePermission('productos'),
    productImageUpload,
    validacionCrearProducto,
    productController.crearProducto
);

// @route   GET /api/productos
// @desc    Obtener todos los productos con filtros y paginación
// @access  Private
router.get('/', 
    authenticateToken,
    productController.obtenerProductos
);

// @route   GET /api/productos/buscar
// @desc    Buscar productos por nombre o descripción
// @access  Private
router.get('/buscar',
    authenticateToken,
    validacionBusqueda,
    productController.buscarProductos
);

// @route   GET /api/productos/stock-bajo
// @desc    Obtener productos con stock bajo
// @access  Private (requiere permiso de productos)
router.get('/stock-bajo',
    authenticateToken,
    requirePermission('productos'),
    productController.productosStockBajo
);

// @route   GET /api/productos/:id
// @desc    Obtener producto por ID
// @access  Private
router.get('/:id',
    authenticateToken,
    validacionIdProducto,
    productController.obtenerProductoPorId
);

// @route   PUT /api/productos/:id
// @desc    Actualizar producto
// @access  Private (requiere permiso de productos)
router.put('/:id',
    authenticateToken,
    requirePermission('productos'),
    productImageUpload,
    validacionActualizarProducto,
    productController.actualizarProducto
);

// @route   DELETE /api/productos/:id
// @desc    Eliminar producto
// @access  Private (requiere permiso de productos)
router.delete('/:id',
    authenticateToken,
    requirePermission('productos'),
    validacionIdProducto,
    productController.eliminarProducto
);

module.exports = router;