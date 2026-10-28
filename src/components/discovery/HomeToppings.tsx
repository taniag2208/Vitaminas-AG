import { useState } from 'react';
import { ArrowRight, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { getSectionDef, SECTION_LIBRARY } from '@/config/sections';
import { createProject, makeSection } from '@/config/templates';
import { cn } from '@/lib/utils';
import { useSimUi } from '@/store/useSimUi';
import { useStudio } from '@/store/useStudio';
import type { ProjectConfig, SectionType } from '@/types/project';
import { ScopeBadge } from '../ui';
import { SectionThumb } from './SectionThumb';

const QID = 'home.sections';

/** Toppings agrupados por intención, en el orden en que suele armarse un Home. */
export const TOPPING_GROUPS: { title: string; hint: string; types: SectionType[] }[] = [
  { title: 'Banners', hint: 'Lo primero que se ve', types: ['hero', 'slideshow', 'promoBanner', 'announcement'] },
  { title: 'Explorar', hint: 'Llevar a categorías', types: ['categoryCircles', 'categoryCards', 'goals', 'brands'] },
  { title: 'Productos', hint: 'Vender desde el Home', types: ['bestSellers', 'featured', 'newArrivals', 'bundles'] },
  { title: 'Confianza', hint: 'Por qué comprar aquí', types: ['benefits', 'testimonials', 'imageText'] },
  { title: 'Contenido', hint: 'Educar y resolver dudas', types: ['blog', 'faq'] },
  { title: 'Cierre', hint: 'Captar y convertir', types: ['newsletter', 'ctaFinal'] },
];

const SHORT: Partial<Record<SectionType, string>> = { hero: 'Banner', slideshow: 'Slideshow', promoBanner: 'Promo', announcement: 'Barra promo', categoryCircles: 'Categorías ○', categoryCards: 'Categorías ▢', goals: 'Objetivos', brands: 'Marcas', bestSellers: 'Más vendidos', featured: 'Destacados', newArrivals: 'Novedades', bundles: 'Kits', benefits: 'Beneficios', testimonials: 'Testimonios', imageText: 'Imagen + texto', blog: 'Blog', faq: 'FAQ', newsletter: 'Newsletter', ctaFinal: 'CTA final' };
export const shortLabel = (t: SectionType) => SHORT[t] ?? getSectionDef(t).label;

export function HomeToppings({ cfg, onAdded }: { cfg: ProjectConfig; onAdded?: (id: string) => void }) {
  const mutate = useStudio((s) => s.mutate);
  const navigate = useStudio((s) => s.navigate);
  const setHighlight = useSimUi((s) => s.setHighlight);
  const [confirmClear, setConfirmClear] = useState(false);
  const sections = cfg.home.sections;
  const last = sections[sections.length - 1];

  const flash = (id: string) => {
    navigate('home');
    setHighlight(id);
    setTimeout(() => setHighlight(null), 1400);
  };

  const add = (type: SectionType) => {
    const s = makeSection(type);
    mutate((c) => ({ ...c, home: { sections: type === 'announcement' ? [s, ...c.home.sections] : [...c.home.sections, s] } }), QID);
    flash(s.id);
    onAdded?.(s.id);
  };
  const remove = (id: string) => mutate((c) => ({ ...c, home: { sections: c.home.sections.filter((x) => x.id !== id) } }), QID);
  const clear = () => {
    mutate((c) => ({ ...c, home: { sections: [] } }), QID);
    setConfirmClear(false);
    navigate('home');
  };
  const restore = () => {
    const tpl = createProject({ name: '', client: '', template: cfg.meta.vertical === 'Genérico' ? 'blank' : 'wellness' });
    mutate((c) => ({ ...c, home: tpl.home }), QID);
    navigate('home');
  };

  return (
    <section className="flex flex-col gap-3" aria-label="Armar el Home por toppings" data-testid="home-toppings">
      <div className="rounded-xl bg-gradient-to-br from-studio-50 to-white p-3 ring-1 ring-studio-100">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-600"><Sparkles size={13} /> Paso {sections.length + 1}</p>
        <p className="font-display text-base font-extrabold text-ink-900" data-testid="toppings-prompt">
          {sections.length === 0 ? '¿Qué va primero en tu Home?' : <>¿Qué va después de <span className="text-studio-700">{shortLabel(last.type)}</span>?</>}
        </p>
        <p className="text-xs text-slate-500">Toca un topping para apilarlo en ese orden. Lo verás al instante en el simulador.</p>

        {/* La pila: el Home en orden, de arriba hacia abajo */}
        <ol className="mt-3 flex flex-wrap items-center gap-1" aria-label="Orden actual del Home" data-testid="toppings-stack">
          {sections.length === 0 && <li className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-400">Tu Home está vacío</li>}
          {sections.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1">
              {i > 0 && <ArrowRight size={12} className="text-slate-300" aria-hidden />}
              <span className="group inline-flex items-center gap-1 rounded-full bg-white py-0.5 pl-1 pr-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                <button type="button" onClick={() => flash(s.id)} className="inline-flex items-center gap-1" title="Ver en el simulador">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-studio-600 text-[9px] font-bold text-white">{i + 1}</span>
                  {shortLabel(s.type)}
                </button>
                <button type="button" aria-label={`Quitar ${shortLabel(s.type)}`} onClick={() => remove(s.id)} className="rounded-full text-slate-300 hover:text-rose-600"><X size={12} /></button>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {confirmClear ? (
            <span className="inline-flex items-center gap-2 text-xs">
              ¿Vaciar el Home y empezar de cero?
              <button type="button" onClick={clear} className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white" data-testid="toppings-clear-confirm">Sí, vaciar</button>
              <button type="button" onClick={() => setConfirmClear(false)} className="rounded-md px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
            </span>
          ) : (
            <>
              <button type="button" disabled={!sections.length} onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40" data-testid="toppings-clear"><X size={12} /> Empezar de cero</button>
              <button type="button" onClick={restore} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white"><RotateCcw size={12} /> Usar sugerencia de la plantilla</button>
            </>
          )}
        </div>
      </div>

      {/* Toppings disponibles */}
      <div className="flex flex-col gap-3" data-testid="section-palette">
        {TOPPING_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{g.title} <span className="font-medium normal-case tracking-normal text-slate-400">· {g.hint}</span></p>
            <div className="grid grid-cols-2 gap-2">
              {g.types.map((t) => {
                const def = SECTION_LIBRARY.find((d) => d.type === t)!;
                const used = sections.filter((s) => s.type === t).length;
                const disabled = !!def.single && used > 0;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={disabled}
                    onClick={() => add(t)}
                    className={cn('group relative flex flex-col gap-1.5 rounded-xl border bg-white p-1.5 text-left transition hover:-translate-y-0.5 hover:border-studio-400 hover:shadow-md disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none', used ? 'border-studio-200' : 'border-slate-200')}
                    data-palette-type={t}
                    title={def.description}
                  >
                    <SectionThumb type={t} primary={cfg.brand.primary} accent={cfg.brand.accent} />
                    <span className="flex items-center gap-1 px-0.5 text-xs font-bold text-slate-800">
                      <span className="flex-1 truncate">{def.label}</span>
                      {used > 0 && <span className="rounded-full bg-studio-100 px-1.5 text-[10px] text-studio-700">×{used}</span>}
                      <Plus size={14} className="shrink-0 text-studio-600 opacity-0 transition group-hover:opacity-100" />
                    </span>
                    {def.scope !== 'proposal' && <span className="px-0.5"><ScopeBadge scope={def.scope} short /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
