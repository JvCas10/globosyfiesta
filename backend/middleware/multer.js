// backend/middleware/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isValidImageFormat, isValidImageSize } = require('../utils/cloudinary');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único con timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    console.log('🔍 Validando archivo:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    // Validar formato
    if (!isValidImageFormat(file.mimetype)) {
        return cb(new Error('Formato de archivo no válido. Solo se permiten: JPG, JPEG, PNG, GIF, WEBP'), false);
    }

    cb(null, true);
};

// Configuración principal de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo por vez
    }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('❌ Error de Multer:', error);
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    error: 'Archivo demasiado grande',
                    message: 'El archivo no puede exceder 5MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    error: 'Demasiados archivos',
                    message: 'Solo se permite un archivo por vez'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    error: 'Campo de archivo inesperado',
                    message: 'Nombre de campo de archivo no válido'
                });
            default:
                return res.status(400).json({
                    error: 'Error al subir archivo',
                    message: error.message
                });
        }
    } else if (error) {
        console.error('❌ Error personalizado:', error);
        return res.status(400).json({
            error: 'Error de validación',
            message: error.message
        });
    }
    
    next();
};

// Middleware para limpiar archivos temporales en caso de error
const cleanupTempFile = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Si hay error y existe archivo temporal, eliminarlo
        if (req.file && (res.statusCode >= 400)) {
            try {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Archivo temporal eliminado por error:', req.file.path);
                }
            } catch (cleanupError) {
                console.error('❌ Error al limpiar archivo temporal:', cleanupError);
            }
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

// Middleware específico para productos
const uploadProductImage = upload.single('imagen');

// Middleware combinado que incluye manejo de errores
const productImageUpload = [
    cleanupTempFile,
    uploadProductImage,
    handleMulterError
];

module.exports = {
    upload,
    uploadProductImage,
    productImageUpload,
    handleMulterError,
    cleanupTempFile
};