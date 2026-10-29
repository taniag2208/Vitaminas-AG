# QA — Tita Discovery Studio 2.0

Ejecución: `npm run build && npm run preview` + `npm run e2e` (Chromium, Playwright) y `npm test` (Vitest). La prueba e2e falla si hay errores de página o de consola.

## End-to-end — 24/24 ✔

### Criterios 2.0

| ID | Verificación |
|---|---|
| 2.0-01 | El simulador arranca vacío ("Tu Home se construye con tus respuestas") y la primera pregunta es de negocio, con microexplicación |
| 2.0-02 | Una persona no técnica avanza con tarjetas, texto y "Continuar"; el nombre de la tienda aparece en el simulador |
| 2.0-03 | La recomendación contextual (compra por objetivo para suplementos) no está en el simulador hasta aceptarla |
| 2.0-04 | Respuestas que modifican el simulador: banner principal, mensaje del banner y personalidad de marca (tipografía) |
| 2.0-05 | Las preguntas de seguimiento del carrusel y de la cuenta regresiva aparecen solo con esa respuesta |
| 2.0-06 | Parámetros y variantes: 4 slides, evento de la cuenta regresiva y variante "imagen completa" del banner |
| 2.0-07 | Al quitar el carrusel se retira solo esa sección; al reactivarlo conserva sus 4 slides; "No deseo promociones" retira las promociones |
| 2.0-08 | Por validar y no aplica se distinguen y se cuentan; "por validar" sí se refleja en el simulador |
| 2.0-09 | El tipo de menú y las columnas del megamenú se ven en el simulador |
| 2.0-10 | El botón de WhatsApp funciona y explica que es una simulación |
| 2.0-11 | B2B: preguntas condicionales, precio de distribuidor, mínimo de unidades y solicitud de cotización |
| 2.0-12 | Biblioteca: agregar un topping, configurarlo con su pregunta de seguimiento y verlo en el simulador |
| 2.0-13 | Lo solicitado no cuenta como aprobado; la aprobación en la etapa 10 se refleja en los entregables; el checklist muestra pendientes |
| 2.0-14 | La vista previa se rotula como no real y el checkout indica que el real es el de Shopify |

### Criterios del MVP adaptados

| ID | Verificación |
|---|---|
| MVP-01/02 | Agregar y quitar páginas actualiza menú y mapa del sitio |
| MVP-04 | Reordenar el Home con flechas y arrastrando |
| MVP-06/07 | Presentación de filtros y filtrado real con contador |
| MVP-08/09/10 | Layout de ficha, selección de variantes, agregar al carrito |
| MVP-11 | Simulador móvil (390 px) y pestañas en pantallas pequeñas sin desbordamiento |
| MVP-12 | Anotaciones con especificación y topping asociado |
| MVP-13/16 | Respuestas conservadas al navegar entre etapas y al recargar |
| MVP-14 | Exportaciones (JSON, resumen, matriz, backlog, checklist, respuestas) reflejan el estado actual |
| MVP-15 | Lo adicional se advierte sin bloquearse (lista de deseos) y funciona en el simulador |
| MIG-01 | Un proyecto v1 guardado se migra automáticamente y conserva nombre y Home |

## Unitarias del motor — 26/26 ✔

Integridad del banco (100–150 preguntas, ids únicos, reglas que apuntan a preguntas y toppings existentes, toppings con especificación), reglas condicionales (por respuesta, por topping, all/any/not), derivación acumulativa del Home, cambios de respuesta sin perder configuración independiente, opción exclusiva, parámetros, orden, marca y tono, estados (no aplica / por validar), descartes, recomendaciones, entregables, exportaciones y migración v1 → v2.

## Defectos encontrados y corregidos en el QA 2.0

- Al responder, la pregunta en foco saltaba sola a la siguiente pendiente y no se veía el efecto ni las preguntas de seguimiento. Ahora la pregunta queda fija hasta "Continuar".
- La matriz de validación (etapa 10) quedaba apretada en móvil: el nombre de cada funcionalidad ocupa ahora toda la fila.

## Limitaciones conocidas

- Persistencia local (localStorage): sin nube ni colaboración multiusuario.
- Un solo catálogo de demostración (bienestar). Para otras industrias cambian las recomendaciones y los textos, no los productos de ejemplo.
- Cada topping de sección aparece una sola vez en el Home (no hay dos bloques "Más vendidos").
- La compatibilidad con el tema se marca como pendiente hasta registrar el tema; la verificación sigue siendo manual.
- Toppings sin pantalla (automatizaciones, facturación, integraciones) se documentan en los entregables y no se simulan.
