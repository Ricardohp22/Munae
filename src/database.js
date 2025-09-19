// src/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la DB
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir); // crea carpeta si no existe
const dbPath = path.join(dbDir, 'munae.db');

const db = new sqlite3.Database(dbPath);

// Crear tabla si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS obras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_sigropam TEXT UNIQUE,
      artista TEXT,
      titulo TEXT,
      fecha TEXT,
      tecnica TEXT,
      tiraje TEXT,
      medidas_soporte TEXT,
      medidas_imagen TEXT,
      ubicacion_topologica TEXT,
      ubicacion_topografica TEXT,
      observaciones TEXT,
      estado_conservacion TEXT,
      descripcion TEXT,
      exposiciones TEXT,
      imagen_baja TEXT,
      imagen_alta TEXT
    )
  `);
});

module.exports = db;
