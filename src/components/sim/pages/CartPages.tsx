import { useState } from 'react';
import { CheckCircle2, Info, Lock, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { DEMO_DISCOUNT_CODES, DEMO_PRODUCTS, getProduct, totalStock } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useSession, useStudio, type SimSession } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import { ProductArt } from '../Art';
import { Container, SimButton } from '../Common';
import { Annotated, SimPortal, useSim } from '../SimContext';
import { findKit } from './kits';

export function computeCart(cfg: ProjectConfig, session: SimSession) {
  const lines = session.cart
    .map((l) => {
      const product = getProduct(l.productId);
      const variant = product?.presentations.find((v) => v.id === l.variantId);
      if (!product || !variant) return null;
      let unit = variant.price;
      if (l.purchase === 'subscription') unit = Math.round(unit * (1 - cfg.subscriptions.discountPct / 100));
      const kit = findKit(cfg, l.kitId);
      if (kit) unit = Math.round(unit * (1 - kit.discountPct / 100));
      return { ...l, product, variant, unit, total: unit * l.qty, kit };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const pct = session.discountCode ? DEMO_DISCOUNT_CODES[session.discountCode] ?? 0 : 0;
  const discount = Math.round(subtotal * (pct / 100));
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const threshold = cfg.cart.freeShippingThreshold;
  const freeShipping = cfg.cart.freeShippingBar && subtotal - discount >= threshold;
  return { lines, subtotal, discount, total: subtotal - discount, count, freeShipping, remaining: Math.max(0, threshold - (subtotal - discount)) };
}

const PRE_INFO: Record<string, string> = {
  shippingEstimate: 'El costo de envío se calcula en el checkout según la dirección.',
  taxesNote: 'Impuestos incluidos según configuración de Shopify (por confirmar).',
  deliveryTime: 'Tiempo de entrega estimado: por definir con la transportadora.',
  returnPolicy: 'Consulta la política de devoluciones antes de pagar.',
  securePayment: 'Pago procesado en el checkout seguro de Shopify.',
};

export function CartContents({ onCheckout, compact }: { onCheckout: () => void; compact?: boolean }) {
  const { cfg, money, go } = useSim();
  const session = useSession();
  const { setQty, removeLine, applyCode, addToCart } = useStudio();
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const c = computeCart(cfg, session);
  const recs = DEMO_PRODUCTS.filter((p) => totalStock(p) > 0 && !session.cart.some((l) => l.productId === p.id)).slice(0, 3);

  if (!c.lines.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand"><ShoppingBag size={24} /></span>
        <p className="font-sim-heading text-lg font-bold">Tu carrito está vacío</p>
        <p className="text-sm text-slate-500">Agrega productos desde el catálogo.</p>
        <SimButton onClick={() => go('catalog')}>Ver productos</SimButton>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-1 flex-col', !compact && '@3xl:grid @3xl:grid-cols-[1fr_360px] @3xl:gap-10')}>
      <div className="flex flex-col">
        {cfg.cart.freeShippingBar && (
          <div className="border-b border-slate-100 px-4 py-3" data-testid="free-shipping-bar">
            <p className="text-xs font-medium">{c.freeShipping ? '¡Tienes envío gratis!' : <>Te faltan <b>{money(c.remaining)}</b> para envío gratis</>}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, ((c.subtotal - c.discount) / cfg.cart.freeShippingThreshold) * 100)}%` }} /></div>
          </div>
        )}
        <ul className="divide-y divide-slate-100" data-testid="cart-lines">
          {c.lines.map((l) => (
            <li key={l.key} className="flex gap-3 px-4 py-4" data-testid="cart-line">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sim bg-slate-50"><ProductArt product={l.product} className="h-full w-full" /></div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-bold leading-snug">{l.product.name}</p>
                  <button type="button" aria-label={`Eliminar ${l.product.name}`} onClick={() => removeLine(l.key)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
                <p className="text-xs text-slate-500">{l.variant.label}{l.purchase === 'subscription' && ` · Suscripción cada ${l.frequency}`}{l.kit && ` · ${l.kit.name}`}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex h-8 items-center rounded-sim border border-slate-300">
                    <button type="button" aria-label="Disminuir" onClick={() => setQty(l.key, l.qty - 1)} className="grid h-full w-8 place-items-center"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm" data-testid="line-qty">{l.qty}</span>
                    <button type="button" aria-label="Aumentar" onClick={() => setQty(l.key, l.qty + 1)} className="grid h-full w-8 place-items-center"><Plus size={14} /></button>
                  </div>
                  <span className="text-sm font-bold">{money(l.total)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {cfg.cart.recommendations && recs.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Complementa tu compra</p>
            <div className="flex flex-col gap-2">
              {recs.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-sim border border-slate-100 p-2">
                  <div className="h-12 w-12 overflow-hidden rounded bg-slate-50"><ProductArt product={p} className="h-full w-full" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{p.name}</p><p className="text-xs text-slate-500">{money(p.presentations[0].price)}</p></div>
                  <button type="button" onClick={() => addToCart({ productId: p.id, variantId: (p.presentations.find((v) => v.stock > 0) ?? p.presentations[0]).id, qty: 1, purchase: 'once' })} className="rounded-sim border border-brand px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-on-brand">Agregar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={cn('mt-auto flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4', !compact && '@3xl:mt-0 @3xl:h-fit @3xl:rounded-sim-lg @3xl:border @3xl:p-5')}>
        {cfg.cart.discountCodes && (
          <form onSubmit={(e) => { e.preventDefault(); setCodeMsg(applyCode(code) ? 'Código aplicado' : 'Código no válido (prueba DEMO10)'); }} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <input aria-label="Código de descuento" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de descuento" className="h-10 flex-1 rounded-sim border border-slate-300 px-3 text-sm uppercase" />
              <SimButton type="submit" variant="outline" className="h-10 px-4">Aplicar</SimButton>
            </div>
            {codeMsg && <p className={cn('text-xs', codeMsg === 'Código aplicado' ? 'text-emerald-700' : 'text-rose-600')} role="status">{codeMsg}</p>}
          </form>
        )}
        {cfg.cart.orderNotes && <textarea aria-label="Notas del pedido" placeholder="Notas del pedido (opcional)" rows={2} className="rounded-sim border border-slate-300 px-3 py-2 text-sm" />}
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd data-testid="cart-subtotal">{money(c.subtotal)}</dd></div>
          {c.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Descuento ({session.discountCode})</dt><dd>-{money(c.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-slate-500">Envío</dt><dd>{c.freeShipping ? 'Gratis' : 'Se calcula en el checkout'}</dd></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><dt>Total estimado</dt><dd data-testid="cart-total">{money(c.total)}</dd></div>
        </dl>
        {cfg.cart.preCheckoutInfo.map((k) => <p key={k} className="flex items-start gap-1.5 text-[11px] text-slate-500"><Info size={12} className="mt-0.5 shrink-0" />{PRE_INFO[k]}</p>)}
        <SimButton full className="h-12" onClick={onCheckout}><Lock size={16} /> Ir a pagar</SimButton>
        <p className="text-center text-[10px] text-slate-400">Valores de demostración</p>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { go } = useSim();
  const session = useSession();
  const setCartOpen = useStudio((s) => s.setCartOpen);
  const { cfg } = useSim();
  const count = computeCart(cfg, session).count;
  if (!session.cartOpen || cfg.cart.type !== 'drawer') return null;
  return (
    <SimPortal>
      <div className="absolute inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label="Carrito">
        <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
        <Annotated id="cart" as="aside" className="animate-slide-right relative flex h-full w-[92%] max-w-md flex-col bg-white shadow-2xl">
          <div className="flex h-full flex-col" data-testid="cart-drawer">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <p className="font-sim-heading text-lg font-bold">Tu carrito ({count})</p>
              <button type="button" aria-label="Cerrar carrito" onClick={() => setCartOpen(false)}><X size={22} /></button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <CartContents compact onCheckout={() => { setCartOpen(false); go('checkout'); }} />
            </div>
          </div>
        </Annotated>
      </div>
    </SimPortal>
  );
}

export function CartPage() {
  const { go } = useSim();
  return (
    <Container className="py-8 @3xl:py-12">
      <h1 className="mb-6 font-sim-heading text-3xl font-extrabold">Carrito</h1>
      <Annotated id="cart">
        <div data-testid="cart-page" className="flex flex-col"><CartContents onCheckout={() => go('checkout')} /></div>
      </Annotated>
    </Container>
  );
}

export function CheckoutPage() {
  const { cfg, money, go } = useSim();
  const session = useSession();
  const placeOrder = useStudio((s) => s.placeOrder);
  const c = computeCart(cfg, session);
  const [pay, setPay] = useState(cfg.cart.paymentMethods[0] ?? '');
  if (!c.lines.length) {
    return <Container className="py-16 text-center"><p className="font-sim-heading text-xl font-bold">No hay productos para pagar</p><SimButton className="mt-4" onClick={() => go('catalog')}>Ir al catálogo</SimButton></Container>;
  }
  return (
    <div className="bg-slate-50">
      <Annotated id="checkout">
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900" role="note">
          <b>Simulación.</b> En producción esta etapa es el <b>checkout nativo de Shopify</b>. Aquí no se procesan pagos ni se crean pedidos reales.
        </div>
      </Annotated>
      <Container className="grid gap-6 py-8 @3xl:grid-cols-[1fr_380px]">
        <form className="flex flex-col gap-5 rounded-sim-lg bg-white p-5 @3xl:p-8" onSubmit={(e) => { e.preventDefault(); const o = placeOrder(c.total); go('order', { n: o.number }); }}>
          <fieldset className="grid gap-3 @md:grid-cols-2">
            <legend className="mb-2 font-sim-heading font-bold">Contacto y entrega (opcional en la simulación)</legend>
            <input aria-label="Correo" placeholder="Correo" className="h-11 rounded-sim border border-slate-300 px-3 text-sm @md:col-span-2" />
            <input aria-label="Nombre" placeholder="Nombre" className="h-11 rounded-sim border border-slate-300 px-3 text-sm" />
            <input aria-label="Ciudad" placeholder="Ciudad" className="h-11 rounded-sim border border-slate-300 px-3 text-sm" />
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-sim-heading font-bold">Medio de pago esperado</legend>
            {cfg.cart.paymentMethods.length === 0 && <p className="text-sm text-slate-500">Medios de pago por definir (fase 5).</p>}
            {cfg.cart.paymentMethods.map((m) => (
              <label key={m} className={cn('flex items-center gap-3 rounded-sim border-2 p-3 text-sm', pay === m ? 'border-brand' : 'border-slate-200')}>
                <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} className="accent-[var(--sim-primary)]" /> {m}
                <span className="ml-auto text-[11px] text-sky-700">sujeto a pasarela</span>
              </label>
            ))}
          </fieldset>
          <SimButton type="submit" className="h-12" full>Simular pedido · {money(c.total)}</SimButton>
        </form>
        <aside className="h-fit rounded-sim-lg bg-white p-5">
          <p className="mb-3 font-sim-heading font-bold">Resumen</p>
          <ul className="space-y-2 text-sm">{c.lines.map((l) => <li key={l.key} className="flex justify-between gap-2"><span className="truncate">{l.qty} × {l.product.name}</span><span>{money(l.total)}</span></li>)}</ul>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold"><span>Total</span><span>{money(c.total)}</span></div>
        </aside>
      </Container>
    </div>
  );
}

export function OrderPage() {
  const { cfg, money, go } = useSim();
  const session = useSession();
  const n = useStudio((s) => s.ui.route.params?.n);
  const order = session.orders.find((o) => o.number === n) ?? session.orders[0];
  if (!order) return <Container className="py-16 text-center"><p>No hay pedidos simulados.</p></Container>;
  return (
    <Container className="max-w-2xl py-12 text-center">
      <CheckCircle2 size={48} className="mx-auto text-brand" />
      <h1 className="mt-4 font-sim-heading text-3xl font-extrabold">¡Gracias por tu compra!</h1>
      <p className="mt-2 text-slate-600">Pedido de demostración <b data-testid="order-number">{order.number}</b> · {money(order.total)}</p>
      <div className="mt-6 rounded-sim-lg border border-sky-200 bg-sky-50 p-4 text-left text-xs text-sky-900">
        En producción, el pedido se registra en Shopify y se envía a SAP según la regla: <b>{cfg.sap.orderSync || 'por definir'}</b>. Los estados posteriores ({cfg.sap.orderStatuses.join(', ') || 'por definir'}) regresan desde SAP.
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <SimButton variant="outline" onClick={() => go('tracking', { n: order.number })}>Seguir pedido</SimButton>
        <SimButton onClick={() => go('home')}>Seguir comprando</SimButton>
      </div>
    </Container>
  );
}
