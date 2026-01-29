/* document.getElementById("btnRegistro").addEventListener("click", async () => {
  await window.electronAPI.abrirRegistro();
}); */

// Variable para almacenar el rol del usuario
let userRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Obtener rol del usuario
    userRole = await window.electronAPI.getUserRole();
    
    // Cambiar background del body si es admin
    if (userRole === "admin") {
        document.body.style.backgroundColor = "#4E232E";
    }
    // 🔹 Poblar selects igual que ahora ...
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

    // 🔹 Aquí registramos SOLO UNA VEZ la delegación
    const cont = document.getElementById("resultados");
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

// Variables para paginación
let filtrosActuales = {};
let paginaActual = 1;
const resultadosPorPagina = 10;

// Función para renderizar resultados
function renderizarResultados(data) {
    const cont = document.getElementById("resultados");
    const contCards = document.getElementById("resultados-cards");
    const contNavegacion = document.getElementById("navegacion");
    const contIndicador = document.getElementById("indicador-resultados");

    // Limpiar resultados anteriores
    contCards.innerHTML = "";

    // Mostrar indicador de resultados
    if (contIndicador) {
        contIndicador.textContent = `Se encontraron ${data.total} obra(s) en total`;
        contIndicador.style.display = data.total > 0 ? "block" : "none";
    }

    if (!data.resultados || data.resultados.length === 0) {
        contCards.innerHTML = "<p class='text-muted'>No se encontraron obras</p>";
        if (contNavegacion) contNavegacion.style.display = "none";
        return;
    }

    // Renderizar tarjetas
    data.resultados.forEach(r => {
        const card = document.createElement("div");
        card.className = "card mb-3";
        
        // Botón eliminar solo si es admin
        const botonEliminar = userRole === "admin" 
            ? `<button class="btn btn-danger btn-sm me-2 eliminar-obra" data-id="${r.id_obra}" title="Eliminar obra">
                <span>🗑️</span> Eliminar
               </button>`
            : "";
        
        card.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${r.titulo}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${r.autor || 'Autor desconocido'}</h6>
            <p class="card-text">${r.descripcion || ''}</p>
            <div class="d-flex gap-2 justify-content-between">
              <div class="d-flex gap-2">
                <button class="btn btn-info btn-sm ver-ficha" data-id="${r.id_obra}">Ver ficha</button>
                <button class="btn btn-success btn-sm descargar-obra" data-id="${r.id_obra}">Descargar obra</button>
              </div>
              ${botonEliminar ? `<div>${botonEliminar}</div>` : ''}
            </div>
          </div>
        `;
        contCards.appendChild(card);
    });
    
    // Agregar event listeners para botones de eliminar
    document.querySelectorAll(".eliminar-obra").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idObra = e.target.closest(".eliminar-obra").getAttribute("data-id");
            if (confirm("¿Está seguro de que desea eliminar esta obra? Esta acción no se puede deshacer.")) {
                const resultado = await window.electronAPI.eliminarObra(idObra);
                if (resultado.success) {
                    alert("Obra eliminada exitosamente");
                    // Recargar resultados
                    buscarObrasPagina();
                } else {
                    alert("Error al eliminar la obra: " + resultado.error);
                }
            }
        });
    });

    // Renderizar navegación
    if (contNavegacion) {
        renderizarNavegacion(data, contNavegacion);
    }
}

// Función para renderizar controles de navegación
function renderizarNavegacion(data, contenedor) {
    const totalPaginas = data.totalPaginas;
    
    if (totalPaginas <= 1) {
        contenedor.style.display = "none";
        return;
    }

    contenedor.style.display = "flex";
    contenedor.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-primary btn-sm" id="btnAnterior" ${paginaActual === 1 ? 'disabled' : ''}>
                Anterior
            </button>
            <span class="text-muted">
                Página ${data.pagina} de ${totalPaginas}
            </span>
            <button class="btn btn-outline-primary btn-sm" id="btnSiguiente" ${paginaActual >= totalPaginas ? 'disabled' : ''}>
                Siguiente
            </button>
        </div>
    `;

    // Event listeners para navegación
    document.getElementById("btnAnterior").addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            buscarObrasPagina();
        }
    });

    document.getElementById("btnSiguiente").addEventListener("click", () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            buscarObrasPagina();
        }
    });
}

// Función para realizar búsqueda con paginación
async function buscarObrasPagina() {
    const offset = (paginaActual - 1) * resultadosPorPagina;
    const filtros = {
        ...filtrosActuales,
        offset: offset,
        limit: resultadosPorPagina
    };

    const data = await window.electronAPI.buscarObras(filtros);
    renderizarResultados(data);
}

// 🔹 Este listener ya solo pinta los resultados
document.getElementById("btnBuscar").addEventListener("click", async () => {
    // Guardar filtros actuales
    filtrosActuales = {
        sigropam: document.getElementById("filtro_sigropam").value.trim(),
        autor: document.getElementById("filtro_autor").value,
        keyword: document.getElementById("filtro_keyword").value.trim(),
        anio: document.getElementById("filtro_anio").value.trim(),
        tecnica: document.getElementById("filtro_tecnica").value,
        topologica: document.getElementById("filtro_topologica").value,
        topografica: document.getElementById("filtro_topografica").value,
        descripcion: document.getElementById("filtro_descripcion").value.trim(),
        observaciones: document.getElementById("filtro_observaciones").value.trim(),
        expo: document.getElementById("filtro_expo").value.trim()
    };

    // Resetear a página 1
    paginaActual = 1;
    
    // Realizar búsqueda
    await buscarObrasPagina();
});


