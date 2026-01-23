# Cómo Generar un Instalador NSIS para MUNAE

## 📋 Pasos para Generar el Instalador

### Paso 1: Modificar package.json

Abre `package.json` y cambia la configuración de `win.target`:

**ANTES (carpeta descomprimida)**:
```json
"win": {
  "target": [
    {
      "target": "dir",
      "arch": ["x64"]
    }
  ],
  ...
}
```

**DESPUÉS (instalador NSIS)**:
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    }
  ],
  ...
}
```

### Paso 2: Generar el Instalador

1. **Abre la terminal** en la carpeta del proyecto

2. **Cierra todas las instancias de MUNAE.exe** (si están corriendo)

3. **Ejecuta el comando**:
   ```bash
   npm run build:win
   ```

4. **Espera a que termine**:
   - Puede tardar 5-10 minutos
   - Verás mensajes de progreso en la consola
   - Al final, verás un mensaje de éxito

### Paso 3: Ubicación del Instalador

El instalador se generará en:
```
dist\MUNAE Setup 1.0.0.exe
```

**Tamaño aproximado**: ~200-250 MB

### Paso 4: Probar el Instalador

1. **Ejecuta el instalador** en tu propia computadora
2. **Sigue el asistente** de instalación
3. **Verifica** que la aplicación funcione correctamente
4. **Desinstala** desde el Panel de Control para probar el desinstalador

### Paso 5: Distribuir

1. **Copia** `MUNAE Setup 1.0.0.exe` a:
   - USB/Disco externo
   - Servicio en la nube (Google Drive, OneDrive, etc.)
   - Red local

2. **En la computadora destino**:
   - Ejecuta el instalador
   - Sigue las instrucciones en `GUIA_INSTALACION.md`

---

## ⚙️ Configuración del Instalador

La configuración actual en `package.json` incluye:

```json
"nsis": {
  "oneClick": false,                    // Asistente de instalación (no instalación en un clic)
  "allowToChangeInstallationDirectory": true,  // Permite elegir carpeta de instalación
  "createDesktopShortcut": true,        // Crea acceso directo en escritorio
  "createStartMenuShortcut": true       // Crea acceso directo en menú de inicio
}
```

### Opciones Adicionales (Opcional)

Puedes agregar más opciones al objeto `nsis`:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "installerIcon": "assets/icon.ico",           // Icono del instalador
  "uninstallerIcon": "assets/icon.ico",         // Icono del desinstalador
  "installerHeaderIcon": "assets/icon.ico",     // Icono en el encabezado
  "deleteAppDataOnUninstall": false,             // NO eliminar datos al desinstalar
  "runAfterFinish": true,                        // Ejecutar app después de instalar
  "menuCategory": "Office"                       // Categoría en el menú de inicio
}
```

---

## 🔄 Volver a Generar Carpeta Descomprimida

Si quieres volver a generar solo la carpeta `win-unpacked`:

1. Cambia `"target": "nsis"` a `"target": "dir"` en `package.json`
2. Ejecuta `npm run build:win`
3. La carpeta estará en `dist/win-unpacked/`

---

## ⚠️ Notas Importantes

1. **Tiempo de generación**: El instalador tarda más en generarse que la carpeta descomprimida
2. **Tamaño**: El instalador es más pequeño (~200 MB) que la carpeta descomprimida (~250 MB)
3. **Firma digital**: El instalador no está firmado, Windows mostrará advertencia de seguridad
4. **Datos**: Los datos se guardan en `AppData\Roaming\munae\`, no en la carpeta de instalación

---

## ✅ Ventajas del Instalador NSIS

- ✅ Instalación profesional con asistente
- ✅ Accesos directos automáticos
- ✅ Desinstalador integrado
- ✅ Menor tamaño (comprimido)
- ✅ Mejor experiencia de usuario
- ✅ Aparece en "Aplicaciones instaladas" de Windows

---

## 📝 Comparación

| Característica | Carpeta Completa | Instalador NSIS |
|---------------|------------------|-----------------|
| Tamaño | ~250 MB | ~200 MB |
| Instalación | Copiar y ejecutar | Asistente de instalación |
| Accesos directos | Manual | Automático |
| Desinstalador | Manual | Automático |
| Tiempo de generación | ~3-5 min | ~5-10 min |
| Facilidad de uso | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
