// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");
console.log("preload.js");

contextBridge.exposeInMainWorld("electronAPI", {
  guardarObra: (datos) => ipcRenderer.send("guardar-obra", datos),
  seleccionarImagen: () => ipcRenderer.invoke("seleccionar-imagen"),

  // nuevas funciones para poblar selects
  getArtistas: () => ipcRenderer.invoke('get-artistas'),
  getTecnicas: () => ipcRenderer.invoke('get-tecnicas'),
  getTiposTopologicos: () => ipcRenderer.invoke('get-tipos-topologicos'),
  getUbicacionesTopologicasPorTipo: (id_tipo) => ipcRenderer.invoke('get-ubicaciones-topologicas-por-tipo', id_tipo),
  getUbicacionesTopograficas: () => ipcRenderer.invoke('get-ubicaciones-topograficas')
});
