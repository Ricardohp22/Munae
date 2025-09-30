document.getElementById("formUbicacionTopologica").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value.trim();
  const ubicacionesStr = document.getElementById("ubicaciones").value.trim();
  const ubicaciones = ubicacionesStr.split(",").map(u => u.trim()).filter(Boolean);

  if (!tipo || ubicaciones.length === 0) {
    alert("Debe ingresar un tipo y al menos una ubicación");
    return;
  }

  const res = await window.electronAPI.insertUbicacionTopologica({ tipo, ubicaciones });

  if (res.success) {
    alert("Ubicaciones agregadas con éxito.");
    window.electronAPI.notificarUbicacionTopologicaAgregada();
    window.close();
  } else {
    alert("Error: " + res.error);
  }
});
