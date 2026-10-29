import { getAnnotation, TECH_CLASS_LABEL } from '@/config/annotations';
import { getQuestion, QUESTIONS } from '@/config/discovery';
import { STAGES } from '@/config/discovery/stages';
import { GROUP_LABEL } from '@/config/discovery/toppings';
import type { DiscoveryProject, Priority, StageId, ToppingGroup, ToppingStatus, ToppingView } from '@/types/discovery';
import type { ProjectConfig, ScopeStatus, TechClass } from '@/types/project';
import { describe, isGiven } from './conditions';
import { analyze, stageStats, statusOf } from './derive';
import { SCOPE_LABEL, TOPPING_STATUS_LABEL } from './labels';
import { buildSitemap } from './sitemap';
import { answerText } from './summary';

/**
 * Entregables automáticos del Discovery. Todo se deriva de respuestas y decisiones de toppings:
 * nunca se guardan copias, así los reportes siempre reflejan el estado actual.
 */

/* ───────────── Matriz de requerimientos ───────────── */

export interface Requirement {
  id: string;
  toppingId: string;
  name: string;
  group: ToppingGroup;
  stage: StageId;
  problem: string;
  functionality: string;
  implementation: string;
  classes: TechClass[];
  dependencies: string[];
  risks: string[];
  acceptance: string[];
  scope: ScopeStatus;
  status: ToppingStatus;
  priority?: Priority;
  validation: string;
  origin: string;
  themePending: boolean;
  notes: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { must: 0, should: 1, could: 2, later: 3 };
export const PRIORITY_LABEL: Record<Priority, string> = { must: 'Imprescindible', should: 'Importante', could: 'Deseable', later: 'Después del lanzamiento' };
const VALIDATION_LABEL = { pending: 'Pendiente', viable: 'Viable', review: 'En revisión', not_viable: 'No viable' } as const;

export function requirements(p: DiscoveryProject): Requirement[] {
  const { toppings, config } = analyze(p);
  return toppings
    .filter((v) => v.active || v.status === 'discarded')
    .map((v, i) => toRequirement(v, config, i + 1));
}

function toRequirement(v: ToppingView, cfg: ProjectConfig, n: number): Requirement {
  const spec = v.def.annotation ? getAnnotation(v.def.annotation, cfg) : null;
  const classes = [...new Set([...v.def.techClass, ...(spec?.classes ?? [])])];
  return {
    id: `RF-${String(n).padStart(3, '0')}`,
    toppingId: v.def.id,
    name: v.def.name,
    group: v.def.group,
    stage: v.def.stage,
    problem: v.def.problem,
    functionality: v.def.description,
    implementation: spec?.implementation ?? 'Por definir en diseño técnico.',
    classes,
    dependencies: [...new Set([...v.def.dependencies, ...(spec?.dependencies ?? [])])],
    risks: spec?.risks ?? [],
    acceptance: v.def.acceptance ?? spec?.acceptance ?? ['Funciona según lo validado en el simulador.'],
    scope: v.def.scope,
    status: v.status,
    priority: v.record.priority,
    validation: VALIDATION_LABEL[v.record.validation ?? 'pending'],
    origin: v.source === 'answer' ? `Respuesta ${v.activatedBy.join(', ')}` : 'Agregado por el consultor',
    themePending: classes.includes('theme') && !cfg.meta.themeName,
    notes: v.record.notes ?? '',
  };
}

/** Componentes base del sitio (existen siempre; su configuración viene de las respuestas). */
export function baseComponents(p: DiscoveryProject) {
  const cfg = analyze(p).config;
  return ['header', 'collection', 'filters', 'productCard', 'pdpGallery', 'variants', 'buyBox', 'pdpInfo', 'cart', 'checkout', 'footer']
    .map((k) => getAnnotation(k, cfg)!)
    .filter(Boolean);
}

/* ───────────── Mapa de páginas y componentes ───────────── */

export function pagesAndComponents(p: DiscoveryProject) {
  const { config: c, active } = analyze(p);
  const names = (ids: string[]) => ids.filter((id) => active.has(id)).map((id) => active.get(id)!.def.name);
  const comps: Record<string, string[]> = {
    home: c.home.sections.map((s) => active.get(s.id)?.def.name ?? s.type),
    catalog: [`Filtros (${c.catalog.filters.length}) en ${c.catalog.filterLayout}`, `${c.catalog.perRowDesktop} productos por fila`, `Paginación: ${c.catalog.pagination}`, ...names(['predictive-search', 'quick-view', 'collection-banner', 'product-badges', 'wishlist'])],
    product: [`Galería ${c.product.gallery}`, `Variantes como ${c.product.variantStyle}`, `Información en ${c.product.infoDisplay}`, ...names(['image-zoom', 'sticky-add-to-cart', 'nutrition-table', 'certification-badges', 'product-reviews', 'related-products', 'size-guide', 'delivery-estimate', 'low-stock-urgency', 'frequently-bought', 'subscriptions', 'loyalty-points', 'b2b-price-lists', 'b2b-quote-request', 'recently-viewed', 'back-in-stock'])],
    cart: [c.cart.type === 'drawer' ? 'Carrito lateral' : 'Página de carrito', ...names(['free-shipping-bar', 'cart-upsell', 'discount-field', 'order-notes', 'express-checkout', 'store-pickup'])],
  };
  const global = [`Menú ${c.header.menuType}`, `Encabezado: ${c.header.elements.join(', ')}`, ...names(['announcement-bar', 'sticky-header', 'whatsapp-button', 'promo-popup'])];
  return { sitemap: buildSitemap(c), components: comps, global };
}

/* ───────────── Inventario de toppings ───────────── */

export function toppingInventory(p: DiscoveryProject) {
  const { toppings } = analyze(p);
  return toppings.filter((v) => v.status !== 'available');
}

/* ───────────── Backlog funcional y técnico ───────────── */

export interface BacklogItem {
  key: string;
  epic: string;
  type: 'Historia' | 'Tarea técnica';
  title: string;
  detail: string;
  priority: string;
  status: string;
  requirement: string;
}

const TASK_FOR: Partial<Record<TechClass, (r: Requirement) => string>> = {
  theme: (r) => `Validar soporte en el tema y configurar: ${r.name}`,
  config: (r) => `Configurar en el admin de Shopify: ${r.name}`,
  app: (r) => `Evaluar, seleccionar e instalar app para: ${r.name}`,
  custom: (r) => `Desarrollar sección/snippet personalizado: ${r.name}`,
  sap: (r) => `Acordar con el integrador SAP los datos de: ${r.name}`,
  validation: (r) => `Validación técnica de viabilidad: ${r.name}`,
};

export function backlog(p: DiscoveryProject): BacklogItem[] {
  const reqs = requirements(p).filter((r) => r.status !== 'discarded');
  const items: BacklogItem[] = [];
  let n = 0;
  const sorted = [...reqs].sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'should'] - PRIORITY_ORDER[b.priority ?? 'should']) || a.group.localeCompare(b.group));
  for (const r of sorted) {
    const prio = r.priority ? PRIORITY_LABEL[r.priority] : 'Sin priorizar';
    const status = r.status === 'approved' ? 'Aprobado' : 'Solicitado (por aprobar)';
    items.push({ key: `BL-${String(++n).padStart(3, '0')}`, epic: GROUP_LABEL[r.group], type: 'Historia', title: `${r.name}: ${r.functionality}`, detail: `Problema: ${r.problem} Criterios: ${r.acceptance.join(' / ')}`, priority: prio, status, requirement: r.id });
    for (const c of r.classes) {
      const t = TASK_FOR[c];
      if (t) items.push({ key: `BL-${String(++n).padStart(3, '0')}`, epic: GROUP_LABEL[r.group], type: 'Tarea técnica', title: t(r), detail: r.dependencies.join('; '), priority: prio, status, requirement: r.id });
    }
  }
  return items;
}

/* ───────────── Riesgos, dependencias y pendientes ───────────── */

export interface Risk { id: string; level: 'Alta' | 'Media' | 'Baja'; area: string; text: string; mitigation: string }

export function risks(p: DiscoveryProject): Risk[] {
  const { config: c, active } = analyze(p);
  const r: Risk[] = [];
  const add = (level: Risk['level'], area: string, text: string, mitigation: string) => r.push({ id: `R-${String(r.length + 1).padStart(2, '0')}`, level, area, text, mitigation });
  const tbd = (v: string) => !v || v === 'Por definir';
  if (!c.meta.themeName) add('Media', 'Tema', 'Tema Shopify no definido: toda compatibilidad "dependiente del tema" está pendiente.', 'Elegir tema y validar cada componente marcado.');
  const s = c.sap;
  if (tbd(s.productSource)) add('Alta', 'SAP', 'Origen de los datos de producto sin definir.', 'Acordar con el integrador qué campos vienen de SAP y cuáles se enriquecen en Shopify.');
  if (tbd(s.priceSource)) add('Alta', 'SAP', 'Origen de precios sin definir.', 'Definir lista de precios B2C y responsable de promociones.');
  if (tbd(s.inventorySource)) add('Alta', 'SAP', 'Origen del inventario sin definir.', 'Definir bodegas y stock disponible para la web.');
  if (s.inventoryFrequency === 'Diaria' || s.inventoryFrequency === 'Cada hora') add('Alta', 'SAP', `Inventario actualizado "${s.inventoryFrequency}": riesgo de sobreventa.`, 'Aumentar frecuencia o reservar stock de seguridad.');
  if (tbd(s.orderSync)) add('Alta', 'SAP', 'Flujo de pedidos hacia SAP sin definir.', 'Definir disparador, campos y manejo de pendientes.');
  if (tbd(s.customerSync)) add('Media', 'SAP', 'Sincronización de clientes sin definir.', 'Definir identificador único de cliente.');
  if (!s.errorHandling.length) add('Media', 'SAP', 'Manejo de errores de integración sin definir.', 'Definir reintentos, alertas y procedimiento manual.');
  if (active.has('subscriptions')) {
    add('Alta', 'Suscripciones', 'Viabilidad sujeta a pasarela con cobros recurrentes disponible en el país y a una app de suscripciones.', 'Validar pasarela y app antes de confirmar alcance.');
    if (tbd(s.renewalHandling)) add('Alta', 'SAP', 'Renovaciones de suscripción en SAP sin definir.', 'Definir si cada renovación crea un pedido en SAP.');
  }
  if (active.has('bundles-kits') && tbd(s.bundleHandling)) add('Alta', 'SAP', 'Tratamiento de kits en SAP sin definir.', 'Definir kit como código propio o desglosado.');
  if (active.has('multi-warehouse') && !isGiven(p.answers['OPS-06'])) add('Alta', 'Inventario', 'Regla de asignación entre bodegas sin definir.', 'Definir suma, región o prioridad de bodega.');
  if ([...active.keys()].some((k) => k.startsWith('b2b-'))) add('Alta', 'B2B', 'Las funcionalidades B2B nativas dependen del plan de Shopify contratado.', 'Confirmar plan (o app B2B) antes de comprometer alcance.');
  if (active.has('advanced-promotions')) add('Media', 'Promociones', 'Algunas reglas de promoción pueden requerir apps o desarrollo y no combinarse entre sí.', 'Validar cada regla en una tienda de pruebas.');
  if (!c.cart.paymentMethods.length) add('Media', 'Checkout', 'Medios de pago sin definir.', 'Confirmar pasarela y medios disponibles.');
  if (!c.cart.shippingRules.length) add('Media', 'Checkout', 'Reglas de envío sin definir.', 'Definir tarifas, zonas y envío gratis.');
  if (active.has('free-shipping-bar') && !c.cart.shippingRules.includes('Envío gratis desde monto')) add('Baja', 'Carrito', 'Barra de envío gratis sin regla de envío gratis configurada.', 'Agregar la regla o retirar la barra.');
  if (c.catalog.filters.some((f) => ['goal', 'ingredient'].includes(f))) add('Media', 'Catálogo', 'Filtros por objetivo/ingrediente requieren el dato en todos los productos.', 'Definir responsable y origen de cada atributo.');
  if (c.product.infoBlocks.includes('benefits')) add('Media', 'Contenido', 'Los beneficios de producto pueden constituir afirmaciones de salud.', 'Publicar solo textos aprobados por el cliente y el área regulatoria.');
  if (isGiven(p.answers['BRD-07']) && p.answers['BRD-07'].value === 'none') add('Media', 'Contenido', 'No hay fotografías de producto.', 'Planear producción fotográfica antes del lanzamiento.');
  const apps = [...active.values()].filter((v) => v.def.techClass.includes('app')).length;
  if (apps > 4 && isGiven(p.answers['VAL-02']) && ['none', 'low'].includes(String(p.answers['VAL-02'].value))) add('Media', 'Presupuesto', `${apps} funcionalidades requieren apps y el presupuesto mensual es bajo.`, 'Priorizar apps imprescindibles o buscar alternativas nativas.');
  for (const v of active.values()) if (v.def.scope === 'additional' && v.status !== 'approved') add('Media', 'Alcance', `"${v.def.name}" es una solicitud adicional.`, 'Revisar alcance y viabilidad antes de confirmar.');
  return r;
}

export function dependencies(p: DiscoveryProject) {
  const map = new Map<string, string[]>();
  for (const r of requirements(p).filter((x) => x.status !== 'discarded')) for (const d of r.dependencies) map.set(d, [...(map.get(d) ?? []), r.id]);
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

export function pendingDecisions(p: DiscoveryProject) {
  const { visible } = analyze(p);
  return visible
    .filter((q) => ['pending', 'to_validate'].includes(statusOf(p, q.id)))
    .map((q) => ({ q, status: statusOf(p, q.id), stage: STAGES.find((s) => s.id === q.stage)!, notes: p.answers[q.id]?.notes ?? '', condition: q.showIf ? describe(q.showIf, (id) => getQuestion(id)?.id ?? id) : '' }));
}

/* ───────────── Clasificación Shopify ───────────── */

export function shopifyClassification(p: DiscoveryProject) {
  const reqs = requirements(p).filter((r) => r.status !== 'discarded');
  return (Object.keys(TECH_CLASS_LABEL) as TechClass[]).map((cls) => ({ cls, label: TECH_CLASS_LABEL[cls], items: reqs.filter((r) => r.classes.includes(cls)) }));
}

/* ───────────── Checklist de validación ───────────── */

export interface CheckItem { id: string; text: string; done: boolean; detail: string }

export function validationChecklist(p: DiscoveryProject): CheckItem[] {
  const { toppings, config } = analyze(p);
  const all = stageStats(p);
  const active = toppings.filter((t) => t.active);
  const undecided = active.filter((t) => t.status === 'requested');
  const needTech = active.filter((t) => t.def.techClass.includes('validation') && t.record.validation !== 'viable');
  const additional = active.filter((t) => t.def.scope === 'additional' && t.status !== 'approved');
  const items: CheckItem[] = [
    { id: 'CK-01', text: 'Todas las preguntas que aplican están resueltas', done: all.pending === 0, detail: `${all.pending} pendientes de ${all.total}` },
    { id: 'CK-02', text: 'No quedan respuestas por validar', done: all.toValidate === 0, detail: `${all.toValidate} por validar` },
    { id: 'CK-03', text: 'El cliente aprobó o descartó cada funcionalidad solicitada', done: active.length > 0 && undecided.length === 0, detail: `${undecided.length} sin decidir` },
    { id: 'CK-04', text: 'Las funcionalidades aprobadas tienen prioridad', done: active.filter((t) => t.status === 'approved' && !t.record.priority).length === 0, detail: `${active.filter((t) => t.status === 'approved' && !t.record.priority).length} sin prioridad` },
    { id: 'CK-05', text: 'Viabilidad técnica confirmada para lo que requiere validación', done: needTech.length === 0, detail: needTech.map((t) => t.def.name).join(', ') || 'Ninguna pendiente' },
    { id: 'CK-06', text: 'Solicitudes adicionales revisadas comercialmente', done: additional.length === 0, detail: additional.map((t) => t.def.name).join(', ') || 'Ninguna' },
    { id: 'CK-07', text: 'Tema de Shopify definido', done: !!config.meta.themeName, detail: config.meta.themeName ?? 'Pendiente' },
    { id: 'CK-08', text: 'Responsables de integración SAP identificados', done: !!config.sap.integratorName && !!config.sap.owners, detail: config.sap.integratorName || 'Sin integrador registrado' },
    { id: 'CK-09', text: 'Aprobador del cliente registrado', done: isGiven(p.answers['VAL-05']), detail: String(p.answers['VAL-05']?.value ?? 'Pendiente') },
  ];
  return items;
}

/* ───────────── Resumen ejecutivo ───────────── */

export function executiveSummary(p: DiscoveryProject) {
  const { config: c, toppings } = analyze(p);
  const val = (id: string) => (isGiven(p.answers[id]) ? answerText(getQuestion(id)!, p.answers[id].value) : 'Pendiente');
  const active = toppings.filter((t) => t.active);
  const by = (s: ToppingStatus) => toppings.filter((t) => t.status === s).length;
  const stats = stageStats(p);
  return {
    business: [
      ['Tienda', c.brand.storeName],
      ['Qué vende', val('CTX-01')],
      ['A quién', val('CTX-02')],
      ['Objetivos', val('CTX-05')],
      ['Catálogo', val('CTX-08')],
      ['Cobertura', val('CTX-10')],
      ['Situación actual', val('CTX-06')],
      ['Lanzamiento', val('CTX-12')],
    ] as [string, string][],
    progress: { ...stats, pct: stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0 },
    toppings: { requested: by('requested'), approved: by('approved'), discarded: by('discarded'), recommended: by('recommended'), active: active.length },
    stages: STAGES.map((s) => ({ stage: s, stats: stageStats(p, s.id) })),
    home: c.home.sections.map((s) => toppings.find((t) => t.def.id === s.id)?.def.name ?? s.type),
    highlights: active.slice(0, 12).map((t) => `${t.def.name} — ${TOPPING_STATUS_LABEL[t.status]}`),
    risks: risks(p).filter((r) => r.level === 'Alta'),
    notes: [val('CTX-07'), val('VAL-04'), val('VAL-06')].filter((x) => x !== 'Pendiente' && x !== '—'),
  };
}

/* ───────────── Matriz de preguntas (para el banco completo) ───────────── */

export function questionMatrix(p: DiscoveryProject) {
  const { visibleIds } = analyze(p);
  return QUESTIONS.map((q) => ({
    q,
    stage: STAGES.find((s) => s.id === q.stage)!.title,
    applies: visibleIds.has(q.id),
    status: visibleIds.has(q.id) ? statusOf(p, q.id) : null,
    answer: isGiven(p.answers[q.id]) ? answerText(q, p.answers[q.id].value) : '',
    rule: describe(q.showIf),
    toppings: [...new Set((q.options ?? []).flatMap((o) => o.toppings ?? []))],
    notes: p.answers[q.id]?.notes ?? '',
  }));
}

export const scopeText = (s: ScopeStatus) => SCOPE_LABEL[s];
