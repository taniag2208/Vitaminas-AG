import type { DQuestion, StageId } from '@/types/discovery';
import { CORE_QUESTIONS } from './questions-core';
import { STAGE_QUESTIONS } from './questions-stages';
import { STAGES } from './stages';
import { TOPPINGS } from './toppings';

/** Banco completo de preguntas del Discovery 2.0, en orden de etapa. */
export const QUESTIONS: DQuestion[] = STAGES.flatMap((s) => [...CORE_QUESTIONS, ...STAGE_QUESTIONS].filter((q) => q.stage === s.id));

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
export const getQuestion = (id: string) => BY_ID.get(id);
export const questionsOfStage = (s: StageId) => QUESTIONS.filter((q) => q.stage === s);

/** Preguntas que activan cada topping (calculado desde las opciones). */
export const ACTIVATED_BY: Record<string, string[]> = (() => {
  const m: Record<string, Set<string>> = {};
  for (const q of QUESTIONS) for (const o of q.options ?? []) for (const t of o.toppings ?? []) (m[t] ??= new Set()).add(q.id);
  // activaciones no enumerables
  (m['certification-badges'] ??= new Set()).add('PDP-12');
  (m['b2b-min-order'] ??= new Set()).add('CRT-13');
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v]]));
})();

/** Preguntas de seguimiento de cada topping (parámetros, variante o condicionadas a él). */
export const FOLLOW_UPS: Record<string, string[]> = Object.fromEntries(
  TOPPINGS.map((t) => [t.id, [...new Set([...(t.params ?? []).map((p) => p.question).filter(Boolean) as string[], ...(t.variantQuestion ? [t.variantQuestion] : []), ...QUESTIONS.filter((q) => JSON.stringify(q.showIf ?? {}).includes(`"topping":"${t.id}"`)).map((q) => q.id)])]]),
);

export { STAGES, TOPPINGS };
