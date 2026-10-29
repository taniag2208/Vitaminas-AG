import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, ClipboardCheck, FileJson, FileSpreadsheet, FileText, LayoutList, ListTodo, Map, Share2, ShieldAlert, Store, Table } from 'lucide-react';
import {
  exportAnswersCsv, exportBacklogCsv, exportBacklogMd, exportChecklistMd, exportClaudeSpec, exportConfigJson, exportExecutive, exportPages, exportPendingCsv, exportProjectJson,
  exportRequirementsCsv, exportRequirementsMd, exportRisksMd, exportShopifyMd, exportToppingsCsv, exportToppingsMd, fileBase,
} from '@/engine/exports';
import { download } from '@/lib/utils';
import type { DiscoveryProject } from '@/types/discovery';
import { Button } from '../ui';

export const EXPORTS = [
  { id: 'executive', label: '1. Resumen ejecutivo', icon: FileText, ext: 'resumen-ejecutivo.md', mime: 'text/markdown', fn: exportExecutive },
  { id: 'requirements', label: '2. Matriz de requerimientos (.md)', icon: Table, ext: 'matriz-requerimientos.md', mime: 'text/markdown', fn: exportRequirementsMd },
  { id: 'requirementsCsv', label: '2. Matriz de requerimientos (.csv)', icon: FileSpreadsheet, ext: 'matriz-requerimientos.csv', mime: 'text/csv', fn: exportRequirementsCsv },
  { id: 'pages', label: '3. Mapa de páginas y componentes', icon: Map, ext: 'mapa-paginas-componentes.md', mime: 'text/markdown', fn: exportPages },
  { id: 'toppings', label: '4. Inventario de toppings (.md)', icon: LayoutList, ext: 'inventario-toppings.md', mime: 'text/markdown', fn: exportToppingsMd },
  { id: 'toppingsCsv', label: '4. Inventario de toppings (.csv)', icon: FileSpreadsheet, ext: 'inventario-toppings.csv', mime: 'text/csv', fn: exportToppingsCsv },
  { id: 'backlog', label: '5. Backlog funcional y técnico (.md)', icon: ListTodo, ext: 'backlog.md', mime: 'text/markdown', fn: exportBacklogMd },
  { id: 'backlogCsv', label: '5. Backlog (.csv)', icon: FileSpreadsheet, ext: 'backlog.csv', mime: 'text/csv', fn: exportBacklogCsv },
  { id: 'risks', label: '6. Dependencias, riesgos y pendientes', icon: ShieldAlert, ext: 'riesgos-pendientes.md', mime: 'text/markdown', fn: exportRisksMd },
  { id: 'pendingCsv', label: '6. Decisiones pendientes (.csv)', icon: FileSpreadsheet, ext: 'decisiones-pendientes.csv', mime: 'text/csv', fn: exportPendingCsv },
  { id: 'shopify', label: '7. Clasificación Shopify', icon: Store, ext: 'clasificacion-shopify.md', mime: 'text/markdown', fn: exportShopifyMd },
  { id: 'checklist', label: '8. Checklist de validación', icon: ClipboardCheck, ext: 'checklist-validacion.md', mime: 'text/markdown', fn: exportChecklistMd },
  { id: 'answers', label: 'Respuestas y banco de preguntas (.csv)', icon: FileSpreadsheet, ext: 'respuestas.csv', mime: 'text/csv', fn: exportAnswersCsv },
  { id: 'claude', label: 'Especificación para Claude Code', icon: Bot, ext: 'especificacion-shopify-claude-code.md', mime: 'text/markdown', fn: exportClaudeSpec },
  { id: 'json', label: 'Proyecto (JSON reimportable)', icon: FileJson, ext: 'proyecto.json', mime: 'application/json', fn: exportProjectJson },
  { id: 'configJson', label: 'Configuración derivada (JSON)', icon: FileJson, ext: 'configuracion-derivada.json', mime: 'application/json', fn: exportConfigJson },
] as const;

export type ExportId = (typeof EXPORTS)[number]['id'];

export const runExport = (project: DiscoveryProject, id: ExportId) => {
  const e = EXPORTS.find((x) => x.id === id)!;
  download(`${fileBase(project)}-${e.ext}`, e.fn(project), e.mime);
};

export function ExportMenu({ project }: { project: DiscoveryProject }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <Button variant="dark" size="sm" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} data-testid="export-menu"><Share2 size={14} /> <span className="hidden sm:inline">Exportar</span> <ChevronDown size={14} /></Button>
      {open && (
        <div role="menu" className="animate-fade-in thin-scroll absolute right-0 top-10 z-50 max-h-[75vh] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          {EXPORTS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="menuitem" onClick={() => { runExport(project, id); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" data-testid={`export-${id}`}>
              <Icon size={16} className="shrink-0 text-studio-600" /> {label}
            </button>
          ))}
          <p className="px-3 pb-1 pt-2 text-[11px] text-slate-400">Se generan con las respuestas actuales del Discovery.</p>
        </div>
      )}
    </div>
  );
}
