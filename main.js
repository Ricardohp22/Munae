const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./src/database");
//const { globalShortcut } = require("electron");
let currentUserRole = "admin"; // ⚡ Cambiar dinámicamente según login


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  // Al iniciar siempre mostrar login
  win.loadFile("src/login.html");
  // Crear menú personalizado
  const template = [
    {
      label: "Menú",
      submenu: [
        {
          label: "Busqueda",
          click: () => {
            win.loadFile("src/busqueda.html");
          }
        },
        {
          label: "Agregar obra",
          click: () => {
            if (currentUserRole === "admin") {
              win.loadFile("src/index.html");
            } else {
              dialog.showMessageBox(win, {
                type: "warning",
                title: "Acceso denegado",
                message: "Solo los administradores pueden registrar obras."
              });
            }
          }
        }
      ]
    },
    {
      label: "Ver",
      submenu: [
        {
          label: "Toggle DevTools",
          accelerator: "Ctrl+Shift+I",
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        }
      ]
    }

  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Guardamos una referencia para usarla en otros IPC
  global.mainWindow = win;
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

// selleccionar imagenes
ipcMain.handle("seleccionar-imagenes", async (event, opts = {}) => {
  const max = Number(opts.max || 4);
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }]
  });
  if (canceled) return [];
  // devuelve hasta 'max'
  return filePaths.slice(0, max);
});




// Carpeta para guardar imágenes
/* const imgDir = path.join(__dirname, "data/images");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true }); */

// Guardar obra
ipcMain.handle("guardar-obra", async (event, datos) => {
  return new Promise((resolve) => {
    const createdDirs = [];

    // Sanear nombre para carpeta
    const noSig = String(datos.id_sigropam || datos.no_sigropam || "").trim();
    if (!noSig) {
      return resolve({ success: false, error: "no_sigropam es requerido para nombrar las carpetas." });
    }
    const safeNoSig = noSig.replace(/[^A-Za-z0-9_\-]/g, "_");

    // Limitar por seguridad
    const imgsBaja = Array.isArray(datos.imagenes_baja) ? datos.imagenes_baja.slice(0, 4) : [];
    const imgsAlta = Array.isArray(datos.imagenes_alta) ? datos.imagenes_alta.slice(0, 4) : [];

    const imgBaseDir = path.join(__dirname, "data/images");
    if (!fs.existsSync(imgBaseDir)) fs.mkdirSync(imgBaseDir, { recursive: true });

    let bajaDirPath = null;
    let altaDirPath = null;

    // Helper: crea carpeta limpia
    function ensureCleanDir(dirPath) {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true }); // limpiar si existía
      }
      fs.mkdirSync(dirPath, { recursive: true });
      createdDirs.push(dirPath);
    }

    // Copiar imágenes a carpetas (si hay)
    try {
      if (imgsBaja.length > 0) {
        bajaDirPath = path.join(imgBaseDir, `${safeNoSig}_baja`);
        ensureCleanDir(bajaDirPath);
        imgsBaja.forEach((src, idx) => {
          const ext = path.extname(src) || ".jpg";
          const dest = path.join(bajaDirPath, `${safeNoSig}_baja_${idx + 1}${ext}`);
          fs.copyFileSync(src, dest);
        });
      }
      if (imgsAlta.length > 0) {
        altaDirPath = path.join(imgBaseDir, `${safeNoSig}_alta`);
        ensureCleanDir(altaDirPath);
        imgsAlta.forEach((src, idx) => {
          const ext = path.extname(src) || ".jpg";
          const dest = path.join(altaDirPath, `${safeNoSig}_alta_${idx + 1}${ext}`);
          fs.copyFileSync(src, dest);
        });
      }
    } catch (err) {
      // Limpieza
      createdDirs.reverse().forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } });
      console.error("Error copiando imágenes:", err);
      return resolve({ success: false, error: "Error al copiar imágenes" });
    }

    // Ahora la transacción de DB
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

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
          noSig,                               // usa el valor original (no el saneado) para DB
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
          bajaDirPath,                         // 🔹 guardamos carpetas, no archivos
          altaDirPath
        ],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            let userMessage = "Ocurrió un error al guardar la obra";
            if (err.message.includes("UNIQUE constraint failed: obras.no_sigropam")) {
              userMessage = "El número SIGROPAM ya existe en el sistema. Verifique e intente con uno diferente.";
            }
            // Limpieza de carpetas creadas
            createdDirs.reverse().forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } });
            console.error("Error insertando obra:", err.message);
            return resolve({ success: false, error: userMessage });
          }

          const idObra = this.lastID;
          const queryUbicacion = `
            INSERT INTO obra_ubicaciones_topologicas (id_obra, id_ubicacion_topologica, nivel)
            VALUES (?, ?, ?)
          `;
          const ubicaciones = [
            { id: datos.ubi_general, nivel: 1 },
            { id: datos.ubi_sub, nivel: 2 },
            { id: datos.ubi_sub2, nivel: 3 }
          ].filter(u => !!u.id);

          if (ubicaciones.length === 0) {
            db.run("COMMIT");
            return resolve({ success: true, id: idObra });
          }

          let pendientes = ubicaciones.length;
          let huboError = false;

          ubicaciones.forEach(u => {
            db.run(queryUbicacion, [idObra, u.id, u.nivel], (err2) => {
              if (err2) huboError = true;
              pendientes -= 1;

              if (pendientes === 0) {
                if (huboError) {
                  db.run("ROLLBACK");
                  // Limpieza de carpetas creadas
                  createdDirs.reverse().forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } });
                  return resolve({ success: false, error: "Error al guardar ubicaciones" });
                } else {
                  db.run("COMMIT");
                  return resolve({ success: true, id: idObra });
                }
              }
            });
          });
        }
      );
    });
  });
});

//ventana de login
ipcMain.handle("login", async (event, usuario, password) => {
  return new Promise((resolve) => {
    const sql = `SELECT * FROM usuarios WHERE usuario = ?`;
    db.get(sql, [usuario], (err, row) => {
      if (err) {
        resolve({ success: false, error: "Error interno de base de datos" });
      } else if (!row) {
        resolve({ success: false, error: "Usuario no encontrado" });
      } else {
        if (row.password === password) { // ⚠️ luego cambiamos a bcrypt
          // Según el rol, cargar búsqueda
          cargarBusqueda();
          resolve({ success: true, rol: row.rol });
        } else {
          resolve({ success: false, error: "Contraseña incorrecta" });
        }
      }
    });
  });
});

//habilitar registro obrar para admin
ipcMain.handle("abrir-registro", () => {
  cargarRegistro();
});

function cargarBusqueda() {
  if (global.mainWindow) {
    global.mainWindow.loadFile("src/busqueda.html");
  }
}

function cargarRegistro() {
  if (global.mainWindow) {
    global.mainWindow.loadFile("src/index.html"); // tu registro de obras
  }
}

//busqueda
ipcMain.handle("buscar-obras", async (event, filtros) => {
  let condiciones = [];
  let params = [];

  if (filtros.sigropam) {
    condiciones.push("o.no_sigropam LIKE ?");
    params.push(`%${filtros.sigropam}%`);
  }
  if (filtros.autor) {
    condiciones.push("o.id_artista = ?");
    params.push(filtros.autor);
  }

  if (filtros.keyword) {
    condiciones.push("(o.titulo LIKE ? OR o.descripcion LIKE ?)");
    params.push(`%${filtros.keyword}%`, `%${filtros.keyword}%`);
  }
  if (filtros.anio) {
    condiciones.push("o.fecha = ?");
    params.push(filtros.anio);
  }

  // Técnica
  if (filtros.tecnica) {
    condiciones.push("o.id_tecnica = ?");
    params.push(filtros.tecnica);
  }

  // Ubicación topológica (nivel 1)
  if (filtros.topologica) {
    condiciones.push("otu.id_ubicacion_topologica = ? AND otu.nivel = 1");
    params.push(filtros.topologica);
  }

  // Ubicación topográfica
  if (filtros.topografica) {
    condiciones.push("o.id_ubicacion_topografica = ?");
    params.push(filtros.topografica);
  }

  if (filtros.expo) {
    condiciones.push("o.exposiciones LIKE ?");
    params.push(`%${filtros.expo}%`);
  }

  const where = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

  const sql = `
    SELECT o.id_obra, o.titulo, o.descripcion, a.nombre || ' ' || a.apellido_paterno AS autor
    FROM obras o
    JOIN artistas a ON o.id_artista = a.id_artista
    LEFT JOIN obra_ubicaciones_topologicas otu ON o.id_obra = otu.id_obra
    ${where}
    GROUP BY o.id_obra
    ORDER BY o.titulo
  `;

  return await allAsync(sql, params);
});

// Autores
ipcMain.handle("get-filtro-artistas", async () => {
  const sql = `
    SELECT id_artista, nombre, apellido_paterno, apellido_materno
    FROM artistas
    ORDER BY apellido_paterno, apellido_materno, nombre
  `;
  return await allAsync(sql);
});

// Técnicas
ipcMain.handle("get-filtro-tecnicas", async () => {
  const sql = `SELECT id_tecnica, tecnica FROM tecnicas ORDER BY tecnica`;
  return await allAsync(sql);
});

// Ubicación topográfica
ipcMain.handle("get-filtro-topograficas", async () => {
  const sql = `SELECT id_ubicacion_topografica, ubicacion FROM ubicaciones_topograficas ORDER BY ubicacion`;
  return await allAsync(sql);
});

// Ubicación topológica (solo nivel 1)
ipcMain.handle("get-filtro-topologicas", async () => {
  const sql = `
    SELECT DISTINCT ut.id_ubicacion_topologica, ut.ubicacion, tut.tipo
    FROM obra_ubicaciones_topologicas otu
    JOIN ubicaciones_topologicas ut ON otu.id_ubicacion_topologica = ut.id_ubicacion_topologica
    JOIN tipo_ubicaciones_topologicas tut ON ut.id_tipo_ubicacion_topologica = tut.id_tipo_ubicacion_topologica
    WHERE otu.nivel = 1
    ORDER BY tut.tipo, ut.ubicacion
  `;
  return await allAsync(sql);
});

ipcMain.handle("get-ficha-obra", async (event, idObra) => {
  const sql = `
    SELECT o.no_sigropam, 
           o.titulo, 
           o.fecha, 
           o.tiraje, 
           o.medidas_soporte_ancho, 
           o.medidas_soporte_largo, 
           o.medidas_imagen_ancho, 
           o.medidas_imagen_largo,
           o.ubi_topolo_especificacion_manual,
           o.observaciones,
           o.estado_conservacion,
           o.descripcion,
           o.exposiciones,
           o.path_img_baja,
           o.path_img_alta,
           a.nombre AS artista_nombre,
           a.apellido_paterno,
           a.apellido_materno,
           t.tecnica,
           utopo.ubicacion AS ubi_topografica
    FROM obras o
    JOIN artistas a ON o.id_artista = a.id_artista
    LEFT JOIN tecnicas t ON o.id_tecnica = t.id_tecnica
    LEFT JOIN ubicaciones_topograficas utopo ON o.id_ubicacion_topografica = utopo.id_ubicacion_topografica
    WHERE o.id_obra = ?
  `;

  const obra = await allAsync(sql, [idObra]);

  // Ubicación topológica nivel 1 con tipo
  const sqlTopo = `
    SELECT tut.tipo, ut.ubicacion
    FROM obra_ubicaciones_topologicas otu
    JOIN ubicaciones_topologicas ut ON otu.id_ubicacion_topologica = ut.id_ubicacion_topologica
    JOIN tipo_ubicaciones_topologicas tut ON ut.id_tipo_ubicacion_topologica = tut.id_tipo_ubicacion_topologica
    WHERE otu.id_obra = ? AND otu.nivel = 1
  `;
  const ubicacionesTopo = await allAsync(sqlTopo, [idObra]);

  return { ...obra[0], ubicacionesTopo };
});
ipcMain.on("abrir-ficha", (event, idObra) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const fichaWin = new BrowserWindow({
    width: 800,
    height: 600,
    parent: parentWin,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });

  fichaWin.loadFile("src/ficha.html");

  fichaWin.webContents.once("did-finish-load", () => {
    fichaWin.webContents.send("cargar-ficha", idObra);
  });
});

const { pathToFileURL } = require("url");

ipcMain.handle("get-imagenes-carpeta", async (event, folderPath) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) return [];
    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f)) // solo imágenes
      .map(f => pathToFileURL(path.join(folderPath, f)).href); // convertir a file://
    return files;
  } catch (err) {
    console.error("Error leyendo imágenes:", err);
    return [];
  }
});

const PDFDocument = require("pdfkit");
const archiver = require("archiver");

ipcMain.handle("descargar-obra", async (event, idObra) => {
  try {
    // 1. Obtener datos de la obra
    const obra = await allAsync(`
      SELECT o.*, 
             a.nombre AS artista_nombre, 
             a.apellido_paterno, 
             a.apellido_materno, 
             t.tecnica, 
             utopo.ubicacion AS ubi_topografica
      FROM obras o
      JOIN artistas a ON o.id_artista = a.id_artista
      LEFT JOIN tecnicas t ON o.id_tecnica = t.id_tecnica
      LEFT JOIN ubicaciones_topograficas utopo ON o.id_ubicacion_topografica = utopo.id_ubicacion_topografica
      WHERE o.id_obra = ?
    `, [idObra]);

    if (!obra.length) throw new Error("Obra no encontrada");
    const o = obra[0];

    const ubicacionesTopo = await allAsync(`
      SELECT tut.tipo, ut.ubicacion
      FROM obra_ubicaciones_topologicas otu
      JOIN ubicaciones_topologicas ut ON otu.id_ubicacion_topologica = ut.id_ubicacion_topologica
      JOIN tipo_ubicaciones_topologicas tut ON ut.id_tipo_ubicacion_topologica = tut.id_tipo_ubicacion_topologica
      WHERE otu.id_obra = ? AND otu.nivel = 1
    `, [idObra]);

    // 2. Crear dialog para elegir dónde guardar
    const { filePath } = await dialog.showSaveDialog({
      title: "Guardar obra",
      defaultPath: `${o.no_sigropam || "obra"}.zip`,
      filters: [{ name: "ZIP Files", extensions: ["zip"] }]
    });

    if (!filePath) return { success: false, error: "Cancelado por el usuario" };

    // 3. Crear archivo ZIP
    const output = fs.createWriteStream(filePath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);

    // 4. Crear PDF de la ficha
    const pdfPath = path.join(app.getPath("temp"), `${o.no_sigropam}_ficha.pdf`);
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(16).text("Ficha Técnica de Obra", { align: "center" }).moveDown();
      doc.fontSize(12).text(`No. SIGROPAM: ${o.no_sigropam}`);
      doc.text(`Artista: ${o.apellido_paterno || ""} ${o.apellido_materno || ""}, ${o.artista_nombre}`);
      doc.text(`Título: ${o.titulo}`);
      doc.text(`Fecha: ${o.fecha}`);
      doc.text(`Técnica: ${o.tecnica || ""}`);
      doc.text(`Tiraje: ${o.tiraje || ""}`);
      doc.text(`Medidas soporte: ${o.medidas_soporte_ancho} x ${o.medidas_soporte_largo} cm`);
      doc.text(`Medidas imagen: ${o.medidas_imagen_ancho} x ${o.medidas_imagen_largo} cm`);
      doc.text(`Ubicación topológica: ${ubicacionesTopo.map(u => `${u.tipo} - ${u.ubicacion}`).join(", ")}`);
      doc.text(`Ubicación topográfica: ${o.ubi_topografica || ""}`);
      doc.text(`Observaciones: ${o.observaciones || ""}`);
      doc.text(`Estado de conservación: ${o.estado_conservacion || ""}`);
      doc.text(`Descripción: ${o.descripcion || ""}`);
      doc.text(`Exposiciones: ${o.exposiciones || ""}`);

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // 5. Añadir PDF al ZIP
    archive.file(pdfPath, { name: path.basename(pdfPath) });

    // 6. Añadir imágenes de baja y alta resolución
    function addImages(folderPath, folderName) {
      if (folderPath && fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath)
          .filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        files.forEach(f => {
          archive.file(path.join(folderPath, f), { name: `${folderName}/${f}` });
        });
      }
    }

    addImages(o.path_img_baja, "baja_resolucion");
    addImages(o.path_img_alta, "alta_resolucion");

    await archive.finalize();

    return { success: true, filePath };
  } catch (err) {
    console.error("Error descargando obra:", err);
    return { success: false, error: err.message };
  }
});

// Insertar artista
ipcMain.handle("insert-artista", async (event, artista) => {
  const { nombre, apellido_paterno, apellido_materno } = artista;

  return new Promise((resolve) => {
    const sqlCheck = `SELECT COUNT(*) as count FROM artistas 
                      WHERE nombre = ? AND apellido_paterno = ? AND apellido_materno = ?`;
    db.get(sqlCheck, [nombre, apellido_paterno, apellido_materno], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "El artista ya existe." });
      }

      const sqlInsert = `INSERT INTO artistas (nombre, apellido_paterno, apellido_materno) 
                         VALUES (?, ?, ?)`;
      db.run(sqlInsert, [nombre, apellido_paterno, apellido_materno], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al insertar" });
        resolve({ success: true, id: this.lastID });
      });
    });
  });
});

// Abrir ventana para agregar artista
ipcMain.on("abrir-agregar-artista", (event) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const modal = new BrowserWindow({
    width: 400,
    height: 400,
    parent: parentWin,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarArtista.html");
});
ipcMain.on("artista-agregado", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("artista-agregado");
  }
});

// Insertar técnica
ipcMain.handle("insert-tecnica", async (event, tecnica) => {
  return new Promise((resolve) => {
    const sqlCheck = `SELECT COUNT(*) as count FROM tecnicas WHERE tecnica = ?`;
    db.get(sqlCheck, [tecnica], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "La técnica ya existe." });
      }

      const sqlInsert = `INSERT INTO tecnicas (tecnica) VALUES (?)`;
      db.run(sqlInsert, [tecnica], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al insertar" });
        resolve({ success: true, id: this.lastID });
      });
    });
  });
});

// Abrir ventana para agregar técnica
ipcMain.on("abrir-agregar-tecnica", (event) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarTecnica.html");
});

ipcMain.on("tecnica-agregada", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("tecnica-agregada");
  }
});
// Insertar ubicación topográfica
ipcMain.handle("insert-topografica", async (event, ubicacion) => {
  return new Promise((resolve) => {
    const sqlCheck = `SELECT COUNT(*) as count FROM ubicaciones_topograficas WHERE ubicacion = ?`;
    db.get(sqlCheck, [ubicacion], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "La ubicación ya existe." });
      }

      const sqlInsert = `INSERT INTO ubicaciones_topograficas (ubicacion) VALUES (?)`;
      db.run(sqlInsert, [ubicacion], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al insertar" });
        resolve({ success: true, id: this.lastID });
      });
    });
  });
});

// Abrir ventana para agregar ubicación topográfica
ipcMain.on("abrir-agregar-topografica", (event) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarTopografica.html");
});

ipcMain.on("topografica-agregada", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("topografica-agregada");
  }
});




app.whenReady().then(createWindow);

