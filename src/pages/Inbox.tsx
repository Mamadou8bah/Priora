import { useState } from 'react'
import { ArrowRight, Trash2, CheckSquare, FolderKanban } from 'lucide-react'
import { useInboxStore } from '../stores/useAppStores'
import { useTaskStore } from '../stores/useTaskStore'
import { useProjectStore } from '../stores/useProjectStore'
import { QuickCapture } from '../components/tasks/TaskCard'
import { Button, EmptyState, Modal, PageHeader } from '../components/ui'
import { formatRelativeDate } from '../lib/dates'
import type { InboxItem } from '../types'

export function InboxPage() {
  const { items, add, remove, convert } = useInboxStore()
  const addTask = useTaskStore((s) => s.add)
  const addProject = useProjectStore((s) => s.add)
  const [converting, setConverting] = useState<InboxItem | null>(null)

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Brain dump first. Organise later."
      />

      <QuickCapture
        placeholder="Dump an idea…"
        onCapture={async (text) => {
          await add(text)
        }}
      />

      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <EmptyState
            title="Inbox zero"
            description="Capture anything that crosses your mind. Convert items into tasks or projects when ready."
          />
        ) : (
          items.map((item) => (
            <div key={item.id} className="surface rounded-2xl p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-snug">{item.content}</p>
                <p className="text-xs text-muted mt-1">
                  {formatRelativeDate(item.createdAt)}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="Convert"
                  onClick={() => setConverting(item)}
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={!!converting}
        onClose={() => setConverting(null)}
        title="Convert inbox item"
      >
        {converting && (
          <div className="space-y-3">
            <p className="text-sm text-muted mb-4">"{converting.content}"</p>
            <Button
              className="w-full justify-start"
              variant="secondary"
              onClick={async () => {
                const task = await addTask({
                  title: converting.content,
                  status: 'planned',
                })
                await convert(converting.id, 'task', task.id)
                setConverting(null)
              }}
            >
              <CheckSquare size={16} /> Convert to task
            </Button>
            <Button
              className="w-full justify-start"
              variant="secondary"
              onClick={async () => {
                const project = await addProject({ title: converting.content })
                await convert(converting.id, 'project', project.id)
                setConverting(null)
              }}
            >
              <FolderKanban size={16} /> Convert to project
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
