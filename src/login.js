// Asegurar que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  // Limpiar cualquier mensaje previo
  const mensajeDiv = document.getElementById("mensaje");
  if (mensajeDiv) {
    mensajeDiv.textContent = "";
  }
  
  // Limpiar campos de input
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  if (usuarioInput) usuarioInput.value = "";
  if (passwordInput) passwordInput.value = "";
  
  // Asegurar que los inputs no estén deshabilitados
  if (usuarioInput) usuarioInput.disabled = false;
  if (passwordInput) passwordInput.disabled = false;
  
  // Agregar event listener al botón de login
  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    // Remover listeners previos si existen clonando el botón
    const newBtnLogin = btnLogin.cloneNode(true);
    btnLogin.parentNode.replaceChild(newBtnLogin, btnLogin);
    
    newBtnLogin.addEventListener("click", async () => {
      const usuario = document.getElementById("usuario").value;
      const password = document.getElementById("password").value;

      if (!usuario || !password) {
        const mensaje = document.getElementById("mensaje");
        if (mensaje) {
          mensaje.textContent = "Por favor, complete todos los campos";
        }
        return;
      }

      const result = await window.electronAPI.login(usuario, password);

      if (result.success) {
        // Guardamos el rol en localStorage para usarlo en otras pantallas
        localStorage.setItem("rol", result.rol);
        // Cambiar a ventana de búsqueda
        //window.location = "busqueda.html";
      } else {
        const mensaje = document.getElementById("mensaje");
        if (mensaje) {
          mensaje.textContent = result.error;
        }
      }
    });
  }
});
