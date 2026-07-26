import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain } from 'lucide-react'
import { useGameStore } from '../stores/useGameStore'
import { Button, PageHeader } from '../components/ui'
import {
  NBackGame,
  SpanGame,
  SeriesGame,
  MatrixGame,
  CalcGame,
  StroopGame,
} from '../components/minigames/MiniGames'
import { cn } from '../lib/utils'
import { todayKey } from '../lib/dates'

type GameId = 'nback' | 'span' | 'series' | 'matrix' | 'calc' | 'stroop'

const CATALOG: {
  id: GameId
  title: string
  blurb: string
  trains: string
}[] = [
  {
    id: 'nback',
    title: 'N-Back',
    blurb: 'Track letters two steps back. The classic working-memory protocol.',
    trains: 'Working memory',
  },
  {
    id: 'span',
    title: 'Digit Span',
    blurb: 'Hold longer number sequences in mind, then recall them exactly.',
    trains: 'Memory capacity',
  },
  {
    id: 'series',
    title: 'Number Series',
    blurb: 'Discover the rule and predict the next value in the sequence.',
    trains: 'Fluid reasoning',
  },
  {
    id: 'matrix',
    title: 'Matrix',
    blurb: 'Complete abstract 3×3 patterns — Raven-style visual logic.',
    trains: 'Abstract reasoning',
  },
  {
    id: 'calc',
    title: 'Calc Lab',
    blurb: 'Sixty seconds of mental arithmetic under time pressure.',
    trains: 'Processing speed',
  },
  {
    id: 'stroop',
    title: 'Stroop',
    blurb: 'Inhibit automatic reading — judge ink, not the word.',
    trains: 'Attention control',
  },
]

export function PlayPage() {
  const load = useGameStore((s) => s.load)
  const game = useGameStore((s) => s.game)
  const recordLeisure = useGameStore((s) => s.recordLeisure)
  const [active, setActive] = useState<GameId | null>(null)

  useEffect(() => {
    load()
  }, [load])

  const scores = game?.highScores ?? {
    nback: 0,
    span: 0,
    series: 0,
    matrix: 0,
    calc: 0,
    stroop: 0,
  }

  const onFinish = useCallback(
    async (id: GameId, score: number) => {
      if (score <= 0) return
      await recordLeisure(id, score)
    },
    [recordLeisure],
  )

  if (active) {
    const meta = CATALOG.find((c) => c.id === active)!
    return (
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--fg)] mb-4"
        >
          <ArrowLeft size={16} /> All drills
        </button>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">{meta.trains}</p>
          <h1 className="font-display text-3xl font-bold">{meta.title}</h1>
          <p className="text-sm text-muted mt-1">{meta.blurb}</p>
        </div>
        <div className="surface rounded-3xl p-4 sm:p-5">
          {active === 'nback' && (
            <NBackGame best={scores.nback} onFinish={(s) => onFinish('nback', s)} />
          )}
          {active === 'span' && (
            <SpanGame best={scores.span} onFinish={(s) => onFinish('span', s)} />
          )}
          {active === 'series' && (
            <SeriesGame best={scores.series} onFinish={(s) => onFinish('series', s)} />
          )}
          {active === 'matrix' && (
            <MatrixGame best={scores.matrix} onFinish={(s) => onFinish('matrix', s)} />
          )}
          {active === 'calc' && (
            <CalcGame best={scores.calc} onFinish={(s) => onFinish('calc', s)} />
          )}
          {active === 'stroop' && (
            <StroopGame best={scores.stroop} onFinish={(s) => onFinish('stroop', s)} />
          )}
        </div>
        <p className="text-xs text-muted text-center mt-4">
          Short focused drills beat long arcade sessions. Daily XP still capped at 120.
        </p>
      </div>
    )
  }

  const xpToday =
    game?.leisureXpDate === todayKey() ? (game?.leisureXpToday ?? 0) : 0

  return (
    <div>
      <PageHeader
        title="Mind Lab"
        subtitle="Cognitive drills for memory, reasoning, and focus"
        actions={
          <Link to="/forge">
            <Button variant="secondary" size="sm">
              The Forge
            </Button>
          </Link>
        }
      />

      <div className="surface rounded-2xl p-4 mb-5 flex items-center gap-3">
        <Brain size={20} />
        <div className="text-sm">
          <p className="font-medium">Train the faculties you use for hard work</p>
          <p className="text-muted text-xs">Session XP today: {xpToday}/120</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CATALOG.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className={cn(
              'surface rounded-3xl p-5 text-left transition hover:border-[var(--fg)]/30',
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{g.trains}</p>
            <h2 className="font-display text-xl font-bold mb-1">{g.title}</h2>
            <p className="text-sm text-muted mb-3">{g.blurb}</p>
            <p className="text-xs font-medium">Best {scores[g.id] || '—'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
