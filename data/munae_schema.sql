-- ======================================
-- Creación de tablas para MUNAE
-- ======================================

-- Tabla de artistas
CREATE TABLE IF NOT EXISTS artistas (
  id_artista INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(50) NOT NULL,
  apellido_paterno VARCHAR(50),
  apellido_materno VARCHAR(50)
);

-- Tabla de técnicas
CREATE TABLE IF NOT EXISTS tecnicas (
  id_tecnica INTEGER PRIMARY KEY AUTOINCREMENT,
  tecnica VARCHAR(50) NOT NULL
);

-- Tabla de tipos de ubicaciones topológicas (ej: mueble, gaveta, cajón, etc.)
CREATE TABLE IF NOT EXISTS tipo_ubicaciones_topologicas (
  id_tipo_ubicacion_topologica INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo VARCHAR(20) NOT NULL
);

-- Tabla de ubicaciones topológicas
CREATE TABLE IF NOT EXISTS ubicaciones_topologicas (
  id_ubicacion_topologica INTEGER PRIMARY KEY AUTOINCREMENT,
  id_tipo_ubicacion_topologica INTEGER NOT NULL,
  ubicacion VARCHAR(20),
  FOREIGN KEY (id_tipo_ubicacion_topologica) REFERENCES tipo_ubicaciones_topologicas(id_tipo_ubicacion_topologica)
);

-- Tabla de ubicaciones topográficas (ej: Edificio A, Piso 2, Sala de exposición, etc.)
CREATE TABLE IF NOT EXISTS ubicaciones_topograficas (
  id_ubicacion_topografica INTEGER PRIMARY KEY AUTOINCREMENT,
  ubicacion VARCHAR(50) NOT NULL
);

-- Tabla de obras
CREATE TABLE IF NOT EXISTS obras (
  id_obra INTEGER PRIMARY KEY AUTOINCREMENT,
  no_sigropam VARCHAR(50) NOT NULL,
  id_artista INTEGER NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  fecha INTEGER, -- solo año
  id_tecnica INTEGER,
  tiraje VARCHAR(50),
  medidas_soporte_ancho INTEGER,
  medidas_soporte_largo INTEGER,
  medidas_imagen_ancho INTEGER,
  medidas_imagen_largo INTEGER,
  ubi_topolo_especificacion_manual VARCHAR(50),
  is_en_prestamo BOOLEAN NOT NULL DEFAULT 0,
  id_ubicacion_topografica INTEGER,
  observaciones VARCHAR(200),
  estado_conservacion VARCHAR(50),
  descripcion VARCHAR(200),
  exposiciones VARCHAR(100),
  path_img_baja VARCHAR(200),
  path_img_alta VARCHAR(200),
  FOREIGN KEY (id_artista) REFERENCES artistas(id_artista),
  FOREIGN KEY (id_tecnica) REFERENCES tecnicas(id_tecnica),
  FOREIGN KEY (id_ubicacion_topografica) REFERENCES ubicaciones_topograficas(id_ubicacion_topografica)
);

-- Tabla puente: obra ↔ ubicaciones topológicas
CREATE TABLE IF NOT EXISTS obra_ubicaciones_topologicas (
  id_obra_ubicacion_topologica INTEGER PRIMARY KEY AUTOINCREMENT,
  id_obra INTEGER NOT NULL,
  id_ubicacion_topologica INTEGER NOT NULL,
  nivel INTEGER,
  FOREIGN KEY (id_obra) REFERENCES obras(id_obra),
  FOREIGN KEY (id_ubicacion_topologica) REFERENCES ubicaciones_topologicas(id_ubicacion_topologica)
);
