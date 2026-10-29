import { useState } from 'react';
import { ArrowRight, Check, PackageSearch, Pause, Play, Repeat, SkipForward, XCircle } from 'lucide-react';
import { DEMO_ARTICLES, DEMO_BRANDS, DEMO_PRODUCTS, getProduct, minPrice } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useSession, useStudio } from '@/store/useStudio';
import { BannerArt, BrandLogo, ProductArt } from '../Art';
import { Container, DemoTag, SimButton } from '../Common';
import { Annotated, useSim } from '../SimContext';
import { FaqList } from '../sections/HomeSections';
import { kitsFor } from './kits';

const PageHead = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { go } = useSim();
  return (
    <div className="bg-brand-soft">
      <Container className="py-10 @3xl:py-14">
        <nav aria-label="Migas" className="text-xs text-slate-500"><button type="button" onClick={() => go('home')} className="hover:underline">Inicio</button> / <span className="text-slate-800">{title}</span></nav>
        <h1 className="mt-2 font-sim-heading text-3xl font-extrabold tracking-tight @3xl:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </Container>
    </div>
  );
};

export function BrandsPage({ title }: { title: string }) {
  const { go, cfg } = useSim();
  return (
    <Annotated id="brands">
      <PageHead title={title} subtitle="Marcas de demostración. Cada marca abre su colección filtrada." />
      <Container className="py-10">
        {cfg.brand.identity === 'mono' && <p className="mb-4 rounded-sim bg-amber-50 p-3 text-xs text-amber-800">La identidad es monomarca: valida si esta página es necesaria.</p>}
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-3">
          {DEMO_BRANDS.map((b) => (
            <button key={b} type="button" onClick={() => go('catalog', { brand: b })} className="group flex flex-col items-center gap-3 rounded-sim-lg border border-slate-200 p-8 transition hover:border-brand">
              <BrandLogo name={b} />
              <span className="text-xs text-slate-500">{DEMO_PRODUCTS.filter((p) => p.brand === b).length} productos</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">Ver productos <ArrowRight size={12} /></span>
            </button>
          ))}
        </div>
      </Container>
    </Annotated>
  );
}

export function AboutPage({ title }: { title: string }) {
  const { cfg } = useSim();
  return (
    <Annotated id="page">
      <PageHead title={title} />
      <Container className="grid items-center gap-10 py-12 @3xl:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-sim-lg"><BannerArt seed={40} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full" /></div>
        <div>
          <h2 className="font-sim-heading text-2xl font-extrabold">Sobre {cfg.brand.storeName}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">Contenido institucional pendiente del cliente: historia, misión, propuesta de valor y equipo. Este texto es un marcador de posición.</p>
          <ul className="mt-5 space-y-2 text-sm">{['Valor 1 (por definir)', 'Valor 2 (por definir)', 'Valor 3 (por definir)'].map((v) => <li key={v} className="flex items-center gap-2"><Check size={16} className="text-brand" />{v}</li>)}</ul>
        </div>
      </Container>
    </Annotated>
  );
}

export function ContactPage({ title }: { title: string }) {
  const [sent, setSent] = useState(false);
  return (
    <Annotated id="contactForm">
      <PageHead title={title} subtitle="Escríbenos y te responderemos pronto." />
      <Container className="max-w-2xl py-10">
        {sent ? (
          <p role="status" className="rounded-sim-lg bg-emerald-50 p-5 text-sm text-emerald-800">Simulación: el mensaje se enviaría al correo de la tienda mediante el formulario de contacto de Shopify.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-3 @md:grid-cols-2">
            <input required aria-label="Nombre" placeholder="Nombre" className="h-11 rounded-sim border border-slate-300 px-3 text-sm" />
            <input required type="email" aria-label="Correo" placeholder="Correo" className="h-11 rounded-sim border border-slate-300 px-3 text-sm" />
            <input aria-label="Teléfono" placeholder="Teléfono" className="h-11 rounded-sim border border-slate-300 px-3 text-sm @md:col-span-2" />
            <textarea required aria-label="Mensaje" placeholder="¿En qué te ayudamos?" rows={5} className="rounded-sim border border-slate-300 px-3 py-2 text-sm @md:col-span-2" />
            <SimButton type="submit" className="@md:col-span-2">Enviar mensaje</SimButton>
          </form>
        )}
      </Container>
    </Annotated>
  );
}

export function BlogPage({ title }: { title: string }) {
  const { cfg } = useSim();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Annotated id="blog">
      <PageHead title={title} subtitle="Contenido educativo (artículos de ejemplo)." />
      <Container className="py-10">
        {open !== null ? (
          <article className="mx-auto max-w-2xl">
            <button type="button" onClick={() => setOpen(null)} className="mb-4 text-xs font-semibold text-brand">← Volver al blog</button>
            <div className="aspect-[16/8] overflow-hidden rounded-sim-lg"><BannerArt seed={20 + open} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full" /></div>
            <h2 className="mt-6 font-sim-heading text-3xl font-extrabold">{DEMO_ARTICLES[open].title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">Plantilla de artículo. El contenido de salud debe ser revisado por el cliente antes de publicarse.</p>
          </article>
        ) : (
          <div className="grid gap-6 @3xl:grid-cols-3">
            {DEMO_ARTICLES.map((a, i) => (
              <button key={a.title} type="button" onClick={() => setOpen(i)} className="group text-left">
                <div className="aspect-[16/10] overflow-hidden rounded-sim-lg"><BannerArt seed={20 + i} primary={cfg.brand.primary} accent={cfg.brand.accent} className="h-full w-full" label={false} /></div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand">{a.tag} · {a.minutes} min</p>
                <p className="font-sim-heading text-lg font-bold group-hover:underline">{a.title}</p>
              </button>
            ))}
          </div>
        )}
      </Container>
    </Annotated>
  );
}

export function FaqPage({ title }: { title: string }) {
  return (
    <Annotated id="faq">
      <PageHead title={title} />
      <Container className="py-10"><FaqList count={4} /><div className="mt-4 text-center"><DemoTag /></div></Container>
    </Annotated>
  );
}

const POLICIES = ['Privacidad y tratamiento de datos', 'Términos y condiciones', 'Envíos', 'Cambios y devoluciones'];

export function PoliciesPage({ title }: { title: string }) {
  const [i, setI] = useState(0);
  return (
    <Annotated id="page">
      <PageHead title={title} />
      <Container className="grid gap-6 py-10 @3xl:grid-cols-[240px_1fr]">
        <div role="tablist" aria-label="Políticas" className="flex gap-2 overflow-x-auto @3xl:flex-col">
          {POLICIES.map((p, k) => <button key={p} type="button" role="tab" aria-selected={i === k} onClick={() => setI(k)} className={cn('shrink-0 rounded-sim px-3 py-2 text-left text-sm font-semibold', i === k ? 'bg-brand text-on-brand' : 'bg-slate-100 hover:bg-slate-200')}>{p}</button>)}
        </div>
        <div role="tabpanel" className="rounded-sim-lg border border-slate-200 p-6">
          <h2 className="font-sim-heading text-xl font-bold">{POLICIES[i]}</h2>
          <p className="mt-3 text-sm text-slate-600">Contenido legal pendiente del cliente. Se publica en Shopify desde Configuración › Políticas.</p>
        </div>
      </Container>
    </Annotated>
  );
}

export function TrackingPage({ title }: { title: string }) {
  const { cfg, money } = useSim();
  const session = useSession();
  const param = useStudio((s) => s.ui.route.params?.n);
  const [q, setQ] = useState(param ?? '');
  const [searched, setSearched] = useState(param ?? '');
  const statuses = cfg.sap.orderStatuses.length ? cfg.sap.orderStatuses : ['Recibido', 'En preparación', 'Despachado (con guía)', 'Entregado'];
  const order = session.orders.find((o) => o.number.toLowerCase() === searched.toLowerCase());
  const current = order ? Math.min(1, statuses.length - 1) : -1;
  return (
    <Annotated id="tracking">
      <PageHead title={title} subtitle="Consulta el estado de tu pedido." />
      <Container className="max-w-2xl py-10">
        <form onSubmit={(e) => { e.preventDefault(); setSearched(q.trim()); }} className="flex gap-2">
          <label htmlFor="track" className="sr-only">Número de pedido</label>
          <input id="track" value={q} onChange={(e) => setQ(e.target.value)} placeholder={session.orders[0]?.number ?? 'Ej. DEMO-1001'} className="h-11 flex-1 rounded-sim border border-slate-300 px-3 text-sm" />
          <SimButton type="submit">Consultar</SimButton>
        </form>
        {!session.orders.length && <p className="mt-3 text-xs text-slate-500">Realiza un pedido simulado para probar el seguimiento.</p>}
        {searched && !order && <p className="mt-4 rounded-sim bg-rose-50 p-3 text-sm text-rose-700" role="status">No encontramos el pedido {searched} en esta simulación.</p>}
        {order && (
          <div className="mt-6 rounded-sim-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between"><p className="font-sim-heading font-bold">Pedido {order.number}</p><span className="text-sm">{money(order.total)}</span></div>
            <ol className="mt-5 space-y-4">
              {statuses.map((st, i) => (
                <li key={st} className="flex items-center gap-3">
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', i <= current ? 'bg-brand text-on-brand' : 'bg-slate-100 text-slate-400')}>{i <= current ? <Check size={14} /> : i + 1}</span>
                  <span className={cn('text-sm', i <= current ? 'font-semibold' : 'text-slate-400')}>{st}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[11px] text-sky-700">Estados provenientes de SAP (simulados). Depende de la integración.</p>
          </div>
        )}
      </Container>
    </Annotated>
  );
}

export function AccountPage({ title }: { title: string }) {
  const { cfg, money } = useSim();
  const session = useSession();
  const update = useStudio((s) => s.updateSubscription);
  const actions = cfg.subscriptions.customerActions;
  const toggleWishlist = useStudio((s) => s.toggleWishlist);
  const wish = (session.wishlist ?? []).map(getProduct).filter((x): x is NonNullable<typeof x> => !!x);
  const rate = Number(cfg.features?.['loyalty-points']?.params.rate) || 1;
  const points = session.orders.reduce((sum, o) => sum + Math.floor(o.total / 1000) * rate, 0);
  return (
    <Annotated id="account">
      <PageHead title={title} subtitle="Cuenta de cliente simulada." />
      <Container className="grid gap-8 py-10 @3xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-sim-heading text-lg font-bold">Pedidos</h2>
          {session.orders.length === 0 ? <p className="text-sm text-slate-500">Aún no hay pedidos simulados.</p> : (
            <ul className="divide-y divide-slate-100 rounded-sim-lg border border-slate-200">{session.orders.map((o) => <li key={o.number} className="flex justify-between p-3 text-sm"><span className="font-semibold">{o.number}</span><span>{money(o.total)}</span></li>)}</ul>
          )}
        </section>
        {cfg.features?.wishlist && (
          <Annotated id="wishlist" as="section">
            <h2 className="mb-3 font-sim-heading text-lg font-bold">Lista de deseos ({wish.length})</h2>
            {wish.length === 0 ? <p className="text-sm text-slate-500">Toca el corazón en un producto para guardarlo aquí.</p> : (
              <ul className="divide-y divide-slate-100 rounded-sim-lg border border-slate-200" data-testid="wishlist-items">
                {wish.map((p) => <li key={p.id} className="flex items-center gap-3 p-3 text-sm"><div className="h-12 w-12 overflow-hidden rounded bg-slate-50"><ProductArt product={p} className="h-full w-full" /></div><span className="flex-1 font-semibold">{p.name}</span><button type="button" onClick={() => toggleWishlist(p.id)} className="text-xs text-slate-500 underline">Quitar</button></li>)}
              </ul>
            )}
          </Annotated>
        )}
        {cfg.features?.['loyalty-points'] && (
          <Annotated id="loyalty" as="section">
            <h2 className="mb-3 font-sim-heading text-lg font-bold">Mis puntos</h2>
            <p className="rounded-sim-lg bg-brand-soft p-4 text-sm" data-testid="points-balance"><b className="font-sim-heading text-2xl">{points}</b> puntos acumulados con tus pedidos de demostración.</p>
          </Annotated>
        )}
        <Annotated id="subscriptions" as="section">
          <h2 className="mb-3 font-sim-heading text-lg font-bold">Suscripciones</h2>
          {!cfg.subscriptions.enabled ? <p className="text-sm text-slate-500">Suscripciones no habilitadas en el Discovery.</p> : session.subscriptions.length === 0 ? <p className="text-sm text-slate-500">Compra un producto con suscripción para gestionarla aquí.</p> : (
            <ul className="space-y-3" data-testid="subscriptions">
              {session.subscriptions.map((s) => {
                const p = getProduct(s.productId)!;
                return (
                  <li key={s.id} className="rounded-sim-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded bg-slate-50"><ProductArt product={p} className="h-full w-full" /></div>
                      <div className="flex-1 text-sm"><p className="font-bold">{p.name}</p><p className="text-xs text-slate-500">Cada {s.frequency} · {s.status === 'active' ? 'Activa' : s.status === 'paused' ? 'Pausada' : 'Cancelada'}{s.skipped ? ` · ${s.skipped} envío(s) saltado(s)` : ''}</p></div>
                    </div>
                    {s.status !== 'cancelled' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {actions.includes('pause') && <SimButton variant="outline" className="h-8 px-3 text-xs" onClick={() => update(s.id, { status: s.status === 'paused' ? 'active' : 'paused' })}>{s.status === 'paused' ? <><Play size={12} /> Reanudar</> : <><Pause size={12} /> Pausar</>}</SimButton>}
                        {actions.includes('skip') && <SimButton variant="outline" className="h-8 px-3 text-xs" onClick={() => update(s.id, { skipped: s.skipped + 1 })}><SkipForward size={12} /> Saltar envío</SimButton>}
                        {actions.includes('changeFrequency') && (
                          <label className="inline-flex items-center gap-1 text-xs"><Repeat size={12} />
                            <select aria-label="Cambiar frecuencia" value={s.frequency} onChange={(e) => update(s.id, { frequency: e.target.value })} className="h-8 rounded-sim border border-slate-300 px-2">{cfg.subscriptions.frequencies.map((f) => <option key={f}>{f}</option>)}</select>
                          </label>
                        )}
                        {actions.includes('cancel') && <SimButton variant="outline" className="h-8 px-3 text-xs" onClick={() => update(s.id, { status: 'cancelled' })}><XCircle size={12} /> Cancelar</SimButton>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-sky-700">El portal real lo provee la app de suscripciones seleccionada.</p>
        </Annotated>
      </Container>
    </Annotated>
  );
}

export function KitsPage({ title }: { title: string }) {
  const { cfg, money } = useSim();
  const addToCart = useStudio((s) => s.addToCart);
  const kits = kitsFor(cfg);
  return (
    <Annotated id="bundles">
      <PageHead title={title} subtitle={cfg.bundles.kits.length ? 'Kits definidos en el Discovery.' : 'Kits de ejemplo: defínelos en la fase 6.'} />
      <Container className="grid gap-6 py-10 @3xl:grid-cols-3">
        {!cfg.bundles.enabled && <p className="rounded-sim bg-amber-50 p-3 text-xs text-amber-800 @3xl:col-span-3">Los kits no están habilitados en el Discovery: esta página es una vista previa.</p>}
        {kits.map((k) => {
          const prods = k.productIds.map(getProduct).filter((x): x is NonNullable<typeof x> => !!x);
          const total = prods.reduce((a, p) => a + minPrice(p), 0);
          return (
            <div key={k.id} className="flex flex-col rounded-sim-lg border border-slate-200 p-5" data-testid="kit-card">
              <div className="grid grid-cols-3 gap-2">{prods.map((p) => <div key={p.id} className="aspect-square overflow-hidden rounded bg-slate-50"><ProductArt product={p} variant={3} className="h-full w-full" /></div>)}</div>
              <p className="mt-4 font-sim-heading text-lg font-bold">{k.name}</p>
              <ul className="mt-2 text-xs text-slate-600">{prods.map((p) => <li key={p.id}>· {p.name}</li>)}</ul>
              <p className="mt-3 text-sm"><b>{money(Math.round(total * (1 - k.discountPct / 100)))}</b> <span className="text-slate-400 line-through">{money(total)}</span> <span className="text-xs text-emerald-700">-{k.discountPct}%</span></p>
              <SimButton className="mt-4" onClick={() => prods.forEach((p) => addToCart({ productId: p.id, variantId: (p.presentations.find((v) => v.stock > 0) ?? p.presentations[0]).id, qty: 1, purchase: 'once', kitId: k.id }))}>Agregar kit</SimButton>
            </div>
          );
        })}
      </Container>
    </Annotated>
  );
}

export function CustomPage({ title, body }: { title: string; body?: string }) {
  return (
    <Annotated id="page">
      <PageHead title={title} />
      <Container className="max-w-3xl py-10"><p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{body}</p></Container>
    </Annotated>
  );
}

export function MissingPage({ id }: { id: string }) {
  const { go } = useSim();
  return (
    <Container className="flex flex-col items-center gap-3 py-24 text-center">
      <PackageSearch size={40} className="text-slate-400" />
      <p className="font-sim-heading text-xl font-bold">Esta página no existe en el sitio</p>
      <p className="max-w-sm text-sm text-slate-500">"{id}" fue retirada del mapa del sitio en el Discovery.</p>
      <SimButton onClick={() => go('home')}>Ir al inicio</SimButton>
    </Container>
  );
}
