# Guía y Mejores Prácticas: Arquitectura Multi-Proyecto con Supabase

Actualmente, la aplicación gestiona la información de forma global, con datos predefinidos para un solo proyecto (ej. "Smurfit West Rock"). Para escalar la aplicación a un modelo SaaS o Multi-Proyecto real, es fundamental separar la información, de modo que cada usuario o administrador pueda crear, seleccionar y gestionar proyectos independientes sin cruzar datos.

A continuación, se detalla la hoja de ruta técnica completa y las **mejores prácticas de programación** para llevar a cabo esta transición utilizando React, Zustand y Supabase.

---

## 1. Modificación del Esquema de Base de Datos (Supabase)

La mejor práctica es implementar una arquitectura **"Multitenancy" (Multi-inquilino)**. En lugar de tener la información mezclada, todas las tablas principales deberán estar vinculadas a una tabla maestra `proyectos`.

### Nuevas Tablas:
1. **`proyectos` (Projects)**
   - `id` (UUID, Primary Key)
   - `nombre` (Texto) -> ej. "Smurfit West Rock Expansión"
   - `cliente` (Texto) -> ej. "Smurfit Kappa"
   - `contrato_id` (Texto)
   - `estado` (Texto: 'activo' | 'completado' | 'pausado')
   - `created_at` (Timestamp)

### Tablas a Modificar (Añadir Foreign Key):
Todas las tablas existentes en Supabase (`instrumentos`, `perfiles`, `fotos`, `historial`) deben agregar obligatoriamente la columna:
- `proyecto_id` (UUID, Foreign Key referenciando a `proyectos.id`)

### 🛡️ Mejores Prácticas DB (Supabase RLS):
- **Row Level Security (RLS)**: Se debe usar RLS en Supabase para asegurar que solo los usuarios asignados a un proyecto puedan ver su información.
  ```sql
  -- Ejemplo de Política RLS
  CREATE POLICY "Usuarios ven fotos de sus proyectos" 
  ON fotos FOR SELECT 
  USING (
    proyecto_id IN (
      SELECT proyecto_id FROM usuarios_proyectos WHERE user_id = auth.uid()
    )
  );
  ```
- **Índices**: Agrega un índice a la columna `proyecto_id` en todas las tablas transaccionales (fotos, instrumentos). Esto acelerará enormemente las búsquedas (`CREATE INDEX idx_fotos_proyecto ON fotos(proyecto_id);`).

---

## 2. Refactorización en la App Web (Arquitectura Frontend)

### A. Almacenamiento Global (Zustand - `useAppStore.ts`)
En lugar de traer toda la información de la base de datos de golpe, debemos condicionarla al "Proyecto Activo".

**Modificaciones al estado:**
```typescript
interface AppState {
   proyectos: Proyecto[];            // Lista de los proyectos disponibles
   proyectoActivoId: string | null;  // Contexto del proyecto actual seleccionado
   
   // Métodos nuevos
   setProyectoActivo: (id: string) => void;
   cargarProyectos: () => Promise<void>;
   ...
}
```

**Mejor Práctica (Carga Perzosa o Lazy Loading)**: 
Cuando el usuario inicia sesión, **SÓLO** se cargan los Proyectos básicos. Cuando el usuario selecciona "Smurfit West Rock", recién en ese momento se dispara la solicitud a Supabase para cargar `instrumentos`, `perfiles` y `fotos` utilizando `WHERE proyecto_id = 'XYZ'`. Esto evita colapsar la memoria del navegador.

### B. Selector de Proyectos en la Interfaz (UI/UX)
- Implementar un **Menú Desplegable Global (Dropdown)** en el `Sidebar` o en el `Header` principal.
- Este selector dictaminará qué datos se ven en la tabla. Si cambias de "Proyecto A" a "Proyecto B", la tabla de instrumentos, la galería de fotos y el dashboard deben reactivarse y limpiar sus listas para mostrar la info del Proyecto B.
- Añadir un apartado en el Panel de Administración (ej. `Administración -> Proyectos`) con un botón "Crear Nuevo Proyecto", solicitando datos como: Nombre del Proyecto, Cliente y Contrato base.

---

## 3. Mejores Prácticas de Programación aplicables (Clean Code & Escalabilidad)

1. **Evitar Valores *Hardcodeados* (`Hardcoding`)**:
   Actualmente la app tiene palabras como `"Smurfit West Rock"` inyectadas directamente en el código o perfiles. Nunca escribas los nombres en duro. Consúmelos de variables de estado de React (`currentProject.nombre`).

2. **Inyección de Identificadores (Inversion of Control)**:
   A nivel de código, actualiza la función que guarda fotos o genera los Excel:
   *Antes:* `insertarFoto({ nombre: 'X.jpg' })`
   *Después:* `insertarFoto({ nombre: 'X.jpg', proyecto_id: proyectoActivoId })`
   Siempre debes arrastrar el ID del contexto global para no dejar datos huérfanos.

3. **Separación de Responsabilidades (Services Layer)**:
   Mantén el código de conexión a Supabase centralizado. Crea un archivo `/src/services/proyectoService.ts` donde vivan todas las llamadas CRUD (Create, Read, Update, Delete) de proyectos. No escribas código de base de datos directamente adentro de los componentes (botones o formularios) de React.

4. **Sincronización Local (IndexedDB)**:
   Dado que esta app funciona con IndexedDB (LocalForage) para su modo offline:
   - Necesitas dividir el caché por `proyecto_id` o vaciar la caché local si el usuario cambia drásticamente de un proyecto masivo a otro. 
   - Añade el `proyecto_id` a cada registro enIndexedDB para que cuando el internet regrese, pueda enviarse a Supabase al proyecto correcto.

---

## En Resumen (Plan de Acción de 4 Pasos)
1. **Backend:** Crear la tabla `proyectos` en Supabase y agregar `proyecto_id` a tus tablas.
2. **Estado (Zustand):** Agregar un selector global de proyectos (`proyectoActivoId`). 
3. **Frontend (Componente):** Crear el Modal "Crear Proyecto" y el menú "Cambiar de Proyecto" en el Header.
4. **Mutabilidad:** Acoplar la lógica de inserción de la Base de Datos para requerir obligatoriamente el `proyecto_id` actual para los guardados de Perfiles, Instrumentos y Fotos.
