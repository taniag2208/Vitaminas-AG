import { describe, expect, it } from 'vitest';
import { getAnnotation } from '@/config/annotations';
import { ACTIVATED_BY, QUESTIONS } from '@/config/discovery';
import { getTopping, TOPPINGS } from '@/config/discovery/toppings';
import { createProject } from '@/config/templates';
import { DEMO_PRODUCTS } from '@/data/demoCatalog';
import type { DiscoveryProject, ToppingRecord } from '@/types/discovery';
import { applyFilters, facets } from './catalog';
import { evaluate } from './conditions';
import { backlog, requirements, risks, validationChecklist } from './deliverables';
import { analyze, stageStats } from './derive';
import { exportClaudeSpec, exportExecutive, exportProjectJson, exportRequirementsCsv } from './exports';
import { migrateV1, newProject, toV2 } from './migrate';

const base = () => newProject({ name: 'Test', client: 'AG Vitaminas' });
const answer = (p: DiscoveryProject, values: Record<string, unknown>, status: 'answered' | 'to_validate' | 'na' = 'answered'): DiscoveryProject => ({
  ...p,
  answers: { ...p.answers, ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v, status, notes: '', updatedAt: '' }])) },
});
const topping = (p: DiscoveryProject, id: string, r: ToppingRecord): DiscoveryProject => ({ ...p, toppings: { ...p.toppings, [id]: { ...p.toppings[id], ...r } } });
const homeIds = (p: DiscoveryProject) => analyze(p).config.home.sections.map((s) => s.id);
const visible = (p: DiscoveryProject, id: string) => analyze(p).visibleIds.has(id);

describe('banco de preguntas', () => {
  it('tiene entre 100 y 150 preguntas con id único, etapa, tipo y efecto', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(100);
    expect(QUESTIONS.length).toBeLessThanOrEqual(150);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.text, q.id).toBeTruthy();
      expect(q.effect, q.id).toBeTruthy();
      if (['single', 'cards', 'multi', 'boolean'].includes(q.type)) expect(q.options?.length, q.id).toBeGreaterThan(0);
    }
  });

  it('las reglas condicionales solo referencian preguntas y toppings existentes', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    const walk = (c: unknown): void => {
      if (!c || typeof c !== 'object') return;
      const o = c as Record<string, unknown>;
      if ('q' in o) expect(ids.has(String(o.q)), String(o.q)).toBe(true);
      if ('topping' in o) expect(getTopping(String(o.topping)), String(o.topping)).toBeTruthy();
      for (const k of ['all', 'any']) if (Array.isArray(o[k])) (o[k] as unknown[]).forEach(walk);
      if (o.not) walk(o.not);
    };
    for (const q of QUESTIONS) walk(q.showIf);
    for (const t of TOPPINGS) for (const r of t.recommend ?? []) walk(r.when);
  });

  it('las opciones solo activan toppings existentes y cada topping tiene especificación', () => {
    for (const q of QUESTIONS) for (const o of q.options ?? []) for (const t of o.toppings ?? []) expect(getTopping(t), `${q.id}→${t}`).toBeTruthy();
    const cfg = createProject({ name: 'x', client: 'x', template: 'wellness' });
    for (const t of TOPPINGS) {
      expect(t.problem, t.id).toBeTruthy();
      if (t.annotation) expect(getAnnotation(t.annotation, cfg), `${t.id}: ${t.annotation}`).not.toBeNull();
      for (const prm of t.params ?? []) if (prm.question) expect(QUESTIONS.some((q) => q.id === prm.question), `${t.id}.${prm.key}`).toBe(true);
    }
  });

  it('la mayoría de toppings se activan desde al menos una pregunta', () => {
    const reachable = TOPPINGS.filter((t) => (ACTIVATED_BY[t.id] ?? []).length > 0).length;
    expect(reachable / TOPPINGS.length).toBeGreaterThan(0.85);
  });
});

describe('reglas condicionales', () => {
  it('las preguntas de seguimiento aparecen solo con la respuesta que las activa', () => {
    let p = base();
    expect(visible(p, 'HOM-05')).toBe(false);
    p = answer(p, { 'HOM-02': ['carousel'] });
    expect(visible(p, 'HOM-05')).toBe(true);
    expect(visible(p, 'HOM-07')).toBe(false);
  });

  it('condiciones por topping: el banner desde HOM-01 abre sus preguntas de estructura', () => {
    let p = base();
    expect(visible(p, 'HOM-03')).toBe(false);
    p = answer(p, { 'HOM-01': 'value' });
    expect(visible(p, 'HOM-03')).toBe(true);
    expect(visible(p, 'HOM-04')).toBe(true);
  });

  it('B2B abre preguntas de precios, mínimos y crédito', () => {
    const p = answer(base(), { 'CTX-02': ['b2c', 'b2b'] });
    for (const id of ['CTX-15', 'FID-13', 'FID-14', 'CRT-13', 'PDP-18', 'OPS-18']) expect(visible(p, id), id).toBe(true);
    expect(visible(answer(base(), { 'CTX-02': ['b2c'] }), 'FID-13')).toBe(false);
  });

  it('evalúa all/any/not', () => {
    const p = answer(base(), { 'CTX-01': 'fashion', 'CTX-05': ['retention'] });
    expect(evaluate({ all: [{ q: 'CTX-01', eq: 'fashion' }, { q: 'CTX-05', includes: 'retention' }] }, p)).toBe(true);
    expect(evaluate({ any: [{ q: 'CTX-01', eq: 'food' }, { not: { q: 'CTX-05', includes: 'sales' } }] }, p)).toBe(true);
  });
});

describe('motor de configuración progresiva', () => {
  it('el Home empieza vacío y se construye con las respuestas', () => {
    expect(homeIds(base())).toEqual([]);
    const p = answer(base(), { 'HOM-02': ['banner', 'countdown'], 'HOM-13': ['circles'] });
    expect(homeIds(p)).toEqual(expect.arrayContaining(['hero-banner', 'countdown', 'category-circles']));
  });

  it('cambiar una respuesta actualiza solo los componentes afectados', () => {
    let p = answer(base(), { 'HOM-02': ['banner', 'countdown'], 'HOM-13': ['circles'], 'HOM-07': 'Black Friday' });
    p = answer(p, { 'HOM-02': ['countdown'] });
    const ids = homeIds(p);
    expect(ids).not.toContain('hero-banner');
    expect(ids).toEqual(expect.arrayContaining(['countdown', 'category-circles']));
    expect(analyze(p).config.home.sections.find((s) => s.id === 'countdown')!.props.title).toBe('Black Friday');
  });

  it('la opción exclusiva "no deseo promociones" retira las promociones', () => {
    const p = answer(base(), { 'HOM-02': ['none'] });
    expect(homeIds(p)).toEqual([]);
  });

  it('los parámetros de seguimiento configuran el topping', () => {
    const p = answer(base(), { 'HOM-02': ['carousel', 'bar'], 'HOM-05': '4', 'HOM-11': 'Hola mundo' });
    const c = analyze(p).config;
    expect(c.home.sections.find((s) => s.id === 'promo-carousel')!.props.slides).toHaveLength(4);
    expect(c.header.elements).toContain('promoBar');
    expect(c.header.promoText).toBe('Hola mundo');
  });

  it('respeta el orden pedido y pone primero lo elegido en HOM-01', () => {
    let p = answer(base(), { 'HOM-01': 'categories', 'HOM-14': ['bestSellers'], 'HOM-02': ['banner'] });
    expect(homeIds(p)[0]).toBe('category-circles');
    p = answer(p, { 'HOM-20': ['best-sellers', 'hero-banner', 'category-circles'] });
    expect(homeIds(p)).toEqual(['best-sellers', 'hero-banner', 'category-circles']);
  });

  it('marca y tono cambian la apariencia', () => {
    const p = answer(base(), { 'BRD-03': 'premium', 'BRD-08': 'expert', 'HOM-01': 'value' });
    const c = analyze(p).config;
    expect(c.brand.headingFont).toBe('Playfair Display');
    expect(c.home.sections[0].props.title).toMatch(/experto/i);
  });

  it('"no aplica" y "pendiente" no modifican la configuración; "por validar" sí', () => {
    expect(analyze(answer(base(), { 'HOM-22': 'mega' }, 'na')).config.header.menuType).toBe('simple');
    expect(analyze(answer(base(), { 'HOM-22': 'mega' }, 'to_validate')).config.header.menuType).toBe('mega');
  });

  it('un topping descartado sale del simulador aunque una respuesta lo pida', () => {
    let p = answer(base(), { 'HOM-02': ['banner'] });
    p = topping(p, 'hero-banner', { approval: 'discarded' });
    expect(homeIds(p)).not.toContain('hero-banner');
  });

  it('las configuraciones independientes se conservan (contenido personalizado)', () => {
    let p = answer(base(), { 'HOM-14': ['bestSellers'] });
    p = { ...p, content: { sections: { 'best-sellers': { title: 'Top de AG' } } } };
    p = answer(p, { 'HOM-14': ['newArrivals'] });
    p = answer(p, { 'HOM-14': ['newArrivals', 'bestSellers'] });
    expect(analyze(p).config.home.sections.find((s) => s.id === 'best-sellers')!.props.title).toBe('Top de AG');
  });

  it('el catálogo deriva filtros que funcionan', () => {
    const p = answer(base(), { 'CAT-03': ['brand', 'goal'], 'CAT-06': 'horizontal' });
    const c = analyze(p).config;
    expect(c.catalog.filters).toEqual(['brand', 'goal']);
    expect(c.catalog.filterLayout).toBe('horizontal');
    const r = applyFilters(DEMO_PRODUCTS, { brand: ['Kinetik'] }, c.catalog);
    expect(r.every((x) => x.brand === 'Kinetik')).toBe(true);
    expect(facets(DEMO_PRODUCTS, 'brand', {}, c.catalog).reduce((s, f) => s + f.count, 0)).toBe(DEMO_PRODUCTS.length);
  });
});

describe('recomendaciones y estados', () => {
  it('recomienda según el negocio y distingue recomendado / solicitado / aprobado', () => {
    let p = answer(base(), { 'CTX-01': 'fashion' });
    const st = (id: string) => analyze(p).toppings.find((t) => t.def.id === id)!.status;
    expect(st('size-guide')).toBe('recommended');
    p = topping(p, 'size-guide', { manual: true });
    expect(st('size-guide')).toBe('requested');
    p = topping(p, 'size-guide', { approval: 'approved' });
    expect(st('size-guide')).toBe('approved');
  });

  it('una recomendación descartada no vuelve a aparecer', () => {
    const p = topping(answer(base(), { 'CTX-01': 'fashion' }), 'size-guide', { dismissed: true });
    expect(analyze(p).recommended.some((t) => t.def.id === 'size-guide')).toBe(false);
  });

  it('las preguntas pendientes no cuentan como resueltas', () => {
    const p = answer(base(), { 'CTX-01': 'supplements' });
    const s = stageStats(p, 'context');
    expect(s.answered).toBe(1);
    expect(s.pending).toBe(s.total - 1);
  });
});

describe('entregables', () => {
  const p = topping(answer(base(), { 'CTX-03': 'AG Vitaminas', 'HOM-02': ['banner', 'countdown'], 'FID-02': true }), 'hero-banner', { approval: 'approved', priority: 'must' });

  it('la matriz refleja toppings activos con su estado', () => {
    const reqs = requirements(p);
    expect(reqs.find((r) => r.toppingId === 'hero-banner')!.status).toBe('approved');
    expect(reqs.find((r) => r.toppingId === 'countdown')!.status).toBe('requested');
  });

  it('el backlog incluye historias y tareas técnicas', () => {
    const b = backlog(p);
    expect(b.some((x) => x.type === 'Historia')).toBe(true);
    expect(b.some((x) => x.type === 'Tarea técnica' && /app|validación/i.test(x.title))).toBe(true);
  });

  it('riesgos y checklist reaccionan a las decisiones', () => {
    expect(risks(p).some((r) => r.area === 'Suscripciones')).toBe(true);
    expect(validationChecklist(p).find((c) => c.id === 'CK-03')!.done).toBe(false);
  });

  it('las exportaciones reflejan las respuestas actuales', () => {
    expect(exportExecutive(p)).toContain('AG Vitaminas');
    expect(exportRequirementsCsv(p)).toContain('Cuenta regresiva');
    expect(exportClaudeSpec(p)).toContain('no implementar lógica de integración SAP');
    expect(JSON.parse(exportProjectJson(p)).project.answers['HOM-02'].value).toEqual(['banner', 'countdown']);
  });
});

describe('migración v1 → v2', () => {
  it('convierte respuestas y secciones del Home', () => {
    const v1 = createProject({ name: 'Viejo', client: 'AG', template: 'wellness' });
    v1.brand.storeName = 'AG Store';
    v1.answered = { 'brand.storeName': true, 'home.sections': true };
    const p = migrateV1(v1);
    expect(p.schemaVersion).toBe(2);
    expect(p.answers['CTX-03'].value).toBe('AG Store');
    expect(p.answers['CAT-01']).toBeUndefined();
    expect(homeIds(p).length).toBe(v1.home.sections.length);
    expect(toV2({ config: v1 })?.schemaVersion).toBe(2);
    expect(toV2({ project: p })).toBe(p);
  });
});
