# Arquitectura — Tita Discovery Studio

## Principio central (v2): respuestas → configuración derivada

```
 Discovery ──answer()──▶ answers ─┐
 Toppings  ──setTopping()▶ toppings├─▶ analyze() ──▶ configuración derivada ──▶ Simulador
 Editar contenido ──────▶ content ┘        │                                   (SimSession: carrito, pedidos demo)
                                           └──▶ Entregables / exportaciones
```

- `DiscoveryProject` (`src/types/discovery.ts`) es lo único que se guarda: respuestas con estado y notas, decisiones sobre toppings, contenido de ejemplo personalizado y validaciones técnicas.
- `analyze()` (`src/engine/derive.ts`) es una función pura y memoizada: calcula las preguntas visibles (reglas condicionales con punto fijo, porque una condición puede depender de un topping activado por otra respuesta), los toppings activos, las recomendaciones y la configuración del simulador (`ProjectConfig`, alias `SimConfig`).
- Las preguntas (`src/config/discovery/questions-*.ts`) son declarativas: tipo, opciones con toppings vinculados, `showIf`, `effect`, `apply` y `preview`.
- Los toppings (`src/config/discovery/toppings.ts`) declaran problema, variantes, parámetros (preguntas de seguimiento), dependencias, clasificación técnica, reglas de recomendación, `apply` y cómo se ven como sección.
- Cambiar una respuesta recalcula todo sin borrar nada: parámetros, contenido y notas de un topping desactivado se conservan y vuelven si se reactiva.
- Entregables (`src/engine/deliverables.ts`) y exportaciones (`src/engine/exports.ts`) se derivan del mismo análisis.

## Estructura

```
src/
  types/project.ts           Modelo de datos (ProjectConfig, ScopeStatus, TechClass, DemoProduct…)
  types/discovery.ts         Modelo v2: respuestas, toppings, condiciones, preguntas
  config/
    discovery/               10 etapas, 149 preguntas, 75 toppings
    sections.ts              Secciones renderizables del Home
    annotations.ts           Especificaciones de implementación Shopify por componente
    templates.ts             Esqueleto base y tipos de página
  data/demoCatalog.ts        Catálogo, testimonios, artículos y FAQ de demostración
  engine/
    conditions.ts            Reglas condicionales declarativas
    derive.ts                Motor de configuración progresiva
    deliverables.ts          8 entregables automáticos
    exports.ts               JSON, Markdown y CSV
    migrate.ts               Proyectos v1 → v2
    catalog.ts               Filtros, facetas con contador, ordenamiento
    engine.test.ts           Pruebas unitarias
  store/
    useStudio.ts             Estado central persistido (proyectos, UI, sesión demo)
    useSimUi.ts              Estado efímero del simulador (vista rápida, toasts, resaltado)
  services/storage.ts        Adaptador de persistencia (localStorage; reemplazable por API)
  components/
    ui.tsx                   Primitivas accesibles (botones, switches, badges, modal)
    studio/                  Shell: proyectos, layout, vista previa, anotaciones, exportaciones
    discovery/               Cuestionario guiado, controles de respuesta, orden del Home, validación
    toppings/                Biblioteca de toppings
    sim/                     Simulador: chrome (header/footer/menús), secciones, páginas, ilustraciones
    pmo/                     Entregables
scripts/e2e.mjs              QA end-to-end de los criterios de aceptación
```

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Stack | React 18 + TypeScript + Vite + Tailwind CSS v4 | Es el stack pedido; tiene un ecosistema maduro y builds rápidos. |
| Estado | Zustand con `persist` | Mínimo boilerplate, selectores granulares y un adaptador de storage intercambiable. |
| Drag & drop | `@dnd-kit/sortable` | Estable, accesible (soporta teclado) y sin depender del DOM de HTML5 DnD. |
| Vista móvil real | **Container queries** (`@container`, variantes `@3xl:`) | Los breakpoints responden al ancho del dispositivo simulado (390 px) y no al ancho de la ventana, así la vista móvil es fiel sin usar iframes. |
| Vista desktop | Lienzo de 1280 px escalado con `transform` | Muestra el layout desktop real aunque el panel de vista previa sea más angosto. |
| Overlays del simulador | Portal a una capa `absolute` dentro del dispositivo | Drawers, pop-ups y la barra sticky quedan dentro del teléfono o la pantalla simulada, no en la ventana del navegador. |
| Tokens de marca | Variables CSS (`--sim-primary`, …) expuestas a Tailwind con `@theme inline` | Cambiar colores, tipografías o bordes actualiza todo el simulador sin volver a renderizar estilos. |
| Imágenes de demostración | SVG generados (envases y composiciones) + carga de imágenes comprimidas | Funcionan sin red, no usan emojis y el cliente puede reemplazarlas por sus imágenes. |

## Preparado para crecer

- **Backend y colaboración**: `services/storage.ts` implementa `StateStorage`; basta con sustituirlo por un adaptador de API (REST, Supabase, Firebase) y añadir autenticación. `ProjectConfig` ya es serializable y versionado (`schemaVersion`, `migrate` en el store).
- **Nuevos clientes o verticales**: nueva plantilla en `templates.ts` y nuevo catálogo de demostración en `data/`.
- **Nuevas secciones**: entrada en `SECTION_LIBRARY`, componente en `HomeSections.tsx` y anotación en `annotations.ts`.
- **Nuevas preguntas**: entrada en `QUESTIONS`; si usan un tipo de control existente, no requieren código de UI.
- **Tema definido**: al registrar el tema (fase 1) desaparece la marca *pendiente*; el siguiente paso natural es una matriz de compatibilidad por tema en `annotations.ts`.

## Fases de implementación seguidas

1. Arquitectura, modelo de datos y motor (configuración, catálogo, PMO, exportaciones) con pruebas unitarias.
2. MVP: shell, navegación por fases, constructor del Home, colecciones y filtros, ficha de producto, simulador navegable, persistencia y exportación JSON.
3. Funciones comerciales: carrito (lateral o página), envío gratis, códigos demo, checkout y confirmación demostrativos, suscripciones con portal, kits, pop-up y formularios de captación.
4. PMO y anotaciones: decisiones, alcance, riesgos, dependencias, criterios de aceptación y exportaciones.
5. QA: `scripts/e2e.mjs` valida los 16 criterios obligatorios y la ausencia de errores de consola.
