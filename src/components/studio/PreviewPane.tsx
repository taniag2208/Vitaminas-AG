import { useEffect, useRef, useState } from 'react';
import { Code2, Maximize2, Minimize2, Monitor, RotateCcw, Smartphone } from 'lucide-react';
import { Simulator } from '@/components/sim/Simulator';
import { buildSitemap } from '@/engine/sitemap';
import { cn } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import { Segmented } from '../ui';
import { AnnotationPanel } from './AnnotationPanel';

const DESKTOP_WIDTH = 1280;
const QUICK: [string, string][] = [['home', 'Home'], ['catalog', 'Catálogo'], ['product', 'Producto'], ['cart', 'Carrito'], ['checkout', 'Checkout']];

export function PreviewPane({ cfg }: { cfg: ProjectConfig }) {
  const project = cfg;
  const { ui, setUi, navigate, resetSession } = useStudio();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const routes = buildSitemap(project).flatMap((n) => [n, ...(n.children ?? [])]).filter((n) => n.kind !== 'external');
  const currentValue = ui.route.params?.category ? `catalog?category=${encodeURIComponent(ui.route.params.category)}` : ui.route.page;
  const onRoute = (v: string) => {
    const [page, qs] = v.split('?');
    const params = qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined;
    navigate(page, params);
  };

  const scale = Math.min(1, size.w / DESKTOP_WIDTH);
  const mobileH = Math.min(size.h - 32, 844);

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col bg-slate-100', ui.fullscreen && 'fixed inset-0 z-50')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Pantallas principales">
          {QUICK.map(([page, label]) => (
            <button key={page} type="button" role="tab" aria-selected={ui.route.page === page} onClick={() => navigate(page)} className={cn('h-7 rounded-md px-2.5 text-xs font-medium', ui.route.page === page ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} data-testid={`quick-${page}`}>{label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <span className="sr-only">Otras páginas</span>
          <select aria-label="Página del simulador" value={routes.some((r) => r.route === currentValue) ? currentValue : ''} onChange={(e) => onRoute(e.target.value)} className="h-8 max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800" data-testid="route-select">
            {!routes.some((r) => r.route === currentValue) && <option value="">{ui.route.page}{ui.route.params ? ' (filtrado)' : ''}</option>}
            {routes.map((r) => <option key={r.id} value={r.route}>{r.kind === 'collection' && r.route.includes('?') ? `  — ${r.title}` : r.title}</option>)}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Segmented size="sm" label="Dispositivo" value={ui.device} onChange={(device) => setUi({ device })} options={[{ value: 'desktop', label: <><Monitor size={14} /> <span className="hidden sm:inline">Desktop</span></>, title: 'Vista desktop' }, { value: 'mobile', label: <><Smartphone size={14} /> <span className="hidden sm:inline">Móvil</span></>, title: 'Vista móvil' }]} />
          <button type="button" aria-pressed={ui.annotations} onClick={() => setUi({ annotations: !ui.annotations, selectedAnnotation: null })} className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition', ui.annotations ? 'bg-amber-400 text-amber-950 shadow-inner' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')} data-testid="toggle-annotations">
            <Code2 size={14} /> <span className="hidden 2xl:inline">Ver implementación Shopify</span><span className="2xl:hidden">Shopify</span>
          </button>
          <button type="button" title="Reiniciar sesión demo (carrito, pedidos, suscripciones)" aria-label="Reiniciar sesión demo" onClick={resetSession} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><RotateCcw size={14} /></button>
          <button type="button" title={ui.fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} aria-label={ui.fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={() => setUi({ fullscreen: !ui.fullscreen })} className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-white hover:bg-ink-800" data-testid="toggle-fullscreen">
            {ui.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <p className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-center text-[11px] text-amber-900" data-testid="preview-disclaimer">Vista previa construida con tus respuestas · datos ficticios · no es una tienda Shopify real</p>
      <div className="relative flex min-h-0 flex-1">
        <div ref={box} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {ui.device === 'desktop' ? (
            <div className="absolute left-0 top-0 origin-top-left bg-white shadow-sm" style={{ width: DESKTOP_WIDTH, height: size.h / scale, transform: `scale(${scale})` }}>
              <Simulator cfg={project} device="desktop" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <div className="rounded-[46px] bg-ink-950 p-3 shadow-2xl ring-1 ring-black/20" style={{ height: mobileH }}>
                <div className="relative h-full w-[390px] overflow-hidden rounded-[34px] bg-white">
                  <div className="absolute left-1/2 top-2 z-[60] h-5 w-24 -translate-x-1/2 rounded-full bg-ink-950" aria-hidden />
                  <div className="h-full pt-7">
                    <Simulator cfg={project} device="mobile" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {ui.annotations && ui.selectedAnnotation && <AnnotationPanel cfg={project} />}
      </div>
    </div>
  );
}
