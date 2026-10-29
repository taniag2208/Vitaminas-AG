import { useMemo, useState } from 'react';
import { ArrowUpRight, Building2, Eye, Gift, Lightbulb, LayoutTemplate, Megaphone, Minus, Package, Plus, Search, ShoppingCart, Sparkles, Tag, Target, Workflow, X } from 'lucide-react';
import { ACTIVATED_BY, FOLLOW_UPS, getQuestion } from '@/config/discovery';
import { GROUP_LABEL } from '@/config/discovery/toppings';
import { SectionThumb } from '@/components/discovery/SectionThumb';
import { Control } from '@/components/discovery/DiscoveryPanel';
import { PRIORITY_LABEL } from '@/engine/deliverables';
import { SCOPE_LABEL } from '@/engine/labels';
import { showPreview } from '@/lib/preview';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/store/useDerived';
import { useStudio } from '@/store/useStudio';
import type { DiscoveryProject, Priority, TechValidation, ToppingGroup, ToppingStatus, ToppingView } from '@/types/discovery';
import { inputCls, ScopeBadge, TechBadge, ToppingStatusBadge } from '../ui';

const GROUP_ICON: Record<ToppingGroup, typeof Tag> = { home: LayoutTemplate, catalog: Search, pdp: Package, cart: ShoppingCart, marketing: Megaphone, loyalty: Gift, personalization: Sparkles, b2b: Building2, operations: Workflow };
const PAGE_LABEL: Record<string, string> = { home: 'Home', catalog: 'Catálogo', product: 'Ficha de producto', cart: 'Carrito', account: 'Cuenta', kits: 'Kits', tracking: 'Seguimiento' };

const STATUS_FILTERS: [ToppingStatus | 'all' | 'active', string][] = [['all', 'Todos'], ['active', 'En el proyecto'], ['recommended', 'Recomendados'], ['approved', 'Aprobados'], ['discarded', 'Descartados'], ['available', 'Disponibles']];
const VALIDATION: [TechValidation, string][] = [['pending', 'Pendiente'], ['viable', 'Viable'], ['review', 'En revisión'], ['not_viable', 'No viable']];

function ToppingCard({ v, selected, onSelect }: { v: ToppingView; selected: boolean; onSelect: () => void }) {
  const cfg = useAnalysis()!.config;
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn('flex flex-col gap-2 rounded-2xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md', selected ? 'border-studio-500 ring-2 ring-studio-100' : 'border-slate-200')} data-topping-card={v.def.id}>
      {v.def.sim.kind === 'section' ? <SectionThumb type={v.def.sim.section} primary={cfg.brand.primary} accent={cfg.brand.accent} /> : (
        <div className={cn('flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-md text-center ring-1', v.def.sim.kind === 'none' ? 'bg-slate-50 text-slate-400 ring-slate-200' : 'bg-studio-50 text-studio-600 ring-studio-100')}>
          {(() => { const Icon = GROUP_ICON[v.def.group]; return <Icon size={26} />; })()}
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider">{v.def.sim.kind === 'none' ? 'Sin pantalla' : `Se ve en: ${PAGE_LABEL[v.def.sim.page] ?? v.def.sim.page}`}</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 font-display text-sm font-bold leading-tight text-ink-900">{v.def.name}</span>
        <ToppingStatusBadge status={v.status} />
      </div>
      <p className="line-clamp-2 text-xs text-slate-500">{v.def.problem}</p>
      <div className="mt-auto flex flex-wrap gap-1">{v.def.techClass.slice(0, 2).map((c) => <TechBadge key={c} cls={c} />)}</div>
    </button>
  );
}

function Detail({ v, project, onClose }: { v: ToppingView; project: DiscoveryProject; onClose: () => void }) {
  const { addTopping, removeTopping, setTopping, setUi, focusQuestion } = useStudio();
  const analysis = useAnalysis()!;
  const followUps = (FOLLOW_UPS[v.def.id] ?? []).map(getQuestion).filter((q) => q && analysis.visibleIds.has(q.id));
  const goQuestion = (qid: string) => { const q = getQuestion(qid); if (!q) return; setUi({ workspace: 'discovery' }); focusQuestion(q.stage, qid); };
  const seeSim = () => {
    const sim = v.def.sim;
    if (sim.kind === 'none') return;
    setUi({ workspace: 'discovery' });
    setTimeout(() => showPreview(sim.kind === 'section' ? { page: 'home', target: v.def.annotation } : { page: sim.page, target: sim.target }), 50);
  };
  return (
    <aside className="animate-slide-right flex h-full w-full flex-col border-l border-slate-200 bg-white lg:w-[420px]" aria-label={`Detalle de ${v.def.name}`} data-testid="topping-detail">
      <div className="flex items-start gap-2 border-b border-slate-100 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-studio-600">{GROUP_LABEL[v.def.group]}</p>
          <h3 className="font-display text-lg font-extrabold leading-tight">{v.def.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5"><ToppingStatusBadge status={v.status} /><ScopeBadge scope={v.def.scope} short /></div>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <p className="text-slate-700">{v.def.description}</p>
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-amber-900"><Target size={16} className="mt-0.5 shrink-0" /><span><b>Problema que resuelve:</b> {v.def.problem}</span></p>
        {v.reasons.length > 0 && <p className="flex gap-2 rounded-xl bg-sky-50 p-3 text-sky-900"><Lightbulb size={16} className="mt-0.5 shrink-0" /><span><b>Recomendado:</b> {v.reasons.join(' ')}</span></p>}

        <div className="flex flex-wrap gap-2">
          {v.active ? (
            <button type="button" onClick={() => removeTopping(v.def.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" data-testid="remove-topping"><Minus size={14} /> Quitar del proyecto</button>
          ) : (
            <button type="button" onClick={() => addTopping(v.def.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-studio-600 px-3 text-sm font-semibold text-white hover:bg-studio-700" data-testid="add-topping"><Plus size={14} /> Agregar al proyecto</button>
          )}
          {v.def.sim.kind !== 'none' ? <button type="button" onClick={seeSim} disabled={!v.active} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"><Eye size={14} /> Ver en el simulador</button> : <span className="self-center text-xs text-slate-500">{v.def.sim.reason}</span>}
        </div>

        {v.def.variants && (
          <section><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Variantes</h4><ul className="flex flex-wrap gap-1.5">{v.def.variants.map((x) => <li key={x.id} className={cn('rounded-full border px-2.5 py-1 text-xs', v.variant === x.id ? 'border-studio-500 bg-studio-50 font-semibold text-studio-800' : 'border-slate-200 text-slate-600')}>{x.label}</li>)}</ul></section>
        )}

        {followUps.length > 0 && (
          <section>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Configuración (preguntas de seguimiento)</h4>
            <div className="flex flex-col gap-3">
              {followUps.map((q) => q && (
                <div key={q.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-[13px] font-semibold text-slate-800">{q.text}</p>
                  <Control q={q} value={project.answers[q.id]?.value} suggested={q.suggest?.(project)} cfg={analysis.config} onChange={(val) => useStudio.getState().answer(q.id, val)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Preguntas que lo activan</h4>
          <ul className="space-y-1">{(ACTIVATED_BY[v.def.id] ?? []).map((qid) => <li key={qid}><button type="button" onClick={() => goQuestion(qid)} className="flex w-full items-center gap-1.5 text-left text-xs text-slate-700 hover:text-studio-700"><span className="font-mono text-[10px] text-slate-400">{qid}</span><span className="flex-1">{getQuestion(qid)?.text}</span>{v.activatedBy.includes(qid) && <span className="text-[10px] font-semibold text-studio-700">activa</span>}<ArrowUpRight size={12} /></button></li>)}{!(ACTIVATED_BY[v.def.id] ?? []).length && <li className="text-xs text-slate-500">Solo se agrega desde la biblioteca o por recomendación.</li>}</ul>
        </section>

        <section className="grid gap-3">
          <div><h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Clasificación técnica preliminar</h4><div className="flex flex-wrap gap-1">{v.def.techClass.map((c) => <TechBadge key={c} cls={c} />)}</div></div>
          <div><h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Dependencias</h4><ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-700">{v.def.dependencies.map((d) => <li key={d}>{d}</li>)}{!v.def.dependencies.length && <li>Ninguna</li>}</ul></div>
          <p className="text-xs text-slate-500">Alcance comercial: {SCOPE_LABEL[v.def.scope]}</p>
        </section>

        {v.active && (
          <section className="rounded-xl border border-slate-200 p-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Validación</h4>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" aria-pressed={v.status === 'approved'} onClick={() => setTopping(v.def.id, { approval: v.status === 'approved' ? 'requested' : 'approved', priority: v.record.priority ?? 'should' })} className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', v.status === 'approved' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 text-emerald-700')}>Aprobado por el cliente</button>
              <button type="button" onClick={() => setTopping(v.def.id, { approval: 'discarded' })} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">Descartar</button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">Viabilidad técnica
              <select value={v.record.validation ?? 'pending'} onChange={(e) => setTopping(v.def.id, { validation: e.target.value as TechValidation })} className="rounded-md border border-slate-200 px-2 py-1 text-xs">{VALIDATION.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </label>
            {v.status === 'approved' && <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">Prioridad<select value={v.record.priority ?? 'should'} onChange={(e) => setTopping(v.def.id, { priority: e.target.value as Priority })} className="rounded-md border border-slate-200 px-2 py-1 text-xs">{(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => <option key={k} value={k}>{PRIORITY_LABEL[k]}</option>)}</select></label>}
            <textarea aria-label="Notas técnicas" rows={2} className={cn(inputCls, 'mt-2 text-xs')} placeholder="Notas técnicas o comerciales" value={v.record.notes ?? ''} onChange={(e) => setTopping(v.def.id, { notes: e.target.value })} />
          </section>
        )}
        {v.status === 'discarded' && <button type="button" onClick={() => setTopping(v.def.id, { approval: 'requested' })} className="text-xs font-semibold text-studio-700 underline">Volver a considerar</button>}
      </div>
    </aside>
  );
}

export function ToppingsWorkspace({ project }: { project: DiscoveryProject }) {
  const analysis = useAnalysis(project)!;
  const [group, setGroup] = useState<ToppingGroup | 'all'>('all');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number][0]>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const list = useMemo(() => analysis.toppings.filter((v) => (group === 'all' || v.def.group === group) && (status === 'all' || (status === 'active' ? v.active : v.status === status)) && `${v.def.name} ${v.def.description} ${v.def.problem}`.toLowerCase().includes(q.toLowerCase())), [analysis, group, status, q]);
  const sel = analysis.toppings.find((v) => v.def.id === selected);
  const groups = Object.keys(GROUP_LABEL) as ToppingGroup[];
  const count = (s: ToppingStatus) => analysis.toppings.filter((v) => v.status === s).length;
  return (
    <div className="flex min-h-0 w-full flex-1" data-testid="toppings-workspace">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold">Biblioteca de toppings</h2>
              <p className="text-xs text-slate-500">{analysis.toppings.length} funcionalidades · {count('requested') + count('approved')} en el proyecto · {count('approved')} aprobadas · {count('recommended')} recomendadas</p>
            </div>
            <label className="relative ml-auto"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input aria-label="Buscar toppings" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className={cn(inputCls, 'w-56 pl-8')} /></label>
          </div>
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')} className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', group === 'all' ? 'bg-ink-900 text-white' : 'bg-slate-100 text-slate-600')}>Todos los grupos</button>
            {groups.map((g) => <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', group === g ? 'bg-ink-900 text-white' : 'bg-slate-100 text-slate-600')}>{GROUP_LABEL[g]}</button>)}
          </div>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {STATUS_FILTERS.map(([id, label]) => <button key={id} type="button" aria-pressed={status === id} onClick={() => setStatus(id)} className={cn('shrink-0 rounded-md px-2.5 py-1 text-xs font-medium', status === id ? 'bg-studio-600 text-white' : 'text-slate-600 hover:bg-slate-100')} data-testid={`topping-filter-${id}`}>{label}</button>)}
          </div>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {list.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No hay toppings con esos filtros.</p> : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {list.map((v) => <ToppingCard key={v.def.id} v={v} selected={selected === v.def.id} onSelect={() => setSelected(v.def.id)} />)}
            </div>
          )}
        </div>
      </div>
      {sel && <div className="fixed inset-0 z-40 lg:static lg:z-auto"><Detail v={sel} project={project} onClose={() => setSelected(null)} /></div>}
    </div>
  );
}
