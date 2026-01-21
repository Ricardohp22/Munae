let tecnicaId = null;

// Recibir el ID de la técnica desde main.js
window.electronAPI.onCargarDatosTecnica((event, id, datos) => {
  tecnicaId = id;
  document.getElementById("tecnica").value = datos.tecnica || "";
});

document.getElementById("formTecnica").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!tecnicaId) {
    alert("Error: No se recibió el ID de la técnica.");
    return;
  }

  const tecnica = document.getElementById("tecnica").value.trim();
  if (!tecnica) {
    alert("La técnica no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.updateTecnica(tecnicaId, tecnica);

  if (res.success) {
    alert("Técnica actualizada con éxito.");
    window.electronAPI.notificarTecnicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
