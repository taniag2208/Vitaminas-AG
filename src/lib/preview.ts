import { PREVIEW_TARGETS } from '@/config/previewTargets';
import { DEMO_PRODUCTS } from '@/data/demoCatalog';
import { useSimUi } from '@/store/useSimUi';
import { useStudio } from '@/store/useStudio';

/**
 * Lleva el simulador al lugar donde se ve el efecto de una pregunta:
 * abre la página, fuerza el estado necesario (menú, carrito, filtros, pop-up),
 * cambia de dispositivo si hace falta y resalta el componente.
 */
export function previewQuestion(questionId: string) {
  const t = PREVIEW_TARGETS[questionId];
  const studio = useStudio.getState();
  const sim = useSimUi.getState();
  if (!t) return;
  const cfg = studio.activeId ? studio.projects[studio.activeId] : undefined;
  if (!cfg) return;

  if (t.device && studio.ui.device !== t.device) studio.setUi({ device: t.device });

  let page = t.page;
  if (t.action === 'openCart' && page === 'cart' && cfg.cart.type === 'drawer') page = studio.ui.route.page === 'cart' ? 'home' : studio.ui.route.page;
  if (page === 'brands' && !cfg.pages.some((p) => p.type === 'brands')) page = 'catalog';
  if (page === 'tracking' && !cfg.pages.some((p) => p.type === 'tracking')) page = 'order';
  const r = studio.ui.route;
  const keepParams = page === r.page && (page === 'product' || page === 'catalog');
  if (r.page !== page) studio.navigate(page, t.params);
  else if (!keepParams && t.params) studio.navigate(page, t.params);

  // Carrito/checkout: asegurar que haya algo que mostrar
  if (t.action === 'openCart') {
    const session = studio.sessions[studio.activeId!];
    if (!session?.cart.length) {
      const p = DEMO_PRODUCTS[0];
      studio.addToCart({ productId: p.id, variantId: p.presentations[0].id, qty: 1, purchase: 'once' });
      sim.showToast('Se agregó un producto de ejemplo para mostrar el carrito');
    }
    if (cfg.cart.type === 'drawer' && page !== 'checkout') studio.setCartOpen(true);
    else studio.setCartOpen(false);
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
