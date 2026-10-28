import { DEMO_CATEGORIES } from '@/data/demoCatalog';
import { sectionDefaults } from '@/config/sections';
import type { PageDef, PageType, ProjectConfig, ScopeStatus, SectionInstance, SectionType } from '@/types/project';
import { SCHEMA_VERSION } from '@/types/project';
import { uid } from '@/lib/utils';

export const PAGE_TYPES: { type: PageType; label: string; scope: ScopeStatus; annotation: string; required?: boolean; repeatable?: boolean }[] = [
  { type: 'home', label: 'Inicio', scope: 'proposal', annotation: 'page', required: true },
  { type: 'catalog', label: 'Catálogo', scope: 'proposal', annotation: 'collection', required: true },
  { type: 'brands', label: 'Marcas', scope: 'proposal', annotation: 'brands' },
  { type: 'about', label: 'Nosotros', scope: 'proposal', annotation: 'page' },
  { type: 'contact', label: 'Contacto', scope: 'proposal', annotation: 'contactForm' },
  { type: 'blog', label: 'Blog', scope: 'proposal', annotation: 'blog' },
  { type: 'faq', label: 'Preguntas frecuentes', scope: 'proposal', annotation: 'faq' },
  { type: 'policies', label: 'Políticas', scope: 'proposal', annotation: 'page' },
  { type: 'tracking', label: 'Seguimiento de pedidos', scope: 'validation', annotation: 'tracking' },
  { type: 'account', label: 'Mi cuenta / suscripciones', scope: 'validation', annotation: 'account' },
  { type: 'kits', label: 'Kits', scope: 'validation', annotation: 'bundles' },
  { type: 'custom', label: 'Página personalizada', scope: 'additional', annotation: 'page', repeatable: true },
];

export const pageTypeInfo = (t: PageType) => PAGE_TYPES.find((p) => p.type === t)!;

export const makePage = (type: PageType, title?: string): PageDef => ({
  id: type === 'custom' ? `custom-${uid()}` : type,
  type,
  title: title ?? pageTypeInfo(type).label,
  inMenu: ['catalog', 'brands', 'about', 'blog', 'contact'].includes(type),
  inFooter: ['about', 'contact', 'faq', 'policies', 'tracking', 'blog'].includes(type),
  body: type === 'custom' ? 'Contenido de la página pendiente de definir por el cliente.' : undefined,
});

export const makeSection = (type: SectionType, variant?: string): SectionInstance => {
  return { id: `${type}-${uid()}`, type, variant: variant ?? defaultVariant(type), props: sectionDefaults(type) };
};

const defaultVariant = (type: SectionType) => {
  const map: Partial<Record<SectionType, string>> = { hero: 'split', slideshow: 'full', categoryCards: 'image', categoryCircles: 'circles', goals: 'tiles', featured: 'grid', bestSellers: 'carousel', newArrivals: 'grid', brands: 'logos', benefits: 'icons', imageText: 'imageLeft', testimonials: 'cards', bundles: 'cards', blog: 'cards', faq: 'accordion', newsletter: 'inline', promoBanner: 'wide', ctaFinal: 'band', announcement: 'static' };
  return map[type] ?? 'default';
};

export type TemplateId = 'wellness' | 'blank';

export const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: 'wellness', label: 'Bienestar y suplementos (B2C)', description: 'Punto de partida con objetivos de bienestar, presentaciones, suscripciones y kits. Recomendado para AG Vitaminas.' },
  { id: 'blank', label: 'Ecommerce genérico', description: 'Estructura mínima: Inicio, Catálogo y Contacto. Todas las decisiones quedan pendientes.' },
];

export function createProject(opts: { name: string; client: string; template: TemplateId }): ProjectConfig {
  const now = new Date().toISOString();
  const wellness = opts.template === 'wellness';
  const pages: PageDef[] = wellness
    ? (['home', 'catalog', 'brands', 'about', 'blog', 'contact', 'faq', 'policies', 'tracking'] as PageType[]).map((t) => makePage(t))
    : (['home', 'catalog', 'contact', 'policies'] as PageType[]).map((t) => makePage(t));

  const sectionTypes: SectionType[] = wellness
    ? ['hero', 'categoryCircles', 'bestSellers', 'goals', 'brands', 'benefits', 'newsletter']
    : ['hero', 'featured', 'newsletter'];

  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { id: uid(), name: opts.name, client: opts.client, vertical: wellness ? 'Bienestar y suplementos' : 'Genérico', createdAt: now, updatedAt: now, themeName: null, proposalRef: '' },
    brand: {
      storeName: opts.client || opts.name,
      identity: wellness ? 'multi' : 'mono',
      primary: wellness ? '#1f6f5c' : '#1f2937',
      secondary: wellness ? '#f3efe6' : '#f3f4f6',
      accent: wellness ? '#e9822e' : '#2563eb',
      headingFont: 'Manrope',
      bodyFont: 'Inter',
      radius: 'soft',
      currency: 'COP',
      locale: 'es-CO',
    },
    pages,
    header: { elements: ['search', 'account', 'cart', 'promoBar'], menuType: wellness ? 'mega' : 'simple', logoPosition: 'left', sticky: true, promoText: 'Envío gratis desde $150.000 · Datos de ejemplo' },
    footer: { columns: 'columns', showNewsletter: true, showSocial: true, showPayments: true, legalText: `© ${new Date().getFullYear()} ${opts.client || opts.name}. Todos los derechos reservados.` },
    references: [],
    home: { sections: sectionTypes.map((t) => makeSection(t)) },
    catalog: {
      organization: wellness ? 'mixed' : 'category',
      categories: wellness ? DEMO_CATEGORIES.slice(0, 6) : DEMO_CATEGORIES.slice(0, 4),
      attributes: wellness ? ['brand', 'ingredient', 'goal', 'format', 'presentation', 'price', 'availability'] : ['price', 'availability'],
      customAttributes: [],
      perRowDesktop: 4,
      perRowMobile: 2,
      cardFields: ['price', 'compareAt', 'discount', 'brand', 'badges', 'addToCart'],
      cardStyle: 'bordered',
      filterLayout: 'sidebar',
      mobileFilter: 'drawer',
      filters: wellness ? ['brand', 'goal', 'ingredient', 'format', 'price', 'availability'] : ['price', 'availability'],
      sorts: ['featured', 'bestSelling', 'priceAsc', 'priceDesc', 'newest'],
      pagination: 'pages',
      bannerOnCollection: true,
    },
    product: {
      layout: 'split',
      gallery: 'thumbnails',
      thumbsPosition: 'horizontal',
      zoom: true,
      beforeBuy: ['brand', 'rating', 'shortDescription', 'stock', 'badges', 'shippingInfo'],
      variantStyle: 'buttons',
      pricePosition: 'underTitle',
      showStock: true,
      infoDisplay: 'accordion',
      infoBlocks: wellness ? ['description', 'benefits', 'usage', 'nutrition', 'ingredients', 'warnings'] : ['description', 'shipping'],
      nutritionFormat: wellness ? 'table' : 'none',
      certifications: [],
      reviews: 'none',
      related: 'carousel',
      stickyBuy: true,
      quantitySelector: true,
    },
    cart: {
      type: 'drawer',
      recommendations: true,
      freeShippingBar: true,
      freeShippingThreshold: 150000,
      discountCodes: false,
      orderNotes: false,
      preCheckoutInfo: ['shippingEstimate', 'taxesNote'],
      paymentMethods: [],
      shippingRules: [],
      shippingNotes: '',
    },
    subscriptions: { enabled: false, scope: 'selected', productIds: [], frequencies: ['30 días', '60 días'], discountPct: 10, incentives: ['discount'], customerActions: ['pause', 'skip', 'changeFrequency', 'cancel'] },
    bundles: { enabled: false, display: ['kitsPage'], kits: [] },
    leads: { forms: ['newsletter', 'contact'], placements: ['home', 'footer'], popupTrigger: 'none', incentive: '', automations: [] },
    sap: { productSource: '', enrichmentOwner: '', priceSource: '', inventorySource: '', inventoryFrequency: '', customerSync: '', orderSync: '', orderStatuses: [], bundleHandling: '', renewalHandling: '', errorHandling: [], integratorName: '', owners: '', notes: '' },
    decisions: {},
    answered: {},
  };
}
