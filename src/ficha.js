//const { ipcRenderer } = require("electron");

window.electronAPI.onCargarFicha(async (idObra) => {
  const obra = await window.electronAPI.getFichaObra(idObra);

  const datosDiv = document.getElementById("ficha-datos");
  datosDiv.innerHTML = `
    <p><strong>No. SIGROPAM:</strong> ${obra.no_sigropam}</p>
    <p><strong>Artista:</strong> ${obra.apellido_paterno || ""} ${obra.apellido_materno || ""}, ${obra.artista_nombre}</p>
    <p><strong>Título:</strong> ${obra.titulo}</p>
    <p><strong>Fecha:</strong> ${obra.fecha}</p>
    <p><strong>Técnica:</strong> ${obra.tecnica || ""}</p>
    <p><strong>Tiraje:</strong> ${obra.tiraje || ""}</p>
    <p><strong>Medidas soporte:</strong> ${obra.medidas_soporte_largo || ""} x ${obra.medidas_soporte_ancho || ""} x ${obra.medidas_soporte_profundidad || ""} cm (Alto x Ancho x Prof.)</p>
    <p><strong>Medidas imagen:</strong> ${obra.medidas_imagen_largo || ""} x ${obra.medidas_imagen_ancho || ""} x ${obra.medidas_imagen_profundidad || ""} cm (Alto x Ancho x Prof.)</p>
    <p><strong>Medidas marco:</strong> ${obra.medidas_marco_largo || ""} x ${obra.medidas_marco_ancho || ""} x ${obra.medidas_marco_profundidad || ""} cm (Alto x Ancho x Prof.)</p>
    <p><strong>Ubicación topológica:</strong> ${obra.ubicacionesTopo.map(u => `${u.tipo} - ${u.ubicacion}`).join(", ")}</p>
    <p><strong>Ubicación topográfica:</strong> ${obra.ubi_topografica || ""}</p>
    <p><strong>Observaciones:</strong> ${obra.observaciones || ""}</p>
    <p><strong>Estado conservación:</strong> ${obra.estado_conservacion || ""}</p>
    <p><strong>Descripción:</strong> ${obra.descripcion || ""}</p>
    <p><strong>Exposiciones:</strong> ${Array.isArray(obra.exposiciones) && obra.exposiciones.length > 0 ? obra.exposiciones.join(", ") : ""}</p>
  `;

  // Renderizar imágenes
  async function renderImagenes(containerId, folderPath) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = "";
    if (folderPath) {
      const imagenes = await window.electronAPI.getImagenesCarpeta(folderPath);
      if (imagenes.length === 0) {
        cont.innerHTML = "<p class='text-muted'>No hay imágenes</p>";
        return;
      }
      imagenes.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "col-6 mb-3 img-fluid";
        cont.appendChild(img);
      });
    }
  }

  await renderImagenes("imagenes-baja", obra.path_img_baja);
  await renderImagenes("imagenes-alta", obra.path_img_alta);
});

