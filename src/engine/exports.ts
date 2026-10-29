import { TECH_CLASS_LABEL } from '@/config/annotations';
import { STAGES } from '@/config/discovery/stages';
import { GROUP_LABEL } from '@/config/discovery/toppings';
import { filterLabel } from '@/engine/catalog';
import { slugify } from '@/lib/utils';
import type { DiscoveryProject } from '@/types/discovery';
import type { ProjectConfig } from '@/types/project';
import { isGiven } from './conditions';
import { analyze } from './derive';
import {
  backlog, dependencies, executiveSummary, pagesAndComponents, pendingDecisions, PRIORITY_LABEL, questionMatrix, requirements, risks, shopifyClassification,
  toppingInventory, validationChecklist, type Requirement,
} from './deliverables';
import { ANSWER_STATUS_LABEL, SCOPE_LABEL, TOPPING_STATUS_LABEL } from './labels';
import type { SitemapNode } from './sitemap';
import { answerText } from './summary';

/** Exportaciones (Markdown, CSV y JSON) generadas desde el estado actual del Discovery. */

const DISCLAIMER = '> Generado por Tita Discovery Studio a partir del Discovery. Productos, precios y contenidos del simulador son datos de demostración. La compatibilidad "dependiente del tema" debe validarse con el tema seleccionado. Lo "solicitado" no equivale a "aprobado".';

const head = (p: DiscoveryProject, title: string) => {
  const c = analyze(p).config;
  return `# ${title} — ${p.meta.name}\n\nCliente: **${p.meta.client}** · Tema Shopify: **${c.meta.themeName ?? 'no definido (compatibilidad pendiente)'}** · Actualizado: ${new Date(p.meta.updatedAt).toLocaleString('es-CO')}\n\n${DISCLAIMER}\n`;
};
const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
const md = (v: string) => String(v).replace(/\|/g, '/').replace(/\n/g, ' ');

/* ───────────── JSON ───────────── */
export const exportProjectJson = (p: DiscoveryProject) => JSON.stringify({ exportedAt: new Date().toISOString(), generator: 'tita-discovery-studio', schemaVersion: 2, project: p }, null, 2);
export const exportConfigJson = (p: DiscoveryProject) => JSON.stringify({ exportedAt: new Date().toISOString(), note: 'Configuración DERIVADA de las respuestas. Para reimportar use la exportación del proyecto.', config: analyze(p).config }, null, 2);

/* ───────────── 1. Resumen ejecutivo ───────────── */
export function exportExecutive(p: DiscoveryProject) {
  const e = executiveSummary(p);
  return `${head(p, 'Resumen ejecutivo')}
## El negocio
${e.business.map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

## Avance del Discovery
- ${e.progress.pct}% resuelto (${e.progress.answered} respondidas · ${e.progress.toValidate} por validar · ${e.progress.na} no aplica · ${e.progress.pending} pendientes)
${e.stages.map(({ stage, stats }) => `- ${stage.index}. ${stage.title}: ${stats.resolved}/${stats.total}`).join('\n')}

## Funcionalidades
- ${e.toppings.approved} aprobadas · ${e.toppings.requested} solicitadas sin aprobar · ${e.toppings.discarded} descartadas · ${e.toppings.recommended} recomendaciones abiertas

## Home definido
${e.home.map((h, i) => `${i + 1}. ${h}`).join('\n') || '_Sin secciones todavía_'}

## Riesgos altos
${e.risks.map((r) => `- **${r.area}:** ${r.text} → _${r.mitigation}_`).join('\n') || '- Ninguno'}

## Notas y próximos pasos
${e.notes.map((n) => `- ${n}`).join('\n') || '- Pendiente'}
`;
}

/* ───────────── 2. Matriz de requerimientos ───────────── */
export const exportRequirementsCsv = (p: DiscoveryProject) => csv([
  ['ID', 'Funcionalidad', 'Grupo', 'Problema de negocio', 'Estado', 'Prioridad', 'Alcance', 'Clasificación técnica', 'Validación técnica', 'Origen', 'Dependencias', 'Criterios de aceptación', 'Notas'],
  ...requirements(p).map((r) => [r.id, r.name, GROUP_LABEL[r.group], r.problem, TOPPING_STATUS_LABEL[r.status], r.priority ? PRIORITY_LABEL[r.priority] : '', SCOPE_LABEL[r.scope], r.classes.map((c) => TECH_CLASS_LABEL[c]).join('; '), r.validation, r.origin, r.dependencies.join('; '), r.acceptance.join('; '), r.notes]),
]);

const reqBlock = (r: Requirement) => `### ${r.id} · ${r.name}
- Estado: **${TOPPING_STATUS_LABEL[r.status]}**${r.priority ? ` · Prioridad: ${PRIORITY_LABEL[r.priority]}` : ''} · Alcance: ${SCOPE_LABEL[r.scope]} · Validación técnica: ${r.validation}
- Problema: ${r.problem}
- Funcionalidad: ${r.functionality}
- Implementación sugerida: ${r.implementation}
- Clasificación: ${r.classes.map((c) => TECH_CLASS_LABEL[c]).join(', ')}${r.themePending ? ' · **compatibilidad de tema pendiente**' : ''}
- Origen: ${r.origin}
- Dependencias: ${r.dependencies.join('; ') || '—'}
- Riesgos: ${r.risks.join('; ') || '—'}
- Criterios de aceptación:
${r.acceptance.map((a) => `  - [ ] ${a}`).join('\n')}
`;

export const exportRequirementsMd = (p: DiscoveryProject) => `${head(p, 'Matriz de requerimientos funcionales')}
| ID | Funcionalidad | Grupo | Estado | Prioridad | Alcance | Clasificación |
|---|---|---|---|---|---|---|
${requirements(p).map((r) => `| ${r.id} | ${md(r.name)} | ${GROUP_LABEL[r.group]} | ${TOPPING_STATUS_LABEL[r.status]} | ${r.priority ? PRIORITY_LABEL[r.priority] : '—'} | ${SCOPE_LABEL[r.scope]} | ${r.classes.map((c) => TECH_CLASS_LABEL[c]).join(', ')} |`).join('\n')}

${requirements(p).map(reqBlock).join('\n')}`;

/* ───────────── 3. Mapa de páginas y componentes ───────────── */
const sitemapLines = (nodes: SitemapNode[], depth = 0): string[] =>
  nodes.flatMap((n) => [`${'  '.repeat(depth)}- **${n.title}** \`/${n.route}\`${n.inMenu ? ' · menú' : ''}${n.inFooter ? ' · footer' : ''}${n.note ? ` — _${n.note}_` : ''}`, ...(n.children ? sitemapLines(n.children, depth + 1) : [])]);

export function exportPages(p: DiscoveryProject) {
  const x = pagesAndComponents(p);
  const label: Record<string, string> = { home: 'Inicio', catalog: 'Catálogo (PLP)', product: 'Ficha de producto (PDP)', cart: 'Carrito' };
  return `${head(p, 'Mapa de páginas y componentes')}
## Mapa del sitio
${sitemapLines(x.sitemap).join('\n')}

## Componentes globales
${x.global.map((g) => `- ${g}`).join('\n')}

${Object.entries(x.components).map(([k, list]) => `## ${label[k]}\n${list.map((c, i) => `${k === 'home' ? `${i + 1}.` : '-'} ${c}`).join('\n') || '- (sin componentes)'}`).join('\n\n')}
`;
}

/* ───────────── 4. Inventario de toppings ───────────── */
export const exportToppingsCsv = (p: DiscoveryProject) => csv([
  ['Topping', 'Grupo', 'Estado', 'Origen', 'Variante', 'Parámetros', 'Problema que resuelve', 'Clasificación', 'Alcance', 'Prioridad', 'Validación técnica', 'Motivo de recomendación', 'Notas'],
  ...toppingInventory(p).map((v) => [v.def.name, GROUP_LABEL[v.def.group], TOPPING_STATUS_LABEL[v.status], v.source === 'answer' ? `Respuesta ${v.activatedBy.join(', ')}` : v.source === 'manual' ? 'Consultor' : 'Recomendación', v.def.variants?.find((x) => x.id === v.variant)?.label ?? '', JSON.stringify(v.params), v.def.problem, v.def.techClass.map((c) => TECH_CLASS_LABEL[c]).join('; '), SCOPE_LABEL[v.def.scope], v.record.priority ? PRIORITY_LABEL[v.record.priority] : '', v.record.validation ?? 'pending', v.reasons.join(' / '), v.record.notes ?? '']),
]);

export const exportToppingsMd = (p: DiscoveryProject) => `${head(p, 'Inventario de toppings')}
| Topping | Grupo | Estado | Origen | Variante |
|---|---|---|---|---|
${toppingInventory(p).map((v) => `| ${md(v.def.name)} | ${GROUP_LABEL[v.def.group]} | ${TOPPING_STATUS_LABEL[v.status]} | ${v.source === 'answer' ? v.activatedBy.join(', ') : v.source === 'manual' ? 'Consultor' : md(v.reasons[0] ?? '')} | ${v.def.variants?.find((x) => x.id === v.variant)?.label ?? '—'} |`).join('\n')}
`;

/* ───────────── 5. Backlog ───────────── */
export const exportBacklogCsv = (p: DiscoveryProject) => csv([['Clave', 'Épica', 'Tipo', 'Título', 'Detalle', 'Prioridad', 'Estado', 'Requerimiento'], ...backlog(p).map((b) => [b.key, b.epic, b.type, b.title, b.detail, b.priority, b.status, b.requirement])]);
export const exportBacklogMd = (p: DiscoveryProject) => {
  const items = backlog(p);
  const epics = [...new Set(items.map((b) => b.epic))];
  return `${head(p, 'Backlog funcional y técnico')}\n${epics.map((e) => `## Épica: ${e}\n${items.filter((b) => b.epic === e).map((b) => `- [ ] **${b.key}** (${b.type} · ${b.priority} · ${b.status}) ${b.title} — _${b.requirement}_`).join('\n')}`).join('\n\n')}\n`;
};

/* ───────────── 6. Dependencias, riesgos y pendientes ───────────── */
export const exportRisksMd = (p: DiscoveryProject) => `${head(p, 'Dependencias, riesgos y decisiones pendientes')}
## Riesgos (${risks(p).length})
| ID | Nivel | Área | Riesgo | Mitigación |
|---|---|---|---|---|
${risks(p).map((r) => `| ${r.id} | ${r.level} | ${r.area} | ${md(r.text)} | ${md(r.mitigation)} |`).join('\n')}

## Dependencias
${dependencies(p).map(([d, ids]) => `- ${d} → ${ids.join(', ')}`).join('\n') || '- Ninguna'}

## Decisiones pendientes (${pendingDecisions(p).length})
| Etapa | Pregunta | Estado | Notas |
|---|---|---|---|
${pendingDecisions(p).map((d) => `| ${d.stage.index}. ${d.stage.short} | ${md(d.q.text)} | ${ANSWER_STATUS_LABEL[d.status]} | ${md(d.notes)} |`).join('\n')}
`;
export const exportPendingCsv = (p: DiscoveryProject) => csv([['ID', 'Etapa', 'Pregunta', 'Estado', 'Notas'], ...pendingDecisions(p).map((d) => [d.q.id, d.stage.title, d.q.text, ANSWER_STATUS_LABEL[d.status], d.notes])]);

/* ───────────── 7. Clasificación Shopify ───────────── */
export const exportShopifyMd = (p: DiscoveryProject) => `${head(p, 'Clasificación preliminar de implementación Shopify')}
${shopifyClassification(p).map((g) => `## ${g.label} (${g.items.length})\n${g.items.map((r) => `- ${r.id} ${r.name} — ${TOPPING_STATUS_LABEL[r.status]}`).join('\n') || '- Ninguno'}`).join('\n\n')}
`;

/* ───────────── 8. Checklist de validación ───────────── */
export const exportChecklistMd = (p: DiscoveryProject) => `${head(p, 'Checklist de validación con el cliente')}
${validationChecklist(p).map((c) => `- [${c.done ? 'x' : ' '}] **${c.text}** — ${c.detail}`).join('\n')}

## Funcionalidades a aprobar
${requirements(p).filter((r) => r.status === 'requested').map((r) => `- [ ] ${r.name} (${SCOPE_LABEL[r.scope]})`).join('\n') || '- Ninguna'}
`;

/* ───────────── Banco de preguntas y respuestas ───────────── */
export const exportAnswersCsv = (p: DiscoveryProject) => csv([
  ['ID', 'Etapa', 'Categoría', 'Pregunta', 'Tipo', 'Aplica', 'Estado', 'Respuesta', 'Regla condicional', 'Toppings vinculados', 'Efecto en el simulador', 'Notas del consultor'],
  ...questionMatrix(p).map((r) => [r.q.id, r.stage, r.q.category, r.q.text, r.q.type, r.applies ? 'Sí' : 'No', r.status ? ANSWER_STATUS_LABEL[r.status] : 'No aplica por condición', r.answer, r.rule, r.toppings.join('; '), r.q.effect, r.notes]),
]);

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

export function exportClaudeSpec(p: DiscoveryProject) {
  const c = analyze(p).config;
  const reqs = requirements(p).filter((r) => r.status !== 'discarded');
  const apps = [...new Set(reqs.filter((r) => r.classes.includes('app')).map((r) => r.name))];
  return `${head(p, 'Especificación de implementación Shopify (para Claude Code)')}
## Contexto
Implementar la tienda Shopify **${c.brand.storeName}** según el Discovery. La integración SAP la desarrolla un integrador externo: **no implementar lógica de integración SAP**; solo respetar los campos y flujos indicados.

## Reglas
1. No inventar compatibilidades del tema. Todo ítem "dependiente del tema" se verifica en ${c.meta.themeName ?? 'el tema (aún no definido)'}; si no existe, crear una sección OS 2.0 con schema configurable.
2. Beneficios, nutrición y certificaciones se cargan desde metafields con contenido aprobado; no escribir afirmaciones de salud.
3. Implementar primero lo **aprobado** según prioridad. Lo **solicitado** sin aprobar requiere confirmación.

## Tokens de marca
\`\`\`json
${JSON.stringify({ colors: { primary: c.brand.primary, secondary: c.brand.secondary, accent: c.brand.accent }, typography: { heading: c.brand.headingFont, body: c.brand.bodyFont }, radius: c.brand.radius, tone: c.context?.tone }, null, 2)}
\`\`\`

## Navegación
- Menú (${c.header.menuType}): ${c.pages.filter((x) => x.inMenu).map((x) => x.title).join(', ')}
- Footer: ${c.pages.filter((x) => x.inFooter).map((x) => x.title).join(', ')}
- Colecciones: ${c.catalog.categories.join(', ')}

## templates/index.json — secciones en orden
${c.home.sections.map((s, i) => `${i + 1}. \`${s.id}\` (sección ${s.type}, variante ${s.variant}) — ${JSON.stringify({ title: s.props.title, subtitle: s.props.subtitle, cta: s.props.cta })}`).join('\n') || '_Sin secciones_'}

## Metafields de producto
| Namespace.key | Tipo | Uso |
|---|---|---|
${metafields(c).map((m) => `| \`${m.ns}\` | ${m.type} | ${m.purpose} |`).join('\n') || '| — | — | — |'}

## Search & Discovery — filtros
${c.catalog.filters.map((f) => `- ${filterLabel(f, c.catalog)}`).join('\n')}

## Apps a evaluar
${apps.map((a) => `- ${a}`).join('\n') || '- Ninguna'}

## Requerimientos
${reqs.map(reqBlock).join('\n')}
## Respuestas del Discovery
${STAGES.map((s) => `### ${s.index}. ${s.title}\n${questionMatrix(p).filter((r) => r.q.stage === s.id && r.applies && isGiven(p.answers[r.q.id])).map((r) => `- ${r.q.text} → ${answerText(r.q, p.answers[r.q.id].value)}`).join('\n') || '- (sin respuestas)'}`).join('\n\n')}
`;
}

export const fileBase = (p: DiscoveryProject) => slugify(p.meta.name);
export type { ProjectConfig };
