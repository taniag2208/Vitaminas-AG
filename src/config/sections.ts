import type { ScopeStatus, SectionProps, SectionType } from '@/types/project';

export interface SectionDef {
  type: SectionType;
  label: string;
  description: string;
  variants: { id: string; label: string }[];
  defaults: Partial<SectionProps>;
  /** Controles que el constructor muestra para esta sección */
  editable: ('title' | 'subtitle' | 'cta' | 'columns' | 'itemsCount' | 'image' | 'align' | 'tone' | 'slides')[];
  columnsRange?: [number, number];
  scope: ScopeStatus;
  /** Clave de anotación técnica (ver annotations.ts) */
  annotation: string;
  /** Solo puede existir una instancia */
  single?: boolean;
}

export const SECTION_LIBRARY: SectionDef[] = [
  {
    type: 'announcement', label: 'Barra promocional', description: 'Mensaje corto sobre envíos, promociones o novedades.',
    variants: [{ id: 'static', label: 'Estática' }, { id: 'rotating', label: 'Rotativa' }],
    defaults: { title: 'Envío gratis en compras superiores a $150.000 · Datos de ejemplo', tone: 'brand' },
    editable: ['title', 'tone'], scope: 'proposal', annotation: 'announcement', single: true,
  },
  {
    type: 'hero', label: 'Hero banner', description: 'Banner principal con mensaje, imagen y llamado a la acción.',
    variants: [{ id: 'split', label: 'Texto + imagen' }, { id: 'full', label: 'Imagen completa' }, { id: 'centered', label: 'Centrado' }],
    defaults: { title: 'Tu bienestar, todos los días', subtitle: 'Vitaminas y suplementos de marcas seleccionadas, con envío a todo el país.', cta: 'Comprar ahora', ctaTarget: 'catalog', align: 'left', tone: 'muted' },
    editable: ['title', 'subtitle', 'cta', 'image', 'align', 'tone'], scope: 'proposal', annotation: 'hero',
  },
  {
    type: 'slideshow', label: 'Slideshow', description: 'Carrusel de varios banners rotativos.',
    variants: [{ id: 'full', label: 'Ancho completo' }, { id: 'contained', label: 'Contenido' }],
    defaults: {
      title: 'Slideshow', tone: 'dark',
      slides: [
        { id: 's1', eyebrow: 'Nuevo', title: 'Rutinas que se adaptan a ti', text: 'Encuentra productos por objetivo de bienestar.', cta: 'Explorar objetivos' },
        { id: 's2', eyebrow: 'Suscríbete', title: 'Recibe tus favoritos cada mes', text: 'Beneficio de suscripción sujeto a validación.', cta: 'Ver suscripciones' },
        { id: 's3', eyebrow: 'Kits', title: 'Combina y ahorra', text: 'Kits armados por nuestro equipo. Datos de ejemplo.', cta: 'Ver kits' },
      ],
    },
    editable: ['slides', 'tone'], scope: 'proposal', annotation: 'slideshow',
  },
  {
    type: 'categoryCards', label: 'Categorías en tarjetas', description: 'Tarjetas con imagen para cada categoría principal.',
    variants: [{ id: 'image', label: 'Imagen + nombre' }, { id: 'overlay', label: 'Texto sobre imagen' }],
    defaults: { title: 'Compra por categoría', subtitle: '', columns: 4, itemsCount: 4 },
    editable: ['title', 'subtitle', 'columns', 'itemsCount'], columnsRange: [2, 6], scope: 'proposal', annotation: 'collectionList',
  },
  {
    type: 'categoryCircles', label: 'Categorías circulares', description: 'Íconos o imágenes circulares, muy usados en móvil.',
    variants: [{ id: 'circles', label: 'Círculos' }, { id: 'pills', label: 'Píldoras' }],
    defaults: { title: 'Explora', columns: 6, itemsCount: 6 },
    editable: ['title', 'columns', 'itemsCount'], columnsRange: [4, 8], scope: 'proposal', annotation: 'collectionList',
  },
  {
    type: 'goals', label: 'Compra por objetivo', description: 'Accesos por objetivo de bienestar (requiere metafields).',
    variants: [{ id: 'tiles', label: 'Mosaicos' }, { id: 'chips', label: 'Chips' }],
    defaults: { title: '¿Qué estás buscando?', subtitle: 'Objetivos de ejemplo para clasificar el catálogo.', columns: 4, itemsCount: 8 },
    editable: ['title', 'subtitle', 'columns', 'itemsCount'], columnsRange: [2, 4], scope: 'tbd', annotation: 'goals',
  },
  {
    type: 'featured', label: 'Productos destacados', description: 'Selección manual de productos de una colección.',
    variants: [{ id: 'grid', label: 'Cuadrícula' }, { id: 'carousel', label: 'Carrusel' }],
    defaults: { title: 'Destacados', subtitle: '', columns: 4, itemsCount: 4, cta: 'Ver todo', ctaTarget: 'catalog' },
    editable: ['title', 'subtitle', 'cta', 'columns', 'itemsCount'], columnsRange: [2, 5], scope: 'proposal', annotation: 'featuredCollection',
  },
  {
    type: 'bestSellers', label: 'Más vendidos', description: 'Colección ordenada por ventas.',
    variants: [{ id: 'grid', label: 'Cuadrícula' }, { id: 'carousel', label: 'Carrusel' }],
    defaults: { title: 'Los más vendidos', columns: 4, itemsCount: 4, cta: 'Ver más vendidos', ctaTarget: 'catalog' },
    editable: ['title', 'cta', 'columns', 'itemsCount'], columnsRange: [2, 5], scope: 'proposal', annotation: 'bestSellers',
  },
  {
    type: 'newArrivals', label: 'Novedades', description: 'Productos más recientes.',
    variants: [{ id: 'grid', label: 'Cuadrícula' }, { id: 'carousel', label: 'Carrusel' }],
    defaults: { title: 'Novedades', columns: 4, itemsCount: 4, cta: 'Ver novedades', ctaTarget: 'catalog' },
    editable: ['title', 'cta', 'columns', 'itemsCount'], columnsRange: [2, 5], scope: 'proposal', annotation: 'featuredCollection',
  },
  {
    type: 'brands', label: 'Carrusel de marcas', description: 'Logos de las marcas disponibles.',
    variants: [{ id: 'logos', label: 'Logos' }, { id: 'cards', label: 'Tarjetas' }],
    defaults: { title: 'Nuestras marcas', columns: 6, itemsCount: 6 },
    editable: ['title', 'columns', 'itemsCount'], columnsRange: [3, 6], scope: 'proposal', annotation: 'brands',
  },
  {
    type: 'benefits', label: 'Beneficios de la marca', description: 'Propuesta de valor: envío, asesoría, pagos, etc.',
    variants: [{ id: 'icons', label: 'Íconos' }, { id: 'cards', label: 'Tarjetas' }],
    defaults: { title: '', columns: 4, itemsCount: 4, tone: 'muted' },
    editable: ['title', 'columns', 'tone'], columnsRange: [2, 4], scope: 'proposal', annotation: 'benefits',
  },
  {
    type: 'imageText', label: 'Bloque imagen + texto', description: 'Historia de marca, asesoría o cualquier contenido editorial.',
    variants: [{ id: 'imageLeft', label: 'Imagen izquierda' }, { id: 'imageRight', label: 'Imagen derecha' }],
    defaults: { title: 'Asesoría para elegir tu suplemento', subtitle: 'Texto de ejemplo. El contenido final debe ser entregado y aprobado por el cliente.', cta: 'Conocer más', ctaTarget: 'about' },
    editable: ['title', 'subtitle', 'cta', 'image'], scope: 'proposal', annotation: 'imageText',
  },
  {
    type: 'testimonials', label: 'Testimonios', description: 'Opiniones de clientes (reales y aprobadas).',
    variants: [{ id: 'cards', label: 'Tarjetas' }, { id: 'quote', label: 'Cita destacada' }],
    defaults: { title: 'Lo que dicen nuestros clientes', columns: 3, itemsCount: 3, tone: 'muted' },
    editable: ['title', 'columns', 'tone'], columnsRange: [1, 3], scope: 'tbd', annotation: 'testimonials',
  },
  {
    type: 'bundles', label: 'Kits destacados', description: 'Bundles o kits de productos.',
    variants: [{ id: 'cards', label: 'Tarjetas' }],
    defaults: { title: 'Kits para tu rutina', subtitle: 'Ejemplo de kits. Composición y precio por definir.', columns: 3 },
    editable: ['title', 'subtitle', 'columns'], columnsRange: [2, 3], scope: 'validation', annotation: 'bundles',
  },
  {
    type: 'blog', label: 'Blog', description: 'Últimos artículos de contenido educativo.',
    variants: [{ id: 'cards', label: 'Tarjetas' }, { id: 'list', label: 'Lista' }],
    defaults: { title: 'Aprende con nosotros', columns: 3, itemsCount: 3, cta: 'Ir al blog', ctaTarget: 'blog' },
    editable: ['title', 'cta', 'columns'], columnsRange: [2, 3], scope: 'proposal', annotation: 'blog',
  },
  {
    type: 'faq', label: 'Preguntas frecuentes', description: 'Acordeón de preguntas y respuestas.',
    variants: [{ id: 'accordion', label: 'Acordeón' }, { id: 'twoCol', label: 'Dos columnas' }],
    defaults: { title: 'Preguntas frecuentes', itemsCount: 4 },
    editable: ['title', 'itemsCount'], scope: 'proposal', annotation: 'faq',
  },
  {
    type: 'newsletter', label: 'Newsletter', description: 'Formulario de suscripción por correo.',
    variants: [{ id: 'inline', label: 'En línea' }, { id: 'card', label: 'Tarjeta con imagen' }],
    defaults: { title: 'Recibe novedades y beneficios', subtitle: 'Suscríbete y entérate primero de lanzamientos y promociones.', cta: 'Suscribirme', tone: 'brand' },
    editable: ['title', 'subtitle', 'cta', 'tone', 'image'], scope: 'proposal', annotation: 'newsletter',
  },
  {
    type: 'promoBanner', label: 'Banner promocional', description: 'Banner de campaña con fecha o descuento.',
    variants: [{ id: 'wide', label: 'Ancho' }, { id: 'double', label: 'Doble' }],
    defaults: { title: 'Temporada de bienestar', subtitle: 'Promoción de ejemplo — condiciones por definir.', cta: 'Ver promociones', ctaTarget: 'catalog', tone: 'dark' },
    editable: ['title', 'subtitle', 'cta', 'image', 'tone'], scope: 'proposal', annotation: 'promoBanner',
  },
  {
    type: 'ctaFinal', label: 'CTA final', description: 'Llamado a la acción al cierre de la página.',
    variants: [{ id: 'band', label: 'Banda' }, { id: 'card', label: 'Tarjeta' }],
    defaults: { title: '¿Necesitas ayuda para elegir?', subtitle: 'Escríbenos y te orientamos.', cta: 'Contactar', ctaTarget: 'contact', tone: 'brand' },
    editable: ['title', 'subtitle', 'cta', 'tone'], scope: 'proposal', annotation: 'ctaFinal',
  },
];

export const getSectionDef = (type: SectionType) => SECTION_LIBRARY.find((s) => s.type === type)!;

const BASE_PROPS: SectionProps = { title: '', subtitle: '', cta: '', columns: 4, itemsCount: 4, align: 'left', tone: 'light' };

export const sectionDefaults = (type: SectionType): SectionProps => {
  const d = getSectionDef(type);
  return { ...BASE_PROPS, ...structuredClone(d.defaults) } as SectionProps;
};
