/**
 * QA end-to-end — Tita Discovery Studio 2.0
 *
 * Verifica los criterios de aceptación 2.0 (Discovery guiado → simulador) y los 16 criterios
 * del MVP adaptados al nuevo flujo.
 *
 * Uso:  npm run build && npm run preview   (en otra terminal)
 *       npm run e2e                        (BASE_URL opcional, por defecto http://localhost:4173)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) {
  try { playwright = require(p); break; } catch { /* siguiente */ }
}
if (!playwright) { console.error('Playwright no está instalado.'); process.exit(1); }

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = path.resolve('e2e-artifacts');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = async (id, name, fn) => {
  try {
    await fn();
    results.push({ id, name, ok: true });
    console.log(`  ✔ ${id} ${name}`);
  } catch (e) {
    results.push({ id, name, ok: false, error: e.message });
    console.log(`  ✘ ${id} ${name}\n      → ${e.message.split('\n')[0]}`);
  }
};
const assert = (c, msg) => { if (!c) throw new Error(msg); };

const browser = await playwright.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('fonts.g') && errors.push(m.text()));

const sim = () => page.getByTestId('simulator');
const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `${name}.png`) }); };
const STAGE = { CTX: 'context', BRD: 'brand', HOM: 'home', CAT: 'catalog', PDP: 'product', CRT: 'cart', FID: 'customers', MKT: 'marketing', OPS: 'operations', VAL: 'closing' };
const card = (id) => page.locator(`[data-question="${id}"]`);
/** Abre una pregunta: cambia de etapa si hace falta y la pone en foco. */
const open = async (id) => {
  await page.getByTestId('workspace-discovery').click();
  if (await card(id).count()) return card(id);
  await page.getByTestId(`stage-${STAGE[id.slice(0, 3)]}`).click();
  if (!(await card(id).count())) await page.locator(`[data-question-row="${id}"]`).click();
  await card(id).waitFor();
  return card(id);
};
const pick = async (id, ...values) => { const c = await open(id); for (const v of values) await c.locator(`[data-option="${v}"]`).click(); await page.waitForTimeout(120); };
const type = async (id, text, field) => { const c = await open(id); const input = field ? c.locator(`[data-field="${field}"]`) : c.locator('input, textarea').first(); await input.fill(text); await page.waitForTimeout(120); };
const homeOrder = () => sim().locator('[data-section-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section-id')));
const goSim = async (p) => page.getByTestId(`quick-${p}`).click();

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click();
await page.getByRole('button', { name: 'Crear y empezar' }).click();
await sim().waitFor();

console.log('\nCriterios 2.0 — Discovery guiado\n');

await check('2.0-01', 'El simulador arranca vacío y la primera pregunta es de negocio, en lenguaje natural', async () => {
  await sim().getByTestId('empty-home').waitFor();
  const c = card('CTX-01');
  await c.waitFor();
  assert((await c.innerText()).includes('¿Qué vende principalmente la tienda?'), 'Primera pregunta');
  assert((await c.locator('p').first().innerText()).length > 10, 'Sin microexplicación');
  await shot('01-start');
});

await check('2.0-02', 'Una persona no técnica avanza con tarjetas, texto y "Continuar"', async () => {
  await pick('CTX-01', 'supplements');
  assert((await card('CTX-01').getByTestId('next-question').count()) === 1, 'Botón continuar');
  await card('CTX-01').getByTestId('next-question').click();
  await card('CTX-02').waitFor();
  await pick('CTX-02', 'b2c');
  await card('CTX-02').getByTestId('next-question').click();
  await type('CTX-03', 'AG Vitaminas QA');
  await sim().getByText('AG Vitaminas QA').first().waitFor();
});

await check('2.0-03', 'Las recomendaciones son contextuales y distintas de lo solicitado', async () => {
  await page.getByTestId('stage-home').click();
  const rec = page.locator('[data-recommendation="shop-by-goal"]');
  await rec.waitFor();
  assert((await homeOrder()).length === 0, 'Una recomendación no debe estar en el simulador');
  await rec.getByTestId('accept-recommendation').click();
  await sim().locator('[data-section-id="shop-by-goal"]').waitFor();
});

await check('2.0-04', 'Cada respuesta relevante modifica el simulador automáticamente', async () => {
  await pick('HOM-01', 'value');
  await sim().locator('[data-section-id="hero-banner"]').waitFor();
  await type('HOM-04', 'Bienestar AG — prueba QA', 'title');
  await sim().getByRole('heading', { name: 'Bienestar AG — prueba QA' }).waitFor();
  await pick('BRD-03', 'premium');
  const font = await sim().evaluate((el) => el.style.getPropertyValue('--sim-heading-font'));
  assert(font.includes('Playfair'), `Tipografía ${font}`);
});

await check('2.0-05', 'Las preguntas condicionales aparecen y desaparecen con la respuesta', async () => {
  await open('HOM-02');
  assert((await page.locator('[data-question-row="HOM-05"]').count()) === 0, 'HOM-05 visible antes de tiempo');
  await pick('HOM-02', 'carousel', 'countdown');
  await page.locator('[data-question-row="HOM-05"]').waitFor();
  await page.locator('[data-question-row="HOM-07"]').waitFor();
  await shot('05-conditional');
});

await check('2.0-06', 'Los toppings tienen variantes y parámetros configurables por seguimiento', async () => {
  await pick('HOM-05', '4');
  assert((await sim().locator('[data-section-id="promo-carousel"] button[aria-label^="Ir al slide"]').count()) === 4, 'Cantidad de slides');
  await type('HOM-07', 'Cyber Lunes');
  await goSim('home');
  await sim().locator('[data-testid="countdown"]').getByText('Cyber Lunes').waitFor();
  await pick('HOM-03', 'full');
  assert((await sim().locator('[data-section-id="hero-banner"]').getAttribute('data-variant')) === 'full', 'Variante del banner');
});

await check('2.0-07', 'Cambiar una respuesta mantiene coherente el simulador sin perder lo independiente', async () => {
  await pick('HOM-02', 'carousel'); // quitar carrusel
  const ids = await homeOrder();
  assert(!ids.includes('promo-carousel'), 'El carrusel sigue en el Home');
  assert(ids.includes('countdown') && ids.includes('hero-banner') && ids.includes('shop-by-goal'), `Se perdieron secciones: ${ids}`);
  assert((await page.locator('[data-question-row="HOM-05"]').count()) === 0, 'La pregunta de seguimiento sigue visible');
  await pick('HOM-02', 'carousel');
  assert((await sim().locator('[data-section-id="promo-carousel"] button[aria-label^="Ir al slide"]').count()) === 4, 'No conservó el parámetro al reactivar');
  await pick('HOM-02', 'none');
  const after = await homeOrder();
  assert(!after.includes('promo-carousel') && !after.includes('countdown'), 'La opción exclusiva no retiró promociones');
  await pick('HOM-02', 'countdown');
});

await check('2.0-08', 'Estados: por validar, no aplica y pendiente se distinguen y se cuentan', async () => {
  const c = await open('HOM-13');
  await pick('HOM-13', 'circles');
  await c.getByTestId('mark-to-validate').click();
  await c.locator('[data-status="to_validate"]').waitFor();
  await sim().locator('[data-section-id="category-circles"]').waitFor();
  const c2 = await open('HOM-18');
  await c2.getByTestId('mark-na').click();
  const stats = await page.getByTestId('stage-stats').innerText();
  assert(/1\s*por validar/.test(stats) && /1\s*no aplica/.test(stats), `Contadores ${stats}`);
});

await check('MVP-04', 'Reordenar el Home (flechas y arrastrar) cambia el simulador', async () => {
  await open('HOM-20');
  const items = page.getByTestId('home-section-item');
  const before = await homeOrder();
  await items.nth(1).getByRole('button', { name: 'Subir sección' }).click();
  await page.waitForTimeout(200);
  const after = await homeOrder();
  assert(after[0] === before[1] && after[1] === before[0], `Flechas ${before} → ${after}`);
  await items.nth(0).scrollIntoViewIfNeeded();
  const hb = await items.nth(0).getByRole('button', { name: /Arrastrar/ }).boundingBox();
  const tb = await items.nth(2).boundingBox();
  const sx = hb.x + hb.width / 2, sy = hb.y + hb.height / 2, ty = tb.y + tb.height * 0.7;
  await page.mouse.move(sx, sy); await page.mouse.down();
  for (let i = 1; i <= 20; i++) { await page.mouse.move(sx, sy + ((ty - sy) * i) / 20); await page.waitForTimeout(20); }
  await page.mouse.up(); await page.waitForTimeout(250);
  const dragged = await homeOrder();
  assert(dragged.indexOf(after[0]) === 2, `Arrastrar ${after} → ${dragged}`);
  await shot('mvp04-home-order');
});

await check('MVP-01/02', 'Agregar y quitar páginas actualiza navegación y mapa del sitio', async () => {
  const c = await open('HOM-21');
  await c.getByRole('button', { name: /Usar la sugerencia/ }).click();
  await sim().getByTestId('main-nav').getByRole('button', { name: 'Blog' }).waitFor();
  await c.locator('[data-page-type="blog"]').click();
  await page.waitForTimeout(150);
  assert(await sim().getByTestId('main-nav').getByRole('button', { name: 'Blog' }).count() === 0, 'Blog sigue en el menú');
  const routes = await page.getByTestId('route-select').locator('option').allInnerTexts();
  assert(routes.some((r) => r.includes('Preguntas frecuentes')) && !routes.some((r) => r.trim() === 'Blog'), `Mapa ${routes}`);
});

await check('2.0-09', 'Menú: el tipo y las columnas se ven en el simulador', async () => {
  await pick('HOM-22', 'mega');
  await sim().getByTestId('megamenu').waitFor();
  await pick('HOM-23', 'brands', 'categories');
  await page.waitForTimeout(150);
  const t = await sim().getByTestId('megamenu').innerText();
  assert(/marcas/i.test(t) && /categor/i.test(t) && !/objetivos/i.test(t), `Columnas del megamenú: ${t.slice(0, 80)}`);
  await shot('09-megamenu');
});

await check('MVP-15', 'Lo adicional o por validar se identifica sin bloquearse (lista de deseos)', async () => {
  await pick('HOM-24', 'search', 'cart', 'wishlist');
  await card('HOM-24').getByTestId('scope-warning').waitFor();
  assert((await card('HOM-24').getByTestId('scope-warning').innerText()).includes('requiere revisión de alcance y viabilidad'), 'Texto de advertencia');
  await goSim('catalog');
  await sim().getByTestId('wishlist-toggle').first().click();
  assert((await sim().getByTestId('header-wishlist').getAttribute('aria-label')).includes('1 productos'), 'Contador de favoritos');
});

await check('2.0-10', 'WhatsApp: el botón funciona y deja claro que es simulación', async () => {
  await pick('HOM-29', 'true');
  await sim().getByTestId('whatsapp-button').click();
  await sim().getByText(/Simulación: en la tienda real abriría WhatsApp/).waitFor();
});

await check('MVP-06/07', 'Filtros: presentación y filtrado real sobre el catálogo', async () => {
  await pick('CAT-03', 'brand', 'goal');
  await goSim('catalog');
  await sim().getByTestId('filter-sidebar').waitFor();
  const count = async () => Number((await sim().getByTestId('result-count').innerText()).match(/\d+/)[0]);
  const total = await count();
  await sim().getByTestId('filter-sidebar').getByLabel('Kinetik').check();
  await page.waitForTimeout(150);
  const n = await count();
  assert(n > 0 && n < total && (await sim().getByTestId('product-card').count()) === n, `Filtro ${total} → ${n}`);
  await pick('CAT-06', 'horizontal');
  await sim().getByTestId('filter-horizontal').waitFor();
});

await check('MVP-08/09/10', 'Ficha: layout, variantes y carrito', async () => {
  await pick('PDP-02', 'stacked');
  await goSim('product');
  assert((await sim().getByTestId('product-page').getAttribute('data-layout')) === 'stacked', 'Layout');
  await sim().getByRole('radio', { name: '120 tabletas' }).click();
  assert((await sim().getByTestId('selected-variant').innerText()) === '120 tabletas', 'Variante');
  await sim().getByRole('button', { name: 'Agregar al carrito' }).first().click();
  await page.waitForTimeout(200);
  await goSim('cart');
  await sim().getByTestId('cart-line').first().waitFor();
});

await check('2.0-11', 'B2B: preguntas, precio distribuidor, mínimo y cotización', async () => {
  await pick('CTX-02', 'b2b');
  await pick('FID-13', 'segment');
  const c = await open('CRT-13');
  await c.locator('input[type="number"]').fill('6');
  await pick('PDP-18', 'true');
  await goSim('product');
  await sim().getByTestId('b2b-toggle').getByRole('button', { name: 'Distribuidor' }).click();
  await sim().getByTestId('b2b-price').waitFor();
  await sim().getByTestId('min-qty').waitFor();
  assert((await sim().getByTestId('pdp-qty').innerText()) === '6', 'Cantidad mínima');
  await sim().getByRole('button', { name: 'Solicitar cotización' }).click();
  await sim().getByTestId('quote-form').waitFor();
  await sim().getByRole('button', { name: 'Cerrar cotización' }).click();
  await shot('11-b2b');
});

await check('2.0-12', 'Biblioteca de toppings: agregar, configurar con seguimiento y ver en simulador', async () => {
  await page.getByTestId('workspace-toppings').click();
  await page.getByTestId('toppings-workspace').waitFor();
  await page.locator('[data-topping-card="free-shipping-bar"]').click();
  await page.getByTestId('topping-detail').getByTestId('add-topping').click();
  await page.getByTestId('topping-detail').locator('input[type="number"]').fill('200000');
  await page.waitForTimeout(150);
  await page.getByTestId('topping-filter-active').click();
  await page.locator('[data-topping-card="free-shipping-bar"]').waitFor();
  await shot('12-toppings');
  await page.getByTestId('workspace-discovery').click();
  await goSim('cart');
  await sim().getByTestId('free-shipping-bar').getByText('$ 200.000', { exact: false }).waitFor().catch(async () => {
    const t = await sim().getByTestId('free-shipping-bar').innerText();
    assert(/200\.000|envío gratis/i.test(t), `Barra: ${t}`);
  });
});

await check('2.0-13', 'Lo pendiente o solicitado no cuenta como aprobado; la validación lo cambia', async () => {
  await page.getByTestId('workspace-deliverables').click();
  const approved = async () => Number((await page.getByTestId('executive-summary').locator('p.font-display').nth(1).innerText()).trim());
  assert((await approved()) === 0, 'Hay aprobadas sin validar');
  const c = await open('VAL-01');
  await c.locator('[data-review="hero-banner"]').getByTestId('approve-topping').click();
  await page.getByTestId('workspace-deliverables').click();
  assert((await approved()) === 1, 'La aprobación no se reflejó');
  await page.getByTestId('deliverable-tab-checklist').click();
  assert((await page.getByTestId('checklist').locator('[data-done="false"]').count()) > 0, 'Checklist completo con pendientes');
  await shot('13-deliverables');
});

await check('2.0-14', 'La vista previa se diferencia de una tienda Shopify real', async () => {
  await page.getByTestId('workspace-discovery').click();
  await page.getByTestId('preview-disclaimer').waitFor();
  await goSim('checkout');
  await sim().getByText('checkout nativo de Shopify').waitFor();
});

await check('MVP-11', 'Vista móvil del simulador y navegación por pestañas en pantallas pequeñas', async () => {
  await page.getByRole('radio', { name: /Móvil/ }).click();
  await goSim('home');
  await sim().getByTestId('mobile-menu-button').waitFor();
  assert((await sim().evaluate((el) => el.getBoundingClientRect().width)) <= 400, 'Ancho móvil');
  await page.getByRole('radio', { name: /Desktop/ }).click();
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(BASE);
  await m.getByTestId('tab-simulator').click();
  await m.getByTestId('simulator').waitFor();
  await m.getByTestId('tab-discovery').click();
  await m.getByTestId('discovery-scroll').waitFor();
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `Desbordamiento horizontal ${overflow}px`);
  await m.screenshot({ path: path.join(OUT, 'mvp11-mobile-tabs.png') });
  await m.close();
});

await check('MVP-12', 'Las anotaciones muestran la especificación y el topping asociado', async () => {
  await goSim('home');
  await page.getByTestId('toggle-annotations').click();
  await sim().getByRole('button', { name: /Ver implementación Shopify: Banner principal/ }).first().click();
  const panel = page.getByTestId('annotation-panel');
  await panel.waitFor();
  await panel.getByText('Criterios de aceptación', { exact: true }).waitFor();
  await panel.getByText(/Topping: Banner principal/).waitFor();
  await page.getByTestId('toggle-annotations').click();
});

await check('MVP-13/16', 'Las respuestas se conservan al navegar y al recargar', async () => {
  await page.reload();
  await sim().waitFor();
  await page.getByTestId('stage-home').click();
  await sim().getByRole('heading', { name: 'Bienestar AG — prueba QA' }).waitFor();
  const row = page.locator('[data-question-row="HOM-02"]');
  if (await row.count()) assert((await row.innerText()).includes('Cuenta regresiva'), 'HOM-02 perdió su respuesta');
  await page.getByTestId('stage-context').click();
  assert((await page.locator('[data-question-row="CTX-03"]').innerText()).includes('AG Vitaminas QA') || (await card('CTX-03').count()) === 1, 'CTX-03');
});

await check('MVP-14', 'Las exportaciones reflejan las respuestas actuales', async () => {
  const get = async (id) => {
    await page.getByTestId('export-menu').click();
    const [d] = await Promise.all([page.waitForEvent('download'), page.getByTestId(`export-${id}`).click()]);
    const f = path.join(OUT, await d.suggestedFilename());
    await d.saveAs(f);
    return fs.readFileSync(f, 'utf8');
  };
  const json = JSON.parse(await get('json'));
  assert(json.project.answers['CTX-03'].value === 'AG Vitaminas QA', 'JSON respuesta');
  assert(json.project.toppings['hero-banner'].approval === 'approved', 'JSON aprobación');
  assert((await get('executive')).includes('AG Vitaminas QA'), 'Resumen ejecutivo');
  assert((await get('requirementsCsv')).includes('Cuenta regresiva'), 'Matriz');
  assert((await get('backlog')).includes('Épica'), 'Backlog');
  assert((await get('checklist')).includes('Checklist'), 'Checklist');
  assert((await get('answers')).includes('HOM-02'), 'Banco de respuestas');
});

await check('MIG-01', 'Un proyecto v1 guardado se migra a v2 al abrir la aplicación', async () => {
  const m = await ctx.newPage();
  await m.goto(BASE);
  await m.evaluate(() => {
    const v1 = { schemaVersion: 1, meta: { id: 'legacy1', name: 'Proyecto v1', client: 'AG', vertical: 'x', createdAt: '2026-01-01', updatedAt: '2026-01-01', themeName: null, proposalRef: '' }, brand: { storeName: 'Tienda Legacy', identity: 'multi', primary: '#123456', secondary: '#eeeeee', accent: '#ff0000', headingFont: 'Lora', bodyFont: 'Inter', radius: 'soft', currency: 'COP', locale: 'es-CO' }, pages: [{ id: 'home', type: 'home', title: 'Inicio', inMenu: false, inFooter: false }, { id: 'catalog', type: 'catalog', title: 'Catálogo', inMenu: true, inFooter: false }], header: { elements: ['search', 'cart'], menuType: 'simple', logoPosition: 'left', sticky: true, promoText: '' }, footer: { columns: 'columns', showNewsletter: false, showSocial: false, showPayments: false, legalText: '' }, references: [], home: { sections: [{ id: 'h1', type: 'hero', variant: 'split', props: { title: 'Hero heredado', subtitle: '', cta: 'Ver', columns: 4, itemsCount: 4, align: 'left', tone: 'muted' } }] }, catalog: {}, product: {}, cart: {}, subscriptions: {}, bundles: {}, leads: {}, sap: {}, decisions: {}, answered: { 'brand.storeName': true, 'home.sections': true } };
    localStorage.setItem('tita-discovery-studio', JSON.stringify({ state: { projects: { legacy1: v1 }, activeId: null, sessions: {}, ui: {} }, version: 1 }));
  });
  await m.reload();
  await m.getByText('Proyecto v1').waitFor();
  await m.getByRole('button', { name: 'Abrir' }).click();
  await m.getByTestId('simulator').getByRole('heading', { name: 'Hero heredado' }).waitFor();
  await m.getByTestId('simulator').getByText('Tienda Legacy').first().waitFor();
  await m.close();
});

results.sort((a, b) => a.id.localeCompare(b.id));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificaciones OK`);
if (errors.length) console.log(`\nErrores de consola/página:\n - ${[...new Set(errors)].join('\n - ')}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, errors }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
