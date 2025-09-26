const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./src/database");


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true, // obligatorio
      nodeIntegration: false  // seguridad
    },
  });

  win.loadFile("src/index.html");
};

// Helper para convertir callback -> Promise
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Obtener artistas
ipcMain.handle('get-artistas', async () => {
  const sql = `SELECT id_artista, nombre, apellido_paterno, apellido_materno
               FROM artistas
               ORDER BY apellido_paterno, apellido_materno, nombre`;
  return await allAsync(sql);
});

// Obtener técnicas
ipcMain.handle('get-tecnicas', async () => {
  const sql = `SELECT id_tecnica, tecnica FROM tecnicas ORDER BY tecnica`;
  return await allAsync(sql);
});

// Obtener tipos de ubicaciones topológicas
ipcMain.handle('get-tipos-topologicos', async () => {
  const sql = `SELECT id_tipo_ubicacion_topologica, tipo FROM tipo_ubicaciones_topologicas ORDER BY tipo`;
  return await allAsync(sql);
});

// Obtener ubicaciones topológicas por tipo (recibe id_tipo)
ipcMain.handle('get-ubicaciones-topologicas-por-tipo', async (event, id_tipo) => {
  const sql = `SELECT id_ubicacion_topologica, ubicacion
               FROM ubicaciones_topologicas
               WHERE id_tipo_ubicacion_topologica = ?
               ORDER BY ubicacion`;
  return await allAsync(sql, [id_tipo]);
});

// Obtener ubicaciones topográficas
ipcMain.handle('get-ubicaciones-topograficas', async () => {
  const sql = `SELECT id_ubicacion_topografica, ubicacion FROM ubicaciones_topograficas ORDER BY ubicacion`;
  return await allAsync(sql);
});

ipcMain.handle("seleccionar-imagen", async () => {

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "png", "jpeg"] }]
  });

  return canceled ? null : filePaths[0];
});



// Carpeta para guardar imágenes
/* const imgDir = path.join(__dirname, "data/images");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true }); */

// Guardar obra
ipcMain.handle("guardar-obra", async (event, datos) => {
  console.log('guardando obra');
  return new Promise((resolve) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // --- preparar rutas de imágenes ---
      const imgDir = path.join(__dirname, "data/images");
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

      let bajaPath = null;
      let altaPath = null;

      try {
        console.log('datos.imagen', datos.imagen_baja);
        console.log('bajaPath', bajaPath);
        if (datos.imagen_baja) {
          const nombreBaja = Date.now() + "_baja" + path.extname(datos.imagen_baja);
          bajaPath = path.join(imgDir, nombreBaja);
          fs.copyFileSync(datos.imagen_baja, bajaPath);
        }
        if (datos.imagen_alta) {
          const nombreAlta = Date.now() + "_alta" + path.extname(datos.imagen_alta);
          altaPath = path.join(imgDir, nombreAlta);
          fs.copyFileSync(datos.imagen_alta, altaPath);
        }
      } catch (err) {
        console.error("Error copiando imágenes:", err);
        db.run("ROLLBACK");
        resolve({ success: false, error: "Error al copiar imágenes" });
        return;
      }

      // 1) INSERT obra
      const queryObra = `
        INSERT INTO obras (
          no_sigropam,
          id_artista,
          titulo,
          fecha,
          id_tecnica,
          tiraje,
          medidas_soporte_ancho,
          medidas_soporte_largo,
          medidas_imagen_ancho,
          medidas_imagen_largo,
          ubi_topolo_especificacion_manual,
          is_en_prestamo,
          id_ubicacion_topografica,
          observaciones,
          estado_conservacion,
          descripcion,
          exposiciones,
          path_img_baja,
          path_img_alta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        queryObra,
        [
          datos.id_sigropam,                // ⚠️ tu input se llama sigropam; aquí usas id_sigropam. Mantén consistencia.
          datos.id_artista,
          datos.titulo,
          datos.fecha ? Number(datos.fecha) : null,
          datos.id_tecnica || null,
          datos.tiraje || null,
          datos.medidas_soporte_ancho ? Number(datos.medidas_soporte_ancho) : null,
          datos.medidas_soporte_largo ? Number(datos.medidas_soporte_largo) : null,
          datos.medidas_imagen_ancho ? Number(datos.medidas_imagen_ancho) : null,
          datos.medidas_imagen_largo ? Number(datos.medidas_imagen_largo) : null,
          datos.ubi_topo_manual || null,
          datos.is_en_prestamo ? 1 : 0,
          datos.id_ubi_topografica || null,
          datos.observaciones || null,
          datos.estado_conservacion || null,
          datos.descripcion || null,
          datos.exposiciones || null,
          bajaPath,                         // ✅ paths reales ya copiados a /data/images
          altaPath
        ],
        function (err) {
          if (err) {
            console.error("Error insertando obra:", err.message);
            db.run("ROLLBACK");
            resolve({ success: false, error: err.message });
            return;
          }

          const idObra = this.lastID;

          // 2) INSERT ubicaciones topologicas (niveles existentes)
          const queryUbicacion = `
            INSERT INTO obra_ubicaciones_topologicas (id_obra, id_ubicacion_topologica, nivel)
            VALUES (?, ?, ?)
          `;

          const ubicaciones = [
            { id: datos.ubi_general, nivel: 1 },
            { id: datos.ubi_sub, nivel: 2 },
            { id: datos.ubi_sub2, nivel: 3 }
          ];

          let insertsPendientes = 0;
          let huboError = false;

          const finalizar = () => {
            if (huboError) {
              db.run("ROLLBACK");
              resolve({ success: false, error: "Error al guardar ubicaciones" });
            } else {
              db.run("COMMIT");
              resolve({ success: true, id: idObra });
            }
          };

          // Si no hay ninguna ubicación, termina ya
          const ubicacionesValidas = ubicaciones.filter(u => !!u.id);
          if (ubicacionesValidas.length === 0) {
            finalizar();
            return;
          }

          insertsPendientes = ubicacionesValidas.length;

          ubicacionesValidas.forEach((u) => {
            db.run(queryUbicacion, [idObra, u.id, u.nivel], (err2) => {
              if (err2) {
                console.error("Error insertando ubicación:", err2.message);
                huboError = true;
              }
              insertsPendientes -= 1;
              if (insertsPendientes === 0) finalizar();
            });
          });
        }
      );
    });
  });
});





app.whenReady().then(createWindow);
