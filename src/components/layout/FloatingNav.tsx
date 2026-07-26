import { useEffect, useRef, useState, type ComponentType } from 'react'
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
  Menu,
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
      <path d="M15 18H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
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

const TABS: NavItem[] = [
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

export function FloatingNav() {
  const location = useLocation()
  const overlayOpen = useOverlayOpen()
  const keyboardOpen = useKeyboardOpen()
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const moreActive = MORE.some((item) => pathMatches(location.pathname, item.to))
  const hidden = overlayOpen || keyboardOpen

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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [moreOpen])

  return (
    <>
      {moreOpen && !overlayOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 animate-nav-scrim"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 z-[45] mx-auto w-full max-w-lg px-3',
          'bottom-[calc(3.75rem+env(safe-area-inset-bottom))]',
          'transition-[transform,opacity] duration-200 ease-out',
          moreOpen && !hidden
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3 pointer-events-none',
        )}
        aria-hidden={!moreOpen}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold">More</p>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:bg-accent-soft hover:text-[var(--fg)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-2 max-h-[50dvh] overflow-y-auto scrollbar-thin">
            {MORE.map((item) => {
              const active = pathMatches(location.pathname, item.to)
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => void tap()}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-medium transition',
                    active
                      ? 'bg-accent text-[var(--accent-fg)]'
                      : 'text-[var(--fg-muted)] hover:bg-accent-soft hover:text-[var(--fg)]',
                  )}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--card)]',
          'safe-bottom',
          hidden && 'invisible pointer-events-none',
        )}
        aria-label="Primary"
        aria-hidden={hidden}
      >
        <div className="mx-auto flex max-w-lg h-14 items-stretch">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = pathMatches(location.pathname, item.to, item.end)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => void tap()}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0',
                  'text-[10px] font-medium',
                  active ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]',
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--fg)]"
                  />
                )}
                <Icon size={22} strokeWidth={1.75} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <button
            type="button"
            onClick={() => {
              void tap()
              setMoreOpen((v) => !v)
            }}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0',
              'text-[10px] font-medium',
              moreOpen || moreActive ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]',
            )}
            aria-expanded={moreOpen}
            aria-label="More"
          >
            {(moreOpen || moreActive) && (
              <span
                aria-hidden
                className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--fg)]"
              />
            )}
            <Menu size={22} strokeWidth={1.75} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export function FloatingTopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <NavLink to="/" end onClick={() => void tap()} aria-label="Priora home" className="min-w-0">
          <BrandWordmark markSize={24} />
        </NavLink>
        <NavLink
          to="/search"
          onClick={() => void tap()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-accent-soft hover:text-[var(--fg)] transition"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={1.75} />
        </NavLink>
      </div>
    </header>
  )
}
