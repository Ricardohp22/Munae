# Análisis del Error de Login y Soluciones Implementadas

## 🔍 Problema Identificado

Al ejecutar la aplicación empaquetada y hacer login, se producía el error: **"Error interno de base de datos"**

## 🐛 Causas Raíz Encontradas

### 1. **Tabla `usuarios` faltante en el schema SQL**
   - **Problema**: La tabla `usuarios` no estaba definida en `data/munae_schema.sql`
   - **Impacto**: Cuando se creaba una nueva base de datos (especialmente en producción), la tabla no se creaba
   - **Solución**: ✅ Agregada la tabla `usuarios` al schema SQL

### 2. **Schema SQL no se ejecutaba automáticamente**
   - **Problema**: El código comentaba que "las tablas se crean automáticamente", pero esto no es cierto
   - **Impacto**: Las tablas nunca se creaban si la base de datos era nueva
   - **Solución**: ✅ Implementada función `executeSchema()` que se ejecuta automáticamente al inicializar la base de datos

### 3. **Problema de paths en producción (ASAR)**
   - **Problema**: En producción, `__dirname` apunta dentro del ASAR, causando problemas al acceder a archivos
   - **Impacto**: La migración de datos y la lectura del schema SQL fallaban
   - **Solución**: ✅ Uso de `app.getAppPath()` que maneja correctamente el ASAR

### 4. **Manejo de errores insuficiente**
   - **Problema**: El error de login no proporcionaba información útil para depuración
   - **Impacto**: Difícil identificar la causa real del problema
   - **Solución**: ✅ Mejorado el manejo de errores con logging detallado y mensajes más informativos

## ✅ Soluciones Implementadas

### 1. Schema SQL Actualizado (`data/munae_schema.sql`)
```sql
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'consulta'))
);

-- Tabla de exposiciones
CREATE TABLE IF NOT EXISTS exposiciones (
  id_exposicion INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(100) NOT NULL
);
```

### 2. Inicialización Automática del Schema (`src/database.js`)
- ✅ Función `executeSchema()` que lee y ejecuta el schema SQL
- ✅ Verificación automática de si la base de datos es nueva
- ✅ Verificación de existencia de tablas críticas (especialmente `usuarios`)
- ✅ Ejecución automática del schema si faltan tablas

### 3. Corrección de Paths en Producción (`src/paths.js` y `src/database.js`)
- ✅ Uso de `app.getAppPath()` en lugar de `__dirname` para archivos en ASAR
- ✅ Manejo correcto de rutas tanto en desarrollo como en producción

### 4. Mejora del Manejo de Errores (`main.js`)
- ✅ Logging detallado de errores en el login
- ✅ Detección específica de errores de "tabla no existe"
- ✅ Mensajes de error más informativos para el usuario

### 5. Inclusión del Schema en el Empaquetado (`package.json`)
- ✅ Agregado `"data/**/*"` a la lista de archivos a incluir en el empaquetado

## 🔄 Flujo de Inicialización Corregido

1. **App se inicia** → `app.whenReady()`
2. **Inicializar módulo de paths** → `pathsModule.initializeApp(app)`
3. **Migrar datos si es necesario** → `pathsModule.migrateDataIfNeeded()`
4. **Inicializar base de datos** → `initializeDatabase()`
   - Verifica si la base de datos existe
   - Si es nueva → Ejecuta schema SQL automáticamente
   - Si existe → Verifica que la tabla `usuarios` exista
   - Si falta → Ejecuta schema SQL automáticamente
5. **Crear ventana** → `createWindow()`

## ⚠️ Otros Problemas Potenciales Identificados

### 1. **Tabla `exposiciones` en el schema**
   - **Estado**: ✅ Agregada al schema
   - **Nota**: La tabla ya existía en la base de datos de desarrollo, pero faltaba en el schema

### 2. **Manejo de errores en queries asíncronas**
   - **Estado**: ⚠️ Revisar
   - **Nota**: Algunas funciones usan `allAsync()` que puede fallar si la base de datos no está inicializada
   - **Recomendación**: Agregar verificación de inicialización antes de ejecutar queries

### 3. **Migración de datos en producción**
   - **Estado**: ✅ Corregido
   - **Nota**: Ahora usa `app.getAppPath()` para acceder correctamente a los datos en el ASAR

### 4. **Permisos de escritura en userData**
   - **Estado**: ✅ Manejo correcto
   - **Nota**: El código crea automáticamente las carpetas necesarias con permisos adecuados

## 🧪 Pruebas Recomendadas

1. **Probar login en desarrollo**
   - ✅ Debe funcionar normalmente

2. **Probar login en producción (ejecutable empaquetado)**
   - ✅ Debe crear la base de datos si no existe
   - ✅ Debe crear todas las tablas automáticamente
   - ✅ Debe permitir login con usuarios existentes

3. **Probar primera ejecución en nueva computadora**
   - ✅ Debe crear la base de datos en `AppData\Roaming\munae\data\`
   - ✅ Debe crear todas las tablas
   - ⚠️ **IMPORTANTE**: Necesitarás crear un usuario manualmente o incluir una base de datos inicial con usuarios

## 📝 Notas Importantes

1. **Usuarios iniciales**: Si la base de datos es nueva, no habrá usuarios. Necesitarás:
   - Incluir una base de datos inicial con usuarios en el empaquetado, O
   - Crear una función para crear el primer usuario administrador

2. **Migración de datos**: La migración solo ocurre si:
   - La aplicación está empaquetada (`app.isPackaged === true`)
   - Existen datos en la carpeta del proyecto
   - No existe base de datos en userData

3. **Schema SQL**: El schema se ejecuta automáticamente solo si:
   - La base de datos es nueva, O
   - La tabla `usuarios` no existe

## 🚀 Próximos Pasos Recomendados

1. **Crear función para inicializar usuario administrador por defecto**
   - Si no hay usuarios, crear uno automáticamente
   - O mostrar un diálogo para crear el primer usuario

2. **Agregar validación de integridad de base de datos**
   - Verificar que todas las tablas necesarias existan
   - Ejecutar migraciones si es necesario

3. **Mejorar logging en producción**
   - Guardar logs en archivo para depuración
   - Incluir información sobre rutas y errores

4. **Agregar tests automatizados**
   - Tests para inicialización de base de datos
   - Tests para creación de tablas
   - Tests para login
