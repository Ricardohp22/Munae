// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");
console.log("preload.js");

contextBridge.exposeInMainWorld("electronAPI", {
  descargarObra: (idObra) => ipcRenderer.invoke("descargar-obra", idObra),
  getImagenesCarpeta: (folderPath) => ipcRenderer.invoke("get-imagenes-carpeta", folderPath),
  // 🚀 Nueva API para ficha
  getFichaObra: (idObra) => ipcRenderer.invoke("get-ficha-obra", idObra),
  onCargarFicha: (callback) => ipcRenderer.on("cargar-ficha", (event, idObra) => callback(idObra)),
  abrirFicha: (idObra) => ipcRenderer.send("abrir-ficha", idObra),
  getFiltroArtistas: () => ipcRenderer.invoke("get-filtro-artistas"),
  getFiltroTecnicas: () => ipcRenderer.invoke("get-filtro-tecnicas"),
  getFiltroTopograficas: () => ipcRenderer.invoke("get-filtro-topograficas"),
  getFiltroTopologicas: () => ipcRenderer.invoke("get-filtro-topologicas"),

  buscarObras: (filtros) => ipcRenderer.invoke("buscar-obras", filtros),
  login: (usuario, password) => ipcRenderer.invoke("login", usuario, password),
  seleccionarImagenes: (opts) => ipcRenderer.invoke("seleccionar-imagenes", opts),
  guardarObra: (datos) => ipcRenderer.invoke("guardar-obra", datos),
  seleccionarImagen: () => ipcRenderer.invoke("seleccionar-imagen"),

  // nuevas funciones para poblar selects
  getArtistas: () => ipcRenderer.invoke('get-artistas'),
  getTecnicas: () => ipcRenderer.invoke('get-tecnicas'),
  getTiposTopologicos: () => ipcRenderer.invoke('get-tipos-topologicos'),
  getUbicacionesTopologicasPorTipo: (id_tipo) => ipcRenderer.invoke('get-ubicaciones-topologicas-por-tipo', id_tipo),
  getUbicacionesTopograficas: () => ipcRenderer.invoke('get-ubicaciones-topograficas')
});
