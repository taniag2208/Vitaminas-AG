import { Check, X } from 'lucide-react';
import { GROUP_LABEL } from '@/config/discovery/toppings';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/store/useDerived';
import { useStudio } from '@/store/useStudio';
import type { Priority, ToppingView } from '@/types/discovery';
import { ScopeBadge, TechBadge } from '../ui';
import type { ControlProps } from './AnswerControls';

export const PRIORITY_LABEL: Record<Priority, string> = { must: 'Imprescindible', should: 'Importante', could: 'Deseable', later: 'Después del lanzamiento' };

/** Matriz de validación con el cliente: aprobar o descartar cada funcionalidad solicitada y priorizarla. */
export function ToppingReviewControl({ onChange }: ControlProps<string>) {
  const analysis = useAnalysis();
  const setTopping = useStudio((s) => s.setTopping);
  if (!analysis) return null;
  const rows = analysis.toppings.filter((v) => v.active || v.status === 'discarded');
  const decide = (v: ToppingView, approval: 'approved' | 'discarded' | 'requested') => {
    setTopping(v.def.id, { approval, priority: approval === 'approved' ? v.record.priority ?? 'should' : v.record.priority });
    onChange('reviewed');
  };
  const pending = rows.filter((v) => v.status === 'requested').length;
  return (
    <div className="flex flex-col gap-2" data-testid="topping-review">
      <p className="text-xs text-slate-600"><b>{rows.filter((v) => v.status === 'approved').length}</b> aprobadas · <b>{pending}</b> por decidir · <b>{rows.filter((v) => v.status === 'discarded').length}</b> descartadas</p>
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Aún no hay funcionalidades solicitadas.</p>}
      <ul className="flex flex-col gap-1.5">
        {rows.map((v) => (
          <li key={v.def.id} className={cn('rounded-xl border bg-white p-2.5', v.status === 'approved' ? 'border-emerald-200' : v.status === 'discarded' ? 'border-slate-200 opacity-60' : 'border-amber-200')} data-review={v.def.id}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <p className="text-sm font-semibold">{v.def.name}</p>
                <p className="text-[11px] text-slate-500">{GROUP_LABEL[v.def.group]} · {v.source === 'answer' ? `por ${v.activatedBy.join(', ')}` : 'agregado por el consultor'}</p>
              </div>
              <ScopeBadge scope={v.def.scope} short />
              <div className="ml-auto flex gap-1">
                <button type="button" aria-pressed={v.status === 'approved'} onClick={() => decide(v, v.status === 'approved' ? 'requested' : 'approved')} className={cn('inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold', v.status === 'approved' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50')} data-testid="approve-topping"><Check size={12} /> Aprobar</button>
                <button type="button" aria-pressed={v.status === 'discarded'} onClick={() => decide(v, v.status === 'discarded' ? 'requested' : 'discarded')} className={cn('inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold', v.status === 'discarded' ? 'bg-slate-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50')}><X size={12} /> Descartar</button>
              </div>
            </div>
            {v.status === 'approved' && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Prioridad:</span>
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((pr) => (
                  <button key={pr} type="button" aria-pressed={v.record.priority === pr} onClick={() => setTopping(v.def.id, { priority: pr })} className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', v.record.priority === pr ? 'border-studio-600 bg-studio-600 text-white' : 'border-slate-200 text-slate-600')}>{PRIORITY_LABEL[pr]}</button>
                ))}
                <span className="ml-auto flex gap-1">{v.def.techClass.slice(0, 2).map((c) => <TechBadge key={c} cls={c} />)}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
