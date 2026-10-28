import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createProject, type TemplateId } from '@/config/templates';
import type { PhaseId } from '@/config/questions';
import { DEMO_DISCOUNT_CODES } from '@/data/demoCatalog';
import { localProjectStorage, STORAGE_KEY } from '@/services/storage';
import { setPath, uid } from '@/lib/utils';
import type { DecisionMeta, ProjectConfig } from '@/types/project';
import { SCHEMA_VERSION } from '@/types/project';

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

export interface SimSession {
  cart: CartLine[];
  discountCode: string | null;
  cartOpen: boolean;
  orders: DemoOrder[];
  subscriptions: DemoSubscription[];
  popupDismissed: boolean;
}

export type Device = 'desktop' | 'mobile';
export type Workspace = 'studio' | 'pmo';

interface UiState {
  phase: PhaseId;
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
  projects: Record<string, ProjectConfig>;
  activeId: string | null;
  ui: UiState;
  sessions: Record<string, SimSession>;

  // proyectos
  createProject: (opts: { name: string; client: string; template: TemplateId }) => string;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  openProject: (id: string | null) => void;
  importProject: (cfg: ProjectConfig) => string;

  // configuración (fuente única de verdad)
  update: (path: string, value: unknown, questionId?: string) => void;
  mutate: (fn: (c: ProjectConfig) => ProjectConfig, questionId?: string) => void;
  setDecision: (questionId: string, patch: Partial<DecisionMeta>) => void;
  setAnswered: (questionId: string, value: boolean) => void;

  // ui
  setUi: (patch: Partial<UiState>) => void;
  navigate: (page: string, params?: Record<string, string>) => void;

  // simulación (no forma parte de las decisiones)
  addToCart: (line: Omit<CartLine, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  applyCode: (code: string) => boolean;
  setCartOpen: (open: boolean) => void;
  placeOrder: (total: number) => DemoOrder;
  updateSubscription: (id: string, patch: Partial<DemoSubscription>) => void;
  dismissPopup: () => void;
  resetSession: () => void;
}

const emptySession = (): SimSession => ({ cart: [], discountCode: null, cartOpen: false, orders: [], subscriptions: [], popupDismissed: false });

const touch = (c: ProjectConfig): ProjectConfig => ({ ...c, meta: { ...c.meta, updatedAt: new Date().toISOString() } });

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      const withActive = (fn: (c: ProjectConfig) => ProjectConfig) => {
        const { activeId, projects } = get();
        if (!activeId || !projects[activeId]) return;
        set({ projects: { ...projects, [activeId]: touch(fn(projects[activeId])) } });
      };
      const withSession = (fn: (s: SimSession) => SimSession) => {
        const { activeId, sessions } = get();
        if (!activeId) return;
        set({ sessions: { ...sessions, [activeId]: fn(sessions[activeId] ?? emptySession()) } });
      };
      const markAnswered = (c: ProjectConfig, qid?: string) => (qid ? { ...c, answered: { ...c.answered, [qid]: true } } : c);

      return {
        studioBrand: { name: 'Tita Media', accent: '#5b3df5' },
        setStudioBrand: (b) => set((s) => ({ studioBrand: { ...s.studioBrand, ...b } })),
        projects: {},
        activeId: null,
        sessions: {},
        ui: { phase: 'identity', route: { page: 'home' }, device: 'desktop', annotations: false, workspace: 'studio', fullscreen: false, selectedAnnotation: null },

        createProject: (opts) => {
          const p = createProject(opts);
          set((s) => ({ projects: { ...s.projects, [p.meta.id]: p }, activeId: p.meta.id, ui: { ...s.ui, phase: 'identity', route: { page: 'home' }, workspace: 'studio' } }));
          return p.meta.id;
        },
        duplicateProject: (id) => {
          const src = get().projects[id];
          const copy: ProjectConfig = structuredClone(src);
          const now = new Date().toISOString();
          copy.meta = { ...copy.meta, id: uid(), name: `${src.meta.name} (copia)`, createdAt: now, updatedAt: now };
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
        openProject: (id) => set((s) => ({ activeId: id, ui: { ...s.ui, route: { page: 'home' }, workspace: 'studio', fullscreen: false, selectedAnnotation: null } })),
        importProject: (cfg) => {
          const copy = structuredClone(cfg);
          copy.meta = { ...copy.meta, id: uid(), updatedAt: new Date().toISOString() };
          set((s) => ({ projects: { ...s.projects, [copy.meta.id]: copy } }));
          return copy.meta.id;
        },

        update: (path, value, questionId) => withActive((c) => markAnswered(setPath(c, path, value), questionId)),
        mutate: (fn, questionId) => withActive((c) => markAnswered(fn(structuredClone(c)), questionId)),
        setDecision: (qid, patch) =>
          withActive((c) => {
            const prev = c.decisions[qid] ?? { status: 'pending', owner: '', notes: '', updatedAt: '' };
            const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
            const answered = patch.status && patch.status !== 'pending' ? { ...c.answered, [qid]: true } : c.answered;
            return { ...c, answered, decisions: { ...c.decisions, [qid]: next } };
          }),
        setAnswered: (qid, value) => withActive((c) => ({ ...c, answered: { ...c.answered, [qid]: value } })),

        setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
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
          const s = get().sessions[get().activeId!] ?? emptySession();
          const order: DemoOrder = { number: `DEMO-${1001 + s.orders.length}`, total, lines: s.cart, createdAt: new Date().toISOString() };
          const subs: DemoSubscription[] = s.cart.filter((l) => l.purchase === 'subscription').map((l) => ({ id: uid(), productId: l.productId, variantId: l.variantId, frequency: l.frequency ?? '30 días', status: 'active', skipped: 0 }));
          withSession((x) => ({ ...x, cart: [], discountCode: null, cartOpen: false, orders: [order, ...x.orders], subscriptions: [...subs, ...x.subscriptions] }));
          return order;
        },
        updateSubscription: (id, patch) => withSession((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        dismissPopup: () => withSession((s) => ({ ...s, popupDismissed: true })),
        resetSession: () => withSession(() => emptySession()),
      };
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localProjectStorage),
      partialize: (s) => ({ studioBrand: s.studioBrand, projects: s.projects, activeId: s.activeId, sessions: s.sessions, ui: { ...s.ui, fullscreen: false, selectedAnnotation: null } }),
      migrate: (persisted) => persisted as StudioState,
    },
  ),
);

export const useProject = () => useStudio((s) => (s.activeId ? s.projects[s.activeId] : undefined));
export const useSession = () => useStudio((s) => (s.activeId ? s.sessions[s.activeId] : undefined) ?? EMPTY_SESSION);
const EMPTY_SESSION = emptySession();
