# Implementación Multi-Proyecto: Prompt para la IA y Código SQL

Este documento contiene las herramientas exactas que necesitas para ejecutar la transición exitosa de la aplicación a una arquitectura de múltiples proyectos. Se divide en dos partes: el código SQL para configurar tu base de datos y el Prompt que debes darle a tu Asistente o a esta IA para que modifique el código fuente de la app.

---

## 1. Código SQL (Scripts para Supabase)
Ejecuta estos scripts en el "SQL Editor" del dashboard de Supabase para generar la estructura relacional de los proyectos.

```sql
-- 1. Habilitar la extensión para UUIDs (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla maestra de Proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    cliente TEXT,
    contrato TEXT,
    estado TEXT DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Seguridad) y crear políticas para permitir lectura/escritura
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en proyectos" ON proyectos;
CREATE POLICY "Permitir todo en proyectos" ON proyectos FOR ALL USING (true) WITH CHECK (true);

-- 3. Actualizar tablas existentes (Ejemplos, ajusta los nombres según tus tablas en Supabase)
-- Se agrega la columna proyecto_id como clave foránea que elimina los registros en cascada si se borra el proyecto.
ALTER TABLE IF EXISTS instrumentos ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fotos ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS perfiles ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS potencia_equipos ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS export_logs ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS conteo_exportacion ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS roles_usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
UPDATE roles_usuarios SET activo = true WHERE activo IS NULL;

-- 4. Insertar el proyecto SWC2025_2026 por defecto (si no existe)
INSERT INTO proyectos (nombre, cliente, contrato, estado)
SELECT 'SWC2025_2026', 'Smurfit Westrock', 'C.O.654', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE nombre = 'SWC2025_2026');

-- Asignar a todas las tablas el proyecto recién creado para migrar datos
UPDATE instrumentos SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;
UPDATE fotos SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;
UPDATE perfiles SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;
UPDATE potencia_equipos SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;
UPDATE export_logs SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;
UPDATE conteo_exportacion SET proyecto_id = (SELECT id FROM proyectos WHERE nombre = 'SWC2025_2026' LIMIT 1) WHERE proyecto_id IS NULL;

-- 5. Crear Índices para rendimiento (Crucial para búsquedas rápidas)
CREATE INDEX IF NOT EXISTS idx_instrumentos_proyecto ON instrumentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_fotos_proyecto ON fotos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_proyecto ON perfiles(proyecto_id);

-- 5. (Opcional) Activar RLS básico enfocado en Proyectos
-- Esto asume que tienes una tabla que vincula a usuarios con proyectos (usuarios_proyectos)
/*
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir ver proyectos" ON proyectos FOR SELECT USING (true); -- Ajustar según reglas de tu negocio
*/
```

---

## 2. Prompt Maestro para Refactorización de la App Web
Copia y pega el siguiente texto (prompt) como una nueva solicitud para que la IA escale y refactorice todo el código necesario de la App Web.

***

**[COPIAR DESDE AQUÍ]**

Actúa como un desarrollador Full-Stack experto en React, Zustand y Supabase. 
Necesito escalar y refactorizar esta aplicación para que soporte múltiples proyectos (Arquitectura Multitenancy). 
Actualmente, la aplicación asume un único proyecto global de forma "hardcodeada" (ej. "Smurfit West Rock").

Por favor, implementa progresivamente los siguientes cambios:

1. **Estado Global en Zustand (`useAppStore.ts`)**: 
   - Añade variables de estado para manejar `proyectos` (array) y `proyectoActivoId` (string | null).
   - Crea métodos para `setProyectoActivo`, `crearProyecto` y `cargarProyectos`.

2. **Contextualización de Datos**: 
   - Refactoriza las funciones y efectos que cargan los listados (instrumentos, fotos, galería, historial). Deben depender de `proyectoActivoId` y limpiar el caché u omitir información si se cambia de proyecto. 

3. **Inyección de IDs y Limpieza**: 
   - Modifica las funciones de guardado (`crearPerfil`, `guardarFoto`) para que inyecten obligatoriamente el `proyectoActivoId` actual junto a los nuevos datos. 
   - Elimina todas las menciones "hardcodeadas" y fijas a "Smurfit" o "West Rock" en la UI y utiliza el valor de `proyectoActivo.nombre` o `proyectoActivo.cliente` en su lugar.

4. **UI - Selector de Proyectos**: 
   - En el `Sidebar` (o cabecera principal), crea un menú desplegable (Dropdown / Select) estético usando Tailwind CSS que permita al usuario cambiar de proyecto instantáneamente. El dropdown debe destacar claramente cuál es el proyecto en el que se está operando.

5. **UI - Creación de Proyectos**: 
   - Agrega un apartado en el componente Admin o un botón global accesible para roles permitidos que abra un formulario/modal de "Nuevo Proyecto", solicitando los campos correspondientes (Nombre, Cliente, Contrato) y guardando esto en el estado.

Asegúrate de que la aplicación maneje gracefully el momento en que `proyectoActivoId` sea nulo (por ejemplo, mostrando una pantalla amigable de "Selecciona un proyecto desde la barra lateral para comenzar a trabajar").

**[FIN DE COPIA]**
