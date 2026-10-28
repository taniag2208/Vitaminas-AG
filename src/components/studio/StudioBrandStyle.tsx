import { useEffect } from 'react';
import { useStudio } from '@/store/useStudio';

/** Aplica el color de identidad del estudio (Tita Media por defecto) a los tokens de la app. */
export function StudioBrandStyle() {
  const accent = useStudio((s) => s.studioBrand.accent);
  const name = useStudio((s) => s.studioBrand.name);
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--color-studio-600', accent);
    r.setProperty('--color-studio-700', `color-mix(in oklab, ${accent} 82%, black)`);
    r.setProperty('--color-studio-500', `color-mix(in oklab, ${accent} 85%, white)`);
    r.setProperty('--color-studio-400', `color-mix(in oklab, ${accent} 65%, white)`);
    r.setProperty('--color-studio-200', `color-mix(in oklab, ${accent} 30%, white)`);
    r.setProperty('--color-studio-100', `color-mix(in oklab, ${accent} 14%, white)`);
    r.setProperty('--color-studio-50', `color-mix(in oklab, ${accent} 7%, white)`);
  }, [accent]);
  useEffect(() => {
    document.title = `${name} · Discovery Studio`;
  }, [name]);
  return null;
}

export function StudioMark({ size = 32 }: { size?: number }) {
  const name = useStudio((s) => s.studioBrand.name);
  return (
    <span className="grid shrink-0 place-items-center rounded-lg bg-studio-600 font-display font-extrabold text-white shadow-md shadow-studio-600/30" style={{ width: size, height: size, fontSize: size * 0.48 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
