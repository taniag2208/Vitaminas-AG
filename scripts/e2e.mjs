/**
 * QA end-to-end de los 16 criterios de aceptación obligatorios del MVP.
 *
 * Uso:  npm run build && npm run preview   (en otra terminal)
 *       npm run e2e                        (BASE_URL opcional, por defecto http://localhost:4173)
 *
 * Requiere Playwright con Chromium disponible (`npm i -D playwright && npx playwright install chromium`
 * o una instalación global).
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
const check = async (n, name, fn) => {
  try {
    await fn();
    results.push({ n, name, ok: true });
    console.log(`  ✔ ${n}. ${name}`);
  } catch (e) {
    results.push({ n, name, ok: false, error: e.message });
    console.log(`  ✘ ${n}. ${name}\n      → ${e.message.split('\n')[0]}`);
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
const phase = (id) => page.getByTestId(`phase-${id}`).click();
const q = (id) => page.locator(`[data-question="${id}"]`);
const shot = async (name) => { await page.waitForTimeout(450); return page.screenshot({ path: path.join(OUT, `${name}.png`) }); };

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click();
await page.getByRole('button', { name: 'Crear y empezar' }).click();
await sim().waitFor();

console.log('\nCriterios de aceptación — Tita Discovery Studio\n');

await check(1, 'Agregar una página en Discovery la incorpora al mapa del sitio', async () => {
  assert((await page.locator('[data-sitemap-node="kits"]').count()) === 0, 'Kits ya existía');
  await page.locator('[data-page-type="kits"]').click();
  await page.locator('[data-sitemap-node="kits"]').waitFor({ timeout: 2000 });
  await page.locator('[data-sitemap-node="kits"]').click();
  await sim().getByText('Agregar kit').first().waitFor({ timeout: 2000 });
});

await check(2, 'Eliminar una página la retira de la navegación', async () => {
  const nav = sim().getByTestId('main-nav');
  assert(await nav.getByRole('button', { name: 'Blog' }).count() === 1, 'Blog no estaba en el menú');
  await page.locator('[data-page-type="blog"]').click();
  await page.waitForTimeout(150);
  assert(await nav.getByRole('button', { name: 'Blog' }).count() === 0, 'Blog sigue en el menú');
  assert(await sim().getByTestId('footer-links').getByRole('button', { name: 'Blog' }).count() === 0, 'Blog sigue en el footer');
  assert(await page.locator('[data-sitemap-node="blog"]').count() === 0, 'Blog sigue en el mapa del sitio');
});

await check(3, 'Seleccionar una sección del Home la incorpora inmediatamente', async () => {
  await phase('home');
  assert(await sim().locator('[data-section-type="testimonials"]').count() === 0, 'Ya había testimonios');
  await page.getByTestId('add-section').click();
  await page.locator('[data-palette-type="testimonials"]').click();
  await sim().locator('[data-section-type="testimonials"]').waitFor({ timeout: 2000 });
  await shot('03-home-builder');
});

const simOrder = () => sim().locator('[data-section-type]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section-type')));

await check(4, 'Reordenar secciones cambia su posición en el simulador', async () => {
  const before = await simOrder();
  // a) Flechas
  const items = page.getByTestId('home-section-item');
  const n = await items.count();
  await items.nth(n - 1).getByRole('button', { name: 'Subir sección' }).click();
  const afterArrow = await simOrder();
  assert(afterArrow[n - 2] === before[n - 1] && afterArrow[n - 1] === before[n - 2], `Flechas: ${before} → ${afterArrow}`);
  // b) Drag & drop (dnd-kit con puntero)
  await items.nth(0).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const handle = items.nth(0).getByRole('button', { name: /Arrastrar/ });
  const target = items.nth(2);
  const hb = await handle.boundingBox();
  const tb = await target.boundingBox();
  const sx = hb.x + hb.width / 2, sy = hb.y + hb.height / 2, ty = tb.y + tb.height * 0.7;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) { await page.mouse.move(sx, sy + ((ty - sy) * i) / 20); await page.waitForTimeout(20); }
  await page.mouse.up();
  await page.waitForTimeout(250);
  const afterDrag = await simOrder();
  assert(afterDrag[0] !== afterArrow[0] && afterDrag.indexOf(afterArrow[0]) === 2, `Drag: ${afterArrow} → ${afterDrag}`);
});

await check(5, 'Modificar un título actualiza el contenido visible', async () => {
  const heroItem = page.locator('[data-testid="home-section-item"][data-section-type="hero"]');
  await heroItem.getByRole('button', { name: 'Editar sección' }).click();
  const input = page.locator('[data-testid^="section-title-hero"]');
  await input.fill('Bienestar diario AG — prueba QA');
  await sim().getByRole('heading', { name: 'Bienestar diario AG — prueba QA' }).waitFor({ timeout: 2000 });
});

await check(6, 'Cambiar el diseño de filtros modifica su presentación', async () => {
  await phase('catalog');
  await sim().getByTestId('collection-page').waitFor();
  assert(await sim().getByTestId('filter-sidebar').count() === 1, 'No inicia con barra lateral');
  await q('catalog.filterLayout').locator('[data-option="horizontal"]').click();
  await sim().getByTestId('filter-horizontal').waitFor({ timeout: 2000 });
  assert(await sim().getByTestId('filter-sidebar').count() === 0, 'La barra lateral sigue visible');
  await shot('06-filters-horizontal');
  await q('catalog.filterLayout').locator('[data-option="sidebar"]').click();
  await sim().getByTestId('filter-sidebar').waitFor();
});

await check(7, 'Aplicar filtros cambia los productos mostrados', async () => {
  const count = async () => Number((await sim().getByTestId('result-count').innerText()).match(/\d+/)[0]);
  const total = await count();
  await sim().getByTestId('filter-sidebar').getByLabel('Kinetik').check();
  await page.waitForTimeout(150);
  const filtered = await count();
  const cards = await sim().getByTestId('product-card').count();
  assert(filtered < total && filtered > 0, `Contador ${total} → ${filtered}`);
  assert(cards === filtered, `Tarjetas visibles ${cards} ≠ contador ${filtered}`);
  const brands = await sim().getByTestId('product-card').locator('span.uppercase').allInnerTexts();
  assert(brands.every((b) => /kinetik/i.test(b)), `Marcas: ${brands}`);
  await sim().getByTestId('filter-sidebar').getByLabel('Deporte').check();
  await page.waitForTimeout(150);
  assert((await count()) <= filtered, 'El segundo filtro no restringe');
  await shot('07-filters-applied');
  await sim().getByRole('button', { name: 'Limpiar todo' }).click();
  assert((await count()) === total, 'Limpiar no restablece');
});

await check(8, 'Cambiar el layout de ficha de producto modifica su estructura', async () => {
  await phase('product');
  const pdp = sim().getByTestId('product-page');
  await pdp.waitFor();
  assert((await pdp.getAttribute('data-layout')) === 'split', 'Layout inicial');
  await q('product.layout').locator('[data-option="stacked"]').click();
  assert((await pdp.getAttribute('data-layout')) === 'stacked', 'No cambió a apilado');
  await q('product.gallery').locator('[data-option="grid"]').click();
  await sim().getByTestId('gallery-grid').waitFor({ timeout: 2000 });
  await q('product.infoDisplay').locator('[data-option="tabs"]').click();
  assert((await sim().getByTestId('pdp-info').getAttribute('data-info-display')) === 'tabs', 'Info no cambió a pestañas');
  await sim().getByRole('tab', { name: 'Modo de uso' }).click();
  await sim().getByText('Modo de uso según la etiqueta').waitFor();
  await shot('08-pdp-stacked');
  await q('product.layout').locator('[data-option="split"]').click();
  await q('product.gallery').locator('[data-option="thumbnails"]').click();
});

await check(9, 'Seleccionar variantes modifica la selección activa', async () => {
  const sel = sim().getByTestId('selected-variant');
  const before = await sel.innerText();
  await sim().getByRole('radio', { name: '120 tabletas' }).click();
  const after = await sel.innerText();
  assert(before !== after && after === '120 tabletas', `${before} → ${after}`);
  assert((await sim().getByRole('radio', { name: '120 tabletas' }).getAttribute('aria-checked')) === 'true', 'aria-checked');
});

await check(10, 'Agregar al carrito actualiza el carrito simulado', async () => {
  await sim().getByRole('button', { name: 'Aumentar cantidad' }).click();
  await sim().getByRole('button', { name: 'Agregar al carrito' }).first().click();
  await sim().getByTestId('cart-drawer').waitFor({ timeout: 2000 });
  assert((await sim().getByTestId('cart-count').innerText()) === '2', 'Contador del carrito');
  assert((await sim().getByTestId('cart-line').count()) === 1, 'Líneas del carrito');
  const sub1 = await sim().getByTestId('cart-subtotal').innerText();
  await sim().getByTestId('cart-drawer').getByRole('button', { name: 'Aumentar' }).first().click();
  const sub2 = await sim().getByTestId('cart-subtotal').innerText();
  assert(sub1 !== sub2, 'Subtotal no recalcula');
  await shot('10-cart-drawer');
  // Flujo de compra demostrativo
  await sim().getByRole('button', { name: 'Ir a pagar' }).click();
  await sim().getByText('checkout nativo de Shopify').waitFor();
  await sim().getByRole('button', { name: /Simular pedido/ }).click();
  await sim().getByTestId('order-number').waitFor();
  assert((await sim().getByTestId('header-cart').innerText()).trim() === '', 'El carrito no se vació tras el pedido');
});

await check(11, 'Cambiar a vista móvil adapta correctamente la interfaz', async () => {
  await page.getByRole('radio', { name: /Móvil/ }).click();
  await sim().getByTestId('mobile-menu-button').waitFor();
  assert((await sim().getAttribute('data-device')) === 'mobile', 'data-device');
  assert(await sim().getByTestId('main-nav').count() === 0, 'El menú desktop sigue visible');
  const w = await sim().evaluate((el) => el.getBoundingClientRect().width);
  assert(w <= 400, `Ancho del simulador ${w}`);
  await sim().getByTestId('mobile-menu-button').click();
  await sim().getByTestId('mobile-menu').waitFor();
  await sim().getByTestId('mobile-menu').getByRole('button', { name: 'Catálogo' }).click();
  await sim().getByTestId('mobile-menu').getByRole('button', { name: 'Ver todo' }).click();
  await sim().getByRole('button', { name: /Filtrar/ }).click();
  await sim().getByTestId('filter-drawer').waitFor();
  const scrollW = await sim().evaluate((el) => el.querySelector('.overflow-y-auto').scrollWidth);
  assert(scrollW <= 392, `Desbordamiento horizontal ${scrollW}px`);
  await shot('11-mobile-filters');
  await sim().getByRole('button', { name: 'Cerrar filtros' }).click();
  await page.getByRole('radio', { name: /Desktop/ }).click();
});

await check(12, 'Activar anotaciones muestra las especificaciones de implementación', async () => {
  await page.getByTestId('toggle-annotations').click();
  const badges = sim().getByRole('button', { name: /Ver implementación Shopify/ });
  await badges.first().waitFor();
  assert((await badges.count()) >= 3, 'Pocas anotaciones');
  await sim().getByRole('button', { name: /Ver implementación Shopify: Filtros/ }).first().click();
  const panel = page.getByTestId('annotation-panel');
  await panel.waitFor();
  for (const t of ['Funcionalidad esperada', 'Implementación sugerida', 'Dependencias', 'Riesgos', 'Criterios de aceptación']) await panel.getByText(t, { exact: true }).waitFor();
  assert(await panel.getByText('Dependiente del tema · pendiente').count() > 0, 'No marca la compatibilidad de tema como pendiente');
  await shot('12-annotations');
  await page.getByTestId('toggle-annotations').click();
});

await check(15, 'Las funcionalidades pendientes de validación se identifican correctamente', async () => {
  await phase('identity');
  await q('header.elements').getByRole('button', { name: /Lista de deseos/ }).click();
  await q('header.elements').getByTestId('scope-warning').waitFor();
  assert((await q('header.elements').getByTestId('scope-warning').innerText()).includes('requiere revisión de alcance y viabilidad'), 'Texto de advertencia');
  await phase('growth');
  await q('subscriptions.enabled').getByRole('switch').click();
  await q('subscriptions.enabled').getByTestId('scope-warning').waitFor();
  await page.getByTestId('workspace-pmo').click();
  await page.getByTestId('pmo-tab-scope').click();
  const additional = page.locator('[data-scope="additional"]');
  await additional.getByText('Encabezado y navegación').waitFor();
  await page.locator('[data-scope="validation"]').getByText('Suscripciones').waitFor();
  await shot('15-pmo-scope');
  await page.getByTestId('workspace-studio').click();
});

await check(16, 'El cliente puede volver a cualquier fase sin perder sus respuestas', async () => {
  await phase('product');
  assert((await q('product.infoDisplay').locator('[data-option="tabs"]').getAttribute('aria-checked')) === 'true', 'Fase 4 perdió respuesta');
  await phase('home');
  assert((await page.getByTestId('home-section-item').count()) >= 8, 'Fase 2 perdió secciones');
  await phase('identity');
  assert((await q('header.elements').getByRole('button', { name: /Lista de deseos/ }).getAttribute('aria-pressed')) === 'true', 'Fase 1 perdió respuesta');
  await q('brand.storeName').getByTestId('approve').click();
  await q('brand.storeName').getByText('Aprobada').waitFor();
});

await check(13, 'Las decisiones se conservan al recargar la aplicación', async () => {
  const orderBefore = await simOrder().catch(() => []);
  await page.reload();
  await sim().waitFor();
  await q('brand.storeName').getByText('Aprobada').waitFor({ timeout: 3000 });
  await phase('home');
  await sim().getByRole('heading', { name: 'Bienestar diario AG — prueba QA' }).waitFor({ timeout: 3000 });
  const orderAfter = await simOrder();
  assert(orderBefore.length === 0 || JSON.stringify(orderBefore) === JSON.stringify(orderAfter), 'Orden de secciones distinto tras recargar');
  await phase('product');
  assert((await q('product.infoDisplay').locator('[data-option="tabs"]').getAttribute('aria-checked')) === 'true', 'Respuesta perdida tras recargar');
});

await check(14, 'La exportación JSON refleja las decisiones actuales', async () => {
  await page.getByTestId('export-menu').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-json').click()]);
  const file = path.join(OUT, 'export.json');
  await dl.saveAs(file);
  const { config } = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert(config.home.sections.find((s) => s.type === 'hero').props.title === 'Bienestar diario AG — prueba QA', 'Título del hero');
  assert(config.pages.some((p) => p.type === 'kits') && !config.pages.some((p) => p.type === 'blog'), 'Páginas');
  assert(config.home.sections.some((s) => s.type === 'testimonials'), 'Sección agregada');
  assert(config.catalog.filterLayout === 'sidebar' && config.product.infoDisplay === 'tabs', 'Catálogo/ficha');
  assert(config.header.elements.includes('wishlist') && config.subscriptions.enabled === true, 'Encabezado/suscripciones');
  assert(config.decisions['brand.storeName'].status === 'approved', 'Estado de aprobación');
  // Otras exportaciones generan contenido
  for (const id of ['summary', 'sitemap', 'pending', 'acceptance', 'claude']) {
    await page.getByTestId('export-menu').click();
    const [d] = await Promise.all([page.waitForEvent('download'), page.getByTestId(`export-${id}`).click()]);
    const f = path.join(OUT, await d.suggestedFilename());
    await d.saveAs(f);
    assert(fs.statSync(f).size > 200, `Exportación ${id} vacía`);
  }
});

await page.getByTestId('workspace-pmo').click();
await shot('pmo-summary');
await page.getByTestId('pmo-tab-requirements').click();
await shot('pmo-requirements');

results.sort((a, b) => a.n - b.n);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} criterios OK`);
if (errors.length) console.log(`\nErrores de consola/página:\n - ${errors.join('\n - ')}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, errors }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
