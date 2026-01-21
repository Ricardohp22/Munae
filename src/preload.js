// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");
console.log("preload.js");

contextBridge.exposeInMainWorld("electronAPI", {
  notificarUbicacionTopologicaAgregada: () => ipcRenderer.send("ubicacion-topologica-agregada"),
  onUbicacionTopologicaAgregada: (callback) => ipcRenderer.on("ubicacion-topologica-agregada", callback),
  abrirAgregarUbicacionTopologica: () => ipcRenderer.send("abrir-agregar-ubicacion-topologica"),
  abrirAgregarUbicacionTopologicaIndividual: (idTipo) => ipcRenderer.send("abrir-agregar-ubicacion-topologica-individual", idTipo),
  abrirEditarUbicacionTopologicaIndividual: (idUbicacion) => ipcRenderer.send("abrir-editar-ubicacion-topologica-individual", idUbicacion),
  abrirEditarTipoTopologico: (idTipo) => ipcRenderer.send("abrir-editar-tipo-topologico", idTipo),
  insertUbicacionTopologica: (data) => ipcRenderer.invoke("insert-ubicacion-topologica", data),
  insertUbicacionTopologicaIndividual: (idTipo, ubicacion) => ipcRenderer.invoke("insert-ubicacion-topologica-individual", idTipo, ubicacion),
  updateUbicacionTopologicaIndividual: (idUbicacion, ubicacion) => ipcRenderer.invoke("update-ubicacion-topologica-individual", idUbicacion, ubicacion),
  updateTipoTopologico: (idTipo, tipo) => ipcRenderer.invoke("update-tipo-topologico", idTipo, tipo),
  // Ubicaciones Topográficas
  notificarTopograficaAgregada: () => ipcRenderer.send("topografica-agregada"),
  onTopograficaAgregada: (callback) => ipcRenderer.on("topografica-agregada", callback),
  abrirAgregarTopografica: () => ipcRenderer.send("abrir-agregar-topografica"),
  abrirEditarTopografica: (idTopografica) => ipcRenderer.send("abrir-editar-topografica", idTopografica),
  insertTopografica: (ubicacion) => ipcRenderer.invoke("insert-topografica", ubicacion),
  // Técnicas
  notificarTecnicaAgregada: () => ipcRenderer.send("tecnica-agregada"),
  onTecnicaAgregada: (callback) => ipcRenderer.on("tecnica-agregada", callback),
  abrirAgregarTecnica: () => ipcRenderer.send("abrir-agregar-tecnica"),
  abrirEditarTecnica: (idTecnica) => ipcRenderer.send("abrir-editar-tecnica", idTecnica),
  insertTecnica: (tecnica) => ipcRenderer.invoke("insert-tecnica", tecnica),
  //artistas
  notificarArtistaAgregado: () => ipcRenderer.send("artista-agregado"),
  onArtistaAgregado: (callback) => ipcRenderer.on("artista-agregado", callback),
  abrirAgregarArtista: () => ipcRenderer.send("abrir-agregar-artista"),
  abrirEditarArtista: (idArtista) => ipcRenderer.send("abrir-editar-artista", idArtista),
  insertArtista: (artista) => ipcRenderer.invoke("insert-artista", artista),
  eliminarArtista: (idArtista) => ipcRenderer.send("eliminar-artista", idArtista),
  eliminarTipoTopologico: (idTipo) => ipcRenderer.send("eliminar-tipo-topologico", idTipo),
  eliminarTecnica: (idTecnica) => ipcRenderer.send("eliminar-tecnica", idTecnica),
  eliminarTopografica: (idTopografica) => ipcRenderer.send("eliminar-topografica", idTopografica),
  eliminarUbicacionTopologica: (idUbicacionTopologica) => ipcRenderer.send("eliminar-ubicacion-topologica", idUbicacionTopologica),
  //Roles de usuario
  setUserRole: (role) => ipcRenderer.send("set-user-role", role),
  getUserRole: () => ipcRenderer.invoke("get-user-role"),
  eliminarObra: (idObra) => ipcRenderer.invoke("eliminar-obra", idObra),
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
  getUbicacionesTopograficas: () => ipcRenderer.invoke('get-ubicaciones-topograficas'),
  getUltimaObra: () => ipcRenderer.invoke('get-ultima-obra'),
  // Métodos para obtener datos para editar
  getArtista: (idArtista) => ipcRenderer.invoke('get-artista', idArtista),
  getTecnica: (idTecnica) => ipcRenderer.invoke('get-tecnica', idTecnica),
  getTopografica: (idTopografica) => ipcRenderer.invoke('get-topografica', idTopografica),
  // Métodos para actualizar
  updateArtista: (idArtista, datos) => ipcRenderer.invoke('update-artista', idArtista, datos),
  updateTecnica: (idTecnica, tecnica) => ipcRenderer.invoke('update-tecnica', idTecnica, tecnica),
  updateTopografica: (idTopografica, ubicacion) => ipcRenderer.invoke('update-topografica', idTopografica, ubicacion),
  // Listeners para recibir datos al editar
  onCargarDatosArtista: (callback) => ipcRenderer.on('cargar-datos-artista', (event, id, datos) => callback(event, id, datos)),
  onCargarDatosTecnica: (callback) => ipcRenderer.on('cargar-datos-tecnica', (event, id, datos) => callback(event, id, datos)),
  onCargarDatosTopografica: (callback) => ipcRenderer.on('cargar-datos-topografica', (event, id, datos) => callback(event, id, datos)),
  onCargarDatosUbicacionTopologica: (callback) => ipcRenderer.on('cargar-datos-ubicacion-topologica', (event, id, datos) => callback(event, id, datos)),
  onCargarDatosTipoTopologico: (callback) => ipcRenderer.on('cargar-datos-tipo-topologico', (event, id, datos) => callback(event, id, datos)),
  onCargarTipoParaAgregar: (callback) => ipcRenderer.on('cargar-tipo-para-agregar', (event, id) => callback(event, id))
});
