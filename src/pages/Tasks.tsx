import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { Button, EmptyState, Modal, PageHeader, Select } from '../components/ui'
import type { Task } from '../types'

export function TasksPage() {
  const { tasks, add, update, remove } = useTaskStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === 'active') {
        if (t.status === 'completed' || t.status === 'cancelled') return false
      } else if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${filtered.length} shown`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New task
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <Select
          className="w-auto min-w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="all">All statuses</option>
          <option value="inbox">Inbox</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </Select>
        <Select
          className="w-auto min-w-36"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="someday">Someday</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create a task or convert something from your inbox."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Create task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New task" wide>
        <TaskForm
          onCancel={() => setOpen(false)}
          submitLabel="Create task"
          onSubmit={async (data) => {
            await add(data)
            setOpen(false)
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit task" wide>
        {editing && (
          <div className="space-y-4">
            <TaskForm
              initial={editing}
              onCancel={() => setEditing(null)}
              onSubmit={async (data) => {
                await update(editing.id, data)
                setEditing(null)
              }}
            />
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                await remove(editing.id)
                setEditing(null)
              }}
            >
              Delete task
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
