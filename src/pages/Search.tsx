import { useMemo, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTaskStore } from '../stores/useTaskStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useCategoryStore, useInboxStore } from '../stores/useAppStores'
import { Input, Modal, PageHeader } from '../components/ui'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import type { Task } from '../types'

export function SearchPage() {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const tasks = useTaskStore((s) => s.tasks)
  const update = useTaskStore((s) => s.update)
  const projects = useProjectStore((s) => s.projects)
  const categories = useCategoryStore((s) => s.categories)
  const inbox = useInboxStore((s) => s.items)

  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (!query) return { tasks: [], projects: [], categories: [], inbox: [] }
    return {
      tasks: tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          t.notes.toLowerCase().includes(query),
      ),
      projects: projects.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      ),
      categories: categories.filter((c) => c.name.toLowerCase().includes(query)),
      inbox: inbox.filter((i) => i.content.toLowerCase().includes(query)),
    }
  }, [query, tasks, projects, categories, inbox])

  const total =
    results.tasks.length +
    results.projects.length +
    results.categories.length +
    results.inbox.length

  return (
    <div>
      <PageHeader title="Search" subtitle="Find tasks, projects, tags & more" />

      <div className="relative mb-6">
        <SearchIcon
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          autoFocus
          className="pl-10"
          placeholder="Search everything…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {!query ? (
        <p className="text-muted text-sm text-center py-12">
          Type to search across your local Priora data.
        </p>
      ) : total === 0 ? (
        <p className="text-muted text-sm text-center py-12">No matches for “{q}”.</p>
      ) : (
        <div className="space-y-6">
          {results.tasks.length > 0 && (
            <section>
              <h2 className="font-display font-bold mb-2">Tasks ({results.tasks.length})</h2>
              <div className="space-y-2">
                {results.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} compact onEdit={setEditing} />
                ))}
              </div>
            </section>
          )}
          {results.projects.length > 0 && (
            <section>
              <h2 className="font-display font-bold mb-2">
                Projects ({results.projects.length})
              </h2>
              <div className="space-y-2">
                {results.projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="block surface rounded-2xl p-3 font-medium"
                    style={{ color: p.color }}
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.categories.length > 0 && (
            <section>
              <h2 className="font-display font-bold mb-2">
                Categories ({results.categories.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/categories"
                    className="px-3 py-1.5 rounded-xl text-sm"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.inbox.length > 0 && (
            <section>
              <h2 className="font-display font-bold mb-2">Inbox ({results.inbox.length})</h2>
              <div className="space-y-2">
                {results.inbox.map((i) => (
                  <Link
                    key={i.id}
                    to="/inbox"
                    className="block surface rounded-2xl p-3 text-sm"
                  >
                    {i.content}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
