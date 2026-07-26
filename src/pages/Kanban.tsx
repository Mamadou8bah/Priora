import { useMemo, useState } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { KANBAN_COLUMNS, cn } from '../lib/utils'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { Modal, PageHeader } from '../components/ui'
import type { Task, TaskStatus } from '../types'

const COLUMN_STATUS: Record<string, TaskStatus> = {
  inbox: 'inbox',
  todo: 'planned',
  doing: 'in_progress',
  waiting: 'waiting',
  done: 'completed',
}

export function KanbanPage() {
  const { tasks, setStatus, update } = useTaskStore()
  const [editing, setEditing] = useState<Task | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      tasks: tasks.filter(
        (t) =>
          (col.statuses as readonly string[]).includes(t.status) &&
          t.status !== 'cancelled',
      ),
    }))
  }, [tasks])

  async function onDrop(columnId: string) {
    if (!dragId) return
    const status = COLUMN_STATUS[columnId]
    if (status) await setStatus(dragId, status)
    setDragId(null)
  }

  return (
    <div className="min-h-0">
      <PageHeader title="Board" subtitle="Drag tasks between columns" />

      <div className="board-scroll flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-6 sm:px-6 scrollbar-thin">
        {columns.map((col) => (
          <div
            key={col.id}
            className="board-column w-[min(18rem,calc(100vw-2.5rem))] sm:w-72 shrink-0 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.id)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-display font-bold text-sm">{col.title}</h2>
              <span className="text-xs text-muted bg-accent-soft px-2 py-0.5 rounded-lg">
                {col.tasks.length}
              </span>
            </div>
            <div
              className={cn(
                'flex-1 space-y-2 rounded-2xl p-2 min-h-40 border border-dashed border-app transition',
                dragId && 'bg-accent-soft/40',
              )}
            >
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskCard task={task} onEdit={setEditing} compact />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
