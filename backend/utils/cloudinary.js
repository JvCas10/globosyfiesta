// backend/utils/cloudinary.js
const { v2: cloudinary } = require('cloudinary');

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Helper para subir imagen desde archivo temporal
const uploadToCloudinary = async (filePath, folder = 'globos-y-fiesta') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            quality: 'auto',
            fetch_format: 'auto',
            width: 800,
            height: 600,
            crop: 'limit'
        });
        
        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format
        };
    } catch (error) {
        console.error('Error al subir imagen a Cloudinary:', error);
        throw new Error('Error al subir la imagen: ' + error.message);
    }
};

// Helper para eliminar imagen por public_id
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
        throw new Error('Error al eliminar la imagen: ' + error.message);
    }
};

// Helper para actualizar imagen (elimina la anterior y sube nueva)
const updateImageCloudinary = async (newFilePath, oldPublicId, folder = 'globos-y-fiesta') => {
    try {
        // Eliminar imagen anterior si existe
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }
        
        // Subir nueva imagen
        const result = await uploadToCloudinary(newFilePath, folder);
        return result;
    } catch (error) {
        console.error('Error al actualizar imagen en Cloudinary:', error);
        throw new Error('Error al actualizar la imagen: ' + error.message);
    }
};

// Helper para generar URL optimizada
const generateOptimizedUrl = (publicId, options = {}) => {
    const {
        width = 400,
        height = 300,
        quality = 'auto',
        format = 'auto'
    } = options;
    
    return cloudinary.url(publicId, {
        width,
        height,
        crop: 'fill',
        quality,
        format,
        secure: true
    });
};

// Helper para validar formato de imagen
const isValidImageFormat = (mimetype) => {
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validFormats.includes(mimetype);
};

// Helper para validar tamaño de imagen
const isValidImageSize = (size, maxSize = 5 * 1024 * 1024) => { // 5MB por defecto
    return size <= maxSize;
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    updateImageCloudinary,
    generateOptimizedUrl,
    isValidImageFormat,
    isValidImageSize
};