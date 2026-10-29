# Tita Discovery Studio

Herramienta de trabajo de **Tita Media** para hacer el Discovery de un ecommerce Shopify con el cliente mientras se construye, en tiempo real, un **simulador navegable** de la tienda. Cada decisión queda registrada en un **panel PMO** y se puede exportar como especificación de implementación.

Primer proyecto: **AG Vitaminas** (B2C de vitaminas y suplementos, Shopify + integración SAP de un integrador externo). La herramienta no está atada a ese cliente: la configuración, las plantillas y el catálogo de demostración son reemplazables.

```bash
npm install
npm run dev
```

Abre http://localhost:5173, crea el proyecto y empieza por la etapa 1 (contexto del negocio).

## Qué hace (v2)

**Pregunta → Respuesta → Configuración → Simulación → Validación.**

| Espacio | Función |
|---|---|
| **Discovery** (40%) | 10 etapas y un banco de 149 preguntas en lenguaje de negocio. Una pregunta principal a la vez, con microexplicación, efecto esperado en el simulador, toppings que activa y advertencia de alcance. Las preguntas de seguimiento aparecen solas según las respuestas. Estados: pendiente · respondida · por validar · no aplica, con notas del consultor. Hay recomendaciones contextuales por industria, objetivos y canal (B2C/B2B). |
| **Simulador** (60%) | La tienda se construye de forma acumulativa con cada respuesta: Home, catálogo con filtros reales, ficha, carrito, checkout demostrativo, cuenta, kits y seguimiento. Navega solo al componente afectado y lo resalta. Desktop y móvil. Está rotulado como vista previa con datos ficticios. |
| **Toppings** | Biblioteca de 75 funcionalidades en 9 grupos (Home, catálogo, ficha, carrito, marketing, fidelización, personalización, B2B, operación). Cada una tiene el problema de negocio que resuelve, variantes, configuración por preguntas de seguimiento, dependencias, clasificación técnica y estado: recomendado · solicitado · aprobado · descartado. |
| **Entregables** | Resumen ejecutivo, matriz de requerimientos, mapa de páginas y componentes, inventario de toppings, backlog funcional y técnico, riesgos y pendientes, clasificación Shopify, checklist de validación y banco de respuestas. Se generan solos y se exportan (MD/CSV/JSON). |

En pantallas pequeñas: pestañas Discovery · Simulador · Toppings · Entregables.

Diseño y decisiones del rediseño: [docs/REDISENO-2.0.md](docs/REDISENO-2.0.md).

## Reglas de honestidad del producto

- Todos los productos, marcas, precios, inventario, testimonios y artículos son **datos de demostración** y se identifican como tales en el simulador. Las imágenes de producto son ilustraciones vectoriales; no hay emojis como sustituto de fotos.
- No hay afirmaciones de salud: beneficios, advertencias y tabla nutricional aparecen como contenido pendiente de aprobación del cliente.
- El checkout es una **simulación rotulada**: no procesa pagos ni imita el checkout de Shopify como si fuera funcional.
- La integración SAP **solo se documenta** (fase 7); no se simula como si existiera.
- Ninguna función se declara compatible con un tema concreto. "Dependiente del tema" queda *pendiente* hasta registrar y validar el tema.
- Elegir una funcionalidad adicional o sujeta a validación no la bloquea: se muestra la advertencia *"Esta funcionalidad requiere revisión de alcance y viabilidad antes de confirmar su implementación"* y queda clasificada en el PMO.
- **Respuestas, configuración, simulación y validaciones van separadas**: lo solicitado nunca cuenta como aprobado.
- **Persistencia local**: los proyectos viven en el `localStorage` de este navegador. No hay guardado en la nube ni colaboración multiusuario.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` en http://localhost:4173 |
| `npm test` | Pruebas unitarias del motor (Vitest) |
| `npm run e2e` | QA end-to-end de los criterios 2.0 y los 16 criterios del MVP adaptados (requiere `npm run preview` activo y Playwright con Chromium) |

Arquitectura y decisiones técnicas: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Análisis de la referencia Technofood: [docs/REFERENCE-ANALYSIS.md](docs/REFERENCE-ANALYSIS.md). Resultado de QA: [docs/QA.md](docs/QA.md).
