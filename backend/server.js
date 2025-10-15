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

// CORS configuration - Configuración simplificada que funciona
app.use(cors({
    origin: [
        'https://globosyfiesta.store',
        'https://www.globosyfiesta.store',
        'https://globosyfiesta.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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

        // Parámetros
        const { categoria, buscar, page = 1, limit = 12 } = req.query;

        // Helper local para búsqueda sin tildes
        const buildAccentInsensitivePattern = (input) => {
            if (!input) return '';
            const map = [
                { chars: 'aáàäâã', cls: '[aáàäâã]' },
                { chars: 'eéèëê', cls: '[eéèëê]' },
                { chars: 'iíìïî', cls: '[iíìïî]' },
                { chars: 'oóòöôõ', cls: '[oóòöôõ]' },
                { chars: 'uúùüû', cls: '[uúùüû]' },
                { chars: 'nñ', cls: '[nñ]' }
            ];
            const specials = /[.*+?^${}()|[\]\\]/g;
            const escaped = String(input).replace(specials, '\\$&');
            let out = '';
            for (const ch of escaped) {
                const lower = ch.toLowerCase();
                const entry = map.find(m => m.chars.includes(lower));
                out += entry ? entry.cls : ch;
            }
            return out;
        };

        // Filtros base
        const filtros = { activo: true };
        if (categoria && categoria !== 'todos') {
            filtros.categoria = categoria;
        }
        if (buscar) {
            const pattern = buildAccentInsensitivePattern(buscar);
            const regex = new RegExp(pattern, 'i');
            filtros.$or = [
                { nombre: { $regex: regex } },
                { descripcion: { $regex: regex } }
            ];
        }

        // Paginación
        const skip = (Number(page) - 1) * Number(limit);
        const [productos, total] = await Promise.all([
            Product.find(filtros)
                .select('nombre descripcion categoria precioVenta stock imagenUrl color tamano tipoGlobo')
                .sort({ categoria: 1, nombre: 1 })
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filtros)
        ]);

        res.json({
            success: true,
            productos,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)) || 1,
                totalItems: total,
                itemsPerPage: Number(limit),
                hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
                hasPrevPage: Number(page) > 1
            }
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