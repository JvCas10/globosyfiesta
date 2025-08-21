// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear directorio uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB Atlas - Globos y Fiesta');
    })
    .catch((error) => {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    });

// Rutas básicas
app.get('/', (req, res) => {
    res.json({ 
        message: '🎈 API de Globos y Fiesta funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));
// app.use('/api/servicios', require('./routes/servicios'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        error: 'Algo salió mal en el servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🎈 Sistema: Globos y Fiesta`);
});