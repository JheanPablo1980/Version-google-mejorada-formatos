# Diagrama del Flujo de Trabajo

A continuación se presenta el diagrama del flujo de trabajo de la aplicación. (Generado utilizando Mermaid, el cual puedes visualizar en visores de Markdown compatibles).

```mermaid
graph TD
    %% Estilos
    classDef fase fill:#1F3864,stroke:#333,stroke-width:2px,color:#fff;
    classDef proceso fill:#f9f9f9,stroke:#666,stroke-width:1px,color:#333;
    classDef automatizado fill:#e6f3ff,stroke:#2b6cb0,stroke-width:2px,color:#2b6cb0;
    classDef output fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff;

    %% FASE 1
    subgraph Fase 1: Configuración
        A[Inicio de Sesión]:::proceso --> B[Carga de Perfiles / Base de Datos]:::proceso
        B --> C{Tipo de Proyecto}:::proceso
        C -->|Instrumentación| D[Parametrización del Proyecto]:::proceso
        C -->|Potencia| D
    end

    %% FASE 2
    subgraph Fase 2: Captura y Carga en Terreno
        D --> E{Método de Carga}:::proceso
        E -->|Manual / Cámara en App| F[Vinculación Directa a TAG]:::proceso
        E -->|Automática| G[Arrastrar Carpeta de Fotos a Carga Masiva]:::automatizado
        G --> H((Match Inteligente IA)):::automatizado
        H -->|Éxito| I[Fotos Vinculadas Automáticamente]:::automatizado
        H -->|Sin Coincidencia| J[Fotos Pendientes de Vinculación]:::proceso
    end

    %% FASE 3
    subgraph Fase 3: Gestión y Control
        F --> K[Revisión en Galería]:::proceso
        I --> K
        J -->|Vinculación Manual| K
        K --> L[Monitoreo en Dashboard KPIs]:::proceso
        K --> M[Registro en Historial / Trazabilidad]:::proceso
    end

    %% FASE 4
    subgraph Fase 4: Exportación
        L --> N[Módulo de Generación Doc.]:::proceso
        M --> N
        N --> O[Autocompletado de Plantillas]:::automatizado
        O --> P([Descarga de Protocolo Final PDF/Excel]):::output
    end
```
