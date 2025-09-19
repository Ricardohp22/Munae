const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./src/database");

ipcMain.handle("seleccionar-imagen", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "png", "jpeg"] }]
  });
  return canceled ? null : filePaths[0];
});

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

// Carpeta para guardar imágenes
const imgDir = path.join(__dirname, "data/images");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

// Guardar obra

ipcMain.on("guardar-obra", (event, datos) => {
  let baja = "", alta = "";

  try {
    if (datos.imagen_baja) {
      const nombreBaja = path.basename(datos.imagen_baja);
      baja = path.join(imgDir, nombreBaja);
      fs.copyFileSync(datos.imagen_baja, baja);
    }

    if (datos.imagen_alta) {
      const nombreAlta = path.basename(datos.imagen_alta);
      alta = path.join(imgDir, nombreAlta);
      fs.copyFileSync(datos.imagen_alta, alta);
    }
  } catch (err) {
    console.error("Error copiando imágenes:", err);
  }

  const query = `
    INSERT INTO obras 
    (no_sigropam, artista, titulo, fecha, tecnica, tiraje, medidas_soporte, medidas_imagen,
     ubicacion_topologica, ubicacion_topografica, observaciones, estado_conservacion,
     descripcion, exposiciones, imagen_baja, imagen_alta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    datos.no_sigropam,
    datos.artista,
    datos.titulo,
    datos.fecha,
    datos.tecnica,
    datos.tiraje,
    datos.medidas_soporte,
    datos.medidas_imagen,
    datos.ubicacion_topologica,
    datos.ubicacion_topografica,
    datos.observaciones,
    datos.estado_conservacion,
    datos.descripcion,
    datos.exposiciones,
    baja,
    alta
  ], function (err) {
    if (err) console.error("Error al guardar obra:", err.message);
    else console.log("Obra guardada con ID:", this.lastID);
  });
});


app.whenReady().then(createWindow);
