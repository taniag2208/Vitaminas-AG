import { getAnnotation, type AnnotationSpec } from '@/config/annotations';
import { PHASES, visibleQuestions } from '@/config/questions';
import { getSectionDef } from '@/config/sections';
import { pageTypeInfo } from '@/config/templates';
import { answerSummary, decisionMeta, scopeOf, SCOPE_LABEL } from '@/engine/answers';
import type { DecisionStatus, ProjectConfig, ScopeStatus } from '@/types/project';

/* ───────────── Mapa del sitio ───────────── */

export interface SitemapNode {
  id: string;
  title: string;
  route: string;
  kind: 'page' | 'collection' | 'template' | 'external';
  inMenu?: boolean;
  inFooter?: boolean;
  note?: string;
  children?: SitemapNode[];
}

export function buildSitemap(c: ProjectConfig): SitemapNode[] {
  const nodes: SitemapNode[] = c.pages.map((p) => {
    const node: SitemapNode = { id: p.id, title: p.title, route: p.id, kind: 'page', inMenu: p.inMenu, inFooter: p.inFooter };
    if (p.type === 'catalog') {
      node.kind = 'collection';
      node.children = [
        ...c.catalog.categories.map((cat) => ({ id: `cat:${cat}`, title: cat, route: `catalog?category=${encodeURIComponent(cat)}`, kind: 'collection' as const })),
        { id: 'product', title: 'Plantilla: ficha de producto', route: 'product', kind: 'template' },
      ];
    }
    if (p.type === 'blog') node.children = [{ id: 'article', title: 'Plantilla: artículo', route: 'blog', kind: 'template' }];
    return node;
  });
  nodes.push({ id: 'cart', title: c.cart.type === 'drawer' ? 'Carrito (lateral)' : 'Carrito', route: 'cart', kind: 'template' });
  nodes.push({ id: 'checkout', title: 'Checkout de Shopify', route: 'checkout', kind: 'external', note: 'Nativo de Shopify; aquí solo se simula la confirmación' });
  return nodes;
}

/* ───────────── Decisiones ───────────── */

export interface DecisionRow {
  id: string;
  phase: string;
  phaseIndex: number;
  question: string;
  answer: string;
  status: DecisionStatus;
  owner: string;
  notes: string;
  scope: ScopeStatus;
  annotation?: string;
}

export function decisionRows(c: ProjectConfig): DecisionRow[] {
  return visibleQuestions(c).map((q) => {
    const meta = decisionMeta(q, c);
    const phase = PHASES.find((p) => p.id === q.phase)!;
    return { id: q.id, phase: phase.title, phaseIndex: phase.index, question: q.title, answer: answerSummary(q, c), status: meta.status, owner: meta.owner, notes: meta.notes, scope: scopeOf(q, c), annotation: q.annotation };
  });
}

/* ───────────── Requerimientos funcionales ───────────── */

export interface Requirement extends AnnotationSpec {
  id: string;
  area: string;
  scope: ScopeStatus;
  themePending: boolean;
}

export function requirements(c: ProjectConfig): Requirement[] {
  const out: Requirement[] = [];
  const push = (id: string, area: string, key: string, scope: ScopeStatus = 'proposal', nameOverride?: string) => {
    const spec = getAnnotation(key, c);
    if (!spec) return;
    out.push({ ...spec, name: nameOverride ?? spec.name, id, area, scope, themePending: spec.classes.includes('theme') && !c.meta.themeName });
  };

  push('RF-GLB-01', 'Global', 'header', c.header.elements.includes('wishlist') ? 'additional' : 'proposal');
  if (c.header.menuType === 'mega') push('RF-GLB-02', 'Global', 'megamenu', 'validation');
  push('RF-GLB-03', 'Global', 'footer');

  c.home.sections.forEach((s, i) => {
    const def = getSectionDef(s.type);
    push(`RF-HOME-${String(i + 1).padStart(2, '0')}`, 'Home', def.annotation, def.scope, `${def.label}${s.props.title ? ` — "${s.props.title}"` : ''}`);
  });

  push('RF-CAT-01', 'Catálogo', 'collection', c.catalog.pagination === 'pages' ? 'proposal' : 'validation');
  push('RF-CAT-02', 'Catálogo', 'filters', c.catalog.filters.some((f) => ['goal', 'ingredient'].includes(f)) || c.catalog.sorts.includes('rating') ? 'validation' : 'proposal');
  push('RF-CAT-03', 'Catálogo', 'productCard', c.catalog.cardFields.some((f) => ['rating', 'quickView'].includes(f)) ? 'validation' : 'proposal');

  push('RF-PDP-01', 'Ficha de producto', 'pdpGallery');
  push('RF-PDP-02', 'Ficha de producto', 'variants');
  push('RF-PDP-03', 'Ficha de producto', 'buyBox', c.product.stickyBuy || c.subscriptions.enabled ? 'validation' : 'proposal');
  push('RF-PDP-04', 'Ficha de producto', 'pdpInfo', c.product.infoDisplay === 'tabs' ? 'validation' : 'proposal');
  if (c.product.infoBlocks.includes('nutrition') && c.product.nutritionFormat !== 'none') push('RF-PDP-05', 'Ficha de producto', 'nutrition', c.product.nutritionFormat === 'table' ? 'validation' : 'proposal');
  if (c.product.certifications.length) push('RF-PDP-06', 'Ficha de producto', 'certifications', 'validation');
  if (c.product.reviews !== 'none') push('RF-PDP-07', 'Ficha de producto', 'reviews', 'additional');
  if (c.product.related !== 'none') push('RF-PDP-08', 'Ficha de producto', 'related');

  push('RF-CART-01', 'Carrito y checkout', 'cart', c.cart.freeShippingBar || c.cart.recommendations ? 'validation' : 'proposal');
  push('RF-CART-02', 'Carrito y checkout', 'checkout', 'validation');

  if (c.subscriptions.enabled) push('RF-GRW-01', 'Crecimiento', 'subscriptions', 'validation');
  if (c.bundles.enabled) push('RF-GRW-02', 'Crecimiento', 'bundles', c.bundles.display.includes('builder') ? 'additional' : 'validation');
  if (c.leads.forms.length) push('RF-GRW-03', 'Crecimiento', 'leads', c.leads.forms.some((f) => ['quiz', 'backInStock'].includes(f)) ? 'additional' : c.leads.forms.includes('popup') ? 'validation' : 'proposal');
  if (c.leads.automations.length) push('RF-GRW-04', 'Crecimiento', 'automations', 'tbd');

  c.pages
    .filter((p) => !['home', 'catalog'].includes(p.type))
    .forEach((p, i) => {
      const info = pageTypeInfo(p.type);
      push(`RF-PAG-${String(i + 1).padStart(2, '0')}`, 'Páginas', info.annotation, info.scope, `Página: ${p.title}`);
    });
  return out;
}

/* ───────────── Riesgos ───────────── */

export interface Risk {
  id: string;
  level: 'Alta' | 'Media' | 'Baja';
  area: string;
  text: string;
  mitigation: string;
}

export function risks(c: ProjectConfig): Risk[] {
  const r: Risk[] = [];
  let n = 0;
  const add = (level: Risk['level'], area: string, text: string, mitigation: string) => r.push({ id: `R-${String(++n).padStart(2, '0')}`, level, area, text, mitigation });

  if (!c.meta.themeName) add('Media', 'Tema', 'Tema Shopify no definido: toda compatibilidad "dependiente del tema" está pendiente.', 'Seleccionar tema y validar cada componente marcado como dependiente del tema.');
  const s = c.sap;
  if (!s.productSource || s.productSource === 'Por definir') add('Alta', 'SAP', 'Origen de datos de producto sin definir.', 'Acordar con el integrador qué campos provienen de SAP y cuáles se enriquecen en Shopify.');
  if (!s.priceSource || s.priceSource === 'Por definir') add('Alta', 'SAP', 'Origen de precios sin definir.', 'Definir lista de precios B2C y responsable de promociones.');
  if (!s.inventorySource || s.inventorySource === 'Por definir') add('Alta', 'SAP', 'Origen de inventario sin definir.', 'Definir bodega(s) y reglas de stock disponible para venta web.');
  if (s.inventoryFrequency === 'Diaria' || s.inventoryFrequency === 'Cada hora') add('Alta', 'SAP', `Sincronización de inventario "${s.inventoryFrequency}": riesgo de sobreventa.`, 'Aumentar frecuencia o reservar stock de seguridad para web.');
  if (!s.inventoryFrequency || s.inventoryFrequency === 'Por definir') add('Media', 'SAP', 'Frecuencia de sincronización de inventario sin definir.', 'Definir SLA de sincronización con el integrador.');
  if (!s.orderSync || s.orderSync === 'Por definir') add('Alta', 'SAP', 'Flujo de pedidos hacia SAP sin definir.', 'Definir disparador (pago/creación), campos y manejo de pendientes.');
  if (!s.customerSync || s.customerSync === 'Por definir') add('Media', 'SAP', 'Sincronización de clientes sin definir.', 'Definir identificador único de cliente entre Shopify y SAP.');
  if (!s.orderStatuses.length) add('Media', 'SAP', 'No se definieron estados de pedido que regresan a Shopify.', 'Acordar mapeo de estados SAP → Shopify (fulfillment).');
  if (!s.errorHandling.length) add('Media', 'SAP', 'Manejo de errores de integración sin definir.', 'Definir reintentos, alertas y procedimiento manual.');
  if (c.subscriptions.enabled) {
    add('Alta', 'Suscripciones', 'La viabilidad depende de una pasarela con cobros recurrentes disponible en el país y de una app de suscripciones.', 'Validar pasarela y app antes de confirmar alcance.');
    if (!s.renewalHandling || s.renewalHandling === 'Por definir') add('Alta', 'SAP', 'Tratamiento de renovaciones de suscripción en SAP sin definir.', 'Definir si cada renovación crea un pedido en SAP.');
  }
  if (c.bundles.enabled && (!s.bundleHandling || s.bundleHandling === 'Por definir')) add('Alta', 'SAP', 'Tratamiento de kits en SAP sin definir (inventario y facturación).', 'Definir si el kit es código propio o se desglosa en componentes.');
  if (!c.cart.paymentMethods.length) add('Media', 'Checkout', 'Medios de pago sin definir.', 'Confirmar pasarela y medios disponibles.');
  if (!c.cart.shippingRules.length) add('Media', 'Checkout', 'Reglas de envío sin definir.', 'Definir tarifas, zonas y condiciones de envío gratis.');
  if (c.cart.freeShippingBar && !c.cart.shippingRules.includes('Envío gratis desde monto')) add('Baja', 'Carrito', 'Barra de envío gratis activa sin regla de envío gratis configurada.', 'Agregar la regla "Envío gratis desde monto" o desactivar la barra.');
  if (c.catalog.filters.some((f) => ['goal', 'ingredient'].includes(f))) add('Media', 'Catálogo', 'Filtros por objetivo/ingrediente requieren datos estructurados en todos los productos.', 'Definir responsable y origen (SAP o carga manual) de cada atributo.');
  if (c.product.infoBlocks.includes('benefits')) add('Media', 'Contenido', 'Los beneficios de producto pueden constituir afirmaciones de salud.', 'Usar solo textos aprobados por el cliente y su área regulatoria.');
  if (c.product.certifications.length) add('Media', 'Contenido', 'Certificaciones visibles requieren soporte documental.', 'Recopilar soporte de cada certificación antes de publicar.');
  if (c.product.reviews !== 'none') add('Baja', 'Apps', 'Reseñas requieren app con costo recurrente.', 'Comparar apps y confirmar presupuesto.');

  requirements(c)
    .filter((q) => q.scope === 'additional')
    .forEach((q) => add('Media', 'Alcance', `"${q.name}" es una solicitud adicional.`, 'Revisar alcance y viabilidad antes de confirmar implementación.'));
  return r;
}

/* ───────────── Resumen ───────────── */

export function pmoSummary(c: ProjectConfig) {
  const rows = decisionRows(c);
  const reqs = requirements(c);
  const count = (s: DecisionStatus) => rows.filter((r) => r.status === s).length;
  const scopeCount = (s: ScopeStatus) => reqs.filter((r) => r.scope === s).length;
  return {
    total: rows.length,
    pending: count('pending'),
    proposed: count('proposed'),
    approved: count('approved'),
    rejected: count('rejected'),
    progress: rows.length ? Math.round(((count('proposed') + count('approved')) / rows.length) * 100) : 0,
    scope: { proposal: scopeCount('proposal'), tbd: scopeCount('tbd'), additional: scopeCount('additional'), validation: scopeCount('validation') },
    risks: risks(c),
    requirements: reqs,
    rows,
  };
}

export const scopeLabel = (s: ScopeStatus) => SCOPE_LABEL[s];
