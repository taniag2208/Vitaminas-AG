import { QUESTIONS, TOPPINGS } from '@/config/discovery';
import { STAGES } from '@/config/discovery/stages';
import { sectionDefaults } from '@/config/sections';
import { createProject, makePage } from '@/config/templates';
import type { AnswerStatus, ApplyCtx, DiscoveryProject, DQuestion, StageId, ToppingDef, ToppingStatus, ToppingView } from '@/types/discovery';
import type { ProjectConfig, SectionInstance } from '@/types/project';
import { answerValue, evaluate, isGiven } from './conditions';

/**
 * Motor de configuración progresiva.
 *   Respuestas + decisiones de toppings  ──deriveConfig──▶  configuración del simulador
 * Función pura: no modifica el proyecto y se puede recalcular en cualquier momento.
 */

/** Esqueleto inicial: lo mínimo para que el simulador sea navegable antes de responder. */
export function baseline(p: DiscoveryProject): ProjectConfig {
  const c = createProject({ name: p.meta.name, client: p.meta.client, template: 'wellness' });
  c.meta = { ...p.meta };
  c.brand.storeName = p.meta.client || p.meta.name;
  c.footer.legalText = `© ${new Date().getFullYear()} ${c.brand.storeName}. Todos los derechos reservados.`;
  c.pages = [makePage('home'), makePage('catalog')];
  c.header = { elements: ['search', 'cart'], menuType: 'simple', logoPosition: 'left', sticky: false, promoText: '' };
  c.footer = { ...c.footer, showNewsletter: false, showSocial: false, showPayments: false };
  c.home = { sections: [] };
  c.catalog = { ...c.catalog, attributes: ['price', 'availability'], filters: ['price', 'availability'], cardFields: ['price', 'compareAt', 'brand', 'addToCart'], bannerOnCollection: false, outOfStock: 'show' };
  c.product = { ...c.product, beforeBuy: ['brand', 'shortDescription'], infoBlocks: ['description', 'usage', 'ingredients'], nutritionFormat: 'none', related: 'none', stickyBuy: false, zoom: false, showStock: false };
  c.cart = { ...c.cart, type: 'page', recommendations: false, freeShippingBar: false, preCheckoutInfo: [] };
  c.leads = { forms: [], placements: [], popupTrigger: 'none', incentive: '', automations: [] };
  c.subscriptions = { ...c.subscriptions, enabled: false, scope: 'all' };
  c.bundles = { enabled: false, display: [], kits: [] };
  c.context = { vertical: 'supplements', b2c: true, b2b: false, tone: 'close', personality: 'natural' };
  c.features = {};
  return c;
}

export interface Analysis {
  config: ProjectConfig;
  visible: DQuestion[];
  visibleIds: Set<string>;
  toppings: ToppingView[];
  active: Map<string, ToppingView>;
  recommended: ToppingView[];
}

const listOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v === undefined || v === null || v === '' ? [] : [String(v)]);

function activations(p: DiscoveryProject, visible: DQuestion[]) {
  const by = new Map<string, string[]>();
  for (const q of visible) {
    if (!isGiven(p.answers[q.id])) continue;
    const value = p.answers[q.id].value;
    const sel = listOf(value);
    const ids = [...(q.options ?? []).filter((o) => sel.includes(o.value)).flatMap((o) => o.toppings ?? []), ...(q.activates?.(value) ?? [])];
    for (const id of ids) by.set(id, [...(by.get(id) ?? []), q.id]);
  }
  return by;
}

const isOn = (p: DiscoveryProject, by: Map<string, string[]>, id: string) => p.toppings[id]?.approval !== 'discarded' && (by.has(id) || !!p.toppings[id]?.manual);

function paramsOf(t: ToppingDef, p: DiscoveryProject, visibleIds: Set<string>) {
  const params: Record<string, unknown> = {};
  for (const prm of t.params ?? []) {
    const v = prm.question && visibleIds.has(prm.question) ? answerValue(p, prm.question) : undefined;
    params[prm.key] = v ?? prm.default;
  }
  const vq = t.variantQuestion && visibleIds.has(t.variantQuestion) ? answerValue(p, t.variantQuestion) : undefined;
  const variant = vq !== undefined && t.variants?.some((x) => x.id === String(vq)) ? String(vq) : t.variants?.[0]?.id;
  return { params, variant };
}

const CACHE = new WeakMap<DiscoveryProject, Analysis>();

/** Analiza el proyecto: preguntas visibles, toppings y configuración derivada. */
export function analyze(p: DiscoveryProject): Analysis {
  const hit = CACHE.get(p);
  if (hit) return hit;

  // Punto fijo: la visibilidad puede depender de toppings que dependen de respuestas visibles.
  let visible = QUESTIONS.filter((q) => evaluate(q.showIf, p, () => false));
  let by = activations(p, visible);
  for (let i = 0; i < 4; i++) {
    const next = QUESTIONS.filter((q) => evaluate(q.showIf, p, (id) => isOn(p, by, id)));
    const nextBy = activations(p, next);
    const same = next.length === visible.length && next.every((q, k) => q === visible[k]) && [...nextBy.keys()].sort().join() === [...by.keys()].sort().join();
    visible = next;
    by = nextBy;
    if (same) break;
  }
  const visibleIds = new Set(visible.map((q) => q.id));

  // Toppings
  const views: ToppingView[] = TOPPINGS.map((def) => {
    const record = p.toppings[def.id] ?? {};
    const activatedBy = by.get(def.id) ?? [];
    const active = isOn(p, by, def.id);
    const reasons = (def.recommend ?? []).filter((r) => evaluate(r.when, p, (id) => isOn(p, by, id))).map((r) => r.reason);
    const status: ToppingStatus = record.approval === 'discarded' ? 'discarded' : active ? (record.approval === 'approved' ? 'approved' : 'requested') : reasons.length && !record.dismissed ? 'recommended' : 'available';
    const { params, variant } = paramsOf(def, p, visibleIds);
    return { def, status, active, source: activatedBy.length ? 'answer' : record.manual ? 'manual' : null, activatedBy, reasons, record, params, variant };
  });
  const active = new Map(views.filter((v) => v.active).map((v) => [v.def.id, v]));

  // Configuración derivada
  const config = baseline(p);
  const ctx: ApplyCtx = { project: p, answer: (q) => answerValue(p, q), isAnswered: (q) => isGiven(p.answers[q]) };
  for (const q of visible) if (q.apply && isGiven(p.answers[q.id])) q.apply(p.answers[q.id].value, config, ctx);
  config.features = {};
  for (const v of active.values()) {
    v.def.apply?.(config, { variant: v.variant, params: v.params });
    config.features[v.def.id] = { variant: v.variant, params: v.params };
  }
  config.home = { sections: homeSections(p, active, config, visibleIds) };

  const result: Analysis = { config, visible, visibleIds, toppings: views, active, recommended: views.filter((v) => v.status === 'recommended') };
  CACHE.set(p, result);
  return result;
}

const FOCUS_TOPPING: Record<string, string> = { value: 'hero-banner', promo: 'hero-banner', categories: 'category-circles', story: 'brand-story' };

/** Secciones del Home: toppings activos de tipo sección, en el orden pedido por el cliente. */
function homeSections(p: DiscoveryProject, active: Map<string, ToppingView>, cfg: ProjectConfig, visibleIds: Set<string>): SectionInstance[] {
  const items = [...active.values()].filter((v) => v.def.sim.kind === 'section');
  const rank = (v: ToppingView) => (v.def.sim.kind === 'section' ? v.def.sim.rank : 999);
  const order = visibleIds.has('HOM-20') ? listOf(answerValue(p, 'HOM-20')) : [];
  const focus = FOCUS_TOPPING[String(answerValue(p, 'HOM-01') ?? '')];
  const key = (v: ToppingView) => {
    const i = order.indexOf(v.def.id);
    if (i >= 0) return i;
    if (!order.length && v.def.id === focus) return -1;
    return 1000 + rank(v);
  };
  return items
    .sort((a, b) => key(a) - key(b))
    .map((v) => {
      if (v.def.sim.kind !== 'section') throw new Error('unreachable');
      const base = sectionDefaults(v.def.sim.section);
      const s = v.def.section?.(base, { variant: v.variant, params: v.params, cfg });
      const props = { ...base, ...(s?.props ?? {}), ...(p.content.sections[v.def.id] ?? {}) };
      return { id: v.def.id, type: v.def.sim.section, variant: s?.variant ?? 'default', props };
    });
}

export const deriveConfig = (p: DiscoveryProject) => analyze(p).config;

/* ───────────── Progreso ───────────── */

export interface StageStats {
  total: number;
  answered: number;
  toValidate: number;
  na: number;
  pending: number;
  /** respondidas + por validar + no aplica */
  resolved: number;
}

export const statusOf = (p: DiscoveryProject, qid: string): AnswerStatus => p.answers[qid]?.status ?? 'pending';

export function stageStats(p: DiscoveryProject, stage?: StageId): StageStats {
  const { visible } = analyze(p);
  const qs = stage ? visible.filter((q) => q.stage === stage) : visible;
  const count = (s: AnswerStatus) => qs.filter((q) => statusOf(p, q.id) === s).length;
  const answered = count('answered');
  const toValidate = count('to_validate');
  const na = count('na');
  return { total: qs.length, answered, toValidate, na, pending: qs.length - answered - toValidate - na, resolved: answered + toValidate + na };
}

export const overallProgress = (p: DiscoveryProject) => {
  const s = stageStats(p);
  return s.total ? Math.round((s.resolved / s.total) * 100) : 0;
};

export const STAGE_ORDER = STAGES.map((s) => s.id);
