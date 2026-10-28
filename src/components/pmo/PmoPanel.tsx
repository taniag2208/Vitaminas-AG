import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Download, FileSearch, GitBranch, ListChecks, Map, Puzzle, Scale, ShieldAlert } from 'lucide-react';
import { PHASES, questionsForPhase } from '@/config/questions';
import { decisionMeta, isResolved, SCOPE_LABEL, STATUS_LABEL } from '@/engine/answers';
import { buildSitemap, pmoSummary, type SitemapNode } from '@/engine/pmo';
import { cn } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { DecisionStatus, ProjectConfig, ScopeStatus } from '@/types/project';
import { EXPORTS, runExport } from '../studio/ExportMenu';
import { inputCls, ScopeBadge, StatusBadge, TechBadge } from '../ui';

const TABS = [
  ['summary', 'Resumen', ClipboardList],
  ['decisions', 'Decisiones', ListChecks],
  ['requirements', 'Requerimientos', Puzzle],
  ['scope', 'Alcance', Scale],
  ['risks', 'Riesgos', ShieldAlert],
  ['deps', 'Dependencias', GitBranch],
  ['acceptance', 'Criterios', CheckCircle2],
  ['sitemap', 'Mapa del sitio', Map],
  ['exports', 'Exportar', Download],
] as const;
type Tab = (typeof TABS)[number][0];

const Kpi = ({ label, value, tone = 'slate', sub }: { label: string; value: string | number; tone?: string; sub?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className={cn('mt-1 font-display text-3xl font-extrabold', { slate: 'text-ink-900', green: 'text-emerald-600', violet: 'text-studio-600', rose: 'text-rose-600', amber: 'text-amber-600' }[tone])}>{value}</p>
    {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
  </div>
);

export function PmoPanel({ project }: { project: ProjectConfig }) {
  const [tab, setTab] = useState<Tab>('summary');
  const s = useMemo(() => pmoSummary(project), [project]);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50" data-testid="pmo-panel">
      <div className="border-b border-slate-200 bg-white px-4">
        <div role="tablist" aria-label="Secciones PMO" className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium', tab === id ? 'border-studio-600 text-studio-700' : 'border-transparent text-slate-500 hover:text-slate-800')} data-testid={`pmo-tab-${id}`}>
              <Icon size={15} /> {label}
              {id === 'risks' && <span className="rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">{s.risks.length}</span>}
              {id === 'decisions' && <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">{s.pending}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          {tab === 'summary' && <Summary project={project} s={s} goTab={setTab} />}
          {tab === 'decisions' && <Decisions project={project} />}
          {tab === 'requirements' && <Requirements s={s} />}
          {tab === 'scope' && <Scope s={s} />}
          {tab === 'risks' && <Risks s={s} />}
          {tab === 'deps' && <Deps s={s} />}
          {tab === 'acceptance' && <Acceptance s={s} />}
          {tab === 'sitemap' && <SitemapView project={project} />}
          {tab === 'exports' && <Exports project={project} />}
        </div>
      </div>
    </div>
  );
}

type S = ReturnType<typeof pmoSummary>;

function Summary({ project, s, goTab }: { project: ProjectConfig; s: S; goTab: (t: Tab) => void }) {
  const { setUi } = useStudio();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Avance del Discovery" value={`${s.progress}%`} tone="violet" sub={`${s.proposed + s.approved} de ${s.total} decisiones`} />
        <Kpi label="Aprobadas" value={s.approved} tone="green" />
        <Kpi label="Pendientes" value={s.pending} />
        <Kpi label="Requerimientos" value={s.requirements.length} sub={`${s.scope.validation + s.scope.additional + s.scope.tbd} requieren revisión`} />
        <Kpi label="Riesgos altos" value={s.risks.filter((r) => r.level === 'Alta').length} tone="rose" sub={`${s.risks.length} en total`} />
        <Kpi label="Tema Shopify" value={project.meta.themeName ? 'Definido' : 'Pendiente'} tone={project.meta.themeName ? 'green' : 'amber'} sub={project.meta.themeName ?? 'Compatibilidad sin validar'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-display font-bold">Avance por fase</h3>
          <ul className="space-y-3">
            {PHASES.map((p) => {
              const list = questionsForPhase(p.id, project);
              const done = list.filter((q) => isResolved(q, project)).length;
              const appr = list.filter((q) => decisionMeta(q, project).status === 'approved').length;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setUi({ workspace: 'studio', phase: p.id })} className="group w-full text-left">
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium group-hover:text-studio-700">{p.index}. {p.title}</span><span className="text-xs text-slate-500">{done}/{list.length} · {appr} aprobadas</span></div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-500" style={{ width: `${(appr / list.length) * 100}%` }} /><div className="bg-studio-400" style={{ width: `${((done - appr) / list.length) * 100}%` }} /></div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-display font-bold">Clasificación de alcance</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(s.scope) as ScopeStatus[]).map((k) => (
              <button key={k} type="button" onClick={() => goTab('scope')} className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300">
                <ScopeBadge scope={k} />
                <span className="font-display text-2xl font-extrabold">{s.scope[k]}</span>
              </button>
            ))}
          </div>
          <h3 className="mb-2 mt-5 font-display font-bold">Riesgos prioritarios</h3>
          <ul className="space-y-1.5">
            {s.risks.filter((r) => r.level === 'Alta').slice(0, 5).map((r) => <li key={r.id} className="flex gap-2 text-sm"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />{r.text}</li>)}
            {s.risks.filter((r) => r.level === 'Alta').length === 0 && <li className="text-sm text-slate-500">Sin riesgos altos.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Decisions({ project }: { project: ProjectConfig }) {
  const { setDecision, setUi } = useStudio();
  const [phase, setPhase] = useState('all');
  const [status, setStatus] = useState<'all' | DecisionStatus>('all');
  const rows = pmoSummary(project).rows.filter((r) => (phase === 'all' || r.phase === phase) && (status === 'all' || r.status === status));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
        <h3 className="mr-auto font-display font-bold">Registro de decisiones ({rows.length})</h3>
        <select aria-label="Filtrar por fase" className={cn(inputCls, 'w-auto')} value={phase} onChange={(e) => setPhase(e.target.value)}><option value="all">Todas las fases</option>{PHASES.map((p) => <option key={p.id} value={p.title}>{p.index}. {p.title}</option>)}</select>
        <select aria-label="Filtrar por estado" className={cn(inputCls, 'w-auto')} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">Todos los estados</option>{(Object.keys(STATUS_LABEL) as DecisionStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Decisión</th><th className="px-4 py-2">Respuesta actual</th><th className="px-4 py-2">Alcance</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Responsable</th><th className="px-4 py-2">Notas</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="align-top" data-decision={r.id}>
                <td className="max-w-[260px] px-4 py-3"><p className="text-[11px] text-slate-400">{r.phase}</p><p className="font-medium">{r.question}</p></td>
                <td className="max-w-[280px] px-4 py-3 text-slate-600">{r.answer}</td>
                <td className="px-4 py-3"><ScopeBadge scope={r.scope} short /></td>
                <td className="px-4 py-3">
                  <select aria-label={`Estado de ${r.question}`} value={r.status} onChange={(e) => setDecision(r.id, { status: e.target.value as DecisionStatus })} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">{(Object.keys(STATUS_LABEL) as DecisionStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select>
                  <div className="mt-1"><StatusBadge status={r.status} /></div>
                </td>
                <td className="px-4 py-3"><input aria-label={`Responsable de ${r.question}`} value={r.owner} onChange={(e) => setDecision(r.id, { owner: e.target.value })} className="w-44 rounded-md border border-slate-200 px-2 py-1 text-xs" /></td>
                <td className="px-4 py-3"><input aria-label={`Notas de ${r.question}`} value={r.notes} onChange={(e) => setDecision(r.id, { notes: e.target.value })} placeholder="—" className="w-48 rounded-md border border-slate-200 px-2 py-1 text-xs" /></td>
                <td className="px-4 py-3"><button type="button" title="Ir a la pregunta" aria-label="Ir a la pregunta" onClick={() => setUi({ workspace: 'studio', phase: PHASES.find((p) => p.title === r.phase)!.id })} className="text-slate-400 hover:text-studio-600"><ArrowUpRight size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Requirements({ s }: { s: S }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-2" data-testid="requirements">
      {s.requirements.map((r) => (
        <article key={r.id} className="rounded-2xl border border-slate-200 bg-white">
          <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left">
            <span className="font-mono text-xs font-bold text-studio-600">{r.id}</span>
            <span className="min-w-0 flex-1 font-medium">{r.name} <span className="text-xs text-slate-400">· {r.area}</span></span>
            <span className="flex flex-wrap gap-1">{r.classes.map((c) => <TechBadge key={c} cls={c} pending={r.themePending} />)}</span>
            <ScopeBadge scope={r.scope} short />
          </button>
          {open === r.id && (
            <div className="grid gap-4 border-t border-slate-100 px-4 py-4 text-sm md:grid-cols-2">
              <div><p className="mb-1 text-[11px] font-bold uppercase text-slate-500">Funcionalidad</p><p>{r.functionality}</p><p className="mb-1 mt-3 text-[11px] font-bold uppercase text-slate-500">Implementación sugerida</p><p className="text-slate-600">{r.implementation}</p></div>
              <div className="space-y-3">
                <List title="Dependencias" items={r.dependencies} />
                <List title="Riesgos" items={r.risks} />
                <List title="Criterios de aceptación" items={r.acceptance} check />
              </div>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

const List = ({ title, items, check }: { title: string; items: string[]; check?: boolean }) => (
  <div><p className="mb-1 text-[11px] font-bold uppercase text-slate-500">{title}</p>{items.length ? <ul className="space-y-1">{items.map((i) => <li key={i} className="flex gap-2">{check ? <span className="mt-1 h-3 w-3 shrink-0 rounded border border-slate-400" /> : <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />}{i}</li>)}</ul> : <p className="text-slate-400">—</p>}</div>
);

function Scope({ s }: { s: S }) {
  const order: ScopeStatus[] = ['additional', 'validation', 'tbd', 'proposal'];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {order.map((k) => {
        const reqs = s.requirements.filter((r) => r.scope === k);
        const decs = s.rows.filter((r) => r.scope === k);
        return (
          <section key={k} className="rounded-2xl border border-slate-200 bg-white p-5" data-scope={k}>
            <div className="mb-3 flex items-center justify-between"><ScopeBadge scope={k} /><span className="text-xs text-slate-500">{reqs.length} requerimientos · {decs.length} decisiones</span></div>
            {k !== 'proposal' && <p className="mb-3 text-xs text-amber-800">{k === 'tbd' ? 'Requiere definición antes de estimar.' : 'Esta funcionalidad requiere revisión de alcance y viabilidad antes de confirmar su implementación.'}</p>}
            <ul className="space-y-1.5 text-sm">{reqs.map((r) => <li key={r.id} className="flex gap-2"><span className="font-mono text-xs text-studio-600">{r.id}</span>{r.name}</li>)}{reqs.length === 0 && <li className="text-slate-400">Ninguno</li>}</ul>
          </section>
        );
      })}
    </div>
  );
}

function Risks({ s }: { s: S }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid="risks">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">ID</th><th className="px-4 py-2">Nivel</th><th className="px-4 py-2">Área</th><th className="px-4 py-2">Riesgo</th><th className="px-4 py-2">Mitigación</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {s.risks.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
              <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', r.level === 'Alta' ? 'bg-rose-100 text-rose-700' : r.level === 'Media' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}>{r.level}</span></td>
              <td className="px-4 py-3 text-slate-600">{r.area}</td>
              <td className="px-4 py-3">{r.text}</td>
              <td className="px-4 py-3 text-slate-600">{r.mitigation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {s.risks.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Sin riesgos detectados.</p>}
    </section>
  );
}

function Deps({ s }: { s: S }) {
  const map = new globalThis.Map<string, string[]>();
  s.requirements.forEach((r) => r.dependencies.forEach((d) => map.set(d, [...(map.get(d) ?? []), r.id])));
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Dependencia</th><th className="px-4 py-2">Requerimientos</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{[...map.entries()].sort((a, b) => b[1].length - a[1].length).map(([d, ids]) => <tr key={d}><td className="px-4 py-2.5">{d}</td><td className="px-4 py-2.5 font-mono text-xs text-studio-600">{ids.join(', ')}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function Acceptance({ s }: { s: S }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {s.requirements.map((r) => (
        <section key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold"><span className="mr-2 font-mono text-xs text-studio-600">{r.id}</span>{r.name}</p>
          <ul className="space-y-1 text-sm text-slate-700">{r.acceptance.map((a) => <li key={a} className="flex gap-2"><span className="mt-1 h-3 w-3 shrink-0 rounded border border-slate-400" />{a}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}

function SitemapView({ project }: { project: ProjectConfig }) {
  const { setUi, navigate } = useStudio();
  const open = (n: SitemapNode) => { const [p, qs] = n.route.split('?'); navigate(p, qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined); setUi({ workspace: 'studio' }); };
  const nodes = buildSitemap(project);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap gap-3">
        {nodes.map((n) => (
          <div key={n.id} className="min-w-[200px] flex-1 rounded-xl border border-slate-200 p-3">
            <button type="button" disabled={n.kind === 'external'} onClick={() => open(n)} className="flex w-full items-center justify-between text-left font-semibold hover:text-studio-700 disabled:hover:text-inherit">{n.title}<FileSearch size={14} className="text-slate-400" /></button>
            <p className="font-mono text-[11px] text-slate-400">/{n.route}</p>
            <div className="mt-1 flex gap-1">{n.inMenu && <span className="rounded bg-studio-100 px-1.5 text-[10px] font-semibold text-studio-700">menú</span>}{n.inFooter && <span className="rounded bg-slate-200 px-1.5 text-[10px] font-semibold">footer</span>}</div>
            {n.note && <p className="mt-1 text-[11px] text-slate-500">{n.note}</p>}
            {n.children && <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-xs">{n.children.map((c) => <li key={c.id}><button type="button" onClick={() => open(c)} className="hover:text-studio-700">{c.title}</button></li>)}</ul>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Exports({ project }: { project: ProjectConfig }) {
  const [preview, setPreview] = useState<string>('summary');
  const e = EXPORTS.find((x) => x.id === preview)!;
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-2">
        {EXPORTS.map((x) => (
          <div key={x.id} className={cn('flex items-center gap-2 rounded-xl border bg-white p-3', preview === x.id ? 'border-studio-400' : 'border-slate-200')}>
            <button type="button" onClick={() => setPreview(x.id)} className="flex flex-1 items-center gap-2 text-left text-sm font-medium"><x.icon size={16} className="text-studio-600" />{x.label}</button>
            <button type="button" aria-label={`Descargar ${x.label}`} onClick={() => runExport(project, x.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Download size={16} /></button>
          </div>
        ))}
        <p className="text-xs text-slate-500">{SCOPE_LABEL.validation}, adicional y pendiente quedan marcados en cada exportación.</p>
      </div>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-ink-950">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-400"><span>Vista previa · {e.label}</span><button type="button" onClick={() => runExport(project, e.id)} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-white hover:bg-white/20"><Download size={12} /> Descargar</button></div>
        <pre className="thin-scroll max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-slate-200" data-testid="export-preview">{e.fn(project)}</pre>
      </section>
    </div>
  );
}
