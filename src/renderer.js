// src/renderer.js
// Helper DOM
function createOption(value, text) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = text;
  return opt;
}

function clearSelect(sel) {
  sel.innerHTML = '';
}

function populateSelectWithPlaceholder(sel, placeholderText = 'Seleccione...') {
  clearSelect(sel);
  sel.appendChild(createOption('', placeholderText));
}

// Poblador genérico (rows = [{id_x, campo}])
function populateSelect(sel, rows, valueKey, textFn, placeholder = 'Seleccione...') {
  //console.log(valueKey);
  populateSelectWithPlaceholder(sel, placeholder);
  if (!rows || rows.length === 0) {
    const noOpt = createOption('', 'No hay elementos');
    noOpt.disabled = true;
    sel.appendChild(noOpt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  rows.forEach(r => {
    const text = typeof textFn === 'function' ? textFn(r) : r[textFn];
    sel.appendChild(createOption(r[valueKey], text));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOMContentLoaded");
  try {
    // selects del DOM (asegúrate de que tengan estos ids en tu HTML)
    const selArtista = document.getElementById('id_artista');
    const selTecnica = document.getElementById('id_tecnica');
    const selTipoGeneral = document.getElementById('ubi_general_tipo');
    const selUbiGeneral = document.getElementById('ubi_general');

    const selTipoSub = document.getElementById('ubi_sub_tipo');
    const selUbiSub = document.getElementById('ubi_sub');

    const selTipoSub2 = document.getElementById('ubi_sub2_tipo');
    const selUbiSub2 = document.getElementById('ubi_sub2');

    const selTopografica = document.getElementById('id_ubi_topografica');

    // Consultas a main
    const [artistas, tecnicas, tiposTop, topograficas] = await Promise.all([
      window.electronAPI.getArtistas(),
      window.electronAPI.getTecnicas(),
      window.electronAPI.getTiposTopologicos(),
      window.electronAPI.getUbicacionesTopograficas()
    ]);

    // Poblar artistas
    populateSelect(selArtista, artistas, 'id_artista',
      (r) => `${(r.apellido_paterno || '')} ${(r.apellido_materno || '')}, ${r.nombre}`.trim(),
      'Seleccione un artista *');

    // Poblar técnicas
    populateSelect(selTecnica, tecnicas, 'id_tecnica', 'tecnica', 'Seleccione una técnica');

    // Guardamos tipos en memoria para poder filtrarlos
    window.__tiposTopologicos = tiposTop || [];

    // Poblar selects de tipos (todos inicialmente)
    function fillTipoSelectsExcluding(excludeIds = []) {
      const tiposToShow = window.__tiposTopologicos.filter(t => !excludeIds.includes(String(t.id_tipo_ubicacion_topologica)) && !excludeIds.includes(t.id_tipo_ubicacion_topologica));
      // Limpiar y poblar
      populateSelect(selTipoGeneral, tiposToShow, 'id_tipo_ubicacion_topologica', 'tipo', 'Seleccione tipo (Almacén general)');
      populateSelect(selTipoSub, tiposToShow, 'id_tipo_ubicacion_topologica', 'tipo', 'Seleccione tipo (Subdivisión)');
      populateSelect(selTipoSub2, tiposToShow, 'id_tipo_ubicacion_topologica', 'tipo', 'Seleccione tipo (Subdivisión 2)');
    }

    fillTipoSelectsExcluding([]);

    // Poblar topográficas
    populateSelect(selTopografica, topograficas, 'id_ubicacion_topografica', 'ubicacion', 'Seleccione ubicación topográfica');

    // Eventos: cuando se selecciona un tipo cargamos sus ubicaciones
    async function cargarUbicacionesPara(tipoSelect, ubiSelect) {
      const tipoId = tipoSelect.value;
      populateSelectWithPlaceholder(ubiSelect, 'Cargando...');
      if (!tipoId) {
        populateSelectWithPlaceholder(ubiSelect, 'Seleccione primero tipo');
        ubiSelect.disabled = true;
        return;
      }
      try {
        const rows = await window.electronAPI.getUbicacionesTopologicasPorTipo(tipoId);
        populateSelect(ubiSelect, rows, 'id_ubicacion_topologica', 'ubicacion', 'Seleccione ubicación');
      } catch (err) {
        console.error('Error cargando ubicaciones por tipo:', err);
        populateSelectWithPlaceholder(ubiSelect, 'Error al cargar');
        ubiSelect.disabled = true;
      }
    }

    selTipoGeneral.addEventListener('change', async () => {
      await cargarUbicacionesPara(selTipoGeneral, selUbiGeneral);
      // actualizar tipos disponibles en los otros selects para excluir el seleccionado
      const exclude = [selTipoGeneral.value].filter(Boolean);
      fillTipoSelectsExcluding(exclude);
    });

    selTipoSub.addEventListener('change', async () => {
      await cargarUbicacionesPara(selTipoSub, selUbiSub);
      const exclude = [selTipoGeneral.value, selTipoSub.value].filter(Boolean);
      fillTipoSelectsExcluding(exclude);
    });

    selTipoSub2.addEventListener('change', async () => {
      await cargarUbicacionesPara(selTipoSub2, selUbiSub2);
      const exclude = [selTipoGeneral.value, selTipoSub.value, selTipoSub2.value].filter(Boolean);
      fillTipoSelectsExcluding(exclude);
    });

    // Inicial: deshabilitar ubi selects hasta seleccionar tipo
    selUbiGeneral.disabled = true;
    selUbiSub.disabled = true;
    selUbiSub2.disabled = true;

  } catch (err) {
    console.error('Error inicializando selects:', err);
  }
});

//funcion para validar formulario regitro de obras
function validarFormulario(datos) {
  const errores = [];

  if (!datos.id_artista) errores.push("Seleccione un artista");
  if (!datos.id_sigropam) errores.push("Coloque el No. Sigropam");
  if (!datos.titulo || !datos.titulo.trim()) errores.push("Ingrese el título");
  if (!/^\d{4}$/.test(datos.fecha)) errores.push("Ingrese un año válido (4 dígitos)");
  if (!datos.ubi_general) errores.push("Seleccione ubicación topológica (almacén general)");

  // Dimensiones
  ["medidas_soporte_ancho", "medidas_soporte_largo", "medidas_imagen_ancho", "medidas_imagen_largo"].forEach(campo => {
    if (datos[campo] && isNaN(Number(datos[campo]))) {
      errores.push(`${campo.replace(/_/g, " ")} debe ser un número`);
    }
  });

  return errores;
}

// Botones para abrir el diálogo nativo
/* document.getElementById('btnImgBaja').addEventListener('click', async () => {
  const ruta = await window.electronAPI.seleccionarImagen();
  if (ruta) document.getElementById('img_baja_path').value = ruta;
  console.log('ruta_baja', ruta);
});

document.getElementById('btnImgAlta').addEventListener('click', async () => {
  const ruta = await window.electronAPI.seleccionarImagen();
  if (ruta) document.getElementById('img_alta_path').value = ruta;
  console.log('ruta_alta', ruta);
}); */

//hacer validacion al dar click en guardar
document.getElementById("btnGuardar").addEventListener("click", async () => {
  const datos = {
    id_artista: document.getElementById("id_artista").value,
    id_sigropam: document.getElementById("sigropam").value,
    titulo: document.getElementById("titulo").value,
    descripcion: document.getElementById("descripcion").value,
    fecha: document.getElementById("fecha").value,
    id_tecnica: document.getElementById("id_tecnica").value,
    tiraje: document.getElementById("tiraje").value,
    medidas_soporte_ancho: document.getElementById("soporte_ancho").value,
    medidas_soporte_largo: document.getElementById("soporte_largo").value,
    medidas_imagen_ancho: document.getElementById("imagen_ancho").value,
    medidas_imagen_largo: document.getElementById("imagen_largo").value,
    ubi_general: document.getElementById("ubi_general").value,
    ubi_sub: document.getElementById("ubi_sub").value,
    ubi_sub2: document.getElementById("ubi_sub2").value,
    ubi_topo_manual: document.getElementById("ubi_manual").value,
    id_ubi_topografica: document.getElementById("id_ubi_topografica").value,
    observaciones: document.getElementById("observaciones").value,
    estado_conservacion: document.getElementById("estado_conservacion").value,
    exposiciones: document.getElementById("exposiciones").value,
    imagenes_baja: imgsBaja,   // <<--- ahora arrays
    imagenes_alta: imgsAlta    // <<--- ahora arrays
  };
  console.log(datos);
  const errores = validarFormulario(datos);
  if (errores.length) {
    alert("Errores:\n" + errores.join("\n"));
    return;
  } else {
    console.log('datos validados:', datos);
  }

  // Enviar a main.js
  const resultado = await window.electronAPI.guardarObra(datos);
  if (resultado.success) {
    alert("¡Registro exitoso!");
    document.getElementById("form-obra").reset();
    imgsBaja = []; imgsAlta = [];
    renderAllLists();
  } else {
    alert("Error al guardar la obra:\n" + resultado.error);
    //console.log(resultado.error);
  }
});

//Funciones para agregar multiples imagenes
// --- Estado en memoria ---
let imgsBaja = [];
let imgsAlta = [];

function baseName(p) {
  // muestra solo nombre.ext
  try { return p.split(/[/\\]/).pop(); } catch { return p; }
}

function renderList(listEl, items) {
  listEl.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "list-group-item text-muted";
    li.textContent = "Sin imágenes";
    listEl.appendChild(li);
    return;
  }
  items.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = baseName(p);

    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-danger";
    btn.textContent = "Quitar";
    btn.onclick = () => {
      items.splice(idx, 1);
      renderAllLists();
    };

    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function renderAllLists() {
  renderList(document.getElementById("listBaja"), imgsBaja);
  renderList(document.getElementById("listAlta"), imgsAlta);
  document.getElementById("bajaCount").textContent = `(${imgsBaja.length}/4)`;
  document.getElementById("altaCount").textContent = `(${imgsAlta.length}/4)`;
}

document.getElementById("btnAddBaja").addEventListener("click", async () => {
  const cupo = 4 - imgsBaja.length;
  if (cupo <= 0) return alert("Ya tienes 4 imágenes de baja.");
  const paths = await window.electronAPI.seleccionarImagenes({ max: cupo });
  // evita duplicados
  paths.forEach(p => { if (!imgsBaja.includes(p)) imgsBaja.push(p); });
  renderAllLists();
});

document.getElementById("btnAddAlta").addEventListener("click", async () => {
  const cupo = 4 - imgsAlta.length;
  if (cupo <= 0) return alert("Ya tienes 4 imágenes de alta.");
  const paths = await window.electronAPI.seleccionarImagenes({ max: cupo });
  paths.forEach(p => { if (!imgsAlta.includes(p)) imgsAlta.push(p); });
  renderAllLists();
});

window.electronAPI.onArtistaAgregado(async () => {
  console.log("Refrescando artistas");
  //alert("Refrescando artistas");

  const artistas = await window.electronAPI.getArtistas();
  const selArtista = document.getElementById("id_artista");
  populateSelect(selArtista, artistas, 'id_artista',
    (r) => `${(r.apellido_paterno || '')} ${(r.apellido_materno || '')}, ${r.nombre}`.trim(),
    'Seleccione un artista *');
});



// Llama render inicial para mostrar "Sin imágenes"
renderAllLists();



