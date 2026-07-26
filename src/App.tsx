import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { BrandLogo } from './components/BrandLogo'
import { Dashboard } from './pages/Dashboard'
import { InboxPage } from './pages/Inbox'
import { TasksPage } from './pages/Tasks'
import { ProjectsPage } from './pages/Projects'
import { ProjectDetailPage } from './pages/ProjectDetail'
import { CategoriesPage } from './pages/Categories'
import { CalendarPage } from './pages/Calendar'
import { KanbanPage } from './pages/Kanban'
import { FocusPage } from './pages/Focus'
import { PlannerPage } from './pages/Planner'
import { SearchPage } from './pages/Search'
import { SettingsPage } from './pages/Settings'
import { GamePage } from './pages/Game'
import { PlayPage } from './pages/Play'
import { GameToasts } from './components/game/GameToasts'
import { seedDatabase } from './db'
import { useTaskStore } from './stores/useTaskStore'
import { useProjectStore } from './stores/useProjectStore'
import {
  useCategoryStore,
  useInboxStore,
  useSettingsStore,
} from './stores/useAppStores'
import { useGameStore } from './stores/useGameStore'
import { startReminderTicker } from './lib/reminders'

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && preferDark)
  root.classList.toggle('dark', dark)
}

function Bootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const loadTasks = useTaskStore((s) => s.load)
  const loadProjects = useProjectStore((s) => s.load)
  const loadCategories = useCategoryStore((s) => s.load)
  const loadInbox = useInboxStore((s) => s.load)
  const loadSettings = useSettingsStore((s) => s.load)
  const loadGame = useGameStore((s) => s.load)
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    let ticker: number | undefined
    ;(async () => {
      await seedDatabase()
      await Promise.all([
        loadTasks(),
        loadProjects(),
        loadCategories(),
        loadInbox(),
        loadSettings(),
        loadGame(),
      ])
      ticker = startReminderTicker()
      setReady(true)
    })()
    return () => {
      if (ticker) clearInterval(ticker)
    }
  }, [loadTasks, loadProjects, loadCategories, loadInbox, loadSettings, loadGame])

  useEffect(() => {
    if (settings?.theme) applyTheme(settings.theme)
  }, [settings?.theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (settings?.theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings?.theme])

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <BrandLogo size={56} className="text-[var(--fg)]" />
        <div className="font-display text-3xl font-extrabold tracking-tight">Priora</div>
        <p className="text-muted text-sm animate-pulse-soft">Loading your workspace…</p>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Bootstrap>
        <GameToasts />
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="kanban" element={<KanbanPage />} />
            <Route path="focus" element={<FocusPage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="forge" element={<GamePage />} />
            <Route path="play" element={<PlayPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Bootstrap>
    </BrowserRouter>
  )
}
