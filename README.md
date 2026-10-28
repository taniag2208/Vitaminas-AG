# Tita Discovery Studio

Herramienta de trabajo de **Tita Media** para hacer el Discovery de un ecommerce Shopify con el cliente mientras se construye, en tiempo real, un **simulador navegable** de la tienda. Cada decisión queda registrada en un **panel PMO** y se puede exportar como especificación de implementación.

Primer proyecto: **AG Vitaminas** (B2C de vitaminas y suplementos, Shopify + integración SAP de un integrador externo). La herramienta no está atada a ese cliente: la configuración, las plantillas y el catálogo de demostración son reemplazables.

```bash
npm install
npm run dev
```

Abre http://localhost:5173, crea el proyecto con la plantilla *Bienestar y suplementos* y empieza por la fase 1.

## Qué hace

| Espacio | Función |
|---|---|
| **Panel Discovery** (izquierda) | 7 fases y unas 80 preguntas: selección única/múltiple, alternativas visuales, texto, colores, tipografías, carga de imágenes y referencias, constructor del Home con drag & drop, preguntas condicionales y confirmación/aprobación por decisión con responsable y notas. |
| **Simulador** (derecha) | La tienda completa renderizada desde la configuración: Home, colecciones con filtros que sí filtran, ficha de producto, carrito lateral o de página, checkout demostrativo, confirmación, seguimiento de pedidos, cuenta con suscripciones, kits, marcas, blog, FAQ, políticas y páginas personalizadas. Vista desktop y móvil, pantalla completa. |
| **Ver implementación Shopify** | Resalta cada componente y abre su especificación: funcionalidad, implementación sugerida, clasificación técnica, dependencias, riesgos y criterios de aceptación. Si no hay tema definido, la compatibilidad de tema aparece como *pendiente*. |
| **Panel PMO** | Resumen, registro de decisiones editable, requerimientos funcionales (RF-*), clasificación de alcance, riesgos, dependencias, criterios de aceptación, mapa del sitio y exportaciones. |

### Exportaciones

JSON de configuración (reimportable) · resumen funcional (MD) · mapa del sitio (MD) · decisiones pendientes (MD/CSV) · todas las decisiones (CSV) · criterios de aceptación (MD) · **especificación para Claude Code** (MD con tokens, `templates/index.json`, metafields, filtros de Search & Discovery, apps a evaluar y requerimientos).

## Reglas de honestidad del producto

- Todos los productos, marcas, precios, inventario, testimonios y artículos son **datos de demostración** y se identifican como tales en el simulador. Las imágenes de producto son ilustraciones vectoriales; no hay emojis como sustituto de fotos.
- No hay afirmaciones de salud: beneficios, advertencias y tabla nutricional aparecen como contenido pendiente de aprobación del cliente.
- El checkout es una **simulación rotulada**: no procesa pagos ni imita el checkout de Shopify como si fuera funcional.
- La integración SAP **solo se documenta** (fase 7); no se simula como si existiera.
- Ninguna función se declara compatible con un tema concreto. "Dependiente del tema" queda *pendiente* hasta registrar y validar el tema.
- Elegir una funcionalidad adicional o sujeta a validación no la bloquea: se muestra la advertencia *"Esta funcionalidad requiere revisión de alcance y viabilidad antes de confirmar su implementación"* y queda clasificada en el PMO.
- **Persistencia local**: los proyectos viven en el `localStorage` de este navegador. No hay guardado en la nube ni colaboración multiusuario.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` en http://localhost:4173 |
| `npm test` | Pruebas unitarias del motor (Vitest) |
| `npm run e2e` | QA end-to-end de los 16 criterios de aceptación (requiere `npm run preview` activo y Playwright con Chromium) |

Arquitectura y decisiones técnicas: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Análisis de la referencia Technofood: [docs/REFERENCE-ANALYSIS.md](docs/REFERENCE-ANALYSIS.md). Resultado de QA: [docs/QA.md](docs/QA.md).
