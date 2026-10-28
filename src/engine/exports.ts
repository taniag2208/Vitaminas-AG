import { TECH_CLASS_LABEL } from '@/config/annotations';
import { getSectionDef } from '@/config/sections';
import { SCOPE_LABEL, STATUS_LABEL } from '@/engine/answers';
import { filterLabel, SORT_LABEL } from '@/engine/catalog';
import { buildSitemap, decisionRows, requirements, risks, type SitemapNode } from '@/engine/pmo';
import { slugify } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project';

const DISCLAIMER = '> Generado por Tita Discovery Studio. Los productos, precios y contenidos del simulador son datos de demostración. Toda compatibilidad marcada como "dependiente del tema" debe validarse con el tema seleccionado.';

const header = (c: ProjectConfig, title: string) => `# ${title} — ${c.meta.name}\n\nCliente: **${c.meta.client}** · Tema Shopify: **${c.meta.themeName ?? 'no definido (compatibilidad pendiente)'}** · Actualizado: ${new Date(c.meta.updatedAt).toLocaleString('es-CO')}\n\n${DISCLAIMER}\n`;

const csvCell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
const toCsv = (rows: string[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n');

/* ───────────── JSON ───────────── */
export const exportJson = (c: ProjectConfig) => JSON.stringify({ exportedAt: new Date().toISOString(), generator: 'tita-discovery-studio', config: c }, null, 2);

/* ───────────── Mapa del sitio ───────────── */
const sitemapLines = (nodes: SitemapNode[], depth = 0): string[] =>
  nodes.flatMap((n) => [
    `${'  '.repeat(depth)}- **${n.title}** \`/${n.route}\`${n.inMenu ? ' · menú' : ''}${n.inFooter ? ' · footer' : ''}${n.note ? ` — _${n.note}_` : ''}`,
    ...(n.children ? sitemapLines(n.children, depth + 1) : []),
  ]);

export const exportSitemap = (c: ProjectConfig) => `${header(c, 'Mapa del sitio')}\n${sitemapLines(buildSitemap(c)).join('\n')}\n\n## Menú principal\n${c.pages.filter((p) => p.inMenu).map((p) => `- ${p.title}`).join('\n') || '- (vacío)'}\n\n## Menú footer\n${c.pages.filter((p) => p.inFooter).map((p) => `- ${p.title}`).join('\n') || '- (vacío)'}\n`;

/* ───────────── Decisiones pendientes ───────────── */
export const exportPendingCsv = (c: ProjectConfig) =>
  toCsv([
    ['ID', 'Fase', 'Pregunta', 'Respuesta actual', 'Estado', 'Responsable', 'Alcance', 'Notas'],
    ...decisionRows(c)
      .filter((r) => r.status !== 'approved')
      .map((r) => [r.id, r.phase, r.question, r.answer, STATUS_LABEL[r.status], r.owner, SCOPE_LABEL[r.scope], r.notes]),
  ]);

export const exportDecisionsCsv = (c: ProjectConfig) =>
  toCsv([
    ['ID', 'Fase', 'Pregunta', 'Respuesta', 'Estado', 'Responsable', 'Alcance', 'Notas'],
    ...decisionRows(c).map((r) => [r.id, r.phase, r.question, r.answer, STATUS_LABEL[r.status], r.owner, SCOPE_LABEL[r.scope], r.notes]),
  ]);

export const exportPendingMd = (c: ProjectConfig) => {
  const rows = decisionRows(c).filter((r) => r.status !== 'approved');
  const flagged = requirements(c).filter((r) => r.scope !== 'proposal');
  return `${header(c, 'Decisiones pendientes')}
## Decisiones sin aprobar (${rows.length})
| Fase | Pregunta | Respuesta actual | Estado | Responsable |
|---|---|---|---|---|
${rows.map((r) => `| ${r.phase} | ${r.question} | ${r.answer.replace(/\|/g, '/')} | ${STATUS_LABEL[r.status]} | ${r.owner} |`).join('\n')}

## Funcionalidades que requieren revisión de alcance o viabilidad (${flagged.length})
${flagged.map((r) => `- **${r.id} ${r.name}** — ${SCOPE_LABEL[r.scope]}`).join('\n') || '- Ninguna'}
`;
};

/* ───────────── Criterios de aceptación ───────────── */
export const exportAcceptance = (c: ProjectConfig) =>
  `${header(c, 'Criterios de aceptación')}\n${requirements(c)
    .map((r) => `## ${r.id} · ${r.name}\n_${r.area} · ${SCOPE_LABEL[r.scope]}_\n\n${r.acceptance.map((a) => `- [ ] ${a}`).join('\n')}\n`)
    .join('\n')}`;

/* ───────────── Resumen funcional ───────────── */
export const exportFunctionalSummary = (c: ProjectConfig) => {
  const reqs = requirements(c);
  const rk = risks(c);
  return `${header(c, 'Resumen funcional')}
## Identidad
- Marca: **${c.brand.storeName}** (${c.brand.identity === 'multi' ? 'multimarca' : 'monomarca'})
- Colores: primario ${c.brand.primary}, secundario ${c.brand.secondary}, acento ${c.brand.accent}
- Tipografías: ${c.brand.headingFont} / ${c.brand.bodyFont}
- Menú: ${c.header.menuType}; encabezado ${c.header.sticky ? 'fijo' : 'estático'}; elementos: ${c.header.elements.join(', ')}

## Home (orden)
${c.home.sections.map((s, i) => `${i + 1}. ${getSectionDef(s.type).label} (${s.variant})${s.props.title ? ` — "${s.props.title}"` : ''}`).join('\n')}

## Catálogo
- Organización: ${c.catalog.organization}; categorías: ${c.catalog.categories.join(', ')}
- Filtros (${c.catalog.filterLayout}, móvil ${c.catalog.mobileFilter}): ${c.catalog.filters.map((f) => filterLabel(f, c.catalog)).join(', ')}
- Ordenamiento: ${c.catalog.sorts.map((s) => SORT_LABEL[s]).join(', ')}
- Tarjeta: ${c.catalog.cardFields.join(', ')}; ${c.catalog.perRowDesktop} por fila (móvil ${c.catalog.perRowMobile})

## Ficha de producto
- Layout ${c.product.layout}, galería ${c.product.gallery}, info en ${c.product.infoDisplay}, variantes ${c.product.variantStyle}
- Bloques: ${c.product.infoBlocks.join(', ')}; reseñas: ${c.product.reviews}; relacionados: ${c.product.related}

## Carrito y compra
- ${c.cart.type === 'drawer' ? 'Carrito lateral' : 'Página de carrito'}; envío gratis desde ${c.cart.freeShippingBar ? c.cart.freeShippingThreshold : 'N/A'}
- Pagos esperados: ${c.cart.paymentMethods.join(', ') || 'por definir'}; envíos: ${c.cart.shippingRules.join(', ') || 'por definir'}

## Crecimiento
- Suscripciones: ${c.subscriptions.enabled ? `Sí (${c.subscriptions.frequencies.join(', ')}, ${c.subscriptions.discountPct}%)` : 'No'}
- Kits: ${c.bundles.enabled ? c.bundles.kits.map((k) => k.name).join(', ') || 'Sí (sin definir)' : 'No'}
- Formularios: ${c.leads.forms.join(', ') || '—'}; automatizaciones: ${c.leads.automations.join(', ') || '—'}

## Integración SAP
${Object.entries({ 'Origen de producto': c.sap.productSource, 'Enriquecimiento': c.sap.enrichmentOwner, Precios: c.sap.priceSource, Inventario: c.sap.inventorySource, 'Frecuencia inventario': c.sap.inventoryFrequency, Clientes: c.sap.customerSync, Pedidos: c.sap.orderSync, 'Estados de pedido': c.sap.orderStatuses.join(', '), Kits: c.sap.bundleHandling, Renovaciones: c.sap.renewalHandling, Errores: c.sap.errorHandling.join(', '), Integrador: c.sap.integratorName, Responsables: c.sap.owners }).map(([k, v]) => `- ${k}: ${v || '_por definir_'}`).join('\n')}

## Requerimientos funcionales (${reqs.length})
| ID | Requerimiento | Área | Clasificación técnica | Alcance |
|---|---|---|---|---|
${reqs.map((r) => `| ${r.id} | ${r.name} | ${r.area} | ${r.classes.map((x) => TECH_CLASS_LABEL[x]).join(', ')}${r.themePending ? ' (tema pendiente)' : ''} | ${SCOPE_LABEL[r.scope]} |`).join('\n')}

## Riesgos (${rk.length})
${rk.map((x) => `- **${x.id} [${x.level}] ${x.area}:** ${x.text} → _${x.mitigation}_`).join('\n')}
`;
};

/* ───────────── Especificación para Claude Code ───────────── */
function metafields(c: ProjectConfig) {
  const m: { ns: string; type: string; owner: string; purpose: string }[] = [];
  const a = c.catalog.attributes;
  if (a.includes('ingredient')) m.push({ ns: 'custom.ingredientes', type: 'list.single_line_text_field', owner: 'product', purpose: 'Filtro por ingrediente' });
  if (a.includes('goal')) m.push({ ns: 'custom.objetivos', type: 'list.single_line_text_field', owner: 'product', purpose: 'Filtro y colecciones por objetivo' });
  if (a.includes('format')) m.push({ ns: 'custom.formato', type: 'single_line_text_field', owner: 'product', purpose: 'Filtro por formato' });
  c.catalog.customAttributes.forEach((x) => m.push({ ns: `custom.${slugify(x.label).replace(/-/g, '_')}`, type: 'list.single_line_text_field', owner: 'product', purpose: `Atributo "${x.label}" (${x.values.join(', ')})` }));
  const ib = c.product.infoBlocks;
  if (ib.includes('benefits')) m.push({ ns: 'custom.beneficios', type: 'rich_text_field', owner: 'product', purpose: 'Beneficios aprobados por el cliente' });
  if (ib.includes('usage')) m.push({ ns: 'custom.modo_de_uso', type: 'rich_text_field', owner: 'product', purpose: 'Modo de uso' });
  if (ib.includes('ingredients')) m.push({ ns: 'custom.ingredientes_detalle', type: 'multi_line_text_field', owner: 'product', purpose: 'Ingredientes completos' });
  if (ib.includes('warnings')) m.push({ ns: 'custom.advertencias', type: 'multi_line_text_field', owner: 'product', purpose: 'Advertencias' });
  if (ib.includes('nutrition') && c.product.nutritionFormat === 'table') m.push({ ns: 'custom.tabla_nutricional', type: 'json (o metaobject)', owner: 'product', purpose: 'Tabla nutricional estructurada' });
  if (ib.includes('nutrition') && c.product.nutritionFormat === 'image') m.push({ ns: 'custom.tabla_nutricional_img', type: 'file_reference', owner: 'product', purpose: 'Imagen de tabla nutricional' });
  if (c.product.certifications.length) m.push({ ns: 'custom.certificaciones', type: 'list.metaobject_reference (Certificación)', owner: 'product', purpose: c.product.certifications.join(', ') });
  return m;
}

export const exportClaudeSpec = (c: ProjectConfig) => {
  const reqs = requirements(c);
  const apps = [...new Set(reqs.filter((r) => r.classes.includes('app')).flatMap((r) => r.dependencies.filter((d) => /app/i.test(d))))];
  return `${header(c, 'Especificación de implementación Shopify (para Claude Code)')}
## Contexto
Implementar la tienda Shopify B2C **${c.brand.storeName}** a partir de las decisiones del Discovery. La integración con SAP la desarrolla un integrador externo: **no implementar lógica de integración SAP**; solo respetar los campos y flujos indicados.

## Reglas
1. No inventar compatibilidades del tema. Todo ítem marcado "dependiente del tema" debe verificarse en el tema ${c.meta.themeName ?? '(aún no definido)'} antes de construirse; si no existe, crear una sección personalizada OS 2.0 con schema configurable.
2. Los textos de beneficios, nutrición y certificaciones se cargan desde metafields con contenido aprobado; no escribir afirmaciones de salud.
3. Los ítems con alcance distinto a "Contemplada en la propuesta" requieren confirmación antes de implementarse.

## Tokens de marca
\`\`\`json
${JSON.stringify({ colors: { primary: c.brand.primary, secondary: c.brand.secondary, accent: c.brand.accent }, typography: { heading: c.brand.headingFont, body: c.brand.bodyFont }, radius: c.brand.radius }, null, 2)}
\`\`\`

## Navegación
- Menú principal (${c.header.menuType}): ${c.pages.filter((p) => p.inMenu).map((p) => p.title).join(', ')}
- Footer: ${c.pages.filter((p) => p.inFooter).map((p) => p.title).join(', ')}
- Colecciones: ${c.catalog.categories.join(', ')}

## templates/index.json — secciones en orden
${c.home.sections.map((s, i) => `${i + 1}. \`${s.type}\` (variante ${s.variant}) — ${JSON.stringify({ title: s.props.title, subtitle: s.props.subtitle, cta: s.props.cta, columns: s.props.columns, items: s.props.itemsCount })}`).join('\n')}

## Metafields de producto
| Namespace.key | Tipo | Uso |
|---|---|---|
${metafields(c).map((m) => `| \`${m.ns}\` | ${m.type} | ${m.purpose} |`).join('\n') || '| — | — | — |'}

## Search & Discovery — filtros
${c.catalog.filters.map((f) => `- ${filterLabel(f, c.catalog)}`).join('\n')}

## Apps a evaluar
${apps.map((a) => `- ${a}`).join('\n') || '- Ninguna'}

## Requerimientos
${reqs.map((r) => `### ${r.id} · ${r.name}
- Área: ${r.area} · Alcance: ${SCOPE_LABEL[r.scope]}
- Clasificación: ${r.classes.map((x) => TECH_CLASS_LABEL[x]).join(', ')}${r.themePending ? ' · **compatibilidad de tema pendiente**' : ''}
- Funcionalidad: ${r.functionality}
- Implementación sugerida: ${r.implementation}
- Dependencias: ${r.dependencies.join('; ') || '—'}
- Riesgos: ${r.risks.join('; ') || '—'}
- Criterios de aceptación:
${r.acceptance.map((a) => `  - [ ] ${a}`).join('\n')}
`).join('\n')}
## Configuración completa
Ver exportación JSON del proyecto (\`config\`) como fuente de verdad.
`;
};
