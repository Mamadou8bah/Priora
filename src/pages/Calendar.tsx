import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useSettingsStore } from '../stores/useAppStores'
import {
  format,
  getMonthDays,
  getWeekDays,
  isSameDay,
  isToday,
  toDateKey,
} from '../lib/dates'
import { cn } from '../lib/utils'
import { Button, Modal, PageHeader } from '../components/ui'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import type { Task } from '../types'

type View = 'month' | 'week' | 'day'

export function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const update = useTaskStore((s) => s.update)
  const weekStartsOn = useSettingsStore((s) => s.settings?.weekStartsOn ?? 1)
  const [cursor, setCursor] = useState(new Date())
  const [view, setView] = useState<View>('month')
  const [selected, setSelected] = useState(new Date())
  const [editing, setEditing] = useState<Task | null>(null)

  const days =
    view === 'month'
      ? getMonthDays(cursor, weekStartsOn)
      : view === 'week'
        ? getWeekDays(cursor, weekStartsOn)
        : [selected]

  const weekLabels =
    weekStartsOn === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (t.status === 'cancelled') continue
      const keys = new Set<string>()
      if (t.deadline) keys.add(toDateKey(t.deadline))
      if (t.plannedDate) keys.add(toDateKey(t.plannedDate))
      for (const key of keys) {
        const list = map.get(key) ?? []
        list.push(t)
        map.set(key, list)
      }
    }
    return map
  }, [tasks])

  const selectedTasks = tasksByDay.get(toDateKey(selected)) ?? []

  function shift(dir: number) {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else {
      d.setDate(d.getDate() + dir)
      setSelected(new Date(d))
      setCursor(new Date(d))
      return
    }
    setCursor(d)
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Deadlines & planned work"
        actions={
          <div className="flex gap-1 surface-solid rounded-xl p-1">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm capitalize transition',
                  view === v ? 'bg-accent-soft accent font-medium' : 'text-muted',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <h2 className="font-display font-bold">
          {view === 'day'
            ? format(selected, 'EEEE, MMM d')
            : format(cursor, 'MMMM yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => shift(1)}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {view !== 'day' && (
        <div className="grid grid-cols-7 gap-1 mb-6">
          {weekLabels.map((d) => (
            <div key={d} className="text-center text-[10px] sm:text-xs text-muted py-1 font-medium">
              <span className="sm:hidden">{d.slice(0, 1)}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}

          {days.map((day) => {
            const key = toDateKey(day)
            const dayTasks = tasksByDay.get(key) ?? []
            const inMonth = day.getMonth() === cursor.getMonth()
            return (
              <button
                key={key}
                onClick={() => {
                  setSelected(day)
                  if (view === 'week') setView('day')
                }}
                className={cn(
                  'min-h-12 sm:min-h-20 rounded-xl p-1 sm:p-1.5 text-left transition border border-transparent',
                  isSameDay(day, selected) && 'border-[var(--accent)] bg-accent-soft',
                  isToday(day) && !isSameDay(day, selected) && 'bg-[var(--card-solid)]',
                  view === 'month' && !inMonth && 'opacity-35',
                )}
              >
                <span
                  className={cn(
                    'text-[11px] sm:text-xs font-medium inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full',
                    isToday(day) && 'bg-accent text-white dark:text-ink',
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                      />
                    ))}
                  </div>
                  <div className="hidden sm:block space-y-0.5">
                    {dayTasks.slice(0, view === 'week' ? 4 : 2).map((t) => (
                      <div
                        key={t.id}
                        className="truncate text-[10px] px-1 py-0.5 rounded bg-accent-soft accent"
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > (view === 'week' ? 4 : 2) && (
                      <div className="text-[10px] text-muted px-1">
                        +{dayTasks.length - (view === 'week' ? 4 : 2)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <section>
        <h3 className="font-display font-bold mb-3">
          {format(selected, 'MMM d')} · {selectedTasks.length} item
          {selectedTasks.length !== 1 ? 's' : ''}
        </h3>
        {selectedTasks.length === 0 ? (
          <p className="text-muted text-sm py-6 text-center">
            No deadlines or planned work this day.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} />
            ))}
          </div>
        )}
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit task" wide>
        {editing && (
          <TaskForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              await update(editing.id, data)
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
