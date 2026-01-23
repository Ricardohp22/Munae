# Solución: Icono Personalizado en el Ejecutable

## 🔍 Problema

El ejecutable muestra el icono por defecto de Electron en lugar del icono personalizado (`icon.ico`).

## ✅ Solución

### Paso 1: Verificar el Icono

El icono debe estar en formato `.ico` y contener múltiples resoluciones:
- 16x16
- 32x32
- 48x48
- 256x256

**Ubicación actual**: `assets/icon.ico` ✅

### Paso 2: Limpiar Caché de Windows

Windows puede estar cacheando el icono anterior. Para limpiar la caché:

1. **Cierra todas las instancias de MUNAE.exe**
2. **Elimina la caché de iconos de Windows**:
   - Abre el Explorador de Archivos
   - Ve a: `C:\Users\[TuUsuario]\AppData\Local\IconCache.db`
   - Elimina el archivo (puede requerir reiniciar el Explorador)
   - O simplemente reinicia la computadora

### Paso 3: Regenerar el Ejecutable

1. **Elimina la carpeta `dist`** (o al menos `dist/win-unpacked`):
   ```bash
   rm -rf dist
   # O en Windows:
   rmdir /s /q dist
   ```

2. **Regenera el ejecutable**:
   ```bash
   npm run build:win
   ```

3. **Verifica el nuevo ejecutable**:
   - Navega a `dist/win-unpacked/`
   - Verifica que `MUNAE.exe` muestre el icono correcto

### Paso 4: Si el Icono Aún No Aparece

#### Opción A: Verificar el Formato del Icono

El archivo `.ico` debe contener múltiples resoluciones. Puedes verificar/editarlo con:

- **IcoFX** (gratis): https://icofx.ro/
- **Greenfish Icon Editor Pro** (gratis): https://greenfishsoftware.org/gfie.php
- **GIMP** (gratis): https://www.gimp.org/

**Crear un icono con múltiples resoluciones**:
1. Abre tu imagen en el editor
2. Exporta como `.ico` asegurándote de incluir:
   - 16x16
   - 32x32
   - 48x48
   - 256x256

#### Opción B: Usar rcedit (Herramienta de Electron)

Si el icono aún no se aplica, puedes usar `rcedit` para cambiar el icono después de generar el ejecutable:

1. **Instala rcedit**:
   ```bash
   npm install --save-dev rcedit
   ```

2. **Crea un script** `fix-icon.js`:
   ```javascript
   const rcedit = require('rcedit');
   const path = require('path');

   rcedit(path.join(__dirname, 'dist/win-unpacked/MUNAE.exe'), {
     icon: path.join(__dirname, 'assets/icon.ico')
   }).then(() => {
     console.log('Icono aplicado correctamente');
   }).catch((err) => {
     console.error('Error aplicando icono:', err);
   });
   ```

3. **Ejecuta el script** después de generar el ejecutable:
   ```bash
   node fix-icon.js
   ```

#### Opción C: Verificar la Configuración

Asegúrate de que `package.json` tenga:

```json
"win": {
  "icon": "assets/icon.ico",
  "iconPath": "assets/icon.ico"
}
```

## 🔄 Proceso Completo Recomendado

1. **Cierra MUNAE.exe** si está corriendo
2. **Elimina la carpeta dist**:
   ```bash
   rmdir /s /q dist
   ```
3. **Regenera el ejecutable**:
   ```bash
   npm run build:win
   ```
4. **Verifica el icono** en `dist/win-unpacked/MUNAE.exe`
5. **Si no aparece, limpia la caché de Windows** y vuelve a verificar

## 📝 Notas Importantes

- **Caché de Windows**: Windows cachea los iconos de los ejecutables. Puede tomar unos minutos o un reinicio para que se actualice.
- **Formato del icono**: El archivo `.ico` debe contener múltiples resoluciones para funcionar correctamente en Windows.
- **Ubicación**: El icono debe estar en `assets/icon.ico` relativo a la raíz del proyecto.

## ✅ Verificación

Después de regenerar, verifica:

1. ✅ El archivo `MUNAE.exe` en `dist/win-unpacked/` muestra tu icono
2. ✅ El icono aparece en el Explorador de Archivos
3. ✅ El icono aparece en la barra de tareas cuando la app está corriendo
4. ✅ El icono aparece en el Administrador de Tareas

## 🆘 Si Nada Funciona

1. **Verifica que el icono tenga el formato correcto**:
   - Abre `assets/icon.ico` en un visor de iconos
   - Debe mostrar múltiples tamaños

2. **Prueba con un icono de prueba**:
   - Descarga un icono de prueba de https://www.iconfinder.com/
   - Reemplaza `assets/icon.ico` temporalmente
   - Regenera el ejecutable
   - Si funciona, el problema es el formato de tu icono original

3. **Usa rcedit** (Opción B arriba) para forzar el cambio de icono
