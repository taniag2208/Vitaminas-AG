import { QUESTIONS } from '@/config/discovery';
import { uid } from '@/lib/utils';
import type { AnswerRecord, DiscoveryProject, ToppingRecord } from '@/types/discovery';
import type { ProjectConfig, SectionType } from '@/types/project';

export function newProject(opts: { name: string; client: string }): DiscoveryProject {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    meta: { id: uid(), name: opts.name, client: opts.client, vertical: '', createdAt: now, updatedAt: now, themeName: null, proposalRef: '' },
    answers: {},
    toppings: {},
    content: { sections: {} },
    validations: {},
  };
}

export const isV2 = (x: unknown): x is DiscoveryProject => !!x && (x as DiscoveryProject).schemaVersion === 2 && !!(x as DiscoveryProject).answers;

/** Sección del Home v1 → topping v2. */
const SECTION_TO_TOPPING: Partial<Record<SectionType, string>> = {
  hero: 'hero-banner', slideshow: 'promo-carousel', categoryCards: 'category-cards', categoryCircles: 'category-circles', goals: 'shop-by-goal',
  featured: 'curated-collection', bestSellers: 'best-sellers', newArrivals: 'new-arrivals', brands: 'brand-strip', benefits: 'benefits-bar',
  imageText: 'brand-story', testimonials: 'testimonials', blog: 'blog-teaser', faq: 'faq-block', newsletter: 'newsletter-block',
  promoBanner: 'on-sale', ctaFinal: 'final-cta', bundles: 'bundles-showcase', countdown: 'countdown',
};

/**
 * Convierte un proyecto v1 (configuración editada directamente) en v2.
 * - Solo se importan como respuestas las preguntas que el cliente había respondido o aprobado en v1.
 * - Las secciones del Home se convierten en toppings agregados por el consultor, con su orden y textos.
 * - Las notas y estados de aprobación se conservan en las respuestas.
 */
export function migrateV1(v1: ProjectConfig): DiscoveryProject {
  const p = newProject({ name: v1.meta.name, client: v1.meta.client });
  p.meta = { ...v1.meta, updatedAt: new Date().toISOString() };
  const touched = (ids: string[]) => ids.some((id) => v1.answered?.[id] || (v1.decisions?.[id] && v1.decisions[id].status !== 'pending'));
  const noteOf = (ids: string[]) => ids.map((id) => v1.decisions?.[id]?.notes).filter(Boolean).join(' · ');

  for (const q of QUESTIONS) {
    if (!q.legacy || !touched(q.legacy.ids)) continue;
    let value = q.legacy.read(v1);
    if (q.type === 'boolean') value = value === true;
    const rec: AnswerRecord = { value, status: 'answered', notes: noteOf(q.legacy.ids), updatedAt: p.meta.updatedAt };
    p.answers[q.id] = rec;
  }

  // Home: secciones → toppings manuales con orden y contenido
  const order: string[] = [];
  const toppings: Record<string, ToppingRecord> = {};
  for (const s of v1.home?.sections ?? []) {
    const t = SECTION_TO_TOPPING[s.type];
    if (!t || order.includes(t)) continue;
    order.push(t);
    toppings[t] = { manual: true, approval: 'requested' };
    p.content.sections[t] = { title: s.props.title, subtitle: s.props.subtitle, cta: s.props.cta, image: s.props.image, slides: s.props.slides, columns: s.props.columns, itemsCount: s.props.itemsCount };
  }
  p.toppings = toppings;
  if (order.length && (v1.answered?.['home.sections'] || v1.decisions?.['home.sections'])) p.answers['HOM-20'] = { value: order, status: 'answered', notes: '', updatedAt: p.meta.updatedAt };
  return p;
}

/** Acepta un proyecto v2, un proyecto v1 o una exportación JSON de cualquiera de las dos versiones. */
export function toV2(data: unknown): DiscoveryProject | null {
  const d = data as { project?: unknown; config?: unknown };
  const candidate = d?.project ?? d?.config ?? data;
  if (isV2(candidate)) return candidate;
  const v1 = candidate as ProjectConfig;
  if (v1?.meta && v1.home && v1.pages) return migrateV1(v1);
  return null;
}
