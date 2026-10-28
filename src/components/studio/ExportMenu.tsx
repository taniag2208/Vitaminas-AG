import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, FileCheck2, FileJson, FileSpreadsheet, FileText, Map, Share2 } from 'lucide-react';
import { exportAcceptance, exportClaudeSpec, exportDecisionsCsv, exportFunctionalSummary, exportJson, exportPendingCsv, exportPendingMd, exportSitemap } from '@/engine/exports';
import { download, slugify } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project';
import { Button } from '../ui';

export const EXPORTS = [
  { id: 'json', label: 'Configuración JSON', icon: FileJson, ext: 'config.json', mime: 'application/json', fn: exportJson },
  { id: 'summary', label: 'Resumen funcional', icon: FileText, ext: 'resumen-funcional.md', mime: 'text/markdown', fn: exportFunctionalSummary },
  { id: 'sitemap', label: 'Mapa del sitio', icon: Map, ext: 'mapa-del-sitio.md', mime: 'text/markdown', fn: exportSitemap },
  { id: 'pending', label: 'Decisiones pendientes (.md)', icon: FileText, ext: 'decisiones-pendientes.md', mime: 'text/markdown', fn: exportPendingMd },
  { id: 'pendingCsv', label: 'Decisiones pendientes (.csv)', icon: FileSpreadsheet, ext: 'decisiones-pendientes.csv', mime: 'text/csv', fn: exportPendingCsv },
  { id: 'decisionsCsv', label: 'Todas las decisiones (.csv)', icon: FileSpreadsheet, ext: 'decisiones.csv', mime: 'text/csv', fn: exportDecisionsCsv },
  { id: 'acceptance', label: 'Criterios de aceptación', icon: FileCheck2, ext: 'criterios-de-aceptacion.md', mime: 'text/markdown', fn: exportAcceptance },
  { id: 'claude', label: 'Especificación para Claude Code', icon: Bot, ext: 'especificacion-shopify-claude-code.md', mime: 'text/markdown', fn: exportClaudeSpec },
] as const;

export const runExport = (project: ProjectConfig, id: (typeof EXPORTS)[number]['id']) => {
  const e = EXPORTS.find((x) => x.id === id)!;
  download(`${slugify(project.meta.name)}-${e.ext}`, e.fn(project), e.mime);
};

export function ExportMenu({ project }: { project: ProjectConfig }) {
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
      <Button variant="dark" size="sm" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} data-testid="export-menu"><Share2 size={14} /> Exportar <ChevronDown size={14} /></Button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          {EXPORTS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="menuitem" onClick={() => { runExport(project, id); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" data-testid={`export-${id}`}>
              <Icon size={16} className="text-studio-600" /> {label}
            </button>
          ))}
          <p className="px-3 pb-1 pt-2 text-[11px] text-slate-400">Los archivos se generan desde la configuración actual del proyecto.</p>
        </div>
      )}
    </div>
  );
}
