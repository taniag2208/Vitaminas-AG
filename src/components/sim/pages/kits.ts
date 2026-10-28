import type { BundleConfig, ProjectConfig } from '@/types/project';

/** Kits definidos por el cliente; si no hay, kits de ejemplo para visualizar la funcionalidad. */
export const DEMO_KITS: BundleConfig['kits'] = [
  { id: 'kit-demo-1', name: 'Kit Defensas (ejemplo)', productIds: ['demo-1', 'demo-8', 'demo-2'], discountPct: 12 },
  { id: 'kit-demo-2', name: 'Kit Deporte (ejemplo)', productIds: ['demo-6', 'demo-11', 'demo-18'], discountPct: 10 },
  { id: 'kit-demo-3', name: 'Kit Descanso (ejemplo)', productIds: ['demo-3', 'demo-15', 'demo-9'], discountPct: 8 },
];

export const kitsFor = (cfg: ProjectConfig) => (cfg.bundles.kits.length ? cfg.bundles.kits : DEMO_KITS);

export const findKit = (cfg: ProjectConfig, id?: string) => (id ? kitsFor(cfg).find((k) => k.id === id) : undefined);
