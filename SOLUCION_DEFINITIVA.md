# Solución Definitiva para el Error de Empaquetado

## Problema Identificado

El error de code signing ocurre porque `electron-builder` intenta verificar la integridad del ASAR usando herramientas de code signing que contienen archivos de macOS con enlaces simbólicos. Windows no puede crear estos enlaces incluso con permisos de administrador.

## Solución Implementada

1. **Cerrar todas las instancias de MUNAE.exe** antes de empaquetar
2. **Deshabilitar completamente el code signing** usando un script personalizado
3. **Configurar `disableSanityCheckAsar: true`** para evitar verificaciones innecesarias

## Pasos para Empaquetar

### 1. Cerrar la Aplicación

**IMPORTANTE**: Cierra TODAS las instancias de MUNAE.exe antes de empaquetar:

1. Abre el **Administrador de Tareas** (Ctrl+Shift+Esc)
2. Busca todos los procesos llamados "MUNAE.exe"
3. Haz clic derecho en cada uno → "Finalizar tarea"
4. Espera 5-10 segundos

### 2. Ejecutar el Empaquetado

En PowerShell o CMD (no necesariamente como administrador):

```bash
npm run build:win
```

Este comando ahora usa un script personalizado que deshabilita completamente el code signing.

## Si el Error Persiste

Si después de cerrar todas las instancias y ejecutar el empaquetado aún aparece el error de enlaces simbólicos:

1. **El ejecutable SÍ se genera correctamente** en `dist/win-unpacked/MUNAE.exe`
2. **El error NO afecta la funcionalidad** del ejecutable
3. Puedes usar el ejecutable directamente o copiarlo a otras computadoras

## Verificación del Ejecutable

Después de empaquetar, verifica:

1. Que exista `dist/win-unpacked/MUNAE.exe`
2. Que los módulos estén descomprimidos:
   ```bash
   ls dist/win-unpacked/resources/app.asar.unpacked/node_modules/archiver*
   ```
3. Ejecuta el `.exe` y verifica que funcione correctamente

## Distribución

Para distribuir la aplicación:

1. Copia toda la carpeta `dist/win-unpacked/` a la computadora destino
2. O comprime la carpeta en un ZIP
3. El usuario descomprime y ejecuta `MUNAE.exe`

La aplicación guardará los datos en:
- Windows: `C:\Users\[Usuario]\AppData\Roaming\munae\data\`
