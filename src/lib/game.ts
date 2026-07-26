import type { AchievementTier, Task } from '../types'
import { isOverdue } from './dates'
import { xpForTask, levelFromXp } from './engine'

export interface Rank {
  level: number
  title: string
  epithet: string
}

export const RANKS: Rank[] = [
  { level: 1, title: 'Ember', epithet: 'The spark begins' },
  { level: 3, title: 'Spark', epithet: 'Heat is rising' },
  { level: 5, title: 'Flame', epithet: 'Consistent burn' },
  { level: 8, title: 'Forgehand', epithet: 'Shaping the work' },
  { level: 12, title: 'Artisan', epithet: 'Precision under pressure' },
  { level: 16, title: 'Adept', epithet: 'Flow on demand' },
  { level: 20, title: 'Vanguard', epithet: 'First into the hard tasks' },
  { level: 25, title: 'Architect', epithet: 'Systems over chaos' },
  { level: 30, title: 'Sovereign', epithet: 'Commands the day' },
  { level: 40, title: 'Mythic', epithet: 'Legend of the forge' },
]

export function rankForLevel(level: number): Rank {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (level >= r.level) current = r
  }
  return current
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.level > level) ?? null
}

export function xpProgressInLevel(xp: number) {
  const level = levelFromXp(xp)
  const currentFloor = Math.pow(level - 1, 2) * 50
  const nextFloor = Math.pow(level, 2) * 50
  const into = xp - currentFloor
  const need = Math.max(nextFloor - currentFloor, 1)
  return { level, into, need, pct: Math.min(100, (into / need) * 100) }
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  tier: AchievementTier
  xp: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Complete your first task', tier: 'common', xp: 25 },
  { id: 'inbox_zero', name: 'Clear Mind', description: 'Reach inbox zero', tier: 'common', xp: 40 },
  { id: 'combo_5', name: 'Momentum x5', description: 'Hit a 5-task combo', tier: 'rare', xp: 80 },
  { id: 'combo_10', name: 'Unstoppable', description: 'Hit a 10-task combo', tier: 'legendary', xp: 200 },
  { id: 'streak_7', name: 'Week of Fire', description: 'Maintain a 7-day streak', tier: 'rare', xp: 100 },
  { id: 'streak_30', name: 'Month Forged', description: 'Maintain a 30-day streak', tier: 'legendary', xp: 300 },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat an overdue critical boss', tier: 'rare', xp: 120 },
  { id: 'boss_hunter', name: 'Boss Hunter', description: 'Defeat 10 bosses', tier: 'legendary', xp: 250 },
  { id: 'deep_focus', name: 'Deep Focus', description: 'Complete 4 focus sessions in one day', tier: 'rare', xp: 100 },
  { id: 'centurion', name: 'Centurion', description: 'Complete 100 tasks', tier: 'legendary', xp: 400 },
  { id: 'dawn', name: 'Dawn Breaker', description: 'Complete a task before 8 AM', tier: 'common', xp: 50 },
  { id: 'night', name: 'Night Forge', description: 'Complete a task after 10 PM', tier: 'common', xp: 50 },
  { id: 'arena_rookie', name: 'Arena Initiate', description: 'Finish your first Arena run', tier: 'common', xp: 60 },
  { id: 'arena_ace', name: 'Arena Ace', description: 'Score 8+ in a single Arena run', tier: 'legendary', xp: 220 },
  { id: 'perfect_day', name: 'Perfect Day', description: 'Hit your daily goal with zero overdue', tier: 'rare', xp: 90 },
  { id: 'shield_used', name: 'Phoenix', description: 'Survive a missed day with a Streak Shield', tier: 'mythic', xp: 150 },
  { id: 'critical_crush', name: 'Critical Crush', description: 'Complete 10 critical tasks', tier: 'rare', xp: 110 },
  { id: 'mythic_rank', name: 'Ascended', description: 'Reach Mythic rank', tier: 'mythic', xp: 500 },
]

export const TITLES = [
  'The Relentless',
  'Glass Phantom',
  'Deadline Reaper',
  'Focus Warden',
  'Inbox Ghost',
  'Streak Keeper',
  'Boss Breaker',
  'Quiet Storm',
]

export function isBossTask(task: Task) {
  return (
    (task.priority === 'critical' || task.priority === 'high') &&
    isOverdue(task.deadline) &&
    task.status !== 'completed' &&
    task.status !== 'cancelled'
  )
}

export function momentumMultiplier(momentum: number) {
  return 1 + Math.min(momentum, 10) * 0.15
}

export function rewardForTask(task: Task, momentum: number) {
  let base = xpForTask(task)
  const wasBoss =
    (task.priority === 'critical' || task.priority === 'high') && isOverdue(task.deadline)
  if (wasBoss) base = Math.round(base * 2.2)
  const mult = momentumMultiplier(momentum)
  const xp = Math.round(base * mult)
  return { xp, wasBoss, mult, base }
}

export type QuestTemplate = {
  id: string
  period: 'daily' | 'weekly'
  title: string
  description: string
  target: number
  xpReward: number
  metric:
    | 'tasks'
    | 'focus'
    | 'boss'
    | 'high'
    | 'inbox_clear'
    | 'combo'
    | 'streak_keep'
}

export const QUEST_POOL: QuestTemplate[] = [
  {
    id: 'd_tasks_3',
    period: 'daily',
    title: 'Triad',
    description: 'Complete 3 tasks today',
    target: 3,
    xpReward: 60,
    metric: 'tasks',
  },
  {
    id: 'd_tasks_5',
    period: 'daily',
    title: 'Full Quiver',
    description: 'Complete 5 tasks today',
    target: 5,
    xpReward: 100,
    metric: 'tasks',
  },
  {
    id: 'd_focus_1',
    period: 'daily',
    title: 'Enter the Deep',
    description: 'Finish 1 focus session',
    target: 1,
    xpReward: 50,
    metric: 'focus',
  },
  {
    id: 'd_focus_2',
    period: 'daily',
    title: 'Double Session',
    description: 'Finish 2 focus sessions',
    target: 2,
    xpReward: 90,
    metric: 'focus',
  },
  {
    id: 'd_boss',
    period: 'daily',
    title: 'Hunt a Boss',
    description: 'Defeat 1 overdue boss task',
    target: 1,
    xpReward: 120,
    metric: 'boss',
  },
  {
    id: 'd_high',
    period: 'daily',
    title: 'High Stakes',
    description: 'Complete 2 high or critical tasks',
    target: 2,
    xpReward: 80,
    metric: 'high',
  },
  {
    id: 'd_combo',
    period: 'daily',
    title: 'Keep the Heat',
    description: 'Reach momentum x3',
    target: 3,
    xpReward: 70,
    metric: 'combo',
  },
  {
    id: 'w_tasks_20',
    period: 'weekly',
    title: 'Weekly Raid',
    description: 'Complete 20 tasks this week',
    target: 20,
    xpReward: 350,
    metric: 'tasks',
  },
  {
    id: 'w_focus_5',
    period: 'weekly',
    title: 'Temple of Focus',
    description: 'Complete 5 focus sessions this week',
    target: 5,
    xpReward: 280,
    metric: 'focus',
  },
  {
    id: 'w_boss_3',
    period: 'weekly',
    title: 'Boss Gauntlet',
    description: 'Defeat 3 bosses this week',
    target: 3,
    xpReward: 400,
    metric: 'boss',
  },
  {
    id: 'w_streak',
    period: 'weekly',
    title: 'Unbroken Week',
    description: 'Reach a 5-day streak',
    target: 5,
    xpReward: 300,
    metric: 'streak_keep',
  },
]

function hashSeed(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function pickQuests(periodKey: string, period: 'daily' | 'weekly', count: number) {
  const pool = QUEST_POOL.filter((q) => q.period === period)
  const seed = hashSeed(periodKey + period)
  const shuffled = [...pool].sort((a, b) => {
    const ha = hashSeed(a.id + seed)
    const hb = hashSeed(b.id + seed)
    return ha - hb
  })
  return shuffled.slice(0, count)
}

export function weekKey(d = new Date()) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export { levelFromXp }
