import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ClipboardList, Layers, MessageCircleQuestion, MonitorSmartphone } from 'lucide-react';
import { DiscoveryPanel } from '@/components/discovery/DiscoveryPanel';
import { DeliverablesPanel } from '@/components/pmo/DeliverablesPanel';
import { ToppingsWorkspace } from '@/components/toppings/ToppingsWorkspace';
import { overallProgress } from '@/engine/derive';
import { cn } from '@/lib/utils';
import { onStorageError } from '@/services/storage';
import { useAnalysis } from '@/store/useDerived';
import { useStudio, type Workspace } from '@/store/useStudio';
import type { DiscoveryProject } from '@/types/discovery';
import { ExportMenu } from './ExportMenu';
import { PreviewPane } from './PreviewPane';
import { StudioBrandStyle, StudioMark } from './StudioBrandStyle';

function SaveIndicator({ updatedAt }: { updatedAt: string }) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => onStorageError(setError), []);
  if (error) return <span className="flex items-center gap-1 text-xs text-rose-600" role="alert"><AlertCircle size={14} /> {error}</span>;
  return <span className="hidden items-center gap-1 text-xs text-slate-500 xl:flex" title="Los cambios se guardan automáticamente en este navegador"><Check size={14} className="text-emerald-600" /> Guardado en este navegador · {new Date(updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>;
}

const WORKSPACES: [Workspace, string, typeof Layers][] = [
  ['discovery', 'Discovery', MessageCircleQuestion],
  ['toppings', 'Toppings', Layers],
  ['deliverables', 'Entregables', ClipboardList],
];

/** Pestañas en pantallas pequeñas: el simulador es una pestaña más; las respuestas viven en el store. */
type MobileTab = Workspace | 'simulator';

export function StudioLayout({ project }: { project: DiscoveryProject }) {
  const { ui, setUi, openProject } = useStudio();
  const analysis = useAnalysis(project)!;
  const cfg = analysis.config;
  const [mobileTab, setMobileTab] = useState<MobileTab>('discovery');
  const progress = overallProgress(project);
  const requested = analysis.toppings.filter((t) => t.active).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.fullscreen && setUi({ fullscreen: false });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.fullscreen, setUi]);

  const setTab = (t: MobileTab) => { setMobileTab(t); if (t !== 'simulator') setUi({ workspace: t }); };
  const showSim = ui.workspace === 'discovery';

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
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="hidden sm:inline">{project.meta.client}</span>
            <span className="inline-flex items-center gap-1.5" data-testid="overall-progress"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-studio-600" style={{ width: `${progress}%` }} /></span>{progress}%</span>
          </div>
        </div>
        <nav className="mx-auto hidden rounded-lg bg-slate-100 p-0.5 md:flex" aria-label="Espacio de trabajo">
          {WORKSPACES.map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={ui.workspace === id} onClick={() => setUi({ workspace: id })} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition', ui.workspace === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} data-testid={`workspace-${id}`}>
              <Icon size={15} /> {label}
              {id === 'toppings' && <span className="rounded-full bg-studio-100 px-1.5 text-[10px] font-bold text-studio-700">{requested}</span>}
            </button>
          ))}
        </nav>
        <span className="ml-auto md:ml-0" />
        <SaveIndicator updatedAt={project.meta.updatedAt} />
        <ExportMenu project={project} />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Desktop: Discovery 40% + Simulador 60%; Toppings y Entregables a pantalla completa */}
        <div className={cn('min-h-0 min-w-0 border-r border-slate-200 bg-slate-50/60', showSim ? 'lg:flex lg:w-[40%] lg:max-w-[620px] lg:min-w-[400px]' : 'lg:flex lg:flex-1', mobileTab === 'simulator' ? 'hidden' : 'flex w-full')}>
          {ui.workspace === 'discovery' && <DiscoveryPanel project={project} cfg={cfg} />}
          {ui.workspace === 'toppings' && <ToppingsWorkspace project={project} />}
          {ui.workspace === 'deliverables' && <DeliverablesPanel project={project} />}
        </div>
        <div className={cn('min-h-0 min-w-0 flex-1', showSim ? 'lg:flex' : 'lg:hidden', mobileTab === 'simulator' ? 'flex' : 'hidden')}>
          <PreviewPane cfg={cfg} />
        </div>
      </div>

      <nav className="grid shrink-0 grid-cols-4 border-t border-slate-200 bg-white lg:hidden" aria-label="Secciones">
        {([['discovery', 'Discovery', MessageCircleQuestion], ['simulator', 'Simulador', MonitorSmartphone], ['toppings', 'Toppings', Layers], ['deliverables', 'Entregables', ClipboardList]] as [MobileTab, string, typeof Layers][]).map(([id, label, Icon]) => (
          <button key={id} type="button" aria-pressed={mobileTab === id} onClick={() => setTab(id)} className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', mobileTab === id ? 'text-studio-700' : 'text-slate-500')} data-testid={`tab-${id}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
