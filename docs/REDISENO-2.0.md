# Tita Discovery Studio 2.0 — Diagnóstico y plan de rediseño

Principio rector: **Pregunta → Respuesta → Configuración → Simulación → Validación.**
El cuestionario es el protagonista; el simulador es la representación acumulativa de lo decidido.

---

## 1. Diagnóstico de la UX actual (v1)

### Inventario (auditoría)

| Área | v1 | Valor | Problema |
|---|---|---|---|
| Modelo | `ProjectConfig`: cada pregunta escribe directo en la configuración del simulador | Simple, una fuente de verdad | Respuesta y configuración son lo mismo; no se puede saber qué dijo el cliente frente a qué es valor por defecto |
| Preguntas | 80 en 7 fases, controles técnicos (rutas `catalog.filterLayout`) | Cubren el alcance | Lenguaje de configurador ("¿Productos por fila?"), todas visibles a la vez, pocas condicionales |
| Estados | pendiente / respondida / aprobada / rechazada | Trazabilidad | "Respondida" se marca al tocar cualquier control; no existe "no aplica" ni "por validar" |
| Toppings | 19 secciones del Home con miniaturas, apilables | Muy valorado | Solo Home; son interruptores de componentes, no funcionalidades de negocio con variantes |
| Simulador | Tienda completa, desktop/móvil, filtros reales, PDP, carrito, checkout demo, suscripciones, kits, seguimiento | Activo principal | Arranca "lleno" (plantilla) y no muestra cómo se construye con las respuestas |
| Vista previa guiada | Ir al componente y resaltarlo | Útil | Se conserva |
| Anotaciones Shopify | 40 especificaciones por componente | Útil | Se conserva y se vincula a toppings |
| PMO | Decisiones, requerimientos RF-*, riesgos, alcance, criterios, mapa | Útil | Compite con el Discovery en la barra principal; requerimientos atados a secciones, no a funcionalidades |
| Exportaciones | JSON, resumen, mapa, pendientes, criterios, spec Claude Code | Útil | Faltan resumen ejecutivo, backlog, inventario de toppings y checklist de validación |
| Persistencia | localStorage, duplicar, importar | Útil | Se conserva con migración |

### Diagnóstico

1. **Se perdió la conversación.** El consultor ve formularios técnicos; el cliente no entiende "paginación" o "metafields".
2. **No hay "por qué".** Las preguntas no parten del negocio (qué vende, a quién, objetivos), así que no hay recomendaciones.
3. **El simulador no cuenta la historia.** Al venir lleno de una plantilla, no se nota qué construyó cada respuesta.
4. **Toppings limitados al Home** y sin variantes ni preguntas de seguimiento.
5. **El PMO pesa igual que el Discovery** en la navegación.

---

## 2. Nueva arquitectura de información

```
Proyectos
└── Proyecto
    ├── Discovery (40%)  ←→  Simulador (60%)          ← experiencia principal
    │     10 etapas · una pregunta principal por vez
    │     seguimiento condicional · recomendaciones · notas del consultor
    ├── Toppings                                        ← biblioteca de funcionalidades
    │     9 grupos · estado: recomendado / solicitado / aprobado / descartado
    └── Entregables (PMO)                               ← se alimenta del Discovery
          resumen ejecutivo · matriz de requerimientos · mapa de páginas y componentes
          inventario de toppings · backlog · riesgos y pendientes
          clasificación Shopify · checklist de validación · exportaciones
```

En móvil: pestañas inferiores **Discovery · Simulador · Toppings · Entregables**, sin perder respuestas (todo vive en el store).

### Las 10 etapas

| # | Etapa | Construye en el simulador |
|---|---|---|
| 1 | Contexto del negocio y objetivos | Nombre, tipo de tienda, B2C/B2B; activa recomendaciones |
| 2 | Marca e identidad visual | Colores, tipografías, formas, tono de los textos |
| 3 | Home y navegación | Secciones del Home, promociones, menú, encabezado, footer, WhatsApp |
| 4 | Catálogo y búsqueda | Categorías, filtros, búsqueda, tarjetas, PLP |
| 5 | Página de detalle de producto | Galería, variantes, información, reseñas, relacionados |
| 6 | Carrito y checkout | Carrito, envío gratis, descuentos, pagos, envíos |
| 7 | Clientes y fidelización | Cuentas, suscripciones, puntos, lista de deseos |
| 8 | Marketing y conversión | Pop-ups, captación, kits, urgencia, automatizaciones |
| 9 | Operación e integraciones | SAP, bodegas, transportadoras, facturación, B2B operativo |
| 10 | Validación, prioridades y cierre | Prioridades, aprobación de toppings, checklist |

---

## 3. Flujo principal

1. El consultor crea el proyecto (nombre + cliente). El simulador arranca con un **esqueleto**: encabezado con la marca y un Home vacío que invita a responder.
2. Etapa 1: el cliente cuenta qué vende y a quién. Aparecen **recomendaciones** ("Vendes suplementos → tabla nutricional, compra por objetivo, suscripción").
3. Cada respuesta: se guarda → se deriva la configuración → el simulador navega al lugar afectado y lo resalta.
4. Las respuestas que activan toppings agregan **preguntas de seguimiento** justo debajo ("Elegiste cuenta regresiva → ¿para qué evento?").
5. El consultor puede **dejar pendiente**, marcar **por validar** o **no aplica**, y escribir notas.
6. Etapa 10: se priorizan y aprueban los toppings con el cliente. Lo no aprobado nunca cuenta como aprobado.
7. Entregables se generan solos y se exportan.

---

## 4. Estructura de datos

Separación estricta (requisito 5):

```ts
DiscoveryProject {                 // lo que se guarda
  schemaVersion: 2
  meta
  answers:  { [questionId]: { value, status: pending|answered|to_validate|na, notes, updatedAt } }   // Respuestas
  toppings: { [toppingId]:  { manual, dismissed, approval: requested|approved|discarded, priority, validation, notes } } // Decisiones sobre toppings
  content:  { sections: { [toppingId]: Partial<SectionProps> }, pages: {...} }                      // Personalización de datos ficticios
  validations: { [key]: { status, note } }                                                          // Notas y validaciones técnicas
}
deriveConfig(project) → SimConfig   // Configuración derivada (función pura, nunca se guarda)
SimSession (carrito, pedidos, suscripciones demo)                                                   // Estado de la simulación
```

### Pregunta

| Campo | Ejemplo |
|---|---|
| `id` | `HOM-02` |
| `stage`, `category` | `home`, `Promociones` |
| `text` | ¿Cómo quieres presentar las promociones de tu tienda? |
| `context` | Microexplicación en lenguaje comercial |
| `type` | `single · multi · cards · boolean · text · textarea · number · colors · fonts · logo · pages · menu · references · tags · homeOrder · toppingReview` |
| `options[]` | `{ value, label, description, visual, toppings[], exclusive }` |
| `showIf` | Regla declarativa: `{ q: 'HOM-02', includes: 'countdown' }`, `{ all: [...] }`, `{ any: [...] }`, `{ topping: 'b2b-quote' }` |
| `features` | Funcionalidades asociadas (texto para matriz) |
| `toppings` | Toppings vinculados |
| `effect` | Efecto esperado sobre el simulador |
| `apply(value, cfg)` | Cómo la respuesta modifica la configuración derivada |
| `preview` | Página y componente a mostrar |

Estado por respuesta: **pendiente · respondida · por validar · no aplica** + notas del consultor.

### Topping

| Campo | Ejemplo (Cuenta regresiva) |
|---|---|
| `id`, `group` | `countdown`, `home` |
| `name`, `description` | Cuenta regresiva · Contador para campañas con fecha límite |
| `problem` | Las promociones sin urgencia convierten menos |
| `variants` | Barra superior / bloque en el Home |
| `params` | Evento (HOM-07), duración (HOM-08) — vienen de preguntas de seguimiento |
| `activatedBy` | `HOM-02 = countdown` (calculado desde las opciones) |
| `dependencies`, `techClass` | App o sección personalizada · `theme`, `custom`, `validation` |
| `recommendWhen` | Reglas + motivo |
| `sim` | Cómo se ve en el simulador (sección, página, demo interactiva) |

Estado efectivo de un topping (claramente distinto en la UI):
- **Recomendado**: lo sugiere una regla; no está en el simulador hasta que se acepta.
- **Solicitado**: lo activó una respuesta o el consultor; está en el simulador.
- **Aprobado**: validado con el cliente en la etapa 10.
- **Descartado**.

Si una respuesta cambia, el topping se desactiva pero su configuración (parámetros, contenido, notas) se conserva y vuelve si se reactiva.

---

## 5. Mapa pregunta → topping → simulador (módulo Home y navegación)

| Pregunta | Respuesta | Topping | Simulador |
|---|---|---|---|
| HOM-01 ¿Qué debe entender primero un visitante? | Propuesta de valor / Promoción / Categorías / Historia | Hero / Promo / Categorías / Historia de marca | Primera sección del Home |
| HOM-02 ¿Cómo presentas las promociones? | Banner principal | `hero-banner` → HOM-03 estructura, HOM-04 mensaje | Banner con variante y textos |
| | Carrusel | `promo-carousel` → HOM-05 cantidad, HOM-06 rotación | Slideshow con N slides |
| | Cuenta regresiva | `countdown` → HOM-07 evento, HOM-08 duración | Contador en vivo |
| | Pop-up | `promo-popup` → HOM-09 momento, HOM-10 incentivo | Pop-up al abrir el Home |
| | Barra de anuncio | `announcement-bar` → HOM-11 texto | Barra superior |
| | No deseo promociones | (exclusiva, quita las anteriores) | Se retiran |
| HOM-12 ¿Cómo llega el cliente a los productos? | Círculos / Tarjetas / Objetivo / Marca | `category-circles` … `brand-strip` | Secciones de navegación |
| HOM-14 ¿Qué productos destacar? | Más vendidos / Novedades / Curada / Kits | `best-sellers` … | Carruseles/cuadrículas |
| HOM-15 ¿Cuántos por fila y cómo? | Carrusel / Cuadrícula | parámetros | Variante de las secciones |
| HOM-16 ¿Qué genera confianza? | Beneficios / Testimonios / Historia / Aliados | `benefits-bar` … | Bloques de confianza |
| HOM-18 ¿Cierre del Home? | Newsletter / Asesor / Catálogo | `newsletter` / `final-cta` | Última sección |
| HOM-19 Orden del Home | Lista ordenada | — | Orden real |
| HOM-20…28 Navegación | páginas, menú, megamenú, encabezado, logo, sticky, footer, WhatsApp | `mega-menu`, `sticky-header`, `whatsapp-button` | Encabezado, menú y footer |

---

## 6. Plan de refactorización

| Paso | Cambio | Preserva | Reemplaza |
|---|---|---|---|
| 1 | `types/discovery.ts`, `config/discovery/*` (etapas, preguntas, toppings), `engine/derive.ts`, `engine/conditions.ts` | `ProjectConfig` como **configuración derivada** del simulador | `config/questions.ts` (v1) → banco v2 |
| 2 | Store v2 con migración v1 → v2 | Proyectos, sesiones demo, identidad del estudio | `update(path)` directo → `answer(qid, value)` |
| 3 | Nuevo panel Discovery (una pregunta por vez, estados, notas, recomendaciones, seguimiento) | Controles visuales, esquemas, miniaturas, vista previa guiada | `DiscoveryPanel` v1 |
| 4 | Simulador acumulativo + nuevas demos (cuenta regresiva, WhatsApp, …) | Todo el simulador | — |
| 5 | Workspace Toppings | Miniaturas, constructor por toppings | `HomeToppings` se integra como pregunta HOM-19 |
| 6 | Entregables (PMO 2.0) | Riesgos, criterios, exportaciones v1 | Requerimientos por sección → por topping |
| 7 | QA e2e de criterios 2.0 | Pruebas v1 adaptadas | — |

Primer módulo demostrable: **etapas 1–3 (contexto, marca, Home y navegación)** validado de punta a punta antes de extender.

---

## 7. Qué se preservó, qué se reemplazó (v1 → v2)

| Funcionalidad v1 | En v2 | Nota |
|---|---|---|
| Simulador completo (Home, PLP, PDP, carrito, checkout demo, cuenta, kits, seguimiento) | **Preservado** | Ahora se alimenta de la configuración derivada; agrega cuenta regresiva, WhatsApp, lista de deseos, guía de tallas, entrega estimada, puntos, B2B, vistos recientemente, búsqueda con sugerencias, recogida en tienda y pago exprés |
| Vista previa guiada (ir al componente y resaltarlo) | **Preservado** | Cada pregunta declara su `preview`; las secciones nuevas del Home se resaltan al aparecer |
| Toppings del Home (miniaturas, apilar, ordenar, quitar) | **Preservado y ampliado** | Pregunta HOM-20 "Orden del Home" + biblioteca de 75 toppings en 9 grupos |
| Constructor del Home (editar títulos, textos, imágenes) | **Reemplazado** | La estructura la deciden las preguntas; los textos e imágenes de ejemplo se ajustan en "Editar contenido" (separado en `content`) |
| 80 preguntas en 7 fases que escribían rutas de configuración | **Reemplazado** | Banco de 149 preguntas en 10 etapas, en lenguaje de negocio, con reglas condicionales declarativas |
| Estados pendiente/respondida/aprobada/rechazada por pregunta | **Reemplazado** | Respuestas: pendiente · respondida · por validar · no aplica. Aprobación: por funcionalidad (topping) en la etapa 10 |
| Responsable por decisión | **Reemplazado** | Responsable por etapa (`StageDef.owner`) + notas del consultor por pregunta |
| Anotaciones "Ver implementación Shopify" | **Preservado** | Muestran además el topping, su estado y su origen |
| Panel PMO (decisiones, requerimientos, alcance, riesgos, dependencias, criterios, mapa) | **Reemplazado por Entregables** | Resumen ejecutivo, matriz de requerimientos, páginas y componentes, inventario de toppings, backlog, riesgos y pendientes, clasificación Shopify, checklist y banco de respuestas |
| Exportaciones JSON, resumen, mapa, pendientes, criterios, spec Claude Code | **Preservado y ampliado** | 16 exportaciones; el JSON de proyecto v2 es reimportable y se acepta también el JSON v1 |
| Proyectos en localStorage, duplicar, importar, identidad del estudio | **Preservado** | Migración automática de proyectos v1 al abrir la app |
| Plantillas "Bienestar" y "Genérico" | **Reemplazado** | Un único esqueleto que se construye con respuestas; las recomendaciones cambian según la industria (CTX-01) |

## 8. Estado de implementación

- Módulo 1 (Home y navegación) validado de punta a punta: etapas 1–3 con 53 preguntas, 22 toppings de Home y navegación, orden del Home, menú y megamenú, encabezado, footer y WhatsApp.
- Etapas 4–10 implementadas sobre el mismo motor (96 preguntas más) y validadas con la prueba e2e (catálogo, ficha, carrito, B2B, toppings, validación y entregables).
