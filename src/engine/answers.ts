import { PAGE_TYPES } from '@/config/templates';
import { SECTION_LIBRARY } from '@/config/sections';
import { PHASES, type Question } from '@/config/questions';
import { getProduct } from '@/data/demoCatalog';
import { filterLabel } from '@/engine/catalog';
import { getPath } from '@/lib/utils';
import type { DecisionMeta, DecisionStatus, ProjectConfig, ScopeStatus } from '@/types/project';

export const SCOPE_LABEL: Record<ScopeStatus, string> = {
  proposal: 'Contemplada en la propuesta',
  tbd: 'Pendiente de definición',
  additional: 'Solicitud adicional',
  validation: 'Sujeta a validación técnica',
};

export const SCOPE_WARNING = 'Esta funcionalidad requiere revisión de alcance y viabilidad antes de confirmar su implementación';

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  pending: 'Pendiente',
  proposed: 'Respondida',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const RANK: Record<ScopeStatus, number> = { proposal: 0, tbd: 1, validation: 2, additional: 3 };

export const worstScope = (list: (ScopeStatus | undefined)[]): ScopeStatus =>
  list.reduce<ScopeStatus>((acc, s) => (s && RANK[s] > RANK[acc] ? s : acc), 'proposal');

/** Valores seleccionados por la pregunta, normalizados a string[] (para opciones). */
export function selectedValues(q: Question, c: ProjectConfig): string[] {
  if (q.kind === 'flags') return (q.options ?? []).filter((o) => getPath(c, o.value) === true).map((o) => o.value);
  if (!q.path) return [];
  const v = getPath(c, q.path);
  if (Array.isArray(v)) return v.map(String);
  if (v === undefined || v === null || v === '') return [];
  return [String(v)];
}

/** Clasificación de alcance resultante de la respuesta actual. */
export function scopeOf(q: Question, c: ProjectConfig): ScopeStatus {
  const scopes: (ScopeStatus | undefined)[] = [];
  if (q.kind === 'toggle') {
    if (q.path && getPath(c, q.path) === true) scopes.push(q.scope);
    return worstScope(scopes);
  }
  if (q.scope) scopes.push(q.scope);
  if (q.kind === 'theme' && c.meta.themeName) return 'proposal';
  if (q.kind === 'pages') c.pages.forEach((p) => scopes.push(PAGE_TYPES.find((t) => t.type === p.type)?.scope));
  if (q.kind === 'homeSections') c.home.sections.forEach((s) => scopes.push(SECTION_LIBRARY.find((d) => d.type === s.type)?.scope));
  if (q.kind === 'customAttributes' && !c.catalog.customAttributes.length) return 'proposal';
  if (q.kind === 'tags' && q.path && !(getPath(c, q.path) as string[] | undefined)?.length) return 'proposal';
  const sel = selectedValues(q, c);
  (q.options ?? []).forEach((o) => sel.includes(o.value) && scopes.push(o.scope));
  return worstScope(scopes);
}

/** Resumen legible de la respuesta actual. */
export function answerSummary(q: Question, c: ProjectConfig): string {
  switch (q.kind) {
    case 'colors': return `Primario ${c.brand.primary} · Secundario ${c.brand.secondary} · Acento ${c.brand.accent}`;
    case 'fonts': return `Títulos: ${c.brand.headingFont} · Textos: ${c.brand.bodyFont}`;
    case 'logo': return c.brand.logoImage ? 'Logo cargado' : 'Sin logo (se usa logotipo de texto)';
    case 'pages': return c.pages.map((p) => p.title).join(', ');
    case 'menu': return `Menú: ${c.pages.filter((p) => p.inMenu).map((p) => p.title).join(', ') || '—'} | Footer: ${c.pages.filter((p) => p.inFooter).map((p) => p.title).join(', ') || '—'}`;
    case 'references': return c.references.length ? c.references.map((r) => `${r.name}${r.note ? ` (${r.note})` : ''}`).join('; ') : 'Sin referencias';
    case 'homeSections': return c.home.sections.map((s, i) => `${i + 1}. ${SECTION_LIBRARY.find((d) => d.type === s.type)?.label}`).join(' · ');
    case 'customAttributes': return c.catalog.customAttributes.map((a) => `${a.label}: ${a.values.join('/')}`).join('; ') || 'Ninguno';
    case 'kits': return c.bundles.kits.map((k) => `${k.name} (${k.productIds.length} productos, -${k.discountPct}%)`).join('; ') || 'Sin kits definidos';
    case 'products': return (getPath(c, q.path!) as string[]).map((id) => getProduct(id)?.name ?? id).join(', ') || 'Ninguno';
    case 'theme': return c.meta.themeName ?? 'Tema no definido (compatibilidad pendiente)';
    case 'toggle': return getPath(c, q.path!) ? 'Sí' : 'No';
    case 'number': return `${getPath(c, q.path!)}${q.suffix ?? ''}`;
    default: break;
  }
  if (q.id === 'catalog.filters') return c.catalog.filters.map((f) => filterLabel(f, c.catalog)).join(', ') || 'Ninguno';
  const sel = selectedValues(q, c);
  if (q.options) {
    const labels = sel.map((v) => q.options!.find((o) => o.value === v)?.label ?? v);
    return labels.join(', ') || 'Ninguna opción';
  }
  return sel.join(', ') || '—';
}

export function decisionMeta(q: Question, c: ProjectConfig): DecisionMeta {
  const phase = PHASES.find((p) => p.id === q.phase)!;
  const stored = c.decisions[q.id];
  const base: DecisionMeta = { status: c.answered[q.id] ? 'proposed' : 'pending', owner: phase.defaultOwner, notes: '', updatedAt: '' };
  if (!stored) return base;
  return { ...base, ...stored, status: stored.status === 'pending' && c.answered[q.id] ? 'proposed' : stored.status };
}

export const isResolved = (q: Question, c: ProjectConfig) => {
  const s = decisionMeta(q, c).status;
  return s === 'proposed' || s === 'approved';
};
