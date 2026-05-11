-- Run in Supabase SQL Editor to create the new potencia_equipos table

CREATE TABLE IF NOT EXISTS potencia_equipos (
    tag text PRIMARY KEY,
    descripcion text
);

-- Enable RLS and setup policies (assuming anon/authenticated roles can manage in this simplified app)
ALTER TABLE potencia_equipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON potencia_equipos
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON potencia_equipos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON potencia_equipos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON potencia_equipos
    FOR DELETE USING (true);
