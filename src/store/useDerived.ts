import { analyze } from '@/engine/derive';
import type { DiscoveryProject } from '@/types/discovery';
import { useProject } from './useStudio';

/** Análisis memoizado del proyecto activo (configuración derivada, preguntas visibles y toppings). */
export const useAnalysis = (p?: DiscoveryProject) => {
  const active = useProject();
  const project = p ?? active;
  return project ? analyze(project) : undefined;
};
