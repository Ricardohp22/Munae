# Guía de Instalación - MUNAE en Windows

## 📦 Opciones de Distribución

Tienes dos opciones para distribuir la aplicación:

### Opción 1: Carpeta Completa (Actual) ✅
- **Ventaja**: No requiere instalación, solo copiar y ejecutar
- **Desventaja**: Ocupa más espacio (todos los archivos visibles)
- **Ubicación**: `dist/win-unpacked/`

### Opción 2: Instalador NSIS (Recomendado para distribución)
- **Ventaja**: Instalación profesional, accesos directos automáticos, desinstalador
- **Desventaja**: Requiere generar el instalador primero
- **Ubicación**: `dist/MUNAE Setup X.X.X.exe`

---

## 🚀 OPCIÓN 1: Instalación usando Carpeta Completa

### Paso 1: Preparar los Archivos para Distribución

1. **Navega a la carpeta `dist`**:
   ```
   C:\Users\ricar\Desktop\docs\Electron\Munae\dist
   ```

2. **Comprime la carpeta `win-unpacked`**:
   - Haz clic derecho en la carpeta `win-unpacked`
   - Selecciona "Enviar a" → "Carpeta comprimida (en zip)"
   - O usa WinRAR/7-Zip para crear un archivo comprimido
   - **Nombre sugerido**: `MUNAE-v1.0.0.zip`

### Paso 2: Transferir a la Computadora Destino

**Método A: USB/Disco Externo**
1. Copia el archivo ZIP a una unidad USB o disco externo
2. Transfiere el archivo a la computadora destino

**Método B: Red Local**
1. Comparte la carpeta `dist` en la red
2. Accede desde la computadora destino y copia el ZIP

**Método C: Servicio en la Nube**
1. Sube el ZIP a Google Drive, OneDrive, Dropbox, etc.
2. Descarga en la computadora destino

### Paso 3: Instalación en la Computadora Destino

1. **Extrae el archivo ZIP**:
   - Haz clic derecho en `MUNAE-v1.0.0.zip`
   - Selecciona "Extraer todo..."
   - Elige una ubicación (ej: `C:\Programas\MUNAE` o `C:\Users\[Usuario]\Desktop\MUNAE`)
   - Haz clic en "Extraer"

2. **Verifica la estructura**:
   - Debe haber un archivo `MUNAE.exe` en la carpeta extraída
   - Debe haber una carpeta `resources` y otros archivos DLL

3. **Ejecuta la aplicación**:
   - Haz doble clic en `MUNAE.exe`
   - La primera vez, Windows puede mostrar una advertencia de seguridad
   - Haz clic en "Más información" → "Ejecutar de todas formas"

4. **Crear acceso directo (Opcional pero recomendado)**:
   - Haz clic derecho en `MUNAE.exe`
   - Selecciona "Crear acceso directo"
   - Mueve el acceso directo al Escritorio o al Menú de Inicio

### Paso 4: Configuración Inicial

1. **Primera ejecución**:
   - La aplicación creará automáticamente la carpeta de datos en:
     ```
     C:\Users\[Usuario]\AppData\Roaming\munae\data\
     ```
   - Se creará la base de datos `munae.db` automáticamente

2. **Crear usuario administrador**:
   - Abre la base de datos con DB Browser for SQLite (ver `ACCESO_BASE_DATOS.md`)
   - Ejecuta este SQL:
     ```sql
     INSERT INTO usuarios (usuario, password, rol) 
     VALUES ('admin', 'tu_password_aqui', 'admin');
     ```
   - O usa la aplicación directamente si ya tienes usuarios creados

3. **Verificar funcionamiento**:
   - Inicia sesión con el usuario creado
   - Intenta agregar una obra de prueba
   - Verifica que las imágenes se guarden correctamente

---

## 🎯 OPCIÓN 2: Generar Instalador NSIS (Recomendado)

### Paso 1: Modificar package.json para Generar Instalador

Actualiza la configuración en `package.json`:

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    }
  ],
  "icon": "assets/icon.ico",
  "sign": false,
  "forceCodeSigning": false,
  "signingHashAlgorithms": [],
  "verifyUpdateCodeSignature": false,
  "certificateFile": null,
  "certificatePassword": null
}
```

### Paso 2: Generar el Instalador

1. **Abre la terminal** en la carpeta del proyecto

2. **Ejecuta el comando**:
   ```bash
   npm run build:win
   ```

3. **Espera a que termine** (puede tardar varios minutos)

4. **Ubicación del instalador**:
   ```
   dist\MUNAE Setup 1.0.0.exe
   ```

### Paso 3: Distribuir el Instalador

1. **Copia el archivo** `MUNAE Setup 1.0.0.exe` a:
   - USB/Disco externo
   - Servicio en la nube
   - Red local

### Paso 4: Instalación en la Computadora Destino

1. **Ejecuta el instalador**:
   - Haz doble clic en `MUNAE Setup 1.0.0.exe`
   - Windows puede mostrar advertencia de seguridad
   - Haz clic en "Más información" → "Ejecutar de todas formas"

2. **Sigue el asistente de instalación**:
   - **Bienvenida**: Haz clic en "Siguiente"
   - **Ubicación de instalación**: 
     - Por defecto: `C:\Users\[Usuario]\AppData\Local\Programs\munae`
     - Puedes cambiar la ubicación si lo deseas
     - Haz clic en "Siguiente"
   - **Accesos directos**:
     - ✅ Crear acceso directo en el escritorio (recomendado)
     - ✅ Crear acceso directo en el menú de inicio (recomendado)
     - Haz clic en "Siguiente"
   - **Instalar**: Haz clic en "Instalar"
   - **Completado**: Haz clic en "Finalizar"

3. **Ejecutar la aplicación**:
   - Desde el acceso directo del escritorio
   - O desde el menú de inicio buscando "MUNAE"

4. **Configuración inicial**:
   - Sigue los pasos del "Paso 4" de la Opción 1

---

## 📍 Ubicación de Datos

**IMPORTANTE**: Los datos NO se guardan en la carpeta de instalación, sino en:

```
C:\Users\[Usuario]\AppData\Roaming\munae\data\
```

**Contenido**:
- `munae.db` - Base de datos
- `images/` - Carpeta con todas las imágenes de las obras

**Ventajas de esta ubicación**:
- ✅ Los datos persisten al desinstalar/reinstalar
- ✅ No requiere permisos de administrador
- ✅ Separado por usuario (múltiples usuarios en la misma PC)

---

## 🔧 Desinstalación

### Si usaste Opción 1 (Carpeta completa):
1. Simplemente elimina la carpeta donde extrajiste los archivos
2. Elimina los accesos directos manualmente
3. **Opcional**: Elimina los datos en `AppData\Roaming\munae\` si quieres borrar todo

### Si usaste Opción 2 (Instalador):
1. Abre "Configuración" de Windows
2. Ve a "Aplicaciones" → "Aplicaciones y características"
3. Busca "MUNAE"
4. Haz clic en "Desinstalar"
5. **Nota**: Los datos en `AppData\Roaming\munae\` NO se eliminan automáticamente

---

## ✅ Verificación Post-Instalación

Después de instalar en otra computadora, verifica:

1. ✅ La aplicación inicia correctamente
2. ✅ Puedes iniciar sesión (después de crear un usuario)
3. ✅ Puedes agregar una obra
4. ✅ Las imágenes se guardan correctamente
5. ✅ Los datos persisten después de cerrar y abrir la aplicación
6. ✅ Puedes ver las obras en la búsqueda
7. ✅ Puedes abrir fichas de obras

---

## ⚠️ Solución de Problemas

### Error: "Windows protegió tu PC"
**Solución**:
1. Haz clic en "Más información"
2. Haz clic en "Ejecutar de todas formas"
3. Esto ocurre porque la aplicación no está firmada digitalmente

### Error: "No se puede ejecutar la aplicación"
**Solución**:
1. Verifica que la computadora tenga Windows 10 o superior
2. Verifica que todos los archivos se copiaron correctamente
3. Intenta ejecutar como administrador (clic derecho → "Ejecutar como administrador")

### La aplicación no guarda datos
**Solución**:
1. Verifica que la carpeta `AppData\Roaming\munae\data\` existe
2. Verifica permisos de escritura en esa carpeta
3. Ejecuta la aplicación como administrador si es necesario

### No puedo iniciar sesión
**Solución**:
1. Verifica que la base de datos existe en `AppData\Roaming\munae\data\munae.db`
2. Crea un usuario manualmente usando DB Browser (ver `ACCESO_BASE_DATOS.md`)
3. Verifica que la tabla `usuarios` existe

---

## 📝 Notas Importantes

1. **Primera ejecución**: La aplicación creará automáticamente todas las tablas necesarias
2. **Usuarios**: Necesitas crear al menos un usuario antes de poder usar la aplicación
3. **Datos**: Los datos se guardan por usuario, cada usuario tiene su propia base de datos
4. **Actualizaciones**: Para actualizar, simplemente reemplaza los archivos o reinstala
5. **Backup**: Haz backup de `AppData\Roaming\munae\data\` regularmente

---

## 🎁 Distribución Rápida (Resumen)

**Para distribución rápida usando la carpeta actual**:

1. Comprime `dist/win-unpacked/` en un ZIP
2. Envía el ZIP a la computadora destino
3. Extrae el ZIP
4. Ejecuta `MUNAE.exe`
5. Crea un usuario en la base de datos
6. ¡Listo!

**Tamaño aproximado**: ~200-250 MB (comprimido: ~150-180 MB)
