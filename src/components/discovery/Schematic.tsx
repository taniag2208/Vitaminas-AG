import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Miniesquemas que ilustran cada alternativa visual del Discovery. */
const B = ({ className }: { className?: string }) => <div className={cn('rounded-[2px] bg-slate-300', className)} />;
const P = ({ className }: { className?: string }) => <div className={cn('rounded-[2px] bg-studio-400', className)} />;
const Frame = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('flex h-full w-full flex-col gap-1 p-1.5', className)}>{children}</div>;
const Row = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('flex gap-1', className)}>{children}</div>;
const Grid = ({ n, className }: { n: number; className?: string }) => (
  <div className={cn('grid flex-1 gap-1', className)} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
    {Array.from({ length: n * 2 }, (_, i) => <B key={i} className="min-h-2" />)}
  </div>
);

const MAP: Record<string, ReactNode> = {
  mono: <Frame><P className="h-2 w-6" /><B className="flex-1" /><Row><B className="h-3 flex-1" /><B className="h-3 flex-1" /></Row></Frame>,
  multi: <Frame><P className="h-2 w-6" /><Row className="flex-1">{[0, 1, 2, 3].map((i) => <div key={i} className="grid flex-1 place-items-center rounded-full border-2 border-slate-300" />)}</Row><Row><B className="h-3 flex-1" /><B className="h-3 flex-1" /></Row></Frame>,
  'radius-none': <div className="grid h-full place-items-center"><P className="h-5 w-14 rounded-none" /></div>,
  'radius-soft': <div className="grid h-full place-items-center"><P className="h-5 w-14 rounded-md" /></div>,
  'radius-round': <div className="grid h-full place-items-center"><P className="h-5 w-14 rounded-full" /></div>,
  'menu-simple': <Frame><Row className="items-center"><P className="h-2 w-4" /><B className="h-1.5 w-4" /><B className="h-1.5 w-4" /><B className="h-1.5 w-4" /></Row><B className="flex-1 opacity-40" /></Frame>,
  'menu-dropdown': <Frame><Row className="items-center"><P className="h-2 w-4" /><B className="h-1.5 w-4" /><B className="h-1.5 w-4" /></Row><div className="ml-6 flex w-8 flex-col gap-0.5 rounded border border-slate-300 bg-white p-0.5">{[0, 1, 2].map((i) => <B key={i} className="h-1" />)}</div></Frame>,
  'menu-mega': <Frame><Row className="items-center"><P className="h-2 w-4" /><B className="h-1.5 w-4" /><B className="h-1.5 w-4" /></Row><div className="flex flex-1 gap-1 rounded border border-slate-300 bg-white p-1">{[0, 1, 2].map((i) => <div key={i} className="flex flex-1 flex-col gap-0.5">{[0, 1, 2].map((k) => <B key={k} className="h-1" />)}</div>)}<P className="flex-1 opacity-60" /></div></Frame>,
  'logo-left': <Frame><Row className="items-center"><P className="h-2.5 w-6" /><B className="ml-2 h-1.5 w-12" /></Row></Frame>,
  'logo-center': <Frame><Row className="items-center justify-between"><B className="h-1.5 w-8" /><P className="h-2.5 w-6" /><B className="h-1.5 w-4" /></Row></Frame>,
  'cols-2': <Frame><Grid n={2} /></Frame>,
  'cols-3': <Frame><Grid n={3} /></Frame>,
  'cols-4': <Frame><Grid n={4} /></Frame>,
  'cols-5': <Frame><Grid n={5} /></Frame>,
  'mcols-1': <Frame className="mx-auto w-8"><Grid n={1} /></Frame>,
  'mcols-2': <Frame className="mx-auto w-10"><Grid n={2} /></Frame>,
  'card-minimal': <Frame className="items-center"><B className="h-8 w-10" /><B className="h-1 w-10" /><P className="h-1 w-6" /></Frame>,
  'card-bordered': <Frame className="items-center"><div className="flex w-12 flex-col gap-0.5 rounded border border-slate-400 p-0.5"><B className="h-7" /><B className="h-1" /><P className="h-1 w-6" /></div></Frame>,
  'card-elevated': <Frame className="items-center"><div className="flex w-12 flex-col gap-0.5 rounded bg-white p-0.5 shadow-md"><B className="h-7" /><B className="h-1" /><P className="h-1 w-6" /></div></Frame>,
  'filters-sidebar': <Frame><Row className="flex-1"><div className="flex w-5 flex-col gap-0.5">{[0, 1, 2, 3].map((i) => <P key={i} className="h-1 opacity-70" />)}</div><Grid n={3} /></Row></Frame>,
  'filters-horizontal': <Frame><Row>{[0, 1, 2].map((i) => <P key={i} className="h-1.5 w-5 rounded-full opacity-70" />)}</Row><Grid n={4} /></Frame>,
  'filters-dropdown': <Frame><P className="h-1.5 w-6 opacity-70" /><div className="grid grid-cols-3 gap-0.5 rounded border border-studio-200 p-0.5">{[0, 1, 2].map((i) => <B key={i} className="h-1.5" />)}</div><Grid n={4} /></Frame>,
  'mfilter-drawer': <Frame className="mx-auto w-12"><Row className="flex-1"><div className="w-6 rounded-sm bg-white p-0.5 shadow">{[0, 1, 2].map((i) => <P key={i} className="mb-0.5 h-1 opacity-70" />)}</div><B className="flex-1 opacity-40" /></Row></Frame>,
  'mfilter-accordion': <Frame className="mx-auto w-12"><div className="flex flex-col gap-0.5 rounded border border-slate-300 p-0.5">{[0, 1].map((i) => <P key={i} className="h-1 opacity-70" />)}</div><Grid n={2} /></Frame>,
  'pdp-split': <Frame><Row className="flex-1"><B className="flex-1" /><div className="flex flex-1 flex-col gap-0.5"><B className="h-1.5" /><B className="h-1 w-6" /><P className="mt-auto h-2" /></div></Row></Frame>,
  'pdp-wide': <Frame><Row className="flex-1"><B className="flex-[1.8]" /><div className="flex flex-1 flex-col gap-0.5"><B className="h-1.5" /><P className="mt-auto h-2" /></div></Row></Frame>,
  'pdp-stacked': <Frame className="items-center"><B className="h-8 w-14" /><B className="h-1.5 w-14" /><P className="h-2 w-14" /></Frame>,
  'gallery-thumbs': <Frame><B className="flex-1" /><Row>{[0, 1, 2, 3].map((i) => <B key={i} className="h-2.5 flex-1" />)}</Row></Frame>,
  'gallery-grid': <Frame><div className="grid flex-1 grid-cols-2 gap-1">{[0, 1, 2, 3].map((i) => <B key={i} />)}</div></Frame>,
  'gallery-slider': <Frame><B className="flex-1" /><Row className="justify-center">{[0, 1, 2].map((i) => <div key={i} className={cn('h-1 rounded-full bg-slate-400', i ? 'w-1' : 'w-3')} />)}</Row></Frame>,
  'thumbs-h': <Frame><B className="flex-1" /><Row>{[0, 1, 2, 3].map((i) => <B key={i} className="h-2 flex-1" />)}</Row></Frame>,
  'thumbs-v': <Frame><Row className="flex-1"><div className="flex w-3 flex-col gap-0.5">{[0, 1, 2].map((i) => <B key={i} className="flex-1" />)}</div><B className="flex-1" /></Row></Frame>,
  'variant-buttons': <div className="flex h-full items-center justify-center gap-1">{[0, 1, 2].map((i) => <div key={i} className={cn('h-4 w-6 rounded border-2', i === 0 ? 'border-studio-500' : 'border-slate-300')} />)}</div>,
  'variant-select': <div className="flex h-full items-center justify-center"><div className="flex h-4 w-16 items-center justify-end rounded border-2 border-slate-300 pr-1"><div className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent border-t-slate-400" /></div></div>,
  'variant-cards': <div className="grid h-full grid-cols-2 place-content-center gap-1 px-3">{[0, 1].map((i) => <div key={i} className={cn('flex h-6 flex-col justify-center gap-0.5 rounded border-2 p-0.5', i === 0 ? 'border-studio-500' : 'border-slate-300')}><B className="h-1" /><P className="h-1 w-3" /></div>)}</div>,
  'info-tabs': <Frame><Row><P className="h-1.5 w-5" /><B className="h-1.5 w-5" /><B className="h-1.5 w-5" /></Row><B className="flex-1 opacity-50" /></Frame>,
  'info-accordion': <Frame>{[0, 1, 2].map((i) => <div key={i} className="flex h-2.5 items-center justify-between rounded-sm border border-slate-300 px-0.5"><B className="h-1 w-6" /><span className="text-[6px] leading-none text-slate-400">+</span></div>)}</Frame>,
  'info-continuous': <Frame>{[0, 1].map((i) => <div key={i} className="flex flex-col gap-0.5"><P className="h-1.5 w-8" /><B className="h-1" /><B className="h-1 w-10" /></div>)}</Frame>,
  'related-grid': <Frame><Grid n={4} /></Frame>,
  'related-carousel': <Frame><Row className="flex-1 overflow-hidden">{[0, 1, 2, 3].map((i) => <B key={i} className="w-5 shrink-0" />)}</Row></Frame>,
  'cart-drawer': <Frame><Row className="flex-1"><B className="flex-1 opacity-30" /><div className="flex w-8 flex-col gap-0.5 rounded-sm bg-white p-0.5 shadow">{[0, 1].map((i) => <B key={i} className="h-2" />)}<P className="mt-auto h-1.5" /></div></Row></Frame>,
  'cart-page': <Frame><Row className="flex-1"><div className="flex flex-[2] flex-col gap-0.5">{[0, 1, 2].map((i) => <B key={i} className="h-2" />)}</div><div className="flex flex-1 flex-col gap-0.5 rounded-sm border border-slate-300 p-0.5"><B className="h-1" /><P className="mt-auto h-1.5" /></div></Row></Frame>,
  none: <div className="grid h-full place-items-center text-[10px] text-slate-400">—</div>,
};

export function Schematic({ name }: { name?: string }) {
  if (!name || !MAP[name]) return null;
  return <div className="h-14 w-full overflow-hidden rounded-md bg-slate-50 ring-1 ring-slate-200" aria-hidden>{MAP[name]}</div>;
}
