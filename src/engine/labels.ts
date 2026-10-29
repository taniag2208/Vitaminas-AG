import type { AnswerStatus, ToppingStatus } from '@/types/discovery';
import type { ScopeStatus } from '@/types/project';

export const SCOPE_LABEL: Record<ScopeStatus, string> = {
  proposal: 'Contemplada en la propuesta',
  tbd: 'Pendiente de definición',
  additional: 'Solicitud adicional',
  validation: 'Sujeta a validación técnica',
};

export const SCOPE_WARNING = 'Esta funcionalidad requiere revisión de alcance y viabilidad antes de confirmar su implementación';

export const ANSWER_STATUS_LABEL: Record<AnswerStatus, string> = {
  pending: 'Pendiente',
  answered: 'Respondida',
  to_validate: 'Por validar',
  na: 'No aplica',
};

export const TOPPING_STATUS_LABEL: Record<ToppingStatus, string> = {
  available: 'Disponible',
  recommended: 'Recomendado',
  requested: 'Solicitado',
  approved: 'Aprobado',
  discarded: 'Descartado',
};

const RANK: Record<ScopeStatus, number> = { proposal: 0, tbd: 1, validation: 2, additional: 3 };
export const worstScope = (list: (ScopeStatus | undefined)[]): ScopeStatus => list.reduce<ScopeStatus>((acc, s) => (s && RANK[s] > RANK[acc] ? s : acc), 'proposal');
