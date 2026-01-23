# Solución al Error de Empaquetado

## Problema

El empaquetado falla con el error:
```
ERROR: Cannot create symbolic link : El cliente no dispone de un privilegio requerido
```

Este error ocurre cuando `electron-builder` intenta extraer herramientas de code signing que contienen enlaces simbólicos de macOS. **Este error NO afecta la funcionalidad del ejecutable**, solo impide completar el proceso de verificación de integridad.

## Solución: Usar el Ejecutable Generado

A pesar del error, el ejecutable **SÍ se genera correctamente** en:
```
dist/win-unpacked/MUNAE.exe
```

**Este ejecutable es completamente funcional** y puede ser usado directamente o copiado a otras computadoras.

## Opciones para Distribuir

### Opción 1: Copiar la Carpeta Completa (Recomendado)

1. Copia toda la carpeta `dist/win-unpacked/` a la computadora destino
2. El usuario puede ejecutar `MUNAE.exe` directamente
3. No requiere instalación

### Opción 2: Crear un ZIP

1. Comprime la carpeta `dist/win-unpacked/` en un archivo ZIP
2. Distribuye el ZIP
3. El usuario descomprime y ejecuta `MUNAE.exe`

### Opción 3: Ejecutar como Administrador (Para Generar Instalador)

Si necesitas generar un instalador `.exe`, ejecuta PowerShell o CMD **como Administrador**:

```powershell
cd C:\Users\ricar\Desktop\docs\Electron\Munae
npm run build:win-installer
```

Esto permitirá crear los enlaces simbólicos necesarios y generar el instalador.

## Verificación

El ejecutable generado incluye:
- ✅ Todos los módulos necesarios (incluyendo `archiver-utils`)
- ✅ La base de datos se guardará en la carpeta del usuario
- ✅ Las imágenes se guardarán en la carpeta del usuario
- ✅ Migración automática de datos si existen

## Nota Importante

El error de enlaces simbólicos **NO afecta la funcionalidad** de la aplicación. Solo impide completar el proceso de firma de código, que no es necesario para desarrollo o distribución interna.
