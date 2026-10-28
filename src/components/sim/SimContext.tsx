import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { getAnnotation, TECH_CLASS_LABEL } from '@/config/annotations';
import { cn, formatMoney } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import type { Device } from '@/store/useStudio';

interface SimCtx {
  cfg: ProjectConfig;
  device: Device;
  scrollRef: RefObject<HTMLDivElement | null>;
  overlayEl: HTMLDivElement | null;
  money: (v: number) => string;
  go: (page: string, params?: Record<string, string>) => void;
}

const Ctx = createContext<SimCtx | null>(null);

export const SimProvider = ({ value, children }: { value: SimCtx; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;

export const useSim = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSim fuera de SimProvider');
  return v;
};

/** Renderiza dentro de la capa de overlays del dispositivo simulado (no del navegador). */
export function SimPortal({ children }: { children: ReactNode }) {
  const { overlayEl } = useSim();
  return overlayEl ? createPortal(children, overlayEl) : null;
}

export const makeMoney = (cfg: ProjectConfig) => (v: number) => formatMoney(v, cfg.brand.currency, cfg.brand.locale);

/**
 * Envoltorio de anotación técnica. Con "Ver implementación Shopify" activo,
 * resalta el componente y permite abrir su especificación.
 */
export function Annotated({ id, children, className, label, reqId, as: Tag = 'div' }: { id: string; children: ReactNode; className?: string; label?: string; reqId?: string; as?: 'div' | 'section' | 'aside' | 'header' | 'footer' }) {
  const on = useStudio((s) => s.ui.annotations);
  const selected = useStudio((s) => s.ui.selectedAnnotation);
  const setUi = useStudio((s) => s.setUi);
  const { cfg } = useSim();
  if (!on) return <Tag className={className} data-focus={id}>{children}</Tag>;
  const spec = getAnnotation(id, cfg);
  const value = `${id}${reqId ? `|${reqId}` : ''}`;
  const active = selected === value;
  return (
    <Tag className={cn(className, !/\b(absolute|fixed|sticky)\b/.test(className ?? '') && 'relative', 'outline-2 -outline-offset-2 outline-dashed', active ? 'outline-amber-500' : 'outline-amber-400/70')} data-annotation={id} data-focus={id}>
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setUi({ selectedAnnotation: value });
        }}
        className="absolute right-1.5 top-1.5 z-30 flex max-w-[260px] items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-left font-sans text-[11px] font-bold leading-tight text-amber-950 shadow-lg ring-2 ring-white hover:bg-amber-300"
        aria-label={`Ver implementación Shopify: ${label ?? spec?.name ?? id}`}
      >
        <span className="truncate">{label ?? spec?.name ?? id}</span>
        {spec && <span className="shrink-0 rounded bg-amber-950/10 px-1 font-semibold">{TECH_CLASS_LABEL[spec.classes[0]]}{spec.classes.length > 1 ? ` +${spec.classes.length - 1}` : ''}</span>}
      </button>
    </Tag>
  );
}
