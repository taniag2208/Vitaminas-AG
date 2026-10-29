import { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, GripVertical, Plus, Sparkles, X } from 'lucide-react';
import { getTopping } from '@/config/discovery/toppings';
import { getSectionDef } from '@/config/sections';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/store/useDerived';
import { useSimUi } from '@/store/useSimUi';
import { useStudio } from '@/store/useStudio';
import type { SectionInstance, SectionProps } from '@/types/project';
import { inputCls, Segmented } from '../ui';
import { ImagePicker, type ControlProps } from './AnswerControls';
import { SectionThumb } from './SectionThumb';

/** Toppings del Home agrupados por intención (orden típico de armado). */
export const HOME_TOPPING_GROUPS: { title: string; hint: string; ids: string[] }[] = [
  { title: 'Banners y promociones', hint: 'Lo primero que se ve', ids: ['hero-banner', 'promo-carousel', 'countdown'] },
  { title: 'Explorar', hint: 'Llevar a las categorías', ids: ['category-circles', 'category-cards', 'shop-by-goal', 'brand-strip'] },
  { title: 'Productos', hint: 'Vender desde el Home', ids: ['best-sellers', 'new-arrivals', 'curated-collection', 'on-sale', 'bundles-showcase'] },
  { title: 'Confianza', hint: 'Por qué comprar aquí', ids: ['benefits-bar', 'testimonials', 'brand-story'] },
  { title: 'Contenido', hint: 'Educar y resolver dudas', ids: ['blog-teaser', 'faq-block'] },
  { title: 'Cierre', hint: 'Captar y convertir', ids: ['newsletter-block', 'final-cta'] },
];

const CTA_TARGETS = [['catalog', 'Catálogo'], ['about', 'Nosotros'], ['contact', 'Contacto'], ['blog', 'Blog'], ['kits', 'Kits'], ['brands', 'Marcas']] as const;

const flash = (id: string) => {
  useStudio.getState().navigate('home');
  useSimUi.getState().setHighlight(id);
  setTimeout(() => useSimUi.getState().setHighlight(null), 1400);
};

/** Ajuste de los datos ficticios de una sección (no cambia la decisión, solo el contenido de ejemplo). */
function ContentEditor({ s }: { s: SectionInstance }) {
  const setSectionContent = useStudio((x) => x.setSectionContent);
  const def = getSectionDef(s.type);
  const e = def.editable;
  const patch = (p: Partial<SectionProps>) => setSectionContent(s.id, p);
  return (
    <div className="flex flex-col gap-2.5 border-t border-slate-100 bg-slate-50/70 px-3 py-3">
      <p className="text-[11px] text-slate-500">Ajusta los textos de ejemplo. La estructura se decide con las preguntas.</p>
      {e.includes('title') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Título<input className={inputCls} value={s.props.title} onChange={(ev) => patch({ title: ev.target.value })} data-testid={`section-title-${s.id}`} /></label>}
      {e.includes('subtitle') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Texto<textarea rows={2} className={inputCls} value={s.props.subtitle} onChange={(ev) => patch({ subtitle: ev.target.value })} /></label>}
      {e.includes('cta') && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Botón<input className={inputCls} value={s.props.cta} onChange={(ev) => patch({ cta: ev.target.value })} /></label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Lleva a<select className={inputCls} value={s.props.ctaTarget ?? 'catalog'} onChange={(ev) => patch({ ctaTarget: ev.target.value })}>{CTA_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
      )}
      {e.includes('tone') && <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fondo</span><Segmented size="sm" label="Fondo" value={s.props.tone} onChange={(tone) => patch({ tone })} options={[{ value: 'light', label: 'Claro' }, { value: 'muted', label: 'Suave' }, { value: 'brand', label: 'Marca' }, { value: 'dark', label: 'Oscuro' }]} /></div>}
      {e.includes('image') && <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Imagen</span><ImagePicker value={s.props.image} onChange={(image) => patch({ image })} /></div>}
    </div>
  );
}

function Row({ s, index, total, onMove, open, onToggle }: { s: SectionInstance; index: number; total: number; onMove: (from: number, to: number) => void; open: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const removeTopping = useStudio((x) => x.removeTopping);
  const analysis = useAnalysis();
  const view = analysis?.active.get(s.id);
  const t = getTopping(s.id);
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('overflow-hidden rounded-xl border bg-white', isDragging ? 'z-10 border-studio-400 shadow-xl' : 'border-slate-200')} data-testid="home-section-item" data-section-type={s.type} data-topping={s.id}>
      <div className="flex items-center gap-1.5 px-2 py-2">
        <button type="button" className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing" aria-label={`Arrastrar ${t?.name}`} {...attributes} {...listeners}><GripVertical size={16} /></button>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-studio-600 text-[11px] font-bold text-white">{index + 1}</span>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold">{t?.name}</span>
          <span className="block truncate text-[11px] text-slate-500">{view?.source === 'answer' ? `Por tu respuesta ${view.activatedBy.join(', ')}` : 'Agregado como topping'}</span>
        </button>
        <button type="button" aria-label="Subir sección" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
        <button type="button" aria-label="Bajar sección" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
        <button type="button" aria-label={`Quitar ${t?.name}`} onClick={() => removeTopping(s.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" data-testid="remove-section"><X size={14} /></button>
        <button type="button" aria-label="Editar contenido" onClick={onToggle} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronDown size={16} className={cn('transition', open && 'rotate-180')} /></button>
      </div>
      {open && <ContentEditor s={s} />}
    </li>
  );
}

export function HomeOrderControl({ onChange, cfg }: ControlProps<string[]>) {
  const addTopping = useStudio((s) => s.addTopping);
  const [open, setOpen] = useState<string | null>(null);
  const [palette, setPalette] = useState(true);
  const sections = cfg.home.sections;
  const ids = sections.map((s) => s.id);
  const last = sections[sections.length - 1];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const move = (from: number, to: number) => { onChange(arrayMove(ids, from, to)); flash(ids[from]); };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    move(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  };
  const add = (id: string) => {
    addTopping(id);
    onChange([...ids.filter((x) => x !== id), id]);
    setOpen(id);
    setTimeout(() => flash(id), 30);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="home-order">
      <div className="rounded-xl bg-gradient-to-br from-studio-50 to-white p-3 ring-1 ring-studio-100">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-600"><Sparkles size={13} /> Tu Home hasta ahora</p>
        <ol className="mt-2 flex flex-wrap items-center gap-1" aria-label="Orden actual del Home" data-testid="toppings-stack">
          {sections.length === 0 && <li className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-400">Aún vacío: responde las preguntas anteriores o agrega toppings</li>}
          {sections.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1">
              {i > 0 && <ArrowRight size={12} className="text-slate-300" aria-hidden />}
              <button type="button" onClick={() => flash(s.id)} className="inline-flex items-center gap-1 rounded-full bg-white py-0.5 pl-1 pr-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:ring-studio-300">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-studio-600 text-[9px] font-bold text-white">{i + 1}</span>{getTopping(s.id)?.name}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {sections.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2" aria-label="Secciones del Home" data-testid="home-section-list">
              {sections.map((s, i) => <Row key={s.id} s={s} index={i} total={sections.length} onMove={move} open={open === s.id} onToggle={() => { setOpen(open === s.id ? null : s.id); flash(s.id); }} />)}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <button type="button" onClick={() => setPalette(!palette)} aria-expanded={palette} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left">
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-studio-600">Toppings</span>
          <span className="font-display text-sm font-bold text-ink-900" data-testid="toppings-prompt">{sections.length === 0 ? '¿Qué va primero en tu Home?' : <>¿Qué va después de <span className="text-studio-700">{getTopping(last.id)?.name}</span>?</>}</span>
        </span>
        <ChevronDown size={16} className={cn('text-slate-400 transition', palette && 'rotate-180')} />
      </button>
      {palette && (
        <div className="flex flex-col gap-3" data-testid="section-palette">
          {HOME_TOPPING_GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{g.title} <span className="font-medium normal-case tracking-normal text-slate-400">· {g.hint}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {g.ids.map((id) => {
                  const t = getTopping(id)!;
                  const used = ids.includes(id);
                  return (
                    <button key={id} type="button" disabled={used} onClick={() => add(id)} className={cn('group flex flex-col gap-1.5 rounded-xl border bg-white p-1.5 text-left transition hover:-translate-y-0.5 hover:border-studio-400 hover:shadow-md disabled:translate-y-0 disabled:shadow-none', used ? 'border-studio-200 opacity-60' : 'border-slate-200')} data-palette-type={id} title={t.problem}>
                      {t.sim.kind === 'section' && <SectionThumb type={t.sim.section} primary={cfg.brand.primary} accent={cfg.brand.accent} />}
                      <span className="flex items-center gap-1 px-0.5 text-xs font-bold text-slate-800"><span className="flex-1 truncate">{t.name}</span>{used ? <span className="text-[10px] font-semibold text-studio-700">En el Home</span> : <Plus size={14} className="shrink-0 text-studio-600" />}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
