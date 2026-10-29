import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { applyFilters, effectiveFilters, facets, filterLabel, SORT_LABEL, sortProducts, type ActiveFilters } from '@/engine/catalog';
import { DEMO_PRODUCTS, totalStock } from '@/data/demoCatalog';
import { cn } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import { useSimUi } from '@/store/useSimUi';
import type { SortOption } from '@/types/project';
import { BannerArt } from '../Art';
import { Container, DemoTag, ProductCard, SimButton } from '../Common';
import { Annotated, SimPortal, useSim } from '../SimContext';

function initialFilters(params?: Record<string, string>): ActiveFilters {
  const f: ActiveFilters = {};
  if (params?.category) f.category = [params.category];
  if (params?.brand) f.brand = [params.brand];
  if (params?.goal) f.goal = [params.goal];
  return f;
}

function FilterGroup({ attr, active, toggle, compact }: { attr: string; active: ActiveFilters; toggle: (a: string, v: string) => void; compact?: boolean }) {
  const { cfg } = useSim();
  const list = facets(DEMO_PRODUCTS, attr, active, cfg.catalog);
  return (
    <fieldset className={cn(!compact && 'border-b border-slate-200 pb-4')}>
      {!compact && <legend className="mb-2 font-sim-heading text-sm font-bold">{filterLabel(attr, cfg.catalog)}</legend>}
      <div className="flex flex-col gap-1">
        {list.map(({ value, count }) => {
          const checked = active[attr]?.includes(value) ?? false;
          return (
            <label key={value} className={cn('flex cursor-pointer items-center gap-2.5 rounded px-1 py-1 text-sm hover:bg-slate-50', count === 0 && !checked && 'opacity-45')}>
              <input type="checkbox" checked={checked} onChange={() => toggle(attr, value)} className="h-4 w-4 accent-[var(--sim-primary)]" />
              <span className="flex-1">{value}</span>
              <span className="rounded-full bg-slate-100 px-2 text-[11px] text-slate-500">{count}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CollectionPage() {
  const { cfg, device, go, scrollRef } = useSim();
  const route = useRouteParams();
  const [active, setActive] = useState<ActiveFilters>(() => initialFilters(route));
  const [sort, setSort] = useState<SortOption>(cfg.catalog.sorts[0] ?? 'featured');
  const [page, setPage] = useState(1);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const isMobile = device === 'mobile';
  const filterIds = effectiveFilters(cfg.catalog);
  const routeKey = JSON.stringify(route ?? {});
  const forced = useSimUi((s) => s.forced);
  const layoutNow = cfg.catalog.filterLayout;
  const mobileFilterNow = cfg.catalog.mobileFilter;

  // Mostrar los filtros abiertos cuando se está decidiendo su presentación
  useEffect(() => {
    if (forced !== 'openFilters') return;
    if (isMobile) {
      if (mobileFilterNow === 'drawer') setDrawer(true);
      else { setDrawer(false); setMobileOpen('all'); }
    } else if (layoutNow === 'dropdown') setOpenPanel('panel');
  }, [forced, isMobile, layoutNow, mobileFilterNow]);

  useEffect(() => {
    setActive(initialFilters(route));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    if (!cfg.catalog.sorts.includes(sort)) setSort(cfg.catalog.sorts[0] ?? 'featured');
  }, [cfg.catalog.sorts, sort]);

  const query = route?.q?.toLowerCase().trim();
  const results = useMemo(() => {
    let list = applyFilters(DEMO_PRODUCTS, active, cfg.catalog);
    if (query) list = list.filter((p) => `${p.name} ${p.brand} ${p.category} ${p.ingredients.join(' ')}`.toLowerCase().includes(query));
    const sorted = sortProducts(list, sort);
    const oos = cfg.catalog.outOfStock ?? 'show';
    if (oos === 'hide') return sorted.filter((p) => totalStock(p) > 0);
    if (oos === 'last') return [...sorted.filter((p) => totalStock(p) > 0), ...sorted.filter((p) => totalStock(p) === 0)];
    return sorted;
  }, [active, cfg.catalog, sort, query]);

  const perPage = cfg.catalog.perRowDesktop * 2;
  const pages = Math.max(1, Math.ceil(results.length / perPage));
  const shown = cfg.catalog.pagination === 'pages' ? results.slice((page - 1) * perPage, page * perPage) : results.slice(0, page * perPage);

  useEffect(() => {
    if (cfg.catalog.pagination !== 'infinite' || !sentinel.current) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setPage((p) => (p < pages ? p + 1 : p)), { root: scrollRef.current, rootMargin: '120px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cfg.catalog.pagination, pages, scrollRef, shown.length]);

  const toggle = (attr: string, value: string) => {
    setPage(1);
    setActive((a) => {
      const cur = a[attr] ?? [];
      return { ...a, [attr]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  };
  const chips = Object.entries(active).flatMap(([attr, vals]) => vals.map((v) => ({ attr, v })));
  const clear = () => { setActive({}); setPage(1); };

  const title = route?.category ?? route?.brand ?? route?.goal ?? (query ? `Resultados para "${route?.q}"` : 'Todos los productos');
  const perRowCls = cn('grid gap-3 @3xl:gap-5', cfg.catalog.perRowMobile === 1 ? 'grid-cols-1' : 'grid-cols-2', { 2: '@3xl:grid-cols-2', 3: '@3xl:grid-cols-3', 4: '@3xl:grid-cols-4', 5: '@3xl:grid-cols-5' }[cfg.catalog.perRowDesktop]);
  const layout = cfg.catalog.filterLayout;
  const countLabel = <span data-testid="result-count" className="text-sm text-slate-500"><b className="text-slate-900">{results.length}</b> {results.length === 1 ? 'producto' : 'productos'}</span>;

  const sortSelect = cfg.catalog.sorts.length > 0 && (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-slate-500 @md:inline">Ordenar por</span>
      <select aria-label="Ordenar productos" value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="h-10 rounded-sim border border-slate-300 bg-white px-3 text-sm">
        {cfg.catalog.sorts.map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
      </select>
    </label>
  );

  const chipRow = chips.length > 0 && (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
      {chips.map(({ attr, v }) => (
        <button key={attr + v} type="button" onClick={() => toggle(attr, v)} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/20">
          {filterLabel(attr, cfg.catalog)}: {v} <X size={12} aria-hidden /> <span className="sr-only">Quitar</span>
        </button>
      ))}
      <button type="button" onClick={clear} className="text-xs font-semibold text-slate-500 underline">Limpiar todo</button>
    </div>
  );

  const groups = (compact = false) => filterIds.map((id) => <FilterGroup key={id} attr={id} active={active} toggle={toggle} compact={compact} />);
  const activeCount = (id: string) => active[id]?.length ?? 0;

  return (
    <div data-testid="collection-page" data-filter-layout={isMobile ? `mobile-${cfg.catalog.mobileFilter}` : layout}>
      {cfg.catalog.bannerOnCollection ? (
        <div className="relative isolate overflow-hidden">
          <BannerArt seed={title.length} primary={cfg.brand.primary} accent={cfg.brand.accent} className="absolute inset-0 -z-10 h-full w-full" label={false} />
          <div className="absolute inset-0 -z-10 bg-white/55" />
          <Container className="py-10 @3xl:py-14">
            <nav aria-label="Migas" className="text-xs text-slate-600"><button type="button" onClick={() => go('home')} className="hover:underline">Inicio</button> / <button type="button" onClick={() => go('catalog')} className="hover:underline">Catálogo</button>{title !== 'Todos los productos' && <> / <span className="font-semibold text-slate-900">{title}</span></>}</nav>
            <h1 className="mt-2 font-sim-heading text-3xl font-extrabold tracking-tight @3xl:text-4xl">{title}</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">Descripción de la colección (contenido de ejemplo).</p>
          </Container>
        </div>
      ) : (
        <Container className="pt-8"><h1 className="font-sim-heading text-3xl font-extrabold">{title}</h1></Container>
      )}

      <Container className="py-6 @3xl:py-10">
        {/* Barra de herramientas */}
        <Annotated id="filters" className="mb-5">
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <SimButton variant="outline" className="h-10 px-4" onClick={() => (cfg.catalog.mobileFilter === 'drawer' ? setDrawer(true) : setMobileOpen(mobileOpen ? null : 'all'))}>
                  <SlidersHorizontal size={16} /> Filtrar {chips.length > 0 && `(${chips.length})`}
                </SimButton>
                {sortSelect}
              </div>
              {cfg.catalog.mobileFilter === 'accordion' && mobileOpen && (
                <div className="animate-fade-in divide-y divide-slate-200 rounded-sim-lg border border-slate-200 bg-white px-3" data-testid="filter-accordion">
                  {filterIds.map((id) => (
                    <div key={id}>
                      <button type="button" aria-expanded={mobileOpen === id} onClick={() => setMobileOpen(mobileOpen === id ? 'all' : id)} className="flex w-full items-center justify-between py-3 text-sm font-bold">
                        {filterLabel(id, cfg.catalog)} {activeCount(id) > 0 && <span className="ml-1 text-brand">({activeCount(id)})</span>}
                        <ChevronDown size={16} className={cn('ml-auto transition', mobileOpen === id && 'rotate-180')} />
                      </button>
                      {mobileOpen === id && <div className="pb-3"><FilterGroup attr={id} active={active} toggle={toggle} compact /></div>}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">{countLabel}</div>
              {chipRow}
            </div>
          ) : layout === 'horizontal' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2" data-testid="filter-horizontal">
                {filterIds.map((id) => (
                  <div key={id} className="relative">
                    <button type="button" aria-expanded={openPanel === id} onClick={() => setOpenPanel(openPanel === id ? null : id)} className={cn('inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold', activeCount(id) ? 'border-brand bg-brand/5 text-brand' : 'border-slate-300 bg-white hover:border-slate-400')}>
                      {filterLabel(id, cfg.catalog)} {activeCount(id) > 0 && `(${activeCount(id)})`} <ChevronDown size={14} />
                    </button>
                    {openPanel === id && (
                      <div className="animate-fade-in absolute left-0 top-12 z-20 w-64 rounded-sim-lg border border-slate-200 bg-white p-3 shadow-xl">
                        <FilterGroup attr={id} active={active} toggle={toggle} compact />
                      </div>
                    )}
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-4">{countLabel}{sortSelect}</div>
              </div>
              {chipRow}
            </div>
          ) : layout === 'dropdown' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <SimButton variant="outline" className="h-10" onClick={() => setOpenPanel(openPanel ? null : 'panel')}><SlidersHorizontal size={16} /> {openPanel ? 'Ocultar filtros' : 'Mostrar filtros'} {chips.length > 0 && `(${chips.length})`}</SimButton>
                <div className="ml-auto flex items-center gap-4">{countLabel}{sortSelect}</div>
              </div>
              {openPanel && <div className="animate-fade-in grid grid-cols-4 gap-6 rounded-sim-lg border border-slate-200 bg-white p-5" data-testid="filter-dropdown-panel">{groups(false)}</div>}
              {chipRow}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 @3xl:pl-[264px]">{countLabel}{sortSelect}</div>
          )}
        </Annotated>

        <div className={cn(!isMobile && layout === 'sidebar' && 'grid grid-cols-[240px_1fr] gap-6')}>
          {!isMobile && layout === 'sidebar' && (
            <Annotated id="filters" as="aside" className="h-fit">
              <div className="flex flex-col gap-4" data-testid="filter-sidebar">
                {chipRow}
                {groups()}
              </div>
            </Annotated>
          )}
          <Annotated id="collection">
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-sim-lg border border-dashed border-slate-300 py-16 text-center">
                <p className="font-sim-heading text-lg font-bold">No encontramos productos</p>
                <p className="text-sm text-slate-500">Prueba quitando algún filtro.</p>
                <SimButton variant="outline" onClick={clear}>Limpiar filtros</SimButton>
              </div>
            ) : (
              <Annotated id="productCard" className={perRowCls}>
                {shown.map((p) => <ProductCard key={p.id} product={p} />)}
              </Annotated>
            )}
            {cfg.catalog.pagination === 'pages' && pages > 1 && (
              <nav aria-label="Paginación" className="mt-8 flex justify-center gap-1.5">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" aria-current={n === page} onClick={() => { setPage(n); scrollRef.current?.scrollTo({ top: 0 }); }} className={cn('h-10 w-10 rounded-sim text-sm font-semibold', n === page ? 'bg-brand text-on-brand' : 'border border-slate-200 hover:border-brand')}>{n}</button>
                ))}
              </nav>
            )}
            {cfg.catalog.pagination === 'loadMore' && page < pages && <div className="mt-8 flex justify-center"><SimButton variant="outline" onClick={() => setPage(page + 1)}>Cargar más ({results.length - shown.length})</SimButton></div>}
            {cfg.catalog.pagination === 'infinite' && page < pages && <div ref={sentinel} className="py-6 text-center text-xs text-slate-400">Cargando más productos…</div>}
            <div className="mt-6 text-center"><DemoTag /></div>
          </Annotated>
        </div>
      </Container>

      {drawer && isMobile && mobileFilterNow === 'drawer' && (
        <SimPortal>
          <div className="absolute inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label="Filtros">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="animate-slide-left relative flex h-full w-[86%] max-w-sm flex-col bg-white" data-testid="filter-drawer">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="font-sim-heading font-bold">Filtros</span>
                <button type="button" aria-label="Cerrar filtros" onClick={() => setDrawer(false)}><X size={20} /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">{groups()}</div>
              <div className="flex gap-2 border-t border-slate-200 p-3">
                <SimButton variant="outline" className="flex-1" onClick={clear}>Limpiar</SimButton>
                <SimButton className="flex-1" onClick={() => setDrawer(false)}>Ver {results.length}</SimButton>
              </div>
            </div>
          </div>
        </SimPortal>
      )}
    </div>
  );
}

const useRouteParams = () => useStudio((s) => s.ui.route.params);
