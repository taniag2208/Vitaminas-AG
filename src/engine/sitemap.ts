import type { ProjectConfig } from '@/types/project';

/* ───────────── Mapa del sitio ───────────── */

export interface SitemapNode {
  id: string;
  title: string;
  route: string;
  kind: 'page' | 'collection' | 'template' | 'external';
  inMenu?: boolean;
  inFooter?: boolean;
  note?: string;
  children?: SitemapNode[];
}

export function buildSitemap(c: ProjectConfig): SitemapNode[] {
  const nodes: SitemapNode[] = c.pages.map((p) => {
    const node: SitemapNode = { id: p.id, title: p.title, route: p.id, kind: 'page', inMenu: p.inMenu, inFooter: p.inFooter };
    if (p.type === 'catalog') {
      node.kind = 'collection';
      node.children = [
        ...c.catalog.categories.map((cat) => ({ id: `cat:${cat}`, title: cat, route: `catalog?category=${encodeURIComponent(cat)}`, kind: 'collection' as const })),
        { id: 'product', title: 'Plantilla: ficha de producto', route: 'product', kind: 'template' },
      ];
    }
    if (p.type === 'blog') node.children = [{ id: 'article', title: 'Plantilla: artículo', route: 'blog', kind: 'template' }];
    return node;
  });
  nodes.push({ id: 'cart', title: c.cart.type === 'drawer' ? 'Carrito (lateral)' : 'Carrito', route: 'cart', kind: 'template' });
  nodes.push({ id: 'checkout', title: 'Checkout de Shopify', route: 'checkout', kind: 'external', note: 'Nativo de Shopify; aquí solo se simula la confirmación' });
  return nodes;
}
