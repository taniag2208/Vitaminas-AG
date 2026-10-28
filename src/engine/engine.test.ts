import { describe, expect, it } from 'vitest';
import { createProject, makePage, makeSection } from '@/config/templates';
import { QUESTIONS, getQuestion, visibleQuestions } from '@/config/questions';
import { getAnnotation } from '@/config/annotations';
import { DEMO_PRODUCTS } from '@/data/demoCatalog';
import { answerSummary, decisionMeta, scopeOf } from './answers';
import { applyFilters, effectiveFilters, facets, sortProducts } from './catalog';
import { exportClaudeSpec, exportJson, exportPendingCsv } from './exports';
import { buildSitemap, requirements, risks } from './pmo';
import { setPath } from '@/lib/utils';

const base = () => createProject({ name: 'Test', client: 'AG Vitaminas', template: 'wellness' });

describe('configuración', () => {
  it('cada pregunta con ruta apunta a un valor existente', () => {
    const c = base();
    const optional = ['brand.logoImage', 'meta.themeName'];
    QUESTIONS.filter((q) => q.path && !optional.includes(q.path)).forEach((q) => {
      const v = q.path!.split('.').reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], c);
      expect(v, q.id).not.toBeUndefined();
    });
  });

  it('las anotaciones referenciadas existen', () => {
    const c = base();
    QUESTIONS.filter((q) => q.annotation).forEach((q) => expect(getAnnotation(q.annotation!, c), q.id).not.toBeNull());
  });

  it('las preguntas condicionales aparecen según la configuración', () => {
    const c = base();
    expect(visibleQuestions(c).some((q) => q.id === 'subscriptions.frequencies')).toBe(false);
    const c2 = setPath(c, 'subscriptions.enabled', true);
    expect(visibleQuestions(c2).some((q) => q.id === 'subscriptions.frequencies')).toBe(true);
  });
});

describe('mapa del sitio', () => {
  it('agrega y retira páginas', () => {
    const c = base();
    const withKits = { ...c, pages: [...c.pages, makePage('kits')] };
    expect(buildSitemap(withKits).some((n) => n.id === 'kits')).toBe(true);
    const noBlog = { ...c, pages: c.pages.filter((p) => p.type !== 'blog') };
    expect(buildSitemap(noBlog).some((n) => n.id === 'blog')).toBe(false);
  });
  it('incluye las categorías como colecciones', () => {
    const c = base();
    const cat = buildSitemap(c).find((n) => n.id === 'catalog')!;
    expect(cat.children!.filter((x) => x.kind === 'collection')).toHaveLength(c.catalog.categories.length);
  });
});

describe('catálogo', () => {
  const c = base();
  it('filtra por marca y combina atributos con AND', () => {
    const byBrand = applyFilters(DEMO_PRODUCTS, { brand: ['Kinetik'] }, c.catalog);
    expect(byBrand.length).toBeGreaterThan(0);
    expect(byBrand.every((p) => p.brand === 'Kinetik')).toBe(true);
    const both = applyFilters(DEMO_PRODUCTS, { brand: ['Kinetik'], goal: ['Energía'] }, c.catalog);
    expect(both.every((p) => p.brand === 'Kinetik' && p.goals.includes('Energía'))).toBe(true);
    expect(both.length).toBeLessThanOrEqual(byBrand.length);
  });
  it('valores del mismo atributo se combinan con OR', () => {
    const r = applyFilters(DEMO_PRODUCTS, { brand: ['Kinetik', 'Verdal'] }, c.catalog);
    expect(r.length).toBe(DEMO_PRODUCTS.filter((p) => ['Kinetik', 'Verdal'].includes(p.brand)).length);
  });
  it('las facetas cuentan respetando los demás filtros', () => {
    const f = facets(DEMO_PRODUCTS, 'brand', { goal: ['Deporte'] }, c.catalog);
    const sum = f.reduce((s, x) => s + x.count, 0);
    expect(sum).toBe(applyFilters(DEMO_PRODUCTS, { goal: ['Deporte'] }, c.catalog).length);
  });
  it('ordena por precio', () => {
    const asc = sortProducts(DEMO_PRODUCTS, 'priceAsc');
    expect(Math.min(...asc[0].presentations.map((v) => v.price))).toBeLessThanOrEqual(Math.min(...asc[asc.length - 1].presentations.map((v) => v.price)));
  });
  it('los filtros de atributos eliminados dejan de aplicarse', () => {
    const cat = { ...c.catalog, attributes: c.catalog.attributes.filter((a) => a !== 'goal') };
    expect(effectiveFilters(cat)).not.toContain('goal');
  });
  it('atributos personalizados son filtrables', () => {
    const cat = { ...c.catalog, customAttributes: [{ id: 'x', label: 'Dieta', values: ['Vegano', 'Keto'] }] };
    const r = applyFilters(DEMO_PRODUCTS, { 'custom:x': ['Vegano'] }, cat);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThan(DEMO_PRODUCTS.length);
  });
});

describe('alcance y PMO', () => {
  it('marca opciones adicionales y de validación', () => {
    const c = base();
    const q = getQuestion('header.elements')!;
    expect(scopeOf(q, c)).toBe('proposal');
    expect(scopeOf(q, setPath(c, 'header.elements', [...c.header.elements, 'wishlist']))).toBe('additional');
    const menu = getQuestion('header.menuType')!;
    expect(scopeOf(menu, setPath(c, 'header.menuType', 'mega'))).toBe('validation');
  });
  it('el estado de decisión pasa de pendiente a respondida al interactuar', () => {
    const c = base();
    const q = getQuestion('brand.identity')!;
    expect(decisionMeta(q, c).status).toBe('pending');
    expect(decisionMeta(q, { ...c, answered: { 'brand.identity': true } }).status).toBe('proposed');
    expect(decisionMeta(q, { ...c, decisions: { 'brand.identity': { status: 'approved', owner: 'X', notes: '', updatedAt: '' } } }).status).toBe('approved');
  });
  it('genera requerimientos por cada sección del Home y marca tema pendiente', () => {
    const c = base();
    const reqs = requirements(c);
    expect(reqs.filter((r) => r.area === 'Home')).toHaveLength(c.home.sections.length);
    expect(reqs.some((r) => r.themePending)).toBe(true);
    expect(requirements({ ...c, meta: { ...c.meta, themeName: 'Tema X' } }).some((r) => r.themePending)).toBe(false);
  });
  it('detecta riesgos SAP sin definir y de suscripciones', () => {
    const c = base();
    expect(risks(c).some((r) => r.area === 'SAP' && r.level === 'Alta')).toBe(true);
    const sub = setPath(c, 'subscriptions.enabled', true);
    expect(risks(sub).some((r) => r.area === 'Suscripciones')).toBe(true);
  });
  it('resume respuestas legibles', () => {
    const c = { ...base(), home: { sections: [makeSection('hero'), makeSection('faq')] } };
    expect(answerSummary(getQuestion('home.sections')!, c)).toBe('1. Hero banner · 2. Preguntas frecuentes');
  });
});

describe('exportaciones', () => {
  it('el JSON refleja la configuración', () => {
    const c = setPath(base(), 'catalog.filterLayout', 'horizontal');
    expect(JSON.parse(exportJson(c)).config.catalog.filterLayout).toBe('horizontal');
  });
  it('el CSV de pendientes incluye cabecera y filas', () => {
    const csv = exportPendingCsv(base());
    expect(csv.split('\n')[0]).toContain('Pregunta');
    expect(csv.split('\n').length).toBeGreaterThan(10);
  });
  it('la especificación para Claude Code incluye metafields y advierte sobre SAP', () => {
    const spec = exportClaudeSpec(base());
    expect(spec).toContain('custom.objetivos');
    expect(spec).toContain('no implementar lógica de integración SAP');
  });
});
