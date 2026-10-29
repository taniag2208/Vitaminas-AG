import { getProduct } from '@/data/demoCatalog';
import type { DQuestion } from '@/types/discovery';
import type { CustomAttribute, PageDef, ReferenceItem, ScopeStatus } from '@/types/project';
import { worstScope } from './labels';

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v === undefined || v === null || v === '' ? [] : [String(v)]);

/** Resumen legible de una respuesta (para el Discovery, los entregables y las exportaciones). */
export function answerText(q: DQuestion, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  switch (q.type) {
    case 'boolean': return (q.options ?? []).find((o) => o.value === String(value))?.label ?? (value ? 'Sí' : 'No');
    case 'colors': { const c = value as Record<string, string>; return `Primario ${c.primary} · Secundario ${c.secondary} · Acento ${c.accent}`; }
    case 'fonts': { const f = value as Record<string, string>; return `Títulos ${f.heading} · Textos ${f.body}`; }
    case 'logo': return value ? 'Logo cargado' : '—';
    case 'pages': return (value as PageDef[]).map((p) => p.title).join(', ');
    case 'menu': { const m = value as { menu?: string[]; footer?: string[] }; return `Menú: ${(m.menu ?? []).join(', ') || '—'} · Footer: ${(m.footer ?? []).join(', ') || '—'}`; }
    case 'references': return (value as ReferenceItem[]).map((r) => r.name).join(', ') || '—';
    case 'customAttributes': return (value as CustomAttribute[]).map((a) => `${a.label} (${a.values.join('/')})`).join('; ') || '—';
    case 'products': return list(value).map((id) => getProduct(id)?.name ?? id).join(', ');
    case 'kits': return (value as { name: string }[]).map((k) => k.name).join(', ') || '—';
    case 'homeOrder': return `${list(value).length} secciones ordenadas`;
    case 'fields': return Object.values(value as Record<string, string>).filter(Boolean).join(' · ') || '—';
    case 'toppingReview': return 'Revisión registrada';
    case 'number': return `${value}${q.suffix ? ` ${q.suffix}` : ''}`;
    default: break;
  }
  if (q.options) {
    const labels = list(value).map((v) => q.options!.find((o) => o.value === v)?.label ?? v);
    return labels.join(', ') || '—';
  }
  return list(value).join(', ');
}

/** Alcance resultante de una respuesta según las opciones elegidas. */
export function answerScope(q: DQuestion, value: unknown): ScopeStatus {
  const sel = list(value);
  return worstScope((q.options ?? []).filter((o) => sel.includes(o.value)).map((o) => o.scope));
}

/** Toppings que activa una respuesta concreta. */
export function toppingsOfAnswer(q: DQuestion, value: unknown): string[] {
  const sel = list(value);
  return [...new Set([...(q.options ?? []).filter((o) => sel.includes(o.value)).flatMap((o) => o.toppings ?? []), ...(q.activates?.(value) ?? [])])];
}
