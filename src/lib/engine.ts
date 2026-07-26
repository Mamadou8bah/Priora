import type { Task, Project, Recommendation, Priority } from '../types'
import { daysUntil, isOverdue, parseISO } from './dates'

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 70,
  medium: 40,
  low: 15,
  someday: 5,
}

export function scoreTask(task: Task, project?: Project | null): number {
  if (task.status === 'completed' || task.status === 'cancelled') return -Infinity

  let score = PRIORITY_WEIGHT[task.priority]

  if (isOverdue(task.deadline)) {
    score += 80
  } else if (task.deadline) {
    const days = daysUntil(task.deadline) ?? 99
    if (days <= 0) score += 60
    else if (days === 1) score += 45
    else if (days <= 3) score += 30
    else if (days <= 7) score += 15
  }

  if (task.status === 'in_progress') score += 25
  if (task.status === 'blocked' || task.status === 'waiting') score -= 20

  if (project) {
    score += project.importance * 5
    if (project.deadline) {
      const pdays = daysUntil(project.deadline) ?? 99
      if (pdays <= 7) score += 20
    }
  }

  if (task.estimatedMinutes && task.estimatedMinutes <= 30) score += 8

  return score
}

export function buildReason(task: Task, project?: Project | null): string {
  const parts: string[] = []

  if (isOverdue(task.deadline)) {
    parts.push('Overdue')
  } else if (task.deadline) {
    const days = daysUntil(task.deadline)
    if (days === 0) parts.push('Due today')
    else if (days === 1) parts.push('Deadline tomorrow')
    else if (days != null && days <= 3) parts.push(`Due in ${days} days`)
  }

  if (task.priority === 'critical' || task.priority === 'high') {
    parts.push(`${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} priority`)
  }

  if (task.estimatedMinutes) {
    const h = Math.floor(task.estimatedMinutes / 60)
    const m = task.estimatedMinutes % 60
    parts.push(h > 0 ? `~${h}h${m ? ` ${m}m` : ''}` : `~${m} min`)
  }

  if (project) parts.push(project.title)
  if (task.status === 'in_progress') parts.push('Already in progress')

  return parts.join(' · ') || 'Ready to work on'
}

export function recommendNext(
  tasks: Task[],
  projects: Project[],
  availableMinutes?: number,
): Recommendation | null {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const candidates = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.status !== 'blocked' &&
      t.priority !== 'someday',
  )

  if (candidates.length === 0) return null

  let filtered = candidates
  if (availableMinutes != null) {
    const fitting = candidates.filter(
      (t) => !t.estimatedMinutes || t.estimatedMinutes <= availableMinutes + 15,
    )
    if (fitting.length > 0) filtered = fitting
  }

  const scored = filtered
    .map((task) => {
      const project = task.projectId ? projectMap.get(task.projectId) : null
      return {
        task,
        score: scoreTask(task, project),
        reason: buildReason(task, project),
      }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0] ?? null
}

export function suggestDailyPlan(tasks: Task[], maxTasks = 5): Task[] {
  return [...tasks]
    .filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        t.status !== 'blocked',
    )
    .sort((a, b) => scoreTask(b) - scoreTask(a))
    .slice(0, maxTasks)
}

export function productivityScore(params: {
  completedToday: number
  dailyGoal: number
  overdueCount: number
  focusMinutesToday: number
}): number {
  const { completedToday, dailyGoal, overdueCount, focusMinutesToday } = params
  const completion = Math.min(completedToday / Math.max(dailyGoal, 1), 1) * 50
  const focus = Math.min(focusMinutesToday / 120, 1) * 30
  const overduePenalty = Math.min(overdueCount * 5, 20)
  return Math.round(Math.max(0, Math.min(100, completion + focus + 20 - overduePenalty)))
}

export function xpForTask(task: Task): number {
  const base = { critical: 50, high: 35, medium: 20, low: 10, someday: 5 }[task.priority]
  const durationBonus = Math.min((task.estimatedMinutes ?? 0) / 10, 15)
  return Math.round(base + durationBonus)
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

export function defaultReminderOffsets(deadline: string) {
  const dl = parseISO(deadline).getTime()
  const now = Date.now()
  const offsets = [
    { label: '30 minutes before', offsetMinutes: -30 },
    { label: '2 hours before', offsetMinutes: -120 },
    { label: '1 day before', offsetMinutes: -24 * 60 },
    { label: 'At deadline', offsetMinutes: 0 },
    { label: '30 min overdue', offsetMinutes: 30 },
    { label: '2 hours overdue', offsetMinutes: 120 },
  ]

  return offsets
    .map((o) => ({
      id: crypto.randomUUID(),
      ...o,
    }))
    .filter((o) => dl + o.offsetMinutes * 60_000 > now - 60_000)
}
