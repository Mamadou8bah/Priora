import { create } from 'zustand'
import { db } from '../db'
import { nowISO, uid } from '../lib/dates'

interface FocusState {
  taskId: string | null
  durationMinutes: number
  remainingSeconds: number
  running: boolean
  sessionId: string | null
  mode: 'focus' | 'break'
  setTask: (taskId: string | null) => void
  setDuration: (minutes: number) => void
  start: () => Promise<void>
  pause: () => void
  resume: () => void
  tick: () => void
  complete: () => Promise<void>
  reset: () => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  taskId: null,
  durationMinutes: 25,
  remainingSeconds: 25 * 60,
  running: false,
  sessionId: null,
  mode: 'focus',

  setTask: (taskId) => set({ taskId }),

  setDuration: (minutes) =>
    set({
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      running: false,
    }),

  start: async () => {
    const { taskId, durationMinutes } = get()
    const session = {
      id: uid(),
      taskId,
      durationMinutes,
      elapsedSeconds: 0,
      completed: false,
      startedAt: nowISO(),
      endedAt: null,
    }
    await db.focusSessions.add(session)
    set({
      sessionId: session.id,
      remainingSeconds: durationMinutes * 60,
      running: true,
      mode: 'focus',
    })
  },

  pause: () => set({ running: false }),
  resume: () => set({ running: true }),

  tick: () => {
    const { remainingSeconds, running } = get()
    if (!running) return
    if (remainingSeconds <= 1) {
      get().complete()
      return
    }
    set({ remainingSeconds: remainingSeconds - 1 })
  },

  complete: async () => {
    const { sessionId, durationMinutes, remainingSeconds, taskId } = get()
    const elapsed = durationMinutes * 60 - remainingSeconds
    if (sessionId) {
      await db.focusSessions.update(sessionId, {
        completed: true,
        elapsedSeconds: elapsed,
        endedAt: nowISO(),
      })
    }
    const minutes = Math.max(1, Math.round(elapsed / 60))
    const stats = await db.stats.get('main')
    if (stats) {
      await db.stats.update('main', {
        focusMinutes: stats.focusMinutes + minutes,
      })
    }
    if (taskId) {
      const task = await db.tasks.get(taskId)
      if (task && task.status !== 'completed') {
        await db.tasks.update(taskId, { status: 'in_progress' })
      }
    }
    const { useGameStore } = await import('./useGameStore')
    await useGameStore.getState().onFocusCompleted(minutes)
    set({ running: false, remainingSeconds: 0, mode: 'break' })
  },

  reset: () => {
    const { durationMinutes } = get()
    set({
      running: false,
      remainingSeconds: durationMinutes * 60,
      sessionId: null,
      mode: 'focus',
    })
  },
}))
