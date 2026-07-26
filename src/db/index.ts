import Dexie, { type EntityTable } from 'dexie'
import type {
  Task,
  Project,
  Category,
  InboxItem,
  Note,
  CalendarEvent,
  Reminder,
  DailyPlan,
  FocusSession,
  UserStats,
  Settings,
  GameState,
  Quest,
  XpFeedItem,
} from '../types'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Education', color: '#0a0a0a', icon: 'graduation-cap', isCustom: false },
  { name: 'Career', color: '#171717', icon: 'briefcase', isCustom: false },
  { name: 'Research', color: '#262626', icon: 'flask', isCustom: false },
  { name: 'Programming', color: '#404040', icon: 'code', isCustom: false },
  { name: 'Finance', color: '#525252', icon: 'wallet', isCustom: false },
  { name: 'Fitness', color: '#0a0a0a', icon: 'dumbbell', isCustom: false },
  { name: 'Health', color: '#171717', icon: 'heart', isCustom: false },
  { name: 'Personal', color: '#262626', icon: 'user', isCustom: false },
  { name: 'Business', color: '#404040', icon: 'building', isCustom: false },
  { name: 'Reading', color: '#525252', icon: 'book', isCustom: false },
  { name: 'Shopping', color: '#737373', icon: 'shopping-bag', isCustom: false },
  { name: 'Family', color: '#0a0a0a', icon: 'home', isCustom: false },
]

const DEFAULT_GAME: GameState = {
  id: 'main',
  momentum: 0,
  momentumExpiresAt: null,
  streakShields: 1,
  bossesDefeated: 0,
  arenaBest: 0,
  arenaRuns: 0,
  titlesUnlocked: [],
  activeTitle: null,
  unlockedAchievements: [],
  focusSessionsToday: 0,
  focusSessionsDate: null,
  perfectDays: 0,
  maxMomentum: 0,
  highScores: { nback: 0, span: 0, series: 0, matrix: 0, calc: 0, stroop: 0 },
  leisureXpToday: 0,
  leisureXpDate: null,
}

class PrioraDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  projects!: EntityTable<Project, 'id'>
  categories!: EntityTable<Category, 'id'>
  inbox!: EntityTable<InboxItem, 'id'>
  notes!: EntityTable<Note, 'id'>
  events!: EntityTable<CalendarEvent, 'id'>
  reminders!: EntityTable<Reminder, 'id'>
  dailyPlans!: EntityTable<DailyPlan, 'id'>
  focusSessions!: EntityTable<FocusSession, 'id'>
  stats!: EntityTable<UserStats, 'id'>
  settings!: EntityTable<Settings, 'id'>
  game!: EntityTable<GameState, 'id'>
  quests!: EntityTable<Quest, 'id'>
  xpFeed!: EntityTable<XpFeedItem, 'id'>

  constructor() {
    super('priora')
    this.version(1).stores({
      tasks: 'id, status, priority, projectId, categoryId, deadline, plannedDate, createdAt, completedAt',
      projects: 'id, status, categoryId, deadline, createdAt',
      categories: 'id, name',
      inbox: 'id, createdAt, convertedTo',
      notes: 'id, taskId, projectId, createdAt',
      events: 'id, startAt, taskId',
      reminders: 'id, fireAt, fired, taskId',
      dailyPlans: 'id, date',
      focusSessions: 'id, taskId, startedAt',
      stats: 'id',
      settings: 'id',
    })
    this.version(2).stores({
      tasks: 'id, status, priority, projectId, categoryId, deadline, plannedDate, createdAt, completedAt, order',
    })
    this.version(3).stores({
      game: 'id',
      quests: 'id, period, periodKey, completed, claimed',
      xpFeed: 'id, createdAt',
    })
  }
}

export const db = new PrioraDB()

export async function seedDatabase() {
  await db.open()

  const catCount = await db.categories.count()
  if (catCount === 0) {
    const now = new Date().toISOString()
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        createdAt: now,
      })),
    )
  } else {
    const existing = await db.categories.filter((c) => !c.isCustom).toArray()
    for (const cat of existing) {
      const match = DEFAULT_CATEGORIES.find((d) => d.name === cat.name)
      if (match && cat.color !== match.color) {
        await db.categories.update(cat.id, { color: match.color })
      }
    }
  }

  const settings = await db.settings.get('main')
  if (!settings) {
    try {
      await db.settings.add({
        id: 'main',
        theme: 'light',
        userName: '',
        dailyGoal: 5,
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        notificationsEnabled: true,
        weekStartsOn: 1,
      })
    } catch {
      /* race */
    }
  }

  const stats = await db.stats.get('main')
  if (!stats) {
    try {
      await db.stats.add({
        id: 'main',
        streak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        xp: 0,
        level: 1,
        tasksCompleted: 0,
        focusMinutes: 0,
      })
    } catch {
      /* race */
    }
  }

  const game = await db.game.get('main')
  if (!game) {
    try {
      await db.game.add({ ...DEFAULT_GAME })
    } catch {
      /* race */
    }
  } else {
    // Backfill leisure fields for existing installs
    const patch: Partial<GameState> = {}
    if (!game.highScores || !('nback' in game.highScores)) {
      patch.highScores = { nback: 0, span: 0, series: 0, matrix: 0, calc: 0, stroop: 0 }
    }
    if (game.leisureXpToday == null) patch.leisureXpToday = 0
    if (game.leisureXpDate === undefined) patch.leisureXpDate = null
    if (Object.keys(patch).length) await db.game.update('main', patch)
  }
}

export { DEFAULT_CATEGORIES, DEFAULT_GAME }
