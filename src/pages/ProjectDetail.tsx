import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { Button, EmptyState, Modal, ProgressBar } from '../components/ui'
import type { Task } from '../types'

export function ProjectDetailPage() {
  const { id } = useParams()
  const projects = useProjectStore((s) => s.projects)
  const { tasks, add, update } = useTaskStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const project = projects.find((p) => p.id === id)
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id && t.status !== 'cancelled'),
    [tasks, id],
  )
  const done = projectTasks.filter((t) => t.status === 'completed').length
  const pct = projectTasks.length ? (done / projectTasks.length) * 100 : 0

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        action={
          <Link to="/projects">
            <Button variant="secondary">Back to projects</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--fg)] mb-4"
      >
        <ArrowLeft size={16} /> Projects
      </Link>

      <div className="mb-6">
        <h1
          className="font-display text-3xl font-bold tracking-tight mb-2"
          style={{ color: project.color }}
        >
          {project.title}
        </h1>
        {project.description && (
          <p className="text-muted mb-4">{project.description}</p>
        )}
        <ProgressBar value={pct} className="mb-2" />
        <p className="text-xs text-muted">
          {done} of {projectTasks.length} tasks complete · {Math.round(pct)}%
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-lg font-bold">Tasks</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} /> Add task
        </Button>
      </div>

      <div className="space-y-2">
        {projectTasks.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No tasks in this project yet.</p>
        ) : (
          projectTasks.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} />
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add project task" wide>
        <TaskForm
          initial={{ projectId: project.id }}
          onCancel={() => setOpen(false)}
          submitLabel="Add task"
          onSubmit={async (data) => {
            await add({ ...data, projectId: project.id })
            setOpen(false)
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
