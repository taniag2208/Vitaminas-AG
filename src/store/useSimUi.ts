import { create } from 'zustand';

/** Estado efímero de la simulación (no se persiste ni forma parte de las decisiones). */
interface SimUi {
  quickView: string | null;
  mobileMenu: boolean;
  toast: string | null;
  highlight: string | null;
  setHighlight: (id: string | null) => void;
  setQuickView: (id: string | null) => void;
  setMobileMenu: (v: boolean) => void;
  showToast: (msg: string) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useSimUi = create<SimUi>((set) => ({
  quickView: null,
  mobileMenu: false,
  toast: null,
  highlight: null,
  setHighlight: (highlight) => set({ highlight }),
  setQuickView: (quickView) => set({ quickView }),
  setMobileMenu: (mobileMenu) => set({ mobileMenu }),
  showToast: (toast) => {
    set({ toast });
    clearTimeout(timer);
    timer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
