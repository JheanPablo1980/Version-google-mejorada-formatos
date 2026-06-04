# Manual Técnico y Operativo Completo
## Plataforma de Generación de Protocolos de Calidad

Este documento técnico detalla de forma extensa la arquitectura, bases de datos y el flujo de trabajo de la aplicación para su comprensión profunda, ideal para equipos técnicos, stakeholders o para la planificación de su pase a entorno de producción definitivo.

---

## 1. Funcionamiento Detallado de la Aplicación

La aplicación es una plataforma "Full-Stack" y PWA (Progressive Web App) diseñada para funcionar con fluidez incluso en escenarios de terreno con mala o nula conectividad.

### A. Gestión de Roles y Permisos (RBAC - Role Based Access Control)
El sistema opera bajo una estricta jerarquía funcional y visual:
- **Nivel Administrador (Admin):** Acceso total. Capacitado para importar bases de datos (listados de TAGs mediante Excel), habilitar o deshabilitar módulos (Activar IA o desactivar integración a Drive), y auditar el historial fotográfico.
- **Nivel Técnico:** Funcionalidad enfocada a operaciones de terreno. Puede visualizar listados, capturar fotos desde la app, realizar "Carga Masiva" e interactuar con la galería para validar coincidencias automáticas de fotos vs. TAGs.
- **Nivel Invitado:** Acceso de sólo lectura o visualización rápida para el cliente, limitado a ver el progreso y descargar protocolos finales sin alterar la base de datos subyacente.

### B. Algoritmo de "Match" Inteligente
La principal ventaja operativa del sistema es su capacidad de cruce. 
1. **Entrada de datos:** Se inyecta una lista extensa (e.g., 2000 instrumentos de campo) en la base de datos "Perfiles".
2. **Carga Óptica/Masiva:** El técnico arrastra un compendio de imágenes al módulo. 
3. **Procesamiento de Cadenas:** El sistema analiza la información de los nombres de archivo de cada foto a nivel de texto, limpia caracteres extraños, recorta extensiones y ejecuta una subrutina de búsqueda exacta e inexacta.
4. **Emparejamiento (Matching):** Si la foto "PT-3001.jpg" se sube, el sistema busca en la base de datos qué equipo corresponde a "PT-3001", y automáticamente inyecta esa imagen al objeto de base de datos correcto, pasando el TAG a estado "Completado". 

---

## 2. Base de Datos y Arquitectura de Estado

La plataforma implementa una estrategia híbrida robusta (Local-First), garantizando alta disponibilidad técnica para los operarios:

### A. Base de Datos en la Nube (Cloud Database)
Esta aplicación está provisionada para funcionar con **Supabase (PostgreSQL)** como Backend-as-a-Service (BaaS).
* **Porcentaje de uso:** Constituye la fuente de la verdad (Single Source of Truth).
* **Función:** Realiza la persistencia relacional a largo plazo, consolidando de manera central todos los instrumentos, relaciones fotográficas, perfiles subidos y la autenticación de usuarios. Supabase garantiza escalabilidad e integración mediante APIs limpias.

### B. Persistencia y Caché Local (IndexedDB)
Maneja grandes volúmenes de datos binarios (fotografías de alta resolución) sin colapsar el navegador del dispositivo móvil.
* El sistema emplea  `idb` (Indexed Database API local del navegador) y Zustand como Gestor Global de Estados en React.
* **Función:** Asegura que si el técnico en terreno pierde conexión (muy frecuente en minería o subestaciones eléctricas), el progreso (fotos tomadas, cruces generados) se guarde instantáneamente en la memoria local de la tableta o celular, sincronizando al conectarse de nuevo a WiFi o 4G/5G.

---

## 3. Despliegue, Lanzamiento y Puesta en Producción

Actualmente, esta aplicación se estructura dentro de un contenedor en **Google Cloud Run**, que renderiza este entorno preview. Para el entorno de producción final visible para clientes externos o en dominio propio (e.g., `protocolos.miempresa.com`), el proceso es el siguiente:

### A. Preparación del "Build" Final
El ambiente actual se ejecuta sobre **Node.js + Vite**. Para enviar a producción se debe encapsular el código en archivos estáticos de carga ultra rápida:
1. El sistema ejecuta el proceso nativo de compilación (`npm run build`).
2. Transforma el código React moderno y TypeScript (TSX) en un `dist/` compuesto únicamente por archivos pre-renderizados HTML, CSS (Tailwind) y JavaScript puro, asegurando el máximo rendimiento de carga (Lighthouse score).

### B. Plataformas de Alojamiento (Opciones de Producción)
1. **Google Cloud Run (Opción nativa y preferida):** Ya que la aplicación está lista para contenerizarse, se puede lanzar como una imagen de Docker y ser hospedada en Cloud Run, ofreciendo escalabilidad automática ("Scale-to-zero", cobrando sólo por el tiempo exacto que los técnicos la usan) e integrando HTTPS y protección Anti-DDoS y Web App Firewall.
2. **Vercel o Netlify (Para Frontend):** La forma más dinámica de publicar proyectos desplegados en Vite/React. Vercel cuenta con Edge Networking global, por lo que su interfaz de usuario cargará instantáneamente en el celular del técnico en la faena.
3. **Plataforma Integral (Supabase Edge):** Todo el backend y base de datos viven en el "Proyecto" productivo (Supabase Cloud). 

### C. Pasos para el pase a "Go-Live"
1. Adquisición del Dominio Empresarial.
2. Empaquetamiento al Repositorio Principal (Exportar este proyecto completo presionando en opciones del menú).
3. Conectar el Repositorio GitHub con **Vercel** o utilizar a **Google Cloud Build** hacia **Cloud Run**. Esto activa CI/CD (Continuous Integration): **cada vez que se agregue una nueva función en el futuro, los equipos de terreno verán la actualización en automático sin necesidad de instalar parches ni descargar APK/Apps de la tienda.**
4. Conectar el archivo `.env` de producción a las claves de "Supabase Dashboard Real" y activar la autenticación obligatoria y los controles de acceso por dominio o empresa. 
