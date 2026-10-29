import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Ban, Check, ChevronLeft, ChevronRight, CircleCheck, Eye, Lightbulb, MessageSquare, Plus, RotateCcw, SkipForward, Sparkles, X } from 'lucide-react';
import { getQuestion } from '@/config/discovery';
import { STAGES, stageOf } from '@/config/discovery/stages';
import { getTopping } from '@/config/discovery/toppings';
import { isGiven } from '@/engine/conditions';
import { stageStats, statusOf } from '@/engine/derive';
import { SCOPE_LABEL, SCOPE_WARNING } from '@/engine/labels';
import { answerScope, answerText, toppingsOfAnswer } from '@/engine/summary';
import { answerWithPreview, previewQuestion, showPreview } from '@/lib/preview';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/store/useDerived';
import { useStudio } from '@/store/useStudio';
import type { DiscoveryProject, DQuestion, StageId } from '@/types/discovery';
import type { ProjectConfig } from '@/types/project';
import { Button, inputCls, StatusBadge, StatusDot, ToppingStatusBadge } from '../ui';
import {
  BooleanControl, CardsControl, ColorsControl, CustomAttributesControl, FieldsControl, FontsControl, KitsControl, LogoControl, MenuControl, MultiControl,
  NumberControl, PagesControl, ProductsControl, ReferencesControl, SingleControl, TagsControl, TextControl, type ControlProps,
} from './AnswerControls';
import { HomeOrderControl } from './HomeOrderControl';
import { ToppingReviewControl } from './ToppingReviewControl';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function Control(props: ControlProps<any>) {
  switch (props.q.type) {
    case 'single': return <SingleControl {...props} />;
    case 'cards': return <CardsControl {...props} />;
    case 'multi': return <MultiControl {...props} />;
    case 'boolean': return <BooleanControl {...props} />;
    case 'text': return <TextControl {...props} />;
    case 'textarea': return <TextControl {...props} multiline />;
    case 'fields': return <FieldsControl {...props} />;
    case 'number': return <NumberControl {...props} />;
    case 'colors': return <ColorsControl {...props} />;
    case 'fonts': return <FontsControl {...props} />;
    case 'logo': return <LogoControl {...props} />;
    case 'pages': return <PagesControl {...props} />;
    case 'menu': return <MenuControl {...props} />;
    case 'references': return <ReferencesControl {...props} />;
    case 'tags': return <TagsControl {...props} />;
    case 'customAttributes': return <CustomAttributesControl {...props} />;
    case 'products': return <ProductsControl {...props} />;
    case 'kits': return <KitsControl {...props} />;
    case 'homeOrder': return <HomeOrderControl {...props} />;
    case 'toppingReview': return <ToppingReviewControl {...props} />;
  }
}

/** Controles de escritura continua: se guardan sin mover el simulador en cada tecla. */
const QUIET: DQuestion['type'][] = ['text', 'textarea', 'fields', 'number', 'colors', 'fonts', 'tags', 'references', 'customAttributes', 'kits', 'menu', 'homeOrder', 'pages', 'products'];

/** Toppings que activa la respuesta actual, con su estado. */
function LinkedToppings({ q, value }: { q: DQuestion; value: unknown }) {
  const analysis = useAnalysis();
  const setUi = useStudio((s) => s.setUi);
  const ids = toppingsOfAnswer(q, value);
  if (!ids.length || !analysis) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="linked-toppings">
      <span className="text-[11px] font-semibold text-slate-500">Activa:</span>
      {ids.map((id) => {
        const v = analysis.toppings.find((t) => t.def.id === id);
        return (
          <button key={id} type="button" onClick={() => setUi({ workspace: 'toppings' })} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-studio-300" title="Ver en la biblioteca de toppings">
            {getTopping(id)?.name}{v && <ToppingStatusBadge status={v.status} />}
          </button>
        );
      })}
    </div>
  );
}

function QuestionCard({ q, project, cfg, isFollowUp, onNext, onPrev, hasPrev }: { q: DQuestion; project: DiscoveryProject; cfg: ProjectConfig; isFollowUp: boolean; onNext: () => void; onPrev: () => void; hasPrev: boolean }) {
  const { setAnswerStatus, setAnswerNote, clearAnswer } = useStudio();
  const a = project.answers[q.id];
  const status = statusOf(project, q.id);
  const value = a?.value;
  const suggested = q.suggest?.(project);
  const [notesOpen, setNotesOpen] = useState(!!a?.notes);
  const scope = answerScope(q, value);
  const warn = isGiven(a) && (scope === 'additional' || scope === 'validation');
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [q.id]);

  return (
    <article ref={ref} className="animate-fade-in rounded-2xl border-2 border-studio-200 bg-white p-4 shadow-[0_8px_30px_-12px_rgba(91,61,245,0.25)]" data-question={q.id} data-current="true" onClickCapture={() => previewQuestion(q)}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-studio-600">{q.category}</span>
        <span className="font-mono text-[10px] text-slate-400">{q.id}</span>
        {isFollowUp && <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200"><ArrowRight size={10} /> Seguimiento por tu respuesta</span>}
        <span className="ml-auto"><StatusBadge status={status} /></span>
      </div>
      <h3 className="font-display text-lg font-extrabold leading-snug text-ink-900">{q.text}</h3>
      {q.context && <p className="mt-1.5 flex gap-1.5 text-[13px] leading-relaxed text-slate-600"><Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />{q.context}</p>}

      <div className="mt-3.5">
        <Control q={q} value={value} suggested={suggested} cfg={cfg} onChange={(v) => (QUIET.includes(q.type) ? useStudio.getState().answer(q.id, v) : answerWithPreview(q, v))} />
        {suggested !== undefined && !isGiven(a) && !['homeOrder', 'toppingReview'].includes(q.type) && (
          <button type="button" onClick={() => answerWithPreview(q, suggested)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-studio-700 hover:underline"><Check size={12} /> Usar la sugerencia</button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-2.5">
        <p className="flex items-start gap-1.5 text-xs text-slate-600"><Eye size={14} className="mt-0.5 shrink-0 text-studio-500" /><span><b className="text-slate-700">En el simulador:</b> {q.effect}</span></p>
        <LinkedToppings q={q} value={value} />
        {q.preview && <button type="button" onClick={() => showPreview(q.preview)} className="w-fit text-[11px] font-semibold text-studio-700 hover:underline">Ver en el simulador →</button>}
      </div>

      {warn && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200" role="note" data-testid="scope-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span><b>{SCOPE_LABEL[scope]}.</b> {SCOPE_WARNING}.</span>
        </div>
      )}

      {notesOpen && <textarea aria-label="Notas del consultor" rows={2} className={cn(inputCls, 'mt-2.5 text-xs')} placeholder="Notas del consultor: acuerdos, dudas, quién debe confirmar…" value={a?.notes ?? ''} onChange={(e) => setAnswerNote(q.id, e.target.value)} />}

      <footer className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        <button type="button" aria-pressed={notesOpen} onClick={() => setNotesOpen(!notesOpen)} className={cn('inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium hover:bg-slate-100', a?.notes ? 'text-studio-700' : 'text-slate-500')}><MessageSquare size={14} /> Notas</button>
        <button type="button" aria-pressed={status === 'to_validate'} onClick={() => setAnswerStatus(q.id, status === 'to_validate' ? (a?.value !== undefined ? 'answered' : 'pending') : 'to_validate')} className={cn('inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium', status === 'to_validate' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:bg-slate-100')} data-testid="mark-to-validate"><AlertTriangle size={13} /> Por validar</button>
        <button type="button" aria-pressed={status === 'na'} onClick={() => setAnswerStatus(q.id, status === 'na' ? (a?.value !== undefined ? 'answered' : 'pending') : 'na')} className={cn('inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium', status === 'na' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100')} data-testid="mark-na"><Ban size={13} /> No aplica</button>
        {a?.value !== undefined && <button type="button" onClick={() => clearAnswer(q.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100" title="Volver a pendiente"><RotateCcw size={13} /> Borrar</button>}
        <span className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" disabled={!hasPrev} onClick={onPrev} aria-label="Pregunta anterior"><ChevronLeft size={14} /></Button>
          {status === 'pending' && <Button size="sm" variant="ghost" onClick={onNext} data-testid="skip-question"><SkipForward size={13} /> Dejar pendiente</Button>}
          <Button size="sm" variant="primary" onClick={onNext} data-testid="next-question">Continuar <ChevronRight size={14} /></Button>
        </span>
      </footer>
    </article>
  );
}

function Recommendations({ stage }: { stage: StageId }) {
  const analysis = useAnalysis();
  const { addTopping, setTopping } = useStudio();
  const recs = analysis?.recommended.filter((v) => v.def.stage === stage) ?? [];
  if (!recs.length) return null;
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3" aria-label="Recomendaciones" data-testid="recommendations">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700"><Sparkles size={13} /> Recomendado para este negocio</p>
      <ul className="flex flex-col gap-2">
        {recs.map((v) => (
          <li key={v.def.id} className="rounded-xl bg-white p-2.5 ring-1 ring-sky-100" data-recommendation={v.def.id}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{v.def.name}</p>
                <p className="text-xs text-slate-600">{v.reasons[0]}</p>
              </div>
              <button type="button" onClick={() => addTopping(v.def.id)} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-sky-600 px-2 text-xs font-semibold text-white hover:bg-sky-700" data-testid="accept-recommendation"><Plus size={12} /> Agregar</button>
              <button type="button" aria-label={`Descartar recomendación ${v.def.name}`} onClick={() => setTopping(v.def.id, { dismissed: true })} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100"><X size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-sky-800/80">Una recomendación no está en el simulador hasta que se agrega. Agregada queda como <b>solicitada</b>; se aprueba en la etapa 10.</p>
    </section>
  );
}

export function DiscoveryPanel({ project, cfg }: { project: DiscoveryProject; cfg: ProjectConfig }) {
  const { ui, setUi, focusQuestion } = useStudio();
  const analysis = useAnalysis(project)!;
  const stage = stageOf(ui.stage);
  const qs = analysis.visible.filter((q) => q.stage === stage.id);
  const firstPending = qs.find((q) => statusOf(project, q.id) === 'pending');
  const currentId = ui.currentQ[stage.id] && qs.some((q) => q.id === ui.currentQ[stage.id]) ? ui.currentQ[stage.id]! : (firstPending ?? qs[0])?.id;
  const idx = qs.findIndex((q) => q.id === currentId);
  const current = qs[idx];
  const st = stageStats(project, stage.id);
  const sIdx = STAGES.indexOf(stage);
  // Fija la pregunta en foco: responder no debe saltar a otra pregunta sin que el consultor lo pida.
  useEffect(() => {
    if (current && ui.currentQ[stage.id] !== current.id) focusQuestion(stage.id, current.id);
  }, [current, stage.id, ui.currentQ, focusQuestion]);

  const goStage = (id: StageId) => {
    setUi({ stage: id });
    const s = stageOf(id);
    useStudio.getState().navigate(s.preview);
  };
  const next = () => {
    const after = analysis.visible.filter((q) => q.stage === stage.id);
    const i = after.findIndex((q) => q.id === currentId);
    const n = after.slice(i + 1).find((q) => statusOf(project, q.id) === 'pending') ?? after[i + 1];
    if (n) { focusQuestion(stage.id, n.id); previewQuestion(n); }
    else if (sIdx < STAGES.length - 1) goStage(STAGES[sIdx + 1].id);
  };
  const prev = () => { if (idx > 0) focusQuestion(stage.id, qs[idx - 1].id); };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <nav aria-label="Etapas del Discovery" className="border-b border-slate-200 px-2 pb-2 pt-2.5">
        <ol className="no-scrollbar flex gap-1 overflow-x-auto">
          {STAGES.map((s) => {
            const x = stageStats(project, s.id);
            const pct = x.total ? x.resolved / x.total : 0;
            const active = s.id === stage.id;
            return (
              <li key={s.id} className="min-w-[56px] flex-1">
                <button type="button" onClick={() => goStage(s.id)} aria-current={active ? 'step' : undefined} title={`${s.index}. ${s.title} — ${x.resolved}/${x.total}`} className={cn('flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 transition', active ? 'bg-studio-50' : 'hover:bg-slate-50')} data-testid={`stage-${s.id}`}>
                  <span className={cn('grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold', active ? 'bg-studio-600 text-white' : pct === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600')}>{pct === 1 && !active ? <CircleCheck size={14} /> : s.index}</span>
                  <span className={cn('w-full truncate text-center text-[10px] font-semibold', active ? 'text-studio-700' : 'text-slate-500')}>{s.short}</span>
                  <span className="h-1 w-full overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-studio-500 transition-all" style={{ width: `${pct * 100}%` }} /></span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4" data-testid="discovery-scroll">
        <header className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-studio-600">Etapa {stage.index} de {STAGES.length}</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink-900">{stage.title}</h2>
          <p className="text-sm text-slate-500">{stage.goal}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500" data-testid="stage-stats">
            <span><b className="text-studio-700">{st.answered}</b> respondidas</span>
            <span><b className="text-amber-700">{st.toValidate}</b> por validar</span>
            <span><b className="text-slate-700">{st.na}</b> no aplica</span>
            <span><b className="text-slate-700">{st.pending}</b> pendientes</span>
          </div>
        </header>

        <div className="flex flex-col gap-2">
          <Recommendations stage={stage.id} />
          <ol className="flex flex-col gap-1.5" aria-label="Preguntas de la etapa">
            {qs.map((q) => {
              const isCurrent = q.id === current?.id;
              const status = statusOf(project, q.id);
              const followUp = !!q.showIf;
              if (isCurrent) return <li key={q.id}><QuestionCard q={q} project={project} cfg={cfg} isFollowUp={followUp} onNext={next} onPrev={prev} hasPrev={idx > 0} /></li>;
              const a = project.answers[q.id];
              return (
                <li key={q.id}>
                  <button type="button" onClick={() => { focusQuestion(stage.id, q.id); previewQuestion(q); }} className={cn('flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition hover:border-slate-300 hover:bg-white', status === 'na' ? 'border-slate-100 bg-slate-50/50 opacity-60' : 'border-slate-200 bg-white/70', followUp && 'ml-3 w-[calc(100%-0.75rem)] border-l-2 border-l-sky-300')} data-question-row={q.id}>
                    <StatusDot status={status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-slate-800">{q.text}</span>
                      {a?.value !== undefined && status !== 'na' && <span className="block truncate text-[11px] text-slate-500">{answerText(q, a.value)}</span>}
                    </span>
                    {status === 'to_validate' && <span className="text-[10px] font-semibold text-amber-700">Por validar</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          {qs.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay preguntas que apliquen en esta etapa según las respuestas anteriores.</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5">
        <Button variant="ghost" size="sm" disabled={sIdx === 0} onClick={() => goStage(STAGES[sIdx - 1].id)}><ChevronLeft size={14} /> {sIdx > 0 ? STAGES[sIdx - 1].short : 'Anterior'}</Button>
        <span className="text-[11px] text-slate-400">{st.resolved}/{st.total} resueltas</span>
        {sIdx < STAGES.length - 1 ? (
          <Button variant="secondary" size="sm" onClick={() => goStage(STAGES[sIdx + 1].id)} data-testid="next-stage">{STAGES[sIdx + 1].short} <ChevronRight size={14} /></Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setUi({ workspace: 'deliverables' })}>Ver entregables <ChevronRight size={14} /></Button>
        )}
      </div>
    </div>
  );
}

export const questionById = getQuestion;
