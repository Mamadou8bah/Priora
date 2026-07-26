import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui'
import { cn } from '../../lib/utils'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

/** Dual-ish N-Back — working memory training */
export function NBackGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  const N = 2
  const TOTAL = 24
  const [running, setRunning] = useState(false)
  const [idx, setIdx] = useState(-1)
  const [seq, setSeq] = useState<string[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [falseAlarms, setFalseAlarms] = useState(0)
  const [current, setCurrent] = useState('')
  const answered = useRef(false)
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0 })

  useEffect(() => {
    if (!running || idx < 0) return
    if (idx >= TOTAL) {
      setRunning(false)
      const { hits: h, misses: m, falseAlarms: f } = stats.current
      const score = Math.max(0, h * 12 - m * 6 - f * 8)
      onFinish(score)
      return
    }
    answered.current = false
    setCurrent(seq[idx])
    const t = window.setTimeout(() => {
      if (!answered.current) {
        const isMatch = idx >= N && seq[idx] === seq[idx - N]
        if (isMatch) {
          stats.current.misses++
          setMisses((x) => x + 1)
        }
      }
      setIdx((i) => i + 1)
    }, 2200)
    return () => clearTimeout(t)
  }, [running, idx, seq, onFinish])

  function start() {
    const s = Array.from({ length: TOTAL }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)])
    // ensure some matches
    for (let i = N; i < TOTAL; i += 4) s[i] = s[i - N]
    stats.current = { hits: 0, misses: 0, falseAlarms: 0 }
    setSeq(s)
    setHits(0)
    setMisses(0)
    setFalseAlarms(0)
    setIdx(0)
    setRunning(true)
  }

  function match() {
    if (!running || answered.current || idx < 0 || idx >= TOTAL) return
    answered.current = true
    const isMatch = idx >= N && seq[idx] === seq[idx - N]
    if (isMatch) {
      stats.current.hits++
      setHits((x) => x + 1)
    } else {
      stats.current.falseAlarms++
      setFalseAlarms((x) => x + 1)
    }
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>2-Back</span>
        <span>
          H{hits} · M{misses} · FA{falseAlarms}
        </span>
        <span>Best {best}</span>
      </div>
      <div className="surface rounded-3xl h-44 flex items-center justify-center mb-4">
        <span className="font-display text-6xl font-extrabold tracking-tight">
          {running ? current : 'N'}
        </span>
      </div>
      <p className="text-sm text-muted mb-4">
        Tap Match if this letter is the same as <strong>2 steps ago</strong>.
      </p>
      {running ? (
        <Button className="w-full" size="lg" onClick={match} disabled={idx < N}>
          Match
        </Button>
      ) : (
        <Button className="w-full" onClick={start}>
          {seq.length ? 'Train again' : 'Start N-Back'}
        </Button>
      )}
      {running && (
        <p className="text-xs text-muted mt-3">
          Trial {Math.min(idx + 1, TOTAL)}/{TOTAL}
        </p>
      )}
    </div>
  )
}

/** Digit span — working memory capacity */
export function SpanGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  const [phase, setPhase] = useState<'idle' | 'show' | 'recall' | 'done'>('idle')
  const [level, setLevel] = useState(3)
  const [digits, setDigits] = useState<number[]>([])
  const [input, setInput] = useState('')
  const [showIdx, setShowIdx] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const maxLevel = useRef(3)

  useEffect(() => {
    if (phase !== 'show') return
    if (showIdx >= digits.length) {
      setPhase('recall')
      return
    }
    const t = window.setTimeout(() => setShowIdx((i) => i + 1), 700)
    return () => clearTimeout(t)
  }, [phase, showIdx, digits])

  function deal(len: number) {
    const d = Array.from({ length: len }, () => Math.floor(Math.random() * 10))
    setDigits(d)
    setShowIdx(0)
    setInput('')
    setPhase('show')
  }

  function start() {
    setLevel(3)
    setLives(3)
    setScore(0)
    maxLevel.current = 3
    deal(3)
  }

  function submit() {
    const ok = input.replace(/\D/g, '') === digits.join('')
    if (ok) {
      const next = level + 1
      setScore((s) => s + level * 10)
      maxLevel.current = Math.max(maxLevel.current, next)
      setLevel(next)
      deal(next)
    } else {
      const left = lives - 1
      setLives(left)
      if (left <= 0) {
        setPhase('done')
        onFinish(Math.max(score, maxLevel.current * 15))
      } else {
        deal(level)
      }
    }
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>Span {level}</span>
        <span>Lives {lives}</span>
        <span>Best {best}</span>
      </div>
      <div className="surface rounded-3xl h-36 flex items-center justify-center mb-4">
        {phase === 'show' && showIdx < digits.length && (
          <span className="font-display text-5xl font-bold">{digits[showIdx]}</span>
        )}
        {phase === 'show' && showIdx >= digits.length && (
          <span className="text-muted">…</span>
        )}
        {phase === 'recall' && (
          <span className="text-sm text-muted">Enter the sequence</span>
        )}
        {phase === 'idle' && (
          <span className="font-display text-2xl font-bold">Span</span>
        )}
        {phase === 'done' && (
          <span className="font-display text-2xl font-bold">Max {maxLevel.current}</span>
        )}
      </div>
      {phase === 'recall' && (
        <div className="space-y-3">
          <input
            autoFocus
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center text-xl tracking-[0.3em] outline-none"
            placeholder="digits"
          />
          <Button className="w-full" onClick={submit}>
            Check
          </Button>
        </div>
      )}
      {(phase === 'idle' || phase === 'done') && (
        <Button className="w-full" onClick={start}>
          {phase === 'done' ? 'Train again' : 'Start span'}
        </Button>
      )}
      <p className="text-xs text-muted mt-3">Memorize digits, then type them in order</p>
    </div>
  )
}

/** Number series — fluid reasoning */
export function SeriesGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  type Puzzle = { show: number[]; answer: number; decoys: number[] }

  function makePuzzle(): Puzzle {
    const kind = Math.floor(Math.random() * 5)
    let seq: number[] = []
    let answer = 0
    if (kind === 0) {
      const a = 2 + Math.floor(Math.random() * 5)
      const start = 1 + Math.floor(Math.random() * 8)
      seq = Array.from({ length: 4 }, (_, i) => start + i * a)
      answer = start + 4 * a
    } else if (kind === 1) {
      const start = 2 + Math.floor(Math.random() * 4)
      seq = Array.from({ length: 4 }, (_, i) => start * Math.pow(2, i))
      answer = start * Math.pow(2, 4)
    } else if (kind === 2) {
      const start = 1 + Math.floor(Math.random() * 6)
      seq = Array.from({ length: 4 }, (_, i) => start + i * i)
      answer = start + 16
    } else if (kind === 3) {
      let a = 1 + Math.floor(Math.random() * 5)
      let b = 2 + Math.floor(Math.random() * 5)
      seq = [a]
      for (let i = 0; i < 3; i++) {
        const n = a + b
        seq.push(n)
        a = b
        b = n
      }
      answer = a + b
    } else {
      const start = 10 + Math.floor(Math.random() * 20)
      const step = 3 + Math.floor(Math.random() * 4)
      seq = Array.from({ length: 4 }, (_, i) => start - i * step)
      answer = start - 4 * step
    }
    const decoys = new Set<number>()
    while (decoys.size < 3) {
      const d = answer + (Math.floor(Math.random() * 11) - 5)
      if (d !== answer) decoys.add(d)
    }
    return { show: seq, answer, decoys: [...decoys] }
  }

  const [running, setRunning] = useState(false)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [choices, setChoices] = useState<number[]>([])
  const TOTAL = 10

  function next(r: number, sc: number) {
    if (r >= TOTAL) {
      setRunning(false)
      onFinish(sc)
      return
    }
    const p = makePuzzle()
    setPuzzle(p)
    setChoices([p.answer, ...p.decoys].sort(() => Math.random() - 0.5))
    setRound(r)
  }

  function start() {
    setScore(0)
    setRunning(true)
    next(0, 0)
  }

  function pick(n: number) {
    if (!puzzle || !running) return
    const sc = score + (n === puzzle.answer ? 15 : 0)
    setScore(sc)
    next(round + 1, sc)
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>
          {running ? `${round + 1}/${TOTAL}` : 'Series'}
        </span>
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      {!running || !puzzle ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted mb-4">Find the next number in the pattern</p>
          <Button onClick={start}>Start series</Button>
        </div>
      ) : (
        <>
          <div className="surface rounded-2xl p-5 mb-4 text-center">
            <p className="font-display text-2xl font-bold tracking-wide">
              {puzzle.show.join('  ·  ')}  ·  ?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {choices.map((c) => (
              <Button key={c} variant="secondary" className="h-14 text-lg" onClick={() => pick(c)}>
                {c}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Visual matrix — abstract pattern completion */
export function MatrixGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  type Cell = { shape: number; fill: number; rot: number }

  function cellKey(c: Cell) {
    return `${c.shape}-${c.fill}-${c.rot}`
  }

  function make(): { grid: (Cell | null)[]; answer: Cell; options: Cell[] } {
    const rule = Math.floor(Math.random() * 3)
    const grid: (Cell | null)[] = []
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3
      if (rule === 0) {
        grid.push({ shape: col, fill: row, rot: (row + col) % 3 })
      } else if (rule === 1) {
        grid.push({ shape: (row + col) % 3, fill: col, rot: row % 3 })
      } else {
        grid.push({ shape: row, fill: (col + row) % 3, rot: col })
      }
    }
    const answer: Cell =
      rule === 0
        ? { shape: 2, fill: 2, rot: (2 + 2) % 3 }
        : rule === 1
          ? { shape: (2 + 2) % 3, fill: 2, rot: 2 % 3 }
          : { shape: 2, fill: (2 + 2) % 3, rot: 2 }
    grid.push(null)
    const options: Cell[] = [answer]
    while (options.length < 4) {
      const fake: Cell = {
        shape: Math.floor(Math.random() * 3),
        fill: Math.floor(Math.random() * 3),
        rot: Math.floor(Math.random() * 3),
      }
      if (!options.some((o) => cellKey(o) === cellKey(fake))) options.push(fake)
    }
    return { grid, answer, options: options.sort(() => Math.random() - 0.5) }
  }

  const SHAPES = ['square', 'circle', 'diamond'] as const

  function Shape({ c, large }: { c: Cell; large?: boolean }) {
    const size = large ? 'h-10 w-10' : 'h-8 w-8'
    const opacity = c.fill === 0 ? 'opacity-25' : c.fill === 1 ? 'opacity-60' : 'opacity-100'
    const rot = c.rot * 45
    if (SHAPES[c.shape] === 'circle') {
      return (
        <div
          className={cn(size, 'rounded-full bg-[var(--fg)]', opacity)}
          style={{ transform: `rotate(${rot}deg)` }}
        />
      )
    }
    if (SHAPES[c.shape] === 'diamond') {
      return (
        <div
          className={cn(size, 'bg-[var(--fg)]', opacity)}
          style={{ transform: `rotate(${45 + rot}deg) scale(0.75)` }}
        />
      )
    }
    return (
      <div
        className={cn(size, 'rounded-md bg-[var(--fg)]', opacity)}
        style={{ transform: `rotate(${rot}deg)` }}
      />
    )
  }

  const [running, setRunning] = useState(false)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [p, setP] = useState<ReturnType<typeof make> | null>(null)
  const TOTAL = 8

  function go(r: number, sc: number) {
    if (r >= TOTAL) {
      setRunning(false)
      onFinish(sc)
      return
    }
    setP(make())
    setRound(r)
  }

  function start() {
    setScore(0)
    setRunning(true)
    go(0, 0)
  }

  function pick(c: Cell) {
    if (!p) return
    const sc = score + (cellKey(c) === cellKey(p.answer) ? 20 : 0)
    setScore(sc)
    go(round + 1, sc)
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>{running ? `${round + 1}/${TOTAL}` : 'Matrix'}</span>
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      {!running || !p ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted mb-4">Complete the 3×3 pattern — Raven-style reasoning</p>
          <Button onClick={start}>Start matrix</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {p.grid.map((c, i) => (
              <div
                key={i}
                className="aspect-square surface rounded-2xl flex items-center justify-center"
              >
                {c ? <Shape c={c} /> : <span className="text-2xl text-muted">?</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mb-2 text-center">Choose the missing tile</p>
          <div className="grid grid-cols-4 gap-2">
            {p.options.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(c)}
                className="aspect-square surface rounded-2xl flex items-center justify-center hover:border-[var(--fg)]/40"
              >
                <Shape c={c} large />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Timed mental arithmetic */
export function CalcGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [op, setOp] = useState<'+' | '-' | '×'>('+')
  const [answer, setAnswer] = useState(0)
  const [input, setInput] = useState('')
  const scoreRef = useRef(0)

  function problem() {
    const ops: Array<'+' | '-' | '×'> = ['+', '-', '×']
    const o = ops[Math.floor(Math.random() * ops.length)]
    let x = 0
    let y = 0
    let ans = 0
    if (o === '+') {
      x = 10 + Math.floor(Math.random() * 40)
      y = 10 + Math.floor(Math.random() * 40)
      ans = x + y
    } else if (o === '-') {
      x = 20 + Math.floor(Math.random() * 50)
      y = 5 + Math.floor(Math.random() * 20)
      ans = x - y
    } else {
      x = 3 + Math.floor(Math.random() * 12)
      y = 3 + Math.floor(Math.random() * 9)
      ans = x * y
    }
    setA(x)
    setB(y)
    setOp(o)
    setAnswer(ans)
    setInput('')
  }

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      setRunning(false)
      onFinish(scoreRef.current)
      return
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left, onFinish])

  function start() {
    scoreRef.current = 0
    setScore(0)
    setLeft(60)
    setRunning(true)
    problem()
  }

  function submit() {
    if (!running) return
    if (Number(input) === answer) {
      scoreRef.current += op === '×' ? 12 : 8
      setScore(scoreRef.current)
    }
    problem()
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>{left}s</span>
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      {!running ? (
        <div className="py-6">
          <p className="text-sm text-muted mb-4">60 seconds of mental arithmetic</p>
          <Button onClick={start}>{score > 0 ? 'Train again' : 'Start calc lab'}</Button>
        </div>
      ) : (
        <>
          <div className="surface rounded-3xl p-6 mb-4">
            <p className="font-display text-4xl font-bold">
              {a} {op} {b}
            </p>
          </div>
          <input
            autoFocus
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center text-2xl outline-none mb-3"
          />
          <Button className="w-full" onClick={submit}>
            Submit
          </Button>
        </>
      )}
    </div>
  )
}

/** Stroop — attention & cognitive inhibition */
export function StroopGame({
  onFinish,
  best,
}: {
  onFinish: (score: number) => void
  best: number
}) {
  const WORDS = ['BLACK', 'WHITE', 'GRAY', 'DARK'] as const
  // display styles: ink is either matching-ish or conflicting via opacity/weight
  type Trial = { word: (typeof WORDS)[number]; ink: 'light' | 'dark'; congruent: boolean }

  function makeTrial(): Trial {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)]
    const congruent = Math.random() > 0.45
    const ink: 'light' | 'dark' =
      word === 'WHITE' || word === 'GRAY'
        ? congruent
          ? 'light'
          : 'dark'
        : congruent
          ? 'dark'
          : 'light'
    return { word, ink, congruent }
  }

  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(45)
  const [score, setScore] = useState(0)
  const [trial, setTrial] = useState<Trial | null>(null)
  const scoreRef = useRef(0)

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      setRunning(false)
      onFinish(scoreRef.current)
      return
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left, onFinish])

  function start() {
    scoreRef.current = 0
    setScore(0)
    setLeft(45)
    setTrial(makeTrial())
    setRunning(true)
  }

  function answer(isDark: boolean) {
    if (!trial || !running) return
    const correct = (trial.ink === 'dark') === isDark
    if (correct) {
      scoreRef.current += trial.congruent ? 6 : 10
      setScore(scoreRef.current)
    }
    setTrial(makeTrial())
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>{left}s</span>
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      {!running || !trial ? (
        <div className="py-6">
          <p className="text-sm text-muted mb-4 px-2">
            Ignore the word meaning — tap whether the <em>ink</em> looks dark or light
          </p>
          <Button onClick={start}>Start stroop</Button>
        </div>
      ) : (
        <>
          <div className="surface rounded-3xl h-40 flex items-center justify-center mb-4">
            <span
              className={cn(
                'font-display text-4xl font-extrabold',
                trial.ink === 'dark' ? 'text-[var(--fg)]' : 'text-[var(--fg)]/35',
              )}
            >
              {trial.word}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="h-14" onClick={() => answer(true)}>
              Dark ink
            </Button>
            <Button variant="secondary" className="h-14" onClick={() => answer(false)}>
              Light ink
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
