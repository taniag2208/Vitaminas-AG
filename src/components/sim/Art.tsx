import type { DemoProduct } from '@/types/project';

/**
 * Ilustraciones vectoriales de demostración (empaques y composiciones).
 * Sustituyen la fotografía real mientras el cliente no cargue imágenes;
 * nunca se usan emojis como reemplazo de producto.
 */

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

export function ProductArt({ product, variant = 0, className }: { product: DemoProduct; variant?: number; className?: string }) {
  const h = product.hue;
  const bg = [hsl(h, 45, 94), hsl(h, 30, 90), hsl((h + 30) % 360, 40, 93), hsl(h, 20, 96)][variant % 4];
  const body = hsl(h, 55, variant === 2 ? 38 : 44);
  const cap = hsl(h, 30, 18);
  const label = '#fffdf8';
  const words = product.name.split(' ');
  const line1 = words.slice(0, 2).join(' ');
  const line2 = words.slice(2).join(' ');
  const zoom = variant === 3 ? 1.35 : 1;
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={`Imagen de demostración: ${product.name}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g-${product.id}-${variant}`} x1="0" x2="1">
          <stop offset="0" stopColor={body} />
          <stop offset="0.55" stopColor={hsl(h, 55, 52)} />
          <stop offset="1" stopColor={body} />
        </linearGradient>
        <radialGradient id={`s-${product.id}-${variant}`}>
          <stop offset="0" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={bg} />
      <circle cx="330" cy="70" r="90" fill={hsl(h, 50, 88)} opacity="0.7" />
      <ellipse cx="200" cy="338" rx="120" ry="16" fill={`url(#s-${product.id}-${variant})`} />
      <g transform={`translate(200 210) scale(${zoom}) translate(-200 -210)`}>
        {product.shape === 'bottle' && (
          <g>
            <rect x="160" y="70" width="80" height="34" rx="6" fill={cap} />
            <rect x="150" y="100" width="100" height="14" rx="4" fill={hsl(h, 25, 26)} />
            <rect x="128" y="112" width="144" height="222" rx="26" fill={`url(#g-${product.id}-${variant})`} />
            <rect x="138" y="166" width="124" height="118" rx="8" fill={label} />
          </g>
        )}
        {product.shape === 'jar' && (
          <g>
            <rect x="122" y="92" width="156" height="40" rx="10" fill={cap} />
            <rect x="112" y="126" width="176" height="208" rx="30" fill={`url(#g-${product.id}-${variant})`} />
            <rect x="124" y="168" width="152" height="118" rx="8" fill={label} />
          </g>
        )}
        {product.shape === 'pouch' && (
          <g>
            <path d="M120 96 h160 l14 236 q2 12 -12 12 h-164 q-14 0 -12 -12 z" fill={`url(#g-${product.id}-${variant})`} />
            <rect x="120" y="96" width="160" height="16" fill={cap} opacity="0.85" />
            <rect x="136" y="168" width="128" height="118" rx="8" fill={label} />
          </g>
        )}
        {(product.shape === 'box' || product.shape === 'tube') && (
          <g>
            <path d="M126 110 l40 -24 h108 l-40 24 z" fill={hsl(h, 45, 62)} />
            <path d="M234 110 l40 -24 v222 l-40 26 z" fill={hsl(h, 50, 32)} />
            <rect x="126" y="110" width="108" height="224" fill={`url(#g-${product.id}-${variant})`} />
            <rect x="134" y="166" width="92" height="118" rx="6" fill={label} />
          </g>
        )}
        <text x="200" y="196" textAnchor="middle" fontFamily="Manrope, Inter, sans-serif" fontSize="11" fontWeight="700" fill={hsl(h, 45, 32)} letterSpacing="1.5">
          {product.brand.toUpperCase()}
        </text>
        <text x="200" y="224" textAnchor="middle" fontFamily="Manrope, Inter, sans-serif" fontSize={line1.length > 12 ? 15 : 18} fontWeight="800" fill="#1d1d1f">
          {line1}
        </text>
        <text x="200" y="246" textAnchor="middle" fontFamily="Manrope, Inter, sans-serif" fontSize={line2.length > 14 ? 12 : 15} fontWeight="700" fill="#1d1d1f">
          {line2}
        </text>
        <rect x="170" y="262" width="60" height="12" rx="6" fill={hsl(h, 55, 44)} opacity="0.85" />
      </g>
      <text x="14" y="388" fontFamily="Inter, sans-serif" fontSize="10" fill="rgba(0,0,0,0.35)">Imagen de demostración</text>
    </svg>
  );
}

/** Composición abstracta para banners (sin fotografía). */
export function BannerArt({ seed = 0, primary, accent, className, label = true }: { seed?: number; primary: string; accent: string; className?: string; label?: boolean }) {
  const r = (n: number) => ((Math.sin(seed * 9.13 + n * 3.7) + 1) / 2);
  return (
    <svg viewBox="0 0 800 500" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Imagen de banner de demostración">
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={primary} stopOpacity="0.16" />
          <stop offset="1" stopColor={accent} stopOpacity="0.24" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="#faf8f4" />
      <rect width="800" height="500" fill={`url(#bg-${seed})`} />
      <circle cx={520 + r(1) * 140} cy={140 + r(2) * 80} r={150 + r(3) * 40} fill={accent} opacity="0.22" />
      <circle cx={240 + r(4) * 120} cy={380 + r(5) * 40} r={120} fill={primary} opacity="0.14" />
      <path d={`M0 ${400 + r(6) * 40} Q 200 ${330 + r(7) * 60} 400 ${400} T 800 ${380 + r(8) * 40} V500 H0Z`} fill={primary} opacity="0.18" />
      {/* hojas */}
      <g opacity="0.55" transform={`translate(${600 + r(9) * 60} ${300}) rotate(${-20 + r(10) * 40})`}>
        <path d="M0 0 C 40 -60 120 -60 150 0 C 120 50 40 50 0 0 Z" fill={primary} opacity="0.5" />
        <path d="M0 0 L150 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
      </g>
      {/* frascos */}
      <g transform="translate(470 170)">
        <rect x="0" y="40" width="110" height="200" rx="24" fill={primary} />
        <rect x="20" y="10" width="70" height="36" rx="8" fill="#1d1d1f" opacity="0.85" />
        <rect x="12" y="100" width="86" height="80" rx="6" fill="#fffdf8" />
        <rect x="130" y="90" width="120" height="150" rx="28" fill={accent} />
        <rect x="140" y="64" width="100" height="30" rx="8" fill="#1d1d1f" opacity="0.85" />
        <rect x="142" y="130" width="96" height="66" rx="6" fill="#fffdf8" />
      </g>
      {label && <text x="16" y="488" fontFamily="Inter, sans-serif" fontSize="12" fill="rgba(0,0,0,0.35)">Imagen de demostración — reemplazable</text>}
    </svg>
  );
}

/** Logotipo de marca de demostración (tipográfico). */
export function BrandLogo({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-2 text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-current font-sim-heading text-xs font-extrabold">{initials}</span>
        <span className="font-sim-heading text-sm font-extrabold tracking-tight">{name}</span>
      </div>
    </div>
  );
}
