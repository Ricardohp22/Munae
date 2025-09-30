document.getElementById("btnLogin").addEventListener("click", async () => {
  const usuario = document.getElementById("usuario").value;
  const password = document.getElementById("password").value;

  const result = await window.electronAPI.login(usuario, password);

  if (result.success) {
    // Guardamos el rol en localStorage para usarlo en otras pantallas
    localStorage.setItem("rol", result.rol);
    //console.log(result.rol);
    // Cambiar a ventana de búsqueda
    //window.location = "busqueda.html";
  } else {
    document.getElementById("mensaje").textContent = result.error;
  }
});
