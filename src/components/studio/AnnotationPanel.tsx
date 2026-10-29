import { AlertTriangle, CheckSquare, Link2, Wrench, X } from 'lucide-react';
import { getAnnotation } from '@/config/annotations';
import { getTopping } from '@/config/discovery/toppings';
import { requirements } from '@/engine/deliverables';
import { useProject, useStudio } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import { ScopeBadge, TechBadge, ToppingStatusBadge } from '../ui';

export function AnnotationPanel({ cfg: project }: { cfg: ProjectConfig }) {
  const selected = useStudio((s) => s.ui.selectedAnnotation);
  const setUi = useStudio((s) => s.setUi);
  const discovery = useProject();
  if (!selected || !discovery) return null;
  const [key, toppingId] = selected.split('|');
  const spec = getAnnotation(key, project);
  const reqs = requirements(discovery);
  const req = reqs.find((r) => r.toppingId === toppingId) ?? reqs.find((r) => getTopping(r.toppingId)?.annotation === key);
  if (!spec) return null;
  const themePending = spec.classes.includes('theme') && !project.meta.themeName;
  return (
    <aside className="animate-slide-right absolute inset-y-0 right-0 z-30 flex w-[360px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="Especificación de implementación" data-testid="annotation-panel">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Implementación Shopify{req ? ` · ${req.id}` : ''}</p>
          <h3 className="mt-0.5 font-display text-lg font-bold leading-tight">{spec.name}</h3>
        </div>
        <button type="button" aria-label="Cerrar especificación" onClick={() => setUi({ selectedAnnotation: null })} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
        <div className="flex flex-wrap gap-1.5">{spec.classes.map((c) => <TechBadge key={c} cls={c} pending={themePending} />)}</div>
        {req && <div className="flex flex-wrap items-center gap-1.5"><ToppingStatusBadge status={req.status} /><ScopeBadge scope={req.scope} /><span className="text-[11px] text-slate-500">Topping: {getTopping(req.toppingId)?.name} · {req.origin}</span></div>}
        {!req && <p className="text-[11px] text-slate-500">Componente base del sitio (configurado por las respuestas).</p>}
        {themePending && <p className="rounded-lg bg-violet-50 p-3 text-xs text-violet-800">Tema Shopify no definido: la compatibilidad de los elementos dependientes del tema está <b>pendiente de validación</b>.</p>}
        <Block title="Funcionalidad esperada"><p className="text-slate-700">{spec.functionality}</p></Block>
        <Block title="Implementación sugerida" icon={<Wrench size={14} />}><p className="text-slate-700">{spec.implementation}</p></Block>
        <Block title="Dependencias" icon={<Link2 size={14} />}>{spec.dependencies.length ? <ul className="list-disc space-y-1 pl-4 text-slate-700">{spec.dependencies.map((d) => <li key={d}>{d}</li>)}</ul> : <p className="text-slate-400">Sin dependencias registradas</p>}</Block>
        <Block title="Riesgos" icon={<AlertTriangle size={14} />}>{spec.risks.length ? <ul className="list-disc space-y-1 pl-4 text-slate-700">{spec.risks.map((d) => <li key={d}>{d}</li>)}</ul> : <p className="text-slate-400">Sin riesgos registrados</p>}</Block>
        <Block title="Criterios de aceptación" icon={<CheckSquare size={14} />}><ul className="space-y-1.5 text-slate-700">{spec.acceptance.map((d) => <li key={d} className="flex gap-2"><span className="mt-1 h-3 w-3 shrink-0 rounded border border-slate-400" />{d}</li>)}</ul></Block>
      </div>
    </aside>
  );
}

const Block = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <section>
    <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{icon}{title}</h4>
    {children}
  </section>
);
