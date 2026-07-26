import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  Shield,
  Swords,
  Trophy,
  Zap,
  Timer,
  Crown,
  Target,
} from 'lucide-react'
import { useGameStore } from '../stores/useGameStore'
import { useSettingsStore } from '../stores/useAppStores'
import { useTaskStore } from '../stores/useTaskStore'
import {
  ACHIEVEMENTS,
  isBossTask,
  nextRank,
  rankForLevel,
  xpProgressInLevel,
} from '../lib/game'
import { Button, PageHeader, ProgressBar, Badge, Modal } from '../components/ui'
import { cn } from '../lib/utils'
import { TaskCard } from '../components/tasks/TaskCard'

export function GamePage() {
  const { game, quests, feed, load, claimQuest, setTitle, recordArena } = useGameStore()
  const stats = useSettingsStore((s) => s.stats)
  const tasks = useTaskStore((s) => s.tasks)
  const complete = useTaskStore((s) => s.complete)
  const [arenaOpen, setArenaOpen] = useState(false)
  const [arenaLeft, setArenaLeft] = useState(0)
  const [arenaScore, setArenaScore] = useState(0)
  const [arenaPool, setArenaPool] = useState<string[]>([])
  const [titlesOpen, setTitlesOpen] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (arenaLeft <= 0) return
    const id = window.setInterval(() => setArenaLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [arenaLeft])

  useEffect(() => {
    if (arenaOpen && arenaLeft === 0 && arenaScore >= 0) {
      // ended
    }
  }, [arenaLeft, arenaOpen, arenaScore])

  const progress = xpProgressInLevel(stats?.xp ?? 0)
  const rank = rankForLevel(stats?.level ?? 1)
  const upcoming = nextRank(stats?.level ?? 1)

  const bosses = useMemo(
    () => tasks.filter((t) => isBossTask(t)).slice(0, 6),
    [tasks],
  )

  const daily = quests.filter((q) => q.period === 'daily')
  const weekly = quests.filter((q) => q.period === 'weekly')

  function startArena() {
    const pool = tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .sort(() => Math.random() - 0.5)
      .slice(0, 12)
      .map((t) => t.id)
    setArenaPool(pool)
    setArenaScore(0)
    setArenaLeft(10 * 60)
    setArenaOpen(true)
  }

  async function arenaComplete(id: string) {
    await complete(id)
    setArenaScore((s) => s + 1)
    setArenaPool((p) => p.filter((x) => x !== id))
  }

  async function finishArena() {
    await recordArena(arenaScore)
    setArenaOpen(false)
    setArenaLeft(0)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="The Forge"
        subtitle="Quests, ranks, bosses & momentum"
        actions={
          <div className="flex gap-2">
            <Link to="/play">
              <Button variant="secondary">Mind Lab</Button>
            </Link>
            <Button onClick={startArena}>
              <Timer size={16} /> Arena
            </Button>
          </div>
        }
      />

      {/* Rank hero */}
      <section className="surface rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-1">Current rank</p>
            <h2 className="font-display text-3xl font-extrabold">{rank.title}</h2>
            <p className="text-muted text-sm mt-1">{rank.epithet}</p>
            {game?.activeTitle && (
              <p className="mt-2 text-sm font-medium flex items-center gap-1.5">
                <Crown size={14} /> {game.activeTitle}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-bold">{stats?.level ?? 1}</p>
            <p className="text-xs text-muted">Level</p>
          </div>
        </div>
        <ProgressBar value={progress.pct} className="mb-2" />
        <div className="flex justify-between text-xs text-muted">
          <span>
            {progress.into} / {progress.need} XP
          </span>
          <span>
            {upcoming
              ? `Next: ${upcoming.title} at Lv ${upcoming.level}`
              : 'Max forge rank'}
          </span>
        </div>
      </section>

      {/* Momentum + shields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassStat
          icon={<Zap size={16} />}
          label="Momentum"
          value={`×${game?.momentum ?? 0}`}
        />
        <GlassStat
          icon={<Flame size={16} />}
          label="Streak"
          value={`${stats?.streak ?? 0}d`}
        />
        <GlassStat
          icon={<Shield size={16} />}
          label="Shields"
          value={`${game?.streakShields ?? 0}`}
        />
        <GlassStat
          icon={<Swords size={16} />}
          label="Bosses"
          value={`${game?.bossesDefeated ?? 0}`}
        />
      </div>

      {/* Daily quests */}
      <section>
        <h3 className="font-display text-lg font-bold mb-3">Daily quests</h3>
        <div className="space-y-2">
          {daily.map((q) => (
            <QuestRow key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg font-bold mb-3">Weekly raid</h3>
        <div className="space-y-2">
          {weekly.map((q) => (
            <QuestRow key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
          ))}
        </div>
      </section>

      {/* Boss board */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Swords size={18} /> Boss board
          </h3>
          <Badge>{bosses.length} active</Badge>
        </div>
        {bosses.length === 0 ? (
          <p className="text-sm text-muted surface rounded-2xl p-4">
            No bosses. Overdue high/critical tasks appear here for bonus XP.
          </p>
        ) : (
          <div className="space-y-2">
            {bosses.map((t) => (
              <div key={t.id} className="relative">
                <div className="absolute -top-2 left-3 z-10">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[var(--fg)] text-[var(--accent-fg)]">
                    Boss · 2.2× XP
                  </span>
                </div>
                <TaskCard task={t} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy size={18} /> Relics
          </h3>
          <span className="text-xs text-muted">
            {game?.unlockedAchievements.length ?? 0}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = game?.unlockedAchievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  'surface rounded-2xl p-3 transition',
                  !unlocked && 'opacity-40 grayscale',
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
                  {a.tier}
                </p>
                <p className="font-medium text-sm leading-snug">{a.name}</p>
                <p className="text-xs text-muted mt-1 line-clamp-2">{a.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Titles + feed */}
      <div className="grid sm:grid-cols-2 gap-4">
        <section className="surface rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold">Titles</h3>
            <Button size="sm" variant="ghost" onClick={() => setTitlesOpen(true)}>
              Equip
            </Button>
          </div>
          {(game?.titlesUnlocked.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">Earn legendary relics to unlock titles.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {game!.titlesUnlocked.map((t) => (
                <li key={t} className={cn(game?.activeTitle === t && 'font-semibold')}>
                  {game?.activeTitle === t ? '◆ ' : '◇ '}
                  {t}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface rounded-2xl p-4">
          <h3 className="font-display font-bold mb-3">XP feed</h3>
          {feed.length === 0 ? (
            <p className="text-sm text-muted">Complete tasks to fill the forge.</p>
          ) : (
            <ul className="space-y-2">
              {feed.map((f) => (
                <li key={f.id} className="flex justify-between gap-2 text-sm">
                  <span className="truncate text-muted">{f.label}</span>
                  <span className="font-medium shrink-0">+{f.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-center text-xs text-muted">
        Arena best: {game?.arenaBest ?? 0} · Runs: {game?.arenaRuns ?? 0} ·{' '}
        <Link to="/" className="underline">
          Back home
        </Link>
      </p>

      <Modal open={titlesOpen} onClose={() => setTitlesOpen(false)} title="Equip title">
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={async () => {
              await setTitle(null)
              setTitlesOpen(false)
            }}
          >
            No title
          </Button>
          {(game?.titlesUnlocked ?? []).map((t) => (
            <Button
              key={t}
              variant="secondary"
              className="w-full justify-start"
              onClick={async () => {
                await setTitle(t)
                setTitlesOpen(false)
              }}
            >
              {t}
            </Button>
          ))}
        </div>
      </Modal>

      <Modal
        open={arenaOpen}
        onClose={() => {
          if (arenaLeft > 0) return
          setArenaOpen(false)
        }}
        title="Arena sprint"
        wide
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold tabular-nums">
              {Math.floor(arenaLeft / 60)}:{String(arenaLeft % 60).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted">Clear tasks fast · score {arenaScore}</p>
          </div>
          {arenaLeft === 0 ? (
            <Button onClick={finishArena}>
              <Target size={16} /> Claim rewards
            </Button>
          ) : (
            <Button variant="secondary" onClick={finishArena}>
              End early
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {arenaPool.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              {arenaLeft > 0 ? 'Pool cleared — keep the clock or claim!' : 'Time up.'}
            </p>
          ) : (
            arenaPool.map((id) => {
              const t = tasks.find((x) => x.id === id)
              if (!t) return null
              return (
                <button
                  key={id}
                  type="button"
                  disabled={arenaLeft === 0}
                  onClick={() => arenaComplete(id)}
                  className="w-full text-left surface rounded-2xl p-3 hover:border-[var(--fg)]/30 transition disabled:opacity-50"
                >
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted mt-0.5">Tap to complete</p>
                </button>
              )
            })
          )}
        </div>
      </Modal>
    </div>
  )
}

function GlassStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="surface rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  )
}

function QuestRow({
  quest,
  onClaim,
}: {
  quest: {
    id: string
    title: string
    description: string
    progress: number
    target: number
    xpReward: number
    completed: boolean
    claimed: boolean
  }
  onClaim: () => void
}) {
  const pct = (quest.progress / Math.max(quest.target, 1)) * 100
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-medium">{quest.title}</p>
          <p className="text-xs text-muted">{quest.description}</p>
        </div>
        <span className="text-xs text-muted shrink-0">+{quest.xpReward} XP</span>
      </div>
      <ProgressBar value={pct} className="mb-2" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {Math.min(quest.progress, quest.target)}/{quest.target}
        </span>
        {quest.completed && !quest.claimed ? (
          <Button size="sm" onClick={onClaim}>
            Claim
          </Button>
        ) : quest.claimed ? (
          <span className="text-xs font-medium">Claimed</span>
        ) : null}
      </div>
    </div>
  )
}
