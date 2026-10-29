import { Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { minPrice, totalStock } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useSession, useStudio } from '@/store/useStudio';
import { useSimUi } from '@/store/useSimUi';
import type { DemoProduct, SectionProps } from '@/types/project';
import { ProductArt } from './Art';
import { useSim } from './SimContext';

export const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mx-auto w-full max-w-6xl px-4 @3xl:px-8', className)}>{children}</div>
);

export const toneCls = (tone: SectionProps['tone']) =>
  ({ light: 'bg-white text-slate-900', muted: 'bg-brand-soft text-slate-900', brand: 'bg-brand text-on-brand', dark: 'bg-slate-900 text-white' })[tone];

export function SectionHeading({ title, subtitle, align = 'center', action }: { title?: string; subtitle?: string; align?: 'left' | 'center'; action?: ReactNode }) {
  if (!title && !subtitle) return null;
  return (
    <div className={cn('mb-6 flex flex-col gap-2 @3xl:mb-8', align === 'center' ? 'items-center text-center' : 'items-start', !!action && '@3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:text-left')}>
      <div>
        {title && <h2 className="font-sim-heading text-2xl font-extrabold tracking-tight @3xl:text-3xl">{title}</h2>}
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm opacity-75 @3xl:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SimButton({ children, onClick, variant = 'primary', className, full, type = 'button', disabled, ariaLabel }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'accent' | 'light'; className?: string; full?: boolean; type?: 'button' | 'submit'; disabled?: boolean; ariaLabel?: string }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-sim px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-on-brand hover:brightness-110',
        variant === 'accent' && 'bg-accent text-on-accent hover:brightness-105',
        variant === 'outline' && 'border-2 border-brand text-brand hover:bg-brand hover:text-on-brand',
        variant === 'light' && 'bg-white text-slate-900 hover:bg-slate-100',
        full && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Stars({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500" aria-label={`Valoración ${value} de 5`}>
      <span className="inline-flex text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.8} />
        ))}
      </span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return <span className={cn('inline-flex items-center rounded bg-slate-900/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500', className)}>Dato de ejemplo</span>;
}

export function ProductCard({ product }: { product: DemoProduct }) {
  const { cfg, money, go } = useSim();
  const addToCart = useStudio((s) => s.addToCart);
  const setQuickView = useSimUi((s) => s.setQuickView);
  const toggleWishlist = useStudio((s) => s.toggleWishlist);
  const session = useSession();
  const wished = session.wishlist?.includes(product.id) ?? false;
  const b2b = !!cfg.features?.['b2b-price-lists'] && !!session.b2bMode;
  const f = cfg.catalog.cardFields;
  const first = product.presentations.find((v) => v.stock > 0) ?? product.presentations[0];
  const price = minPrice(product);
  const cmp = first.compareAt;
  const pct = cmp ? Math.round((1 - first.price / cmp) * 100) : 0;
  const out = totalStock(product) === 0;
  const style = cfg.catalog.cardStyle;
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-sim-lg bg-white text-slate-900 transition',
        style === 'bordered' && 'border border-slate-200 hover:border-slate-300',
        style === 'elevated' && 'shadow-[0_2px_14px_rgba(15,23,42,0.08)] hover:shadow-[0_10px_30px_rgba(15,23,42,0.14)]',
      )}
      data-testid="product-card"
    >
      <button type="button" onClick={() => go('product', { id: product.id })} className="relative block aspect-square overflow-hidden bg-slate-50 text-left" aria-label={`Ver ${product.name}`}>
        <ProductArt product={product} className="h-full w-full transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {f.includes('discount') && pct > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent">-{pct}%</span>}
          {f.includes('badges') && product.badges.filter((b) => !b.startsWith('-')).map((b) => <span key={b} className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm">{b}</span>)}
          {out && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">Agotado</span>}
        </div>
      </button>
      {cfg.features?.wishlist && (
        <button type="button" aria-pressed={wished} onClick={() => toggleWishlist(product.id)} className={cn('absolute right-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-md transition', f.includes('quickView') ? 'top-12' : 'top-2', wished ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500')} aria-label={wished ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`} data-testid="wishlist-toggle">
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      )}
      {f.includes('quickView') && (
        <button type="button" onClick={() => setQuickView(product.id)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-700 shadow-md transition hover:text-brand @3xl:opacity-0 @3xl:group-hover:opacity-100" aria-label={`Vista rápida de ${product.name}`}>
          <Eye size={16} />
        </button>
      )}
      <div className={cn('flex flex-1 flex-col gap-1 p-3 @3xl:p-4', style === 'minimal' && 'px-0.5')}>
        {f.includes('brand') && <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">{product.brand}</span>}
        <button type="button" onClick={() => go('product', { id: product.id })} className="text-left font-sim-heading text-sm font-bold leading-snug hover:underline @3xl:text-[15px]">
          {product.name}
        </button>
        {f.includes('format') && <span className="text-xs text-slate-500">{product.format} · {product.presentations.length > 1 ? `${product.presentations.length} presentaciones` : product.presentations[0].label}</span>}
        {f.includes('rating') && <Stars value={product.rating} count={product.reviews} />}
        {f.includes('price') && (
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="font-bold">{product.presentations.length > 1 ? 'Desde ' : ''}{money(b2b ? Math.round(price * 0.8) : price)}</span>{b2b && <span className="text-[10px] font-semibold text-slate-500">distribuidor</span>}
            {f.includes('compareAt') && cmp && <span className="text-xs text-slate-400 line-through">{money(cmp)}</span>}
          </div>
        )}
        {f.includes('addToCart') && (
          <button
            type="button"
            disabled={out}
            onClick={() => addToCart({ productId: product.id, variantId: first.id, qty: 1, purchase: 'once' })}
            className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-sim border border-brand text-xs font-semibold text-brand transition hover:bg-brand hover:text-on-brand disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <ShoppingBag size={14} /> {out ? 'Agotado' : 'Agregar'}
          </button>
        )}
      </div>
    </article>
  );
}

/** Clases de cuadrícula (las clases deben existir literalmente para Tailwind). */
export const gridCols = (desktop: number, mobile = 2) =>
  cn(
    'grid gap-3 @3xl:gap-5',
    mobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
    { 1: '@3xl:grid-cols-1', 2: '@3xl:grid-cols-2', 3: '@3xl:grid-cols-3', 4: '@3xl:grid-cols-4', 5: '@3xl:grid-cols-5', 6: '@3xl:grid-cols-6', 7: '@3xl:grid-cols-7', 8: '@3xl:grid-cols-8' }[desktop] ?? '@3xl:grid-cols-4',
  );

export function Carousel({ children, label, cols = 4 }: { children: ReactNode[]; label: string; cols?: number }) {
  return (
    <div role="region" aria-label={label} style={{ ['--cw' as string]: `calc((100% - ${(cols - 1) * 1.25}rem) / ${cols + 0.3})` }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 @3xl:mx-0 @3xl:gap-5 @3xl:px-0">
      {children.map((c, i) => (
        <div key={i} className="w-[46%] shrink-0 snap-start @3xl:w-(--cw)">
          {c}
        </div>
      ))}
    </div>
  );
}
