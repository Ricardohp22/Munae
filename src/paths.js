// src/paths.js
// Módulo para manejar rutas persistentes en desarrollo y producción
const path = require('path');
const fs = require('fs');
let app = null;

// Función para inicializar el módulo (debe llamarse después de que app esté listo)
function initializeApp(electronApp) {
  app = electronApp;
}

// Obtener la ruta de datos del usuario
// En desarrollo: usa la carpeta del proyecto
// En producción: usa la carpeta de datos del usuario (AppData en Windows)
function getUserDataPath() {
  if (!app) {
    throw new Error('paths module no ha sido inicializado. Llama a initializeApp primero.');
  }
  if (app.isPackaged) {
    // En producción, usar la carpeta de datos del usuario
    return app.getPath('userData');
  } else {
    // En desarrollo, usar la carpeta del proyecto
    return path.join(__dirname, '..');
  }
}

// Ruta de la carpeta de datos (base de datos e imágenes)
function getDataPath() {
  const userDataPath = getUserDataPath();
  const dataPath = path.join(userDataPath, 'data');
  
  // Crear carpeta si no existe
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  
  return dataPath;
}

// Ruta de la base de datos
function getDatabasePath() {
  const dataPath = getDataPath();
  return path.join(dataPath, 'munae.db');
}

// Ruta de la carpeta de imágenes
function getImagesPath() {
  const dataPath = getDataPath();
  const imagesPath = path.join(dataPath, 'images');
  
  // Crear carpeta si no existe
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
  }
  
  return imagesPath;
}

// Función para migrar datos desde la carpeta del proyecto a la carpeta del usuario
// Solo se ejecuta una vez cuando se detecta que hay datos en el proyecto pero no en userData
function migrateDataIfNeeded() {
  if (app.isPackaged) {
    // Solo migrar en producción
    // En producción, usar app.getAppPath() que maneja correctamente el ASAR
    let projectDataPath;
    try {
      // app.getAppPath() devuelve la ruta correcta incluso dentro del ASAR
      const appPath = app.getAppPath();
      projectDataPath = path.join(appPath, 'data');
    } catch (err) {
      console.error('Error obteniendo ruta de la aplicación:', err);
      return; // No migrar si no se puede obtener la ruta
    }
    
    const userDataPath = getDataPath();
    
    // Si existe data en el proyecto pero no en userData, migrar
    if (fs.existsSync(projectDataPath) && !fs.existsSync(path.join(userDataPath, 'munae.db'))) {
      try {
        console.log('Migrando datos desde el proyecto a la carpeta del usuario...');
        console.log('Ruta origen:', projectDataPath);
        console.log('Ruta destino:', userDataPath);
        
        // Copiar base de datos
        const projectDb = path.join(projectDataPath, 'munae.db');
        const userDb = getDatabasePath();
        if (fs.existsSync(projectDb)) {
          fs.copyFileSync(projectDb, userDb);
          console.log('Base de datos migrada correctamente');
        } else {
          console.log('No se encontró base de datos en el proyecto para migrar');
        }
        
        // Copiar imágenes
        const projectImages = path.join(projectDataPath, 'images');
        const userImages = getImagesPath();
        if (fs.existsSync(projectImages)) {
          copyRecursiveSync(projectImages, userImages);
          console.log('Imágenes migradas correctamente');
        } else {
          console.log('No se encontraron imágenes en el proyecto para migrar');
        }
        
        console.log('Migración completada');
      } catch (error) {
        console.error('Error durante la migración:', error);
      }
    } else {
      if (fs.existsSync(path.join(userDataPath, 'munae.db'))) {
        console.log('Base de datos ya existe en userData, no se requiere migración');
      } else {
        console.log('No se encontraron datos en el proyecto para migrar');
      }
    }
  }
}

// Función auxiliar para copiar directorios recursivamente
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  initializeApp,
  getUserDataPath,
  getDataPath,
  getDatabasePath,
  getImagesPath,
  migrateDataIfNeeded
};
