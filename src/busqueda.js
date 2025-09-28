/* document.getElementById("btnRegistro").addEventListener("click", async () => {
  await window.electronAPI.abrirRegistro();
}); */
document.addEventListener("DOMContentLoaded", async () => {
    // Autor
    const autores = await window.electronAPI.getFiltroArtistas();
    const selAutor = document.getElementById("filtro_autor");
    autores.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id_artista;
        opt.textContent = `${a.apellido_paterno || ""} ${a.apellido_materno || ""}, ${a.nombre}`;
        selAutor.appendChild(opt);
    });

    // Técnicas
    const tecnicas = await window.electronAPI.getFiltroTecnicas();
    const selTec = document.getElementById("filtro_tecnica");
    tecnicas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id_tecnica;
        opt.textContent = t.tecnica;
        selTec.appendChild(opt);
    });

    // Ubicaciones topográficas
    const topograficas = await window.electronAPI.getFiltroTopograficas();
    const selTopog = document.getElementById("filtro_topografica");
    topograficas.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id_ubicacion_topografica;
        opt.textContent = u.ubicacion;
        selTopog.appendChild(opt);
    });

    // Ubicaciones topológicas (nivel 1)
    const topologicas = await window.electronAPI.getFiltroTopologicas();
    const selTopo = document.getElementById("filtro_topologica");
    topologicas.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id_ubicacion_topologica;
        opt.textContent = `${u.tipo} - ${u.ubicacion}`;
        selTopo.appendChild(opt);
    });

});

document.getElementById("btnBuscar").addEventListener("click", async () => {
    const filtros = {
        sigropam: document.getElementById("filtro_sigropam").value.trim(),
        autor: document.getElementById("filtro_autor").value,  // ID exacto
        keyword: document.getElementById("filtro_keyword").value.trim(),
        anio: document.getElementById("filtro_anio").value.trim(),
        tecnica: document.getElementById("filtro_tecnica").value, // ID exacto
        topologica: document.getElementById("filtro_topologica").value, // ID exacto
        topografica: document.getElementById("filtro_topografica").value, // ID exacto
        expo: document.getElementById("filtro_expo").value.trim()
    };


    const resultados = await window.electronAPI.buscarObras(filtros);

    const cont = document.getElementById("resultados");
    cont.innerHTML = "";

    if (!resultados.length) {
        cont.innerHTML = "<p class='text-muted'>No se encontraron obras</p>";
        return;
    }

    resultados.forEach(r => {
        const card = document.createElement("div");
        card.className = "card mb-3";
        card.innerHTML = `
  <div class="card-body">
    <h5 class="card-title">${r.titulo}</h5>
    <h6 class="card-subtitle mb-2 text-muted">${r.autor || 'Autor desconocido'}</h6>
    <p class="card-text">${r.descripcion || ''}</p>
    <button class="btn btn-info btn-sm me-2 ver-ficha" data-id="${r.id_obra}">Ver ficha</button>
    <button class="btn btn-success btn-sm descargar-obra" data-id="${r.id_obra}">Descargar obra</button>
  </div>
`;
        cont.appendChild(card);
    });

    // Delegación de evento para ver ficha
    cont.addEventListener("click", (e) => {
        if (e.target.classList.contains("ver-ficha")) {
            const idObra = e.target.getAttribute("data-id");
            window.electronAPI.abrirFicha(idObra);
        }
    });
    cont.addEventListener("click", async (e) => {
        if (e.target.classList.contains("ver-ficha")) {
            const idObra = e.target.getAttribute("data-id");
            window.electronAPI.abrirFicha(idObra);
        }

        if (e.target.classList.contains("descargar-obra")) {
            const idObra = e.target.getAttribute("data-id");
            const res = await window.electronAPI.descargarObra(idObra);
            if (res.success) {
                alert(`Obra descargada en: ${res.filePath}`);
            } else {
                alert(`Error: ${res.error}`);
            }
        }
    });


});

