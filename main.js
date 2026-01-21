const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./src/database");
//const { globalShortcut } = require("electron");
let currentUserRole = null; // Cambiar dinámicamente según login

function setMenuByRole(role, win) {
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
              if (role === "admin") {
                console.log(role);
                win.loadFile("src/index.html");
              } else {
                dialog.showMessageBox(win, {
                  type: "warning",
                  title: "Acceso denegado",
                  message: "Solo los administradores pueden registrar obras."
                });
              }
            }
          },
          {
            type: "separator"
          },
          {
            label: "Cerrar sesión",
            click: () => {
              currentUserRole = null;
              // Limpiar localStorage
              win.webContents.executeJavaScript('localStorage.clear();');
              // Recargar completamente la página de login
              win.loadFile("src/login.html").then(() => {
                // Asegurar que la página esté completamente cargada
                win.webContents.once('did-finish-load', () => {
                  // Limpiar menú o establecer menú por defecto
                  setMenuByRole(null, win);
                });
              });
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
}


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "assets/icon.ico"),
    backgroundColor: '#D4C19C',
    titleBarStyle: 'default',
    // Forzar color de barra de título en Windows (incluso en dark mode)
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#4E232E',
      symbolColor: '#ffffff',
      height: 30
    } : undefined,
    // Deshabilitar dark mode para la ventana
    darkTheme: false,
    // Intentar forzar tema claro en Windows
    ...(process.platform === 'win32' && {
      backgroundColor: '#D4C19C',
      frame: true,
      autoHideMenuBar: false
    }),
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
  });
  
  // Forzar tema claro y color de fondo en Windows después de crear la ventana
  if (process.platform === 'win32') {
    win.setBackgroundColor('#D4C19C');
    // Intentar forzar el color de la barra de título después de que la ventana esté lista
    win.once('ready-to-show', () => {
      win.setBackgroundColor('#D4C19C');
    });
  }

  // Al iniciar siempre mostrar login
  win.loadFile("src/login.html");

// Crear menú personalizado
   /*  const template = [
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
    Menu.setApplicationMenu(menu); */
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

          // Guardar exposiciones si existen
          const exposiciones = Array.isArray(datos.exposiciones) ? datos.exposiciones.filter(e => e && e.trim()) : [];
          const queryExposicion = `
            INSERT INTO exposiciones (id_obra, exposicion)
            VALUES (?, ?)
          `;

          // Si no hay ubicaciones ni exposiciones, hacer commit
          if (ubicaciones.length === 0 && exposiciones.length === 0) {
            db.run("COMMIT");
            return resolve({ success: true, id: idObra });
          }

          let pendientes = ubicaciones.length + exposiciones.length;
          let huboError = false;

          // Guardar ubicaciones topológicas
          ubicaciones.forEach(u => {
            db.run(queryUbicacion, [idObra, u.id, u.nivel], (err2) => {
              if (err2) huboError = true;
              pendientes -= 1;

              if (pendientes === 0) {
                if (huboError) {
                  db.run("ROLLBACK");
                  // Limpieza de carpetas creadas
                  createdDirs.reverse().forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } });
                  return resolve({ success: false, error: "Error al guardar ubicaciones o exposiciones" });
                } else {
                  db.run("COMMIT");
                  return resolve({ success: true, id: idObra });
                }
              }
            });
          });

          // Guardar exposiciones
          exposiciones.forEach(expo => {
            db.run(queryExposicion, [idObra, expo.trim()], (err2) => {
              if (err2) huboError = true;
              pendientes -= 1;

              if (pendientes === 0) {
                if (huboError) {
                  db.run("ROLLBACK");
                  // Limpieza de carpetas creadas
                  createdDirs.reverse().forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } });
                  return resolve({ success: false, error: "Error al guardar ubicaciones o exposiciones" });
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
          currentUserRole = row.rol; 
          console.log(currentUserRole);
          setMenuByRole(currentUserRole, global.mainWindow);
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

// Obtener rol del usuario actual
ipcMain.handle("get-user-role", async () => {
  return currentUserRole;
});

// Eliminar obra (solo admin)
ipcMain.handle("eliminar-obra", async (event, idObra) => {
  return new Promise((resolve) => {
    // Verificar que el usuario sea administrador
    if (currentUserRole !== "admin") {
      return resolve({ success: false, error: "Solo los administradores pueden eliminar obras" });
    }

    // Validar ID
    const id = Number(idObra);
    if (!id || isNaN(id)) {
      return resolve({ success: false, error: "ID de obra inválido" });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1. Obtener rutas de imágenes antes de eliminar
      db.get("SELECT path_img_baja, path_img_alta FROM obras WHERE id_obra = ?", [id], (err, obra) => {
        if (err) {
          db.run("ROLLBACK");
          return resolve({ success: false, error: "Error al obtener datos de la obra" });
        }

        if (!obra) {
          db.run("ROLLBACK");
          return resolve({ success: false, error: "Obra no encontrada" });
        }

        // 2. Eliminar exposiciones asociadas
        db.run("DELETE FROM exposiciones WHERE id_obra = ?", [id], (err) => {
          if (err) {
            db.run("ROLLBACK");
            return resolve({ success: false, error: "Error al eliminar exposiciones" });
          }

          // 3. Eliminar ubicaciones topológicas asociadas
          db.run("DELETE FROM obra_ubicaciones_topologicas WHERE id_obra = ?", [id], (err) => {
            if (err) {
              db.run("ROLLBACK");
              return resolve({ success: false, error: "Error al eliminar ubicaciones topológicas" });
            }

            // 4. Eliminar la obra
            db.run("DELETE FROM obras WHERE id_obra = ?", [id], (err) => {
              if (err) {
                db.run("ROLLBACK");
                return resolve({ success: false, error: "Error al eliminar la obra" });
              }

              // 5. Eliminar carpetas de imágenes
              try {
                if (obra.path_img_baja && fs.existsSync(obra.path_img_baja)) {
                  fs.rmSync(obra.path_img_baja, { recursive: true, force: true });
                }
                if (obra.path_img_alta && fs.existsSync(obra.path_img_alta)) {
                  fs.rmSync(obra.path_img_alta, { recursive: true, force: true });
                }
              } catch (fsErr) {
                console.error("Error al eliminar carpetas de imágenes:", fsErr);
                // No fallar la transacción por esto, solo loguear
              }

              db.run("COMMIT");
              return resolve({ success: true });
            });
          });
        });
      });
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

  // Consulta para contar el total de resultados
  const sqlCount = `
    SELECT COUNT(DISTINCT o.id_obra) as total
    FROM obras o
    JOIN artistas a ON o.id_artista = a.id_artista
    LEFT JOIN obra_ubicaciones_topologicas otu ON o.id_obra = otu.id_obra
    ${where}
  `;

  const countResult = await allAsync(sqlCount, params);
  const total = countResult[0]?.total || 0;

  // Consulta paginada
  const offset = filtros.offset || 0;
  const limit = filtros.limit || 10;

  const sql = `
    SELECT o.id_obra, o.titulo, o.descripcion, a.nombre || ' ' || a.apellido_paterno AS autor
    FROM obras o
    JOIN artistas a ON o.id_artista = a.id_artista
    LEFT JOIN obra_ubicaciones_topologicas otu ON o.id_obra = otu.id_obra
    ${where}
    GROUP BY o.id_obra
    ORDER BY o.titulo
    LIMIT ? OFFSET ?
  `;

  const resultados = await allAsync(sql, [...params, limit, offset]);

  return {
    resultados,
    total,
    pagina: Math.floor(offset / limit) + 1,
    totalPaginas: Math.ceil(total / limit)
  };
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

// Obtener última obra guardada para precargar formulario
ipcMain.handle("get-ultima-obra", async () => {
  const sql = `
    SELECT o.id_obra,
           o.no_sigropam,
           o.id_artista,
           o.titulo,
           o.fecha,
           o.id_tecnica,
           o.tiraje,
           o.medidas_soporte_ancho,
           o.medidas_soporte_largo,
           o.medidas_imagen_ancho,
           o.medidas_imagen_largo,
           o.ubi_topolo_especificacion_manual,
           o.id_ubicacion_topografica,
           o.observaciones,
           o.estado_conservacion,
           o.descripcion
    FROM obras o
    ORDER BY o.id_obra DESC
    LIMIT 1
  `;

  const obras = await allAsync(sql);
  
  if (!obras || obras.length === 0) {
    return null;
  }

  const obra = obras[0];

  // Obtener ubicaciones topológicas por nivel
  const ubicacionesTopo = await allAsync(`
    SELECT id_ubicacion_topologica, nivel
    FROM obra_ubicaciones_topologicas
    WHERE id_obra = ?
    ORDER BY nivel
  `, [obra.id_obra]);

  // Organizar ubicaciones por nivel
  const ubiGeneral = ubicacionesTopo.find(u => u.nivel === 1);
  const ubiSub = ubicacionesTopo.find(u => u.nivel === 2);
  const ubiSub2 = ubicacionesTopo.find(u => u.nivel === 3);

  // Obtener el tipo de cada ubicación topológica
  let ubiGeneralTipo = null;
  let ubiSubTipo = null;
  let ubiSub2Tipo = null;

  if (ubiGeneral) {
    const tipoInfo = await allAsync(`
      SELECT id_tipo_ubicacion_topologica
      FROM ubicaciones_topologicas
      WHERE id_ubicacion_topologica = ?
    `, [ubiGeneral.id_ubicacion_topologica]);
    if (tipoInfo && tipoInfo.length > 0) {
      ubiGeneralTipo = tipoInfo[0].id_tipo_ubicacion_topologica;
    }
  }

  if (ubiSub) {
    const tipoInfo = await allAsync(`
      SELECT id_tipo_ubicacion_topologica
      FROM ubicaciones_topologicas
      WHERE id_ubicacion_topologica = ?
    `, [ubiSub.id_ubicacion_topologica]);
    if (tipoInfo && tipoInfo.length > 0) {
      ubiSubTipo = tipoInfo[0].id_tipo_ubicacion_topologica;
    }
  }

  if (ubiSub2) {
    const tipoInfo = await allAsync(`
      SELECT id_tipo_ubicacion_topologica
      FROM ubicaciones_topologicas
      WHERE id_ubicacion_topologica = ?
    `, [ubiSub2.id_ubicacion_topologica]);
    if (tipoInfo && tipoInfo.length > 0) {
      ubiSub2Tipo = tipoInfo[0].id_tipo_ubicacion_topologica;
    }
  }

  // Obtener exposiciones de la nueva tabla
  const exposiciones = await allAsync(`
    SELECT exposicion
    FROM exposiciones
    WHERE id_obra = ?
    ORDER BY id_exposicion
  `, [obra.id_obra]);

  return {
    ...obra,
    ubi_general_tipo: ubiGeneralTipo,
    ubi_general: ubiGeneral ? ubiGeneral.id_ubicacion_topologica : null,
    ubi_sub_tipo: ubiSubTipo,
    ubi_sub: ubiSub ? ubiSub.id_ubicacion_topologica : null,
    ubi_sub2_tipo: ubiSub2Tipo,
    ubi_sub2: ubiSub2 ? ubiSub2.id_ubicacion_topologica : null,
    exposiciones: exposiciones.map(e => ({ exposicion: e.exposicion }))
  };
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
  
  // Obtener exposiciones de la nueva tabla
  const exposiciones = await allAsync(`
    SELECT exposicion
    FROM exposiciones
    WHERE id_obra = ?
    ORDER BY id_exposicion
  `, [idObra]);

  // Ubicación topológica nivel 1 con tipo
  const sqlTopo = `
    SELECT tut.tipo, ut.ubicacion
    FROM obra_ubicaciones_topologicas otu
    JOIN ubicaciones_topologicas ut ON otu.id_ubicacion_topologica = ut.id_ubicacion_topologica
    JOIN tipo_ubicaciones_topologicas tut ON ut.id_tipo_ubicacion_topologica = tut.id_tipo_ubicacion_topologica
    WHERE otu.id_obra = ? AND otu.nivel = 1
  `;
  const ubicacionesTopo = await allAsync(sqlTopo, [idObra]);

  return { 
    ...obra[0], 
    ubicacionesTopo,
    exposiciones: exposiciones.map(e => e.exposicion)
  };
});
ipcMain.on("abrir-ficha", (event, idObra) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const fichaWin = new BrowserWindow({
    width: 800,
    height: 600,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
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

    // Obtener exposiciones de la nueva tabla
    const exposiciones = await allAsync(`
      SELECT exposicion
      FROM exposiciones
      WHERE id_obra = ?
      ORDER BY id_exposicion
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
      doc.text(`Exposiciones: ${exposiciones.length > 0 ? exposiciones.map(e => e.exposicion).join(", ") : ""}`);

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
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarArtista.html");
});

// Abrir ventana para editar artista
ipcMain.on("abrir-editar-artista", async (event, idArtista) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const artistaId = Number(idArtista);

  if (!Number.isInteger(artistaId) || artistaId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar artista",
      message: "Seleccione un artista válido para editar."
    });
    return;
  }

  // Obtener datos del artista
  const artista = await allAsync(
    "SELECT nombre, apellido_paterno, apellido_materno FROM artistas WHERE id_artista = ?",
    [artistaId]
  );

  if (!artista || artista.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar artista",
      message: "El artista seleccionado no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 400,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/editarArtista.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-datos-artista", artistaId, artista[0]);
  });
});

// Actualizar artista
ipcMain.handle("update-artista", async (event, idArtista, datos) => {
  return new Promise((resolve) => {
    const { nombre, apellido_paterno, apellido_materno } = datos;

    // Verificar que no exista otro artista con los mismos datos (excepto el actual)
    const sqlCheck = `SELECT COUNT(*) as count FROM artistas 
                      WHERE nombre = ? AND apellido_paterno = ? AND apellido_materno = ?
                      AND id_artista != ?`;
    db.get(sqlCheck, [nombre, apellido_paterno, apellido_materno, idArtista], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "Ya existe otro artista con estos datos." });
      }

      const sqlUpdate = `UPDATE artistas 
                         SET nombre = ?, apellido_paterno = ?, apellido_materno = ?
                         WHERE id_artista = ?`;
      db.run(sqlUpdate, [nombre, apellido_paterno, apellido_materno, idArtista], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al actualizar" });
        resolve({ success: true });
      });
    });
  });
});

//Eliminar artista
ipcMain.on("eliminar-artista", (event, idArtista) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const artistaId = Number(idArtista);

  // Validaciones básicas
  if (!Number.isInteger(artistaId) || artistaId <= 0) {
    dialog.showMessageBox(win, {
      type: "warning",
      title: "Eliminar artista",
      message: "Seleccione un artista válido antes de eliminar."
    });
    return;
  }

  // Verificar existencia del artista
  db.get(
    "SELECT id_artista FROM artistas WHERE id_artista = ?",
    [artistaId],
    (err, row) => {
      if (err) {
        console.error("Error buscando artista:", err);
        dialog.showMessageBox(win, {
          type: "error",
          title: "Eliminar artista",
          message: "Error al validar el artista. Intente de nuevo."
        });
        return;
      }

      if (!row) {
        dialog.showMessageBox(win, {
          type: "warning",
          title: "Eliminar artista",
          message: "El artista seleccionado no existe."
        });
        return;
      }

      // Obtener nombre del artista para la confirmación
      db.get(
        "SELECT nombre, apellido_paterno, apellido_materno FROM artistas WHERE id_artista = ?",
        [artistaId],
        (errNombre, rowNombre) => {
          if (errNombre) {
            console.error("Error obteniendo nombre del artista:", errNombre);
            dialog.showMessageBox(win, {
              type: "error",
              title: "Eliminar artista",
              message: "Error al obtener información del artista."
            });
            return;
          }

          const nombreArtista = rowNombre 
            ? `${rowNombre.apellido_paterno || ''} ${rowNombre.apellido_materno || ''}, ${rowNombre.nombre}`.trim()
            : "este artista";

          // Verificar que no tenga obras asociadas
          db.get(
            "SELECT COUNT(*) AS cnt FROM obras WHERE id_artista = ?",
            [artistaId],
            (err2, rowCnt) => {
              if (err2) {
                console.error("Error verificando obras del artista:", err2);
                dialog.showMessageBox(win, {
                  type: "error",
                  title: "Eliminar artista",
                  message: "No se pudo validar si el artista tiene obras registradas."
                });
                return;
              }

              if (rowCnt && rowCnt.cnt > 0) {
                dialog.showMessageBox(win, {
                  type: "warning",
                  title: "Eliminar artista",
                  message: `No se puede eliminar este artista porque tiene ${rowCnt.cnt} obra(s) asociada(s) en el sistema. Por favor, elimine o modifique las obras primero.`
                });
                return;
              }

              // Mostrar confirmación antes de eliminar
              dialog.showMessageBox(win, {
                type: "warning",
                title: "Confirmar eliminación",
                message: `¿Está seguro que desea eliminar a ${nombreArtista}?`,
                buttons: ["Cancelar", "Eliminar"],
                defaultId: 0,
                cancelId: 0
              }).then((result) => {
                // Si el usuario canceló (índice 0) o cerró el diálogo
                if (result.response === 0) {
                  return;
                }

                // Eliminar artista
                db.run(
                  "DELETE FROM artistas WHERE id_artista = ?",
                  [artistaId],
                  function (err3) {
                    if (err3) {
                      console.error("Error eliminando artista:", err3);
                      dialog.showMessageBox(win, {
                        type: "error",
                        title: "Eliminar artista",
                        message: "Ocurrió un error al eliminar el artista."
                      });
                      return;
                    }

                    dialog.showMessageBox(win, {
                      type: "info",
                      title: "Eliminar artista",
                      message: "Artista eliminado correctamente."
                    });

                    // Reutilizamos el evento existente para refrescar el combo
                    if (global.mainWindow) {
                      global.mainWindow.webContents.send("artista-agregado");
                    }
                  }
                );
              }).catch((err) => {
                console.error("Error en diálogo de confirmación:", err);
              });
            }
          );
        }
      );
    }
  );
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
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarTecnica.html");
});

// Abrir ventana para editar técnica
ipcMain.on("abrir-editar-tecnica", async (event, idTecnica) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const tecnicaId = Number(idTecnica);

  if (!Number.isInteger(tecnicaId) || tecnicaId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar técnica",
      message: "Seleccione una técnica válida para editar."
    });
    return;
  }

  // Obtener datos de la técnica
  const tecnica = await allAsync(
    "SELECT tecnica FROM tecnicas WHERE id_tecnica = ?",
    [tecnicaId]
  );

  if (!tecnica || tecnica.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar técnica",
      message: "La técnica seleccionada no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/editarTecnica.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-datos-tecnica", tecnicaId, tecnica[0]);
  });
});

// Actualizar técnica
ipcMain.handle("update-tecnica", async (event, idTecnica, tecnica) => {
  return new Promise((resolve) => {
    // Verificar que no exista otra técnica con el mismo nombre (excepto la actual)
    const sqlCheck = `SELECT COUNT(*) as count FROM tecnicas WHERE tecnica = ? AND id_tecnica != ?`;
    db.get(sqlCheck, [tecnica, idTecnica], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "Ya existe otra técnica con este nombre." });
      }

      const sqlUpdate = `UPDATE tecnicas SET tecnica = ? WHERE id_tecnica = ?`;
      db.run(sqlUpdate, [tecnica, idTecnica], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al actualizar" });
        resolve({ success: true });
      });
    });
  });
});

ipcMain.on("tecnica-agregada", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("tecnica-agregada");
  }
});

// Eliminar técnica
ipcMain.on("eliminar-tecnica", (event, idTecnica) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const tecnicaId = Number(idTecnica);

  // Validaciones básicas
  if (!Number.isInteger(tecnicaId) || tecnicaId <= 0) {
    dialog.showMessageBox(win, {
      type: "warning",
      title: "Eliminar técnica",
      message: "Seleccione una técnica válida antes de eliminar."
    });
    return;
  }

  // Verificar existencia de la técnica
  db.get(
    "SELECT tecnica FROM tecnicas WHERE id_tecnica = ?",
    [tecnicaId],
    (err, row) => {
      if (err) {
        console.error("Error buscando técnica:", err);
        dialog.showMessageBox(win, {
          type: "error",
          title: "Eliminar técnica",
          message: "Error al validar la técnica. Intente de nuevo."
        });
        return;
      }

      if (!row) {
        dialog.showMessageBox(win, {
          type: "warning",
          title: "Eliminar técnica",
          message: "La técnica seleccionada no existe."
        });
        return;
      }

      const nombreTecnica = row.tecnica;

      // Verificar que no tenga obras asociadas
      db.get(
        "SELECT COUNT(*) AS cnt FROM obras WHERE id_tecnica = ?",
        [tecnicaId],
        (err2, rowCnt) => {
          if (err2) {
            console.error("Error verificando obras de la técnica:", err2);
            dialog.showMessageBox(win, {
              type: "error",
              title: "Eliminar técnica",
              message: "No se pudo validar si la técnica tiene obras registradas."
            });
            return;
          }

          if (rowCnt && rowCnt.cnt > 0) {
            dialog.showMessageBox(win, {
              type: "warning",
              title: "Eliminar técnica",
              message: `No se puede eliminar esta técnica porque tiene ${rowCnt.cnt} obra(s) asociada(s) en el sistema. Por favor, elimine o modifique las obras primero.`
            });
            return;
          }

          // Mostrar confirmación antes de eliminar
          dialog.showMessageBox(win, {
            type: "warning",
            title: "Confirmar eliminación",
            message: `¿Está seguro que desea eliminar la técnica "${nombreTecnica}"?`,
            buttons: ["Cancelar", "Eliminar"],
            defaultId: 0,
            cancelId: 0
          }).then((result) => {
            if (result.response === 0) {
              return;
            }

            // Eliminar técnica
            db.run(
              "DELETE FROM tecnicas WHERE id_tecnica = ?",
              [tecnicaId],
              function (err3) {
                if (err3) {
                  console.error("Error eliminando técnica:", err3);
                  dialog.showMessageBox(win, {
                    type: "error",
                    title: "Eliminar técnica",
                    message: "Ocurrió un error al eliminar la técnica."
                  });
                  return;
                }

                dialog.showMessageBox(win, {
                  type: "info",
                  title: "Eliminar técnica",
                  message: "Técnica eliminada correctamente."
                });

                // Refrescar el combo
                if (global.mainWindow) {
                  global.mainWindow.webContents.send("tecnica-agregada");
                }
              }
            );
          }).catch((err) => {
            console.error("Error en diálogo de confirmación:", err);
          });
        }
      );
    }
  );
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
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarTopografica.html");
});

// Abrir ventana para editar ubicación topográfica
ipcMain.on("abrir-editar-topografica", async (event, idTopografica) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const topograficaId = Number(idTopografica);

  if (!Number.isInteger(topograficaId) || topograficaId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar ubicación topográfica",
      message: "Seleccione una ubicación topográfica válida para editar."
    });
    return;
  }

  // Obtener datos de la ubicación topográfica
  const topografica = await allAsync(
    "SELECT ubicacion FROM ubicaciones_topograficas WHERE id_ubicacion_topografica = ?",
    [topograficaId]
  );

  if (!topografica || topografica.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar ubicación topográfica",
      message: "La ubicación topográfica seleccionada no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/editarTopografica.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-datos-topografica", topograficaId, topografica[0]);
  });
});

// Actualizar ubicación topográfica
ipcMain.handle("update-topografica", async (event, idTopografica, ubicacion) => {
  return new Promise((resolve) => {
    // Verificar que no exista otra ubicación topográfica con el mismo nombre (excepto la actual)
    const sqlCheck = `SELECT COUNT(*) as count FROM ubicaciones_topograficas WHERE ubicacion = ? AND id_ubicacion_topografica != ?`;
    db.get(sqlCheck, [ubicacion, idTopografica], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "Ya existe otra ubicación topográfica con este nombre." });
      }

      const sqlUpdate = `UPDATE ubicaciones_topograficas SET ubicacion = ? WHERE id_ubicacion_topografica = ?`;
      db.run(sqlUpdate, [ubicacion, idTopografica], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al actualizar" });
        resolve({ success: true });
      });
    });
  });
});

ipcMain.on("topografica-agregada", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("topografica-agregada");
  }
});

// Eliminar tipo de ubicación topológica (borra sus ubicaciones si no están en uso)
ipcMain.on("eliminar-tipo-topologico", (event, idTipo) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const tipoId = Number(idTipo);

  if (!Number.isInteger(tipoId) || tipoId <= 0) {
    dialog.showMessageBox(win, {
      type: "warning",
      title: "Eliminar tipo",
      message: "Seleccione un tipo de ubicación válido antes de eliminar."
    });
    return;
  }

  // Verificar existencia y nombre
  db.get(
    "SELECT tipo FROM tipo_ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?",
    [tipoId],
    (err, rowTipo) => {
      if (err) {
        console.error("Error buscando tipo topológico:", err);
        dialog.showMessageBox(win, {
          type: "error",
          title: "Eliminar tipo",
          message: "Error al validar el tipo. Intente de nuevo."
        });
        return;
      }

      if (!rowTipo) {
        dialog.showMessageBox(win, {
          type: "warning",
          title: "Eliminar tipo",
          message: "El tipo seleccionado no existe."
        });
        return;
      }

      const nombreTipo = rowTipo.tipo;

      // Verificar si alguna ubicación de este tipo está usada en obras
      const sqlUso = `
        SELECT COUNT(*) AS cnt
        FROM obra_ubicaciones_topologicas
        WHERE id_ubicacion_topologica IN (
          SELECT id_ubicacion_topologica FROM ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?
        )
      `;
      db.get(sqlUso, [tipoId], (errUso, rowUso) => {
        if (errUso) {
          console.error("Error verificando uso de ubicaciones del tipo:", errUso);
          dialog.showMessageBox(win, {
            type: "error",
            title: "Eliminar tipo",
            message: "No se pudo validar si las ubicaciones de este tipo están asociadas a obras."
          });
          return;
        }

        if (rowUso && rowUso.cnt > 0) {
          dialog.showMessageBox(win, {
            type: "warning",
            title: "Eliminar tipo",
            message: `No se puede eliminar este tipo de ubicación topológica porque tiene ${rowUso.cnt} obra(s) asociada(s) en el sistema. Por favor, elimine o modifique las obras primero.`
          });
          return;
        }

        dialog.showMessageBox(win, {
          type: "warning",
          title: "Confirmar eliminación",
          message: `¿Eliminar el tipo "${nombreTipo}" y todas sus ubicaciones asociadas?`,
          buttons: ["Cancelar", "Eliminar"],
          defaultId: 0,
          cancelId: 0
        }).then((result) => {
          if (result.response === 0) return;

          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run(
              "DELETE FROM ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?",
              [tipoId],
              (errDelUbi) => {
                if (errDelUbi) {
                  console.error("Error eliminando ubicaciones del tipo:", errDelUbi);
                  db.run("ROLLBACK");
                  dialog.showMessageBox(win, {
                    type: "error",
                    title: "Eliminar tipo",
                    message: "Error al eliminar las ubicaciones asociadas."
                  });
                  return;
                }

                db.run(
                  "DELETE FROM tipo_ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?",
                  [tipoId],
                  (errDelTipo) => {
                    if (errDelTipo) {
                      console.error("Error eliminando tipo topológico:", errDelTipo);
                      db.run("ROLLBACK");
                      dialog.showMessageBox(win, {
                        type: "error",
                        title: "Eliminar tipo",
                        message: "Error al eliminar el tipo de ubicación."
                      });
                      return;
                    }

                    db.run("COMMIT");
                    dialog.showMessageBox(win, {
                      type: "info",
                      title: "Eliminar tipo",
                      message: "Tipo y ubicaciones eliminados correctamente."
                    });

                    if (global.mainWindow) {
                      global.mainWindow.webContents.send("ubicacion-topologica-agregada");
                    }
                  }
                );
              }
            );
          });
        }).catch((errConf) => {
          console.error("Error en confirmación de eliminar tipo:", errConf);
        });
      });
    }
  );
});

// Eliminar ubicación topográfica
ipcMain.on("eliminar-topografica", (event, idTopografica) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const topograficaId = Number(idTopografica);

  // Validaciones básicas
  if (!Number.isInteger(topograficaId) || topograficaId <= 0) {
    dialog.showMessageBox(win, {
      type: "warning",
      title: "Eliminar ubicación topográfica",
      message: "Seleccione una ubicación topográfica válida antes de eliminar."
    });
    return;
  }

  // Verificar existencia de la ubicación topográfica
  db.get(
    "SELECT ubicacion FROM ubicaciones_topograficas WHERE id_ubicacion_topografica = ?",
    [topograficaId],
    (err, row) => {
      if (err) {
        console.error("Error buscando ubicación topográfica:", err);
        dialog.showMessageBox(win, {
          type: "error",
          title: "Eliminar ubicación topográfica",
          message: "Error al validar la ubicación topográfica. Intente de nuevo."
        });
        return;
      }

      if (!row) {
        dialog.showMessageBox(win, {
          type: "warning",
          title: "Eliminar ubicación topográfica",
          message: "La ubicación topográfica seleccionada no existe."
        });
        return;
      }

      const nombreTopografica = row.ubicacion;

      // Verificar que no tenga obras asociadas
      db.get(
        "SELECT COUNT(*) AS cnt FROM obras WHERE id_ubicacion_topografica = ?",
        [topograficaId],
        (err2, rowCnt) => {
          if (err2) {
            console.error("Error verificando obras de la ubicación topográfica:", err2);
            dialog.showMessageBox(win, {
              type: "error",
              title: "Eliminar ubicación topográfica",
              message: "No se pudo validar si la ubicación topográfica tiene obras registradas."
            });
            return;
          }

          if (rowCnt && rowCnt.cnt > 0) {
            dialog.showMessageBox(win, {
              type: "warning",
              title: "Eliminar ubicación topográfica",
              message: `No se puede eliminar esta ubicación topográfica porque tiene ${rowCnt.cnt} obra(s) asociada(s) en el sistema. Por favor, elimine o modifique las obras primero.`
            });
            return;
          }

          // Mostrar confirmación antes de eliminar
          dialog.showMessageBox(win, {
            type: "warning",
            title: "Confirmar eliminación",
            message: `¿Está seguro que desea eliminar la ubicación topográfica "${nombreTopografica}"?`,
            buttons: ["Cancelar", "Eliminar"],
            defaultId: 0,
            cancelId: 0
          }).then((result) => {
            if (result.response === 0) {
              return;
            }

            // Eliminar ubicación topográfica
            db.run(
              "DELETE FROM ubicaciones_topograficas WHERE id_ubicacion_topografica = ?",
              [topograficaId],
              function (err3) {
                if (err3) {
                  console.error("Error eliminando ubicación topográfica:", err3);
                  dialog.showMessageBox(win, {
                    type: "error",
                    title: "Eliminar ubicación topográfica",
                    message: "Ocurrió un error al eliminar la ubicación topográfica."
                  });
                  return;
                }

                dialog.showMessageBox(win, {
                  type: "info",
                  title: "Eliminar ubicación topográfica",
                  message: "Ubicación topográfica eliminada correctamente."
                });

                // Refrescar el combo
                if (global.mainWindow) {
                  global.mainWindow.webContents.send("topografica-agregada");
                }
              }
            );
          }).catch((err) => {
            console.error("Error en diálogo de confirmación:", err);
          });
        }
      );
    }
  );
});

// Insertar ubicaciones topológicas
ipcMain.handle("insert-ubicacion-topologica", async (event, data) => {
  const { tipo, ubicaciones } = data; // ubicaciones = array de strings
  return new Promise((resolve) => {
    // 1. Insertar/validar tipo
    const sqlTipo = `INSERT OR IGNORE INTO tipo_ubicaciones_topologicas (tipo) VALUES (?)`;
    db.run(sqlTipo, [tipo], function (err) {
      if (err) return resolve({ success: false, error: "Error en tipo" });

      // Recuperar id_tipo (sea recién insertado o existente)
      db.get(
        `SELECT id_tipo_ubicacion_topologica FROM tipo_ubicaciones_topologicas WHERE tipo = ?`,
        [tipo],
        (err2, row) => {
          if (err2 || !row)
            return resolve({ success: false, error: "No se pudo obtener el tipo" });

          const idTipo = row.id_tipo_ubicacion_topologica;

          // 2. Insertar ubicaciones (evitar duplicados)
          let pendientes = ubicaciones.length;
          let errores = false;

          ubicaciones.forEach((u) => {
            const sqlCheck = `SELECT COUNT(*) as count 
                              FROM ubicaciones_topologicas 
                              WHERE id_tipo_ubicacion_topologica = ? AND ubicacion = ?`;
            db.get(sqlCheck, [idTipo, u.trim()], (err3, row2) => {
              if (err3) errores = true;
              if (row2.count === 0) {
                db.run(
                  `INSERT INTO ubicaciones_topologicas (id_tipo_ubicacion_topologica, ubicacion) VALUES (?, ?)`,
                  [idTipo, u.trim()]
                );
              }
              pendientes--;
              if (pendientes === 0) {
                if (errores) resolve({ success: false, error: "Error insertando ubicaciones" });
                else resolve({ success: true });
              }
            });
          });
        }
      );
    });
  });
});

// Abrir ventana para agregar ubicaciones topológicas
ipcMain.on("abrir-agregar-ubicacion-topologica", (event) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const modal = new BrowserWindow({
    width: 500,
    height: 400,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true,
    },
  });
  modal.loadFile("src/agregarUbicacionTopologica.html");
});

// Abrir ventana para agregar ubicación topológica individual
ipcMain.on("abrir-agregar-ubicacion-topologica-individual", async (event, idTipo) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const tipoId = Number(idTipo);

  if (!Number.isInteger(tipoId) || tipoId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Agregar ubicación topológica",
      message: "Seleccione un tipo de ubicación topológica válido."
    });
    return;
  }

  // Verificar que el tipo existe
  const tipo = await allAsync(
    "SELECT tipo FROM tipo_ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?",
    [tipoId]
  );

  if (!tipo || tipo.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Agregar ubicación topológica",
      message: "El tipo seleccionado no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/agregarUbicacionTopologicaIndividual.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-tipo-para-agregar", tipoId);
  });
});

// Insertar ubicación topológica individual
ipcMain.handle("insert-ubicacion-topologica-individual", async (event, idTipo, ubicacion) => {
  return new Promise((resolve) => {
    // Verificar que no exista otra ubicación con el mismo nombre en el mismo tipo
    const sqlCheck = `SELECT COUNT(*) as count 
                      FROM ubicaciones_topologicas 
                      WHERE id_tipo_ubicacion_topologica = ? AND ubicacion = ?`;
    db.get(sqlCheck, [idTipo, ubicacion.trim()], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "Ya existe una ubicación con este nombre en este tipo." });
      }

      const sqlInsert = `INSERT INTO ubicaciones_topologicas (id_tipo_ubicacion_topologica, ubicacion) VALUES (?, ?)`;
      db.run(sqlInsert, [idTipo, ubicacion.trim()], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al insertar" });
        resolve({ success: true, id: this.lastID });
      });
    });
  });
});

// Abrir ventana para editar ubicación topológica individual
ipcMain.on("abrir-editar-ubicacion-topologica-individual", async (event, idUbicacion) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const ubicacionId = Number(idUbicacion);

  if (!Number.isInteger(ubicacionId) || ubicacionId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar ubicación topológica",
      message: "Seleccione una ubicación topológica válida para editar."
    });
    return;
  }

  // Obtener datos de la ubicación topológica
  const ubicacion = await allAsync(
    "SELECT ubicacion FROM ubicaciones_topologicas WHERE id_ubicacion_topologica = ?",
    [ubicacionId]
  );

  if (!ubicacion || ubicacion.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar ubicación topológica",
      message: "La ubicación topológica seleccionada no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/editarUbicacionTopologicaIndividual.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-datos-ubicacion-topologica", ubicacionId, ubicacion[0]);
  });
});

// Actualizar ubicación topológica individual
ipcMain.handle("update-ubicacion-topologica-individual", async (event, idUbicacion, ubicacion) => {
  return new Promise((resolve) => {
    // Obtener el tipo de la ubicación actual
    db.get(
      "SELECT id_tipo_ubicacion_topologica FROM ubicaciones_topologicas WHERE id_ubicacion_topologica = ?",
      [idUbicacion],
      (err, row) => {
        if (err) return resolve({ success: false, error: "Error en DB" });
        if (!row) return resolve({ success: false, error: "Ubicación no encontrada" });

        const idTipo = row.id_tipo_ubicacion_topologica;

        // Verificar que no exista otra ubicación con el mismo nombre en el mismo tipo (excepto la actual)
        const sqlCheck = `SELECT COUNT(*) as count 
                          FROM ubicaciones_topologicas 
                          WHERE id_tipo_ubicacion_topologica = ? AND ubicacion = ? AND id_ubicacion_topologica != ?`;
        db.get(sqlCheck, [idTipo, ubicacion.trim(), idUbicacion], (err2, row2) => {
          if (err2) return resolve({ success: false, error: "Error en DB" });
          if (row2.count > 0) {
            return resolve({ success: false, error: "Ya existe otra ubicación con este nombre en este tipo." });
          }

          const sqlUpdate = `UPDATE ubicaciones_topologicas SET ubicacion = ? WHERE id_ubicacion_topologica = ?`;
          db.run(sqlUpdate, [ubicacion.trim(), idUbicacion], function (err3) {
            if (err3) return resolve({ success: false, error: "Error al actualizar" });
            resolve({ success: true });
          });
        });
      }
    );
  });
});

// Abrir ventana para editar tipo de ubicación topológica
ipcMain.on("abrir-editar-tipo-topologico", async (event, idTipo) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  const tipoId = Number(idTipo);

  if (!Number.isInteger(tipoId) || tipoId <= 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar tipo",
      message: "Seleccione un tipo de ubicación topológica válido para editar."
    });
    return;
  }

  // Obtener datos del tipo
  const tipo = await allAsync(
    "SELECT tipo FROM tipo_ubicaciones_topologicas WHERE id_tipo_ubicacion_topologica = ?",
    [tipoId]
  );

  if (!tipo || tipo.length === 0) {
    dialog.showMessageBox(parentWin, {
      type: "warning",
      title: "Editar tipo",
      message: "El tipo seleccionado no existe."
    });
    return;
  }

  const modal = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWin,
    modal: true,
    backgroundColor: '#D4C19C',
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true
    }
  });
  modal.loadFile("src/editarTipoTopologico.html");

  modal.webContents.once("did-finish-load", () => {
    modal.webContents.send("cargar-datos-tipo-topologico", tipoId, tipo[0]);
  });
});

// Actualizar tipo de ubicación topológica
ipcMain.handle("update-tipo-topologico", async (event, idTipo, tipo) => {
  return new Promise((resolve) => {
    // Verificar que no exista otro tipo con el mismo nombre (excepto el actual)
    const sqlCheck = `SELECT COUNT(*) as count FROM tipo_ubicaciones_topologicas WHERE tipo = ? AND id_tipo_ubicacion_topologica != ?`;
    db.get(sqlCheck, [tipo, idTipo], (err, row) => {
      if (err) return resolve({ success: false, error: "Error en DB" });
      if (row.count > 0) {
        return resolve({ success: false, error: "Ya existe otro tipo con este nombre." });
      }

      const sqlUpdate = `UPDATE tipo_ubicaciones_topologicas SET tipo = ? WHERE id_tipo_ubicacion_topologica = ?`;
      db.run(sqlUpdate, [tipo, idTipo], function (err2) {
        if (err2) return resolve({ success: false, error: "Error al actualizar" });
        resolve({ success: true });
      });
    });
  });
});

// Notificar a renderer que hubo un cambio
ipcMain.on("ubicacion-topologica-agregada", () => {
  if (global.mainWindow) {
    global.mainWindow.webContents.send("ubicacion-topologica-agregada");
  }
});

// Eliminar ubicación topológica
ipcMain.on("eliminar-ubicacion-topologica", (event, idUbicacionTopologica) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const ubicacionTopologicaId = Number(idUbicacionTopologica);

  // Validaciones básicas
  if (!Number.isInteger(ubicacionTopologicaId) || ubicacionTopologicaId <= 0) {
    dialog.showMessageBox(win, {
      type: "warning",
      title: "Eliminar ubicación topológica",
      message: "Seleccione una ubicación topológica válida antes de eliminar."
    });
    return;
  }

  // Verificar existencia de la ubicación topológica
  db.get(
    `SELECT ut.ubicacion, tut.tipo 
     FROM ubicaciones_topologicas ut
     JOIN tipo_ubicaciones_topologicas tut ON ut.id_tipo_ubicacion_topologica = tut.id_tipo_ubicacion_topologica
     WHERE ut.id_ubicacion_topologica = ?`,
    [ubicacionTopologicaId],
    (err, row) => {
      if (err) {
        console.error("Error buscando ubicación topológica:", err);
        dialog.showMessageBox(win, {
          type: "error",
          title: "Eliminar ubicación topológica",
          message: "Error al validar la ubicación topológica. Intente de nuevo."
        });
        return;
      }

      if (!row) {
        dialog.showMessageBox(win, {
          type: "warning",
          title: "Eliminar ubicación topológica",
          message: "La ubicación topológica seleccionada no existe."
        });
        return;
      }

      const nombreUbicacion = `${row.tipo} - ${row.ubicacion}`;

      // Verificar que no tenga obras asociadas
      db.get(
        "SELECT COUNT(*) AS cnt FROM obra_ubicaciones_topologicas WHERE id_ubicacion_topologica = ?",
        [ubicacionTopologicaId],
        (err2, rowCnt) => {
          if (err2) {
            console.error("Error verificando obras de la ubicación topológica:", err2);
            dialog.showMessageBox(win, {
              type: "error",
              title: "Eliminar ubicación topológica",
              message: "No se pudo validar si la ubicación topológica tiene obras registradas."
            });
            return;
          }

          if (rowCnt && rowCnt.cnt > 0) {
            dialog.showMessageBox(win, {
              type: "warning",
              title: "Eliminar ubicación topológica",
              message: `No se puede eliminar esta ubicación topológica porque tiene ${rowCnt.cnt} obra(s) asociada(s) en el sistema. Por favor, elimine o modifique las obras primero.`
            });
            return;
          }

          // Mostrar confirmación antes de eliminar
          dialog.showMessageBox(win, {
            type: "warning",
            title: "Confirmar eliminación",
            message: `¿Está seguro que desea eliminar la ubicación topológica "${nombreUbicacion}"?`,
            buttons: ["Cancelar", "Eliminar"],
            defaultId: 0,
            cancelId: 0
          }).then((result) => {
            if (result.response === 0) {
              return;
            }

            // Eliminar ubicación topológica
            db.run(
              "DELETE FROM ubicaciones_topologicas WHERE id_ubicacion_topologica = ?",
              [ubicacionTopologicaId],
              function (err3) {
                if (err3) {
                  console.error("Error eliminando ubicación topológica:", err3);
                  dialog.showMessageBox(win, {
                    type: "error",
                    title: "Eliminar ubicación topológica",
                    message: "Ocurrió un error al eliminar la ubicación topológica."
                  });
                  return;
                }

                dialog.showMessageBox(win, {
                  type: "info",
                  title: "Eliminar ubicación topológica",
                  message: "Ubicación topológica eliminada correctamente."
                });

                // Refrescar los combos
                if (global.mainWindow) {
                  global.mainWindow.webContents.send("ubicacion-topologica-agregada");
                }
              }
            );
          }).catch((err) => {
            console.error("Error en diálogo de confirmación:", err);
          });
        }
      );
    }
  );
});



app.whenReady().then(createWindow);

