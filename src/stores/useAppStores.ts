import { create } from 'zustand'
import { db } from '../db'
import type { Category, InboxItem, Settings, UserStats, DailyPlan } from '../types'
import { nowISO, uid, todayKey } from '../lib/dates'

interface CategoryStore {
  categories: Category[]
  load: () => Promise<void>
  add: (name: string, color: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  load: async () => {
    const categories = await db.categories.orderBy('name').toArray()
    set({ categories })
  },
  add: async (name, color) => {
    await db.categories.add({
      id: uid(),
      name: name.trim(),
      color,
      icon: 'tag',
      isCustom: true,
      createdAt: nowISO(),
    })
    await get().load()
  },
  remove: async (id) => {
    const cat = await db.categories.get(id)
    if (!cat?.isCustom) return
    await db.categories.delete(id)
    await get().load()
  },
}))

interface InboxStore {
  items: InboxItem[]
  load: () => Promise<void>
  add: (content: string) => Promise<InboxItem>
  remove: (id: string) => Promise<void>
  convert: (id: string, to: 'task' | 'project', convertedId: string) => Promise<void>
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  items: [],
  load: async () => {
    const items = await db.inbox.orderBy('createdAt').reverse().toArray()
    set({ items: items.filter((i) => !i.convertedTo) })
  },
  add: async (content) => {
    const item: InboxItem = {
      id: uid(),
      content: content.trim(),
      createdAt: nowISO(),
      convertedTo: null,
      convertedId: null,
    }
    await db.inbox.add(item)
    await get().load()
    return item
  },
  remove: async (id) => {
    await db.inbox.delete(id)
    await get().load()
  },
  convert: async (id, to, convertedId) => {
    await db.inbox.update(id, { convertedTo: to, convertedId })
    await get().load()
  },
}))

interface SettingsStore {
  settings: Settings | null
  stats: UserStats | null
  load: () => Promise<void>
  update: (patch: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  stats: null,
  load: async () => {
    const settings = (await db.settings.get('main')) ?? null
    const stats = (await db.stats.get('main')) ?? null
    set({ settings, stats })
  },
  update: async (patch) => {
    await db.settings.update('main', patch)
    await get().load()
  },
}))

interface PlannerStore {
  plan: DailyPlan | null
  load: (date?: string) => Promise<void>
  setTasks: (taskIds: string[]) => Promise<void>
  setNotes: (notes: string) => Promise<void>
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  plan: null,
  load: async (date = todayKey()) => {
    let plan = await db.dailyPlans.where('date').equals(date).first()
    if (!plan) {
      plan = {
        id: uid(),
        date,
        taskIds: [],
        notes: '',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      }
      await db.dailyPlans.add(plan)
    }
    set({ plan })
  },
  setTasks: async (taskIds) => {
    const plan = get().plan
    if (!plan) return
    await db.dailyPlans.update(plan.id, { taskIds, updatedAt: nowISO() })
    await get().load(plan.date)
  },
  setNotes: async (notes) => {
    const plan = get().plan
    if (!plan) return
    await db.dailyPlans.update(plan.id, { notes, updatedAt: nowISO() })
    await get().load(plan.date)
  },
}))
