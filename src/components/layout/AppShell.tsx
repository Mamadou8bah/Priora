import { Outlet } from 'react-router-dom'
import { FloatingNav, FloatingTopBar } from './FloatingNav'

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col app-shell">
      <FloatingTopBar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-5 pb-[calc(var(--dock-clearance)+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <FloatingNav />
    </div>
  )
}
