import { create } from 'zustand'
import { db } from '../db'
import type { GameState, Quest, Task, XpFeedItem } from '../types'
import { isOverdue, nowISO, todayKey, uid } from '../lib/dates'
import {
  ACHIEVEMENTS,
  TITLES,
  levelFromXp,
  pickQuests,
  rankForLevel,
  rewardForTask,
  weekKey,
  type QuestTemplate,
} from '../lib/game'
import { useSettingsStore } from './useAppStores'

const MOMENTUM_WINDOW_MS = 45 * 60 * 1000

export type ToastEvent =
  | { kind: 'xp'; amount: number; label: string; mult?: number }
  | { kind: 'level'; level: number; title: string }
  | { kind: 'achievement'; name: string; tier: string }
  | { kind: 'boss'; name: string }
  | { kind: 'combo'; momentum: number }

interface GameStore {
  game: GameState | null
  quests: Quest[]
  feed: XpFeedItem[]
  toasts: Array<ToastEvent & { id: string }>
  load: () => Promise<void>
  ensureQuests: () => Promise<void>
  dismissToast: (id: string) => void
  onTaskCompleted: (task: Task) => Promise<void>
  onFocusCompleted: (minutes: number) => Promise<void>
  claimQuest: (id: string) => Promise<void>
  setTitle: (title: string | null) => Promise<void>
  recordArena: (score: number) => Promise<void>
  recordLeisure: (
    gameId: keyof NonNullable<GameState['highScores']>,
    score: number,
    opts?: { lowerIsBetter?: boolean },
  ) => Promise<void>
  checkStreakShield: () => Promise<void>
}

function pushToast(
  set: (fn: (s: GameStore) => Partial<GameStore>) => void,
  event: ToastEvent,
) {
  const id = uid()
  set((s) => ({ toasts: [...s.toasts, { ...event, id }].slice(-5) }))
  window.setTimeout(() => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  }, 4200)
}

async function addXp(amount: number, label: string) {
  if (amount <= 0) return { leveled: false, level: 1, prev: 1 }
  const stats = await db.stats.get('main')
  if (!stats) return { leveled: false, level: 1, prev: 1 }
  const prev = stats.level
  const xp = stats.xp + amount
  const level = levelFromXp(xp)
  await db.stats.update('main', { xp, level })
  await db.xpFeed.add({ id: uid(), amount, label, createdAt: nowISO() })
  const feedCount = await db.xpFeed.count()
  if (feedCount > 40) {
    const old = await db.xpFeed.orderBy('createdAt').limit(feedCount - 40).toArray()
    await db.xpFeed.bulkDelete(old.map((o) => o.id))
  }
  return { leveled: level > prev, level, prev }
}

async function unlockAchievement(id: string, game: GameState) {
  if (game.unlockedAchievements.includes(id)) return null
  const def = ACHIEVEMENTS.find((a) => a.id === id)
  if (!def) return null
  const unlocked = [...game.unlockedAchievements, id]
  let titles = game.titlesUnlocked
  if (def.tier === 'legendary' || def.tier === 'mythic') {
    const title = TITLES[unlocked.length % TITLES.length]
    if (!titles.includes(title)) titles = [...titles, title]
  }
  await db.game.update('main', {
    unlockedAchievements: unlocked,
    titlesUnlocked: titles,
  })
  if (def.xp) await addXp(def.xp, `Achievement · ${def.name}`)
  return def
}

async function bumpQuest(
  metric: QuestTemplate['metric'],
  amount: number,
  extra?: { streak?: number; momentum?: number },
) {
  const { QUEST_POOL } = await import('../lib/game')
  const all = await db.quests.toArray()
  for (const q of all) {
    if (q.claimed) continue
    const template = QUEST_POOL.find((t) => t.id === q.templateId)
    if (!template || template.metric !== metric) continue

    let progress = q.progress
    if (metric === 'combo') {
      progress = Math.max(progress, extra?.momentum ?? amount)
    } else if (metric === 'streak_keep') {
      progress = Math.max(progress, extra?.streak ?? amount)
    } else {
      progress = Math.min(q.target, q.progress + amount)
    }

    await db.quests.update(q.id, {
      progress,
      completed: progress >= q.target,
    })
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  quests: [],
  feed: [],
  toasts: [],

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  load: async () => {
    let game = (await db.game.get('main')) ?? null
    if (!game) {
      const { DEFAULT_GAME } = await import('../db')
      await db.game.put({ ...DEFAULT_GAME })
      game = (await db.game.get('main')) ?? null
    }
    // Decay momentum if expired
    if (game?.momentumExpiresAt && game.momentumExpiresAt < nowISO()) {
      await db.game.update('main', { momentum: 0, momentumExpiresAt: null })
      game = { ...game, momentum: 0, momentumExpiresAt: null }
    }
    const quests = await db.quests.toArray()
    const feed = await db.xpFeed.orderBy('createdAt').reverse().limit(12).toArray()
    set({ game, quests, feed })
    await get().ensureQuests()
    await get().checkStreakShield()
  },

  ensureQuests: async () => {
    const day = todayKey()
    const week = weekKey()
    const existing = await db.quests.toArray()
    const hasDaily = existing.some((q) => q.period === 'daily' && q.periodKey === day)
    const hasWeekly = existing.some((q) => q.period === 'weekly' && q.periodKey === week)

    if (!hasDaily) {
      await db.quests.where('period').equals('daily').delete()
      const picks = pickQuests(day, 'daily', 3)
      await db.quests.bulkAdd(
        picks.map((t) => ({
          id: uid(),
          period: 'daily' as const,
          periodKey: day,
          templateId: t.id,
          title: t.title,
          description: t.description,
          target: t.target,
          progress: 0,
          xpReward: t.xpReward,
          completed: false,
          claimed: false,
        })),
      )
    }
    if (!hasWeekly) {
      await db.quests.filter((q) => q.period === 'weekly' && q.periodKey !== week).delete()
      const still = await db.quests.where('period').equals('weekly').count()
      if (still === 0) {
        const picks = pickQuests(week, 'weekly', 2)
        await db.quests.bulkAdd(
          picks.map((t) => ({
            id: uid(),
            period: 'weekly' as const,
            periodKey: week,
            templateId: t.id,
            title: t.title,
            description: t.description,
            target: t.target,
            progress: 0,
            xpReward: t.xpReward,
            completed: false,
            claimed: false,
          })),
        )
      }
    }
    const quests = await db.quests.toArray()
    set({ quests })
  },

  checkStreakShield: async () => {
    const stats = await db.stats.get('main')
    const game = await db.game.get('main')
    if (!stats || !game || !stats.lastActiveDate) return
    const today = todayKey()
    if (stats.lastActiveDate === today) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = yesterday.toISOString().slice(0, 10)
    if (stats.lastActiveDate === yKey) return
    // Missed more than yesterday — try shield
    if (game.streakShields > 0 && stats.streak > 0) {
      await db.game.update('main', { streakShields: game.streakShields - 1 })
      await db.stats.update('main', { lastActiveDate: yKey })
      const def = await unlockAchievement('shield_used', {
        ...game,
        streakShields: game.streakShields - 1,
      })
      if (def) {
        pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
      }
      pushToast(set, { kind: 'xp', amount: 0, label: 'Streak Shield saved your flame' })
      await useSettingsStore.getState().load()
      await get().load()
    }
  },

  onTaskCompleted: async (task) => {
    let game = (await db.game.get('main'))!
    const now = Date.now()
    let momentum = game.momentum
    if (game.momentumExpiresAt && new Date(game.momentumExpiresAt).getTime() < now) {
      momentum = 0
    }
    momentum = Math.min(10, momentum + 1)
    const expires = new Date(now + MOMENTUM_WINDOW_MS).toISOString()
    const { xp, wasBoss, mult } = rewardForTask(task, momentum - 1)

    const patch: Partial<GameState> = {
      momentum,
      momentumExpiresAt: expires,
      maxMomentum: Math.max(game.maxMomentum, momentum),
    }
    if (wasBoss) {
      patch.bossesDefeated = game.bossesDefeated + 1
      pushToast(set, { kind: 'boss', name: task.title })
    }

    await db.game.update('main', patch)
    game = { ...game, ...patch } as GameState

    const levelResult = await addXp(xp, wasBoss ? `Boss · ${task.title}` : task.title)
    pushToast(set, {
      kind: 'xp',
      amount: xp,
      label: wasBoss ? 'Boss defeated' : 'Task complete',
      mult,
    })
    if (momentum >= 3) {
      pushToast(set, { kind: 'combo', momentum })
    }

    const stats = await db.stats.get('main')
    if (levelResult.leveled && stats) {
      const rank = rankForLevel(levelResult.level)
      pushToast(set, { kind: 'level', level: levelResult.level, title: rank.title })
      if (rank.title === 'Mythic') {
        await unlockAchievement('mythic_rank', game)
      }
    }

    // Achievements
    const checks: string[] = []
    if ((stats?.tasksCompleted ?? 0) >= 1) checks.push('first_blood')
    if ((stats?.tasksCompleted ?? 0) >= 100) checks.push('centurion')
    if (momentum >= 5) checks.push('combo_5')
    if (momentum >= 10) checks.push('combo_10')
    if ((stats?.streak ?? 0) >= 7) checks.push('streak_7')
    if ((stats?.streak ?? 0) >= 30) checks.push('streak_30')
    if (wasBoss) checks.push('boss_slayer')
    if ((patch.bossesDefeated ?? game.bossesDefeated) >= 10) checks.push('boss_hunter')
    const hour = new Date().getHours()
    if (hour < 8) checks.push('dawn')
    if (hour >= 22) checks.push('night')

    const inboxOpen = await db.inbox.filter((i) => !i.convertedTo).count()
    if (inboxOpen === 0) checks.push('inbox_zero')

    for (const id of checks) {
      const fresh = (await db.game.get('main'))!
      const def = await unlockAchievement(id, fresh)
      if (def) pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
    }

    // Streak shields earn every 7 streak
    if (stats && stats.streak > 0 && stats.streak % 7 === 0) {
      const g = await db.game.get('main')
      if (g) await db.game.update('main', { streakShields: Math.min(3, g.streakShields + 1) })
    }

    await bumpQuest('tasks', 1)
    if (wasBoss) await bumpQuest('boss', 1)
    if (task.priority === 'high' || task.priority === 'critical') await bumpQuest('high', 1)
    await bumpQuest('combo', momentum, { momentum })
    if (stats) await bumpQuest('streak_keep', stats.streak, { streak: stats.streak })

    // Perfect day check
    const settings = await db.settings.get('main')
    const completedToday = await db.tasks
      .filter((t) => !!t.completedAt && t.completedAt.startsWith(todayKey()))
      .count()
    const overdueLeft = await db.tasks
      .filter(
        (t) =>
          t.status !== 'completed' &&
          t.status !== 'cancelled' &&
          isOverdue(t.deadline),
      )
      .count()
    if (
      settings &&
      completedToday >= settings.dailyGoal &&
      overdueLeft === 0
    ) {
      const def = await unlockAchievement('perfect_day', (await db.game.get('main'))!)
      if (def) pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
    }

    await useSettingsStore.getState().load()
    await get().load()
  },

  onFocusCompleted: async (minutes) => {
    const game = (await db.game.get('main'))!
    const today = todayKey()
    let focusToday = game.focusSessionsToday
    if (game.focusSessionsDate !== today) focusToday = 0
    focusToday += 1
    await db.game.update('main', {
      focusSessionsToday: focusToday,
      focusSessionsDate: today,
    })

    const xp = Math.max(8, Math.round(minutes) * 2)
    const levelResult = await addXp(xp, `Focus · ${minutes}m`)
    pushToast(set, { kind: 'xp', amount: xp, label: 'Focus session' })
    if (levelResult.leveled) {
      const rank = rankForLevel(levelResult.level)
      pushToast(set, { kind: 'level', level: levelResult.level, title: rank.title })
    }
    if (focusToday >= 4) {
      const def = await unlockAchievement('deep_focus', {
        ...game,
        focusSessionsToday: focusToday,
      })
      if (def) pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
    }
    await bumpQuest('focus', 1)
    await useSettingsStore.getState().load()
    await get().load()
  },

  claimQuest: async (id) => {
    const q = await db.quests.get(id)
    if (!q || !q.completed || q.claimed) return
    await db.quests.update(id, { claimed: true })
    const levelResult = await addXp(q.xpReward, `Quest · ${q.title}`)
    pushToast(set, { kind: 'xp', amount: q.xpReward, label: q.title })
    if (levelResult.leveled) {
      const rank = rankForLevel(levelResult.level)
      pushToast(set, { kind: 'level', level: levelResult.level, title: rank.title })
    }
    await useSettingsStore.getState().load()
    await get().load()
  },

  setTitle: async (title) => {
    await db.game.update('main', { activeTitle: title })
    await get().load()
  },

  recordArena: async (score) => {
    const game = (await db.game.get('main'))!
    const best = Math.max(game.arenaBest, score)
    await db.game.update('main', {
      arenaBest: best,
      arenaRuns: game.arenaRuns + 1,
    })
    const xp = 30 + score * 25
    await addXp(xp, `Arena · score ${score}`)
    pushToast(set, { kind: 'xp', amount: xp, label: `Arena +${score}` })
    let def = await unlockAchievement('arena_rookie', game)
    if (def) pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
    if (score >= 8) {
      def = await unlockAchievement('arena_ace', (await db.game.get('main'))!)
      if (def) pushToast(set, { kind: 'achievement', name: def.name, tier: def.tier })
    }
    await useSettingsStore.getState().load()
    await get().load()
  },

  recordLeisure: async (gameId, score, opts) => {
    const game = (await db.game.get('main'))!
    const today = todayKey()
    let leisureXpToday = game.leisureXpToday ?? 0
    if (game.leisureXpDate !== today) leisureXpToday = 0

    const scores = {
      nback: game.highScores?.nback ?? 0,
      span: game.highScores?.span ?? 0,
      series: game.highScores?.series ?? 0,
      matrix: game.highScores?.matrix ?? 0,
      calc: game.highScores?.calc ?? 0,
      stroop: game.highScores?.stroop ?? 0,
    }
    const prev = scores[gameId] ?? 0
    const isBest = opts?.lowerIsBetter
      ? score > 0 && (prev === 0 || score < prev)
      : score > prev
    if (isBest) scores[gameId] = score

    const DAILY_CAP = 120
    let xp = 0
    if (leisureXpToday < DAILY_CAP) {
      xp = Math.min(
        DAILY_CAP - leisureXpToday,
        opts?.lowerIsBetter
          ? Math.max(5, Math.round(40 - score / 20))
          : Math.min(40, 8 + Math.floor(score / 5)),
      )
      leisureXpToday += xp
    }

    await db.game.update('main', {
      highScores: scores,
      leisureXpToday,
      leisureXpDate: today,
    })

    if (xp > 0) {
      await addXp(xp, `Play · ${gameId}`)
      pushToast(set, {
        kind: 'xp',
        amount: xp,
        label: isBest ? `New best · ${gameId}` : `Played · ${gameId}`,
      })
    } else {
      pushToast(set, {
        kind: 'xp',
        amount: 0,
        label: isBest ? `New best (XP cap hit)` : 'Nice run · daily play XP capped',
      })
    }

    await useSettingsStore.getState().load()
    await get().load()
  },
}))
