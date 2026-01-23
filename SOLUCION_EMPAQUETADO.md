# Solución para el Problema de Empaquetado

## Problema Encontrado

El empaquetado falla al intentar extraer herramientas de firma de código (`winCodeSign`) que contienen archivos de macOS con enlaces simbólicos. Windows requiere privilegios de administrador para crear enlaces simbólicos.

**Error**: `ERROR: Cannot create symbolic link : El cliente no dispone de un privilegio requerido`

## Soluciones

### Opción 1: Ejecutar como Administrador (RECOMENDADO) ✅

1. Abre PowerShell o CMD **como Administrador**
2. Navega a la carpeta del proyecto:
   ```powershell
   cd C:\Users\ricar\Desktop\docs\Electron\Munae
   ```
3. Ejecuta el empaquetado:
   ```powershell
   npm run build:win
   ```

### Opción 2: Usar el Ejecutable Generado (Si ya existe)

Aunque el proceso falle al final, es posible que el ejecutable ya se haya generado en:
```
dist\win-unpacked\MUNAE.exe
```

Puedes usar este ejecutable directamente sin necesidad del instalador.

### Opción 3: Deshabilitar Completamente la Firma

Agrega esta variable de entorno antes de ejecutar:

**En PowerShell (como Administrador):**
```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
npm run build:win
```

**En CMD (como Administrador):**
```cmd
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:win
```

### Opción 4: Usar Solo el Ejecutable Portable

Modifica `package.json` para generar solo un ejecutable portable:

```json
"win": {
  "target": [
    {
      "target": "portable",
      "arch": ["x64"]
    }
  ],
  "icon": "assets/icon.ico",
  "sign": false
}
```

Luego ejecuta:
```bash
npm run build:win
```

## Verificación

Después de empaquetar, verifica que existan estos archivos:

- **Con instalador NSIS**: `dist\MUNAE Setup X.X.X.exe`
- **Ejecutable portable**: `dist\MUNAE X.X.X.exe`
- **Carpeta descomprimida**: `dist\win-unpacked\MUNAE.exe`

## Nota Importante

El error de enlaces simbólicos **NO afecta la funcionalidad** de la aplicación. Solo impide completar el proceso de firma de código, que no es necesario para desarrollo o distribución interna.
