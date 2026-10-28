# Análisis de la referencia: simulador Technofood

El simulador Technofood (HTML estático sobre el tema *Local*) se usó solo como referencia de **profundidad funcional**. No se copió su identidad visual ni su contenido.

## Qué aporta y cómo se llevó a Discovery Studio

| Elemento en Technofood | Observación | En Discovery Studio |
|---|---|---|
| Navegación por vistas (`go('vista')`) | Vistas fijas y menú escrito a mano | Router generado desde `pages[]`. Agregar o quitar una página actualiza menú, footer, mapa del sitio y rutas. |
| Megamenú con columnas + bloque promo | Contenido fijo | Megamenú generado con categorías, objetivos (si el atributo existe) y marcas (si es multimarca), más bloque promocional. También hay variantes de menú simple y desplegable. |
| Home con secciones (hero, tarjetas, logos, reseñas, CTA) | Orden y contenido fijos | 19 tipos de sección con variantes, textos, columnas, cantidad e imágenes editables, que se pueden agregar, eliminar, duplicar y reordenar con drag & drop. |
| Colección con filtros laterales y contadores | Los checkboxes no filtran | Filtros reales sobre el catálogo demo, con contadores por faceta, chips activos, ordenamiento, paginación, y layouts lateral, horizontal, panel o drawer móvil. |
| Ficha de producto con galería, pestañas y relacionados | Estructura única | Layouts, galerías, variantes, pestañas, acordeones o secciones continuas, sticky buy, suscripción, kit, reseñas y relacionados configurables. |
| Anotaciones (`anno-tag`, `anno-note`) | Texto fijo; clasificaciones mezcladas en prosa ("Local · nativo", "No nativo", "Adaptación", "Dependencia crítica") con IDs de plan (N-01, R-07) | Botón **Ver implementación Shopify**: cada componente muestra nombre y clasificación, y abre un panel con funcionalidad, implementación, 7 clasificaciones técnicas, dependencias, riesgos y criterios de aceptación. Los IDs de plan se convirtieron en requerimientos **RF-*** trazables en el PMO. |
| Distinción nativo / adaptación / dependencia externa | Afirma compatibilidades del tema Local | Si el tema no está definido, la compatibilidad de tema se marca como **pendiente**: no se afirma soporte del tema. |
| Formularios con `alert('Simulación…')` | Feedback por alerta | Confirmaciones dentro del simulador, rotuladas como simulación. |
| Imágenes con emojis | No representa producto real | Ilustraciones vectoriales de envases, rotuladas como "Imagen de demostración" y reemplazables. |

## Qué cambia en esencia

Technofood es una experiencia **prediseñada**. Discovery Studio es una experiencia **configurable**: las respuestas del Discovery producen un `ProjectConfig` y el simulador, el PMO y las exportaciones se derivan de él.
