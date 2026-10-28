import type { StateStorage } from 'zustand/middleware';

/**
 * Adaptador de persistencia.
 *
 * MVP: localStorage del navegador (los datos viven solo en este navegador y equipo).
 * Para incorporar backend/colaboración basta con implementar otro `StateStorage`
 * (p. ej. una API REST o Supabase) con la misma interfaz y sustituirlo aquí.
 */
export const STORAGE_KEY = 'tita-discovery-studio';

type Listener = (error: string | null) => void;
const listeners = new Set<Listener>();
export const onStorageError = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const localProjectStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
      listeners.forEach((l) => l(null));
    } catch (e) {
      const msg = e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'El almacenamiento local está lleno. Reduce imágenes cargadas o exporta y elimina proyectos.'
        : 'No se pudo guardar en el almacenamiento local.';
      listeners.forEach((l) => l(msg));
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};
