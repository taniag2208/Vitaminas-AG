import { DEMO_PRODUCTS } from '@/data/demoCatalog';
import type { ProjectConfig, ScopeStatus } from '@/types/project';

export type PhaseId = 'identity' | 'home' | 'catalog' | 'product' | 'cart' | 'growth' | 'sap';

export interface PhaseDef {
  id: PhaseId;
  index: number;
  title: string;
  short: string;
  description: string;
  /** Página del simulador que se abre al entrar a la fase */
  preview: string;
  defaultOwner: string;
}

export const PHASES: PhaseDef[] = [
  { id: 'identity', index: 1, title: 'Identidad y arquitectura', short: 'Identidad', description: 'Marca, páginas, navegación, encabezado y footer.', preview: 'home', defaultOwner: 'Cliente · Marca/Mercadeo' },
  { id: 'home', index: 2, title: 'Constructor del Home', short: 'Home', description: 'Secciones, orden, banners y llamados a la acción.', preview: 'home', defaultOwner: 'Cliente · Mercadeo' },
  { id: 'catalog', index: 3, title: 'Colecciones y catálogo', short: 'Catálogo', description: 'Organización, atributos, tarjetas, filtros y orden.', preview: 'catalog', defaultOwner: 'Cliente · Ecommerce' },
  { id: 'product', index: 4, title: 'Ficha de producto', short: 'Producto', description: 'Galería, información, variantes, compra y contenidos.', preview: 'product', defaultOwner: 'Cliente · Ecommerce' },
  { id: 'cart', index: 5, title: 'Carrito y compra', short: 'Carrito', description: 'Carrito, envío, descuentos y medios de pago.', preview: 'cart', defaultOwner: 'Cliente · Ecommerce/Finanzas' },
  { id: 'growth', index: 6, title: 'Suscripciones, kits y captación', short: 'Crecimiento', description: 'Recurrencia, bundles, formularios y automatizaciones.', preview: 'product', defaultOwner: 'Cliente · Mercadeo' },
  { id: 'sap', index: 7, title: 'Operación e integración SAP', short: 'SAP', description: 'Origen de datos, sincronizaciones, estados y errores.', preview: 'tracking', defaultOwner: 'Integrador SAP + Cliente · TI' },
];

export interface QOption {
  value: string;
  label: string;
  description?: string;
  scope?: ScopeStatus;
  /** Esquema visual (ver components/discovery/Schematic.tsx) */
  visual?: string;
}

export type QuestionKind =
  | 'single'
  | 'visual'
  | 'multi'
  | 'flags'
  | 'toggle'
  | 'text'
  | 'textarea'
  | 'number'
  | 'colors'
  | 'fonts'
  | 'logo'
  | 'pages'
  | 'menu'
  | 'references'
  | 'homeSections'
  | 'tags'
  | 'customAttributes'
  | 'products'
  | 'kits'
  | 'theme';

export interface Question {
  id: string;
  phase: PhaseId;
  title: string;
  help: string;
  kind: QuestionKind;
  /** Ruta dentro de ProjectConfig que esta pregunta lee/escribe */
  path?: string;
  options?: QOption[];
  /** Pregunta condicional: solo se muestra si devuelve true */
  condition?: (c: ProjectConfig) => boolean;
  /** Clasificación de alcance de la pregunta completa (si no depende de opciones) */
  scope?: ScopeStatus;
  /** Clave de anotación técnica vinculada */
  annotation?: string;
  /** Página del simulador más relevante para ver el efecto */
  preview?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const yes = (c: ProjectConfig) => c.subscriptions.enabled;

export const QUESTIONS: Question[] = [
  // ───────────── Fase 1 ─────────────
  { id: 'brand.storeName', phase: 'identity', title: '¿Cuál será la marca principal del ecommerce?', help: 'Nombre visible en el encabezado, título del sitio y correos.', kind: 'text', path: 'brand.storeName', placeholder: 'Ej. AG Vitaminas' },
  { id: 'brand.identity', phase: 'identity', title: '¿Identidad monomarca o multimarca?', help: 'Define si el sitio vende una marca propia o un portafolio de marcas. Activa o no la navegación por marcas.', kind: 'visual', path: 'brand.identity', annotation: 'brands', options: [
    { value: 'mono', label: 'Monomarca', description: 'Una sola marca protagonista.', visual: 'mono' },
    { value: 'multi', label: 'Multimarca', description: 'Portafolio con página y filtro de marcas.', visual: 'multi' },
  ] },
  { id: 'brand.logo', phase: 'identity', title: 'Logo', help: 'Carga el logo (PNG/SVG). Si no hay, se usa el nombre de la marca como logotipo.', kind: 'logo', path: 'brand.logoImage' },
  { id: 'brand.colors', phase: 'identity', title: '¿Qué colores se utilizarán?', help: 'Color primario (botones, enlaces), secundario (fondos suaves) y de acento (promociones).', kind: 'colors' },
  { id: 'brand.fonts', phase: 'identity', title: '¿Qué tipografías se utilizarán?', help: 'Tipografía de títulos y de textos. Verifica licencia de uso web.', kind: 'fonts' },
  { id: 'brand.radius', phase: 'identity', title: 'Estilo de bordes', help: 'Afecta botones, tarjetas e imágenes.', kind: 'visual', path: 'brand.radius', options: [
    { value: 'none', label: 'Rectos', visual: 'radius-none' }, { value: 'soft', label: 'Suaves', visual: 'radius-soft' }, { value: 'round', label: 'Redondeados', visual: 'radius-round' },
  ] },
  { id: 'pages', phase: 'identity', title: '¿Qué páginas tendrá el sitio?', help: 'Al seleccionar una página aparece en el mapa del sitio y puede abrirse en el simulador.', kind: 'pages', annotation: 'page' },
  { id: 'menu', phase: 'identity', title: '¿Qué páginas aparecen en el menú principal y en el footer?', help: 'Marca dónde aparece cada página.', kind: 'menu', annotation: 'header' },
  { id: 'header.elements', phase: 'identity', title: '¿Qué elementos tendrá el encabezado?', help: 'Elementos visibles junto al menú.', kind: 'multi', path: 'header.elements', annotation: 'header', options: [
    { value: 'promoBar', label: 'Barra promocional' }, { value: 'search', label: 'Buscador' }, { value: 'account', label: 'Cuenta de cliente' }, { value: 'cart', label: 'Carrito' },
    { value: 'wishlist', label: 'Lista de deseos', scope: 'additional', description: 'Requiere app.' }, { value: 'utilityBar', label: 'Barra superior de contacto' },
  ] },
  { id: 'header.promoText', phase: 'identity', title: 'Texto de la barra promocional', help: 'Mensaje corto global.', kind: 'text', path: 'header.promoText', condition: (c) => c.header.elements.includes('promoBar') },
  { id: 'header.menuType', phase: 'identity', title: '¿Qué tipo de menú prefieren?', help: 'Cómo se despliega la navegación del catálogo.', kind: 'visual', path: 'header.menuType', annotation: 'megamenu', options: [
    { value: 'simple', label: 'Simple', description: 'Enlaces directos.', visual: 'menu-simple' },
    { value: 'dropdown', label: 'Desplegable', description: 'Lista de categorías.', visual: 'menu-dropdown' },
    { value: 'mega', label: 'Megamenú', description: 'Columnas + bloque promocional.', visual: 'menu-mega', scope: 'validation' },
  ] },
  { id: 'header.logoPosition', phase: 'identity', title: 'Posición del logo', help: '', kind: 'visual', path: 'header.logoPosition', options: [
    { value: 'left', label: 'Izquierda', visual: 'logo-left' }, { value: 'center', label: 'Centrado', visual: 'logo-center' },
  ] },
  { id: 'header.sticky', phase: 'identity', title: '¿Encabezado fijo al hacer scroll?', help: 'Mantiene visible el menú y el carrito.', kind: 'toggle', path: 'header.sticky' },
  { id: 'footer', phase: 'identity', title: '¿Qué debe incluir el footer?', help: 'Los enlaces del footer se definen en la pregunta de menú.', kind: 'flags', annotation: 'footer', options: [
    { value: 'footer.showNewsletter', label: 'Formulario de newsletter' }, { value: 'footer.showSocial', label: 'Redes sociales' }, { value: 'footer.showPayments', label: 'Íconos de medios de pago' },
  ] },
  { id: 'references', phase: 'identity', title: '¿Qué referencias visuales quieren utilizar?', help: 'Sitios o imágenes de referencia con lo que les gusta de cada uno.', kind: 'references' },
  { id: 'meta.themeName', phase: 'identity', title: 'Tema Shopify', help: 'Mientras no se defina, toda compatibilidad "dependiente del tema" queda pendiente de validación.', kind: 'theme', path: 'meta.themeName', scope: 'tbd' },

  // ───────────── Fase 2 ─────────────
  { id: 'home.sections', phase: 'home', title: '¿Qué secciones quieren en el Home y en qué orden?', help: 'Agrega, elimina, arrastra para reordenar y edita cada sección. El simulador se actualiza al instante.', kind: 'homeSections', preview: 'home' },

  // ───────────── Fase 3 ─────────────
  { id: 'catalog.organization', phase: 'catalog', title: '¿Cómo desean organizar el catálogo?', help: 'Criterio principal de navegación y de estructura de colecciones.', kind: 'single', path: 'catalog.organization', annotation: 'collection', options: [
    { value: 'category', label: 'Por categoría de producto' }, { value: 'goal', label: 'Por objetivo de bienestar', scope: 'validation' }, { value: 'brand', label: 'Por marca' }, { value: 'mixed', label: 'Mixto (categoría + objetivo + marca)' },
  ] },
  { id: 'catalog.categories', phase: 'catalog', title: '¿Qué categorías principales necesitan?', help: 'Se convierten en colecciones y en el menú. Escribe y presiona Enter.', kind: 'tags', path: 'catalog.categories', annotation: 'collectionList' },
  { id: 'catalog.attributes', phase: 'catalog', title: '¿Qué atributos clasificarán los productos?', help: 'Cada atributo se convierte en un metafield o campo de Shopify y debe tener origen de datos (SAP o carga manual).', kind: 'multi', path: 'catalog.attributes', annotation: 'filters', options: [
    { value: 'brand', label: 'Marca' }, { value: 'ingredient', label: 'Ingrediente', scope: 'validation' }, { value: 'goal', label: 'Objetivo de bienestar', scope: 'validation' }, { value: 'format', label: 'Formato' }, { value: 'presentation', label: 'Presentación' }, { value: 'price', label: 'Precio' }, { value: 'availability', label: 'Disponibilidad' },
  ] },
  { id: 'catalog.customAttributes', phase: 'catalog', title: 'Otros atributos configurables', help: 'Ej. "Dieta" con valores Vegano, Sin gluten. Se asignan valores de ejemplo a los productos demo para probar el filtro.', kind: 'customAttributes', scope: 'tbd' },
  { id: 'catalog.perRow', phase: 'catalog', title: '¿Cuántos productos por fila?', help: 'Desktop y móvil.', kind: 'visual', path: 'catalog.perRowDesktop', annotation: 'collection', options: [
    { value: '2', label: '2 por fila', visual: 'cols-2' }, { value: '3', label: '3 por fila', visual: 'cols-3' }, { value: '4', label: '4 por fila', visual: 'cols-4' }, { value: '5', label: '5 por fila', visual: 'cols-5' },
  ] },
  { id: 'catalog.perRowMobile', phase: 'catalog', title: 'Productos por fila en móvil', help: '', kind: 'visual', path: 'catalog.perRowMobile', options: [
    { value: '1', label: '1 por fila', visual: 'mcols-1' }, { value: '2', label: '2 por fila', visual: 'mcols-2' },
  ] },
  { id: 'catalog.cardFields', phase: 'catalog', title: '¿Qué información debe mostrar cada tarjeta?', help: 'Imagen y nombre siempre se muestran.', kind: 'multi', path: 'catalog.cardFields', annotation: 'productCard', options: [
    { value: 'price', label: 'Precio' }, { value: 'compareAt', label: 'Precio anterior' }, { value: 'discount', label: 'Descuento (%)' }, { value: 'rating', label: 'Valoración', scope: 'validation', description: 'Requiere app de reseñas.' }, { value: 'brand', label: 'Marca' }, { value: 'format', label: 'Formato' }, { value: 'badges', label: 'Etiquetas promocionales' }, { value: 'addToCart', label: 'Botón agregar al carrito' }, { value: 'quickView', label: 'Vista rápida', scope: 'validation' },
  ] },
  { id: 'catalog.cardStyle', phase: 'catalog', title: 'Estilo de tarjeta', help: '', kind: 'visual', path: 'catalog.cardStyle', options: [
    { value: 'minimal', label: 'Minimal', visual: 'card-minimal' }, { value: 'bordered', label: 'Con borde', visual: 'card-bordered' }, { value: 'elevated', label: 'Elevada', visual: 'card-elevated' },
  ] },
  { id: 'catalog.filterLayout', phase: 'catalog', title: '¿Cómo prefieren visualizar los filtros?', help: 'Presentación en desktop.', kind: 'visual', path: 'catalog.filterLayout', annotation: 'filters', options: [
    { value: 'sidebar', label: 'Barra lateral', visual: 'filters-sidebar' }, { value: 'horizontal', label: 'Horizontales', visual: 'filters-horizontal' }, { value: 'dropdown', label: 'Panel desplegable', visual: 'filters-dropdown' },
  ] },
  { id: 'catalog.mobileFilter', phase: 'catalog', title: 'Filtros en móvil', help: '', kind: 'visual', path: 'catalog.mobileFilter', options: [
    { value: 'drawer', label: 'Drawer lateral', visual: 'mfilter-drawer' }, { value: 'accordion', label: 'Acordeón sobre el listado', visual: 'mfilter-accordion' },
  ] },
  { id: 'catalog.filters', phase: 'catalog', title: '¿Qué filtros deben estar disponibles?', help: 'Solo pueden activarse filtros de atributos definidos.', kind: 'multi', path: 'catalog.filters', annotation: 'filters' },
  { id: 'catalog.sorts', phase: 'catalog', title: '¿Qué opciones de ordenamiento necesitan?', help: '', kind: 'multi', path: 'catalog.sorts', annotation: 'filters', options: [
    { value: 'featured', label: 'Destacados' }, { value: 'bestSelling', label: 'Más vendidos' }, { value: 'priceAsc', label: 'Precio: menor a mayor' }, { value: 'priceDesc', label: 'Precio: mayor a menor' }, { value: 'newest', label: 'Más recientes' }, { value: 'alpha', label: 'Alfabético' }, { value: 'rating', label: 'Mejor valorados', scope: 'validation', description: 'Depende de app de reseñas.' },
  ] },
  { id: 'catalog.pagination', phase: 'catalog', title: 'Paginación', help: '', kind: 'single', path: 'catalog.pagination', annotation: 'collection', options: [
    { value: 'pages', label: 'Páginas numeradas' }, { value: 'loadMore', label: 'Botón "Cargar más"', scope: 'validation' }, { value: 'infinite', label: 'Scroll infinito', scope: 'validation' },
  ] },
  { id: 'catalog.bannerOnCollection', phase: 'catalog', title: '¿Banner de colección en la cabecera?', help: 'Imagen y descripción de cada colección.', kind: 'toggle', path: 'catalog.bannerOnCollection' },

  // ───────────── Fase 4 ─────────────
  { id: 'product.layout', phase: 'product', title: '¿Cómo distribuir galería e información?', help: '', kind: 'visual', path: 'product.layout', annotation: 'pdpGallery', preview: 'product', options: [
    { value: 'split', label: 'Galería izquierda + info derecha', visual: 'pdp-split' }, { value: 'wideGallery', label: 'Galería ampliada', visual: 'pdp-wide' }, { value: 'stacked', label: 'Apilada (galería arriba)', visual: 'pdp-stacked' },
  ] },
  { id: 'product.gallery', phase: 'product', title: '¿Qué tipo de galería prefieren?', help: '', kind: 'visual', path: 'product.gallery', annotation: 'pdpGallery', options: [
    { value: 'thumbnails', label: 'Imagen + miniaturas', visual: 'gallery-thumbs' }, { value: 'grid', label: 'Cuadrícula', visual: 'gallery-grid' }, { value: 'slider', label: 'Slider con puntos', visual: 'gallery-slider' },
  ] },
  { id: 'product.thumbsPosition', phase: 'product', title: 'Posición de miniaturas', help: '', kind: 'visual', path: 'product.thumbsPosition', condition: (c) => c.product.gallery === 'thumbnails', options: [
    { value: 'horizontal', label: 'Horizontales', visual: 'thumbs-h' }, { value: 'vertical', label: 'Verticales', visual: 'thumbs-v' },
  ] },
  { id: 'product.zoom', phase: 'product', title: '¿Zoom en imágenes?', help: '', kind: 'toggle', path: 'product.zoom' },
  { id: 'product.beforeBuy', phase: 'product', title: '¿Qué información aparece antes del botón de compra?', help: 'Orden de aparición fijo; activa solo lo necesario.', kind: 'multi', path: 'product.beforeBuy', annotation: 'buyBox', options: [
    { value: 'brand', label: 'Marca' }, { value: 'rating', label: 'Valoración', scope: 'validation' }, { value: 'shortDescription', label: 'Descripción corta' }, { value: 'badges', label: 'Etiquetas' }, { value: 'stock', label: 'Disponibilidad' }, { value: 'shippingInfo', label: 'Información de envío' }, { value: 'certifications', label: 'Certificaciones', scope: 'validation' },
  ] },
  { id: 'product.variantStyle', phase: 'product', title: '¿Cómo presentar las variantes (presentaciones)?', help: '', kind: 'visual', path: 'product.variantStyle', annotation: 'variants', options: [
    { value: 'buttons', label: 'Botones', visual: 'variant-buttons' }, { value: 'select', label: 'Selector desplegable', visual: 'variant-select' }, { value: 'swatches', label: 'Tarjetas con precio', visual: 'variant-cards', scope: 'validation' },
  ] },
  { id: 'product.pricePosition', phase: 'product', title: '¿Dónde se muestra el precio?', help: '', kind: 'single', path: 'product.pricePosition', annotation: 'buyBox', options: [
    { value: 'underTitle', label: 'Debajo del título' }, { value: 'nearButton', label: 'Junto al botón de compra' },
  ] },
  { id: 'product.showStock', phase: 'product', title: '¿Mostrar disponibilidad?', help: 'Depende de que SAP sincronice inventario con la frecuencia adecuada.', kind: 'toggle', path: 'product.showStock', annotation: 'variants' },
  { id: 'product.infoDisplay', phase: 'product', title: '¿Cómo presentar beneficios, uso e información?', help: '', kind: 'visual', path: 'product.infoDisplay', annotation: 'pdpInfo', options: [
    { value: 'tabs', label: 'Pestañas', visual: 'info-tabs', scope: 'validation' }, { value: 'accordion', label: 'Acordeones', visual: 'info-accordion' }, { value: 'continuous', label: 'Secciones continuas', visual: 'info-continuous' },
  ] },
  { id: 'product.infoBlocks', phase: 'product', title: '¿Qué bloques de información necesita cada producto?', help: 'Cada bloque es un metafield con responsable de contenido. No se publican afirmaciones de beneficios sin aprobación.', kind: 'multi', path: 'product.infoBlocks', annotation: 'pdpInfo', options: [
    { value: 'description', label: 'Descripción' }, { value: 'benefits', label: 'Beneficios (aprobados)' }, { value: 'usage', label: 'Modo de uso' }, { value: 'nutrition', label: 'Información nutricional' }, { value: 'ingredients', label: 'Ingredientes' }, { value: 'warnings', label: 'Advertencias' }, { value: 'shipping', label: 'Envíos y devoluciones' },
  ] },
  { id: 'product.nutritionFormat', phase: 'product', title: '¿Qué formato tendrá la información nutricional?', help: '', kind: 'single', path: 'product.nutritionFormat', annotation: 'nutrition', condition: (c) => c.product.infoBlocks.includes('nutrition'), options: [
    { value: 'table', label: 'Tabla estructurada (texto)', scope: 'validation' }, { value: 'image', label: 'Imagen de la etiqueta' }, { value: 'none', label: 'No mostrar' },
  ] },
  { id: 'product.certifications', phase: 'product', title: '¿Qué certificaciones desean mostrar?', help: 'Solo certificaciones con soporte documental. Escribe y presiona Enter.', kind: 'tags', path: 'product.certifications', annotation: 'certifications', scope: 'validation' },
  { id: 'product.reviews', phase: 'product', title: '¿Quieren incluir reseñas?', help: 'Las reseñas requieren una app.', kind: 'single', path: 'product.reviews', annotation: 'reviews', options: [
    { value: 'none', label: 'No por ahora' }, { value: 'native', label: 'Solo calificación (estrellas)', scope: 'additional' }, { value: 'app', label: 'Reseñas completas', scope: 'additional' },
  ] },
  { id: 'product.related', phase: 'product', title: '¿Mostrar productos relacionados?', help: '', kind: 'visual', path: 'product.related', annotation: 'related', options: [
    { value: 'none', label: 'No', visual: 'none' }, { value: 'grid', label: 'Cuadrícula', visual: 'related-grid' }, { value: 'carousel', label: 'Carrusel', visual: 'related-carousel' },
  ] },
  { id: 'product.stickyBuy', phase: 'product', title: '¿Botón de compra sticky?', help: 'Barra fija con el botón al hacer scroll.', kind: 'toggle', path: 'product.stickyBuy', annotation: 'buyBox', scope: 'validation' },
  { id: 'product.quantitySelector', phase: 'product', title: '¿Selector de cantidad?', help: '', kind: 'toggle', path: 'product.quantitySelector' },
  { id: 'product.subscription', phase: 'product', title: '¿Ofrecer compra única y suscripción?', help: 'Misma decisión que en la fase 6, donde se configura en detalle.', kind: 'toggle', path: 'subscriptions.enabled', annotation: 'subscriptions', scope: 'validation' },

  // ───────────── Fase 5 ─────────────
  { id: 'cart.type', phase: 'cart', title: '¿Carrito lateral o página completa?', help: '', kind: 'visual', path: 'cart.type', annotation: 'cart', preview: 'cart', options: [
    { value: 'drawer', label: 'Carrito lateral', visual: 'cart-drawer' }, { value: 'page', label: 'Página de carrito', visual: 'cart-page' },
  ] },
  { id: 'cart.recommendations', phase: 'cart', title: '¿Recomendaciones dentro del carrito?', help: '', kind: 'toggle', path: 'cart.recommendations', annotation: 'cart', scope: 'validation' },
  { id: 'cart.freeShippingBar', phase: 'cart', title: '¿Barra de progreso para envío gratis?', help: '', kind: 'toggle', path: 'cart.freeShippingBar', annotation: 'cart', scope: 'validation' },
  { id: 'cart.freeShippingThreshold', phase: 'cart', title: 'Monto para envío gratis', help: 'Debe coincidir con la tarifa de envío configurada.', kind: 'number', path: 'cart.freeShippingThreshold', condition: (c) => c.cart.freeShippingBar, min: 0, step: 10000 },
  { id: 'cart.discountCodes', phase: 'cart', title: '¿Campo de código de descuento en el carrito?', help: 'En Shopify el código siempre se puede ingresar en el checkout. Prueba DEMO10 en el simulador.', kind: 'toggle', path: 'cart.discountCodes', annotation: 'cart' },
  { id: 'cart.orderNotes', phase: 'cart', title: '¿Notas del pedido?', help: '', kind: 'toggle', path: 'cart.orderNotes' },
  { id: 'cart.preCheckoutInfo', phase: 'cart', title: '¿Qué información mostrar antes de pagar?', help: '', kind: 'multi', path: 'cart.preCheckoutInfo', annotation: 'cart', options: [
    { value: 'shippingEstimate', label: 'Estimado de envío' }, { value: 'taxesNote', label: 'Nota de impuestos' }, { value: 'deliveryTime', label: 'Tiempo de entrega' }, { value: 'returnPolicy', label: 'Política de devoluciones' }, { value: 'securePayment', label: 'Sellos de pago seguro' },
  ] },
  { id: 'cart.paymentMethods', phase: 'cart', title: '¿Qué métodos de pago se esperan ofrecer?', help: 'La disponibilidad depende de la pasarela y el país: todos requieren validación.', kind: 'multi', path: 'cart.paymentMethods', annotation: 'checkout', options: [
    { value: 'Tarjeta crédito/débito', label: 'Tarjeta crédito/débito', scope: 'validation' }, { value: 'PSE', label: 'PSE', scope: 'validation' }, { value: 'Billeteras digitales', label: 'Billeteras digitales', scope: 'validation' }, { value: 'Pago contra entrega', label: 'Pago contra entrega', scope: 'validation' }, { value: 'Compra ahora, paga después', label: 'Compra ahora, paga después', scope: 'validation' }, { value: 'Transferencia', label: 'Transferencia / consignación', scope: 'validation' },
  ] },
  { id: 'cart.shippingRules', phase: 'cart', title: '¿Qué reglas de envío se necesitan?', help: '', kind: 'multi', path: 'cart.shippingRules', annotation: 'checkout', options: [
    { value: 'Tarifa fija nacional', label: 'Tarifa fija nacional' }, { value: 'Tarifa por zona/ciudad', label: 'Tarifa por zona/ciudad' }, { value: 'Envío gratis desde monto', label: 'Envío gratis desde un monto' }, { value: 'Tarifa calculada por transportadora', label: 'Calculada por transportadora', scope: 'validation' }, { value: 'Recogida en tienda', label: 'Recogida en tienda' }, { value: 'Envío mismo día', label: 'Envío mismo día', scope: 'additional' },
  ] },
  { id: 'cart.shippingNotes', phase: 'cart', title: 'Notas sobre envío y cobertura', help: 'Ciudades, tiempos, transportadoras, restricciones.', kind: 'textarea', path: 'cart.shippingNotes' },

  // ───────────── Fase 6 ─────────────
  { id: 'subscriptions.enabled', phase: 'growth', title: '¿Habrá suscripciones recurrentes?', help: 'Sujeto a validación: app, pasarela compatible y renovaciones hacia SAP.', kind: 'toggle', path: 'subscriptions.enabled', annotation: 'subscriptions', scope: 'validation', preview: 'product' },
  { id: 'subscriptions.scope', phase: 'growth', title: '¿Qué productos estarán disponibles por suscripción?', help: '', kind: 'single', path: 'subscriptions.scope', condition: yes, annotation: 'subscriptions', options: [{ value: 'all', label: 'Todo el catálogo' }, { value: 'selected', label: 'Productos seleccionados' }] },
  { id: 'subscriptions.productIds', phase: 'growth', title: 'Productos suscribibles', help: 'Selección sobre el catálogo de demostración.', kind: 'products', path: 'subscriptions.productIds', condition: (c) => yes(c) && c.subscriptions.scope === 'selected' },
  { id: 'subscriptions.frequencies', phase: 'growth', title: '¿Qué frecuencias se ofrecerán?', help: '', kind: 'multi', path: 'subscriptions.frequencies', condition: yes, annotation: 'subscriptions', options: ['15 días', '30 días', '45 días', '60 días', '90 días'].map((v) => ({ value: v, label: `Cada ${v}` })) },
  { id: 'subscriptions.discountPct', phase: 'growth', title: 'Descuento de suscripción', help: 'Incentivo porcentual sobre el precio.', kind: 'number', path: 'subscriptions.discountPct', condition: yes, min: 0, max: 50, suffix: '%' },
  { id: 'subscriptions.incentives', phase: 'growth', title: '¿Qué incentivos tendrá la suscripción?', help: '', kind: 'multi', path: 'subscriptions.incentives', condition: yes, options: [
    { value: 'discount', label: 'Descuento por suscripción' }, { value: 'freeShipping', label: 'Envío gratis', scope: 'validation' }, { value: 'gift', label: 'Regalo en primer pedido', scope: 'additional' }, { value: 'loyalty', label: 'Beneficios por permanencia', scope: 'additional' },
  ] },
  { id: 'subscriptions.customerActions', phase: 'growth', title: '¿Qué acciones podrá realizar el cliente?', help: 'Dependen de la app seleccionada.', kind: 'multi', path: 'subscriptions.customerActions', condition: yes, options: [
    { value: 'pause', label: 'Pausar' }, { value: 'skip', label: 'Saltar un envío' }, { value: 'changeFrequency', label: 'Cambiar frecuencia' }, { value: 'swap', label: 'Cambiar producto', scope: 'validation' }, { value: 'cancel', label: 'Cancelar' }, { value: 'changePayment', label: 'Actualizar medio de pago', scope: 'validation' },
  ] },
  { id: 'bundles.enabled', phase: 'growth', title: '¿Se venderán kits o bundles?', help: 'Requiere app y definición del tratamiento en SAP.', kind: 'toggle', path: 'bundles.enabled', annotation: 'bundles', scope: 'validation' },
  { id: 'bundles.display', phase: 'growth', title: '¿Cómo se mostrarán los kits?', help: '', kind: 'multi', path: 'bundles.display', condition: (c) => c.bundles.enabled, annotation: 'bundles', options: [
    { value: 'kitsPage', label: 'Página de kits' }, { value: 'pdpBlock', label: 'Bloque "Compra el kit" en ficha' }, { value: 'homeSection', label: 'Sección en el Home' }, { value: 'builder', label: 'Arma tu kit (constructor)', scope: 'additional' },
  ] },
  { id: 'bundles.kits', phase: 'growth', title: '¿Qué productos se venderán en kits?', help: 'Arma kits con productos de demostración.', kind: 'kits', condition: (c) => c.bundles.enabled },
  { id: 'leads.forms', phase: 'growth', title: '¿Qué formularios de captación necesitan?', help: '', kind: 'multi', path: 'leads.forms', annotation: 'leads', options: [
    { value: 'newsletter', label: 'Newsletter' }, { value: 'contact', label: 'Contacto' }, { value: 'popup', label: 'Pop-up de bienvenida', scope: 'validation' }, { value: 'backInStock', label: 'Aviso de reposición', scope: 'additional' }, { value: 'quiz', label: 'Quiz de recomendación', scope: 'additional' },
  ] },
  { id: 'leads.placements', phase: 'growth', title: '¿En qué páginas aparecerán?', help: '', kind: 'multi', path: 'leads.placements', annotation: 'leads', options: [
    { value: 'home', label: 'Inicio' }, { value: 'footer', label: 'Footer (todo el sitio)' }, { value: 'product', label: 'Ficha de producto' }, { value: 'catalog', label: 'Catálogo' }, { value: 'blog', label: 'Blog' },
  ] },
  { id: 'leads.popupTrigger', phase: 'growth', title: '¿Cuándo aparece el pop-up?', help: 'El simulador lo muestra al abrir el Home.', kind: 'single', path: 'leads.popupTrigger', condition: (c) => c.leads.forms.includes('popup'), options: [
    { value: 'delay', label: 'Tras unos segundos' }, { value: 'exitIntent', label: 'Intención de salida' }, { value: 'scroll', label: 'Al hacer scroll' }, { value: 'none', label: 'No mostrar' },
  ] },
  { id: 'leads.incentive', phase: 'growth', title: 'Incentivo de captación', help: 'Ej. 10% en la primera compra. Debe configurarse como descuento.', kind: 'text', path: 'leads.incentive', placeholder: 'Ej. 10% en tu primera compra' },
  { id: 'leads.automations', phase: 'growth', title: '¿Qué automatizaciones de marketing desean?', help: 'Sujeto a alcance confirmado y herramienta seleccionada.', kind: 'multi', path: 'leads.automations', annotation: 'automations', options: [
    { value: 'Bienvenida', label: 'Serie de bienvenida', scope: 'tbd' }, { value: 'Carrito abandonado', label: 'Carrito abandonado', scope: 'tbd' }, { value: 'Recompra / reposición', label: 'Recordatorio de recompra', scope: 'additional' }, { value: 'Post-compra / reseña', label: 'Post-compra y solicitud de reseña', scope: 'additional' }, { value: 'Reactivación', label: 'Reactivación de clientes', scope: 'additional' }, { value: 'Cumpleaños', label: 'Cumpleaños', scope: 'additional' },
  ] },

  // ───────────── Fase 7 ─────────────
  { id: 'sap.integratorName', phase: 'sap', title: 'Integrador SAP y responsables', help: 'Empresa integradora y contactos por parte del cliente.', kind: 'text', path: 'sap.integratorName', placeholder: 'Ej. Integrador externo (por confirmar)' },
  { id: 'sap.productSource', phase: 'sap', title: '¿Cuál es el origen de los datos de producto?', help: '', kind: 'single', path: 'sap.productSource', annotation: 'variants', options: [
    { value: 'SAP crea productos; Shopify enriquece contenido', label: 'SAP crea productos; Shopify enriquece contenido' }, { value: 'SAP crea y actualiza todo el producto', label: 'SAP crea y actualiza todo', scope: 'validation' }, { value: 'Carga manual en Shopify; SAP solo stock/precio', label: 'Carga manual; SAP solo stock y precio' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.enrichmentOwner', phase: 'sap', title: '¿Quién enriquece imágenes, descripciones y metafields?', help: 'SAP no suele gestionar imágenes ni contenido de marketing.', kind: 'text', path: 'sap.enrichmentOwner', placeholder: 'Ej. Equipo ecommerce del cliente' },
  { id: 'sap.priceSource', phase: 'sap', title: '¿Origen de precios?', help: '', kind: 'single', path: 'sap.priceSource', options: [
    { value: 'SAP (lista de precios B2C)', label: 'SAP (lista de precios B2C)' }, { value: 'Shopify (gestión manual)', label: 'Shopify (gestión manual)' }, { value: 'SAP precio base + promociones en Shopify', label: 'SAP base + promociones en Shopify', scope: 'validation' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.inventorySource', phase: 'sap', title: '¿Origen del inventario?', help: '', kind: 'single', path: 'sap.inventorySource', options: [
    { value: 'SAP, una bodega', label: 'SAP — una bodega' }, { value: 'SAP, varias bodegas (ubicaciones Shopify)', label: 'SAP — varias bodegas', scope: 'validation' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.inventoryFrequency', phase: 'sap', title: '¿Frecuencia de sincronización de inventario?', help: 'Frecuencias bajas aumentan el riesgo de sobreventa.', kind: 'single', path: 'sap.inventoryFrequency', options: [
    { value: 'Tiempo real / eventos', label: 'Tiempo real (eventos)', scope: 'validation' }, { value: 'Cada 15 minutos', label: 'Cada 15 minutos' }, { value: 'Cada hora', label: 'Cada hora' }, { value: 'Diaria', label: 'Diaria' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.customerSync', phase: 'sap', title: '¿Cómo se sincronizan los clientes?', help: '', kind: 'single', path: 'sap.customerSync', annotation: 'account', options: [
    { value: 'Shopify → SAP al crear pedido', label: 'Shopify → SAP al crear pedido' }, { value: 'Bidireccional', label: 'Bidireccional', scope: 'validation' }, { value: 'Cliente genérico B2C en SAP', label: 'Cliente genérico B2C en SAP' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.orderSync', phase: 'sap', title: '¿Cómo se sincronizan los pedidos?', help: '', kind: 'single', path: 'sap.orderSync', options: [
    { value: 'Al pagar (pedido pagado)', label: 'Al confirmarse el pago' }, { value: 'Al crear pedido (incluye pendientes)', label: 'Al crear el pedido (incluye pendientes)' }, { value: 'Por lotes', label: 'Por lotes programados' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.orderStatuses', phase: 'sap', title: '¿Qué estados de pedido regresan a Shopify?', help: 'Se muestran en el seguimiento de pedidos del simulador.', kind: 'multi', path: 'sap.orderStatuses', annotation: 'tracking', options: [
    { value: 'Recibido', label: 'Recibido' }, { value: 'En preparación', label: 'En preparación' }, { value: 'Facturado', label: 'Facturado' }, { value: 'Despachado (con guía)', label: 'Despachado (con guía)' }, { value: 'Entregado', label: 'Entregado' }, { value: 'Cancelado', label: 'Cancelado' }, { value: 'Devuelto', label: 'Devuelto' },
  ] },
  { id: 'sap.bundleHandling', phase: 'sap', title: '¿Cómo se tratan los kits en SAP?', help: '', kind: 'single', path: 'sap.bundleHandling', condition: (c) => c.bundles.enabled, annotation: 'bundles', options: [
    { value: 'Kit como código propio en SAP', label: 'Kit como código propio' }, { value: 'Kit desglosado en componentes', label: 'Desglosado en componentes' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.renewalHandling', phase: 'sap', title: '¿Cómo se tratan las renovaciones de suscripción?', help: '', kind: 'single', path: 'sap.renewalHandling', condition: yes, annotation: 'subscriptions', options: [
    { value: 'Cada renovación es un pedido nuevo hacia SAP', label: 'Cada renovación = pedido nuevo en SAP' }, { value: 'Contrato recurrente en SAP', label: 'Contrato recurrente en SAP', scope: 'validation' }, { value: 'Por definir', label: 'Por definir', scope: 'tbd' },
  ] },
  { id: 'sap.errorHandling', phase: 'sap', title: '¿Cómo se manejan los errores de integración?', help: '', kind: 'multi', path: 'sap.errorHandling', options: [
    { value: 'Reintentos automáticos', label: 'Reintentos automáticos' }, { value: 'Alertas por correo', label: 'Alertas por correo' }, { value: 'Log/monitor de integración', label: 'Log o monitor de integración' }, { value: 'Cola de pedidos pendientes', label: 'Cola de pedidos pendientes' }, { value: 'Procedimiento manual documentado', label: 'Procedimiento manual documentado' },
  ] },
  { id: 'sap.owners', phase: 'sap', title: 'Responsables y dependencias', help: 'Quién responde por cada flujo (catálogo, precios, inventario, pedidos).', kind: 'textarea', path: 'sap.owners' },
  { id: 'sap.notes', phase: 'sap', title: 'Notas adicionales de integración', help: '', kind: 'textarea', path: 'sap.notes' },
];

export const questionsForPhase = (phase: PhaseId, c: ProjectConfig) => QUESTIONS.filter((q) => q.phase === phase && (!q.condition || q.condition(c)));

export const visibleQuestions = (c: ProjectConfig) => QUESTIONS.filter((q) => !q.condition || q.condition(c));

export const getQuestion = (id: string) => QUESTIONS.find((q) => q.id === id);

export const demoProductOptions = () => DEMO_PRODUCTS.map((p) => ({ value: p.id, label: p.name }));
