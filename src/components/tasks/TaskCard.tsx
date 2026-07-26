import { useState } from 'react'
import { Check, Clock, MoreHorizontal, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Task } from '../../types'
import { Badge, Button } from '../ui'
import { PRIORITY_META, STATUS_META, cn } from '../../lib/utils'
import { formatRelativeDate, isOverdue, isDueToday } from '../../lib/dates'
import { useCategoryStore } from '../../stores/useAppStores'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'

export function TaskCard({
  task,
  onEdit,
  compact,
}: {
  task: Task
  onEdit?: (task: Task) => void
  compact?: boolean
}) {
  const complete = useTaskStore((s) => s.complete)
  const categories = useCategoryStore((s) => s.categories)
  const projects = useProjectStore((s) => s.projects)
  const category = categories.find((c) => c.id === task.categoryId)
  const project = projects.find((p) => p.id === task.projectId)
  const priority = PRIORITY_META[task.priority]
  const overdue = isOverdue(task.deadline) && task.status !== 'completed'
  const dueToday = isDueToday(task.deadline)

  return (
    <div
      className={cn(
        'group surface rounded-2xl p-3.5 transition hover:border-[var(--accent)]',
        task.status === 'completed' && 'opacity-60',
        compact && 'p-3',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => complete(task.id)}
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
            task.status === 'completed'
              ? 'border-[var(--accent)] bg-accent text-white'
              : 'border-app hover:border-[var(--accent)]',
          )}
          aria-label="Complete task"
        >
          {task.status === 'completed' && <Check size={14} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button className="text-left" onClick={() => onEdit?.(task)}>
              <h3
                className={cn(
                  'font-medium leading-snug',
                  task.status === 'completed' && 'line-through text-muted',
                )}
              >
                {task.title}
              </h3>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Link to={`/focus?task=${task.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Focus">
                  <Play size={14} />
                </Button>
              </Link>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(task)}
                >
                  <MoreHorizontal size={14} />
                </Button>
              )}
            </div>
          </div>

          {!compact && task.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge color={priority.color}>{priority.label}</Badge>
            {category && <Badge color={category.color}>{category.name}</Badge>}
            {project && <Badge color={project.color}>{project.title}</Badge>}
            <Badge>{STATUS_META[task.status].label}</Badge>
            {task.deadline && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  overdue ? 'font-semibold text-[var(--fg)]' : dueToday ? 'accent' : 'text-muted',
                )}
              >
                <Clock size={12} />
                {formatRelativeDate(task.deadline)}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-xs text-muted">{task.estimatedMinutes}m</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuickCapture({
  onCapture,
  placeholder = 'Capture anything…',
}: {
  onCapture: (text: string) => Promise<void> | void
  placeholder?: string
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true)
    await onCapture(value.trim())
    setValue('')
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl pl-4 pr-24 text-[var(--fg)] outline-none transition placeholder:text-muted shadow-[var(--glass-shine)] focus:border-[var(--fg)]/25 focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
      <Button
        type="submit"
        size="sm"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        disabled={busy || !value.trim()}
      >
        Add
      </Button>
    </form>
  )
}
