export type TaskStatus =
  | 'inbox'
  | 'planned'
  | 'in_progress'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'someday'

export type ReminderType =
  | 'time'
  | 'date'
  | 'recurring'
  | 'deadline'
  | 'escalation'
  | 'missed'

export interface ReminderOffset {
  id: string
  label: string
  offsetMinutes: number
}

export interface Task {
  id: string
  title: string
  description: string
  categoryId: string | null
  projectId: string | null
  priority: Priority
  estimatedMinutes: number | null
  deadline: string | null
  reminderOffsets: ReminderOffset[]
  status: TaskStatus
  tags: string[]
  notes: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  plannedDate: string | null
  order: number
}

export interface Project {
  id: string
  title: string
  description: string
  categoryId: string | null
  color: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  importance: number
  deadline: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  isCustom: boolean
  createdAt: string
}

export interface InboxItem {
  id: string
  content: string
  createdAt: string
  convertedTo: 'task' | 'project' | 'note' | null
  convertedId: string | null
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  taskId: string | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startAt: string
  endAt: string | null
  allDay: boolean
  taskId: string | null
  reminderOffsets: ReminderOffset[]
  createdAt: string
}

export interface Reminder {
  id: string
  taskId: string | null
  eventId: string | null
  title: string
  body: string
  type: ReminderType
  fireAt: string
  fired: boolean
  snoozedUntil: string | null
  createdAt: string
}

export interface DailyPlan {
  id: string
  date: string
  taskIds: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface FocusSession {
  id: string
  taskId: string | null
  durationMinutes: number
  elapsedSeconds: number
  completed: boolean
  startedAt: string
  endedAt: string | null
}

export interface UserStats {
  id: string
  streak: number
  longestStreak: number
  lastActiveDate: string | null
  xp: number
  level: number
  tasksCompleted: number
  focusMinutes: number
}

export interface Settings {
  id: string
  theme: 'light' | 'dark' | 'system'
  userName: string
  dailyGoal: number
  pomodoroMinutes: number
  shortBreakMinutes: number
  notificationsEnabled: boolean
  weekStartsOn: 0 | 1
}

export interface Recommendation {
  task: Task
  reason: string
  score: number
}

export type AchievementTier = 'common' | 'rare' | 'legendary' | 'mythic'

export interface GameState {
  id: string
  momentum: number
  momentumExpiresAt: string | null
  streakShields: number
  bossesDefeated: number
  arenaBest: number
  arenaRuns: number
  titlesUnlocked: string[]
  activeTitle: string | null
  unlockedAchievements: string[]
  focusSessionsToday: number
  focusSessionsDate: string | null
  perfectDays: number
  maxMomentum: number
  highScores: {
    nback: number
    span: number
    series: number
    matrix: number
    calc: number
    stroop: number
  }
  leisureXpToday: number
  leisureXpDate: string | null
}

export interface Quest {
  id: string
  period: 'daily' | 'weekly'
  periodKey: string
  templateId: string
  title: string
  description: string
  target: number
  progress: number
  xpReward: number
  completed: boolean
  claimed: boolean
}

export interface XpFeedItem {
  id: string
  amount: number
  label: string
  createdAt: string
}

