// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generar JWT
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token válido por 7 días
    );
};

// Registro de usuario
exports.registro = async (req, res) => {
    try {
        console.log('🟡 Intento de registro:', req.body);

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { nombre, email, password, telefono, rol } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({
                error: 'Usuario ya existe',
                message: 'Ya existe una cuenta con este email'
            });
        }

        // Verificar si es el primer usuario (será propietario automáticamente)
        const totalUsuarios = await User.countDocuments();
        const rolFinal = totalUsuarios === 0 ? 'propietario' : (rol || 'empleado');

        // Crear nuevo usuario
        const nuevoUsuario = new User({
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            password,
            telefono: telefono?.trim(),
            rol: rolFinal
        });

        // Si es empleado, configurar permisos básicos
        if (rolFinal === 'empleado') {
            nuevoUsuario.permisos = {
                ventas: true,
                productos: false,
                clientes: true,
                servicios: true,
                reportes: false,
                configuracion: false
            };
        }
        if (rolFinal === 'cliente') {
            // Los clientes no tienen permisos administrativos
            nuevoUsuario.permisos = {};
        }
        await nuevoUsuario.save();

        // Generar token
        const token = generateToken(nuevoUsuario._id);

        console.log('✅ Usuario registrado exitosamente:', nuevoUsuario.email);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: nuevoUsuario.datosSegurosPerfil(),
            esPrimerUsuario: totalUsuarios === 0
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el usuario'
        });
    }
};

// Login de usuario
exports.login = async (req, res) => {
    try {
        console.log('🟡 Intento de login:', { email: req.body.email });

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await User.findOne({ email: email.toLowerCase() });
        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar si está activo
        if (!usuario.activo) {
            return res.status(401).json({
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta al administrador'
            });
        }

        // Verificar contraseña
        const passwordValida = await usuario.compararPassword(password);
        if (!passwordValida) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Actualizar último acceso
        await usuario.actualizarUltimoAcceso();

        // Generar token
        const token = generateToken(usuario._id);

        console.log('✅ Login exitoso:', usuario.email);

        res.json({
            message: 'Login exitoso',
            token,
            user: usuario.datosSegurosPerfil()
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo iniciar sesión'
        });
    }
};

// Obtener perfil del usuario autenticado
exports.perfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.user.id).select('-password');

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            user: usuario.datosSegurosPerfil()
        });

    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar perfil
exports.actualizarPerfil = async (req, res) => {
    try {
        const { nombre, telefono, email } = req.body;
        const userId = req.user.id;

        // Verificar si el nuevo email ya existe (si se está cambiando)
        if (email && email.toLowerCase() !== req.user.email) {
            const emailExistente = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: userId }
            });

            if (emailExistente) {
                return res.status(400).json({
                    error: 'Email ya existe',
                    message: 'Ya existe otra cuenta con este email'
                });
            }
        }

        // Actualizar usuario
        const usuarioActualizado = await User.findByIdAndUpdate(
            userId,
            {
                nombre: nombre?.trim(),
                telefono: telefono?.trim(),
                email: email?.toLowerCase().trim()
            },
            { new: true, runValidators: true }
        ).select('-password');

        console.log('✅ Perfil actualizado:', usuarioActualizado.email);

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: usuarioActualizado.datosSegurosPerfil()
        });

    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo actualizar el perfil'
        });
    }
};

// Cambiar contraseña
exports.cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const userId = req.user.id;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Se requiere la contraseña actual y la nueva'
            });
        }

        if (passwordNueva.length < 6) {
            return res.status(400).json({
                error: 'Contraseña muy corta',
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario con contraseña
        const usuario = await User.findById(userId);

        // Verificar contraseña actual
        const passwordValida = await usuario.compararPassword(passwordActual);
        if (!passwordValida) {
            return res.status(401).json({
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual no es correcta'
            });
        }

        // Actualizar contraseña
        usuario.password = passwordNueva;
        await usuario.save();

        console.log('✅ Contraseña cambiada:', usuario.email);

        res.json({
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo cambiar la contraseña'
        });
    }
};

// Verificar token (para mantener sesión)
exports.verificarToken = async (req, res) => {
    try {
        // El middleware ya verificó el token y agregó el usuario
        res.json({
            valid: true,
            user: req.user.datosSegurosPerfil()
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: 'Token inválido'
        });
    }
};

// Registro específico para clientes
// Registro específico para clientes (público)
exports.registroCliente = async (req, res) => {
    try {
        console.log('🟡 Registro de cliente:', req.body);

        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array(),
                message: 'Por favor corrige los errores en el formulario'
            });
        }

        const { nombre, email, password, telefono } = req.body;

        // Verificar si ya existe
        const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({
                error: 'Usuario ya existe',
                message: 'Ya existe una cuenta con este email'
            });
        }

        // Crear cliente (sin permisos administrativos)
        const nuevoCliente = new User({
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            password,
            telefono: telefono.trim(),
            rol: 'cliente',
            activo: true
            // Sin permisos - los clientes no necesitan permisos administrativos
        });

        await nuevoCliente.save();

        // Generar token
        const token = generateToken(nuevoCliente._id);

        console.log('✅ Cliente registrado exitosamente:', nuevoCliente.email);

        res.status(201).json({
            message: 'Cuenta creada exitosamente',
            token,
            user: nuevoCliente.datosSegurosPerfil()
        });

    } catch (error) {
        console.error('❌ Error en registro de cliente:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo crear la cuenta. Inténtalo de nuevo.'
        });
    }
};