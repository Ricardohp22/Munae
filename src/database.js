// src/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = null;

// Función para ejecutar el schema SQL y crear las tablas
function executeSchema(dbInstance, schemaPath) {
  return new Promise((resolve, reject) => {
    // Leer el archivo schema
    let schemaSQL;
    try {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      console.error('Error leyendo el schema SQL:', err);
      return reject(err);
    }

    // Ejecutar el schema
    dbInstance.exec(schemaSQL, (err) => {
      if (err) {
        console.error('Error ejecutando el schema SQL:', err);
        return reject(err);
      }
      console.log('Schema SQL ejecutado correctamente');
      resolve();
    });
  });
}

// Función para obtener la ruta del schema SQL
function getSchemaPath() {
  const { app } = require('electron');
  
  if (app.isPackaged) {
    // En producción, usar app.getAppPath() que maneja correctamente el ASAR
    const appPath = app.getAppPath();
    return path.join(appPath, 'data', 'munae_schema.sql');
  } else {
    // En desarrollo, está en la carpeta del proyecto
    return path.join(__dirname, '..', 'data', 'munae_schema.sql');
  }
}

// Lista de todas las tablas requeridas según el schema
const REQUIRED_TABLES = [
  'artistas',
  'tecnicas',
  'tipo_ubicaciones_topologicas',
  'ubicaciones_topologicas',
  'ubicaciones_topograficas',
  'obras',
  'obra_ubicaciones_topologicas',
  'usuarios',
  'exposiciones'
];

// Función para migrar la tabla exposiciones si tiene el schema antiguo
function migrateExposicionesTable(dbInstance) {
  return new Promise((resolve, reject) => {
    // Verificar si la tabla existe
    dbInstance.get("SELECT name FROM sqlite_master WHERE type='table' AND name='exposiciones'", (err, row) => {
      if (err) {
        console.error('Error verificando tabla exposiciones:', err);
        return resolve(); // No es crítico, continuar
      }
      
      if (!row) {
        // La tabla no existe, se creará con el schema
        return resolve();
      }
      
      // Verificar la estructura de la tabla
      dbInstance.all("PRAGMA table_info(exposiciones)", (err2, columns) => {
        if (err2) {
          console.error('Error obteniendo información de la tabla exposiciones:', err2);
          return resolve();
        }
        
        const columnNames = columns.map(col => col.name);
        const hasIdObra = columnNames.includes('id_obra');
        const hasExposicion = columnNames.includes('exposicion');
        const hasNombre = columnNames.includes('nombre');
        
        // Si tiene 'nombre' pero no 'exposicion' ni 'id_obra', necesita migración
        if (hasNombre && !hasExposicion && !hasIdObra) {
          console.log('⚠️ Detectada tabla exposiciones con schema antiguo. Migrando...');
          
          // Crear tabla temporal con la estructura correcta
          dbInstance.serialize(() => {
            dbInstance.run("BEGIN TRANSACTION");
            
            // Crear nueva tabla con estructura correcta
            dbInstance.run(`
              CREATE TABLE IF NOT EXISTS exposiciones_new (
                id_exposicion INTEGER PRIMARY KEY AUTOINCREMENT,
                id_obra INTEGER NOT NULL,
                exposicion VARCHAR(100) NOT NULL,
                FOREIGN KEY (id_obra) REFERENCES obras(id_obra)
              )
            `, (err3) => {
              if (err3) {
                console.error('Error creando tabla temporal:', err3);
                dbInstance.run("ROLLBACK");
                return resolve();
              }
              
              // Copiar datos si existen (aunque no habrá id_obra, así que se perderán)
              // Esto es solo para preservar la estructura
              dbInstance.run("DROP TABLE exposiciones", (err4) => {
                if (err4) {
                  console.error('Error eliminando tabla antigua:', err4);
                  dbInstance.run("ROLLBACK");
                  return resolve();
                }
                
                dbInstance.run("ALTER TABLE exposiciones_new RENAME TO exposiciones", (err5) => {
                  if (err5) {
                    console.error('Error renombrando tabla:', err5);
                    dbInstance.run("ROLLBACK");
                    return resolve();
                  }
                  
                  dbInstance.run("COMMIT", (err6) => {
                    if (err6) {
                      console.error('Error en commit:', err6);
                      return resolve();
                    }
                    console.log('✅ Tabla exposiciones migrada correctamente');
                    resolve();
                  });
                });
              });
            });
          });
        } else if (!hasExposicion || !hasIdObra) {
          // La tabla existe pero le faltan columnas necesarias
          console.log('⚠️ Tabla exposiciones con estructura incorrecta. Recreando...');
          
          dbInstance.serialize(() => {
            dbInstance.run("BEGIN TRANSACTION");
            dbInstance.run("DROP TABLE IF EXISTS exposiciones", (err7) => {
              if (err7) {
                console.error('Error eliminando tabla:', err7);
                dbInstance.run("ROLLBACK");
                return resolve();
              }
              
              // Recrear con estructura correcta
              dbInstance.run(`
                CREATE TABLE exposiciones (
                  id_exposicion INTEGER PRIMARY KEY AUTOINCREMENT,
                  id_obra INTEGER NOT NULL,
                  exposicion VARCHAR(100) NOT NULL,
                  FOREIGN KEY (id_obra) REFERENCES obras(id_obra)
                )
              `, (err8) => {
                if (err8) {
                  console.error('Error recreando tabla:', err8);
                  dbInstance.run("ROLLBACK");
                  return resolve();
                }
                
                dbInstance.run("COMMIT", (err9) => {
                  if (err9) {
                    console.error('Error en commit:', err9);
                    return resolve();
                  }
                  console.log('✅ Tabla exposiciones recreada correctamente');
                  resolve();
                });
              });
            });
          });
        } else {
          // La tabla ya tiene la estructura correcta
          console.log('✅ Tabla exposiciones tiene la estructura correcta');
          resolve();
        }
      });
    });
  });
}

// Función para verificar que todas las tablas requeridas existan
function verifyTablesExist(dbInstance) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    dbInstance.all(sql, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      const existingTables = rows.map(row => row.name);
      const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        console.warn('Tablas faltantes detectadas:', missingTables);
        console.log('Tablas existentes:', existingTables);
        return resolve({ allExist: false, missing: missingTables, existing: existingTables });
      } else {
        console.log('✅ Todas las tablas requeridas existen:', REQUIRED_TABLES);
        return resolve({ allExist: true, missing: [], existing: existingTables });
      }
    });
  });
}

// Función para inicializar la base de datos
// Debe llamarse después de que app esté listo
function initializeDatabase(getDatabasePathFn) {
  if (db) {
    return db; // Ya está inicializada
  }
  
  // Obtener la ruta de la base de datos
  dbPath = getDatabasePathFn();
  
  // Asegurar que el directorio existe
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Verificar si la base de datos ya existe
  const dbExists = fs.existsSync(dbPath);
  
  // Crear conexión a la base de datos
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error abriendo la base de datos:', err);
      throw err;
    } else {
      console.log('Base de datos conectada en:', dbPath);
    }
  });
  
  // Si la base de datos es nueva, ejecutar el schema inmediatamente
  if (!dbExists) {
    console.log('Base de datos nueva detectada, ejecutando schema...');
    const schemaPath = getSchemaPath();
    console.log('Ejecutando schema desde:', schemaPath);
    
    if (!fs.existsSync(schemaPath)) {
      console.warn(`Advertencia: No se encontró el archivo schema en: ${schemaPath}`);
      console.warn('La base de datos se creará sin tablas. Las tablas se crearán cuando se ejecuten las primeras queries.');
    } else {
      // Ejecutar el schema de forma asíncrona
      executeSchema(db, schemaPath)
        .then(() => {
          // Verificar que todas las tablas se crearon correctamente
          verifyTablesExist(db)
            .then((result) => {
              if (result.allExist) {
                console.log('✅ Base de datos inicializada correctamente con todas las tablas');
              } else {
                console.warn('⚠️ Algunas tablas no se crearon:', result.missing);
              }
            })
            .catch((err) => {
              console.error('Error verificando tablas:', err);
            });
        })
        .catch((err) => {
          console.error('Error al ejecutar el schema:', err);
          console.error('Las tablas pueden no haberse creado correctamente.');
        });
    }
  } else {
    // Verificar que todas las tablas requeridas existan
    verifyTablesExist(db)
      .then((result) => {
        if (result.allExist) {
          console.log('✅ Base de datos verificada: todas las tablas requeridas existen');
          // Verificar estructura de la tabla exposiciones (migración)
          migrateExposicionesTable(db);
        } else {
          console.warn('⚠️ Faltan algunas tablas:', result.missing);
          console.log('Ejecutando schema para crear las tablas faltantes...');
          const schemaPath = getSchemaPath();
          executeSchema(db, schemaPath)
            .then(() => {
              // Verificar nuevamente después de ejecutar el schema
              return verifyTablesExist(db);
            })
            .then((result2) => {
              if (result2.allExist) {
                console.log('✅ Todas las tablas creadas correctamente');
                // Verificar estructura de la tabla exposiciones
                migrateExposicionesTable(db);
              } else {
                console.error('❌ Aún faltan tablas después de ejecutar el schema:', result2.missing);
              }
            })
            .catch((err) => {
              console.error('Error al ejecutar el schema:', err);
            });
        }
      })
      .catch((err) => {
        console.error('Error verificando tablas:', err);
      });
  }
  
  return db;
}

// Función para obtener la instancia de la base de datos
function getDatabase() {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada. Llama a initializeDatabase primero.');
  }
  return db;
}

// Función para obtener la ruta de la base de datos
function getDatabasePath() {
  return dbPath;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  getDatabasePath
};
