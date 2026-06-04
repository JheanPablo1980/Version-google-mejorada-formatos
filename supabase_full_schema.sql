-- supabase_full_schema.sql
-- Ejecuta este script SQL en el Editor SQL de tu proyecto Supabase para crear todas las tablas necesarias
-- y configurar las políticas de seguridad (RLS).

-- ----------------------------------------------------
-- 1. CREACIÓN DE TABLAS
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS instrumentos (
  tagname TEXT PRIMARY KEY,
  -- Agrega más columnas según tu interfaz Instrumento
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS potencia_equipos (
  tag TEXT PRIMARY KEY,
  -- Agrega más columnas según tu interfaz PotenciaEquipo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY,
  base64 TEXT NOT NULL,
  tag TEXT,
  file_name TEXT,
  timestamp TIMESTAMPTZ,
  id_perfil TEXT,
  uploaded_to_drive BOOLEAN DEFAULT FALSE,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles (
  id_perfil TEXT PRIMARY KEY,
  -- Agrega más columnas según tu interfaz Perfil
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY,
  tagname TEXT,
  tipo_formato TEXT,
  id_perfil TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conteo_exportacion (
  id UUID PRIMARY KEY,
  tag TEXT,
  conteo INT DEFAULT 0,
  fecha_hora TIMESTAMPTZ,
  user_role TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  fecha_hora TIMESTAMPTZ,
  user_email TEXT,
  user_role TEXT,
  action_type TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------
-- Esto asegura que solo los usuarios autenticados (o anónimos si lo permites) tengan acceso.

ALTER TABLE instrumentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE potencia_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteo_exportacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 3. POLÍTICAS DE ACCESO (Permitir acceso anónimo por ahora para no romper la app)
-- ----------------------------------------------------
-- ATENCIÓN: Estas políticas permiten acceso de lectura y escritura a CUALQUIERA
-- (incluso usuarios anónimos o Service Roles). Para un entorno de producción estricto, 
-- debes restringirlo a `auth.role() = 'authenticated'`.

CREATE POLICY "Permitir todo acceso remoto a instrumentos" ON instrumentos FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a potencia_equipos" ON potencia_equipos FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a fotos" ON fotos FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a perfiles" ON perfiles FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a export_logs" ON export_logs FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a conteo_exportacion" ON conteo_exportacion FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a app_config" ON app_config FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso remoto a audit_logs" ON audit_logs FOR ALL USING (true);
