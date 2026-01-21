let tipoId = null;

// Recibir el ID del tipo desde main.js
window.electronAPI.onCargarDatosTipoTopologico((event, id, datos) => {
  tipoId = id;
  document.getElementById("tipo").value = datos.tipo || "";
});

document.getElementById("formTipoTopologico").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!tipoId) {
    alert("Error: No se recibió el ID del tipo.");
    return;
  }

  const tipo = document.getElementById("tipo").value.trim();
  if (!tipo) {
    alert("El tipo no puede estar vacío.");
    return;
  }

  const res = await window.electronAPI.updateTipoTopologico(tipoId, tipo);

  if (res.success) {
    alert("Tipo de ubicación topológica actualizado con éxito.");
    window.electronAPI.notificarUbicacionTopologicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
