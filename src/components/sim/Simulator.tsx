import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useStudio, type Device } from '@/store/useStudio';
import { useSimUi } from '@/store/useSimUi';
import type { ProjectConfig } from '@/types/project';
import { LeadPopup, QuickView, SimFooter, SimHeader, SimToast, WhatsAppButton } from './Chrome';
import { CartDrawer, CartPage, CheckoutPage, OrderPage } from './pages/CartPages';
import { CollectionPage } from './pages/CollectionPage';
import { AboutPage, AccountPage, BlogPage, BrandsPage, ContactPage, CustomPage, FaqPage, KitsPage, MissingPage, PoliciesPage, TrackingPage } from './pages/ContentPages';
import { ProductPage } from './pages/ProductPage';
import { SectionRenderer } from './sections/HomeSections';
import { makeMoney, SimProvider } from './SimContext';
import { Container } from './Common';

const luminance = (hex: string) => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return 0;
  const [r, g, b] = m.map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const onColor = (hex: string) => (luminance(hex) > 0.45 ? '#111827' : '#ffffff');

const RADIUS = { none: ['0px', '0px'], soft: ['10px', '16px'], round: ['999px', '24px'] } as const;

export function simVars(cfg: ProjectConfig): CSSProperties {
  const [r, rl] = RADIUS[cfg.brand.radius];
  return {
    ['--sim-primary' as string]: cfg.brand.primary,
    ['--sim-secondary' as string]: cfg.brand.secondary,
    ['--sim-accent' as string]: cfg.brand.accent,
    ['--sim-on-primary' as string]: onColor(cfg.brand.primary),
    ['--sim-on-accent' as string]: onColor(cfg.brand.accent),
    ['--sim-heading-font' as string]: `'${cfg.brand.headingFont}', ui-sans-serif, system-ui, sans-serif`,
    ['--sim-body-font' as string]: `'${cfg.brand.bodyFont}', ui-sans-serif, system-ui, sans-serif`,
    ['--sim-radius' as string]: r,
    ['--sim-radius-lg' as string]: rl,
  };
}

function Router({ cfg, highlight }: { cfg: ProjectConfig; highlight: string | null }) {
  const route = useStudio((s) => s.ui.route);
  const page = cfg.pages.find((p) => p.id === route.page);
  switch (route.page) {
    case 'product': return <ProductPage />;
    case 'cart': return <CartPage />;
    case 'checkout': return <CheckoutPage />;
    case 'order': return <OrderPage />;
    case 'account': return <AccountPage title={page?.title ?? 'Mi cuenta'} />;
    case 'kits': if (!page && !cfg.bundles.enabled) return <MissingPage id="kits" />; return <KitsPage title={page?.title ?? 'Kits'} />;
  }
  if (!page) return <MissingPage id={route.page} />;
  switch (page.type) {
    case 'home':
      return (
        <div data-testid="home-page">
          {cfg.home.sections.length === 0 && <EmptyHome />}
          {cfg.home.sections.map((s, i) => <SectionRenderer key={s.id} section={s} index={i} highlight={highlight === s.id} />)}
        </div>
      );
    case 'catalog': return <CollectionPage />;
    case 'brands': return <BrandsPage title={page.title} />;
    case 'about': return <AboutPage title={page.title} />;
    case 'contact': return <ContactPage title={page.title} />;
    case 'blog': return <BlogPage title={page.title} />;
    case 'faq': return <FaqPage title={page.title} />;
    case 'policies': return <PoliciesPage title={page.title} />;
    case 'tracking': return <TrackingPage title={page.title} />;
    case 'account': return <AccountPage title={page.title} />;
    case 'kits': return <KitsPage title={page.title} />;
    case 'custom': return <CustomPage title={page.title} body={page.body} />;
  }
}

/** Home aún sin decisiones: esqueleto que invita a responder (representación acumulativa). */
function EmptyHome() {
  return (
    <Container className="py-10" >
      <div className="flex flex-col gap-4" data-testid="empty-home">
        <div className="rounded-sim-lg border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="font-sim-heading text-2xl font-extrabold text-slate-800">Tu Home se construye con tus respuestas</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Responde la etapa "Home y navegación": cada decisión agrega aquí su sección (banner, categorías, productos, confianza…).</p>
        </div>
        {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-sim-lg bg-slate-100" style={{ animationDelay: `${i * 150}ms` }} />)}
      </div>
    </Container>
  );
}

/** Dispositivo simulado: renderiza la tienda completa a partir de la configuración. */
export function Simulator({ cfg, device }: { cfg: ProjectConfig; device: Device }) {
  const highlight = useSimUi((s) => s.highlight);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const navigate = useStudio((s) => s.navigate);
  const route = useStudio((s) => s.ui.route);
  const routeKey = `${route.page}|${JSON.stringify(route.params ?? {})}`;
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [routeKey]);
  const focus = useSimUi((s) => s.focus);
  const rootRef = useRef<HTMLDivElement>(null);

  /** Desplaza el lienzo hasta un elemento (considera la escala del lienzo desktop). */
  const scrollToEl = (el: HTMLElement, center = false) => {
    const sc = scrollRef.current;
    if (!sc || !sc.contains(el)) return;
    const box = sc.getBoundingClientRect();
    const scale = box.height / sc.clientHeight || 1;
    const r = el.getBoundingClientRect();
    const offset = (r.top - box.top) / scale;
    const h = r.height / scale;
    const top = center && h < sc.clientHeight ? offset - (sc.clientHeight - h) / 2 : offset - 70;
    sc.scrollTo({ top: Math.max(0, sc.scrollTop + top), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-section-id="${highlight}"]`);
      if (el) scrollToEl(el);
    }, 60);
    return () => clearTimeout(t);
  }, [highlight, routeKey]);

  // Enfoque de una decisión: ir al componente y resaltarlo
  useEffect(() => {
    if (!focus) return;
    let off: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(() => {
      const els = [...(rootRef.current?.querySelectorAll<HTMLElement>(`[data-focus="${focus.target}"]`) ?? [])];
      if (!els.length) return;
      if (focus.target === 'header' || focus.target === 'announcement') scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      else scrollToEl(els[0], true);
      els.forEach((el) => {
        el.classList.remove('sim-spotlight');
        void el.offsetWidth;
        el.classList.add('sim-spotlight');
      });
      off = setTimeout(() => els.forEach((el) => el.classList.remove('sim-spotlight')), 1900);
    }, 140);
    return () => {
      clearTimeout(t);
      clearTimeout(off);
    };
  }, [focus, routeKey, device]);

  const value = useMemo(() => ({ cfg, device, scrollRef, overlayEl, money: makeMoney(cfg), go: navigate }), [cfg, device, overlayEl, navigate]);

  return (
    <SimProvider value={value}>
      <div ref={rootRef} className="sim-root @container relative h-full w-full overflow-hidden bg-white font-sim-body text-slate-900" style={simVars(cfg)} data-device={device} data-testid="simulator" onPointerDownCapture={() => useSimUi.getState().forced && useSimUi.getState().setForced(null)}>
        <div ref={scrollRef} className="thin-scroll absolute inset-0 overflow-y-auto overflow-x-hidden">
          <div className="flex min-h-full flex-col">
            <SimHeader />
            <main className="flex-1" data-route={route.page}>
              <Router cfg={cfg} highlight={highlight} />
            </main>
            <SimFooter />
          </div>
        </div>
        <div ref={setOverlayEl} className="pointer-events-none absolute inset-0 z-40 [&>*]:pointer-events-auto" />
        <CartDrawer />
        <LeadPopup />
        <WhatsAppButton />
        <QuickView />
        <SimToast />
        <div className="pointer-events-none absolute bottom-2 right-2 z-[45] rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-medium text-white">Simulación · datos de demostración</div>
      </div>
    </SimProvider>
  );
}
