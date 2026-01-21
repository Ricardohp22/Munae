// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");
console.log("preload.js");

contextBridge.exposeInMainWorld("electronAPI", {
  notificarUbicacionTopologicaAgregada: () => ipcRenderer.send("ubicacion-topologica-agregada"),
  onUbicacionTopologicaAgregada: (callback) => ipcRenderer.on("ubicacion-topologica-agregada", callback),
  abrirAgregarUbicacionTopologica: () => ipcRenderer.send("abrir-agregar-ubicacion-topologica"),
  insertUbicacionTopologica: (data) => ipcRenderer.invoke("insert-ubicacion-topologica", data),
  // Ubicaciones Topográficas
  notificarTopograficaAgregada: () => ipcRenderer.send("topografica-agregada"),
  onTopograficaAgregada: (callback) => ipcRenderer.on("topografica-agregada", callback),
  abrirAgregarTopografica: () => ipcRenderer.send("abrir-agregar-topografica"),
  insertTopografica: (ubicacion) => ipcRenderer.invoke("insert-topografica", ubicacion),
  // Técnicas
  notificarTecnicaAgregada: () => ipcRenderer.send("tecnica-agregada"),
  onTecnicaAgregada: (callback) => ipcRenderer.on("tecnica-agregada", callback),
  abrirAgregarTecnica: () => ipcRenderer.send("abrir-agregar-tecnica"),
  insertTecnica: (tecnica) => ipcRenderer.invoke("insert-tecnica", tecnica),
  //artistas
  notificarArtistaAgregado: () => ipcRenderer.send("artista-agregado"),
  onArtistaAgregado: (callback) => ipcRenderer.on("artista-agregado", callback),
  abrirAgregarArtista: () => ipcRenderer.send("abrir-agregar-artista"),
  insertArtista: (artista) => ipcRenderer.invoke("insert-artista", artista),
  eliminarArtista: (idArtista) => ipcRenderer.send("eliminar-artista", idArtista),
  eliminarTipoTopologico: (idTipo) => ipcRenderer.send("eliminar-tipo-topologico", idTipo),
  eliminarTecnica: (idTecnica) => ipcRenderer.send("eliminar-tecnica", idTecnica),
  eliminarTopografica: (idTopografica) => ipcRenderer.send("eliminar-topografica", idTopografica),
  eliminarUbicacionTopologica: (idUbicacionTopologica) => ipcRenderer.send("eliminar-ubicacion-topologica", idUbicacionTopologica),
  //Roles de usuario
  setUserRole: (role) => ipcRenderer.send("set-user-role", role),
  descargarObra: (idObra) => ipcRenderer.invoke("descargar-obra", idObra),
  getImagenesCarpeta: (folderPath) => ipcRenderer.invoke("get-imagenes-carpeta", folderPath),
  //API para ficha
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

  //funciones para poblar selects
  getArtistas: () => ipcRenderer.invoke('get-artistas'),
  getTecnicas: () => ipcRenderer.invoke('get-tecnicas'),
  getTiposTopologicos: () => ipcRenderer.invoke('get-tipos-topologicos'),
  getUbicacionesTopologicasPorTipo: (id_tipo) => ipcRenderer.invoke('get-ubicaciones-topologicas-por-tipo', id_tipo),
  getUbicacionesTopograficas: () => ipcRenderer.invoke('get-ubicaciones-topograficas')
});
