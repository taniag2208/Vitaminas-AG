import type { Device } from '@/store/useStudio';

/**
 * Qué parte del simulador muestra el efecto de cada pregunta.
 * - page/params: página que se abre
 * - target: valor de `data-focus` (clave de anotación del componente) al que se desplaza y resalta
 * - action: estado que se fuerza para que el cambio sea visible (menú abierto, carrito abierto…)
 * - device: dispositivo necesario para ver el cambio
 */
export type PreviewAction = 'openMenu' | 'openCart' | 'openFilters' | 'showPopup';

export interface PreviewTarget {
  page: string;
  params?: Record<string, string>;
  target?: string;
  action?: PreviewAction;
  device?: Device;
}

const T = (page: string, target?: string, extra: Partial<PreviewTarget> = {}): PreviewTarget => ({ page, target, ...extra });

export const PREVIEW_TARGETS: Record<string, PreviewTarget> = {
  // Fase 1
  'brand.storeName': T('home', 'header'),
  'brand.identity': T('brands', 'brands'),
  'brand.logo': T('home', 'header'),
  'brand.colors': T('home', 'hero'),
  'brand.fonts': T('home', 'hero'),
  'brand.radius': T('catalog', 'productCard'),
  pages: T('home', 'header'),
  menu: T('home', 'header', { action: 'openMenu' }),
  'header.elements': T('home', 'header'),
  'header.promoText': T('home', 'announcement'),
  'header.menuType': T('home', 'header', { action: 'openMenu' }),
  'header.logoPosition': T('home', 'header'),
  'header.sticky': T('home', 'header'),
  footer: T('home', 'footer'),
  'meta.themeName': T('home'),

  // Fase 2
  'home.sections': T('home'),

  // Fase 3
  'catalog.organization': T('home', 'header', { action: 'openMenu' }),
  'catalog.categories': T('home', 'header', { action: 'openMenu' }),
  'catalog.attributes': T('catalog', 'filters'),
  'catalog.customAttributes': T('catalog', 'filters'),
  'catalog.perRow': T('catalog', 'productCard', { device: 'desktop' }),
  'catalog.perRowMobile': T('catalog', 'productCard', { device: 'mobile' }),
  'catalog.cardFields': T('catalog', 'productCard'),
  'catalog.cardStyle': T('catalog', 'productCard'),
  'catalog.filterLayout': T('catalog', 'filters', { device: 'desktop', action: 'openFilters' }),
  'catalog.mobileFilter': T('catalog', 'filters', { device: 'mobile', action: 'openFilters' }),
  'catalog.filters': T('catalog', 'filters'),
  'catalog.sorts': T('catalog', 'filters'),
  'catalog.pagination': T('catalog', 'collection'),
  'catalog.bannerOnCollection': T('catalog'),

  // Fase 4
  'product.layout': T('product', 'pdpGallery'),
  'product.gallery': T('product', 'pdpGallery'),
  'product.thumbsPosition': T('product', 'pdpGallery'),
  'product.zoom': T('product', 'pdpGallery'),
  'product.beforeBuy': T('product', 'buyBox'),
  'product.variantStyle': T('product', 'variants'),
  'product.pricePosition': T('product', 'buyBox'),
  'product.showStock': T('product', 'variants'),
  'product.infoDisplay': T('product', 'pdpInfo'),
  'product.infoBlocks': T('product', 'pdpInfo'),
  'product.nutritionFormat': T('product', 'pdpInfo'),
  'product.certifications': T('product', 'certifications'),
  'product.reviews': T('product', 'reviews'),
  'product.related': T('product', 'related'),
  'product.stickyBuy': T('product', 'buyBox'),
  'product.quantitySelector': T('product', 'buyBox'),
  'product.subscription': T('product', 'subscriptions'),

  // Fase 5
  'cart.type': T('cart', 'cart', { action: 'openCart' }),
  'cart.recommendations': T('cart', 'cart', { action: 'openCart' }),
  'cart.freeShippingBar': T('cart', 'cart', { action: 'openCart' }),
  'cart.freeShippingThreshold': T('cart', 'cart', { action: 'openCart' }),
  'cart.discountCodes': T('cart', 'cart', { action: 'openCart' }),
  'cart.orderNotes': T('cart', 'cart', { action: 'openCart' }),
  'cart.preCheckoutInfo': T('cart', 'cart', { action: 'openCart' }),
  'cart.paymentMethods': T('checkout', 'checkout', { action: 'openCart' }),
  'cart.shippingRules': T('cart', 'cart', { action: 'openCart' }),
  'cart.shippingNotes': T('product', 'pdpInfo'),

  // Fase 6
  'subscriptions.enabled': T('product', 'subscriptions'),
  'subscriptions.scope': T('product', 'subscriptions'),
  'subscriptions.productIds': T('product', 'subscriptions'),
  'subscriptions.frequencies': T('product', 'subscriptions'),
  'subscriptions.discountPct': T('product', 'subscriptions'),
  'subscriptions.incentives': T('product', 'subscriptions'),
  'subscriptions.customerActions': T('account', 'subscriptions'),
  'bundles.enabled': T('kits', 'bundles'),
  'bundles.display': T('product', 'bundles'),
  'bundles.kits': T('kits', 'bundles'),
  'leads.forms': T('home', 'leads', { action: 'showPopup' }),
  'leads.placements': T('home', 'footer'),
  'leads.popupTrigger': T('home', 'leads', { action: 'showPopup' }),
  'leads.incentive': T('home', 'leads', { action: 'showPopup' }),

  // Fase 7
  'sap.orderStatuses': T('tracking', 'tracking'),
  'sap.orderSync': T('tracking', 'tracking'),
};
