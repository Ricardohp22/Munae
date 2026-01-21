let tipoId = null;

// Recibir el ID del tipo desde main.js
window.electronAPI.onCargarTipoParaAgregar((event, id) => {
  tipoId = id;
});

document.getElementById("formUbicacionTopologicaIndividual").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!tipoId) {
    alert("Error: No se recibió el ID del tipo.");
    return;
  }

  const ubicacion = document.getElementById("ubicacion").value.trim();
  if (!ubicacion) {
    alert("La ubicación no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.insertUbicacionTopologicaIndividual(tipoId, ubicacion);

  if (res.success) {
    alert("Ubicación topológica agregada con éxito.");
    window.electronAPI.notificarUbicacionTopologicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
