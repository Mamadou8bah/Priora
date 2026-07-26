import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, Plus } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useCategoryStore } from '../stores/useAppStores'
import { Button, EmptyState, Input, Modal, PageHeader, ProgressBar, Select, Textarea } from '../components/ui'
import { formatRelativeDate } from '../lib/dates'
import type { Project } from '../types'

export function ProjectsPage() {
  const { projects, add, update, remove } = useProjectStore()
  const tasks = useTaskStore((s) => s.tasks)
  const categories = useCategoryStore((s) => s.categories)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [importance, setImportance] = useState('3')
  const [deadline, setDeadline] = useState('')

  function resetForm() {
    setTitle('')
    setDescription('')
    setCategoryId('')
    setImportance('3')
    setDeadline('')
  }

  function openEdit(p: Project) {
    setEditing(p)
    setTitle(p.title)
    setDescription(p.description)
    setCategoryId(p.categoryId ?? '')
    setImportance(String(p.importance))
    setDeadline(p.deadline ? p.deadline.slice(0, 10) : '')
  }

  const progressMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const p of projects) {
      const pts = tasks.filter((t) => t.projectId === p.id && t.status !== 'cancelled')
      const done = pts.filter((t) => t.status === 'completed').length
      map.set(p.id, { total: pts.length, done })
    }
    return map
  }, [projects, tasks])

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Break big work into clear progress"
        actions={
          <Button
            onClick={() => {
              resetForm()
              setOpen(true)
            }}
          >
            <Plus size={16} /> New
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects"
          description="Group related tasks under a project so progress stays visible."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Create project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p) => {
            const prog = progressMap.get(p.id) ?? { total: 0, done: 0 }
            const pct = prog.total ? (prog.done / prog.total) * 100 : 0
            return (
              <div key={p.id} className="surface rounded-2xl p-4 relative">
                <button
                  type="button"
                  className="absolute top-3 right-3 p-2 rounded-xl text-muted hover:bg-accent-soft hover:text-[var(--fg)]"
                  aria-label={`Edit ${p.title}`}
                  onClick={() => openEdit(p)}
                >
                  <MoreHorizontal size={16} />
                </button>
                <Link to={`/projects/${p.id}`} className="block pr-10 hover:opacity-90 transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-lg font-bold" style={{ color: p.color }}>
                      {p.title}
                    </h3>
                    <span className="text-xs text-muted capitalize mt-1">{p.status}</span>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted line-clamp-2 mb-3">{p.description}</p>
                  )}
                  <ProgressBar value={pct} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted">
                    <span>
                      {prog.done}/{prog.total} tasks
                    </span>
                    {p.deadline && <span>Due {formatRelativeDate(p.deadline)}</span>}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={open || !!editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit project' : 'New project'}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!title.trim()) return
            const data = {
              title,
              description,
              categoryId: categoryId || null,
              importance: Number(importance),
              deadline: deadline ? new Date(deadline).toISOString() : null,
            }
            if (editing) {
              await update(editing.id, data)
              setEditing(null)
            } else {
              await add(data)
              setOpen(false)
            }
            resetForm()
          }}
        >
          <Input
            autoFocus
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={importance} onChange={(e) => setImportance(e.target.value)}>
              <option value="1">Importance 1</option>
              <option value="2">Importance 2</option>
              <option value="3">Importance 3</option>
              <option value="4">Importance 4</option>
              <option value="5">Importance 5</option>
            </Select>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted">Deadline</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 justify-end border-t border-[var(--border)] bg-[var(--card)] pt-3 pb-1">
            {editing && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await remove(editing.id)
                  setEditing(null)
                }}
              >
                Delete
              </Button>
            )}
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
