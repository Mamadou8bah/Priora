import { useState, useEffect } from 'react'
import type { Task, Priority, TaskStatus } from '../../types'
import { Button, Input, Textarea, Select } from '../ui'
import { useCategoryStore } from '../../stores/useAppStores'
import { useProjectStore } from '../../stores/useProjectStore'
import { defaultReminderOffsets } from '../../lib/engine'

interface TaskFormProps {
  initial?: Partial<Task>
  defaultStatus?: TaskStatus
  onSubmit: (data: {
    title: string
    description: string
    categoryId: string | null
    projectId: string | null
    priority: Priority
    estimatedMinutes: number | null
    deadline: string | null
    status: TaskStatus
    tags: string[]
    notes: string
    plannedDate: string | null
    reminderOffsets: Task['reminderOffsets']
  }) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

export function TaskForm({
  initial,
  defaultStatus = 'planned',
  onSubmit,
  onCancel,
  submitLabel = 'Save task',
}: TaskFormProps) {
  const { categories } = useCategoryStore()
  const { projects } = useProjectStore()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial?.estimatedMinutes?.toString() ?? '',
  )
  const [deadline, setDeadline] = useState(
    initial?.deadline ? initial.deadline.slice(0, 16) : '',
  )
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? defaultStatus)
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [plannedDate, setPlannedDate] = useState(
    initial?.plannedDate ? initial.plannedDate.slice(0, 10) : '',
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(initial?.title ?? '')
    setDescription(initial?.description ?? '')
    setCategoryId(initial?.categoryId ?? '')
    setProjectId(initial?.projectId ?? '')
    setPriority(initial?.priority ?? 'medium')
    setEstimatedMinutes(initial?.estimatedMinutes?.toString() ?? '')
    setDeadline(initial?.deadline ? initial.deadline.slice(0, 16) : '')
    setStatus(initial?.status ?? defaultStatus)
    setTags(initial?.tags?.join(', ') ?? '')
    setNotes(initial?.notes ?? '')
    setPlannedDate(initial?.plannedDate ? initial.plannedDate.slice(0, 10) : '')
  }, [initial, defaultStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const dl = deadline ? new Date(deadline).toISOString() : null
      await onSubmit({
        title: title.trim(),
        description,
        categoryId: categoryId || null,
        projectId: projectId || null,
        priority,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        deadline: dl,
        status,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notes,
        plannedDate: plannedDate || null,
        reminderOffsets: dl
          ? initial?.reminderOffsets?.length
            ? initial.reminderOffsets
            : defaultReminderOffsets(dl)
          : [],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        autoFocus
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="someday">Someday</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
          <option value="inbox">Inbox</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No project</option>
          {projects
            .filter((p) => p.status === 'active')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Est. minutes"
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted">Deadline</label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Planned date</label>
        <Input
          type="date"
          value={plannedDate}
          onChange={(e) => setPlannedDate(e.target.value)}
        />
      </div>
      <Input
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <Textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="sticky bottom-0 z-10 -mx-1 mt-1 flex justify-end gap-2 bg-[linear-gradient(to_top,var(--card-solid)_55%,transparent)] pt-4 pb-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
