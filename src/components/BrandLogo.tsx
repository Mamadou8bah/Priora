import { cn } from '../lib/utils'

type BrandLogoProps = {
  size?: number
  className?: string
  title?: string
}

/** Priora mark — rising priority bars into a focus point. */
export function BrandLogo({ size = 28, className, title = 'Priora' }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <rect x="8" y="18.5" width="3.5" height="7" rx="1.1" fill="var(--accent-fg)" />
      <rect x="13.25" y="15" width="3.5" height="10.5" rx="1.1" fill="var(--accent-fg)" />
      <rect x="18.5" y="11" width="3.5" height="14.5" rx="1.1" fill="var(--accent-fg)" />
      <circle cx="24.5" cy="10" r="2.1" fill="var(--accent-fg)" />
    </svg>
  )
}

export function BrandWordmark({
  className,
  markSize = 28,
}: {
  className?: string
  markSize?: number
}) {
  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <BrandLogo size={markSize} />
      <div className="min-w-0">
        <div className="font-display text-lg sm:text-xl font-extrabold tracking-tight leading-none">
          Priora
        </div>
        <p className="text-[10px] text-muted mt-0.5 hidden sm:block">What matters next</p>
      </div>
    </div>
  )
}
