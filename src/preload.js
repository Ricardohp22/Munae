// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  guardarObra: (datos) => ipcRenderer.send("guardar-obra", datos),
  seleccionarImagen: () => ipcRenderer.invoke("seleccionar-imagen")
});
