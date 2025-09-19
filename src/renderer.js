// src/renderer.js
document.getElementById("obraForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const datos = {
        no_sigropam: document.getElementById("no_sigropam").value,
        artista: document.getElementById("artista").value,
        titulo: document.getElementById("titulo").value,
        fecha: document.getElementById("fecha").value,
        tecnica: document.getElementById("tecnica").value,
        tiraje: document.getElementById("tiraje").value,
        medidas_soporte: document.getElementById("medidas_soporte").value,
        medidas_imagen: document.getElementById("medidas_imagen").value,
        ubicacion_topologica: document.getElementById("ubicacion_topologica").value,
        ubicacion_topografica: document.getElementById("ubicacion_topografica").value,
        observaciones: document.getElementById("observaciones").value,
        estado_conservacion: document.getElementById("estado_conservacion").value,
        descripcion: document.getElementById("descripcion").value,
        exposiciones: document.getElementById("exposiciones").value,
        imagen_baja: document.getElementById("imagen_baja").value,
        imagen_alta: document.getElementById("imagen_alta").value
    };
    console.log("datos");
    console.log(datos);
    // Usar el API expuesto
    window.electronAPI.guardarObra(datos);
});

document.getElementById("btnImagenBaja").addEventListener("click", async () => {
    const ruta = await window.electronAPI.seleccionarImagen();
    if (ruta) document.getElementById("imagen_baja").value = ruta;
});

document.getElementById("btnImagenAlta").addEventListener("click", async () => {
    const ruta = await window.electronAPI.seleccionarImagen();
    if (ruta) document.getElementById("imagen_alta").value = ruta;
});

