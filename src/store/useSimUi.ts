import { create } from 'zustand';
import type { PreviewSpec } from '@/types/discovery';

type PreviewAction = NonNullable<PreviewSpec['action']>;

/** Estado efímero de la simulación (no se persiste ni forma parte de las decisiones). */
interface SimUi {
  quickView: string | null;
  mobileMenu: boolean;
  toast: string | null;
  highlight: string | null;
  /** Elemento (data-focus) al que el simulador debe desplazarse y resaltar; nonce fuerza repetir */
  focus: { target: string; nonce: number } | null;
  /** Estado visual forzado para mostrar una decisión (menú abierto, filtros abiertos…) */
  forced: PreviewAction | null;
  setHighlight: (id: string | null) => void;
  setQuickView: (id: string | null) => void;
  setMobileMenu: (v: boolean) => void;
  showToast: (msg: string) => void;
  setFocus: (target: string | null) => void;
  setForced: (a: PreviewAction | null) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let nonce = 0;

export const useSimUi = create<SimUi>((set) => ({
  quickView: null,
  mobileMenu: false,
  toast: null,
  highlight: null,
  focus: null,
  forced: null,
  setHighlight: (highlight) => set({ highlight }),
  setQuickView: (quickView) => set({ quickView }),
  setMobileMenu: (mobileMenu) => set({ mobileMenu }),
  showToast: (toast) => {
    set({ toast });
    clearTimeout(timer);
    timer = setTimeout(() => set({ toast: null }), 2600);
  },
  setFocus: (target) => set({ focus: target ? { target, nonce: ++nonce } : null }),
  setForced: (forced) => set({ forced }),
}));
