// backend/controllers/productController.js
const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary, updateImageCloudinary } = require('../utils/cloudinary');
const fs = require('fs');

// Crear producto
exports.crearProducto = async (req, res) => {
    let imagenUrl = '';
    let imagenPublicId = '';

    try {
        console.log('🟡 Creando producto:', req.body);
        console.log('🟡 Archivo recibido:', req.file);

        const {
            nombre,
            descripcion,
            categoria,
            precioCompra,
            precioVenta,
            stock,
            stockMinimo,
            tipoGlobo,
            color,
            tamano,
            tipoServicio
        } = req.body;

        // Validaciones básicas
        if (!nombre || !categoria || !precioCompra || !precioVenta) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes',
                message: 'Se requiere: nombre, categoría, precio de compra y precio de venta'
            });
        }

        if (Number(precioCompra) < 0 || Number(precioVenta) < 0) {
            return res.status(400).json({
                error: 'Precios inválidos',
                message: 'Los precios no pueden ser negativos'
            });
        }

        if (Number(precioVenta) < Number(precioCompra)) {
            console.log('⚠️ Advertencia: Precio de venta menor al de compra');
        }

        // Subir imagen si existe
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.path, 'productos');
                imagenUrl = result.url;
                imagenPublicId = result.publicId;
                console.log('✅ Imagen subida a Cloudinary:', imagenUrl);
            } catch (uploadError) {
                console.error('❌ Error al subir imagen:', uploadError);
                throw new Error('Error al subir la imagen: ' + uploadError.message);
            } finally {
                // Limpiar archivo temporal
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Archivo temporal eliminado');
                }
            }
        }

        // Crear producto
        const nuevoProducto = new Product({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim(),
            categoria,
            precioCompra: Number(precioCompra),
            precioVenta: Number(precioVenta),
            stock: Number(stock) || 0,
            stockMinimo: Number(stockMinimo) || 5,
            imagenUrl,
            imagenPublicId,
            // Campos específicos para globos
            tipoGlobo: categoria === 'globos' ? tipoGlobo : undefined,
            color: color?.trim(),
            tamano: categoria === 'globos' ? tamano : undefined,
            // Campo para servicios
            tipoServicio: categoria === 'servicios' ? tipoServicio : undefined
        });

        await nuevoProducto.save();

        console.log('✅ Producto creado:', nuevoProducto.nombre);

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: nuevoProducto
        });

    } catch (error) {
        console.error('❌ Error al crear producto:', error);

        // Limpiar imagen de Cloudinary si hubo error después de subirla
        if (imagenPublicId) {
            try {
                await deleteFromCloudinary(imagenPublicId);
                console.log('🗑️ Imagen eliminada de Cloudinary por error');
            } catch (cleanupError) {
                console.error('❌ Error al limpiar imagen:', cleanupError);
            }
        }

        // Limpiar archivo temporal si existe
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo crear el producto'
        });
    }
};

// Obtener todos los productos
// backend/controllers/productController.js

// Obtener productos con filtros y paginación
exports.obtenerProductos = async (req, res) => {
    try {
        const {
            categoria = 'todos',
            activo,
            buscar,
            stockBajo,
            page = 1,
            limit = 20  // 20 productos por página
        } = req.query;

        // Construir filtros
        const filtros = {};

        if (categoria && categoria !== 'todos') {
            filtros.categoria = categoria;
        }

        if (activo !== undefined) {
            filtros.activo = activo === 'true';
        }

        if (buscar) {
            filtros.$or = [
                { nombre: { $regex: buscar, $options: 'i' } },
                { descripcion: { $regex: buscar, $options: 'i' } }
            ];
        }

        let query = Product.find(filtros);

        // Filtro de stock bajo
        if (stockBajo === 'true') {
            query = query.where('stock').lte(Product.schema.paths.stockMinimo.default);
        }

        // Paginación
        const skip = (page - 1) * limit;
        const productos = await query
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(filtros);

        res.json({
            productos,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener los productos'
        });
    }
};

// Obtener producto por ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Product.findById(id);

        if (!producto) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json({ producto });

    } catch (error) {
        console.error('❌ Error al obtener producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el producto'
        });
    }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            categoria,
            precioCompra,
            precioVenta,
            stock,
            stockMinimo,
            tipoGlobo,
            color,
            tamano,
            tipoServicio,
            activo
        } = req.body;

        // Buscar producto existente
        const producto = await Product.findById(id);
        if (!producto) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        let imagenUrl = producto.imagenUrl;
        let imagenPublicId = producto.imagenPublicId;

        // Manejar nueva imagen si se subió
        if (req.file) {
            try {
                const result = await updateImageCloudinary(
                    req.file.path, 
                    producto.imagenPublicId, 
                    'productos'
                );
                imagenUrl = result.url;
                imagenPublicId = result.publicId;
                console.log('✅ Imagen actualizada:', imagenUrl);
            } catch (uploadError) {
                console.error('❌ Error al actualizar imagen:', uploadError);
                throw new Error('Error al actualizar la imagen: ' + uploadError.message);
            } finally {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            }
        }

        // Actualizar producto
        const productoActualizado = await Product.findByIdAndUpdate(
            id,
            {
                nombre: nombre?.trim(),
                descripcion: descripcion?.trim(),
                categoria,
                precioCompra: precioCompra ? Number(precioCompra) : undefined,
                precioVenta: precioVenta ? Number(precioVenta) : undefined,
                stock: stock !== undefined ? Number(stock) : undefined,
                stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : undefined,
                imagenUrl,
                imagenPublicId,
                tipoGlobo: categoria === 'globos' ? tipoGlobo : undefined,
                color: color?.trim(),
                tamano: categoria === 'globos' ? tamano : undefined,
                tipoServicio: categoria === 'servicios' ? tipoServicio : undefined,
                activo: activo !== undefined ? activo : undefined
            },
            { new: true, runValidators: true }
        );

        console.log('✅ Producto actualizado:', productoActualizado.nombre);

        res.json({
            message: 'Producto actualizado exitosamente',
            producto: productoActualizado
        });

    } catch (error) {
        console.error('❌ Error al actualizar producto:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo actualizar el producto'
        });
    }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Product.findById(id);

        if (!producto) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        // Eliminar imagen de Cloudinary si existe
        if (producto.imagenPublicId) {
            try {
                await deleteFromCloudinary(producto.imagenPublicId);
                console.log('🗑️ Imagen eliminada de Cloudinary');
            } catch (error) {
                console.error('❌ Error al eliminar imagen:', error);
            }
        }

        await Product.findByIdAndDelete(id);

        console.log('✅ Producto eliminado:', producto.nombre);

        res.json({
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo eliminar el producto'
        });
    }
};

// Buscar productos
exports.buscarProductos = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                error: 'Parámetro de búsqueda requerido'
            });
        }

        const productos = await Product.buscarProductos(q);

        res.json({
            productos,
            total: productos.length,
            termino: q
        });

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo realizar la búsqueda'
        });
    }
};

// Obtener productos con stock bajo
exports.productosStockBajo = async (req, res) => {
    try {
        const productos = await Product.find({ activo: true })
            .where('stock').lte(Product.schema.paths.stockMinimo.default || 5)
            .sort({ stock: 1 });

        res.json({
            productos,
            total: productos.length
        });

    } catch (error) {
        console.error('❌ Error al obtener productos con stock bajo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};