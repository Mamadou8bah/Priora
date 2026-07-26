import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'
import { lockOverlay, unlockOverlay } from '../../lib/overlay'

export { Select } from './Select'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' &&
          'bg-accent shadow-[var(--glass-shine)] hover:opacity-90',
        variant === 'secondary' &&
          'surface-solid text-[var(--fg)] hover:bg-accent-soft',
        variant === 'ghost' && 'text-[var(--fg)] hover:bg-accent-soft',
        variant === 'danger' &&
          'bg-[var(--fg)] text-[var(--accent-fg)] opacity-90 hover:opacity-100',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        size === 'icon' && 'h-10 w-10',
        className,
      )}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl px-3.5 text-[var(--fg)] outline-none transition placeholder:text-muted shadow-[var(--glass-shine)] focus:border-[var(--fg)]/25 focus:ring-2 focus:ring-[var(--accent-soft)]',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl px-3.5 py-2.5 text-[var(--fg)] outline-none transition placeholder:text-muted shadow-[var(--glass-shine)] focus:border-[var(--fg)]/25 focus:ring-2 focus:ring-[var(--accent-soft)] resize-y',
        className,
      )}
      {...props}
    />
  )
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-medium backdrop-blur-md',
        className,
      )}
      style={
        color
          ? { color, background: `${color}18` }
          : { color: 'var(--fg)', background: 'var(--accent-soft)' }
      }
    >
      {children}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    lockOverlay()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      unlockOverlay()
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex w-full flex-col surface rounded-t-[1.75rem] sm:rounded-3xl',
          'max-h-[min(92dvh,100%)] sm:max-h-[min(85vh,52rem)]',
          'animate-fade-up shadow-[var(--shadow)]',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          wide ? 'sm:max-w-2xl sm:mx-4' : 'sm:max-w-lg sm:mx-4',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-app/60 px-5 py-4">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 h-14 w-14 rounded-2xl surface flex items-center justify-center">
        <span className="text-2xl">◇</span>
      </div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted text-sm max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-accent-soft overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 sm:mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight truncate">
          {title}
        </h1>
        {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
