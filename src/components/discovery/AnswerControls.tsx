import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ExternalLink, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { PAGE_TYPES, makePage } from '@/config/templates';
import { DEMO_PRODUCTS, getProduct } from '@/data/demoCatalog';
import { cn, compressImage, uid } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { DOption, DQuestion } from '@/types/discovery';
import type { CustomAttribute, PageDef, PageType, ProjectConfig, ReferenceItem } from '@/types/project';
import { inputCls, ScopeBadge } from '../ui';
import { Schematic } from './Schematic';

export const FONT_OPTIONS = ['Inter', 'Manrope', 'DM Sans', 'Poppins', 'Outfit', 'Fraunces', 'Playfair Display', 'Lora'];

export interface ControlProps<T = unknown> {
  q: DQuestion;
  value: T | undefined;
  /** Valor sugerido mientras está pendiente */
  suggested?: T;
  onChange: (v: T) => void;
  cfg: ProjectConfig;
}

const scopeTag = (o: DOption, on: boolean) =>
  o.scope && o.scope !== 'proposal' ? (
    <span className={cn('shrink-0 rounded-full px-1.5 text-[10px] font-semibold', on ? 'bg-white/20 text-white' : o.scope === 'additional' ? 'bg-amber-100 text-amber-800' : o.scope === 'validation' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600')}>
      {o.scope === 'additional' ? 'adicional' : o.scope === 'validation' ? 'validar' : 'por definir'}
    </span>
  ) : null;

/* ───────────── Opciones ───────────── */

export function SingleControl({ q, value, onChange }: ControlProps<string>) {
  return (
    <div role="radiogroup" aria-label={q.text} className="flex flex-col gap-1.5">
      {q.options!.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn('flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-sm transition', on ? 'border-studio-500 bg-studio-50' : 'border-slate-200 bg-white hover:border-slate-300')} data-option={o.value}>
            <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', on ? 'border-studio-600' : 'border-slate-300')}>{on && <span className="h-2 w-2 rounded-full bg-studio-600" />}</span>
            <span className="flex-1"><span className="font-medium text-slate-800">{o.label}</span>{o.description && <span className="block text-xs text-slate-500">{o.description}</span>}</span>
            {scopeTag(o, false)}
          </button>
        );
      })}
    </div>
  );
}

export function CardsControl({ q, value, onChange }: ControlProps<string>) {
  const n = q.options!.length;
  const hasVisual = q.options!.some((o) => o.visual);
  return (
    <div role="radiogroup" aria-label={q.text} className={cn('grid gap-2', n <= 2 ? 'grid-cols-2' : n === 4 && hasVisual ? 'grid-cols-4' : n >= 5 && !hasVisual ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3')}>
      {q.options!.map((o) => {
        const on = String(value) === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn('relative flex flex-col gap-1.5 rounded-xl border-2 p-2 text-left transition', on ? 'border-studio-500 bg-studio-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300')} data-option={o.value}>
            {o.visual && <Schematic name={o.visual} />}
            <span className="px-0.5 text-[13px] font-semibold leading-tight text-slate-800">{o.label}</span>
            {o.description && <span className="px-0.5 text-[11px] leading-tight text-slate-500">{o.description}</span>}
            {o.scope && o.scope !== 'proposal' && <span className="px-0.5"><ScopeBadge scope={o.scope} short /></span>}
            {on && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-studio-600 text-white"><Check size={12} /></span>}
          </button>
        );
      })}
    </div>
  );
}

export function MultiControl({ q, value, onChange, options }: ControlProps<string[]> & { options?: DOption[] }) {
  const cur = value ?? [];
  const opts = options ?? q.options!;
  const toggle = (o: DOption) => {
    if (cur.includes(o.value)) return onChange(cur.filter((x) => x !== o.value));
    if (o.exclusive) return onChange([o.value]);
    const exclusive = opts.filter((x) => x.exclusive).map((x) => x.value);
    const next = [...cur.filter((x) => !exclusive.includes(x)), o.value];
    onChange(q.maxSelect && next.length > q.maxSelect ? next.slice(next.length - q.maxSelect) : next);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={q.text}>
        {opts.map((o) => {
          const on = cur.includes(o.value);
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => toggle(o)} title={o.description} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition', on ? 'border-studio-600 bg-studio-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300', o.exclusive && !on && 'border-dashed')} data-option={o.value}>
              {on && <Check size={12} />}
              {o.label}
              {scopeTag(o, on)}
            </button>
          );
        })}
      </div>
      {q.maxSelect && <p className="text-[11px] text-slate-500">Máximo {q.maxSelect}. Seleccionadas: {cur.length}</p>}
    </div>
  );
}

export function BooleanControl({ q, value, onChange }: ControlProps<boolean>) {
  const opts = q.options ?? [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }];
  return (
    <div role="radiogroup" aria-label={q.text} className="grid grid-cols-2 gap-2">
      {opts.map((o) => {
        const on = value !== undefined && String(value) === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value === 'true')} className={cn('flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition', on ? 'border-studio-500 bg-studio-50 text-studio-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')} data-option={o.value}>
            {on && <Check size={14} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Texto ───────────── */

/** Texto con guardado al escribir (las respuestas se conservan al navegar). */
export function TextControl({ q, value, onChange, multiline }: ControlProps<string> & { multiline?: boolean }) {
  return multiline ? (
    <textarea aria-label={q.text} rows={3} className={inputCls} value={value ?? ''} placeholder={q.placeholder} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input aria-label={q.text} className={inputCls} value={value ?? ''} placeholder={q.placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function FieldsControl({ q, value, onChange }: ControlProps<Record<string, string>>) {
  const v = value ?? {};
  return (
    <div className="flex flex-col gap-2">
      {q.fields!.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          {f.label}
          <input className={inputCls} value={v[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => onChange({ ...v, [f.key]: e.target.value })} data-field={f.key} />
        </label>
      ))}
    </div>
  );
}

export function NumberControl({ q, value, suggested, onChange }: ControlProps<number>) {
  const v = value ?? suggested ?? q.min ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="number" aria-label={q.text} className={cn(inputCls, 'w-40')} min={q.min} max={q.max} step={q.step ?? 1} value={v} onChange={(e) => onChange(Math.max(q.min ?? -Infinity, Math.min(q.max ?? Infinity, Number(e.target.value) || 0)))} />
      {q.suffix && <span className="text-sm text-slate-500">{q.suffix}</span>}
    </div>
  );
}

export function TagsControl({ q, value, suggested, onChange }: ControlProps<string[]>) {
  const tags = value ?? suggested ?? [];
  const [v, setV] = useState('');
  const add = () => { const t = v.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setV(''); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !v && tags.length) onChange(tags.slice(0, -1)); };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 focus-within:border-studio-400">
      {tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">{t}<button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-slate-400 hover:text-rose-600"><X size={12} /></button></span>)}
      <input aria-label={q.text} className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none" placeholder="Escribe y presiona Enter" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={onKey} onBlur={add} />
    </div>
  );
}

/* ───────────── Marca ───────────── */

type Colors = { primary: string; secondary: string; accent: string };
export function ColorsControl({ value, suggested, onChange }: ControlProps<Colors>) {
  const v = value ?? suggested ?? { primary: '#1f6f5c', secondary: '#f3efe6', accent: '#e9822e' };
  const items: [keyof Colors, string, string][] = [['primary', 'Primario', 'Botones y enlaces'], ['secondary', 'Secundario', 'Fondos suaves'], ['accent', 'Acento', 'Promociones']];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(([k, label, hint]) => (
        <label key={k} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700">
          <span className="flex items-center gap-2">
            <input type="color" aria-label={`Color ${label}`} value={v[k]} onChange={(e) => onChange({ ...v, [k]: e.target.value })} className="h-8 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
            <span>{label}<span className="block font-mono text-[10px] uppercase text-slate-400">{v[k]}</span></span>
          </span>
          <span className="text-[10px] font-normal text-slate-500">{hint}</span>
        </label>
      ))}
    </div>
  );
}

type Fonts = { heading: string; body: string };
export function FontsControl({ value, suggested, onChange }: ControlProps<Fonts>) {
  const v = value ?? suggested ?? { heading: 'Manrope', body: 'Inter' };
  return (
    <div className="grid grid-cols-2 gap-2">
      {([['heading', 'Títulos'], ['body', 'Textos']] as const).map(([k, label]) => (
        <label key={k} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          {label}
          <select aria-label={`Tipografía de ${label}`} className={inputCls} value={v[k]} onChange={(e) => onChange({ ...v, [k]: e.target.value })} style={{ fontFamily: v[k] }}>
            {FONT_OPTIONS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
          <span className="truncate text-xl text-slate-800" style={{ fontFamily: v[k], fontWeight: k === 'heading' ? 800 : 400 }}>Aa Bienestar</span>
        </label>
      ))}
    </div>
  );
}

export function ImagePicker({ value, onChange, label = 'Imagen' }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value ? <img src={value} alt="" className="h-12 w-16 rounded-md object-contain ring-1 ring-slate-200" /> : <span className="grid h-12 w-16 place-items-center rounded-md bg-slate-100 text-[10px] text-slate-400">Sin imagen</span>}
      <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium hover:bg-slate-50"><ImagePlus size={14} /> {value ? 'Cambiar' : `Subir ${label.toLowerCase()}`}</button>
      {value && <button type="button" onClick={() => onChange(undefined)} className="text-xs text-slate-500 underline">Quitar</button>}
      <input ref={ref} type="file" accept="image/*" className="hidden" aria-label={label} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { onChange(await compressImage(f)); setErr(null); } catch (x) { setErr((x as Error).message); } }} />
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}

export const LogoControl = ({ value, onChange }: ControlProps<string>) => <ImagePicker label="Logo" value={value} onChange={(v) => onChange(v ?? '')} />;

export function ReferencesControl({ value, onChange }: ControlProps<ReferenceItem[]>) {
  const refs = value ?? [];
  const [draft, setDraft] = useState({ name: '', url: '', note: '' });
  const add = (image?: string) => {
    if (!draft.name.trim() && !image) return;
    onChange([...refs, { id: uid(), name: draft.name.trim() || 'Imagen de referencia', url: draft.url.trim() || undefined, note: draft.note.trim(), image }]);
    setDraft({ name: '', url: '', note: '' });
  };
  return (
    <div className="flex flex-col gap-2">
      {refs.map((r) => (
        <div key={r.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
          {r.image && <img src={r.image} alt="" className="h-12 w-16 rounded object-cover" />}
          <div className="min-w-0 flex-1"><p className="font-semibold">{r.name}</p>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-studio-600 underline">{r.url}</a>}{r.note && <p className="text-slate-500">{r.note}</p>}</div>
          <button type="button" aria-label="Eliminar referencia" onClick={() => onChange(refs.filter((x) => x.id !== r.id))} className="text-slate-400 hover:text-rose-600"><X size={14} /></button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-1.5">
        <input aria-label="Nombre de la referencia" className={inputCls} placeholder="Nombre o sitio" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input aria-label="URL de la referencia" className={inputCls} placeholder="https://" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <input aria-label="Qué les gusta" className={cn(inputCls, 'col-span-2')} placeholder="¿Qué les gusta de esta referencia?" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => add()} className="inline-flex h-8 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white"><Plus size={14} /> Agregar referencia</button>
        <ImagePicker label="Imagen" onChange={(img) => img && add(img)} />
      </div>
    </div>
  );
}

/* ───────────── Páginas y menú ───────────── */

export function PagesControl({ value, suggested, onChange }: ControlProps<PageDef[]>) {
  const pages = value ?? suggested ?? [makePage('home'), makePage('catalog')];
  const [custom, setCustom] = useState('');
  const has = (t: PageType) => pages.some((p) => p.type === t);
  const toggle = (t: PageType) => onChange(has(t) ? pages.filter((p) => p.type !== t) : [...pages, makePage(t)]);
  const addCustom = () => { if (!custom.trim()) return; onChange([...pages, makePage('custom', custom.trim())]); setCustom(''); };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5">
        {PAGE_TYPES.filter((t) => !t.repeatable && !['kits', 'account', 'tracking'].includes(t.type)).map((t) => {
          const on = has(t.type);
          return (
            <button key={t.type} type="button" disabled={t.required} aria-pressed={on} onClick={() => toggle(t.type)} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition disabled:cursor-default', on ? 'border-studio-500 bg-studio-50 text-studio-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')} data-page-type={t.type}>
              <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border', on ? 'border-studio-600 bg-studio-600 text-white' : 'border-slate-300')}>{on && <Check size={11} />}</span>
              <span className="flex-1">{t.label}{t.required && <span className="block text-[10px] font-normal text-slate-400">Siempre incluida</span>}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">Kits, cuenta y seguimiento de pedidos se agregan solos cuando se activan esas funcionalidades.</p>
      <div className="flex flex-col gap-1.5">
        {pages.filter((p) => p.type === 'custom').map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
            <input aria-label="Título de la página" className="flex-1 bg-transparent font-medium outline-none" value={p.title} onChange={(e) => onChange(pages.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))} />
            <ScopeBadge scope="additional" short />
            <button type="button" aria-label={`Eliminar ${p.title}`} onClick={() => onChange(pages.filter((x) => x.id !== p.id))} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input aria-label="Nueva página personalizada" className={inputCls} placeholder="Otra página, ej. Programa de puntos" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button type="button" onClick={addCustom} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white"><Plus size={14} /> Agregar</button>
        </div>
      </div>
    </div>
  );
}

type MenuValue = { order?: string[]; menu?: string[]; footer?: string[] };
export function MenuControl({ value, onChange, cfg }: ControlProps<MenuValue>) {
  const navigate = useStudio((s) => s.navigate);
  const pages = cfg.pages;
  const v: Required<MenuValue> = { order: value?.order ?? pages.map((p) => p.id), menu: value?.menu ?? pages.filter((p) => p.inMenu).map((p) => p.id), footer: value?.footer ?? pages.filter((p) => p.inFooter).map((p) => p.id) };
  const flip = (key: 'menu' | 'footer', id: string, on: boolean) => onChange({ ...v, [key]: on ? [...v[key], id] : v[key].filter((x) => x !== id) });
  const move = (i: number, d: number) => { const order = pages.map((p) => p.id); const j = i + d; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; onChange({ ...v, order }); };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1fr_56px_56px_28px] bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><span>Página (orden)</span><span className="text-center">Menú</span><span className="text-center">Footer</span><span /></div>
      {pages.map((p, i) => (
        <div key={p.id} className="grid grid-cols-[1fr_56px_56px_28px] items-center border-t border-slate-100 px-3 py-1.5 text-sm" data-menu-row={p.id}>
          <span className="flex items-center gap-1.5">
            <span className="flex flex-col"><button type="button" aria-label={`Subir ${p.title}`} onClick={() => move(i, -1)} className="text-[9px] leading-none text-slate-400 hover:text-slate-800">▲</button><button type="button" aria-label={`Bajar ${p.title}`} onClick={() => move(i, 1)} className="text-[9px] leading-none text-slate-400 hover:text-slate-800">▼</button></span>
            {p.title}
          </span>
          <span className="flex justify-center"><input type="checkbox" aria-label={`${p.title} en menú`} checked={p.inMenu} disabled={p.type === 'home'} onChange={(e) => flip('menu', p.id, e.target.checked)} className="h-4 w-4 accent-studio-600" /></span>
          <span className="flex justify-center"><input type="checkbox" aria-label={`${p.title} en footer`} checked={p.inFooter} onChange={(e) => flip('footer', p.id, e.target.checked)} className="h-4 w-4 accent-studio-600" /></span>
          <button type="button" aria-label={`Abrir ${p.title} en el simulador`} onClick={() => navigate(p.id)} className="text-slate-400 hover:text-studio-600"><ExternalLink size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Catálogo ───────────── */

export function CustomAttributesControl({ value, onChange }: ControlProps<CustomAttribute[]>) {
  const attrs = value ?? [];
  const [label, setLabel] = useState('');
  const [values, setValues] = useState('');
  const add = () => {
    const vals = values.split(',').map((x) => x.trim()).filter(Boolean);
    if (!label.trim() || !vals.length) return;
    onChange([...attrs, { id: uid(), label: label.trim(), values: vals }]);
    setLabel(''); setValues('');
  };
  return (
    <div className="flex flex-col gap-2">
      {attrs.map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
          <b>{a.label}</b><span className="flex-1 truncate text-slate-500">{a.values.join(' · ')}</span>
          <button type="button" aria-label={`Eliminar atributo ${a.label}`} onClick={() => onChange(attrs.filter((x) => x.id !== a.id))} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_1.4fr_auto] gap-1.5">
        <input aria-label="Nombre del atributo" className={inputCls} placeholder="Ej. Dieta" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input aria-label="Valores del atributo" className={inputCls} placeholder="Vegano, Sin gluten" value={values} onChange={(e) => setValues(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button type="button" onClick={add} className="rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white">Agregar</button>
      </div>
    </div>
  );
}

export function ProductsControl(props: ControlProps<string[]>) {
  return <MultiControl {...props} options={DEMO_PRODUCTS.map((p) => ({ value: p.id, label: p.name }))} />;
}

type Kit = ProjectConfig['bundles']['kits'][number];
export function KitsControl({ value, onChange }: ControlProps<Kit[]>) {
  const kits = value ?? [];
  const [name, setName] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [pct, setPct] = useState(10);
  const add = () => {
    if (!name.trim() || sel.length < 2) return;
    onChange([...kits, { id: `kit-${uid()}`, name: name.trim(), productIds: sel, discountPct: pct }]);
    setName(''); setSel([]);
  };
  return (
    <div className="flex flex-col gap-2">
      {kits.map((k) => (
        <div key={k.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
          <b>{k.name}</b><span className="flex-1 truncate text-slate-500">{k.productIds.map((id) => getProduct(id)?.name).join(' + ')} · -{k.discountPct}%</span>
          <button type="button" aria-label={`Eliminar kit ${k.name}`} onClick={() => onChange(kits.filter((x) => x.id !== k.id))} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-2.5">
        <div className="grid grid-cols-[1fr_96px] gap-1.5">
          <input aria-label="Nombre del kit" className={inputCls} placeholder="Nombre del kit" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="flex items-center gap-1 text-xs"><input type="number" aria-label="Descuento del kit" min={0} max={50} className={inputCls} value={pct} onChange={(e) => setPct(Number(e.target.value))} />%</label>
        </div>
        <div className="mt-2 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {DEMO_PRODUCTS.map((o) => <button key={o.id} type="button" aria-pressed={sel.includes(o.id)} onClick={() => setSel(sel.includes(o.id) ? sel.filter((x) => x !== o.id) : [...sel, o.id])} className={cn('rounded-full border px-2 py-0.5 text-[11px]', sel.includes(o.id) ? 'border-studio-500 bg-studio-600 text-white' : 'border-slate-200')}>{o.name}</button>)}
        </div>
        <button type="button" disabled={!name.trim() || sel.length < 2} onClick={add} className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white disabled:opacity-40"><Plus size={14} /> Crear kit ({sel.length} productos)</button>
      </div>
    </div>
  );
}

export const Hint = ({ children }: { children: ReactNode }) => <p className="text-[11px] text-slate-500">{children}</p>;
