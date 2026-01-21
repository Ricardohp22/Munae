let ubicacionId = null;

// Recibir el ID de la ubicación desde main.js
window.electronAPI.onCargarDatosUbicacionTopologica((event, id, datos) => {
  ubicacionId = id;
  document.getElementById("ubicacion").value = datos.ubicacion || "";
});

document.getElementById("formUbicacionTopologicaIndividual").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!ubicacionId) {
    alert("Error: No se recibió el ID de la ubicación topológica.");
    return;
  }

  const ubicacion = document.getElementById("ubicacion").value.trim();
  if (!ubicacion) {
    alert("La ubicación no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.updateUbicacionTopologicaIndividual(ubicacionId, ubicacion);

  if (res.success) {
    alert("Ubicación topológica actualizada con éxito.");
    window.electronAPI.notificarUbicacionTopologicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
