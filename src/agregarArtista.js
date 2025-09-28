document.getElementById("formArtista").addEventListener("submit", async (e) => {
    e.preventDefault();

    const artista = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido_paterno: document.getElementById("apellido_paterno").value.trim(),
        apellido_materno: document.getElementById("apellido_materno").value.trim(),
    };

    const res = await window.electronAPI.insertArtista(artista);

    if (res.success) {
        alert("Artista agregado con éxito.");
        // Enviar evento al proceso principal
        window.electronAPI.notificarArtistaAgregado();
        window.close();
    } else {
        alert("Error: " + res.error);
    }

});