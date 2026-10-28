import type { DemoProduct } from '@/types/project';

/**
 * CATÁLOGO DE DEMOSTRACIÓN.
 * Marcas, productos, precios e inventario son ficticios y existen solo para probar
 * navegación, filtros y carrito. No representan el catálogo real del cliente ni
 * contienen afirmaciones de salud: cualquier beneficio debe ser aprobado por el cliente.
 */

export const DEMO_BRANDS = ['Nativa Labs', 'Verdal', 'Solaris Nutrition', 'Equilibra', 'Bosque Puro', 'Kinetik'];

export const DEMO_GOALS = ['Energía', 'Defensas', 'Descanso', 'Piel, cabello y uñas', 'Deporte', 'Digestión', 'Articulaciones', 'Bienestar general'];

export const DEMO_CATEGORIES = ['Vitaminas', 'Minerales', 'Proteínas', 'Omegas', 'Colágeno', 'Probióticos', 'Herbales'];

let n = 0;
const p = (d: Omit<DemoProduct, 'id' | 'createdRank'>): DemoProduct => ({ ...d, id: `demo-${++n}`, createdRank: n });

export const DEMO_PRODUCTS: DemoProduct[] = [
  p({ name: 'Vitamina C 1000 mg', brand: 'Nativa Labs', category: 'Vitaminas', ingredients: ['Vitamina C'], goals: ['Defensas'], format: 'Tabletas', presentations: [{ id: '60', label: '60 tabletas', price: 42900, compareAt: 49900, stock: 34 }, { id: '120', label: '120 tabletas', price: 74900, stock: 12 }], rating: 4.7, reviews: 128, badges: ['Más vendido'], bestSellerRank: 1, hue: 32, shape: 'bottle' }),
  p({ name: 'Vitamina D3 + K2', brand: 'Solaris Nutrition', category: 'Vitaminas', ingredients: ['Vitamina D', 'Vitamina K'], goals: ['Bienestar general', 'Articulaciones'], format: 'Cápsulas blandas', presentations: [{ id: '60', label: '60 cápsulas', price: 58900, stock: 20 }, { id: '90', label: '90 cápsulas', price: 79900, compareAt: 89900, stock: 6 }], rating: 4.8, reviews: 96, badges: ['Nuevo'], bestSellerRank: 4, hue: 45, shape: 'bottle' }),
  p({ name: 'Magnesio Bisglicinato', brand: 'Equilibra', category: 'Minerales', ingredients: ['Magnesio'], goals: ['Descanso', 'Deporte'], format: 'Cápsulas', presentations: [{ id: '90', label: '90 cápsulas', price: 64900, stock: 18 }, { id: '180', label: '180 cápsulas', price: 112900, stock: 4 }], rating: 4.9, reviews: 210, badges: ['Más vendido'], bestSellerRank: 2, hue: 200, shape: 'bottle' }),
  p({ name: 'Colágeno Hidrolizado', brand: 'Verdal', category: 'Colágeno', ingredients: ['Colágeno', 'Vitamina C'], goals: ['Piel, cabello y uñas', 'Articulaciones'], format: 'Polvo', presentations: [{ id: '300', label: '300 g', price: 89900, compareAt: 104900, stock: 25 }, { id: '600', label: '600 g', price: 159900, stock: 9 }], rating: 4.6, reviews: 174, badges: ['-15%'], bestSellerRank: 3, hue: 340, shape: 'jar' }),
  p({ name: 'Omega 3 Ultra', brand: 'Bosque Puro', category: 'Omegas', ingredients: ['Omega 3'], goals: ['Bienestar general'], format: 'Cápsulas blandas', presentations: [{ id: '60', label: '60 cápsulas', price: 69900, stock: 0 }, { id: '120', label: '120 cápsulas', price: 119900, stock: 14 }], rating: 4.5, reviews: 88, badges: [], bestSellerRank: 7, hue: 190, shape: 'bottle' }),
  p({ name: 'Proteína Whey Vainilla', brand: 'Kinetik', category: 'Proteínas', ingredients: ['Proteína de suero'], goals: ['Deporte'], format: 'Polvo', presentations: [{ id: '1lb', label: '1 lb', price: 119900, stock: 11 }, { id: '2lb', label: '2 lb', price: 214900, compareAt: 239900, stock: 7 }], rating: 4.4, reviews: 64, badges: [], bestSellerRank: 6, hue: 260, shape: 'pouch' }),
  p({ name: 'Probiótico 10 cepas', brand: 'Nativa Labs', category: 'Probióticos', ingredients: ['Probióticos'], goals: ['Digestión'], format: 'Cápsulas', presentations: [{ id: '30', label: '30 cápsulas', price: 79900, stock: 16 }], rating: 4.6, reviews: 51, badges: ['Nuevo'], bestSellerRank: 9, hue: 150, shape: 'bottle' }),
  p({ name: 'Zinc + Vitamina C', brand: 'Equilibra', category: 'Minerales', ingredients: ['Zinc', 'Vitamina C'], goals: ['Defensas'], format: 'Gomitas', presentations: [{ id: '60', label: '60 gomitas', price: 45900, stock: 40 }], rating: 4.3, reviews: 39, badges: [], bestSellerRank: 11, hue: 20, shape: 'jar' }),
  p({ name: 'Ashwagandha', brand: 'Bosque Puro', category: 'Herbales', ingredients: ['Ashwagandha'], goals: ['Descanso', 'Bienestar general'], format: 'Cápsulas', presentations: [{ id: '60', label: '60 cápsulas', price: 54900, stock: 22 }], rating: 4.7, reviews: 77, badges: [], bestSellerRank: 8, hue: 95, shape: 'bottle' }),
  p({ name: 'Complejo B Activo', brand: 'Solaris Nutrition', category: 'Vitaminas', ingredients: ['Vitamina B'], goals: ['Energía'], format: 'Cápsulas', presentations: [{ id: '60', label: '60 cápsulas', price: 49900, stock: 30 }], rating: 4.5, reviews: 58, badges: [], bestSellerRank: 10, hue: 55, shape: 'bottle' }),
  p({ name: 'Creatina Monohidratada', brand: 'Kinetik', category: 'Proteínas', ingredients: ['Creatina'], goals: ['Deporte', 'Energía'], format: 'Polvo', presentations: [{ id: '300', label: '300 g', price: 89900, stock: 15 }, { id: '500', label: '500 g', price: 129900, stock: 3 }], rating: 4.8, reviews: 142, badges: ['Más vendido'], bestSellerRank: 5, hue: 230, shape: 'jar' }),
  p({ name: 'Biotina + Colágeno', brand: 'Verdal', category: 'Colágeno', ingredients: ['Biotina', 'Colágeno'], goals: ['Piel, cabello y uñas'], format: 'Gomitas', presentations: [{ id: '60', label: '60 gomitas', price: 59900, compareAt: 69900, stock: 19 }], rating: 4.4, reviews: 45, badges: ['-14%'], bestSellerRank: 12, hue: 320, shape: 'jar' }),
  p({ name: 'Multivitamínico Diario', brand: 'Nativa Labs', category: 'Vitaminas', ingredients: ['Vitamina C', 'Vitamina D', 'Vitamina B', 'Zinc'], goals: ['Bienestar general', 'Energía'], format: 'Tabletas', presentations: [{ id: '30', label: '30 tabletas', price: 39900, stock: 50 }, { id: '90', label: '90 tabletas', price: 99900, stock: 8 }], rating: 4.6, reviews: 201, badges: [], bestSellerRank: 13, hue: 10, shape: 'bottle' }),
  p({ name: 'Cúrcuma + Pimienta', brand: 'Bosque Puro', category: 'Herbales', ingredients: ['Cúrcuma'], goals: ['Articulaciones'], format: 'Cápsulas', presentations: [{ id: '60', label: '60 cápsulas', price: 52900, stock: 0 }], rating: 4.2, reviews: 33, badges: [], bestSellerRank: 15, hue: 40, shape: 'bottle' }),
  p({ name: 'Melatonina 3 mg', brand: 'Equilibra', category: 'Herbales', ingredients: ['Melatonina'], goals: ['Descanso'], format: 'Gomitas', presentations: [{ id: '60', label: '60 gomitas', price: 38900, stock: 27 }], rating: 4.5, reviews: 92, badges: [], bestSellerRank: 14, hue: 275, shape: 'jar' }),
  p({ name: 'Proteína Vegetal Cacao', brand: 'Verdal', category: 'Proteínas', ingredients: ['Proteína vegetal'], goals: ['Deporte', 'Bienestar general'], format: 'Polvo', presentations: [{ id: '500', label: '500 g', price: 109900, stock: 10 }], rating: 4.3, reviews: 28, badges: ['Nuevo'], bestSellerRank: 17, hue: 25, shape: 'pouch' }),
  p({ name: 'Hierro + Ácido Fólico', brand: 'Solaris Nutrition', category: 'Minerales', ingredients: ['Hierro', 'Vitamina B'], goals: ['Energía'], format: 'Tabletas', presentations: [{ id: '60', label: '60 tabletas', price: 36900, stock: 21 }], rating: 4.4, reviews: 19, badges: [], bestSellerRank: 18, hue: 0, shape: 'box' }),
  p({ name: 'Electrolitos Limón', brand: 'Kinetik', category: 'Minerales', ingredients: ['Magnesio', 'Potasio'], goals: ['Deporte'], format: 'Sobres', presentations: [{ id: '15', label: '15 sobres', price: 44900, stock: 35 }, { id: '30', label: '30 sobres', price: 79900, stock: 13 }], rating: 4.6, reviews: 57, badges: [], bestSellerRank: 16, hue: 70, shape: 'box' }),
];

export const getProduct = (id: string) => DEMO_PRODUCTS.find((x) => x.id === id);

export const minPrice = (pr: DemoProduct) => Math.min(...pr.presentations.map((v) => v.price));

export const totalStock = (pr: DemoProduct) => pr.presentations.reduce((s, v) => s + v.stock, 0);

/** Valor determinístico de un atributo personalizado para un producto de demostración. */
export const customAttrValue = (productId: string, values: string[]): string | undefined => {
  if (!values.length) return undefined;
  const num = Number(productId.replace(/\D/g, '')) || 0;
  return values[num % values.length];
};

export const DEMO_TESTIMONIALS = [
  { name: 'Cliente de ejemplo A', role: 'Compra verificada · demo', text: 'Testimonio de demostración. Reemplazar por reseñas reales aprobadas por el cliente.' },
  { name: 'Cliente de ejemplo B', role: 'Compra verificada · demo', text: 'El envío llegó en el tiempo indicado y el proceso de compra fue claro. (Texto de ejemplo)' },
  { name: 'Cliente de ejemplo C', role: 'Suscriptora · demo', text: 'Me gusta recibir mis productos cada mes sin tener que recordarlo. (Texto de ejemplo)' },
];

export const DEMO_ARTICLES = [
  { title: 'Cómo leer la etiqueta de un suplemento', tag: 'Guías', minutes: 5 },
  { title: 'Diferencias entre cápsulas, tabletas y polvos', tag: 'Formatos', minutes: 4 },
  { title: 'Rutinas de bienestar: preguntas frecuentes', tag: 'Bienestar', minutes: 6 },
];

export const DEMO_FAQ = [
  { q: '¿Cuánto tarda el envío?', a: 'Respuesta de ejemplo. Los tiempos reales dependen de las reglas de envío que defina el cliente.' },
  { q: '¿Puedo cambiar o cancelar mi suscripción?', a: 'Respuesta de ejemplo. Depende de la aplicación de suscripciones seleccionada.' },
  { q: '¿Qué medios de pago aceptan?', a: 'Respuesta de ejemplo. Se definirá según la pasarela de pagos confirmada.' },
  { q: '¿Los productos tienen registro sanitario?', a: 'Contenido pendiente del cliente. Debe validarse con el área regulatoria.' },
];

export const DEMO_DISCOUNT_CODES: Record<string, number> = { DEMO10: 10, BIENVENIDA15: 15 };
