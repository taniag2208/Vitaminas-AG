import { useRef, useState } from 'react';
import { Copy, Download, FolderOpen, HardDrive, Palette, Plus, Trash2, Upload } from 'lucide-react';
import { analyze, stageStats } from '@/engine/derive';
import { risks } from '@/engine/deliverables';
import { exportProjectJson } from '@/engine/exports';
import { download, slugify } from '@/lib/utils';
import { useStudio } from '@/store/useStudio';
import { Button, EmptyState, inputCls, Modal } from '../ui';
import { StudioBrandStyle, StudioMark } from './StudioBrandStyle';

export function ProjectsHome() {
  const { projects, createProject, duplicateProject, deleteProject, openProject, importProject, studioBrand, setStudioBrand } = useStudio();
  const [creating, setCreating] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; client: string }>({ name: 'Ecommerce B2C AG Vitaminas', client: 'AG Vitaminas' });
  const fileRef = useRef<HTMLInputElement>(null);
  const list = Object.values(projects).sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!importProject(data)) throw new Error('formato');
      setImportError(null);
    } catch {
      setImportError('El archivo no es una exportación válida de Tita Discovery Studio.');
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(1200px_500px_at_20%_-10%,var(--color-studio-100),transparent),linear-gradient(#f8fafc,#f8fafc)]">
      <StudioBrandStyle />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <StudioMark size={36} />
          <div>
            <p className="font-display text-base font-extrabold leading-none">{studioBrand.name} <span className="text-studio-600">Discovery Studio</span></p>
            <p className="mt-1 text-xs text-slate-500">Discovery guiado + simulador ecommerce + PMO</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setBrandOpen(true)}><Palette size={16} /> Identidad del estudio</Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="py-8">
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-ink-900">Construye el ecommerce de tu cliente mientras haces el Discovery.</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Cada respuesta actualiza un simulador navegable de la tienda, registra la decisión en el panel PMO y alimenta la especificación de implementación en Shopify.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo proyecto</Button>
            <Button onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar JSON</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          </div>
          {importError && <p className="mt-3 text-sm text-rose-600" role="alert">{importError}</p>}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Proyectos</h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><HardDrive size={14} /> Guardados solo en este navegador (almacenamiento local). Sin sincronización en la nube.</p>
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<FolderOpen size={20} />} title="Aún no hay proyectos" text="Crea el proyecto AG Vitaminas para iniciar el Discovery guiado." action={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> Crear proyecto</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => {
                const st = stageStats(p);
                const a = analyze(p);
                const s = { progress: st.total ? Math.round((st.resolved / st.total) * 100) : 0, approved: a.toppings.filter((t) => t.status === 'approved').length, requested: a.toppings.filter((t) => t.status === 'requested').length, pending: st.pending, risks: risks(p) };
                const brand = a.config.brand;
                return (
                  <article key={p.meta.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" data-testid="project-card">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold text-white" style={{ background: brand.primary }}>{brand.storeName.slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display font-bold">{p.meta.name}</h3>
                        <p className="text-xs text-slate-500">{p.meta.client} · v2</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">Avance del Discovery</span><b>{s.progress}%</b></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-studio-600" style={{ width: `${s.progress}%` }} /></div>
                      <div className="mt-3 flex gap-3 text-[11px] text-slate-500"><span>{s.requested + s.approved} funcionalidades ({s.approved} aprobadas)</span><span>{s.pending} pendientes</span><span>{s.risks.length} riesgos</span></div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">Actualizado {new Date(p.meta.updatedAt).toLocaleString('es-CO')}</p>
                    <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-4">
                      <Button variant="primary" size="sm" onClick={() => openProject(p.meta.id)}><FolderOpen size={14} /> Abrir</Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicateProject(p.meta.id)} title="Duplicar"><Copy size={14} /> Duplicar</Button>
                      <Button size="sm" variant="ghost" onClick={() => download(`${slugify(p.meta.name)}.json`, exportProjectJson(p), 'application/json')} title="Exportar JSON" aria-label="Exportar JSON"><Download size={14} /></Button>
                      <Button size="sm" variant="ghost" className="ml-auto text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDelete(p.meta.id)} aria-label="Eliminar proyecto"><Trash2 size={14} /></Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo proyecto">
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) { createProject({ ...form, name: form.name.trim(), client: form.client.trim() }); setCreating(false); } }}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Nombre del proyecto<input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Cliente<input className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></label>
          <p className="rounded-xl bg-studio-50 p-3 text-xs text-studio-900">El simulador arranca con un esqueleto y se construye con cada respuesta. El catálogo de demostración es de bienestar y suplementos; nombres, categorías y textos se personalizan en el Discovery.</p>
          
          <div className="flex justify-end gap-2"><Button onClick={() => setCreating(false)}>Cancelar</Button><Button variant="primary" type="submit">Crear y empezar</Button></div>
        </form>
      </Modal>

      <Modal open={brandOpen} onClose={() => setBrandOpen(false)} title="Identidad del estudio">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">Nombre de la agencia<input className={inputCls} value={studioBrand.name} onChange={(e) => setStudioBrand({ name: e.target.value || 'Tita Media' })} /></label>
          <label className="flex items-center justify-between gap-3 text-sm font-medium">Color principal<input type="color" value={studioBrand.accent} onChange={(e) => setStudioBrand({ accent: e.target.value })} className="h-9 w-16 cursor-pointer rounded border border-slate-200" /></label>
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStudioBrand({ name: 'Tita Media', accent: '#5b3df5' })}>Restablecer</Button><Button variant="primary" onClick={() => setBrandOpen(false)}>Listo</Button></div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar proyecto">
        <p className="text-sm text-slate-600">Se eliminará <b>{confirmDelete && projects[confirmDelete]?.meta.name}</b> de este navegador. Esta acción no se puede deshacer; exporta el JSON si quieres conservarlo.</p>
        <div className="mt-5 flex justify-end gap-2"><Button onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (confirmDelete) deleteProject(confirmDelete); setConfirmDelete(null); }}>Eliminar</Button></div>
      </Modal>
    </div>
  );
}
