import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Inbox,
  FolderKanban,
  Calendar,
  Columns3,
  Sun,
  Tags,
  Settings,
  Search,
  Trophy,
  Gamepad2,
  Ellipsis,
  X,
} from 'lucide-react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'
import { cn } from '../../lib/utils'
import { useKeyboardOpen, useOverlayOpen } from '../../lib/overlay'
import { BrandWordmark } from '../BrandLogo'

type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
}

type NavIcon = ComponentType<IconProps>

type NavItem = {
  to: string
  label: string
  icon: NavIcon
  end?: boolean
}

function HomeIcon({ size = 24, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M15 18H9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

function TasksIcon({ size = 24, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path opacity="0.4" d="M12.3691 8.87988H17.6191" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path opacity="0.4" d="M6.38086 8.87988L7.13086 9.62988L9.38086 7.37988" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path opacity="0.4" d="M12.3691 15.8799H17.6191" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path opacity="0.4" d="M6.38086 15.8799L7.13086 16.6299L9.38086 14.3799" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon({ size = 24, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 5.5L5 3.5M21 5.5L19 3.5M9 12.5L11 14.5L15 10.5M20 12.5C20 16.9183 16.4183 20.5 12 20.5C7.58172 20.5 4 16.9183 4 12.5C4 8.08172 7.58172 4.5 12 4.5C16.4183 4.5 20 8.08172 20 12.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PRIMARY: NavItem[] = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/forge', label: 'Forge', icon: Trophy },
  { to: '/focus', label: 'Focus', icon: ClockIcon },
]

const MORE: NavItem[] = [
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/kanban', label: 'Board', icon: Columns3 },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/planner', label: 'Planner', icon: Sun },
  { to: '/play', label: 'Mind', icon: Gamepad2 },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const DESKTOP_EXTRA: NavItem[] = [
  { to: '/kanban', label: 'Board', icon: Columns3 },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
]

async function tap() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* web / unsupported */
  }
}

function pathMatches(pathname: string, to: string, end?: boolean) {
  if (end || to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function useScrollHide(threshold = 8) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        if (y < 48) setHidden(false)
        else if (delta > threshold) setHidden(true)
        else if (delta < -threshold) setHidden(false)
        lastY.current = y
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return hidden
}

export function FloatingNav() {
  const location = useLocation()
  const scrollHidden = useScrollHide()
  const overlayOpen = useOverlayOpen()
  const keyboardOpen = useKeyboardOpen()
  const [moreOpen, setMoreOpen] = useState(false)
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false })
  const dockRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
  const moreRef = useRef<HTMLDivElement>(null)

  const moreActive = MORE.some((item) => pathMatches(location.pathname, item.to))

  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const items = wide
    ? [...PRIMARY.slice(0, 2), ...DESKTOP_EXTRA, ...PRIMARY.slice(2)]
    : PRIMARY

  const activeIndex = items.findIndex((item) =>
    pathMatches(location.pathname, item.to, item.end),
  )
  const showMorePill = moreActive && activeIndex < 0

  const measure = useCallback(() => {
    const dock = dockRef.current
    if (!dock) return
    const targetIndex = showMorePill ? items.length : activeIndex
    const el = itemRefs.current[targetIndex]
    if (!el || targetIndex < 0) {
      setPill((p) => ({ ...p, ready: false }))
      return
    }
    const dockBox = dock.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    setPill({
      x: box.left - dockBox.left,
      w: box.width,
      ready: true,
    })
  }, [activeIndex, items.length, showMorePill])

  useLayoutEffect(() => {
    measure()
  }, [measure, location.pathname, wide, moreOpen])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (overlayOpen) setMoreOpen(false)
  }, [overlayOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (moreRef.current?.contains(t) || dockRef.current?.contains(t)) return
      setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [moreOpen])

  const dockHidden =
    overlayOpen || keyboardOpen || (scrollHidden && !moreOpen)

  return (
    <>
      {moreOpen && !overlayOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-nav-scrim"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col items-center pointer-events-none safe-bottom px-3 sm:px-4',
          'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          dockHidden && 'translate-y-[calc(100%+1.5rem)] opacity-0 pointer-events-none',
        )}
        aria-hidden={dockHidden}
      >
        <div
          ref={moreRef}
          className={cn(
            'pointer-events-auto mb-3 w-full max-w-md origin-bottom',
            'transition-[transform,opacity,filter] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            moreOpen
              ? 'opacity-100 scale-100 translate-y-0 blur-0'
              : 'opacity-0 scale-95 translate-y-4 blur-sm pointer-events-none invisible absolute',
          )}
          aria-hidden={!moreOpen}
        >
          <div className="float-dock rounded-[1.75rem] p-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Navigate
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-xl text-muted hover:bg-accent-soft hover:text-[var(--fg)] transition"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MORE.filter(
                (item) => !wide || !DESKTOP_EXTRA.some((d) => d.to === item.to),
              ).map((item, i) => {
                const active = pathMatches(location.pathname, item.to)
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => void tap()}
                    className={cn(
                      'nav-more-item flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-[11px] font-medium transition',
                      active
                        ? 'bg-accent text-[var(--accent-fg)] shadow-[var(--glass-shine)]'
                        : 'text-muted hover:bg-accent-soft hover:text-[var(--fg)]',
                    )}
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>

        <nav
          ref={dockRef}
          className="pointer-events-auto relative float-dock mx-auto flex items-center justify-center rounded-full p-1.5 mb-2"
          aria-label="Primary"
        >
          <span
            aria-hidden
            className={cn(
              'nav-pill absolute top-1.5 bottom-1.5 rounded-full bg-[var(--accent)]',
              'shadow-[var(--glass-shine)]',
              pill.ready ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              width: pill.w,
              transform: `translateX(${pill.x}px)`,
            }}
          />

          {items.map((item, i) => {
            const Icon = item.icon
            const active = pathMatches(location.pathname, item.to, item.end)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                onClick={() => void tap()}
                className={cn(
                  'nav-dock-item relative z-10 flex w-14 flex-col items-center justify-center',
                  'h-14 shrink-0 rounded-full',
                  'transition-colors duration-300',
                  active ? 'text-[var(--accent-fg)]' : 'text-muted hover:text-[var(--fg)]',
                )}
                aria-label={item.label}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.75}
                  className={cn(
                    'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    active && '-translate-y-0.5 scale-105',
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] font-semibold tracking-wide leading-none mt-0.5',
                    'transition-[opacity,transform,max-height] duration-300',
                    active
                      ? 'opacity-100 translate-y-0 max-h-3'
                      : 'opacity-0 -translate-y-1 max-h-0 overflow-hidden',
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}

          <button
            type="button"
            ref={(el) => {
              itemRefs.current[items.length] = el
            }}
            onClick={() => {
              void tap()
              setMoreOpen((v) => !v)
            }}
            className={cn(
              'nav-dock-item relative z-10 flex w-14 flex-col items-center justify-center',
              'h-14 shrink-0 rounded-full',
              'transition-colors duration-300',
              moreOpen || showMorePill
                ? 'text-[var(--accent-fg)]'
                : 'text-muted hover:text-[var(--fg)]',
            )}
            aria-expanded={moreOpen}
            aria-label="More destinations"
          >
            <Ellipsis
              size={22}
              strokeWidth={moreOpen || showMorePill ? 2 : 1.75}
              className={cn(
                'transition-transform duration-300',
                moreOpen && 'rotate-90',
              )}
            />
            <span
              className={cn(
                'text-[9px] font-semibold tracking-wide leading-none mt-0.5',
                moreOpen || showMorePill
                  ? 'opacity-100 max-h-3'
                  : 'opacity-0 max-h-0 overflow-hidden',
              )}
            >
              More
            </span>
          </button>
        </nav>
      </div>
    </>
  )
}

export function FloatingTopBar() {
  return (
    <header className="sticky top-0 z-30 flex justify-center px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
      <div className="pointer-events-auto float-dock w-full max-w-6xl flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
        <NavLink to="/" end className="min-w-0" onClick={() => void tap()} aria-label="Priora home">
          <BrandWordmark markSize={28} />
        </NavLink>
        <NavLink
          to="/search"
          onClick={() => void tap()}
          className="p-2.5 rounded-xl text-muted hover:bg-accent-soft hover:text-[var(--fg)] transition active:scale-95"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.75} />
        </NavLink>
      </div>
    </header>
  )
}
