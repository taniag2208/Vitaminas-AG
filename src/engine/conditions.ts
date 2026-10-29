import type { AnswerRecord, Condition, DiscoveryProject } from '@/types/discovery';

export const isGiven = (a?: AnswerRecord) => !!a && (a.status === 'answered' || a.status === 'to_validate');

/** Valor efectivo de una respuesta (solo si fue respondida o está por validar). */
export const answerValue = (p: DiscoveryProject, qid: string): unknown => (isGiven(p.answers[qid]) ? p.answers[qid].value : undefined);

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v === undefined || v === null || v === '' ? [] : [String(v)]);

/**
 * Evalúa una regla condicional declarativa.
 * `isToppingActive` se inyecta para reglas que dependen de toppings (evita dependencias circulares).
 */
export function evaluate(c: Condition | undefined, p: DiscoveryProject, isToppingActive: (id: string) => boolean = () => false): boolean {
  if (!c) return true;
  if ('all' in c) return c.all.every((x) => evaluate(x, p, isToppingActive));
  if ('any' in c) return c.any.some((x) => evaluate(x, p, isToppingActive));
  if ('not' in c) return !evaluate(c.not, p, isToppingActive);
  if ('topping' in c) return isToppingActive(c.topping);
  const a = p.answers[c.q];
  const given = isGiven(a);
  if (c.answered !== undefined) return c.answered === given;
  if (!given) return false;
  const vals = asList(a.value);
  if (c.eq !== undefined) return String(a.value) === String(c.eq);
  if (c.notEq !== undefined) return String(a.value) !== c.notEq;
  if (c.in) return vals.some((v) => c.in!.includes(v));
  if (c.includes !== undefined) return vals.includes(c.includes);
  if (c.includesAny) return vals.some((v) => c.includesAny!.includes(v));
  return given;
}

/** Descripción legible de una regla (para exportaciones y la UI). */
export function describe(c: Condition | undefined, label: (qid: string) => string = (q) => q): string {
  if (!c) return 'Siempre';
  if ('all' in c) return c.all.map((x) => describe(x, label)).join(' y ');
  if ('any' in c) return `(${c.any.map((x) => describe(x, label)).join(' o ')})`;
  if ('not' in c) return `no (${describe(c.not, label)})`;
  if ('topping' in c) return `topping "${c.topping}" activo`;
  const q = label(c.q);
  if (c.answered !== undefined) return `${q} ${c.answered ? 'respondida' : 'sin responder'}`;
  if (c.eq !== undefined) return `${q} = ${c.eq}`;
  if (c.notEq !== undefined) return `${q} ≠ ${c.notEq}`;
  if (c.in) return `${q} ∈ {${c.in.join(', ')}}`;
  if (c.includes !== undefined) return `${q} incluye ${c.includes}`;
  if (c.includesAny) return `${q} incluye alguno de {${c.includesAny.join(', ')}}`;
  return `${q} respondida`;
}
