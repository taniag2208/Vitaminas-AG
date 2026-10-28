import { DEMO_PRODUCTS, customAttrValue, minPrice, totalStock } from '@/data/demoCatalog';
import type { CatalogConfig, DemoProduct, SortOption } from '@/types/project';
import { formatMoney } from '@/lib/utils';

export const FILTER_LABEL: Record<string, string> = {
  brand: 'Marca',
  ingredient: 'Ingrediente',
  goal: 'Objetivo',
  format: 'Formato',
  presentation: 'Presentación',
  price: 'Precio',
  availability: 'Disponibilidad',
  category: 'Categoría',
};

export const SORT_LABEL: Record<SortOption, string> = {
  featured: 'Destacados',
  bestSelling: 'Más vendidos',
  priceAsc: 'Precio: menor a mayor',
  priceDesc: 'Precio: mayor a menor',
  newest: 'Más recientes',
  rating: 'Mejor valorados',
  alpha: 'Alfabético A-Z',
};

const PRICE_BUCKETS = [
  { id: 'lt50', test: (v: number) => v < 50000, label: () => `Menos de ${formatMoney(50000)}` },
  { id: '50to100', test: (v: number) => v >= 50000 && v <= 100000, label: () => `${formatMoney(50000)} – ${formatMoney(100000)}` },
  { id: 'gt100', test: (v: number) => v > 100000, label: () => `Más de ${formatMoney(100000)}` },
];

export const filterLabel = (id: string, catalog: CatalogConfig) => {
  if (id.startsWith('custom:')) return catalog.customAttributes.find((a) => `custom:${a.id}` === id)?.label ?? id;
  return FILTER_LABEL[id] ?? id;
};

/** Valores de un atributo para un producto. */
export function attrValues(p: DemoProduct, attr: string, catalog: CatalogConfig): string[] {
  switch (attr) {
    case 'brand': return [p.brand];
    case 'ingredient': return p.ingredients;
    case 'goal': return p.goals;
    case 'format': return [p.format];
    case 'category': return [p.category];
    case 'presentation': return p.presentations.map((v) => v.label);
    case 'availability': return [totalStock(p) > 0 ? 'Disponible' : 'Agotado'];
    case 'price': {
      const b = PRICE_BUCKETS.find((x) => x.test(minPrice(p)));
      return b ? [b.label()] : [];
    }
    default: {
      if (attr.startsWith('custom:')) {
        const def = catalog.customAttributes.find((a) => `custom:${a.id}` === attr);
        const v = def ? customAttrValue(p.id, def.values) : undefined;
        return v ? [v] : [];
      }
      return [];
    }
  }
}

export type ActiveFilters = Record<string, string[]>;

export function applyFilters(products: DemoProduct[], active: ActiveFilters, catalog: CatalogConfig): DemoProduct[] {
  return products.filter((p) =>
    Object.entries(active).every(([attr, vals]) => !vals.length || attrValues(p, attr, catalog).some((v) => vals.includes(v))),
  );
}

/** Facetas con contador: el conteo considera los demás filtros activos (comportamiento de Shopify). */
export function facets(products: DemoProduct[], attr: string, active: ActiveFilters, catalog: CatalogConfig) {
  const others = { ...active, [attr]: [] };
  const base = applyFilters(products, others, catalog);
  const counts = new Map<string, number>();
  products.forEach((p) => attrValues(p, attr, catalog).forEach((v) => counts.has(v) || counts.set(v, 0)));
  base.forEach((p) => attrValues(p, attr, catalog).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
  const order = attr === 'price' ? PRICE_BUCKETS.map((b) => b.label()) : null;
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (order ? order.indexOf(a.value) - order.indexOf(b.value) : a.value.localeCompare(b.value)));
}

export function sortProducts(products: DemoProduct[], sort: SortOption): DemoProduct[] {
  const arr = [...products];
  switch (sort) {
    case 'bestSelling': return arr.sort((a, b) => a.bestSellerRank - b.bestSellerRank);
    case 'priceAsc': return arr.sort((a, b) => minPrice(a) - minPrice(b));
    case 'priceDesc': return arr.sort((a, b) => minPrice(b) - minPrice(a));
    case 'newest': return arr.sort((a, b) => b.createdRank - a.createdRank);
    case 'rating': return arr.sort((a, b) => b.rating - a.rating);
    case 'alpha': return arr.sort((a, b) => a.name.localeCompare(b.name));
    default: return arr;
  }
}

/** Filtros disponibles = atributos activos + atributos personalizados. */
export function availableFilterIds(catalog: CatalogConfig): string[] {
  return [...catalog.attributes, ...catalog.customAttributes.map((a) => `custom:${a.id}`)];
}

/** Filtros efectivos: los elegidos que aún existen como atributo. */
export function effectiveFilters(catalog: CatalogConfig): string[] {
  const avail = availableFilterIds(catalog);
  return catalog.filters.filter((f) => avail.includes(f));
}

export const allProducts = () => DEMO_PRODUCTS;

/** Productos de una categoría (o todos si la categoría no tiene productos demo). */
export function productsForCategory(category: string | undefined) {
  if (!category) return DEMO_PRODUCTS;
  return DEMO_PRODUCTS.filter((p) => p.category === category);
}
