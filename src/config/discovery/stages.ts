import type { StageId } from '@/types/discovery';

export interface StageDef {
  id: StageId;
  index: number;
  title: string;
  short: string;
  /** Qué busca entender la etapa, en lenguaje del cliente */
  goal: string;
  /** Página del simulador que se abre al entrar */
  preview: string;
  owner: string;
}

export const STAGES: StageDef[] = [
  { id: 'context', index: 1, title: 'Contexto del negocio y objetivos', short: 'Negocio', goal: 'Entender qué vendes, a quién y qué esperas lograr con la tienda.', preview: 'home', owner: 'Cliente · Gerencia' },
  { id: 'brand', index: 2, title: 'Marca e identidad visual', short: 'Marca', goal: 'Definir cómo se ve y cómo habla tu tienda.', preview: 'home', owner: 'Cliente · Marca' },
  { id: 'home', index: 3, title: 'Home y navegación', short: 'Home', goal: 'Decidir qué ve primero un visitante y cómo encuentra lo que busca.', preview: 'home', owner: 'Cliente · Mercadeo' },
  { id: 'catalog', index: 4, title: 'Catálogo y búsqueda', short: 'Catálogo', goal: 'Organizar los productos para que se encuentren rápido.', preview: 'catalog', owner: 'Cliente · Ecommerce' },
  { id: 'product', index: 5, title: 'Página de detalle de producto', short: 'Producto', goal: 'Dar la información que el cliente necesita para decidirse a comprar.', preview: 'product', owner: 'Cliente · Ecommerce' },
  { id: 'cart', index: 6, title: 'Carrito y checkout', short: 'Compra', goal: 'Hacer que pagar sea fácil y sin sorpresas.', preview: 'cart', owner: 'Cliente · Ecommerce/Finanzas' },
  { id: 'customers', index: 7, title: 'Clientes y fidelización', short: 'Clientes', goal: 'Lograr que los clientes vuelvan a comprar.', preview: 'account', owner: 'Cliente · Mercadeo/CRM' },
  { id: 'marketing', index: 8, title: 'Marketing y conversión', short: 'Marketing', goal: 'Captar visitantes y convertirlos en compradores.', preview: 'home', owner: 'Cliente · Mercadeo' },
  { id: 'operations', index: 9, title: 'Operación e integraciones', short: 'Operación', goal: 'Asegurar que productos, inventario y pedidos fluyan entre Shopify y SAP.', preview: 'tracking', owner: 'Integrador SAP + Cliente · TI' },
  { id: 'closing', index: 10, title: 'Validación, prioridades y cierre', short: 'Cierre', goal: 'Confirmar qué entra al lanzamiento y qué queda para después.', preview: 'home', owner: 'Cliente · Sponsor + Tita Media' },
];

export const stageOf = (id: StageId) => STAGES.find((s) => s.id === id)!;
