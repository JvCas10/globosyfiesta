// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware principal de autenticación
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Token de acceso requerido',
                message: 'Debes iniciar sesión para acceder a este recurso'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario en la base de datos
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Token inválido',
                message: 'El usuario no existe'
            });
        }

        if (!user.activo) {
            return res.status(401).json({ 
                error: 'Usuario inactivo',
                message: 'Tu cuenta ha sido desactivada'
            });
        }

        // Agregar usuario a la request
        req.user = user;
        next();

    } catch (error) {
        console.error('❌ Error en autenticación:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado',
                message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
            });
        }

        return res.status(500).json({ 
            error: 'Error del servidor',
            message: 'Error interno en la autenticación'
        });
    }
};

// Middleware para verificar si es propietario
const requirePropietario = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Usuario no autenticado' 
        });
    }

    if (req.user.rol !== 'propietario') {
        return res.status(403).json({ 
            error: 'Acceso denegado',
            message: 'Solo el propietario puede realizar esta acción'
        });
    }

    next();
};

// Middleware para verificar permisos específicos
const requirePermission = (permiso) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado' 
            });
        }

        // El propietario siempre tiene todos los permisos
        if (req.user.rol === 'propietario') {
            return next();
        }

        // Verificar permiso específico
        if (!req.user.tienePermiso(permiso)) {
            return res.status(403).json({ 
                error: 'Acceso denegado',
                message: `No tienes permiso para: ${permiso}`
            });
        }

        next();
    };
};

// Middleware para verificar múltiples roles
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado' 
            });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'Acceso denegado',
                message: `Rol requerido: ${roles.join(' o ')}`
            });
        }

        next();
    };
};

// Middleware opcional - no falla si no hay token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.activo) {
                req.user = user;
            }
        }
    } catch (error) {
        // Ignorar errores en autenticación opcional
        console.log('Info: Autenticación opcional falló, continuando sin usuario');
    }
    
    next();
};

module.exports = {
    authenticateToken,
    requirePropietario,
    requirePermission,
    requireRoles,
    optionalAuth
};