import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, MessageCircle, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { DEMO_ARTICLES, DEMO_BRANDS, DEMO_FAQ, DEMO_GOALS, DEMO_PRODUCTS, DEMO_TESTIMONIALS, getProduct, minPrice } from '@/data/demoCatalog';
import { getSectionDef } from '@/config/sections';
import { sortProducts } from '@/engine/catalog';
import { cn } from '@/lib/utils';
import type { SectionInstance } from '@/types/project';
import { BannerArt, BrandLogo, ProductArt } from '../Art';
import { Carousel, Container, DemoTag, gridCols, ProductCard, SectionHeading, SimButton, toneCls } from '../Common';
import { Annotated, useSim } from '../SimContext';
import { kitsFor } from '../pages/kits';

type P = { s: SectionInstance };

const Img = ({ src, seed, className }: { src?: string; seed: number; className?: string }) => {
  const { cfg } = useSim();
  return src ? <img src={src} alt="" className={cn('object-cover', className)} /> : <BannerArt seed={seed} primary={cfg.brand.primary} accent={cfg.brand.accent} className={className} />;
};

function Announcement({ s }: P) {
  const { cfg } = useSim();
  const msgs = s.variant === 'rotating' ? [s.props.title, cfg.leads.incentive || 'Paga seguro en el checkout de Shopify', 'Asesoría por chat · Texto de ejemplo'] : [s.props.title];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (msgs.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % msgs.length), 3500);
    return () => clearInterval(t);
  }, [msgs.length]);
  return <div className={cn('px-4 py-2 text-center text-xs font-medium @3xl:text-[13px]', toneCls(s.props.tone))}>{msgs[i % msgs.length]}</div>;
}

function Hero({ s }: P) {
  const { go } = useSim();
  const p = s.props;
  if (s.variant === 'full' || s.variant === 'centered') {
    return (
      <section className="relative isolate overflow-hidden">
        <Img src={p.image} seed={1} className="absolute inset-0 -z-10 h-full w-full" />
        <div className={cn('absolute inset-0 -z-10', s.variant === 'full' ? 'bg-gradient-to-r from-black/55 via-black/25 to-transparent' : 'bg-black/35')} />
        <Container className={cn('flex min-h-[380px] flex-col justify-center py-16 text-white @3xl:min-h-[480px]', (s.variant === 'centered' || p.align === 'center') && 'items-center text-center')}>
          <h1 className="max-w-2xl font-sim-heading text-3xl font-extrabold leading-tight tracking-tight @3xl:text-5xl">{p.title}</h1>
          {p.subtitle && <p className="mt-4 max-w-xl text-base opacity-90 @3xl:text-lg">{p.subtitle}</p>}
          {p.cta && <SimButton variant="light" className="mt-7" onClick={() => go(p.ctaTarget || 'catalog')}>{p.cta} <ArrowRight size={16} /></SimButton>}
        </Container>
      </section>
    );
  }
  return (
    <section className={toneCls(p.tone)}>
      <Container className="grid items-center gap-8 py-10 @3xl:grid-cols-2 @3xl:gap-12 @3xl:py-16">
        <div className={cn(p.align === 'center' && 'text-center')}>
          <h1 className="font-sim-heading text-3xl font-extrabold leading-[1.1] tracking-tight @3xl:text-5xl">{p.title}</h1>
          {p.subtitle && <p className="mt-4 text-base opacity-80 @3xl:text-lg">{p.subtitle}</p>}
          {p.cta && <SimButton className="mt-7" variant={p.tone === 'brand' ? 'light' : 'primary'} onClick={() => go(p.ctaTarget || 'catalog')}>{p.cta} <ArrowRight size={16} /></SimButton>}
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-sim-lg">
          <Img src={p.image} seed={2} className="h-full w-full" />
        </div>
      </Container>
    </section>
  );
}

function Slideshow({ s }: P) {
  const { go } = useSim();
  const slides = s.props.slides?.length ? s.props.slides : [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);
  if (!slides.length) return null;
  const cur = slides[Math.min(i, slides.length - 1)];
  const targets = ['catalog', 'product', 'kits'];
  return (
    <section className={cn(s.variant === 'contained' && 'py-6')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className={cn('relative isolate overflow-hidden', s.variant === 'contained' && 'mx-auto max-w-6xl rounded-sim-lg @3xl:mx-8')}>
        <Img src={cur.image} seed={10 + i} className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <Container className="flex min-h-[340px] flex-col justify-center py-14 text-white @3xl:min-h-[440px]">
          <div key={cur.id} className="animate-fade-in max-w-xl">
            {cur.eyebrow && <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">{cur.eyebrow}</span>}
            <h2 className="mt-4 font-sim-heading text-3xl font-extrabold leading-tight @3xl:text-5xl">{cur.title}</h2>
            {cur.text && <p className="mt-3 text-base opacity-90">{cur.text}</p>}
            {cur.cta && <SimButton variant="light" className="mt-6" onClick={() => go(targets[i % 3] === 'product' ? 'catalog' : targets[i % 3])}>{cur.cta}</SimButton>}
          </div>
        </Container>
        {slides.length > 1 && (
          <>
            <button type="button" aria-label="Slide anterior" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 shadow @3xl:grid"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Slide siguiente" onClick={() => setI((i + 1) % slides.length)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 shadow @3xl:grid"><ChevronRight size={18} /></button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((sl, k) => (
                <button key={sl.id} type="button" aria-label={`Ir al slide ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={cn('h-2 rounded-full bg-white transition-all', k === i ? 'w-7' : 'w-2 opacity-50')} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CategoryCards({ s }: P) {
  const { cfg, go } = useSim();
  const cats = cfg.catalog.categories.slice(0, s.props.itemsCount);
  return (
    <section className="py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} subtitle={s.props.subtitle} />
        {cats.length === 0 ? <p className="text-center text-sm text-slate-500">Define las categorías en la fase 3.</p> : (
          <div className={gridCols(Math.min(s.props.columns, cats.length || 1))}>
            {cats.map((c, i) => {
              const prod = DEMO_PRODUCTS.find((p) => p.category === c) ?? DEMO_PRODUCTS[i % DEMO_PRODUCTS.length];
              return (
                <button key={c} type="button" onClick={() => go('catalog', { category: c })} className="group relative overflow-hidden rounded-sim-lg text-left">
                  <div className="aspect-[4/5] overflow-hidden bg-slate-100"><ProductArt product={prod} variant={1} className="h-full w-full transition duration-500 group-hover:scale-105" /></div>
                  {s.variant === 'overlay' ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-white"><span className="font-sim-heading text-lg font-bold">{c}</span></div>
                  ) : (
                    <div className="flex items-center justify-between py-3"><span className="font-sim-heading font-bold">{c}</span><ArrowRight size={16} className="text-brand transition group-hover:translate-x-1" /></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}

function CategoryCircles({ s }: P) {
  const { cfg, go } = useSim();
  const cats = cfg.catalog.categories.slice(0, s.props.itemsCount);
  return (
    <section className="py-10">
      <Container>
        <SectionHeading title={s.props.title} />
        <div className={cn('no-scrollbar flex gap-4 overflow-x-auto pb-2 @3xl:justify-center @3xl:gap-6', s.variant === 'pills' && 'flex-wrap justify-center')}>
          {cats.map((c, i) => {
            const prod = DEMO_PRODUCTS.find((p) => p.category === c) ?? DEMO_PRODUCTS[i];
            return s.variant === 'pills' ? (
              <button key={c} type="button" onClick={() => go('catalog', { category: c })} className="shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand">{c}</button>
            ) : (
              <button key={c} type="button" onClick={() => go('catalog', { category: c })} className="group flex w-20 shrink-0 flex-col items-center gap-2 @3xl:w-28">
                <span className="block aspect-square w-full overflow-hidden rounded-full bg-brand-soft ring-2 ring-transparent transition group-hover:ring-brand"><ProductArt product={prod} variant={3} className="h-full w-full" /></span>
                <span className="text-center text-xs font-semibold @3xl:text-sm">{c}</span>
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function Goals({ s }: P) {
  const { go } = useSim();
  const goals = DEMO_GOALS.slice(0, s.props.itemsCount);
  return (
    <section className="bg-brand-soft py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} subtitle={s.props.subtitle} />
        {s.variant === 'chips' ? (
          <div className="flex flex-wrap justify-center gap-2">{goals.map((g) => <button key={g} type="button" onClick={() => go('catalog', { goal: g })} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-brand hover:text-on-brand">{g}</button>)}</div>
        ) : (
          <div className={gridCols(s.props.columns)}>
            {goals.map((g, i) => (
              <button key={g} type="button" onClick={() => go('catalog', { goal: g })} className="group flex items-center justify-between gap-3 rounded-sim-lg bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md @3xl:p-5">
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand">Objetivo {i + 1}</span>
                  <span className="font-sim-heading text-sm font-bold @3xl:text-base">{g}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-brand transition group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        )}
        <p className="mt-4 text-center text-[11px] text-slate-500">Nombres de objetivos de ejemplo: deben ser aprobados por el cliente.</p>
      </Container>
    </section>
  );
}

function ProductsSection({ s }: P) {
  const { go } = useSim();
  const list = s.type === 'bestSellers' ? sortProducts(DEMO_PRODUCTS, 'bestSelling') : s.type === 'newArrivals' ? sortProducts(DEMO_PRODUCTS, 'newest') : DEMO_PRODUCTS.filter((_, i) => i % 2 === 0);
  const items = list.slice(0, Math.max(1, s.props.itemsCount));
  const action = s.props.cta ? <button type="button" onClick={() => go(s.props.ctaTarget || 'catalog')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{s.props.cta} <ArrowRight size={14} /></button> : undefined;
  return (
    <section className="py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} subtitle={s.props.subtitle} align="left" action={action} />
        {s.variant === 'carousel' ? (
          <Carousel label={s.props.title || 'Productos'} cols={s.props.columns}>{items.map((p) => <ProductCard key={p.id} product={p} />)}</Carousel>
        ) : (
          <div className={gridCols(s.props.columns)}>{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </Container>
    </section>
  );
}

function Brands({ s }: P) {
  const { cfg, go } = useSim();
  const brands = DEMO_BRANDS.slice(0, s.props.itemsCount);
  return (
    <section className="border-y border-slate-100 py-10 @3xl:py-14">
      <Container>
        <SectionHeading title={s.props.title} />
        {cfg.brand.identity === 'mono' && <p className="mb-4 text-center text-xs text-amber-700">Identidad monomarca: este bloque normalmente no aplica.</p>}
        <div className={gridCols(s.props.columns, 2)}>
          {brands.map((b) => (
            <button key={b} type="button" onClick={() => go('catalog', { brand: b })} className={cn('flex h-20 items-center justify-center rounded-sim-lg transition hover:text-brand', s.variant === 'cards' ? 'border border-slate-200 bg-white hover:border-brand' : 'grayscale hover:grayscale-0')}>
              <BrandLogo name={b} />
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-400">Marcas ficticias de demostración</p>
      </Container>
    </section>
  );
}

function Benefits({ s }: P) {
  const { cfg, money } = useSim();
  const items = [
    { icon: Truck, title: 'Envío a todo el país', text: cfg.cart.freeShippingBar ? `Gratis desde ${money(cfg.cart.freeShippingThreshold)}` : 'Condiciones por definir' },
    { icon: ShieldCheck, title: 'Productos originales', text: 'Texto de ejemplo' },
    { icon: MessageCircle, title: 'Asesoría', text: 'Canal por definir' },
    { icon: CreditCard, title: 'Pago seguro', text: 'Checkout de Shopify' },
  ].slice(0, s.props.columns);
  return (
    <section className={cn('py-10 @3xl:py-12', toneCls(s.props.tone))}>
      <Container>
        <SectionHeading title={s.props.title} />
        <div className={gridCols(s.props.columns, 2)}>
          {items.map(({ icon: I, title, text }) => (
            <div key={title} className={cn('flex flex-col items-center gap-2 text-center', s.variant === 'cards' && 'rounded-sim-lg bg-white p-5 text-slate-900 shadow-sm')}>
              <span className={cn('grid h-12 w-12 place-items-center rounded-full', s.props.tone === 'brand' && s.variant !== 'cards' ? 'bg-white/15' : 'bg-brand/10 text-brand')}><I size={22} /></span>
              <span className="font-sim-heading text-sm font-bold">{title}</span>
              <span className="text-xs opacity-75">{text}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ImageText({ s }: P) {
  const { go } = useSim();
  const p = s.props;
  return (
    <section className="py-12 @3xl:py-16">
      <Container className="grid items-center gap-8 @3xl:grid-cols-2 @3xl:gap-14">
        <div className={cn('aspect-[5/4] overflow-hidden rounded-sim-lg', s.variant === 'imageRight' && '@3xl:order-2')}>
          <Img src={p.image} seed={5} className="h-full w-full" />
        </div>
        <div>
          <h2 className="font-sim-heading text-2xl font-extrabold tracking-tight @3xl:text-4xl">{p.title}</h2>
          {p.subtitle && <p className="mt-4 text-base text-slate-600">{p.subtitle}</p>}
          {p.cta && <SimButton variant="outline" className="mt-6" onClick={() => go(p.ctaTarget || 'about')}>{p.cta}</SimButton>}
        </div>
      </Container>
    </section>
  );
}

function Testimonials({ s }: P) {
  const items = DEMO_TESTIMONIALS.slice(0, s.variant === 'quote' ? 1 : s.props.columns);
  return (
    <section className={cn('py-12 @3xl:py-16', toneCls(s.props.tone))}>
      <Container>
        <SectionHeading title={s.props.title} />
        {s.variant === 'quote' ? (
          <figure className="mx-auto max-w-3xl text-center">
            <blockquote className="font-sim-heading text-xl font-bold leading-snug @3xl:text-3xl">“{items[0].text}”</blockquote>
            <figcaption className="mt-4 text-sm opacity-75">{items[0].name} · {items[0].role}</figcaption>
          </figure>
        ) : (
          <div className={gridCols(s.props.columns, 1)}>
            {items.map((t) => (
              <figure key={t.name} className="rounded-sim-lg bg-white p-5 text-slate-900 shadow-sm">
                <blockquote className="text-sm leading-relaxed text-slate-700">“{t.text}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand">{t.name.split(' ').pop()}</span>
                  <span className="text-xs"><b className="block text-sm">{t.name}</b>{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="mt-4 text-center"><DemoTag /></div>
      </Container>
    </section>
  );
}

function Bundles({ s }: P) {
  const { cfg, money, go } = useSim();
  const kits = kitsFor(cfg).slice(0, s.props.columns);
  return (
    <section className="py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} subtitle={s.props.subtitle} />
        <div className={gridCols(s.props.columns, 1)}>
          {kits.map((k) => {
            const prods = k.productIds.map(getProduct).filter(Boolean);
            const total = prods.reduce((a, p) => a + minPrice(p!), 0);
            return (
              <button key={k.id} type="button" onClick={() => go('kits')} className="rounded-sim-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand">
                <div className="flex -space-x-6">{prods.slice(0, 3).map((p) => <div key={p!.id} className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-50"><ProductArt product={p!} variant={3} className="h-full w-full" /></div>)}</div>
                <p className="mt-3 font-sim-heading font-bold">{k.name}</p>
                <p className="text-xs text-slate-500">{prods.length} productos · {k.discountPct}% de ahorro (ejemplo)</p>
                <p className="mt-2 text-sm"><b>{money(Math.round(total * (1 - k.discountPct / 100)))}</b> <span className="text-slate-400 line-through">{money(total)}</span></p>
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function Blog({ s }: P) {
  const { go } = useSim();
  const items = DEMO_ARTICLES.slice(0, s.props.columns);
  return (
    <section className="py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} align="left" action={s.props.cta ? <button type="button" onClick={() => go('blog')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{s.props.cta} <ArrowRight size={14} /></button> : undefined} />
        <div className={s.variant === 'list' ? 'divide-y divide-slate-200' : gridCols(s.props.columns, 1)}>
          {items.map((a, i) =>
            s.variant === 'list' ? (
              <button key={a.title} type="button" onClick={() => go('blog')} className="flex w-full items-center justify-between py-4 text-left hover:text-brand"><span><span className="text-xs font-semibold uppercase text-brand">{a.tag}</span><span className="block font-sim-heading font-bold">{a.title}</span></span><ArrowRight size={16} /></button>
            ) : (
              <button key={a.title} type="button" onClick={() => go('blog')} className="group text-left">
                <div className="aspect-[16/10] overflow-hidden rounded-sim-lg"><BannerArtSeed seed={20 + i} /></div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand">{a.tag} · {a.minutes} min</p>
                <p className="font-sim-heading font-bold group-hover:underline">{a.title}</p>
              </button>
            ),
          )}
        </div>
      </Container>
    </section>
  );
}

const BannerArtSeed = ({ seed }: { seed: number }) => {
  const { cfg } = useSim();
  return <BannerArt seed={seed} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full" label={false} />;
};

export function FaqList({ count = 4, twoCol }: { count?: number; twoCol?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn('mx-auto max-w-3xl', twoCol && 'grid max-w-none gap-x-8 @3xl:grid-cols-2')}>
      {DEMO_FAQ.slice(0, count).map((f, i) => (
        <div key={f.q} className="border-b border-slate-200">
          <h3>
            <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left font-sim-heading text-sm font-bold @3xl:text-base">
              {f.q} {open === i ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </h3>
          {open === i && <p className="animate-fade-in pb-4 text-sm text-slate-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

function Faq({ s }: P) {
  return (
    <section className="py-12 @3xl:py-16">
      <Container>
        <SectionHeading title={s.props.title} />
        <FaqList count={s.props.itemsCount} twoCol={s.variant === 'twoCol'} />
      </Container>
    </section>
  );
}

export function NewsletterForm({ cta, dark, stacked }: { cta: string; dark?: boolean; stacked?: boolean }) {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  if (done) return <p role="status" className={cn('rounded-sim px-4 py-3 text-sm font-medium', dark ? 'bg-white/15' : 'bg-emerald-50 text-emerald-800')}>Simulación: el correo se registraría como cliente con consentimiento de marketing.</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) setDone(true); }} className={cn('flex w-full max-w-md flex-col gap-2', !stacked && '@md:flex-row')}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Correo electrónico" placeholder="tu@correo.com" className={cn('h-11 w-full min-w-0 rounded-sim', !stacked && '@md:w-auto @md:flex-1', ' border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-brand')} />
      <SimButton type="submit" variant={dark ? 'accent' : 'primary'}>{cta || 'Suscribirme'}</SimButton>
    </form>
  );
}

function Newsletter({ s }: P) {
  const p = s.props;
  const dark = p.tone === 'brand' || p.tone === 'dark';
  return (
    <section className={cn('py-12 @3xl:py-16', s.variant === 'inline' && toneCls(p.tone))}>
      <Container>
        {s.variant === 'card' ? (
          <div className={cn('grid overflow-hidden rounded-sim-lg @3xl:grid-cols-2', toneCls(p.tone))}>
            <div className="aspect-[16/10] @3xl:aspect-auto"><Img src={p.image} seed={7} className="h-full w-full" /></div>
            <div className="flex flex-col justify-center gap-4 p-8">
              <h2 className="font-sim-heading text-2xl font-extrabold">{p.title}</h2>
              <p className="text-sm opacity-80">{p.subtitle}</p>
              <NewsletterForm cta={p.cta} dark={dark} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="font-sim-heading text-2xl font-extrabold @3xl:text-3xl">{p.title}</h2>
            <p className="max-w-xl text-sm opacity-80">{p.subtitle}</p>
            <NewsletterForm cta={p.cta} dark={dark} />
          </div>
        )}
      </Container>
    </section>
  );
}

function PromoBanner({ s }: P) {
  const { go } = useSim();
  const p = s.props;
  const block = (seed: number, title: string) => (
    <button type="button" onClick={() => go(p.ctaTarget || 'catalog')} className={cn('relative isolate flex min-h-[220px] w-full flex-col justify-end overflow-hidden rounded-sim-lg p-6 text-left @3xl:min-h-[280px] @3xl:p-10', toneCls(p.tone))}>
      <Img src={p.image} seed={seed} className="absolute inset-0 -z-10 h-full w-full opacity-90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 to-transparent" />
      <h3 className="font-sim-heading text-2xl font-extrabold text-white @3xl:text-3xl">{title}</h3>
      {p.subtitle && <p className="mt-1 text-sm text-white/90">{p.subtitle}</p>}
      {p.cta && <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-sim bg-white px-4 py-2 text-sm font-semibold text-slate-900">{p.cta} <ArrowRight size={14} /></span>}
    </button>
  );
  return (
    <section className="py-8 @3xl:py-12">
      <Container className={cn(s.variant === 'double' && 'grid gap-4 @3xl:grid-cols-2')}>
        {block(30, p.title)}
        {s.variant === 'double' && block(31, 'Segunda campaña')}
      </Container>
    </section>
  );
}

function CtaFinal({ s }: P) {
  const { go } = useSim();
  const p = s.props;
  return (
    <section className={cn(s.variant === 'band' ? cn('py-14', toneCls(p.tone)) : 'py-12')}>
      <Container>
        <div className={cn('flex flex-col items-center gap-4 text-center', s.variant === 'card' && cn('rounded-sim-lg px-6 py-12', toneCls(p.tone)))}>
          <h2 className="font-sim-heading text-2xl font-extrabold @3xl:text-4xl">{p.title}</h2>
          {p.subtitle && <p className="max-w-xl text-sm opacity-85 @3xl:text-base">{p.subtitle}</p>}
          {p.cta && <SimButton variant={p.tone === 'light' || p.tone === 'muted' ? 'primary' : 'light'} onClick={() => go(p.ctaTarget || 'contact')}>{p.cta}</SimButton>}
        </div>
      </Container>
    </section>
  );
}

const MAP: Record<SectionInstance['type'], (p: P) => JSX.Element | null> = {
  announcement: Announcement,
  hero: Hero,
  slideshow: Slideshow,
  categoryCards: CategoryCards,
  categoryCircles: CategoryCircles,
  goals: Goals,
  featured: ProductsSection,
  bestSellers: ProductsSection,
  newArrivals: ProductsSection,
  brands: Brands,
  benefits: Benefits,
  imageText: ImageText,
  testimonials: Testimonials,
  bundles: Bundles,
  blog: Blog,
  faq: Faq,
  newsletter: Newsletter,
  promoBanner: PromoBanner,
  ctaFinal: CtaFinal,
};

/** Motor de render: convierte la lista de secciones de la configuración en componentes. */
export function SectionRenderer({ section, index, highlight }: { section: SectionInstance; index: number; highlight?: boolean }) {
  const Comp = MAP[section.type];
  const def = getSectionDef(section.type);
  return (
    <Annotated id={def.annotation} label={`${def.label}`} reqId={`RF-HOME-${String(index + 1).padStart(2, '0')}`} className={cn(highlight && 'animate-flash')} as="section">
      <div data-section-type={section.type} data-section-id={section.id}>
        <Comp s={section} />
      </div>
    </Annotated>
  );
}
