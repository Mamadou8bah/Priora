import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useCategoryStore } from '../stores/useAppStores'
import { Button, EmptyState, Input, Modal, PageHeader } from '../components/ui'

const COLORS = [
  '#0a0a0a',
  '#171717',
  '#262626',
  '#404040',
  '#525252',
  '#737373',
  '#a3a3a3',
  '#d4d4d4',
]

export function CategoriesPage() {
  const { categories, add, remove } = useCategoryStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise work by life area"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Custom
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title="No categories" description="Categories will appear after first launch seed." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="surface rounded-2xl p-4 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl shrink-0"
                style={{ background: `${c.color}33`, border: `2px solid ${c.color}` }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted">{c.isCustom ? 'Custom' : 'Built-in'}</p>
              </div>
              {c.isCustom && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New category">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            await add(name, color)
            setName('')
            setOpen(false)
          }}
        >
          <Input
            autoFocus
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="h-8 w-8 rounded-full transition ring-offset-2"
                style={{
                  background: c,
                  outline: color === c ? `2px solid ${c}` : undefined,
                  outlineOffset: 2,
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </div>
  )
}
