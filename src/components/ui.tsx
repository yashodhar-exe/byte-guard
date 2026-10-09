import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertTriangle, ArrowUpRight, Inbox, LoaderCircle } from 'lucide-react'
import { cn, titleCase } from '../lib/utils'
import type { DataOrigin, ExclusionStatus, ReviewStatus, Severity, TrustStatus } from '../lib/types'

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white',
    secondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700'
  }
  return <button className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950', styles[variant], className)} {...props} />
}

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900', className)}>{children}</section>
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-400 dark:focus:ring-slate-800', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-400 dark:focus:ring-slate-800', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-400 dark:focus:ring-slate-800', className)} {...props}>{children}</select>
}

export function Field({ label, error, children }: PropsWithChildren<{ label: string; error?: string }>) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span>{children}{error && <span className="text-xs font-normal text-rose-600">{error}</span>}</label>
}

const severityStyles: Record<Severity, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  critical: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', severityStyles[severity])}>{titleCase(severity)}</span>
}

export function StatusBadge({ status }: { status: ReviewStatus | TrustStatus | ExclusionStatus | string }) {
  const styles: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    open: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    under_review: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    confirmed_threat: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    false_positive: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    none: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    official_asset: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    trusted_relationship: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  }
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{titleCase(status)}</span>
}

export function OriginBadge({ origin }: { origin: DataOrigin }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', origin === 'synthetic' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300')}>{origin === 'synthetic' ? 'Demo' : 'Live'}</span>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60"><div className="grid max-w-sm justify-items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Inbox size={20} /></span><div><h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p></div>{action}</div></div>
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div className="flex-1"><p className="font-semibold">Could not load this workspace</p><p className="mt-1">{message}</p></div>{retry && <Button variant="secondary" onClick={retry}>Retry</Button>}</div>
}

export function LoadingState() {
  return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading workspace</span></div>
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p></div>{action}</header>
}

export function ExternalLink({ href, children }: PropsWithChildren<{ href: string }>) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 dark:text-slate-200 dark:decoration-slate-600 dark:hover:text-white">{children}<ArrowUpRight size={14} /></a>
}
