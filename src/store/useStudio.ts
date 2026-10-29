import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ACTIVATED_BY, getQuestion } from '@/config/discovery';
import { DEMO_DISCOUNT_CODES } from '@/data/demoCatalog';
import { migrateV1, newProject, toV2 } from '@/engine/migrate';
import { localProjectStorage, STORAGE_KEY } from '@/services/storage';
import { uid } from '@/lib/utils';
import type { AnswerRecord, AnswerStatus, DiscoveryProject, StageId, TechValidation, ToppingRecord } from '@/types/discovery';
import type { ProjectConfig, SectionProps } from '@/types/project';

export interface SimRoute {
  page: string;
  params?: Record<string, string>;
}

export interface CartLine {
  key: string;
  productId: string;
  variantId: string;
  qty: number;
  purchase: 'once' | 'subscription';
  frequency?: string;
  kitId?: string;
}

export interface DemoOrder {
  number: string;
  total: number;
  lines: CartLine[];
  createdAt: string;
}

export interface DemoSubscription {
  id: string;
  productId: string;
  variantId: string;
  frequency: string;
  status: 'active' | 'paused' | 'cancelled';
  skipped: number;
}

/** Estado de la simulación: separado de respuestas y configuración. */
export interface SimSession {
  cart: CartLine[];
  discountCode: string | null;
  cartOpen: boolean;
  orders: DemoOrder[];
  subscriptions: DemoSubscription[];
  popupDismissed: boolean;
  wishlist?: string[];
  viewed?: string[];
  b2bMode?: boolean;
}

export type Device = 'desktop' | 'mobile';
export type Workspace = 'discovery' | 'toppings' | 'deliverables';

interface UiState {
  stage: StageId;
  /** Pregunta en foco por etapa */
  currentQ: Partial<Record<StageId, string>>;
  route: SimRoute;
  device: Device;
  annotations: boolean;
  workspace: Workspace;
  fullscreen: boolean;
  selectedAnnotation: string | null;
}

export interface StudioBrand {
  name: string;
  accent: string;
}

interface StudioState {
  studioBrand: StudioBrand;
  setStudioBrand: (b: Partial<StudioBrand>) => void;
  projects: Record<string, DiscoveryProject>;
  activeId: string | null;
  ui: UiState;
  sessions: Record<string, SimSession>;

  // proyectos
  createProject: (opts: { name: string; client: string }) => string;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  openProject: (id: string | null) => void;
  importProject: (data: unknown) => string | null;

  // respuestas del Discovery
  answer: (qid: string, value: unknown) => void;
  setAnswerStatus: (qid: string, status: AnswerStatus) => void;
  setAnswerNote: (qid: string, notes: string) => void;
  clearAnswer: (qid: string) => void;

  // decisiones sobre toppings
  setTopping: (id: string, patch: Partial<ToppingRecord>) => void;
  addTopping: (id: string) => void;
  removeTopping: (id: string) => void;

  // personalización de datos ficticios y validaciones técnicas
  setSectionContent: (toppingId: string, patch: Partial<SectionProps>) => void;
  setValidation: (key: string, status: TechValidation, note?: string) => void;

  // ui
  setUi: (patch: Partial<UiState>) => void;
  focusQuestion: (stage: StageId, qid: string) => void;
  navigate: (page: string, params?: Record<string, string>) => void;

  // simulación
  addToCart: (line: Omit<CartLine, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  applyCode: (code: string) => boolean;
  setCartOpen: (open: boolean) => void;
  placeOrder: (total: number) => DemoOrder;
  updateSubscription: (id: string, patch: Partial<DemoSubscription>) => void;
  dismissPopup: () => void;
  toggleWishlist: (productId: string) => void;
  markViewed: (productId: string) => void;
  setB2bMode: (on: boolean) => void;
  resetSession: () => void;
}

const emptySession = (): SimSession => ({ cart: [], discountCode: null, cartOpen: false, orders: [], subscriptions: [], popupDismissed: false, wishlist: [], viewed: [], b2bMode: false });
const now = () => new Date().toISOString();
const touch = (p: DiscoveryProject): DiscoveryProject => ({ ...p, meta: { ...p.meta, updatedAt: now() } });
const blankAnswer = (): AnswerRecord => ({ status: 'pending', notes: '', updatedAt: '' });

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      const withActive = (fn: (p: DiscoveryProject) => DiscoveryProject) => {
        const { activeId, projects } = get();
        if (!activeId || !projects[activeId]) return;
        set({ projects: { ...projects, [activeId]: touch(fn(projects[activeId])) } });
      };
      const withSession = (fn: (s: SimSession) => SimSession) => {
        const { activeId, sessions } = get();
        if (!activeId) return;
        set({ sessions: { ...sessions, [activeId]: fn({ ...emptySession(), ...(sessions[activeId] ?? {}) }) } });
      };
      const patchAnswer = (p: DiscoveryProject, qid: string, patch: Partial<AnswerRecord>): DiscoveryProject => ({
        ...p,
        answers: { ...p.answers, [qid]: { ...(p.answers[qid] ?? blankAnswer()), ...patch, updatedAt: now() } },
      });

      return {
        studioBrand: { name: 'Tita Media', accent: '#5b3df5' },
        setStudioBrand: (b) => set((s) => ({ studioBrand: { ...s.studioBrand, ...b } })),
        projects: {},
        activeId: null,
        sessions: {},
        ui: { stage: 'context', currentQ: {}, route: { page: 'home' }, device: 'desktop', annotations: false, workspace: 'discovery', fullscreen: false, selectedAnnotation: null },

        createProject: (opts) => {
          const p = newProject(opts);
          set((s) => ({ projects: { ...s.projects, [p.meta.id]: p }, activeId: p.meta.id, ui: { ...s.ui, stage: 'context', currentQ: {}, route: { page: 'home' }, workspace: 'discovery' } }));
          return p.meta.id;
        },
        duplicateProject: (id) => {
          const src = get().projects[id];
          const copy: DiscoveryProject = structuredClone(src);
          copy.meta = { ...copy.meta, id: uid(), name: `${src.meta.name} (copia)`, createdAt: now(), updatedAt: now() };
          set((s) => ({ projects: { ...s.projects, [copy.meta.id]: copy } }));
          return copy.meta.id;
        },
        deleteProject: (id) =>
          set((s) => {
            const projects = { ...s.projects };
            const sessions = { ...s.sessions };
            delete projects[id];
            delete sessions[id];
            return { projects, sessions, activeId: s.activeId === id ? null : s.activeId };
          }),
        openProject: (id) => set((s) => ({ activeId: id, ui: { ...s.ui, route: { page: 'home' }, workspace: 'discovery', fullscreen: false, selectedAnnotation: null } })),
        importProject: (data) => {
          const p = toV2(data);
          if (!p) return null;
          const copy = structuredClone(p);
          copy.meta = { ...copy.meta, id: uid(), updatedAt: now() };
          set((s) => ({ projects: { ...s.projects, [copy.meta.id]: copy } }));
          return copy.meta.id;
        },

        answer: (qid, value) =>
          withActive((p) => {
            const prev = p.answers[qid]?.status;
            return patchAnswer(p, qid, { value, status: prev === 'to_validate' ? 'to_validate' : 'answered' });
          }),
        setAnswerStatus: (qid, status) => withActive((p) => patchAnswer(p, qid, { status })),
        setAnswerNote: (qid, notes) => withActive((p) => patchAnswer(p, qid, { notes })),
        clearAnswer: (qid) => withActive((p) => patchAnswer(p, qid, { value: undefined, status: 'pending' })),

        setTopping: (id, patch) => withActive((p) => ({ ...p, toppings: { ...p.toppings, [id]: { ...(p.toppings[id] ?? {}), ...patch } } })),
        addTopping: (id) =>
          withActive((p) => {
            const r = p.toppings[id] ?? {};
            return { ...p, toppings: { ...p.toppings, [id]: { ...r, manual: true, dismissed: false, approval: r.approval === 'discarded' ? 'requested' : r.approval ?? 'requested' } } };
          }),
        removeTopping: (id) =>
          withActive((p) => {
            let next = p;
            let tied = false;
            for (const qid of ACTIVATED_BY[id] ?? []) {
              const q = getQuestion(qid);
              const a = p.answers[qid];
              if (!q || !a || a.value === undefined) continue;
              const values = (q.options ?? []).filter((o) => o.toppings?.includes(id)).map((o) => o.value);
              if (q.type === 'multi' && Array.isArray(a.value)) {
                next = patchAnswer(next, qid, { value: (a.value as string[]).filter((v) => !values.includes(v)) });
              } else if (q.type === 'boolean' && a.value === true) {
                next = patchAnswer(next, qid, { value: false });
              } else if (values.includes(String(a.value))) {
                tied = true;
              }
            }
            const r = next.toppings[id] ?? {};
            return { ...next, toppings: { ...next.toppings, [id]: { ...r, manual: false, ...(tied ? { approval: 'discarded' as const } : {}) } } };
          }),

        setSectionContent: (tid, patch) => withActive((p) => ({ ...p, content: { ...p.content, sections: { ...p.content.sections, [tid]: { ...(p.content.sections[tid] ?? {}), ...patch } } } })),
        setValidation: (key, status, note) => withActive((p) => ({ ...p, validations: { ...p.validations, [key]: { status, note: note ?? p.validations[key]?.note ?? '' } } })),

        setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
        focusQuestion: (stage, qid) => set((s) => ({ ui: { ...s.ui, stage, currentQ: { ...s.ui.currentQ, [stage]: qid } } })),
        navigate: (page, params) => set((s) => ({ ui: { ...s.ui, route: { page, params } } })),

        addToCart: (line) =>
          withSession((s) => {
            const same = s.cart.find((l) => l.productId === line.productId && l.variantId === line.variantId && l.purchase === line.purchase && l.frequency === line.frequency && l.kitId === line.kitId);
            const cart = same ? s.cart.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l)) : [...s.cart, { ...line, key: uid() }];
            return { ...s, cart, cartOpen: true };
          }),
        setQty: (key, qty) => withSession((s) => ({ ...s, cart: qty <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, qty } : l)) })),
        removeLine: (key) => withSession((s) => ({ ...s, cart: s.cart.filter((l) => l.key !== key) })),
        applyCode: (code) => {
          const ok = code.trim().toUpperCase() in DEMO_DISCOUNT_CODES;
          withSession((s) => ({ ...s, discountCode: ok ? code.trim().toUpperCase() : s.discountCode }));
          return ok;
        },
        setCartOpen: (open) => withSession((s) => ({ ...s, cartOpen: open })),
        placeOrder: (total) => {
          const s = { ...emptySession(), ...(get().sessions[get().activeId!] ?? {}) };
          const order: DemoOrder = { number: `DEMO-${1001 + s.orders.length}`, total, lines: s.cart, createdAt: now() };
          const subs: DemoSubscription[] = s.cart.filter((l) => l.purchase === 'subscription').map((l) => ({ id: uid(), productId: l.productId, variantId: l.variantId, frequency: l.frequency ?? '30 días', status: 'active', skipped: 0 }));
          withSession((x) => ({ ...x, cart: [], discountCode: null, cartOpen: false, orders: [order, ...x.orders], subscriptions: [...subs, ...x.subscriptions] }));
          return order;
        },
        updateSubscription: (id, patch) => withSession((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        dismissPopup: () => withSession((s) => ({ ...s, popupDismissed: true })),
        toggleWishlist: (pid) => withSession((s) => { const w = s.wishlist ?? []; return { ...s, wishlist: w.includes(pid) ? w.filter((x) => x !== pid) : [...w, pid] }; }),
        markViewed: (pid) => withSession((s) => ({ ...s, viewed: [pid, ...(s.viewed ?? []).filter((x) => x !== pid)].slice(0, 8) })),
        setB2bMode: (on) => withSession((s) => ({ ...s, b2bMode: on })),
        resetSession: () => withSession(() => emptySession()),
      };
    },
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localProjectStorage),
      partialize: (s) => ({ studioBrand: s.studioBrand, projects: s.projects, activeId: s.activeId, sessions: s.sessions, ui: { ...s.ui, fullscreen: false, selectedAnnotation: null } }),
      migrate: (persisted, version) => {
        const st = persisted as { projects?: Record<string, unknown>; ui?: Record<string, unknown> } & Record<string, unknown>;
        if (version < 2) {
          const projects: Record<string, DiscoveryProject> = {};
          for (const [id, cfg] of Object.entries(st.projects ?? {})) {
            const p = migrateV1(cfg as ProjectConfig);
            p.meta.id = id;
            projects[id] = p;
          }
          return { ...st, projects, ui: { ...(st.ui ?? {}), stage: 'context', currentQ: {}, workspace: 'discovery' } } as unknown as StudioState;
        }
        return st as unknown as StudioState;
      },
    },
  ),
);

export const useProject = () => useStudio((s) => (s.activeId ? s.projects[s.activeId] : undefined));
const EMPTY_SESSION = emptySession();
export const useSession = () => useStudio((s) => (s.activeId ? s.sessions[s.activeId] : undefined) ?? EMPTY_SESSION);
