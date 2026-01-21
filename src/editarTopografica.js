let topograficaId = null;

// Recibir el ID de la ubicación topográfica desde main.js
window.electronAPI.onCargarDatosTopografica((event, id, datos) => {
  topograficaId = id;
  document.getElementById("ubicacion").value = datos.ubicacion || "";
});

document.getElementById("formTopografica").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!topograficaId) {
    alert("Error: No se recibió el ID de la ubicación topográfica.");
    return;
  }

  const ubicacion = document.getElementById("ubicacion").value.trim();
  if (!ubicacion) {
    alert("La ubicación no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.updateTopografica(topograficaId, ubicacion);

  if (res.success) {
    alert("Ubicación topográfica actualizada con éxito.");
    window.electronAPI.notificarTopograficaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
