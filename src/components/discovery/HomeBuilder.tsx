import { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, ChevronDown, Copy, GripVertical, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { getSectionDef, SECTION_LIBRARY, type SectionDef } from '@/config/sections';
import { makeSection } from '@/config/templates';
import { cn, uid } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import { useSimUi } from '@/store/useSimUi';
import type { ProjectConfig, SectionInstance, SectionProps } from '@/types/project';
import { EmptyState, inputCls, ScopeBadge, Segmented } from '../ui';
import { ImagePicker } from './Controls';

const QID = 'home.sections';
const CTA_TARGETS = [['catalog', 'Catálogo'], ['about', 'Nosotros'], ['contact', 'Contacto'], ['blog', 'Blog'], ['kits', 'Kits'], ['brands', 'Marcas']] as const;

function useHome() {
  const mutate = useStudio((s) => s.mutate);
  const setSections = (fn: (s: SectionInstance[]) => SectionInstance[]) => mutate((c) => ({ ...c, home: { sections: fn(c.home.sections) } }), QID);
  return setSections;
}

function SectionEditor({ s, def }: { s: SectionInstance; def: SectionDef }) {
  const setSections = useHome();
  const patch = (p: Partial<SectionProps>) => setSections((list) => list.map((x) => (x.id === s.id ? { ...x, props: { ...x.props, ...p } } : x)));
  const setVariant = (variant: string) => setSections((list) => list.map((x) => (x.id === s.id ? { ...x, variant } : x)));
  const e = def.editable;
  const [min, max] = def.columnsRange ?? [1, 6];
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
      {def.variants.length > 1 && (
        <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estilo</span>
          <Segmented size="sm" label="Estilo de la sección" value={s.variant} onChange={setVariant} options={def.variants.map((v) => ({ value: v.id, label: v.label }))} />
        </div>
      )}
      {e.includes('title') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Título<input className={inputCls} value={s.props.title} onChange={(ev) => patch({ title: ev.target.value })} data-testid={`section-title-${s.id}`} /></label>}
      {e.includes('subtitle') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Texto<textarea rows={2} className={inputCls} value={s.props.subtitle} onChange={(ev) => patch({ subtitle: ev.target.value })} /></label>}
      {e.includes('cta') && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Botón (CTA)<input className={inputCls} value={s.props.cta} onChange={(ev) => patch({ cta: ev.target.value })} /></label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Destino<select className={inputCls} value={s.props.ctaTarget ?? 'catalog'} onChange={(ev) => patch({ ctaTarget: ev.target.value })}>{CTA_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
      )}
      {(e.includes('columns') || e.includes('itemsCount')) && (
        <div className="grid grid-cols-2 gap-2">
          {e.includes('columns') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Columnas: {s.props.columns}<input type="range" min={min} max={max} value={s.props.columns} onChange={(ev) => patch({ columns: Number(ev.target.value) })} className="accent-studio-600" aria-label="Columnas" /></label>}
          {e.includes('itemsCount') && <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Elementos: {s.props.itemsCount}<input type="range" min={1} max={12} value={s.props.itemsCount} onChange={(ev) => patch({ itemsCount: Number(ev.target.value) })} className="accent-studio-600" aria-label="Cantidad de elementos" /></label>}
        </div>
      )}
      {(e.includes('align') || e.includes('tone')) && (
        <div className="flex flex-wrap gap-3">
          {e.includes('align') && <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Alineación</span><Segmented size="sm" label="Alineación" value={s.props.align} onChange={(align) => patch({ align })} options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }]} /></div>}
          {e.includes('tone') && <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fondo</span><Segmented size="sm" label="Fondo" value={s.props.tone} onChange={(tone) => patch({ tone })} options={[{ value: 'light', label: 'Claro' }, { value: 'muted', label: 'Suave' }, { value: 'brand', label: 'Marca' }, { value: 'dark', label: 'Oscuro' }]} /></div>}
        </div>
      )}
      {e.includes('image') && <div className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Imagen</span><ImagePicker value={s.props.image} onChange={(image) => patch({ image })} /></div>}
      {e.includes('slides') && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Banners ({s.props.slides?.length ?? 0})</span>
          {(s.props.slides ?? []).map((sl, i) => (
            <div key={sl.id} className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2">
              <div className="flex items-center justify-between text-xs font-semibold">Banner {i + 1}<button type="button" aria-label={`Eliminar banner ${i + 1}`} disabled={(s.props.slides?.length ?? 0) <= 1} onClick={() => patch({ slides: s.props.slides!.filter((x) => x.id !== sl.id) })} className="text-slate-400 hover:text-rose-600 disabled:opacity-30"><Trash2 size={13} /></button></div>
              <input aria-label="Etiqueta" className={inputCls} placeholder="Etiqueta" value={sl.eyebrow} onChange={(ev) => patch({ slides: s.props.slides!.map((x) => (x.id === sl.id ? { ...x, eyebrow: ev.target.value } : x)) })} />
              <input aria-label="Título del banner" className={inputCls} placeholder="Título" value={sl.title} onChange={(ev) => patch({ slides: s.props.slides!.map((x) => (x.id === sl.id ? { ...x, title: ev.target.value } : x)) })} />
              <input aria-label="Texto del banner" className={inputCls} placeholder="Texto" value={sl.text} onChange={(ev) => patch({ slides: s.props.slides!.map((x) => (x.id === sl.id ? { ...x, text: ev.target.value } : x)) })} />
              <input aria-label="Botón del banner" className={inputCls} placeholder="Botón" value={sl.cta} onChange={(ev) => patch({ slides: s.props.slides!.map((x) => (x.id === sl.id ? { ...x, cta: ev.target.value } : x)) })} />
              <ImagePicker value={sl.image} onChange={(image) => patch({ slides: s.props.slides!.map((x) => (x.id === sl.id ? { ...x, image } : x)) })} />
            </div>
          ))}
          {(s.props.slides?.length ?? 0) < 6 && <button type="button" onClick={() => patch({ slides: [...(s.props.slides ?? []), { id: uid(), eyebrow: '', title: 'Nuevo banner', text: '', cta: 'Ver más' }] })} className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium"><Plus size={14} /> Agregar banner</button>}
        </div>
      )}
    </div>
  );
}

function SortableItem({ s, index, total, open, onToggle }: { s: SectionInstance; index: number; total: number; open: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const setSections = useHome();
  const def = getSectionDef(s.type);
  const move = (d: number) => setSections((list) => arrayMove(list, index, index + d));
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('overflow-hidden rounded-xl border bg-white', isDragging ? 'z-10 border-studio-400 shadow-xl' : 'border-slate-200')} data-testid="home-section-item" data-section-type={s.type}>
      <div className="flex items-center gap-1.5 px-2 py-2">
        <button type="button" className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing" aria-label={`Arrastrar ${def.label}`} {...attributes} {...listeners}><GripVertical size={16} /></button>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">{index + 1}</span>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold">{def.label}</span>
          <span className="block truncate text-[11px] text-slate-500">{s.props.title || def.variants.find((v) => v.id === s.variant)?.label}</span>
        </button>
        {def.scope !== 'proposal' && <ScopeBadge scope={def.scope} short />}
        <button type="button" aria-label="Subir sección" disabled={index === 0} onClick={() => move(-1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
        <button type="button" aria-label="Bajar sección" disabled={index === total - 1} onClick={() => move(1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
        {!def.single && <button type="button" aria-label="Duplicar sección" onClick={() => setSections((list) => [...list.slice(0, index + 1), { ...structuredClone(s), id: `${s.type}-${uid()}` }, ...list.slice(index + 1)])} className="rounded p-1 text-slate-400 hover:bg-slate-100"><Copy size={14} /></button>}
        <button type="button" aria-label={`Eliminar ${def.label}`} onClick={() => setSections((list) => list.filter((x) => x.id !== s.id))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" data-testid="remove-section"><Trash2 size={14} /></button>
        <button type="button" aria-label="Editar sección" onClick={onToggle} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronDown size={16} className={cn('transition', open && 'rotate-180')} /></button>
      </div>
      {open && <SectionEditor s={s} def={def} />}
    </li>
  );
}

export function HomeBuilder({ cfg }: { cfg: ProjectConfig }) {
  const setSections = useHome();
  const setHighlight = useSimUi((s) => s.setHighlight);
  const navigate = useStudio((s) => s.navigate);
  const [open, setOpen] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const sections = cfg.home.sections;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setSections((list) => arrayMove(list, list.findIndex((x) => x.id === e.active.id), list.findIndex((x) => x.id === e.over!.id)));
  };
  const add = (def: SectionDef) => {
    const s = makeSection(def.type);
    setSections((list) => (def.type === 'announcement' ? [s, ...list] : [...list, s]));
    setOpen(s.id);
    setPalette(false);
    navigate('home');
    setHighlight(s.id);
    setTimeout(() => setHighlight(null), 1200);
  };

  return (
    <div className="flex flex-col gap-3">
      {sections.length === 0 ? (
        <EmptyState icon={<LayoutTemplate size={20} />} title="El Home está vacío" text="Agrega la primera sección. Aparecerá de inmediato en el simulador." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2" aria-label="Secciones del Home" data-testid="home-section-list">
              {sections.map((s, i) => <SortableItem key={s.id} s={s} index={i} total={sections.length} open={open === s.id} onToggle={() => { setOpen(open === s.id ? null : s.id); setHighlight(s.id); setTimeout(() => setHighlight(null), 1200); navigate('home'); }} />)}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      <button type="button" onClick={() => setPalette(!palette)} aria-expanded={palette} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-studio-200 text-sm font-semibold text-studio-700 hover:border-studio-400 hover:bg-studio-50" data-testid="add-section">
        <Plus size={16} /> Agregar sección
      </button>
      {palette && (
        <div className="animate-fade-in grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2" data-testid="section-palette">
          {SECTION_LIBRARY.map((d) => {
            const exists = d.single && sections.some((s) => s.type === d.type);
            return (
              <button key={d.type} type="button" disabled={exists} onClick={() => add(d)} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-studio-400 hover:shadow-sm disabled:opacity-40" data-palette-type={d.type}>
                <span className="text-xs font-bold">{d.label}</span>
                <span className="text-[11px] leading-tight text-slate-500">{d.description}</span>
                {d.scope !== 'proposal' && <span><ScopeBadge scope={d.scope} short /></span>}
              </button>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-slate-500">Arrastra con el ícono <GripVertical size={11} className="inline" /> o usa las flechas. Con teclado: foco en el ícono, Espacio y flechas.</p>
    </div>
  );
}
