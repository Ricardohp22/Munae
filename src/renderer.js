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
    console.log(valueKey);
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
