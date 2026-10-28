import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CircleCheck, MessageSquare, ThumbsDown, UserRound } from 'lucide-react';
import { PHASES, questionsForPhase, type PhaseId, type Question } from '@/config/questions';
import { decisionMeta, isResolved, scopeOf, SCOPE_WARNING } from '@/engine/answers';
import { buildSitemap } from '@/engine/pmo';
import { cn } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import { Button, inputCls, ScopeBadge, StatusBadge } from '../ui';
import {
  ColorsControl, CustomAttributesControl, FiltersChoice, FlagsChoice, FontsControl, KitsControl, LogoControl, MenuControl, MultiChoice, NumberControl, PagesControl,
  ProductsControl, ReferencesControl, SingleChoice, TagsControl, TextControl, ThemeControl, ToggleControl, VisualChoice,
} from './Controls';
import { HomeBuilder } from './HomeBuilder';

function Control({ q, cfg }: { q: Question; cfg: ProjectConfig }) {
  if (q.id === 'catalog.filters') return <FiltersChoice q={q} cfg={cfg} />;
  switch (q.kind) {
    case 'single': return <SingleChoice q={q} cfg={cfg} />;
    case 'visual': return <VisualChoice q={q} cfg={cfg} />;
    case 'multi': return <MultiChoice q={q} cfg={cfg} />;
    case 'flags': return <FlagsChoice q={q} cfg={cfg} />;
    case 'toggle': return <ToggleControl q={q} cfg={cfg} />;
    case 'text': return <TextControl q={q} cfg={cfg} />;
    case 'textarea': return <TextControl q={q} cfg={cfg} multiline />;
    case 'number': return <NumberControl q={q} cfg={cfg} />;
    case 'colors': return <ColorsControl q={q} cfg={cfg} />;
    case 'fonts': return <FontsControl q={q} cfg={cfg} />;
    case 'logo': return <LogoControl q={q} cfg={cfg} />;
    case 'pages': return <PagesControl q={q} cfg={cfg} />;
    case 'menu': return <MenuControl q={q} cfg={cfg} />;
    case 'references': return <ReferencesControl q={q} cfg={cfg} />;
    case 'homeSections': return <HomeBuilder cfg={cfg} />;
    case 'tags': return <TagsControl q={q} cfg={cfg} />;
    case 'customAttributes': return <CustomAttributesControl q={q} cfg={cfg} />;
    case 'products': return <ProductsControl q={q} cfg={cfg} />;
    case 'kits': return <KitsControl q={q} cfg={cfg} />;
    case 'theme': return <ThemeControl q={q} cfg={cfg} />;
  }
}

function QuestionCard({ q, cfg }: { q: Question; cfg: ProjectConfig }) {
  const { setDecision, navigate } = useStudio();
  const route = useStudio((s) => s.ui.route.page);
  const meta = decisionMeta(q, cfg);
  const scope = scopeOf(q, cfg);
  const [notesOpen, setNotesOpen] = useState(!!meta.notes);
  const warn = scope === 'additional' || scope === 'validation';
  return (
    <article
      className={cn('rounded-2xl border bg-white p-4 transition', meta.status === 'approved' ? 'border-emerald-200' : 'border-slate-200', 'focus-within:border-studio-300 focus-within:shadow-[0_0_0_4px_var(--color-studio-50)]')}
      onFocusCapture={() => q.preview && route !== q.preview && navigate(q.preview)}
      data-question={q.id}
    >
      <header className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold leading-snug text-ink-900">{q.title}</h3>
          {q.help && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{q.help}</p>}
        </div>
        <StatusBadge status={meta.status} />
      </header>
      <Control q={q} cfg={cfg} />
      {warn && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200" role="note" data-testid="scope-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span><b><ScopeBadge scope={scope} /></b> {SCOPE_WARNING}.</span>
        </div>
      )}
      {scope === 'tbd' && <p className="mt-3 text-[11px] text-slate-500">Clasificación: pendiente de definición.</p>}
      <footer className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
        <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-slate-500" title="Responsable de la decisión">
          <UserRound size={13} className="shrink-0" />
          <input aria-label="Responsable" className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-700 hover:border-slate-200 focus:border-studio-300 focus:outline-none" value={meta.owner} onChange={(e) => setDecision(q.id, { owner: e.target.value })} />
        </label>
        <button type="button" aria-label="Notas" aria-pressed={notesOpen} onClick={() => setNotesOpen(!notesOpen)} className={cn('rounded-md p-1.5 hover:bg-slate-100', meta.notes ? 'text-studio-600' : 'text-slate-400')}><MessageSquare size={14} /></button>
        {meta.status !== 'approved' ? (
          <>
            {meta.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => setDecision(q.id, { status: 'proposed' })} title="Marcar como respondida con el valor actual">Confirmar</Button>}
            <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setDecision(q.id, { status: 'rejected' })} aria-label="Rechazar"><ThumbsDown size={13} /></Button>
            <Button size="sm" variant="secondary" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setDecision(q.id, { status: 'approved' })} data-testid="approve"><Check size={13} /> Aprobar</Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setDecision(q.id, { status: 'proposed' })}>Reabrir</Button>
        )}
      </footer>
      {notesOpen && <textarea aria-label="Notas de la decisión" rows={2} className={cn(inputCls, 'mt-2 text-xs')} placeholder="Notas, acuerdos o dudas del cliente" value={meta.notes} onChange={(e) => setDecision(q.id, { notes: e.target.value })} />}
    </article>
  );
}

function Sitemap({ cfg }: { cfg: ProjectConfig }) {
  const navigate = useStudio((s) => s.navigate);
  const route = useStudio((s) => s.ui.route);
  const nodes = buildSitemap(cfg);
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-label="Mapa del sitio" data-testid="sitemap">
      <h3 className="mb-2 font-display text-sm font-bold">Mapa del sitio</h3>
      <ul className="space-y-0.5 text-sm">
        {nodes.map((n) => (
          <li key={n.id}>
            <button type="button" disabled={n.kind === 'external'} onClick={() => navigate(n.route.split('?')[0])} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-white disabled:cursor-default disabled:hover:bg-transparent', route.page === n.id && 'bg-white font-semibold text-studio-700 shadow-sm')} data-sitemap-node={n.id}>
              <span className="flex-1">{n.title}</span>
              {n.inMenu && <span className="rounded bg-studio-100 px-1.5 text-[10px] font-semibold text-studio-700">menú</span>}
              {n.inFooter && <span className="rounded bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600">footer</span>}
              {n.kind === 'external' && <span className="text-[10px] text-slate-400">Shopify</span>}
            </button>
            {n.children && (
              <ul className="ml-4 border-l border-slate-200 pl-2">
                {n.children.map((c) => {
                  const [page, qs] = c.route.split('?');
                  return <li key={c.id}><button type="button" onClick={() => navigate(page, qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined)} className="w-full rounded-md px-2 py-0.5 text-left text-xs text-slate-600 hover:bg-white">{c.title}</button></li>;
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiscoveryPanel({ project }: { project: ProjectConfig }) {
  const { ui, setUi, navigate } = useStudio();
  const scroller = useRef<HTMLDivElement>(null);
  const phase = PHASES.find((p) => p.id === ui.phase) ?? PHASES[0];
  const qs = questionsForPhase(phase.id, project);
  const stats = (id: PhaseId) => {
    const list = questionsForPhase(id, project);
    return { done: list.filter((q) => isResolved(q, project)).length, approved: list.filter((q) => decisionMeta(q, project).status === 'approved').length, total: list.length };
  };
  const goPhase = (id: PhaseId) => {
    const p = PHASES.find((x) => x.id === id)!;
    setUi({ phase: id });
    navigate(p.preview === 'product' ? 'product' : p.preview);
  };
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [phase.id]);
  const st = stats(phase.id);
  const idx = PHASES.indexOf(phase);

  return (
    <div className="flex min-h-0 w-full flex-col">
      <nav aria-label="Fases del Discovery" className="border-b border-slate-200 px-3 pb-2 pt-3">
        <ol className="grid grid-cols-7 gap-1">
          {PHASES.map((p) => {
            const s = stats(p.id);
            const pct = s.total ? s.done / s.total : 0;
            const active = p.id === phase.id;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => goPhase(p.id)} aria-current={active ? 'step' : undefined} title={`${p.index}. ${p.title} — ${s.done}/${s.total}`} className={cn('flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 transition', active ? 'bg-studio-50' : 'hover:bg-slate-50')} data-testid={`phase-${p.id}`}>
                  <span className={cn('relative grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold', active ? 'bg-studio-600 text-white' : pct === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600')}>
                    {pct === 1 && !active ? <CircleCheck size={15} /> : p.index}
                  </span>
                  <span className={cn('w-full truncate text-center text-[10px] font-semibold', active ? 'text-studio-700' : 'text-slate-500')}>{p.short}</span>
                  <span className="h-1 w-full overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-studio-500 transition-all" style={{ width: `${pct * 100}%` }} /></span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div ref={scroller} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-studio-600">Fase {phase.index} de {PHASES.length}</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink-900">{phase.title}</h2>
          <p className="text-sm text-slate-500">{phase.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500"><span><b className="text-slate-800">{st.done}</b>/{st.total} respondidas</span><span><b className="text-emerald-700">{st.approved}</b> aprobadas</span></div>
        </div>
        <div className="flex flex-col gap-3">
          {qs.map((q) => <QuestionCard key={q.id} q={q} cfg={project} />)}
          {phase.id === 'identity' && <Sitemap cfg={project} />}
          {phase.id === 'sap' && <p className="rounded-xl bg-sky-50 p-3 text-xs text-sky-900">Esta fase documenta decisiones de integración. El simulador no implementa ni simula una integración SAP real; los riesgos derivados aparecen en el panel PMO.</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <Button variant="ghost" disabled={idx === 0} onClick={() => goPhase(PHASES[idx - 1].id)}><ChevronLeft size={16} /> Anterior</Button>
        {idx < PHASES.length - 1 ? (
          <Button variant="primary" onClick={() => goPhase(PHASES[idx + 1].id)} data-testid="next-phase">Siguiente: {PHASES[idx + 1].short} <ChevronRight size={16} /></Button>
        ) : (
          <Button variant="primary" onClick={() => setUi({ workspace: 'pmo' })}>Revisar en PMO <ChevronRight size={16} /></Button>
        )}
      </div>
    </div>
  );
}
