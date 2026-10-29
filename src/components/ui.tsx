import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScopeStatus, TechClass } from '@/types/project';
import type { AnswerStatus, ToppingStatus } from '@/types/discovery';
import { ANSWER_STATUS_LABEL, SCOPE_LABEL, TOPPING_STATUS_LABEL } from '@/engine/labels';
import { TECH_CLASS_LABEL } from '@/config/annotations';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-studio-600 text-white shadow-sm shadow-studio-600/25 hover:bg-studio-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        variant === 'danger' && 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
        variant === 'dark' && 'bg-ink-900 text-white hover:bg-ink-800',
        className,
      )}
    />
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  const auto = useId();
  return (
    <button
      id={id ?? auto}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition', checked ? 'bg-studio-600' : 'bg-slate-300')}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn('inline-flex items-center gap-1.5 rounded-md font-medium transition', size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm', value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SCOPE_STYLE: Record<ScopeStatus, string> = {
  proposal: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  tbd: 'bg-slate-100 text-slate-600 ring-slate-200',
  additional: 'bg-amber-50 text-amber-800 ring-amber-200',
  validation: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export const ScopeBadge = ({ scope, short }: { scope: ScopeStatus; short?: boolean }) => (
  <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', SCOPE_STYLE[scope])}>
    {short ? { proposal: 'En propuesta', tbd: 'Por definir', additional: 'Adicional', validation: 'Validación técnica' }[scope] : SCOPE_LABEL[scope]}
  </span>
);

const TECH_STYLE: Record<TechClass, string> = {
  native: 'bg-emerald-600 text-white',
  theme: 'bg-violet-100 text-violet-800',
  config: 'bg-slate-200 text-slate-700',
  app: 'bg-amber-100 text-amber-900',
  custom: 'bg-rose-100 text-rose-800',
  sap: 'bg-sky-100 text-sky-800',
  validation: 'bg-orange-100 text-orange-800',
};

export const TechBadge = ({ cls, pending }: { cls: TechClass; pending?: boolean }) => (
  <span className={cn('inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold', TECH_STYLE[cls])}>
    {TECH_CLASS_LABEL[cls]}
    {pending && cls === 'theme' ? ' · pendiente' : ''}
  </span>
);

const STATUS_STYLE: Record<AnswerStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  answered: 'bg-studio-50 text-studio-700',
  to_validate: 'bg-amber-50 text-amber-800',
  na: 'bg-slate-100 text-slate-400',
};
const DOT: Record<AnswerStatus, string> = { pending: 'bg-slate-300', answered: 'bg-studio-500', to_validate: 'bg-amber-500', na: 'bg-slate-300' };

export const StatusDot = ({ status }: { status: AnswerStatus }) => (
  <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT[status], status === 'na' && 'ring-2 ring-slate-200')} aria-label={ANSWER_STATUS_LABEL[status]} />
);

export const StatusBadge = ({ status }: { status: AnswerStatus }) => (
  <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[status])} data-status={status}>
    <span className={cn('h-1.5 w-1.5 rounded-full', DOT[status])} />
    {ANSWER_STATUS_LABEL[status]}
  </span>
);

const TOPPING_STYLE: Record<ToppingStatus, string> = {
  available: 'bg-slate-100 text-slate-500',
  recommended: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  requested: 'bg-studio-50 text-studio-700 ring-1 ring-inset ring-studio-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  discarded: 'bg-slate-100 text-slate-400 line-through',
};

export const ToppingStatusBadge = ({ status }: { status: ToppingStatus }) => (
  <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', TOPPING_STYLE[status])} data-topping-status={status}>{TOPPING_STATUS_LABEL[status]}</span>
);

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input,button,textarea,select')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn('animate-fade-in max-h-[90vh] w-full overflow-auto rounded-2xl bg-white shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-studio-400 focus:outline-none focus:ring-2 focus:ring-studio-100';

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-studio-50 text-studio-600">{icon}</div>
      <p className="font-display text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
