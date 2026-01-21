let artistaId = null;

// Recibir el ID del artista desde main.js
window.electronAPI.onCargarDatosArtista((event, id, datos) => {
  artistaId = id;
  document.getElementById("nombre").value = datos.nombre || "";
  document.getElementById("apellido_paterno").value = datos.apellido_paterno || "";
  document.getElementById("apellido_materno").value = datos.apellido_materno || "";
});

document.getElementById("formArtista").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!artistaId) {
    alert("Error: No se recibió el ID del artista.");
    return;
  }

  const artista = {
    nombre: document.getElementById("nombre").value.trim(),
    apellido_paterno: document.getElementById("apellido_paterno").value.trim(),
    apellido_materno: document.getElementById("apellido_materno").value.trim(),
  };

  const res = await window.electronAPI.updateArtista(artistaId, artista);

  if (res.success) {
    alert("Artista actualizado con éxito.");
    window.electronAPI.notificarArtistaAgregado();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
