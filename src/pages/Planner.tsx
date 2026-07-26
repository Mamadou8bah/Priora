import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Sparkles } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { usePlannerStore } from '../stores/useAppStores'
import { suggestDailyPlan } from '../lib/engine'
import { todayKey } from '../lib/dates'
import { Button, EmptyState, PageHeader, Textarea, Modal } from '../components/ui'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { cn } from '../lib/utils'
import type { Task } from '../types'

export function PlannerPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const update = useTaskStore((s) => s.update)
  const add = useTaskStore((s) => s.add)
  const { plan, load, setTasks, setNotes } = usePlannerStore()
  const [editing, setEditing] = useState<Task | null>(null)
  const [picking, setPicking] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load(todayKey())
  }, [load])

  const plannedTasks = useMemo(() => {
    if (!plan) return []
    return plan.taskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean) as Task[]
  }, [plan, tasks])

  const suggestions = useMemo(() => suggestDailyPlan(tasks, 6), [tasks])

  const openTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled',
  )

  async function applySuggestions() {
    const ids = suggestions.map((t) => t.id)
    await setTasks(ids)
    for (const t of suggestions) {
      if (t.plannedDate !== todayKey()) {
        await update(t.id, { plannedDate: todayKey(), status: t.status === 'inbox' ? 'planned' : t.status })
      }
    }
  }

  async function toggleTask(id: string) {
    if (!plan) return
    const next = plan.taskIds.includes(id)
      ? plan.taskIds.filter((x) => x !== id)
      : [...plan.taskIds, id]
    await setTasks(next)
    if (!plan.taskIds.includes(id)) {
      await update(id, { plannedDate: todayKey() })
    }
  }

  return (
    <div>
      <PageHeader
        title="Daily planner"
        subtitle="What do you want to accomplish today?"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={applySuggestions}>
              <Sparkles size={16} /> Suggest
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Task
            </Button>
          </div>
        }
      />

      {suggestions.length > 0 && plannedTasks.length === 0 && (
        <section className="surface rounded-2xl p-4 mb-6">
          <p className="text-sm font-medium mb-3">Priora suggests:</p>
          <div className="space-y-2 mb-4">
            {suggestions.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className="accent">•</span>
                <span>{t.title}</span>
              </div>
            ))}
          </div>
          <Button onClick={applySuggestions}>Approve schedule</Button>
        </section>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold">Today's plan</h2>
        <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
          Modify
        </Button>
      </div>

      {plannedTasks.length === 0 ? (
        <EmptyState
          title="Empty day"
          description="Approve suggestions or pick tasks manually."
          action={
            <Button variant="secondary" onClick={() => setPicking(true)}>
              Pick tasks
            </Button>
          }
        />
      ) : (
        <div className="space-y-2 mb-6">
          {plannedTasks.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} />
          ))}
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm font-medium mb-1.5 block">Notes for today</label>
        <Textarea
          value={plan?.notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Intentions, energy, blockers…"
        />
      </div>

      <Modal open={picking} onClose={() => setPicking(false)} title="Pick today's tasks" wide>
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {openTasks.map((t) => {
            const selected = plan?.taskIds.includes(t.id)
            return (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl p-3 text-left border transition',
                  selected
                    ? 'border-[var(--accent)] bg-accent-soft'
                    : 'border-app hover:bg-accent-soft/50',
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-md border flex items-center justify-center',
                    selected && 'bg-accent border-[var(--accent)] text-white',
                  )}
                >
                  {selected && <Check size={12} />}
                </span>
                <span className="text-sm font-medium">{t.title}</span>
              </button>
            )
          })}
        </div>
        <Button className="w-full mt-4" onClick={() => setPicking(false)}>
          Done
        </Button>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="New task" wide>
        <TaskForm
          onCancel={() => setCreating(false)}
          submitLabel="Add to today"
          onSubmit={async (data) => {
            const task = await add({ ...data, plannedDate: todayKey() })
            if (plan) await setTasks([...plan.taskIds, task.id])
            setCreating(false)
          }}
        />
      </Modal>

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
