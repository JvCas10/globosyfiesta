// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://globosyfiesta.store',           // Dominio propio
            'https://www.globosyfiesta.store',       // Dominio propio con www
            'https://globosyfiesta.vercel.app',      // Vercel (backup)
            'http://localhost:3000',                 // Para desarrollo local
            'http://localhost:3001',                 // Por si usas otro puerto
            'http://localhost:5173'                  // Vite dev server
        ].filter(Boolean); // Remover valores undefined/null
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Crear directorio uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Conexión a MongoDB con opciones de producción
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ Conectado a MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        // En producción, salir si no se puede conectar a la DB
        process.exit(1);
    }
};

// Conectar a la base de datos
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ruta raíz con información de la API
app.get('/', (req, res) => {
    res.json({
        message: '🎈 API de Globos y Fiesta funcionando correctamente',
        version: '2.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
            admin: {
                auth: '/api/auth',
                productos: '/api/productos',
                ventas: '/api/ventas',
                reportes: '/api/reportes',
                pedidos: '/api/pedidos/admin'
            },
            client: {
                catalog: '/api/catalog',
                orders: '/api/pedidos',
                tracking: '/api/pedidos/seguimiento/:codigo'
            }
        }
    });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/pedidos', require('./routes/pedidos'));

// Ruta pública para el catálogo de productos (para clientes)
app.get('/api/catalog', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const productos = await Product.find({ activo: true })
            .select('nombre descripcion categoria precioVenta stock imagenUrl color tamaño tipoGlobo')
            .sort({ categoria: 1, nombre: 1 });

        res.json({
            success: true,
            productos
        });
    } catch (error) {
        console.error('Error en catálogo público:', error);
        res.status(500).json({
            error: 'Error al cargar el catálogo'
        });
    }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    // No exponer stack traces en producción
    const isDev = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: isDev ? err.message : 'Algo salió mal',
        ...(isDev && { stack: err.stack })
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        suggestion: 'Consulta la documentación de la API en la ruta raíz /'
    });
});

// Configuración del puerto
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV}`);
    console.log(`🎈 Sistema: Globos y Fiesta v2.0`);
    console.log(`📱 Vista Cliente: Catálogo público disponible`);
    console.log(`🔧 Vista Admin: Dashboard y gestión completa`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        mongoose.connection.close();
        process.exit(0);
    });
});

module.exports = app;