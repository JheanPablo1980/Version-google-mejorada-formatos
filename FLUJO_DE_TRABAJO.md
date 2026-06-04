# Flujo de Trabajo de la Aplicación

Este documento detalla el paso a paso del flujo de trabajo operativo dentro de la plataforma **Generación de Protocolos de Calidad**.

---

### Fase 1: Configuración y Carga de Datos Base
1. **Inicio de Sesión (Login):** El usuario ingresa a la plataforma con un rol específico (Admin, Técnico, Invitado). Dependiendo del rol, tendrá acceso a ciertas áreas.
2. **Carga de Perfiles / Base de Datos:** En la sección **"Perfiles"**, el administrador o técnico encargado importa un documento Excel con el listado oficial de elementos a revisar (TAGs, equipos, cables, ya sea de *Instrumentación* o de *Potencia*).
3. **Parametrización del Proyecto:** Se determinan variables como el nombre del cliente, proyecto, contrato y fechas asociadas al protocolo.

### Fase 2: Captura y Carga Fotográfica en Terreno
Existen dos formas principales de cargar la evidencia:
*   **Vía Directa (Manual):** Utilizando el módulo **"Registros / Cámara"**, el técnico busca el TAG específico en el listado y asocia o toma la fotografía en ese mismo instante desde su dispositivo móvil o tablet.
*   **Carga Masiva (Automática con IA):** El técnico realiza su recorrido tomando fotos con cámara digital o celular. Luego, en la aplicación, arrastra toda la carpeta de imágenes al área de **"Carga Masiva Automática"**.
    - *Match Inteligente:* La plataforma usa un algoritmo para cruzar el nombre de la foto o metadata con el listado cargado en la *Fase 1*.
    - *Clasificación:* Divide automáticamente las imágenes en procesadas con éxito ("Match") y fotos sin identificar.

### Fase 3: Gestión y Control de Calidad
1. **Revisión de Galería:** En el módulo **"Fotos / Galería"**, se visualizan todas las imágenes procesadas. Las fotos que no cruzaron de forma automática pueden ser enlazadas manualmente al TAG correspondiente.
2. **Monitoreo de Progreso (Dashboard):** Los administradores pueden visualizar desde el **"Panel" (Dashboard)** métricas como avance de protocolos diarios, porcentaje de TAGs con evidencia y distribución por especialidad.
3. **Historial y Trazabilidad:** Cada acción y modificación de fotos queda resguardada permanentemente en el módulo **"Historial"**, para permitir una auditoría de la información.

### Fase 4: Exportación Documental (El Entregable)
1. **Módulo de Generación Doc.:** Una vez que todas las fotografías están vinculadas correctamente a sus TAGs.
2. **Formato Automático:** El sistema extrae las imágenes, las fusiona con la información del componente y del proyecto, y **autocompleta plantillas de calidad.**
3. **Descarga de Protocolo Final:** Con un solo botón se genera un archivo consolidado (ej. hoja de cálculo tabulada con imágenes), listo para ser firmado y entregado al cliente, cerrando el ciclo.
