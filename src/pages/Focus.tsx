import { useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useFocusStore } from '../stores/useFocusStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useSettingsStore } from '../stores/useAppStores'
import { Button, Select } from '../components/ui'
import { BrandLogo } from '../components/BrandLogo'
import { cn } from '../lib/utils'

export function FocusPage() {
  const [params] = useSearchParams()
  const tasks = useTaskStore((s) => s.tasks)
  const complete = useTaskStore((s) => s.complete)
  const settings = useSettingsStore((s) => s.settings)
  const {
    taskId,
    setTask,
    durationMinutes,
    setDuration,
    remainingSeconds,
    running,
    sessionId,
    start,
    pause,
    resume,
    tick,
    complete: completeFocus,
    reset,
    mode,
  } = useFocusStore()

  useEffect(() => {
    const q = params.get('task')
    if (q) setTask(q)
  }, [params, setTask])

  useEffect(() => {
    if (settings?.pomodoroMinutes && !running) {
      setDuration(settings.pomodoroMinutes)
    }
  }, [settings?.pomodoroMinutes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [running, tick])

  const task = tasks.find((t) => t.id === taskId)
  const openTasks = useMemo(
    () =>
      tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [tasks],
  )

  const total = durationMinutes * 60
  const progress = total ? ((total - remainingSeconds) / total) * 100 : 0
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <div className="max-w-md mx-auto text-center py-4">
      <p className="text-xs font-semibold uppercase tracking-wider accent mb-2">
        {mode === 'break' ? 'Break time' : 'Focus mode'}
      </p>
      <div className="flex flex-col items-center gap-3 mb-8">
        <BrandLogo size={40} className="text-[var(--fg)]" />
        <h1 className="font-display text-3xl font-extrabold">Priora</h1>
        <p className="text-muted text-sm">One task. No distractions.</p>
      </div>

      <div className="relative mx-auto mb-8 h-56 w-56">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1000 linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-bold tabular-nums">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted mt-1">{durationMinutes} min session</span>
        </div>
      </div>

      <div className="surface rounded-2xl p-4 mb-6 text-left">
        <label className="text-xs text-muted block mb-1.5">Current task</label>
        <Select
          value={taskId ?? ''}
          onChange={(e) => setTask(e.target.value || null)}
        >
          <option value="">Select a task…</option>
          {openTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>
        {task?.notes && (
          <p className="mt-3 text-sm text-muted whitespace-pre-wrap">{task.notes}</p>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[15, 25, 45, 60].map((m) => (
          <button
            key={m}
            disabled={running}
            onClick={() => setDuration(m)}
            className={cn(
              'h-9 px-3 rounded-xl text-sm transition border border-app',
              durationMinutes === m ? 'bg-accent-soft accent border-transparent' : 'text-muted',
            )}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {!running ? (
          <Button
            size="lg"
            onClick={() => (remainingSeconds < total && remainingSeconds > 0 ? resume() : start())}
          >
            <Play size={18} /> {remainingSeconds < total && remainingSeconds > 0 ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button size="lg" variant="secondary" onClick={pause}>
            <Pause size={18} /> Pause
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={reset}>
          <RotateCcw size={18} />
        </Button>
        {task && (
          <Button
            size="lg"
            variant="secondary"
            onClick={async () => {
              if (sessionId || running) await completeFocus()
              await complete(task.id)
              reset()
            }}
          >
            <SkipForward size={18} /> Done
          </Button>
        )}
      </div>

      <Link to="/tasks" className="text-sm text-muted hover:text-[var(--fg)]">
        Browse all tasks
      </Link>
    </div>
  )
}
