# Guía para Acceder a la Base de Datos Manualmente

## 📍 Ubicación de la Base de Datos

### En Desarrollo
La base de datos se encuentra en la carpeta del proyecto:
```
C:\Users\ricar\Desktop\docs\Electron\Munae\data\munae.db
```

### En Producción (Aplicación Empaquetada)
La base de datos se encuentra en la carpeta de datos del usuario:

**Windows:**
```
C:\Users\[TuUsuario]\AppData\Roaming\munae\data\munae.db
```

**Ejemplo completo:**
```
C:\Users\ricar\AppData\Roaming\munae\data\munae.db
```

**Nota:** `AppData` es una carpeta oculta. Para acceder:
1. Abre el Explorador de Archivos
2. En la barra de direcciones, escribe: `%APPDATA%\munae\data`
3. O navega manualmente a: `C:\Users\[TuUsuario]\AppData\Roaming\munae\data`

## 🛠️ Herramientas para Acceder a la Base de Datos

### Opción 1: SQLite Browser (DB Browser for SQLite) - Recomendado

**Descarga:**
- Sitio oficial: https://sqlitebrowser.org/
- Descarga directa: https://sqlitebrowser.org/dl/

**Instalación:**
1. Descarga el instalador para Windows
2. Ejecuta el instalador y sigue las instrucciones
3. Abre DB Browser for SQLite

**Uso:**
1. Abre DB Browser for SQLite
2. Click en "Abrir Base de Datos" (Open Database)
3. Navega a la ubicación de `munae.db` (ver arriba)
4. Selecciona el archivo y haz click en "Abrir"
5. Ahora puedes:
   - Ver todas las tablas en la pestaña "Estructura de Base de Datos"
   - Ejecutar consultas SQL en la pestaña "Ejecutar SQL"
   - Ver y editar datos en la pestaña "Datos de Navegación"

### Opción 2: SQLite Command Line (sqlite3)

**Instalación:**
1. Descarga SQLite desde: https://www.sqlite.org/download.html
2. Descarga el archivo `sqlite-tools-win32-x86-XXXXXXX.zip`
3. Extrae el archivo `sqlite3.exe` a una carpeta (ej: `C:\sqlite\`)
4. Agrega la carpeta al PATH del sistema (opcional)

**Uso desde la línea de comandos:**
```bash
# Navegar a la carpeta donde está sqlite3.exe
cd C:\sqlite

# Abrir la base de datos
sqlite3 "C:\Users\ricar\AppData\Roaming\munae\data\munae.db"

# O desde Git Bash (si está en el PATH)
sqlite3 ~/AppData/Roaming/munae/data/munae.db
```

**Comandos útiles de SQLite:**
```sql
-- Ver todas las tablas
.tables

-- Ver estructura de una tabla
.schema usuarios

-- Ver todos los usuarios
SELECT * FROM usuarios;

-- Ver todas las obras
SELECT * FROM obras;

-- Ver conteo de registros por tabla
SELECT 'artistas' as tabla, COUNT(*) as registros FROM artistas
UNION ALL
SELECT 'obras', COUNT(*) FROM obras
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;

-- Salir
.quit
```

### Opción 3: Extensiones de VS Code

Si usas Visual Studio Code, puedes instalar extensiones para SQLite:

1. **SQLite Viewer** (por Florian Klampfer)
   - Busca "SQLite Viewer" en las extensiones
   - Permite ver y editar bases de datos SQLite directamente en VS Code

2. **SQLite** (por alexcvzz)
   - Busca "SQLite" en las extensiones
   - Permite ejecutar consultas SQL

## 📊 Consultas SQL Útiles

### Ver todos los usuarios
```sql
SELECT id_usuario, usuario, rol FROM usuarios;
```

### Crear un nuevo usuario administrador
```sql
INSERT INTO usuarios (usuario, password, rol) 
VALUES ('admin', 'tu_password', 'admin');
```

### Ver todas las obras con información del artista
```sql
SELECT 
    o.id_obra,
    o.no_sigropam,
    o.titulo,
    a.nombre || ' ' || COALESCE(a.apellido_paterno, '') || ' ' || COALESCE(a.apellido_materno, '') as artista,
    o.fecha
FROM obras o
JOIN artistas a ON o.id_artista = a.id_artista
ORDER BY o.id_obra DESC;
```

### Ver conteo de registros en cada tabla
```sql
SELECT 'artistas' as tabla, COUNT(*) as total FROM artistas
UNION ALL SELECT 'tecnicas', COUNT(*) FROM tecnicas
UNION ALL SELECT 'obras', COUNT(*) FROM obras
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'ubicaciones_topograficas', COUNT(*) FROM ubicaciones_topograficas
UNION ALL SELECT 'ubicaciones_topologicas', COUNT(*) FROM ubicaciones_topologicas
UNION ALL SELECT 'tipo_ubicaciones_topologicas', COUNT(*) FROM tipo_ubicaciones_topologicas
UNION ALL SELECT 'obra_ubicaciones_topologicas', COUNT(*) FROM obra_ubicaciones_topologicas
UNION ALL SELECT 'exposiciones', COUNT(*) FROM exposiciones;
```

### Ver estructura completa de la base de datos
```sql
SELECT 
    name as tabla,
    sql
FROM sqlite_master
WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
ORDER BY name;
```

## ⚠️ Precauciones Importantes

1. **Hacer Backup Antes de Modificar**
   - Siempre haz una copia de seguridad de `munae.db` antes de hacer cambios manuales
   - Copia el archivo a otra ubicación como respaldo

2. **Cerrar la Aplicación**
   - **IMPORTANTE**: Cierra la aplicación MUNAE antes de abrir la base de datos
   - SQLite puede bloquear el acceso si la aplicación está usando la base de datos

3. **Integridad de Datos**
   - Ten cuidado al modificar datos manualmente
   - Respeta las relaciones de claves foráneas
   - No elimines registros que estén siendo referenciados por otras tablas

4. **Contraseñas**
   - Las contraseñas están almacenadas en texto plano (por ahora)
   - Considera usar hash de contraseñas en el futuro

## 🔍 Verificar Integridad de la Base de Datos

### Verificar que todas las tablas existan
```sql
SELECT name FROM sqlite_master 
WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
ORDER BY name;
```

Deberías ver estas 9 tablas:
- artistas
- exposiciones
- obra_ubicaciones_topologicas
- obras
- tecnicas
- tipo_ubicaciones_topologicas
- ubicaciones_topograficas
- ubicaciones_topologicas
- usuarios

### Verificar integridad de la base de datos
```sql
PRAGMA integrity_check;
```

Si todo está bien, debería devolver: `ok`

## 🆘 Solución de Problemas

### Error: "database is locked"
- **Causa**: La aplicación MUNAE está usando la base de datos
- **Solución**: Cierra completamente la aplicación antes de abrir la base de datos

### Error: "no such table"
- **Causa**: La tabla no existe en la base de datos
- **Solución**: Ejecuta el schema SQL (`data/munae_schema.sql`) para crear las tablas faltantes

### No puedo encontrar la carpeta AppData
- **Solución**: 
  1. Abre el Explorador de Archivos
  2. En la barra de direcciones, escribe: `%APPDATA%`
  3. Busca la carpeta `munae` dentro de `Roaming`

## 📝 Notas Adicionales

- La base de datos usa SQLite3
- Todas las tablas usan `IF NOT EXISTS`, por lo que puedes ejecutar el schema múltiples veces sin problemas
- Las imágenes se almacenan en la carpeta `images` junto a la base de datos
- La ruta de las imágenes se guarda en las columnas `path_img_baja` y `path_img_alta` de la tabla `obras`
