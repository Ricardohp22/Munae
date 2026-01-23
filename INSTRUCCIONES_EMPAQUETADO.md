# Instrucciones para Empaquetar la Aplicación MUNAE

## Cambios Realizados para Producción

### 1. Rutas Persistentes
La aplicación ahora usa rutas persistentes que funcionan tanto en desarrollo como en producción:

- **En desarrollo**: Los datos se guardan en la carpeta `data/` del proyecto
- **En producción**: Los datos se guardan en la carpeta de datos del usuario:
  - **Windows**: `C:\Users\[Usuario]\AppData\Roaming\munae\data\`
  - **Linux**: `~/.config/munae/data/`
  - **macOS**: `~/Library/Application Support/munae/data/`

### 2. Archivos Modificados
- `src/paths.js` - Nuevo módulo para manejar rutas persistentes
- `src/database.js` - Modificado para usar rutas del usuario
- `main.js` - Modificado para usar rutas persistentes en imágenes y base de datos
- `package.json` - Configurado `electron-builder` para empaquetar

### 3. Migración Automática
Si la aplicación detecta datos en la carpeta del proyecto al ejecutarse por primera vez en producción, los migrará automáticamente a la carpeta del usuario.

## Pasos para Empaquetar

### Prerrequisitos
1. Asegúrate de tener Node.js instalado
2. Instala las dependencias:
   ```bash
   npm install
   ```

### Opción 1: Empaquetar para Windows (Recomendado)
```bash
npm run build:win
```

Esto generará un instalador `.exe` en la carpeta `dist/`.

### Opción 2: Empaquetar para todas las plataformas
```bash
npm run build
```

### Opción 3: Solo generar el ejecutable sin instalador
```bash
npm run dist
```

## Estructura del Ejecutable

Después de empaquetar, encontrarás en la carpeta `dist/`:
- **MUNAE Setup X.X.X.exe** - Instalador de Windows
- **win-unpacked/** - Carpeta con los archivos descomprimidos (útil para pruebas)

## Instalación en Otra Computadora

1. Copia el archivo `MUNAE Setup X.X.X.exe` a la computadora destino
2. Ejecuta el instalador
3. Sigue las instrucciones del instalador
4. La aplicación se instalará y creará accesos directos en el escritorio y menú de inicio

## Ubicación de Datos en Producción

Una vez instalada la aplicación, los datos se guardarán en:
- **Base de datos**: `C:\Users\[Usuario]\AppData\Roaming\munae\data\munae.db`
- **Imágenes**: `C:\Users\[Usuario]\AppData\Roaming\munae\data\images\`

**Nota importante**: Los datos NO se guardan en la carpeta de instalación, sino en la carpeta de datos del usuario. Esto permite:
- Mantener los datos al desinstalar/reinstalar la aplicación
- Evitar problemas de permisos
- Separar datos de diferentes usuarios en la misma computadora

## Verificación Post-Instalación

Después de instalar en otra computadora:
1. Ejecuta la aplicación
2. Verifica que puedas iniciar sesión
3. Intenta agregar una obra de prueba
4. Verifica que las imágenes se guarden correctamente
5. Comprueba que los datos persistan después de cerrar y abrir la aplicación

## Solución de Problemas

### Error: "La base de datos no ha sido inicializada"
- Asegúrate de que la aplicación se ejecute correctamente
- Verifica que la carpeta de datos del usuario tenga permisos de escritura

### Las imágenes no se guardan
- Verifica que la carpeta `data/images` se cree automáticamente
- Comprueba los permisos de escritura en la carpeta del usuario

### La aplicación no inicia
- Verifica que todas las dependencias estén incluidas en el empaquetado
- Revisa la consola de desarrollador (Ctrl+Shift+I) para ver errores

## Notas Adicionales

- El instalador permite elegir la carpeta de instalación
- Se crean accesos directos automáticamente
- La aplicación se puede desinstalar desde el Panel de Control de Windows
- Los datos del usuario NO se eliminan al desinstalar (por diseño, para preservar información)
