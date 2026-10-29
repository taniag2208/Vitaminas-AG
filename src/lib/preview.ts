import { DEMO_PRODUCTS } from '@/data/demoCatalog';
import { analyze } from '@/engine/derive';
import { useSimUi } from '@/store/useSimUi';
import { useStudio } from '@/store/useStudio';
import type { DQuestion, PreviewSpec } from '@/types/discovery';

/**
 * Lleva el simulador al lugar donde se ve el efecto de una pregunta:
 * abre la página, fuerza el estado necesario (menú, carrito, filtros, pop-up),
 * cambia de dispositivo si hace falta y resalta el componente.
 */
export function showPreview(t: PreviewSpec | undefined) {
  const studio = useStudio.getState();
  const sim = useSimUi.getState();
  const p = studio.activeId ? studio.projects[studio.activeId] : undefined;
  if (!t || !p) return;
  const cfg = analyze(p).config;

  if (t.device && studio.ui.device !== t.device) studio.setUi({ device: t.device });

  let page = t.page;
  if (t.action === 'openCart' && page === 'cart' && cfg.cart.type === 'drawer') page = studio.ui.route.page === 'cart' ? 'home' : studio.ui.route.page;
  if (page === 'tracking' && !cfg.pages.some((x) => x.type === 'tracking')) page = 'order';
  if (page === 'kits' && !cfg.bundles.enabled && !cfg.pages.some((x) => x.type === 'kits')) page = 'home';
  const r = studio.ui.route;
  if (r.page !== page) studio.navigate(page, t.params);

  if (t.action === 'openCart') {
    const session = studio.sessions[studio.activeId!];
    if (!session?.cart.length) {
      const prod = DEMO_PRODUCTS[0];
      studio.addToCart({ productId: prod.id, variantId: prod.presentations[0].id, qty: 1, purchase: 'once' });
      sim.showToast('Se agregó un producto de ejemplo para mostrar el carrito');
    }
    studio.setCartOpen(cfg.cart.type === 'drawer' && page !== 'checkout');
  } else if (studio.sessions[studio.activeId!]?.cartOpen) {
    studio.setCartOpen(false);
  }

  if (t.action === 'showPopup' && studio.sessions[studio.activeId!]?.popupDismissed) {
    useStudio.setState((s) => ({ sessions: { ...s.sessions, [s.activeId!]: { ...s.sessions[s.activeId!], popupDismissed: false } } }));
  }

  sim.setForced(t.action === 'openMenu' || t.action === 'openFilters' ? t.action : null);
  sim.setMobileMenu(false);
  if (t.target) sim.setFocus(t.target);
}

export const previewQuestion = (q: DQuestion) => showPreview(q.preview);

/**
 * Registra una respuesta y muestra su efecto: si aparece una sección nueva en el Home,
 * el simulador navega hasta ella; si no, va al componente de la pregunta.
 */
export function answerWithPreview(q: DQuestion, value: unknown) {
  const studio = useStudio.getState();
  const before = studio.activeId ? analyze(studio.projects[studio.activeId]).config.home.sections.map((s) => s.id) : [];
  studio.answer(q.id, value);
  const after = useStudio.getState();
  const sections = after.activeId ? analyze(after.projects[after.activeId]).config.home.sections : [];
  const added = sections.find((s) => !before.includes(s.id));
  if (added) {
    if (after.ui.route.page !== 'home') after.navigate('home');
    useSimUi.getState().setHighlight(added.id);
    setTimeout(() => useSimUi.getState().setHighlight(null), 1400);
    return;
  }
  showPreview(q.preview);
}
