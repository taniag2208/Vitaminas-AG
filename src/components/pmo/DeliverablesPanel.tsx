import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Circle, ClipboardCheck, Download, FileText, LayoutList, ListTodo, Map, MessageSquareText, ShieldAlert, Store, Table } from 'lucide-react';
import { TECH_CLASS_LABEL } from '@/config/annotations';
import { STAGES } from '@/config/discovery/stages';
import { GROUP_LABEL } from '@/config/discovery/toppings';
import {
  backlog, dependencies, executiveSummary, pagesAndComponents, pendingDecisions, PRIORITY_LABEL, questionMatrix, requirements, risks, shopifyClassification, toppingInventory, validationChecklist,
} from '@/engine/deliverables';
import { ANSWER_STATUS_LABEL, SCOPE_LABEL } from '@/engine/labels';
import { cn } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import type { DiscoveryProject } from '@/types/discovery';
import { EXPORTS, runExport, type ExportId } from '../studio/ExportMenu';
import { ScopeBadge, StatusBadge, TechBadge, ToppingStatusBadge } from '../ui';

const TABS = [
  ['executive', 'Resumen ejecutivo', FileText],
  ['requirements', 'Requerimientos', Table],
  ['pages', 'Páginas y componentes', Map],
  ['toppings', 'Toppings', LayoutList],
  ['backlog', 'Backlog', ListTodo],
  ['risks', 'Riesgos y pendientes', ShieldAlert],
  ['shopify', 'Clasificación Shopify', Store],
  ['checklist', 'Checklist', ClipboardCheck],
  ['answers', 'Respuestas', MessageSquareText],
  ['exports', 'Exportar', Download],
] as const;
type Tab = (typeof TABS)[number][0];

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => <section className={cn('rounded-2xl border border-slate-200 bg-white p-5', className)}>{children}</section>;
const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-3 font-display font-bold text-ink-900">{children}</h3>;
const Kpi = ({ label, value, tone = 'text-ink-900', sub }: { label: string; value: string | number; tone?: string; sub?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={cn('mt-1 font-display text-3xl font-extrabold', tone)}>{value}</p>{sub && <p className="text-[11px] text-slate-400">{sub}</p>}</div>
);

export function DeliverablesPanel({ project }: { project: DiscoveryProject }) {
  const [tab, setTab] = useState<Tab>('executive');
  const nRisks = useMemo(() => risks(project).length, [project]);
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-slate-50" data-testid="deliverables-panel">
      <div className="border-b border-slate-200 bg-white px-4">
        <div role="tablist" aria-label="Entregables" className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium', tab === id ? 'border-studio-600 text-studio-700' : 'border-transparent text-slate-500 hover:text-slate-800')} data-testid={`deliverable-tab-${id}`}>
              <Icon size={15} /> {label}
              {id === 'risks' && <span className="rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">{nRisks}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          <p className="mb-4 text-xs text-slate-500">Todo se genera a partir de las respuestas del Discovery y las decisiones sobre toppings. Lo <b>solicitado</b> no se cuenta como <b>aprobado</b>.</p>
          {tab === 'executive' && <Executive p={project} />}
          {tab === 'requirements' && <Requirements p={project} />}
          {tab === 'pages' && <Pages p={project} />}
          {tab === 'toppings' && <ToppingsInv p={project} />}
          {tab === 'backlog' && <Backlog p={project} />}
          {tab === 'risks' && <Risks p={project} />}
          {tab === 'shopify' && <Shopify p={project} />}
          {tab === 'checklist' && <Checklist p={project} />}
          {tab === 'answers' && <Answers p={project} />}
          {tab === 'exports' && <Exports p={project} />}
        </div>
      </div>
    </div>
  );
}

function Executive({ p }: { p: DiscoveryProject }) {
  const e = executiveSummary(p);
  const { setUi } = useStudio();
  return (
    <div className="flex flex-col gap-4" data-testid="executive-summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Discovery resuelto" value={`${e.progress.pct}%`} tone="text-studio-600" sub={`${e.progress.resolved} de ${e.progress.total} preguntas que aplican`} />
        <Kpi label="Funcionalidades aprobadas" value={e.toppings.approved} tone="text-emerald-600" sub={`${e.toppings.requested} solicitadas por aprobar`} />
        <Kpi label="Por validar / pendientes" value={`${e.progress.toValidate} / ${e.progress.pending}`} tone="text-amber-600" />
        <Kpi label="Riesgos altos" value={e.risks.length} tone="text-rose-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><H>El negocio</H><dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 text-sm">{e.business.map(([k, v]) => <Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="text-slate-800">{v}</dd></Fragment>)}</dl></Card>
        <Card>
          <H>Avance por etapa</H>
          <ul className="space-y-2.5">
            {e.stages.map(({ stage, stats }) => (
              <li key={stage.id}>
                <button type="button" onClick={() => setUi({ workspace: 'discovery', stage: stage.id })} className="group w-full text-left">
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium group-hover:text-studio-700">{stage.index}. {stage.title}</span><span className="text-xs text-slate-500">{stats.resolved}/{stats.total}</span></div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-slate-100"><div className="bg-studio-500" style={{ width: `${(stats.answered / Math.max(1, stats.total)) * 100}%` }} /><div className="bg-amber-400" style={{ width: `${(stats.toValidate / Math.max(1, stats.total)) * 100}%` }} /><div className="bg-slate-300" style={{ width: `${(stats.na / Math.max(1, stats.total)) * 100}%` }} /></div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card><H>Home definido</H><ol className="list-decimal space-y-1 pl-5 text-sm">{e.home.map((h) => <li key={h}>{h}</li>)}</ol>{!e.home.length && <p className="text-sm text-slate-500">Aún sin secciones.</p>}</Card>
        <Card><H>Riesgos altos</H><ul className="space-y-1.5 text-sm">{e.risks.map((r) => <li key={r.id} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />{r.text}</li>)}{!e.risks.length && <li className="text-slate-500">Ninguno.</li>}</ul></Card>
      </div>
    </div>
  );
}

function Requirements({ p }: { p: DiscoveryProject }) {
  const [open, setOpen] = useState<string | null>(null);
  const reqs = requirements(p);
  return (
    <div className="flex flex-col gap-2" data-testid="requirements">
      {reqs.length === 0 && <Card><p className="text-sm text-slate-500">Aún no hay funcionalidades solicitadas. Responde el Discovery o agrega toppings.</p></Card>}
      {reqs.map((r) => (
        <article key={r.id} className="rounded-2xl border border-slate-200 bg-white">
          <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left">
            <span className="font-mono text-xs font-bold text-studio-600">{r.id}</span>
            <span className="min-w-0 flex-1 font-medium">{r.name} <span className="text-xs text-slate-400">· {GROUP_LABEL[r.group]} · {r.origin}</span></span>
            <ToppingStatusBadge status={r.status} />
            {r.priority && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{PRIORITY_LABEL[r.priority]}</span>}
            <ScopeBadge scope={r.scope} short />
          </button>
          {open === r.id && (
            <div className="grid gap-4 border-t border-slate-100 px-4 py-4 text-sm md:grid-cols-2">
              <div className="space-y-2"><p><b>Problema:</b> {r.problem}</p><p><b>Funcionalidad:</b> {r.functionality}</p><p className="text-slate-600"><b>Implementación sugerida:</b> {r.implementation}</p><div className="flex flex-wrap gap-1">{r.classes.map((c) => <TechBadge key={c} cls={c} pending={r.themePending} />)}</div></div>
              <div className="space-y-2"><p><b>Dependencias:</b> {r.dependencies.join('; ') || '—'}</p><p><b>Riesgos:</b> {r.risks.join('; ') || '—'}</p><p><b>Criterios:</b></p><ul className="list-disc pl-5">{r.acceptance.map((a) => <li key={a}>{a}</li>)}</ul></div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function Pages({ p }: { p: DiscoveryProject }) {
  const x = pagesAndComponents(p);
  const { setUi, navigate } = useStudio();
  const label: Record<string, string> = { home: 'Inicio', catalog: 'Catálogo (PLP)', product: 'Ficha (PDP)', cart: 'Carrito' };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <H>Mapa del sitio</H>
        <div className="flex flex-wrap gap-2">
          {x.sitemap.map((n) => (
            <button key={n.id} type="button" disabled={n.kind === 'external'} onClick={() => { navigate(n.route.split('?')[0]); setUi({ workspace: 'discovery' }); }} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:border-studio-300 disabled:hover:border-slate-200">
              <b>{n.title}</b>
              <span className="block text-[11px] text-slate-500">{[n.inMenu && 'menú', n.inFooter && 'footer', n.kind === 'external' && 'Shopify'].filter(Boolean).join(' · ') || 'interna'}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500"><b>Global:</b> {x.global.join(' · ')}</p>
      </Card>
      {Object.entries(x.components).map(([k, list]) => (
        <Card key={k}><H>{label[k]}</H><ol className={cn('space-y-1 text-sm', k === 'home' ? 'list-decimal pl-5' : 'list-disc pl-5')}>{list.map((c) => <li key={c}>{c}</li>)}</ol></Card>
      ))}
    </div>
  );
}

function ToppingsInv({ p }: { p: DiscoveryProject }) {
  const inv = toppingInventory(p);
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Topping</th><th className="px-4 py-2">Grupo</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Origen</th><th className="px-4 py-2">Variante</th><th className="px-4 py-2">Alcance</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {inv.map((v) => (
            <tr key={v.def.id}>
              <td className="px-4 py-2.5 font-medium">{v.def.name}</td>
              <td className="px-4 py-2.5 text-slate-600">{GROUP_LABEL[v.def.group]}</td>
              <td className="px-4 py-2.5"><ToppingStatusBadge status={v.status} /></td>
              <td className="px-4 py-2.5 text-xs text-slate-600">{v.source === 'answer' ? `Respuesta ${v.activatedBy.join(', ')}` : v.source === 'manual' ? 'Consultor' : v.reasons[0]}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600">{v.def.variants?.find((x) => x.id === v.variant)?.label ?? '—'}</td>
              <td className="px-4 py-2.5"><ScopeBadge scope={v.def.scope} short /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!inv.length && <p className="p-6 text-center text-sm text-slate-500">Sin toppings todavía.</p>}
    </Card>
  );
}

function Backlog({ p }: { p: DiscoveryProject }) {
  const items = backlog(p);
  const epics = [...new Set(items.map((b) => b.epic))];
  return (
    <div className="flex flex-col gap-3" data-testid="backlog">
      {!items.length && <Card><p className="text-sm text-slate-500">El backlog se genera con las funcionalidades solicitadas o aprobadas.</p></Card>}
      {epics.map((e) => (
        <Card key={e}>
          <H>Épica · {e}</H>
          <ul className="divide-y divide-slate-100 text-sm">
            {items.filter((b) => b.epic === e).map((b) => (
              <li key={b.key} className={cn('flex flex-wrap items-center gap-2 py-2', b.type === 'Tarea técnica' && 'pl-6 text-slate-600')}>
                <span className="font-mono text-[11px] text-slate-400">{b.key}</span>
                <span className={cn('rounded px-1.5 text-[10px] font-semibold', b.type === 'Historia' ? 'bg-studio-50 text-studio-700' : 'bg-slate-100 text-slate-600')}>{b.type}</span>
                <span className="min-w-0 flex-1">{b.title}</span>
                <span className="text-[11px] text-slate-500">{b.priority} · {b.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function Risks({ p }: { p: DiscoveryProject }) {
  const r = risks(p);
  const deps = dependencies(p);
  const pending = pendingDecisions(p);
  const { setUi, focusQuestion } = useStudio();
  return (
    <div className="flex flex-col gap-4" data-testid="risks">
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">ID</th><th className="px-4 py-2">Nivel</th><th className="px-4 py-2">Área</th><th className="px-4 py-2">Riesgo</th><th className="px-4 py-2">Mitigación</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{r.map((x) => <tr key={x.id} className="align-top"><td className="px-4 py-2.5 font-mono text-xs">{x.id}</td><td className="px-4 py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', x.level === 'Alta' ? 'bg-rose-100 text-rose-700' : x.level === 'Media' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}>{x.level}</span></td><td className="px-4 py-2.5 text-slate-600">{x.area}</td><td className="px-4 py-2.5">{x.text}</td><td className="px-4 py-2.5 text-slate-600">{x.mitigation}</td></tr>)}</tbody>
        </table>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><H>Dependencias</H><ul className="space-y-1.5 text-sm">{deps.map(([d, ids]) => <li key={d}>{d} <span className="font-mono text-[11px] text-studio-600">{ids.join(', ')}</span></li>)}{!deps.length && <li className="text-slate-500">Ninguna.</li>}</ul></Card>
        <Card>
          <H>Decisiones pendientes ({pending.length})</H>
          <ul className="max-h-[420px] space-y-1 overflow-y-auto text-sm">
            {pending.map((d) => (
              <li key={d.q.id}>
                <button type="button" onClick={() => { setUi({ workspace: 'discovery' }); focusQuestion(d.q.stage, d.q.id); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-slate-50">
                  <StatusBadge status={d.status} /><span className="min-w-0 flex-1 truncate">{d.q.text}</span><span className="text-[11px] text-slate-400">{d.stage.short}</span><ArrowUpRight size={13} className="text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Shopify({ p }: { p: DiscoveryProject }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {shopifyClassification(p).map((g) => (
        <Card key={g.cls}>
          <div className="mb-2 flex items-center justify-between"><TechBadge cls={g.cls} /><span className="font-display text-xl font-extrabold">{g.items.length}</span></div>
          <ul className="space-y-1 text-sm">{g.items.map((r) => <li key={r.id} className="flex justify-between gap-2"><span>{r.name}</span><span className="font-mono text-[11px] text-slate-400">{r.id}</span></li>)}{!g.items.length && <li className="text-slate-400">—</li>}</ul>
        </Card>
      ))}
      <p className="text-xs text-slate-500 md:col-span-2 xl:col-span-3">Clasificación preliminar: {Object.values(TECH_CLASS_LABEL).join(' · ')}. Se confirma con el tema y las apps elegidas.</p>
    </div>
  );
}

function Checklist({ p }: { p: DiscoveryProject }) {
  const items = validationChecklist(p);
  return (
    <Card>
      <H>Checklist de validación con el cliente ({items.filter((i) => i.done).length}/{items.length})</H>
      <ul className="space-y-2" data-testid="checklist">
        {items.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5 text-sm" data-done={c.done}>
            {c.done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" />}
            <span><b className={cn(!c.done && 'text-slate-800')}>{c.text}</b><span className="block text-xs text-slate-500">{c.detail}</span></span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Answers({ p }: { p: DiscoveryProject }) {
  const rows = questionMatrix(p);
  const [stage, setStage] = useState('all');
  const { setUi, focusQuestion } = useStudio();
  return (
    <Card className="overflow-x-auto p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <span className="text-sm font-semibold">Banco de {rows.length} preguntas · {rows.filter((r) => r.applies).length} aplican</span>
        <select aria-label="Filtrar por etapa" value={stage} onChange={(e) => setStage(e.target.value)} className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-sm"><option value="all">Todas las etapas</option>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.index}. {s.title}</option>)}</select>
      </div>
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Pregunta</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Respuesta</th><th className="px-3 py-2">Regla</th><th className="px-3 py-2">Toppings</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.filter((r) => stage === 'all' || r.q.stage === stage).map((r) => (
            <tr key={r.q.id} className={cn('align-top', !r.applies && 'opacity-45')}>
              <td className="px-3 py-2 font-mono text-[11px]">{r.q.id}</td>
              <td className="px-3 py-2"><button type="button" disabled={!r.applies} onClick={() => { setUi({ workspace: 'discovery' }); focusQuestion(r.q.stage, r.q.id); }} className="text-left hover:text-studio-700 disabled:hover:text-inherit">{r.q.text}</button></td>
              <td className="px-3 py-2">{r.status ? <StatusBadge status={r.status} /> : <span className="text-[11px] text-slate-400">No aplica por condición</span>}</td>
              <td className="max-w-[240px] px-3 py-2 text-slate-600">{r.answer}</td>
              <td className="px-3 py-2 text-[11px] text-slate-500">{r.rule}</td>
              <td className="px-3 py-2 text-[11px] text-slate-500">{r.toppings.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Exports({ p }: { p: DiscoveryProject }) {
  const [preview, setPreview] = useState<ExportId>('executive');
  const e = EXPORTS.find((x) => x.id === preview)!;
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-1.5">
        {EXPORTS.map((x) => (
          <div key={x.id} className={cn('flex items-center gap-2 rounded-xl border bg-white p-2.5', preview === x.id ? 'border-studio-400' : 'border-slate-200')}>
            <button type="button" onClick={() => setPreview(x.id)} className="flex flex-1 items-center gap-2 text-left text-sm font-medium"><x.icon size={16} className="text-studio-600" />{x.label}</button>
            <button type="button" aria-label={`Descargar ${x.label}`} onClick={() => runExport(p, x.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Download size={16} /></button>
          </div>
        ))}
      </div>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-ink-950">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-400"><span>Vista previa · {e.label}</span><button type="button" onClick={() => runExport(p, e.id)} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-white hover:bg-white/20"><Download size={12} /> Descargar</button></div>
        <pre className="thin-scroll max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-slate-200" data-testid="export-preview">{e.fn(p)}</pre>
      </section>
      <p className="text-xs text-slate-500 lg:col-span-2">Estados: {Object.values(ANSWER_STATUS_LABEL).join(' · ')}. Alcance: {Object.values(SCOPE_LABEL).join(' · ')}.</p>
    </div>
  );
}
