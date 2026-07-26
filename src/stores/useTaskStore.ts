import { create } from 'zustand'
import { db } from '../db'
import type { Task, TaskStatus, Priority, ReminderOffset } from '../types'
import { nowISO, uid } from '../lib/dates'
import { scheduleRemindersForTask } from '../lib/reminders'
import { xpForTask, levelFromXp } from '../lib/engine'
import { todayKey } from '../lib/dates'

interface TaskInput {
  title: string
  description?: string
  categoryId?: string | null
  projectId?: string | null
  priority?: Priority
  estimatedMinutes?: number | null
  deadline?: string | null
  reminderOffsets?: ReminderOffset[]
  status?: TaskStatus
  tags?: string[]
  notes?: string
  plannedDate?: string | null
}

interface TaskStore {
  tasks: Task[]
  loading: boolean
  load: () => Promise<void>
  add: (input: TaskInput) => Promise<Task>
  update: (id: string, patch: Partial<Task>) => Promise<void>
  remove: (id: string) => Promise<void>
  complete: (id: string) => Promise<void>
  setStatus: (id: string, status: TaskStatus) => Promise<void>
  reorder: (ids: string[]) => Promise<void>
}

async function bumpStats(task: Task) {
  const stats = await db.stats.get('main')
  if (!stats) return
  const xp = stats.xp + xpForTask(task)
  const today = todayKey()
  let streak = stats.streak
  let longest = stats.longestStreak
  if (stats.lastActiveDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = yesterday.toISOString().slice(0, 10)
    streak = stats.lastActiveDate === yKey ? streak + 1 : 1
    longest = Math.max(longest, streak)
  }
  await db.stats.update('main', {
    xp,
    level: levelFromXp(xp),
    tasksCompleted: stats.tasksCompleted + 1,
    streak,
    longestStreak: longest,
    lastActiveDate: today,
  })
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: true,

  load: async () => {
    const tasks = await db.tasks.toArray()
    tasks.sort((a, b) => a.order - b.order)
    set({ tasks, loading: false })
  },

  add: async (input) => {
    const count = await db.tasks.count()
    const task: Task = {
      id: uid(),
      title: input.title.trim(),
      description: input.description ?? '',
      categoryId: input.categoryId ?? null,
      projectId: input.projectId ?? null,
      priority: input.priority ?? 'medium',
      estimatedMinutes: input.estimatedMinutes ?? null,
      deadline: input.deadline ?? null,
      reminderOffsets: input.reminderOffsets ?? [],
      status: input.status ?? 'planned',
      tags: input.tags ?? [],
      notes: input.notes ?? '',
      completedAt: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      plannedDate: input.plannedDate ?? null,
      order: count,
    }
    await db.tasks.add(task)
    if (task.deadline) await scheduleRemindersForTask(task)
    await get().load()
    return task
  },

  update: async (id, patch) => {
    await db.tasks.update(id, { ...patch, updatedAt: nowISO() })
    const task = await db.tasks.get(id)
    if (task && (patch.deadline !== undefined || patch.reminderOffsets !== undefined)) {
      await scheduleRemindersForTask(task)
    }
    await get().load()
  },

  remove: async (id) => {
    await db.tasks.delete(id)
    await db.reminders.where('taskId').equals(id).delete()
    await get().load()
  },

  complete: async (id) => {
    const task = await db.tasks.get(id)
    if (!task || task.status === 'completed') return
    await db.tasks.update(id, {
      status: 'completed',
      completedAt: nowISO(),
      updatedAt: nowISO(),
    })
    await bumpStats(task)
    const { useGameStore } = await import('./useGameStore')
    await useGameStore.getState().onTaskCompleted(task)
    await get().load()
  },

  setStatus: async (id, status) => {
    if (status === 'completed') {
      await get().complete(id)
      return
    }
    await db.tasks.update(id, {
      status,
      completedAt: null,
      updatedAt: nowISO(),
    })
    await get().load()
  },

  reorder: async (ids) => {
    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.tasks.update(ids[i], { order: i })
      }
    })
    await get().load()
  },
}))
