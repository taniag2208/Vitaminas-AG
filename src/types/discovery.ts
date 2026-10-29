/**
 * Modelo de datos del Discovery 2.0.
 *
 * Separación estricta:
 *  - `answers`      → lo que respondió el cliente (Respuestas del Discovery)
 *  - `toppings`     → decisiones sobre funcionalidades (solicitado / aprobado / descartado, prioridad)
 *  - `content`      → personalización de los datos ficticios del simulador
 *  - `validations`  → notas y validaciones técnicas
 * La configuración del simulador se DERIVA (engine/derive.ts) y nunca se guarda.
 * El estado de la simulación (carrito, pedidos demo) vive aparte en `SimSession`.
 */
import type { ProjectConfig, ProjectMeta, ScopeStatus, SectionProps, SectionType, TechClass } from './project';

export const DISCOVERY_SCHEMA = 2;

export type StageId = 'context' | 'brand' | 'home' | 'catalog' | 'product' | 'cart' | 'customers' | 'marketing' | 'operations' | 'closing';

export type AnswerStatus = 'pending' | 'answered' | 'to_validate' | 'na';

export interface AnswerRecord {
  value?: unknown;
  status: AnswerStatus;
  notes: string;
  updatedAt: string;
}

export type ToppingApproval = 'requested' | 'approved' | 'discarded';
export type Priority = 'must' | 'should' | 'could' | 'later';
export type TechValidation = 'pending' | 'viable' | 'review' | 'not_viable';

export interface ToppingRecord {
  /** Agregado por el consultor (o recomendación aceptada) sin depender de una respuesta */
  manual?: boolean;
  /** Recomendación descartada: no volver a sugerirla */
  dismissed?: boolean;
  /** Decisión del cliente en la etapa de validación */
  approval?: ToppingApproval;
  priority?: Priority;
  validation?: TechValidation;
  notes?: string;
}

export interface ContentOverrides {
  /** Ajustes de textos e imágenes por sección del Home (clave = id del topping) */
  sections: Record<string, Partial<SectionProps>>;
}

export interface DiscoveryProject {
  schemaVersion: 2;
  meta: ProjectMeta;
  answers: Record<string, AnswerRecord>;
  toppings: Record<string, ToppingRecord>;
  content: ContentOverrides;
  validations: Record<string, { status: TechValidation; note: string }>;
}

/* ───────────── Reglas condicionales (declarativas, exportables) ───────────── */

export type Condition =
  | { q: string; eq?: string | number | boolean; notEq?: string; in?: string[]; includes?: string; includesAny?: string[]; answered?: boolean }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { topping: string };

/* ───────────── Preguntas ───────────── */

export type AnswerType =
  | 'single'
  | 'cards'
  | 'multi'
  | 'boolean'
  | 'text'
  | 'fields'
  | 'textarea'
  | 'number'
  | 'colors'
  | 'fonts'
  | 'logo'
  | 'pages'
  | 'menu'
  | 'references'
  | 'tags'
  | 'homeOrder'
  | 'products'
  | 'kits'
  | 'customAttributes'
  | 'toppingReview';

export interface DOption {
  value: string;
  label: string;
  description?: string;
  /** Esquema visual (Schematic) */
  visual?: string;
  /** Toppings que activa al ser elegida */
  toppings?: string[];
  /** En selección múltiple, al elegirla se desmarcan las demás */
  exclusive?: boolean;
  scope?: ScopeStatus;
}

export interface PreviewSpec {
  page: string;
  params?: Record<string, string>;
  target?: string;
  action?: 'openMenu' | 'openCart' | 'openFilters' | 'showPopup';
  device?: 'desktop' | 'mobile';
}

export interface ApplyCtx {
  project: DiscoveryProject;
  answer: (qid: string) => unknown;
  isAnswered: (qid: string) => boolean;
}

export interface DQuestion {
  id: string;
  stage: StageId;
  category: string;
  text: string;
  /** Microexplicación en lenguaje comercial */
  context?: string;
  type: AnswerType;
  options?: DOption[];
  showIf?: Condition;
  /** Funcionalidades asociadas (lenguaje de negocio) */
  features?: string[];
  /** Efecto esperado sobre el simulador */
  effect: string;
  /** Valor sugerido mientras está pendiente (se muestra, no se guarda) */
  suggest?: (p: DiscoveryProject) => unknown;
  /** Cómo la respuesta modifica la configuración derivada */
  apply?: (value: unknown, cfg: ProjectConfig, ctx: ApplyCtx) => void;
  preview?: PreviewSpec;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  /** Campos del tipo 'fields' (respuesta = objeto) */
  fields?: { key: string; label: string; placeholder?: string }[];
  /** Toppings activados por valores no enumerables (números, listas de texto) */
  activates?: (value: unknown) => string[];
  /** Máximo de opciones en selección múltiple */
  maxSelect?: number;
  /** v1 → v2: ids de preguntas v1 equivalentes y lector del valor */
  legacy?: { ids: string[]; read: (v1: ProjectConfig) => unknown };
}

/* ───────────── Toppings ───────────── */

export type ToppingGroup = 'home' | 'catalog' | 'pdp' | 'cart' | 'marketing' | 'loyalty' | 'personalization' | 'b2b' | 'operations';

export interface ToppingParam {
  key: string;
  label: string;
  /** Pregunta de seguimiento que define el parámetro */
  question?: string;
  default: unknown;
}

export interface ToppingDef {
  id: string;
  group: ToppingGroup;
  stage: StageId;
  name: string;
  description: string;
  problem: string;
  variants?: { id: string; label: string; description?: string }[];
  /** Pregunta cuya respuesta elige la variante */
  variantQuestion?: string;
  params?: ToppingParam[];
  dependencies: string[];
  techClass: TechClass[];
  scope: ScopeStatus;
  /** Especificación técnica reutilizada (config/annotations.ts) */
  annotation?: string;
  /** Representación en el simulador */
  sim:
    | { kind: 'section'; section: SectionType; rank: number; page?: 'home' }
    | { kind: 'feature'; page: string; target?: string; params?: Record<string, string> }
    | { kind: 'none'; reason: string };
  recommend?: { when: Condition; reason: string }[];
  /** Modifica la configuración cuando el topping está activo */
  apply?: (cfg: ProjectConfig, t: { variant?: string; params: Record<string, unknown> }) => void;
  /** Ajusta las props de la sección del Home que representa */
  section?: (props: SectionProps, t: { variant?: string; params: Record<string, unknown>; cfg: ProjectConfig }) => { variant?: string; props: Partial<SectionProps> };
  acceptance?: string[];
}

export type ToppingStatus = 'available' | 'recommended' | 'requested' | 'approved' | 'discarded';

export interface ToppingView {
  def: ToppingDef;
  status: ToppingStatus;
  active: boolean;
  source: 'answer' | 'manual' | null;
  /** Preguntas respondidas que lo activan */
  activatedBy: string[];
  /** Motivos de recomendación vigentes */
  reasons: string[];
  record: ToppingRecord;
  variant?: string;
  params: Record<string, unknown>;
}
