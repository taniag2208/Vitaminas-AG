/**
 * Modelo de datos de Tita Discovery Studio.
 *
 * `ProjectConfig` es la ÚNICA fuente de verdad: el panel Discovery escribe en él,
 * el simulador lo renderiza y el panel PMO deriva de él decisiones, requerimientos,
 * riesgos y exportaciones. Ningún componente mantiene una copia paralela de estas decisiones.
 */

export const SCHEMA_VERSION = 1;

/** Clasificación comercial de una funcionalidad frente a la propuesta. */
export type ScopeStatus =
  | 'proposal' // Contemplada en la propuesta
  | 'tbd' // Pendiente de definición
  | 'additional' // Solicitud adicional
  | 'validation'; // Sujeta a validación técnica

/** Clasificación técnica de implementación en Shopify. */
export type TechClass =
  | 'native' // Nativo Shopify
  | 'theme' // Dependiente del tema seleccionado
  | 'config' // Requiere configuración
  | 'app' // Requiere aplicación externa
  | 'custom' // Requiere desarrollo personalizado
  | 'sap' // Depende de integración SAP
  | 'validation'; // Requiere validación técnica

export type DecisionStatus = 'pending' | 'proposed' | 'approved' | 'rejected';

export interface DecisionMeta {
  status: DecisionStatus;
  owner: string;
  notes: string;
  updatedAt: string;
}

export type PageType =
  | 'home'
  | 'catalog'
  | 'brands'
  | 'about'
  | 'contact'
  | 'blog'
  | 'faq'
  | 'policies'
  | 'tracking'
  | 'account'
  | 'kits'
  | 'custom';

export interface PageDef {
  id: string;
  type: PageType;
  title: string;
  inMenu: boolean;
  inFooter: boolean;
  /** Solo páginas personalizadas: contenido editable */
  body?: string;
}

export type HeaderElement = 'search' | 'account' | 'cart' | 'wishlist' | 'promoBar' | 'utilityBar';

export interface BrandConfig {
  storeName: string;
  identity: 'mono' | 'multi';
  primary: string;
  secondary: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  radius: 'none' | 'soft' | 'round';
  logoImage?: string;
  currency: string;
  locale: string;
}

export interface HeaderConfig {
  elements: HeaderElement[];
  menuType: 'simple' | 'dropdown' | 'mega';
  logoPosition: 'left' | 'center';
  sticky: boolean;
  promoText: string;
}

export interface FooterConfig {
  columns: 'compact' | 'columns';
  showNewsletter: boolean;
  showSocial: boolean;
  showPayments: boolean;
  legalText: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  url?: string;
  image?: string;
  note: string;
}

export type SectionType =
  | 'announcement'
  | 'hero'
  | 'slideshow'
  | 'categoryCards'
  | 'categoryCircles'
  | 'featured'
  | 'bestSellers'
  | 'newArrivals'
  | 'brands'
  | 'benefits'
  | 'imageText'
  | 'testimonials'
  | 'blog'
  | 'faq'
  | 'newsletter'
  | 'promoBanner'
  | 'ctaFinal'
  | 'goals'
  | 'bundles';

export interface SlideContent {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  image?: string;
}

export interface SectionProps {
  title: string;
  subtitle: string;
  cta: string;
  columns: number;
  itemsCount: number;
  image?: string;
  align: 'left' | 'center';
  tone: 'light' | 'muted' | 'brand' | 'dark';
  slides?: SlideContent[];
  /** Objetivo del CTA dentro del simulador */
  ctaTarget?: string;
}

export interface SectionInstance {
  id: string;
  type: SectionType;
  variant: string;
  props: SectionProps;
}

export type CardField =
  | 'price'
  | 'compareAt'
  | 'discount'
  | 'rating'
  | 'brand'
  | 'badges'
  | 'addToCart'
  | 'quickView'
  | 'format';

export type BuiltinAttribute =
  | 'brand'
  | 'ingredient'
  | 'goal'
  | 'format'
  | 'presentation'
  | 'price'
  | 'availability';

export interface CustomAttribute {
  id: string;
  label: string;
  values: string[];
}

export type SortOption = 'featured' | 'bestSelling' | 'priceAsc' | 'priceDesc' | 'newest' | 'rating' | 'alpha';

export interface CatalogConfig {
  organization: 'category' | 'goal' | 'brand' | 'mixed';
  categories: string[];
  attributes: BuiltinAttribute[];
  customAttributes: CustomAttribute[];
  perRowDesktop: 2 | 3 | 4 | 5;
  perRowMobile: 1 | 2;
  cardFields: CardField[];
  cardStyle: 'minimal' | 'bordered' | 'elevated';
  filterLayout: 'sidebar' | 'horizontal' | 'dropdown';
  mobileFilter: 'drawer' | 'accordion';
  /** IDs de filtros visibles: atributos builtin o `custom:<id>` */
  filters: string[];
  sorts: SortOption[];
  pagination: 'pages' | 'loadMore' | 'infinite';
  bannerOnCollection: boolean;
}

export type BeforeBuyBlock =
  | 'brand'
  | 'rating'
  | 'shortDescription'
  | 'presentation'
  | 'stock'
  | 'badges'
  | 'shippingInfo'
  | 'certifications';

export type InfoBlock = 'description' | 'benefits' | 'usage' | 'nutrition' | 'ingredients' | 'warnings' | 'shipping';

export interface ProductConfig {
  layout: 'split' | 'wideGallery' | 'stacked';
  gallery: 'thumbnails' | 'grid' | 'slider';
  thumbsPosition: 'vertical' | 'horizontal';
  zoom: boolean;
  beforeBuy: BeforeBuyBlock[];
  variantStyle: 'buttons' | 'select' | 'swatches';
  pricePosition: 'underTitle' | 'nearButton';
  showStock: boolean;
  infoDisplay: 'tabs' | 'accordion' | 'continuous';
  infoBlocks: InfoBlock[];
  nutritionFormat: 'table' | 'image' | 'none';
  certifications: string[];
  reviews: 'none' | 'native' | 'app';
  related: 'none' | 'grid' | 'carousel';
  stickyBuy: boolean;
  quantitySelector: boolean;
}

export interface CartConfig {
  type: 'drawer' | 'page';
  recommendations: boolean;
  freeShippingBar: boolean;
  freeShippingThreshold: number;
  discountCodes: boolean;
  orderNotes: boolean;
  preCheckoutInfo: string[];
  paymentMethods: string[];
  shippingRules: string[];
  shippingNotes: string;
}

export interface SubscriptionConfig {
  enabled: boolean;
  scope: 'all' | 'selected';
  productIds: string[];
  frequencies: string[];
  discountPct: number;
  incentives: string[];
  customerActions: string[];
}

export interface BundleConfig {
  enabled: boolean;
  display: string[];
  kits: { id: string; name: string; productIds: string[]; discountPct: number }[];
}

export interface LeadsConfig {
  forms: string[];
  placements: string[];
  popupTrigger: 'none' | 'delay' | 'exitIntent' | 'scroll';
  incentive: string;
  automations: string[];
}

export interface SapConfig {
  productSource: string;
  enrichmentOwner: string;
  priceSource: string;
  inventorySource: string;
  inventoryFrequency: string;
  customerSync: string;
  orderSync: string;
  orderStatuses: string[];
  bundleHandling: string;
  renewalHandling: string;
  errorHandling: string[];
  integratorName: string;
  owners: string;
  notes: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  client: string;
  vertical: string;
  createdAt: string;
  updatedAt: string;
  /** Tema Shopify seleccionado. Si es null, la compatibilidad de tema se marca como pendiente. */
  themeName: string | null;
  proposalRef: string;
}

export interface ProjectConfig {
  schemaVersion: number;
  meta: ProjectMeta;
  brand: BrandConfig;
  pages: PageDef[];
  header: HeaderConfig;
  footer: FooterConfig;
  references: ReferenceItem[];
  home: { sections: SectionInstance[] };
  catalog: CatalogConfig;
  product: ProductConfig;
  cart: CartConfig;
  subscriptions: SubscriptionConfig;
  bundles: BundleConfig;
  leads: LeadsConfig;
  sap: SapConfig;
  /** Metadatos de cada decisión, indexados por id de pregunta */
  decisions: Record<string, DecisionMeta>;
  /** Preguntas que el cliente marcó explícitamente como respondidas */
  answered: Record<string, boolean>;
}

/** Producto del catálogo de demostración. */
export interface DemoProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string[];
  goals: string[];
  format: string;
  presentations: { id: string; label: string; price: number; compareAt?: number; stock: number }[];
  rating: number;
  reviews: number;
  badges: string[];
  bestSellerRank: number;
  createdRank: number;
  hue: number;
  shape: 'bottle' | 'jar' | 'pouch' | 'box' | 'tube';
}
