import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Award, BadgeCheck, Building2, Clock, FileText, Ruler, X, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Repeat, ShoppingBag, Truck } from 'lucide-react';
import { DEMO_PRODUCTS, getProduct, totalStock } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useSession, useStudio } from '@/store/useStudio';
import type { DemoProduct, InfoBlock } from '@/types/project';
import { ProductArt } from '../Art';
import { Carousel, Container, DemoTag, ProductCard, SimButton, Stars } from '../Common';
import { Annotated, SimPortal, useSim } from '../SimContext';
import { kitsFor } from './kits';

const DELIVERY: Record<string, [number, number]> = { Bogotá: [1, 2], Medellín: [2, 3], Cali: [2, 3], Barranquilla: [3, 5], 'Otra ciudad': [4, 7] };

const INFO_LABEL: Record<InfoBlock, string> = {
  description: 'Descripción',
  benefits: 'Beneficios',
  usage: 'Modo de uso',
  nutrition: 'Información nutricional',
  ingredients: 'Ingredientes',
  warnings: 'Advertencias',
  shipping: 'Envíos y devoluciones',
};

const Pending = ({ children }: { children: ReactNode }) => (
  <p className="rounded-sim border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">{children}</p>
);

function InfoContent({ block, product }: { block: InfoBlock; product: DemoProduct }) {
  const { cfg } = useSim();
  switch (block) {
    case 'description':
      return <p className="text-sm leading-relaxed text-slate-600">Descripción de demostración para {product.name} de {product.brand}. El texto definitivo lo entrega el cliente y se carga en la descripción del producto en Shopify.</p>;
    case 'benefits':
      return <Pending>Beneficios pendientes de aprobación por el cliente y su área regulatoria. No se muestran afirmaciones de salud de ejemplo.</Pending>;
    case 'usage':
      return <p className="text-sm text-slate-600">Modo de uso según la etiqueta oficial del producto (contenido pendiente del cliente).</p>;
    case 'nutrition':
      if (cfg.product.nutritionFormat === 'image') return <div className="grid aspect-[3/2] place-items-center rounded-sim border border-slate-200 bg-slate-50 text-xs text-slate-500">Imagen de la tabla nutricional (archivo por producto)</div>;
      if (cfg.product.nutritionFormat === 'none') return <p className="text-sm text-slate-500">No se mostrará información nutricional.</p>;
      return (
        <div>
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs text-slate-500">Tabla de demostración — valores ilustrativos, no reales</caption>
            <thead><tr className="border-b-2 border-slate-900 text-left"><th className="py-1.5">Componente</th><th className="py-1.5 text-right">Por porción</th><th className="py-1.5 text-right">%VD</th></tr></thead>
            <tbody>
              {product.ingredients.map((ing) => <tr key={ing} className="border-b border-slate-200"><td className="py-1.5">{ing}</td><td className="py-1.5 text-right text-slate-400">— dato —</td><td className="py-1.5 text-right text-slate-400">—</td></tr>)}
              <tr className="border-b border-slate-200"><td className="py-1.5">Tamaño de porción</td><td className="py-1.5 text-right text-slate-400">— dato —</td><td /></tr>
            </tbody>
          </table>
        </div>
      );
    case 'ingredients':
      return <p className="text-sm text-slate-600"><b>Activos (demo):</b> {product.ingredients.join(', ')}. Lista completa de ingredientes pendiente del cliente.</p>;
    case 'warnings':
      return <Pending>Advertencias y precauciones según etiqueta oficial (contenido pendiente del cliente).</Pending>;
    case 'shipping':
      return <p className="text-sm text-slate-600">{cfg.cart.shippingNotes || 'Condiciones de envío y devoluciones por definir en la fase 5.'}</p>;
  }
}

function Gallery({ product }: { product: DemoProduct }) {
  const { cfg } = useSim();
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const imgs = [0, 1, 2, 3];
  useEffect(() => {
    setIdx(0);
  }, [product.id]);
  const main = (
    <div
      className="relative aspect-square overflow-hidden rounded-sim-lg bg-slate-50"
      onMouseMove={(e) => {
        if (!cfg.product.zoom) return;
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setZoom(null)}
      data-testid="gallery-main"
      data-image-index={idx}
    >
      <div className="h-full w-full transition-transform duration-200" style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
        <ProductArt product={product} variant={idx} className="h-full w-full" />
      </div>
      {cfg.product.gallery === 'slider' && (
        <>
          <button type="button" aria-label="Imagen anterior" onClick={() => setIdx((idx + 3) % 4)} className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Imagen siguiente" onClick={() => setIdx((idx + 1) % 4)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronRight size={18} /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{imgs.map((i) => <button key={i} type="button" aria-label={`Imagen ${i + 1}`} onClick={() => setIdx(i)} className={cn('h-2 rounded-full bg-slate-800 transition-all', i === idx ? 'w-6' : 'w-2 opacity-30')} />)}</div>
        </>
      )}
    </div>
  );
  if (cfg.product.gallery === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2" data-testid="gallery-grid">
        {imgs.map((i) => <div key={i} className="aspect-square overflow-hidden rounded-sim-lg bg-slate-50"><ProductArt product={product} variant={i} className="h-full w-full" /></div>)}
      </div>
    );
  }
  if (cfg.product.gallery === 'slider') return main;
  const vertical = cfg.product.thumbsPosition === 'vertical';
  return (
    <div className={cn('flex gap-3', vertical ? 'flex-row-reverse' : 'flex-col')}>
      <div className="flex-1">{main}</div>
      <div className={cn('flex gap-2', vertical ? 'w-16 flex-col @3xl:w-20' : '')} role="tablist" aria-label="Imágenes del producto">
        {imgs.map((i) => (
          <button key={i} type="button" role="tab" aria-selected={i === idx} aria-label={`Ver imagen ${i + 1}`} onClick={() => setIdx(i)} className={cn('aspect-square overflow-hidden rounded-sim border-2 bg-slate-50', vertical ? 'w-full' : 'w-16 @3xl:w-20', i === idx ? 'border-brand' : 'border-transparent opacity-75 hover:opacity-100')}>
            <ProductArt product={product} variant={i} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductPage() {
  const { cfg, money, go, scrollRef, device } = useSim();
  const params = useStudio((s) => s.ui.route.params);
  const addToCart = useStudio((s) => s.addToCart);
  const product = getProduct(params?.id ?? '') ?? DEMO_PRODUCTS[0];
  const firstAvail = product.presentations.find((v) => v.stock > 0) ?? product.presentations[0];
  const [variantId, setVariantId] = useState(firstAvail.id);
  const [qty, setQty] = useState(1);
  const [purchase, setPurchase] = useState<'once' | 'subscription'>('once');
  const [frequency, setFrequency] = useState(cfg.subscriptions.frequencies[0] ?? '30 días');
  const [tab, setTab] = useState(0);
  const [openAcc, setOpenAcc] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const p = cfg.product;
  const f = cfg.features ?? {};
  const session = useSession();
  const markViewed = useStudio((s) => s.markViewed);
  const b2b = !!f['b2b-price-lists'] && !!session.b2bMode;
  const minQty = b2b && f['b2b-min-order'] ? Number(f['b2b-min-order'].params.min) || 1 : 1;
  const [sizeGuide, setSizeGuide] = useState(false);
  const [quote, setQuote] = useState<'closed' | 'open' | 'sent'>('closed');
  const [city, setCity] = useState('Bogotá');
  useEffect(() => { markViewed(product.id); }, [product.id, markViewed]);
  useEffect(() => { if (qty < minQty) setQty(minQty); }, [minQty, qty]);

  useEffect(() => {
    setVariantId(firstAvail.id);
    setQty(1);
    setPurchase('once');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  useEffect(() => { if (!cfg.subscriptions.frequencies.includes(frequency)) setFrequency(cfg.subscriptions.frequencies[0] ?? '30 días'); }, [cfg.subscriptions.frequencies, frequency]);
  useEffect(() => {
    if (!p.stickyBuy || !buyRef.current) return setShowSticky(false);
    const io = new IntersectionObserver((e) => setShowSticky(!e[0].isIntersecting && e[0].boundingClientRect.top < 0), { root: scrollRef.current });
    io.observe(buyRef.current);
    return () => io.disconnect();
  }, [p.stickyBuy, scrollRef, product.id]);

  const variant = product.presentations.find((v) => v.id === variantId) ?? firstAvail;
  const subEligible = cfg.subscriptions.enabled && (cfg.subscriptions.scope === 'all' || cfg.subscriptions.productIds.includes(product.id));
  const isSub = subEligible && purchase === 'subscription';
  const listPrice = b2b ? Math.round(variant.price * 0.8) : variant.price;
  const unit = isSub ? Math.round(listPrice * (1 - cfg.subscriptions.discountPct / 100)) : listPrice;
  const points = f['loyalty-points'] ? Math.floor((unit * qty) / 1000) * (Number(f['loyalty-points'].params.rate) || 1) : 0;
  const out = variant.stock === 0;
  const blocks = p.infoBlocks;
  const add = () => addToCart({ productId: product.id, variantId: variant.id, qty, purchase: isSub ? 'subscription' : 'once', frequency: isSub ? frequency : undefined });

  const priceEl = (
    <div className="flex items-baseline gap-3" data-testid="pdp-price">
      <span className="font-sim-heading text-2xl font-extrabold">{money(unit)}</span>
      {(variant.compareAt || isSub) && <span className="text-base text-slate-400 line-through">{money(variant.compareAt ?? variant.price)}</span>}
      {variant.compareAt && !isSub && !b2b && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-accent">-{Math.round((1 - variant.price / variant.compareAt) * 100)}%</span>}
      {b2b && <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white" data-testid="b2b-price"><Building2 size={12} /> Precio distribuidor (ejemplo)</span>}
    </div>
  );

  const variantPicker = (
    <Annotated id="variants">
      <div className="flex flex-col gap-2">
        <span className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>Presentación: <span className="font-normal text-slate-600" data-testid="selected-variant">{variant.label}</span></span>
          {f['size-guide'] && <button type="button" onClick={() => setSizeGuide(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand underline" data-testid="size-guide-link"><Ruler size={13} /> Guía de tallas</button>}
        </span>
        {p.variantStyle === 'select' ? (
          <select aria-label="Presentación" value={variant.id} onChange={(e) => setVariantId(e.target.value)} className="h-11 rounded-sim border border-slate-300 bg-white px-3 text-sm">
            {product.presentations.map((v) => <option key={v.id} value={v.id} disabled={v.stock === 0}>{v.label}{v.stock === 0 ? ' — agotado' : ''}</option>)}
          </select>
        ) : (
          <div className={cn('flex flex-wrap gap-2', p.variantStyle === 'swatches' && 'grid grid-cols-2')} role="radiogroup" aria-label="Presentación">
            {product.presentations.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variant.id}
                disabled={v.stock === 0}
                onClick={() => setVariantId(v.id)}
                className={cn(
                  'rounded-sim border-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40',
                  p.variantStyle === 'swatches' ? 'flex flex-col items-start p-3 text-left' : 'h-11 px-4',
                  v.id === variant.id ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 hover:border-slate-400',
                )}
              >
                {v.label}
                {p.variantStyle === 'swatches' && <span className="text-xs font-normal text-slate-600">{money(v.price)}{v.stock === 0 ? ' · agotado' : ''}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </Annotated>
  );

  const purchaseOptions = subEligible && (
    <Annotated id="subscriptions">
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Tipo de compra">
        {(['once', 'subscription'] as const).map((t) => (
          <label key={t} className={cn('flex cursor-pointer items-start gap-3 rounded-sim-lg border-2 p-3 transition', purchase === t ? 'border-brand bg-brand/5' : 'border-slate-200')}>
            <input type="radio" name="purchase" checked={purchase === t} onChange={() => setPurchase(t)} className="mt-1 accent-[var(--sim-primary)]" />
            <span className="flex-1 text-sm">
              <b className="flex items-center gap-1.5">{t === 'once' ? 'Compra única' : <><Repeat size={14} /> Suscríbete y ahorra {cfg.subscriptions.discountPct}%</>}</b>
              {t === 'subscription' && (
                <span className="mt-1 block text-xs text-slate-600">
                  Entrega cada{' '}
                  <select aria-label="Frecuencia de suscripción" value={frequency} onChange={(e) => { setFrequency(e.target.value); setPurchase('subscription'); }} className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs">
                    {cfg.subscriptions.frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {cfg.subscriptions.incentives.includes('freeShipping') && ' · envío gratis'} · cancela cuando quieras (según app)
                </span>
              )}
            </span>
            <span className="text-sm font-bold">{money(t === 'once' ? variant.price : Math.round(variant.price * (1 - cfg.subscriptions.discountPct / 100)))}</span>
          </label>
        ))}
        <p className="text-[11px] text-sky-700">Suscripción sujeta a validación técnica (app, pasarela y SAP).</p>
      </div>
    </Annotated>
  );

  const buyBox = (
    <Annotated id="buyBox">
      <div ref={buyRef} className="flex flex-col gap-3">
        {p.pricePosition === 'nearButton' && priceEl}
        <div className="flex gap-2">
          {p.quantitySelector && (
            <div className="flex h-12 items-center rounded-sim border border-slate-300" aria-label="Cantidad">
              <button type="button" aria-label="Disminuir cantidad" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-full w-10 place-items-center"><Minus size={16} /></button>
              <span className="w-8 text-center text-sm font-semibold" data-testid="pdp-qty">{qty}</span>
              <button type="button" aria-label="Aumentar cantidad" onClick={() => setQty(Math.min(variant.stock || 1, qty + 1))} className="grid h-full w-10 place-items-center"><Plus size={16} /></button>
            </div>
          )}
          <SimButton className="h-12 flex-1" disabled={out || qty < minQty} onClick={add} ariaLabel="Agregar al carrito">
            <ShoppingBag size={18} /> {out ? 'Agotado' : isSub ? 'Suscribirme' : 'Agregar al carrito'}
          </SimButton>
        </div>
        {minQty > 1 && <p className="text-xs text-slate-600" data-testid="min-qty">Pedido mayorista mínimo: {minQty} unidades (ejemplo).</p>}
        {f['b2b-quote-request'] && <SimButton variant="outline" className="h-11" onClick={() => setQuote('open')}><FileText size={16} /> Solicitar cotización</SimButton>}
        {points > 0 && <p className="flex items-center gap-1.5 text-xs font-medium text-brand" data-testid="loyalty-points"><Award size={14} /> Ganas {points} puntos con esta compra (programa de ejemplo)</p>}
        {f['delivery-estimate'] && (
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600" data-testid="delivery-estimate">
            <Clock size={14} className="text-brand" /> Llega a
            <select aria-label="Ciudad de entrega" value={city} onChange={(e) => setCity(e.target.value)} className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs">{Object.keys(DELIVERY).map((c) => <option key={c}>{c}</option>)}</select>
            entre <b>{DELIVERY[city][0]}</b> y <b>{DELIVERY[city][1]}</b> días hábiles (estimado de ejemplo)
          </p>
        )}
        {out && cfg.leads.forms.includes('backInStock') && <BackInStock />}
      </div>
    </Annotated>
  );

  const beforeBuy = p.beforeBuy;
  const info = (
    <div className="flex flex-col gap-4">
      {beforeBuy.includes('brand') && <span className="text-xs font-bold uppercase tracking-widest text-brand">{product.brand}</span>}
      <h1 className="font-sim-heading text-2xl font-extrabold leading-tight tracking-tight @3xl:text-3xl">{product.name}</h1>
      {(beforeBuy.includes('rating') || p.reviews !== 'none') && <Stars value={product.rating} count={product.reviews} size={15} />}
      {p.pricePosition === 'underTitle' && priceEl}
      {beforeBuy.includes('badges') && product.badges.length > 0 && <div className="flex gap-1.5">{product.badges.map((b) => <span key={b} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold">{b}</span>)}</div>}
      {beforeBuy.includes('shortDescription') && <p className="text-sm text-slate-600">Descripción corta de demostración. {product.format} · {product.category}.</p>}
      {variantPicker}
      {beforeBuy.includes('stock') && p.showStock && (
        <p className={cn('flex items-center gap-2 text-sm font-medium', out ? 'text-rose-600' : variant.stock < 10 ? 'text-amber-700' : 'text-emerald-700')} data-testid="stock">
          <span className={cn('h-2 w-2 rounded-full', out ? 'bg-rose-500' : variant.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500')} />
          {out ? 'Agotado' : f['low-stock-urgency'] && variant.stock < 10 ? `Últimas ${variant.stock} unidades` : 'Disponible'} <span className="text-xs font-normal text-slate-400">(inventario demo)</span>
        </p>
      )}
      {purchaseOptions}
      {buyBox}
      {beforeBuy.includes('shippingInfo') && <p className="flex items-center gap-2 rounded-sim bg-slate-50 px-3 py-2.5 text-xs text-slate-600"><Truck size={16} className="text-brand" /> {cfg.cart.freeShippingBar ? `Envío gratis desde ${money(cfg.cart.freeShippingThreshold)}` : 'Condiciones de envío por definir'}</p>}
      {beforeBuy.includes('certifications') && (
        <Annotated id="certifications">
          <div className="flex flex-wrap gap-2">{(p.certifications.length ? p.certifications : ['Certificación (por definir)']).map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold"><BadgeCheck size={14} className="text-brand" /> {c}</span>)}</div>
        </Annotated>
      )}
    </div>
  );

  const infoBlocks = blocks.length > 0 && (
    <Annotated id="pdpInfo" className="mt-10" >
      <div data-testid="pdp-info" data-info-display={p.infoDisplay}>
        {p.infoDisplay === 'tabs' ? (
          <div>
            <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200">
              {blocks.map((b, i) => <button key={b} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={cn('-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold', tab === i ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-900')}>{INFO_LABEL[b]}</button>)}
            </div>
            <div role="tabpanel" className="py-5">{blocks[tab] && <InfoContent block={blocks[Math.min(tab, blocks.length - 1)]} product={product} />}</div>
          </div>
        ) : p.infoDisplay === 'accordion' ? (
          <div className="border-t border-slate-200">
            {blocks.map((b, i) => (
              <div key={b} className="border-b border-slate-200">
                <h3><button type="button" aria-expanded={openAcc === i} onClick={() => setOpenAcc(openAcc === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left font-sim-heading text-sm font-bold">{INFO_LABEL[b]} <ChevronDown size={16} className={cn('transition', openAcc === i && 'rotate-180')} /></button></h3>
                {openAcc === i && <div className="animate-fade-in pb-4"><InfoContent block={b} product={product} /></div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 @3xl:grid-cols-2">
            {blocks.map((b) => <div key={b}><h3 className="mb-2 font-sim-heading text-lg font-bold">{INFO_LABEL[b]}</h3><InfoContent block={b} product={product} /></div>)}
          </div>
        )}
      </div>
    </Annotated>
  );

  const related = DEMO_PRODUCTS.filter((x) => x.id !== product.id && totalStock(x) > 0 && (x.category === product.category || x.goals.some((g) => product.goals.includes(g)))).slice(0, 4);
  const kit = cfg.bundles.enabled && cfg.bundles.display.includes('pdpBlock') ? kitsFor(cfg).find((k) => k.productIds.includes(product.id)) ?? kitsFor(cfg)[0] : undefined;

  return (
    <div data-testid="product-page" data-layout={p.layout}>
      <Container className="py-6 @3xl:py-10">
        <nav aria-label="Migas" className="mb-5 text-xs text-slate-500"><button type="button" onClick={() => go('home')} className="hover:underline">Inicio</button> / <button type="button" onClick={() => go('catalog', { category: product.category })} className="hover:underline">{product.category}</button> / <span className="text-slate-800">{product.name}</span></nav>
        <div className={cn('grid gap-8', p.layout === 'split' && '@3xl:grid-cols-2 @3xl:gap-12', p.layout === 'wideGallery' && '@3xl:grid-cols-[1.6fr_1fr] @3xl:gap-10', p.layout === 'stacked' && 'gap-6')}>
          <Annotated id="pdpGallery" className={cn(p.layout === 'stacked' && 'mx-auto w-full max-w-2xl')}>
            <Gallery product={product} />
          </Annotated>
          <div className={cn(p.layout === 'stacked' && 'mx-auto w-full max-w-2xl')}>{info}</div>
        </div>
        {kit && (
          <Annotated id="bundles" className="mt-10">
            <div className="flex flex-col gap-4 rounded-sim-lg border border-slate-200 bg-brand-soft p-5 @3xl:flex-row @3xl:items-center">
              <div className="flex -space-x-5">{kit.productIds.map(getProduct).filter(Boolean).map((x) => <div key={x!.id} className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white"><ProductArt product={x!} variant={3} className="h-full w-full" /></div>)}</div>
              <div className="flex-1"><p className="font-sim-heading font-bold">Compra el kit: {kit.name}</p><p className="text-xs text-slate-600">Ahorra {kit.discountPct}% al llevar los {kit.productIds.length} productos (ejemplo).</p></div>
              <SimButton variant="outline" onClick={() => go('kits')}>Ver kit</SimButton>
            </div>
          </Annotated>
        )}
        {infoBlocks}
        {p.reviews !== 'none' && (
          <Annotated id="reviews" className="mt-12">
            <section aria-label="Reseñas">
              <h2 className="font-sim-heading text-xl font-extrabold">Reseñas</h2>
              <div className="mt-3 flex items-center gap-3"><span className="font-sim-heading text-4xl font-extrabold">{product.rating}</span><Stars value={product.rating} count={product.reviews} size={16} /></div>
              {p.reviews === 'app' && (
                <div className="mt-4 grid gap-3 @3xl:grid-cols-2">
                  {['Cliente demo 1', 'Cliente demo 2'].map((n) => <div key={n} className="rounded-sim-lg border border-slate-200 p-4"><Stars value={5} /><p className="mt-2 text-sm text-slate-600">Reseña de demostración: aquí aparecerán reseñas verificadas de la app seleccionada.</p><p className="mt-2 text-xs text-slate-400">{n}</p></div>)}
                </div>
              )}
              <p className="mt-2 text-[11px] text-amber-700">Requiere app de reseñas (revisión de alcance).</p>
            </section>
          </Annotated>
        )}
        {p.related !== 'none' && related.length > 0 && (
          <Annotated id="related" className="mt-12">
            <section aria-label="Productos relacionados">
              <h2 className="mb-5 font-sim-heading text-xl font-extrabold @3xl:text-2xl">También te puede interesar</h2>
              {p.related === 'carousel' ? <Carousel label="Productos relacionados">{related.map((x) => <ProductCard key={x.id} product={x} />)}</Carousel> : <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-5">{related.map((x) => <ProductCard key={x.id} product={x} />)}</div>}
            </section>
          </Annotated>
        )}
        {f['recently-viewed'] && (
          <Annotated id="recentlyViewed" className="mt-12">
            <section aria-label="Vistos recientemente" data-testid="recently-viewed">
              <h2 className="mb-5 font-sim-heading text-xl font-extrabold">Vistos recientemente</h2>
              {(session.viewed ?? []).filter((id) => id !== product.id).length === 0 ? (
                <p className="text-sm text-slate-500">Navega por otros productos y aparecerán aquí.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{(session.viewed ?? []).filter((id) => id !== product.id).slice(0, 4).map((id) => getProduct(id)).filter(Boolean).map((x) => <ProductCard key={x!.id} product={x!} />)}</div>
              )}
            </section>
          </Annotated>
        )}
        <div className="mt-8"><DemoTag /> <span className="text-[11px] text-slate-400">Precio, inventario e información son de demostración.</span></div>
      </Container>

      {sizeGuide && (
        <SimPortal>
          <div className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Guía de tallas">
            <div className="animate-fade-in w-full max-w-md rounded-sim-lg bg-white p-5 shadow-2xl" data-testid="size-guide">
              <div className="mb-3 flex items-center justify-between"><p className="font-sim-heading text-lg font-bold">Guía de tallas</p><button type="button" aria-label="Cerrar guía" onClick={() => setSizeGuide(false)}><X size={20} /></button></div>
              <table className="w-full text-sm"><thead><tr className="border-b-2 border-slate-900 text-left"><th className="py-1">Talla</th><th>Pecho (cm)</th><th>Cintura (cm)</th></tr></thead><tbody>{[['S', '86-91', '71-76'], ['M', '91-97', '76-81'], ['L', '97-104', '81-89']].map((r) => <tr key={r[0]} className="border-b border-slate-100">{r.map((c) => <td key={c} className="py-1.5">{c}</td>)}</tr>)}</tbody></table>
              <p className="mt-3 text-[11px] text-slate-500">Medidas de ejemplo: el cliente entrega su tabla por tipo de producto.</p>
            </div>
          </div>
        </SimPortal>
      )}
      {quote !== 'closed' && (
        <SimPortal>
          <div className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Solicitar cotización">
            <div className="animate-fade-in w-full max-w-md rounded-sim-lg bg-white p-5 shadow-2xl" data-testid="quote-form">
              <div className="mb-3 flex items-center justify-between"><p className="font-sim-heading text-lg font-bold">Solicitar cotización</p><button type="button" aria-label="Cerrar cotización" onClick={() => setQuote('closed')}><X size={20} /></button></div>
              {quote === 'sent' ? <p role="status" className="rounded-sim bg-emerald-50 p-3 text-sm text-emerald-800">Simulación: la solicitud llegaría al equipo comercial. No se envió ningún dato.</p> : (
                <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); setQuote('sent'); }}>
                  <p className="text-xs text-slate-500">{product.name} · {variant.label}</p>
                  <input required aria-label="Empresa" placeholder="Empresa" className="h-10 rounded-sim border border-slate-300 px-3 text-sm" />
                  <input required type="number" min={1} aria-label="Unidades" placeholder="Unidades" className="h-10 rounded-sim border border-slate-300 px-3 text-sm" />
                  <SimButton type="submit">Enviar solicitud</SimButton>
                </form>
              )}
            </div>
          </div>
        </SimPortal>
      )}
      {showSticky && (
        <SimPortal>
          <div className="animate-fade-in absolute inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur" data-testid="sticky-buy">
            <div className="mx-auto flex max-w-6xl items-center gap-3">
              {device === 'desktop' && <div className="h-12 w-12 overflow-hidden rounded-sim bg-slate-50"><ProductArt product={product} className="h-full w-full" /></div>}
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="text-xs text-slate-500">{variant.label} · {money(unit)}</p></div>
              <SimButton disabled={out} onClick={add}><ShoppingBag size={16} /> {device === 'desktop' ? 'Agregar al carrito' : 'Agregar'}</SimButton>
            </div>
          </div>
        </SimPortal>
      )}
    </div>
  );
}

function BackInStock() {
  const [done, setDone] = useState(false);
  return done ? (
    <p className="text-xs text-emerald-700">Simulación: te avisaríamos cuando vuelva a estar disponible.</p>
  ) : (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="flex gap-2">
      <input required type="email" aria-label="Correo para aviso de reposición" placeholder="Avísame cuando llegue" className="h-10 flex-1 rounded-sim border border-slate-300 px-3 text-sm" />
      <SimButton type="submit" variant="outline" className="h-10">Avisarme</SimButton>
    </form>
  );
}

