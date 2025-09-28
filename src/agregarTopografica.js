document.getElementById("formTopografica").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ubicacion = document.getElementById("ubicacion").value.trim();
  if (!ubicacion) {
    alert("La ubicación no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.insertTopografica(ubicacion);

  if (res.success) {
    alert("Ubicación topográfica agregada con éxito.");
    // Notificar al main
    window.electronAPI.notificarTopograficaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
