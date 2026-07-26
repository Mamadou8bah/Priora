import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Target, Timer, ArrowRight, AlertCircle, Trophy, Zap, Shield } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useSettingsStore, useInboxStore } from '../stores/useAppStores'
import { useFocusStore } from '../stores/useFocusStore'
import { useGameStore } from '../stores/useGameStore'
import { greeting, formatDate, isDueToday, isOverdue, todayKey } from '../lib/dates'
import { recommendNext, productivityScore } from '../lib/engine'
import { rankForLevel, xpProgressInLevel, isBossTask } from '../lib/game'
import { TaskCard, QuickCapture } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { Badge, Button, Modal, ProgressBar } from '../components/ui'
import type { Task } from '../types'

export function Dashboard() {
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.update)
  const projects = useProjectStore((s) => s.projects)
  const { settings, stats } = useSettingsStore()
  const addInbox = useInboxStore((s) => s.add)
  const setFocusTask = useFocusStore((s) => s.setTask)
  const game = useGameStore((s) => s.game)
  const quests = useGameStore((s) => s.quests)
  const [editing, setEditing] = useState<Task | null>(null)

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [tasks],
  )

  const todayTasks = useMemo(
    () =>
      openTasks.filter(
        (t) =>
          isDueToday(t.deadline) ||
          t.plannedDate === todayKey() ||
          t.status === 'in_progress',
      ),
    [openTasks],
  )

  const overdue = useMemo(
    () => openTasks.filter((t) => isOverdue(t.deadline)),
    [openTasks],
  )

  const upcoming = useMemo(
    () =>
      openTasks
        .filter((t) => t.deadline && !isOverdue(t.deadline) && !isDueToday(t.deadline))
        .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
        .slice(0, 5),
    [openTasks],
  )

  const recommendation = useMemo(
    () => recommendNext(openTasks, projects, 180),
    [openTasks, projects],
  )

  const completedToday = tasks.filter(
    (t) => t.completedAt && t.completedAt.startsWith(todayKey()),
  ).length

  const score = productivityScore({
    completedToday,
    dailyGoal: settings?.dailyGoal ?? 5,
    overdueCount: overdue.length,
    focusMinutesToday: 0,
  })

  const activeProject = projects.find((p) => p.status === 'active')

  const name = settings?.userName?.trim()
  const rank = rankForLevel(stats?.level ?? 1)
  const xpBar = xpProgressInLevel(stats?.xp ?? 0)
  const dailyQuests = quests.filter((q) => q.period === 'daily').slice(0, 3)
  const bossCount = openTasks.filter((t) => isBossTask(t)).length

  return (
    <div className="space-y-6">
      <section className="animate-fade-up">
        <p className="text-muted text-sm mb-1">{formatDate(new Date(), 'EEEE, MMMM d')}</p>
        <p className="text-lg text-[var(--fg)]/80">
          {greeting()}
          {name ? `, ${name}` : ''}.{' '}
          <span className="text-muted">One clear next step.</span>
        </p>
      </section>

      <Link
        to="/forge"
        className="block surface rounded-3xl p-4 sm:p-5 animate-fade-up-delay hover:border-[var(--fg)]/25 transition"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-0.5">The Forge</p>
            <p className="font-display text-xl font-bold">
              {rank.title}
              {game?.activeTitle ? ` · ${game.activeTitle}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold">Lv {stats?.level ?? 1}</p>
            <p className="text-xs text-muted flex items-center justify-end gap-1">
              <Zap size={12} /> ×{game?.momentum ?? 0}
            </p>
          </div>
        </div>
        <ProgressBar value={xpBar.pct} className="mb-2" />
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Flame size={12} /> {stats?.streak ?? 0}d streak
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield size={12} /> {game?.streakShields ?? 0} shields
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy size={12} /> {game?.unlockedAchievements.length ?? 0} relics
          </span>
          {bossCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-[var(--fg)]">
              {bossCount} bosses
            </span>
          )}
        </div>
      </Link>

      {dailyQuests.length > 0 && (
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Today's quests</h2>
            <Link to="/forge" className="text-sm text-muted hover:text-[var(--fg)]">
              All
            </Link>
          </div>
          <div className="space-y-2">
            {dailyQuests.map((q) => (
              <div key={q.id} className="surface rounded-2xl p-3">
                <div className="flex justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium">{q.title}</p>
                  <span className="text-xs text-muted">
                    {Math.min(q.progress, q.target)}/{q.target}
                  </span>
                </div>
                <ProgressBar value={(q.progress / Math.max(q.target, 1)) * 100} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="animate-fade-up-delay">
        <QuickCapture
          placeholder="Quick capture — task or idea…"
          onCapture={async (text) => {
            await addInbox(text)
          }}
        />
        <p className="text-xs text-muted mt-1.5 px-1">Goes to Inbox · under 10 seconds</p>
      </div>

      {recommendation && (
        <section className="surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-wider accent mb-2">
            Suggested next
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
            {recommendation.task.title}
          </h2>
          <p className="text-muted text-sm mb-4">{recommendation.reason}</p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/focus?task=${recommendation.task.id}`} className="flex-1 sm:flex-none">
              <Button
                className="w-full sm:w-auto"
                onClick={() => setFocusTask(recommendation.task.id)}
              >
                <Timer size={16} /> Start focus
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setEditing(recommendation.task)}>
              Details
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
        <Stat
          icon={<Flame size={16} className="text-[var(--fg)]" />}
          label="Streak"
          value={`${stats?.streak ?? 0}d`}
        />
        <Stat
          icon={<Target size={16} className="text-[var(--fg)]" />}
          label="Score"
          value={`${score}`}
        />
        <Stat
          icon={<CheckIcon />}
          label="Today"
          value={`${completedToday}/${settings?.dailyGoal ?? 5}`}
        />
        <Stat
          icon={<AlertCircle size={16} className="text-[var(--fg-muted)]" />}
          label="Overdue"
          value={`${overdue.length}`}
        />
      </div>

      <div className="surface rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Daily progress</span>
          <span className="text-xs text-muted">
            {rank.title} · {stats?.xp ?? 0} XP
          </span>
        </div>
        <ProgressBar value={(completedToday / Math.max(settings?.dailyGoal ?? 5, 1)) * 100} />
      </div>

      {activeProject && (
        <Link
          to={`/projects/${activeProject.id}`}
          className="flex items-center justify-between surface rounded-2xl p-4 hover:border-[var(--accent)] transition"
        >
          <div>
            <p className="text-xs text-muted mb-0.5">Active project</p>
            <p className="font-semibold" style={{ color: activeProject.color }}>
              {activeProject.title}
            </p>
          </div>
          <ArrowRight size={18} className="text-muted" />
        </Link>
      )}

      {overdue.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">
              Overdue
            </h2>
            <Badge>{overdue.length}</Badge>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 4).map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} compact />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Today</h2>
          <Link to="/planner" className="text-sm accent hover:underline">
            Plan day
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-muted text-sm py-6 text-center">
            Nothing scheduled — open the planner or capture an idea.
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 6).map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} compact />
            ))}
          </div>
        </section>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit task" wide>
        {editing && (
          <TaskForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              await updateTask(editing.id, data)
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="surface rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--fg)]">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
