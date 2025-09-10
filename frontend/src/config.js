// frontend/src/config.js
const config = {
  // URL de tu backend ya desplegado
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://globosyfiesta.onrender.com'  // Tu backend en producción
    : 'http://localhost:5000',               // Backend local para desarrollo
    
  // Configuración de axios por defecto
  DEFAULT_TIMEOUT: 30000,
  
  // Otras configuraciones
  ITEMS_PER_PAGE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

export default config;