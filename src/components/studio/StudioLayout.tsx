import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ClipboardList, Eye, LayoutPanelLeft } from 'lucide-react';
import { DiscoveryPanel } from '@/components/discovery/DiscoveryPanel';
import { PmoPanel } from '@/components/pmo/PmoPanel';
import { pmoSummary } from '@/engine/pmo';
import { cn } from '@/lib/utils';
import { onStorageError } from '@/services/storage';
import { useStudio } from '@/store/useStudio';
import type { ProjectConfig } from '@/types/project';
import { ExportMenu } from './ExportMenu';
import { PreviewPane } from './PreviewPane';
import { StudioBrandStyle, StudioMark } from './StudioBrandStyle';

function SaveIndicator({ updatedAt }: { updatedAt: string }) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => onStorageError(setError), []);
  if (error) return <span className="flex items-center gap-1 text-xs text-rose-600" role="alert"><AlertCircle size={14} /> {error}</span>;
  return <span className="hidden items-center gap-1 text-xs text-slate-500 md:flex" title="Los cambios se guardan automáticamente en este navegador"><Check size={14} className="text-emerald-600" /> Guardado localmente · {new Date(updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>;
}

export function StudioLayout({ project }: { project: ProjectConfig }) {
  const { ui, setUi, openProject } = useStudio();
  const [mobilePane, setMobilePane] = useState<'discovery' | 'preview'>('discovery');
  const summary = pmoSummary(project);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.fullscreen && setUi({ fullscreen: false });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.fullscreen, setUi]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <StudioBrandStyle />
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 lg:px-4">
        <button type="button" onClick={() => openProject(null)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100" aria-label="Volver a proyectos">
          <ArrowLeft size={16} className="text-slate-500" />
          <StudioMark size={28} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold leading-tight">{project.meta.name}</p>
          <p className="truncate text-[11px] text-slate-500">{project.meta.client} · Discovery {summary.progress}%</p>
        </div>
        <nav className="mx-auto flex rounded-lg bg-slate-100 p-0.5" aria-label="Espacio de trabajo">
          {([['studio', 'Discovery + Simulador', LayoutPanelLeft], ['pmo', 'Panel PMO', ClipboardList]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={ui.workspace === id} onClick={() => setUi({ workspace: id })} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition', ui.workspace === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} data-testid={`workspace-${id}`}>
              <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
              {id === 'pmo' && summary.risks.filter((r) => r.level === 'Alta').length > 0 && <span className="rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">{summary.risks.filter((r) => r.level === 'Alta').length}</span>}
            </button>
          ))}
        </nav>
        <SaveIndicator updatedAt={project.meta.updatedAt} />
        <ExportMenu project={project} />
      </header>

      {ui.workspace === 'studio' ? (
        <div className="flex min-h-0 flex-1">
          <div className={cn('min-h-0 w-full shrink-0 border-r border-slate-200 bg-white lg:flex lg:w-[440px] xl:w-[470px]', mobilePane === 'discovery' ? 'flex' : 'hidden')}>
            <DiscoveryPanel project={project} />
          </div>
          <div className={cn('min-h-0 min-w-0 flex-1 lg:flex', mobilePane === 'preview' ? 'flex' : 'hidden')}>
            <PreviewPane project={project} />
          </div>
          <button type="button" onClick={() => setMobilePane(mobilePane === 'discovery' ? 'preview' : 'discovery')} className="fixed bottom-4 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white shadow-xl lg:hidden">
            {mobilePane === 'discovery' ? <><Eye size={16} /> Ver simulador</> : <><LayoutPanelLeft size={16} /> Ver Discovery</>}
          </button>
        </div>
      ) : (
        <PmoPanel project={project} />
      )}
    </div>
  );
}
