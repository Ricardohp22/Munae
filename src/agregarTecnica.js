document.getElementById("formTecnica").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tecnica = document.getElementById("tecnica").value.trim();
  if (!tecnica) {
    alert("La técnica no puede estar vacía.");
    return;
  }

  const res = await window.electronAPI.insertTecnica(tecnica);

  if (res.success) {
    alert("Técnica agregada con éxito.");
    // Notificar al main
    window.electronAPI.notificarTecnicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
