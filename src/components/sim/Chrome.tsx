import { useEffect, useState } from 'react';
import { ChevronDown, Heart, Menu, MessageCircle, Phone, Search, ShoppingBag, User, X } from 'lucide-react';
import { DEMO_BRANDS, DEMO_GOALS, DEMO_PRODUCTS, getProduct } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useSession, useStudio } from '@/store/useStudio';
import { useSimUi } from '@/store/useSimUi';
import { BannerArt, ProductArt } from './Art';
import { Container, SimButton } from './Common';
import { computeCart } from './pages/CartPages';
import { Annotated, SimPortal, useSim } from './SimContext';
import { NewsletterForm } from './sections/HomeSections';

function Logo() {
  const { cfg, go } = useSim();
  return (
    <button type="button" onClick={() => go('home')} className="flex shrink-0 items-center gap-2" aria-label={`${cfg.brand.storeName} — inicio`}>
      {cfg.brand.logoImage ? (
        <img src={cfg.brand.logoImage} alt={cfg.brand.storeName} className="h-9 max-w-[160px] object-contain" />
      ) : (
        <>
          <span className="grid h-9 w-9 place-items-center rounded-sim bg-brand font-sim-heading text-base font-extrabold text-on-brand">{cfg.brand.storeName.slice(0, 1).toUpperCase()}</span>
          <span className="font-sim-heading text-lg font-extrabold tracking-tight">{cfg.brand.storeName}</span>
        </>
      )}
    </button>
  );
}

export function SimHeader() {
  const { cfg, go, device } = useSim();
  const route = useStudio((s) => s.ui.route);
  const session = useSession();
  const setCartOpen = useStudio((s) => s.setCartOpen);
  const setB2bMode = useStudio((s) => s.setB2bMode);
  const { setMobileMenu, mobileMenu, forced } = useSimUi();
  const [hoverOpen, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const h = cfg.header;
  const el = h.elements;
  const count = computeCart(cfg, session).count;
  const menuPages = cfg.pages.filter((p) => p.inMenu);
  const isMobile = device === 'mobile';
  const catalogPage = menuPages.find((p) => p.type === 'catalog');
  const open = hoverOpen ?? (forced === 'openMenu' && !isMobile && catalogPage ? catalogPage.id : null);
  useEffect(() => {
    setOpen(null);
  }, [route]);

  const openCart = () => (cfg.cart.type === 'drawer' ? setCartOpen(true) : go('cart'));
  const icons = (
    <div className="flex items-center gap-1">
      {el.includes('search') && <button type="button" aria-label="Buscar" onClick={() => setSearch(!search)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"><Search size={20} /></button>}
      {el.includes('account') && !isMobile && <button type="button" aria-label="Mi cuenta" onClick={() => go('account')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"><User size={20} /></button>}
      {el.includes('wishlist') && !isMobile && (
        <button type="button" aria-label={`Lista de deseos, ${session.wishlist?.length ?? 0} productos`} onClick={() => go('account', { tab: 'wishlist' })} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" data-testid="header-wishlist">
          <Heart size={20} />
          {(session.wishlist?.length ?? 0) > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{session.wishlist!.length}</span>}
        </button>
      )}
      {el.includes('cart') && (
        <button type="button" aria-label={`Carrito, ${count} productos`} onClick={openCart} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" data-testid="header-cart">
          <ShoppingBag size={20} />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent" data-testid="cart-count">{count}</span>}
        </button>
      )}
    </div>
  );

  const megaCols = (cfg.features?.['mega-menu']?.params.columns as string[] | undefined) ?? ['categories', 'goals', 'brands', 'promo'];
  const catalogMenu = (label: string, pageId: string) => {
    if (h.menuType === 'simple') return <NavLink key={pageId} label={label} active={route.page === pageId} onClick={() => go(pageId)} />;
    return (
      <div key={pageId} className={h.menuType === 'dropdown' ? 'relative' : 'static'} onMouseEnter={() => setOpen(pageId)} onMouseLeave={() => setOpen(null)}>
        <button type="button" aria-expanded={open === pageId} onClick={() => setOpen(open === pageId ? null : pageId)} onFocus={() => setOpen(pageId)} className={cn('inline-flex h-16 items-center gap-1 border-b-2 px-3 text-sm font-semibold transition', route.page === pageId ? 'border-brand text-brand' : 'border-transparent hover:text-brand')}>
          {label} <ChevronDown size={14} />
        </button>
        {open === pageId && h.menuType === 'dropdown' && (
          <div className="animate-fade-in absolute left-0 top-full z-30 w-56 rounded-b-sim-lg border border-slate-200 bg-white py-2 shadow-xl" data-testid="menu-dropdown">
            <button type="button" onClick={() => go('catalog')} className="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-slate-50">Ver todo</button>
            {cfg.catalog.categories.map((c) => <button key={c} type="button" onClick={() => go('catalog', { category: c })} className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 hover:text-brand">{c}</button>)}
          </div>
        )}
        {open === pageId && h.menuType === 'mega' && (
          <Annotated id="megamenu" className="animate-fade-in absolute inset-x-0 top-full z-30 border-t border-slate-100 bg-white shadow-2xl">
            <Container className="grid grid-cols-4 gap-8 py-8" >
              <div data-testid="megamenu" className="contents">
                {megaCols.includes('categories') && <MegaCol title="Categorías" items={cfg.catalog.categories} onPick={(v) => go('catalog', { category: v })} />}
                {megaCols.includes('goals') && <MegaCol title="Objetivos" items={DEMO_GOALS.slice(0, 7)} onPick={(v) => go('catalog', { goal: v })} />}
                {megaCols.includes('brands') && cfg.brand.identity === 'multi' && <MegaCol title="Marcas" items={DEMO_BRANDS} onPick={(v) => go('catalog', { brand: v })} />}
                {megaCols.includes('promo') && <button type="button" onClick={() => go(cfg.bundles.enabled ? 'kits' : 'catalog')} className="group col-start-4 overflow-hidden rounded-sim-lg bg-brand-soft text-left">
                  <div className="aspect-[16/9] overflow-hidden"><BannerArt seed={50} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full transition group-hover:scale-105" label={false} /></div>
                  <p className="px-4 pt-3 font-sim-heading text-sm font-bold">{cfg.bundles.enabled ? 'Kits para tu rutina' : 'Novedades de la temporada'}</p>
                  <p className="px-4 pb-4 text-xs text-slate-600">Bloque promocional del megamenú</p>
                </button>}
              </div>
            </Container>
          </Annotated>
        )}
      </div>
    );
  };

  return (
    <>
      {cfg.features?.['b2b-price-lists'] && (
        <div className="flex items-center justify-center gap-2 bg-slate-900 py-1.5 text-[11px] text-white" data-testid="b2b-toggle">
          Ver precios como:
          {([false, true] as const).map((on) => <button key={String(on)} type="button" aria-pressed={!!session.b2bMode === on} onClick={() => setB2bMode(on)} className={cn('rounded-full px-2.5 py-0.5 font-semibold', !!session.b2bMode === on ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white')}>{on ? 'Distribuidor' : 'Cliente final'}</button>)}
          <span className="text-white/50">(demostración)</span>
        </div>
      )}
      {el.includes('utilityBar') && <div className="bg-slate-900 py-1.5 text-[11px] text-slate-300"><Container className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><Phone size={12} /> Línea de atención (por definir)</span><span>{menuPages.length} páginas en menú</span></Container></div>}
      {el.includes('promoBar') && <Annotated id="announcement"><AnnouncementText text={h.promoText} rotate={cfg.features?.['announcement-bar']?.params.rotate === true} incentive={cfg.leads.incentive} /></Annotated>}
      <Annotated id="header" as="header" className={cn('z-20 border-b border-slate-200 bg-white/95 backdrop-blur', h.sticky && 'sticky top-0')}>
        <div className="relative">
          <Container className={cn('flex h-16 items-center gap-4', h.logoPosition === 'center' && !isMobile && 'grid grid-cols-[1fr_auto_1fr]')}>
            {isMobile && <button type="button" aria-label="Abrir menú" onClick={() => setMobileMenu(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" data-testid="mobile-menu-button"><Menu size={22} /></button>}
            {h.logoPosition === 'center' && !isMobile ? (
              <>
                <nav aria-label="Principal" className="flex items-center" data-testid="main-nav">{menuPages.map((p) => (p.type === 'catalog' ? catalogMenu(p.title, p.id) : <NavLink key={p.id} label={p.title} active={route.page === p.id} onClick={() => go(p.id)} />))}</nav>
                <Logo />
                <div className="flex justify-end">{icons}</div>
              </>
            ) : (
              <>
                <div className={cn(isMobile && h.logoPosition === 'center' && 'flex flex-1 justify-center')}><Logo /></div>
                {!isMobile && <nav aria-label="Principal" className="ml-4 flex flex-1 items-center" data-testid="main-nav">{menuPages.map((p) => (p.type === 'catalog' ? catalogMenu(p.title, p.id) : <NavLink key={p.id} label={p.title} active={route.page === p.id} onClick={() => go(p.id)} />))}</nav>}
                <div className={cn(isMobile && h.logoPosition !== 'center' && 'ml-auto')}>{icons}</div>
              </>
            )}
          </Container>
          {search && (
            <div className="animate-fade-in border-t border-slate-100 bg-white">
              <Container className="py-3">
                <form onSubmit={(e) => { e.preventDefault(); setSearch(false); go('catalog', q ? { q } : undefined); }} className="flex gap-2">
                  <input autoFocus aria-label="Buscar productos" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por producto, marca o ingrediente" className="h-11 flex-1 rounded-sim border border-slate-300 px-4 text-sm" />
                  <SimButton type="submit">Buscar</SimButton>
                </form>
                {cfg.features?.['predictive-search'] && q.trim().length >= 2 && (
                  <ul className="mt-2 divide-y divide-slate-100 rounded-sim-lg border border-slate-200 bg-white" data-testid="search-suggestions">
                    {DEMO_PRODUCTS.filter((x) => `${x.name} ${x.brand} ${x.ingredients.join(' ')}`.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map((x) => (
                      <li key={x.id}><button type="button" onClick={() => { setSearch(false); setQ(''); go('product', { id: x.id }); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="h-9 w-9 overflow-hidden rounded bg-slate-50"><ProductArt product={x} className="h-full w-full" /></span><span className="flex-1"><b className="block">{x.name}</b><span className="text-xs text-slate-500">{x.brand}</span></span></button></li>
                    ))}
                    {!DEMO_PRODUCTS.some((x) => `${x.name} ${x.brand} ${x.ingredients.join(' ')}`.toLowerCase().includes(q.toLowerCase())) && <li className="px-3 py-2 text-sm text-slate-500">Sin coincidencias</li>}
                  </ul>
                )}
              </Container>
            </div>
          )}
        </div>
      </Annotated>
      {(mobileMenu || (forced === 'openMenu' && isMobile)) && <MobileMenu />}
    </>
  );
}

const NavLink = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={cn('inline-flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition', active ? 'border-brand text-brand' : 'border-transparent hover:text-brand')}>{label}</button>
);

function AnnouncementText({ text, rotate, incentive }: { text: string; rotate: boolean; incentive: string }) {
  const msgs = rotate ? [text, incentive || 'Paga seguro en el checkout de Shopify', 'Asesoría por chat · texto de ejemplo'] : [text];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (msgs.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % msgs.length), 3500);
    return () => clearInterval(t);
  }, [msgs.length]);
  return <div className="bg-brand px-4 py-2 text-center text-xs font-medium text-on-brand" data-testid="announcement-bar">{msgs[i % msgs.length]}</div>;
}

/** Botón flotante de WhatsApp: abre un panel que explica lo que pasaría (no abre WhatsApp desde la simulación). */
export function WhatsAppButton() {
  const { cfg } = useSim();
  const [open, setOpen] = useState(false);
  const f = cfg.features?.['whatsapp-button'];
  if (!f) return null;
  const msg = String(f.params.message ?? 'Hola, quiero asesoría para mi compra');
  return (
    <SimPortal>
      <div className="absolute bottom-10 right-3 z-30 flex flex-col items-end gap-2">
        {open && (
          <div className="animate-fade-in w-64 rounded-2xl bg-white p-3 text-xs shadow-2xl ring-1 ring-slate-200" role="dialog" aria-label="WhatsApp">
            <p className="font-bold text-slate-800">WhatsApp de {cfg.brand.storeName}</p>
            <p className="mt-1 rounded-lg bg-emerald-50 p-2 text-emerald-900">“{msg}”</p>
            <p className="mt-2 text-[11px] text-slate-500">Simulación: en la tienda real abriría WhatsApp con este mensaje al número del cliente (por definir).</p>
          </div>
        )}
        <Annotated id="whatsapp">
          <button type="button" aria-label="WhatsApp" aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white shadow-xl transition hover:scale-105" data-testid="whatsapp-button">
            <MessageCircle size={24} />
          </button>
        </Annotated>
      </div>
    </SimPortal>
  );
}

const MegaCol = ({ title, items, onPick }: { title: string; items: string[]; onPick: (v: string) => void }) => (
  <div>
    <p className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-brand">{title}</p>
    <ul className="space-y-1.5">{items.map((i) => <li key={i}><button type="button" onClick={() => onPick(i)} className="text-sm text-slate-700 transition hover:translate-x-1 hover:text-brand">{i}</button></li>)}</ul>
  </div>
);

function MobileMenu() {
  const { cfg, go } = useSim();
  const setMobileMenu = useSimUi((s) => s.setMobileMenu);
  const [cat, setCat] = useState(false);
  const nav = (p: string, params?: Record<string, string>) => { setMobileMenu(false); go(p, params); };
  return (
    <SimPortal>
      <div className="absolute inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label="Menú">
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenu(false)} />
        <nav className="animate-slide-left relative flex h-full w-[84%] max-w-sm flex-col overflow-y-auto bg-white" data-testid="mobile-menu">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><span className="font-sim-heading font-bold">{cfg.brand.storeName}</span><button type="button" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)}><X size={22} /></button></div>
          <ul className="flex-1 divide-y divide-slate-100">
            {cfg.pages.filter((p) => p.inMenu || p.type === 'home').map((p) =>
              p.type === 'catalog' && cfg.header.menuType !== 'simple' ? (
                <li key={p.id}>
                  <button type="button" aria-expanded={cat} onClick={() => setCat(!cat)} className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold">{p.title} <ChevronDown size={16} className={cn('transition', cat && 'rotate-180')} /></button>
                  {cat && <ul className="bg-slate-50 pb-2">{[{ c: 'Ver todo', params: undefined }, ...cfg.catalog.categories.map((c) => ({ c, params: { category: c } }))].map(({ c, params }) => <li key={c}><button type="button" onClick={() => nav('catalog', params)} className="w-full px-6 py-2.5 text-left text-sm">{c}</button></li>)}</ul>}
                </li>
              ) : (
                <li key={p.id}><button type="button" onClick={() => nav(p.id)} className="w-full px-4 py-4 text-left font-semibold">{p.title}</button></li>
              ),
            )}
          </ul>
          {cfg.header.elements.includes('account') && <button type="button" onClick={() => nav('account')} className="flex items-center gap-2 border-t border-slate-200 px-4 py-4 text-sm font-semibold"><User size={18} /> Mi cuenta</button>}
        </nav>
      </div>
    </SimPortal>
  );
}

export function SimFooter() {
  const { cfg, go } = useSim();
  const f = cfg.footer;
  const links = cfg.pages.filter((p) => p.inFooter);
  return (
    <Annotated id="footer" as="footer" className="mt-auto bg-slate-900 text-slate-300">
      <Container className="grid gap-8 py-12 @3xl:grid-cols-4">
        <div className="@3xl:col-span-1">
          <p className="font-sim-heading text-lg font-extrabold text-white">{cfg.brand.storeName}</p>
          <p className="mt-2 text-xs text-slate-400">Descripción breve de la marca (por definir).</p>
          {f.showSocial && <div className="mt-4 flex gap-2">{['IG', 'FB', 'TT', 'YT'].map((s) => <span key={s} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[10px] font-bold" title="Red social (enlace por definir)">{s}</span>)}</div>}
        </div>
        {f.columns === 'columns' && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Categorías</p>
            <ul className="space-y-1.5 text-sm">{cfg.catalog.categories.slice(0, 6).map((c) => <li key={c}><button type="button" onClick={() => go('catalog', { category: c })} className="hover:text-white">{c}</button></li>)}</ul>
          </div>
        )}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Información</p>
          <ul className="space-y-1.5 text-sm" data-testid="footer-links">{links.map((p) => <li key={p.id}><button type="button" onClick={() => go(p.id)} className="hover:text-white">{p.title}</button></li>)}{links.length === 0 && <li className="text-slate-500">Sin enlaces</li>}</ul>
        </div>
        {f.showNewsletter && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Newsletter</p>
            <NewsletterForm cta="Suscribirme" dark stacked />
          </div>
        )}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-xs text-slate-500 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <span>{f.legalText}</span>
          {f.showPayments && <div className="flex flex-wrap gap-1.5">{(cfg.cart.paymentMethods.length ? cfg.cart.paymentMethods : ['Medios de pago por definir']).map((m) => <span key={m} className="rounded bg-white/10 px-2 py-1 text-[10px] text-slate-300">{m}</span>)}</div>}
        </Container>
      </div>
    </Annotated>
  );
}

export function LeadPopup() {
  const { cfg } = useSim();
  const session = useSession();
  const dismiss = useStudio((s) => s.dismissPopup);
  const page = useStudio((s) => s.ui.route.page);
  const [show, setShow] = useState(false);
  const enabled = cfg.leads.forms.includes('popup') && cfg.leads.popupTrigger !== 'none' && !session.popupDismissed && page === 'home';
  useEffect(() => {
    if (!enabled) return setShow(false);
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [enabled]);
  if (!show || !enabled) return null;
  return (
    <SimPortal>
      <div className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Suscripción">
        <Annotated id="leads" className="animate-fade-in relative grid w-full max-w-2xl overflow-hidden rounded-sim-lg bg-white shadow-2xl @3xl:grid-cols-2">
          <div className="hidden @3xl:block"><BannerArt seed={60} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full" label={false} /></div>
          <div className="p-7">
            <button type="button" aria-label="Cerrar" onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1 hover:bg-slate-100"><X size={20} /></button>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Bienvenida</p>
            <h2 className="mt-2 font-sim-heading text-2xl font-extrabold">{cfg.leads.incentive || 'Recibe beneficios exclusivos'}</h2>
            <p className="mt-2 text-sm text-slate-600">Pop-up de captación ({{ delay: 'tras unos segundos', exitIntent: 'intención de salida', scroll: 'al hacer scroll', none: '' }[cfg.leads.popupTrigger]}). Requiere validación de app o tema.</p>
            <div className="mt-5"><NewsletterForm cta="Quiero el beneficio" /></div>
          </div>
        </Annotated>
      </div>
    </SimPortal>
  );
}

export function QuickView() {
  const { money, go } = useSim();
  const { quickView, setQuickView } = useSimUi();
  const addToCart = useStudio((s) => s.addToCart);
  const p = quickView ? getProduct(quickView) : undefined;
  const [vid, setVid] = useState<string | null>(null);
  useEffect(() => {
    setVid(null);
  }, [quickView]);
  if (!p) return null;
  const v = p.presentations.find((x) => x.id === vid) ?? p.presentations.find((x) => x.stock > 0) ?? p.presentations[0];
  return (
    <SimPortal>
      <div className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={`Vista rápida ${p.name}`}>
        <div className="animate-fade-in relative grid w-full max-w-3xl overflow-hidden rounded-sim-lg bg-white shadow-2xl @3xl:grid-cols-2" data-testid="quick-view">
          <button type="button" aria-label="Cerrar" onClick={() => setQuickView(null)} className="absolute right-3 top-3 z-10 rounded-full bg-white p-1 shadow"><X size={20} /></button>
          <div className="aspect-square bg-slate-50"><ProductArt product={p} className="h-full w-full" /></div>
          <div className="flex flex-col gap-3 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">{p.brand}</span>
            <h2 className="font-sim-heading text-2xl font-extrabold">{p.name}</h2>
            <p className="text-xl font-bold">{money(v.price)}</p>
            <div className="flex flex-wrap gap-2">{p.presentations.map((x) => <button key={x.id} type="button" disabled={x.stock === 0} onClick={() => setVid(x.id)} className={cn('h-10 rounded-sim border-2 px-3 text-sm font-semibold disabled:opacity-40', x.id === v.id ? 'border-brand text-brand' : 'border-slate-200')}>{x.label}</button>)}</div>
            <SimButton disabled={v.stock === 0} onClick={() => { addToCart({ productId: p.id, variantId: v.id, qty: 1, purchase: 'once' }); setQuickView(null); }}>Agregar al carrito</SimButton>
            <button type="button" onClick={() => { setQuickView(null); go('product', { id: p.id }); }} className="text-sm font-semibold text-brand underline">Ver ficha completa</button>
          </div>
        </div>
      </div>
    </SimPortal>
  );
}

export function SimToast() {
  const toast = useSimUi((s) => s.toast);
  if (!toast) return null;
  return (
    <SimPortal>
      <div role="status" className="animate-fade-in absolute bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">{toast}</div>
    </SimPortal>
  );
}
