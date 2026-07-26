import { create } from 'zustand'
import { db } from '../db'
import type { Project } from '../types'
import { nowISO, uid } from '../lib/dates'

interface ProjectInput {
  title: string
  description?: string
  categoryId?: string | null
  color?: string
  importance?: number
  deadline?: string | null
}

interface ProjectStore {
  projects: Project[]
  loading: boolean
  load: () => Promise<void>
  add: (input: ProjectInput) => Promise<Project>
  update: (id: string, patch: Partial<Project>) => Promise<void>
  remove: (id: string) => Promise<void>
}

const COLORS = ['#0a0a0a', '#171717', '#262626', '#404040', '#525252', '#737373', '#a3a3a3']

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: true,

  load: async () => {
    const projects = await db.projects.orderBy('createdAt').reverse().toArray()
    set({ projects, loading: false })
  },

  add: async (input) => {
    const project: Project = {
      id: uid(),
      title: input.title.trim(),
      description: input.description ?? '',
      categoryId: input.categoryId ?? null,
      color: input.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      status: 'active',
      importance: input.importance ?? 3,
      deadline: input.deadline ?? null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    await db.projects.add(project)
    await get().load()
    return project
  },

  update: async (id, patch) => {
    await db.projects.update(id, { ...patch, updatedAt: nowISO() })
    await get().load()
  },

  remove: async (id) => {
    await db.projects.delete(id)
    const tasks = await db.tasks.where('projectId').equals(id).toArray()
    for (const t of tasks) {
      await db.tasks.update(t.id, { projectId: null })
    }
    await get().load()
  },
}))
