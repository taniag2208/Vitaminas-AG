import { useRef, useState, type KeyboardEvent } from 'react';
import { Check, ExternalLink, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { makePage, PAGE_TYPES } from '@/config/templates';
import { demoProductOptions, type QOption, type Question } from '@/config/questions';
import { availableFilterIds, filterLabel } from '@/engine/catalog';
import { getProduct } from '@/data/demoCatalog';
import { cn, compressImage, getPath, uid } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { PageType, ProjectConfig } from '@/types/project';
import { inputCls, ScopeBadge, Toggle } from '../ui';
import { Schematic } from './Schematic';

export const FONT_OPTIONS = ['Inter', 'Manrope', 'DM Sans', 'Poppins', 'Outfit', 'Fraunces', 'Playfair Display', 'Lora'];

type CtrlProps = { q: Question; cfg: ProjectConfig };

const useSetter = (q: Question) => {
  const update = useStudio((s) => s.update);
  return (value: unknown, path = q.path!) => update(path, value, q.id);
};

const coerce = (current: unknown, v: string) => (typeof current === 'number' ? Number(v) : v);

function OptionScope({ o }: { o: QOption }) {
  return o.scope && o.scope !== 'proposal' ? <ScopeBadge scope={o.scope} short /> : null;
}

export function SingleChoice({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const cur = getPath(cfg, q.path!);
  return (
    <div role="radiogroup" aria-label={q.title} className="flex flex-col gap-1.5">
      {q.options!.map((o) => {
        const on = String(cur) === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => set(coerce(cur, o.value))} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition', on ? 'border-studio-500 bg-studio-50 font-medium text-studio-900' : 'border-slate-200 hover:border-slate-300')}>
            <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', on ? 'border-studio-600' : 'border-slate-300')}>{on && <span className="h-2 w-2 rounded-full bg-studio-600" />}</span>
            <span className="flex-1">{o.label}{o.description && <span className="block text-xs font-normal text-slate-500">{o.description}</span>}</span>
            <OptionScope o={o} />
          </button>
        );
      })}
    </div>
  );
}

export function VisualChoice({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const cur = getPath(cfg, q.path!);
  const n = q.options!.length;
  return (
    <div role="radiogroup" aria-label={q.title} className={cn('grid gap-2', n === 2 ? 'grid-cols-2' : n === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
      {q.options!.map((o) => {
        const on = String(cur) === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => set(coerce(cur, o.value))} className={cn('relative flex flex-col gap-1.5 rounded-xl border-2 p-1.5 text-left transition', on ? 'border-studio-500 bg-studio-50 shadow-sm' : 'border-slate-200 hover:border-slate-300')} data-option={o.value}>
            <Schematic name={o.visual} />
            <span className="px-0.5 text-xs font-semibold leading-tight">{o.label}</span>
            {o.description && <span className="px-0.5 text-[11px] leading-tight text-slate-500">{o.description}</span>}
            {o.scope && o.scope !== 'proposal' && <span className="px-0.5"><OptionScope o={o} /></span>}
            {on && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-studio-600 text-white"><Check size={12} /></span>}
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoice({ q, cfg, options }: CtrlProps & { options?: QOption[] }) {
  const set = useSetter(q);
  const cur = ((getPath(cfg, q.path!) as string[]) ?? []).map(String);
  const opts = options ?? q.options!;
  const toggle = (v: string) => set(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={q.title}>
      {opts.map((o) => {
        const on = cur.includes(o.value);
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => toggle(o.value)} title={o.description} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'border-studio-500 bg-studio-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
            {on && <Check size={12} />}
            {o.label}
            {o.scope && o.scope !== 'proposal' && <span className={cn('rounded-full px-1.5 text-[10px]', on ? 'bg-white/20' : 'bg-amber-100 text-amber-800')}>{o.scope === 'additional' ? 'adicional' : o.scope === 'validation' ? 'validar' : 'por definir'}</span>}
          </button>
        );
      })}
      {opts.length === 0 && <p className="text-xs text-slate-500">No hay opciones disponibles todavía.</p>}
    </div>
  );
}

export function FiltersChoice({ q, cfg }: CtrlProps) {
  const options = availableFilterIds(cfg.catalog).map((id) => ({ value: id, label: filterLabel(id, cfg.catalog) }));
  return (
    <div className="flex flex-col gap-2">
      <MultiChoice q={q} cfg={cfg} options={options} />
      <p className="text-[11px] text-slate-500">Se configuran en la app Search &amp; Discovery de Shopify.</p>
    </div>
  );
}

export function FlagsChoice({ q, cfg }: CtrlProps) {
  const update = useStudio((s) => s.update);
  return (
    <div className="flex flex-col gap-2">
      {q.options!.map((o) => (
        <label key={o.value} className="flex items-center justify-between gap-3 text-sm">
          {o.label}
          <Toggle label={o.label} checked={getPath(cfg, o.value) === true} onChange={(v) => update(o.value, v, q.id)} />
        </label>
      ))}
    </div>
  );
}

export function ToggleControl({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const v = getPath(cfg, q.path!) === true;
  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      <Toggle label={q.title} checked={v} onChange={set} />
      {v ? 'Sí' : 'No'}
    </label>
  );
}

export function TextControl({ q, cfg, multiline }: CtrlProps & { multiline?: boolean }) {
  const set = useSetter(q);
  const v = (getPath(cfg, q.path!) as string) ?? '';
  return multiline ? (
    <textarea aria-label={q.title} rows={3} className={inputCls} value={v} placeholder={q.placeholder} onChange={(e) => set(e.target.value)} />
  ) : (
    <input aria-label={q.title} className={inputCls} value={v} placeholder={q.placeholder} onChange={(e) => set(e.target.value)} />
  );
}

export function NumberControl({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const v = Number(getPath(cfg, q.path!) ?? 0);
  return (
    <div className="flex items-center gap-2">
      <input type="number" aria-label={q.title} className={cn(inputCls, 'w-40')} min={q.min} max={q.max} step={q.step ?? 1} value={v} onChange={(e) => set(Math.max(q.min ?? -Infinity, Math.min(q.max ?? Infinity, Number(e.target.value) || 0)))} />
      {q.suffix && <span className="text-sm text-slate-500">{q.suffix}</span>}
      {q.max !== undefined && q.max <= 100 && <input type="range" aria-hidden tabIndex={-1} min={q.min} max={q.max} value={v} onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-studio-600" />}
    </div>
  );
}

export function ColorsControl({ q, cfg }: CtrlProps) {
  const update = useStudio((s) => s.update);
  const items: [string, string][] = [['brand.primary', 'Primario'], ['brand.secondary', 'Secundario'], ['brand.accent', 'Acento']];
  const presets = [['#1f6f5c', '#f3efe6', '#e9822e'], ['#24408e', '#eef2fb', '#f2b705'], ['#7a1f4d', '#fbf1f5', '#2fa37c'], ['#111827', '#f4f4f5', '#ef4444']];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {items.map(([path, label]) => (
          <label key={path} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {label}
            <span className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5">
              <input type="color" aria-label={`Color ${label}`} value={getPath(cfg, path) as string} onChange={(e) => update(path, e.target.value, q.id)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
              <span className="font-mono text-[11px] uppercase">{getPath(cfg, path) as string}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500">Paletas sugeridas:</span>
        {presets.map((p) => (
          <button key={p.join()} type="button" aria-label={`Aplicar paleta ${p.join(' ')}`} onClick={() => useStudio.getState().mutate((c) => ({ ...c, brand: { ...c.brand, primary: p[0], secondary: p[1], accent: p[2] } }), q.id)} className="flex overflow-hidden rounded-md ring-1 ring-slate-200 hover:ring-studio-400">
            {p.map((c) => <span key={c} className="h-5 w-4" style={{ background: c }} />)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FontsControl({ q, cfg }: CtrlProps) {
  const update = useStudio((s) => s.update);
  return (
    <div className="grid grid-cols-2 gap-2">
      {([['brand.headingFont', 'Títulos'], ['brand.bodyFont', 'Textos']] as const).map(([path, label]) => (
        <label key={path} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          {label}
          <select aria-label={`Tipografía de ${label}`} className={inputCls} value={getPath(cfg, path) as string} onChange={(e) => update(path, e.target.value, q.id)} style={{ fontFamily: getPath(cfg, path) as string }}>
            {FONT_OPTIONS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
          <span className="truncate text-lg text-slate-800" style={{ fontFamily: getPath(cfg, path) as string, fontWeight: path === 'brand.headingFont' ? 800 : 400 }}>Aa Bienestar</span>
        </label>
      ))}
    </div>
  );
}

export function ImagePicker({ value, onChange, label = 'Imagen' }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {value ? <img src={value} alt="" className="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200" /> : <span className="grid h-12 w-16 place-items-center rounded-md bg-slate-100 text-[10px] text-slate-400">Demo</span>}
      <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium hover:bg-slate-50"><ImagePlus size={14} /> {value ? 'Cambiar' : `Subir ${label.toLowerCase()}`}</button>
      {value && <button type="button" onClick={() => onChange(undefined)} className="text-xs text-slate-500 underline">Quitar</button>}
      <input ref={ref} type="file" accept="image/*" className="hidden" aria-label={label} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { onChange(await compressImage(f)); setErr(null); } catch (x) { setErr((x as Error).message); } }} />
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}

export function LogoControl({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  return <ImagePicker label="Logo" value={cfg.brand.logoImage} onChange={(v) => set(v)} />;
}

export function PagesControl({ q, cfg }: CtrlProps) {
  const mutate = useStudio((s) => s.mutate);
  const [custom, setCustom] = useState('');
  const has = (t: PageType) => cfg.pages.some((p) => p.type === t);
  const togglePage = (t: PageType) =>
    mutate((c) => {
      const exists = c.pages.some((p) => p.type === t);
      return { ...c, pages: exists ? c.pages.filter((p) => p.type !== t) : [...c.pages, makePage(t)] };
    }, q.id);
  const addCustom = () => {
    if (!custom.trim()) return;
    mutate((c) => ({ ...c, pages: [...c.pages, makePage('custom', custom.trim())] }), q.id);
    setCustom('');
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5">
        {PAGE_TYPES.filter((t) => !t.repeatable).map((t) => {
          const on = has(t.type);
          return (
            <button key={t.type} type="button" disabled={t.required} aria-pressed={on} onClick={() => togglePage(t.type)} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition disabled:cursor-default', on ? 'border-studio-500 bg-studio-50 text-studio-900' : 'border-slate-200 text-slate-600 hover:border-slate-300')} data-page-type={t.type}>
              <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border', on ? 'border-studio-600 bg-studio-600 text-white' : 'border-slate-300')}>{on && <Check size={11} />}</span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">{t.label}{t.required && <span className="text-[10px] font-normal text-slate-400">Obligatoria</span>}{t.scope !== 'proposal' && <ScopeBadge scope={t.scope} short />}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-600">Páginas personalizadas</span>
        {cfg.pages.filter((p) => p.type === 'custom').map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
            <input aria-label="Título de la página" className="flex-1 bg-transparent font-medium outline-none" value={p.title} onChange={(e) => mutate((c) => ({ ...c, pages: c.pages.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)) }), q.id)} />
            <ScopeBadge scope="additional" short />
            <button type="button" aria-label={`Eliminar ${p.title}`} onClick={() => mutate((c) => ({ ...c, pages: c.pages.filter((x) => x.id !== p.id) }), q.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input aria-label="Nueva página personalizada" className={inputCls} placeholder="Ej. Programa de puntos" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button type="button" onClick={addCustom} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white"><Plus size={14} /> Agregar</button>
        </div>
      </div>
    </div>
  );
}

export function MenuControl({ q, cfg }: CtrlProps) {
  const mutate = useStudio((s) => s.mutate);
  const navigate = useStudio((s) => s.navigate);
  const set = (id: string, key: 'inMenu' | 'inFooter', v: boolean) => mutate((c) => ({ ...c, pages: c.pages.map((p) => (p.id === id ? { ...p, [key]: v } : p)) }), q.id);
  const move = (i: number, d: number) => mutate((c) => { const pages = [...c.pages]; const j = i + d; if (j < 0 || j >= pages.length) return c; [pages[i], pages[j]] = [pages[j], pages[i]]; return { ...c, pages }; }, q.id);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid grid-cols-[1fr_56px_56px_28px] bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><span>Página (orden)</span><span className="text-center">Menú</span><span className="text-center">Footer</span><span /></div>
      {cfg.pages.map((p, i) => (
        <div key={p.id} className="grid grid-cols-[1fr_56px_56px_28px] items-center border-t border-slate-100 px-3 py-1.5 text-sm" data-menu-row={p.id}>
          <span className="flex items-center gap-1.5">
            <span className="flex flex-col"><button type="button" aria-label={`Subir ${p.title}`} onClick={() => move(i, -1)} className="text-[9px] leading-none text-slate-400 hover:text-slate-800">▲</button><button type="button" aria-label={`Bajar ${p.title}`} onClick={() => move(i, 1)} className="text-[9px] leading-none text-slate-400 hover:text-slate-800">▼</button></span>
            {p.title}
          </span>
          <span className="flex justify-center"><input type="checkbox" aria-label={`${p.title} en menú`} checked={p.inMenu} disabled={p.type === 'home'} onChange={(e) => set(p.id, 'inMenu', e.target.checked)} className="h-4 w-4 accent-studio-600" /></span>
          <span className="flex justify-center"><input type="checkbox" aria-label={`${p.title} en footer`} checked={p.inFooter} onChange={(e) => set(p.id, 'inFooter', e.target.checked)} className="h-4 w-4 accent-studio-600" /></span>
          <button type="button" aria-label={`Abrir ${p.title} en el simulador`} onClick={() => navigate(p.id)} className="text-slate-400 hover:text-studio-600"><ExternalLink size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function ReferencesControl({ q, cfg }: CtrlProps) {
  const mutate = useStudio((s) => s.mutate);
  const [draft, setDraft] = useState({ name: '', url: '', note: '' });
  const add = (image?: string) => {
    if (!draft.name.trim() && !image) return;
    mutate((c) => ({ ...c, references: [...c.references, { id: uid(), name: draft.name.trim() || 'Imagen de referencia', url: draft.url.trim() || undefined, note: draft.note.trim(), image }] }), q.id);
    setDraft({ name: '', url: '', note: '' });
  };
  return (
    <div className="flex flex-col gap-2">
      {cfg.references.map((r) => (
        <div key={r.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-xs">
          {r.image && <img src={r.image} alt="" className="h-12 w-16 rounded object-cover" />}
          <div className="min-w-0 flex-1"><p className="font-semibold">{r.name}</p>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-studio-600 underline">{r.url}</a>}{r.note && <p className="text-slate-500">{r.note}</p>}</div>
          <button type="button" aria-label="Eliminar referencia" onClick={() => mutate((c) => ({ ...c, references: c.references.filter((x) => x.id !== r.id) }), q.id)} className="text-slate-400 hover:text-rose-600"><X size={14} /></button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-1.5">
        <input aria-label="Nombre de la referencia" className={inputCls} placeholder="Nombre o sitio" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input aria-label="URL de la referencia" className={inputCls} placeholder="https://" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <input aria-label="Qué les gusta" className={cn(inputCls, 'col-span-2')} placeholder="¿Qué les gusta de esta referencia?" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => add()} className="inline-flex h-8 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white"><Plus size={14} /> Agregar referencia</button>
        <ImagePicker label="Imagen" onChange={(img) => img && add(img)} />
      </div>
    </div>
  );
}

export function TagsControl({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const tags = (getPath(cfg, q.path!) as string[]) ?? [];
  const [v, setV] = useState('');
  const add = () => { const t = v.trim(); if (t && !tags.includes(t)) set([...tags, t]); setV(''); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !v && tags.length) set(tags.slice(0, -1)); };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-1.5 focus-within:border-studio-400">
      {tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">{t}<button type="button" aria-label={`Quitar ${t}`} onClick={() => set(tags.filter((x) => x !== t))} className="text-slate-400 hover:text-rose-600"><X size={12} /></button></span>)}
      <input aria-label={q.title} className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none" placeholder="Escribe y presiona Enter" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={onKey} onBlur={add} />
    </div>
  );
}

export function CustomAttributesControl({ q, cfg }: CtrlProps) {
  const mutate = useStudio((s) => s.mutate);
  const [label, setLabel] = useState('');
  const [values, setValues] = useState('');
  const add = () => {
    const vals = values.split(',').map((x) => x.trim()).filter(Boolean);
    if (!label.trim() || !vals.length) return;
    const id = uid();
    mutate((c) => ({ ...c, catalog: { ...c.catalog, customAttributes: [...c.catalog.customAttributes, { id, label: label.trim(), values: vals }], filters: [...c.catalog.filters, `custom:${id}`] } }), q.id);
    setLabel(''); setValues('');
  };
  return (
    <div className="flex flex-col gap-2">
      {cfg.catalog.customAttributes.map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
          <b>{a.label}</b><span className="flex-1 truncate text-slate-500">{a.values.join(' · ')}</span>
          <button type="button" aria-label={`Eliminar atributo ${a.label}`} onClick={() => mutate((c) => ({ ...c, catalog: { ...c.catalog, customAttributes: c.catalog.customAttributes.filter((x) => x.id !== a.id), filters: c.catalog.filters.filter((f) => f !== `custom:${a.id}`) } }), q.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_1.4fr_auto] gap-1.5">
        <input aria-label="Nombre del atributo" className={inputCls} placeholder="Ej. Dieta" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input aria-label="Valores del atributo" className={inputCls} placeholder="Vegano, Sin gluten, Keto" value={values} onChange={(e) => setValues(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button type="button" onClick={add} className="rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white">Agregar</button>
      </div>
    </div>
  );
}

export function ProductsControl({ q, cfg }: CtrlProps) {
  return <MultiChoice q={q} cfg={cfg} options={demoProductOptions()} />;
}

export function KitsControl({ q, cfg }: CtrlProps) {
  const mutate = useStudio((s) => s.mutate);
  const [name, setName] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [pct, setPct] = useState(10);
  const add = () => {
    if (!name.trim() || sel.length < 2) return;
    mutate((c) => ({ ...c, bundles: { ...c.bundles, kits: [...c.bundles.kits, { id: `kit-${uid()}`, name: name.trim(), productIds: sel, discountPct: pct }] } }), q.id);
    setName(''); setSel([]);
  };
  return (
    <div className="flex flex-col gap-2">
      {cfg.bundles.kits.map((k) => (
        <div key={k.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
          <b>{k.name}</b><span className="flex-1 truncate text-slate-500">{k.productIds.map((id) => getProduct(id)?.name).join(' + ')} · -{k.discountPct}%</span>
          <button type="button" aria-label={`Eliminar kit ${k.name}`} onClick={() => mutate((c) => ({ ...c, bundles: { ...c.bundles, kits: c.bundles.kits.filter((x) => x.id !== k.id) } }), q.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="rounded-lg border border-dashed border-slate-300 p-2.5">
        <div className="grid grid-cols-[1fr_90px] gap-1.5">
          <input aria-label="Nombre del kit" className={inputCls} placeholder="Nombre del kit" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="flex items-center gap-1 text-xs"><input type="number" aria-label="Descuento del kit" min={0} max={50} className={inputCls} value={pct} onChange={(e) => setPct(Number(e.target.value))} />%</label>
        </div>
        <div className="mt-2 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {demoProductOptions().map((o) => <button key={o.value} type="button" aria-pressed={sel.includes(o.value)} onClick={() => setSel(sel.includes(o.value) ? sel.filter((x) => x !== o.value) : [...sel, o.value])} className={cn('rounded-full border px-2 py-0.5 text-[11px]', sel.includes(o.value) ? 'border-studio-500 bg-studio-600 text-white' : 'border-slate-200')}>{o.label}</button>)}
        </div>
        <button type="button" disabled={!name.trim() || sel.length < 2} onClick={add} className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white disabled:opacity-40"><Plus size={14} /> Crear kit ({sel.length} productos)</button>
      </div>
    </div>
  );
}

export function ThemeControl({ q, cfg }: CtrlProps) {
  const set = useSetter(q);
  const [v, setV] = useState(cfg.meta.themeName ?? '');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input aria-label="Nombre del tema" className={inputCls} placeholder="Ej. nombre del tema elegido" value={v} onChange={(e) => setV(e.target.value)} />
        <button type="button" onClick={() => set(v.trim() || null)} className="shrink-0 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white">Guardar</button>
      </div>
      <p className="text-[11px] text-slate-500">{cfg.meta.themeName ? <>Tema registrado: <b>{cfg.meta.themeName}</b>. Aun así, cada componente "dependiente del tema" debe verificarse contra su documentación.</> : 'Sin tema definido: toda compatibilidad de tema se muestra como pendiente.'}</p>
    </div>
  );
}
