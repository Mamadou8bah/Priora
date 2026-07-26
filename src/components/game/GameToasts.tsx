import { useGameStore } from '../../stores/useGameStore'
import { cn } from '../../lib/utils'
import { Trophy, Zap, Swords, Flame, Star } from 'lucide-react'

export function GameToasts() {
  const toasts = useGameStore((s) => s.toasts)
  const dismiss = useGameStore((s) => s.dismissToast)

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(100%-2rem,20rem)] pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto text-left surface rounded-2xl p-3.5 animate-fade-up shadow-[var(--shadow)]',
            t.kind === 'level' && 'ring-1 ring-[var(--fg)]/30',
            t.kind === 'boss' && 'ring-1 ring-[var(--fg)]/50',
          )}
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">
              {t.kind === 'xp' && <Zap size={16} />}
              {t.kind === 'level' && <Star size={16} />}
              {t.kind === 'achievement' && <Trophy size={16} />}
              {t.kind === 'boss' && <Swords size={16} />}
              {t.kind === 'combo' && <Flame size={16} />}
            </span>
            <div className="min-w-0">
              {t.kind === 'xp' && (
                <>
                  <p className="font-display font-bold text-sm">
                    {t.amount > 0 ? `+${t.amount} XP` : 'Shield'}
                    {t.mult && t.mult > 1 ? (
                      <span className="text-muted font-medium"> · ×{t.mult.toFixed(2)}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted truncate">{t.label}</p>
                </>
              )}
              {t.kind === 'level' && (
                <>
                  <p className="font-display font-bold text-sm">Level {t.level}</p>
                  <p className="text-xs text-muted">Rank unlocked · {t.title}</p>
                </>
              )}
              {t.kind === 'achievement' && (
                <>
                  <p className="font-display font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-muted capitalize">{t.tier} relic unlocked</p>
                </>
              )}
              {t.kind === 'boss' && (
                <>
                  <p className="font-display font-bold text-sm">Boss defeated</p>
                  <p className="text-xs text-muted truncate">{t.name}</p>
                </>
              )}
              {t.kind === 'combo' && (
                <>
                  <p className="font-display font-bold text-sm">Momentum ×{t.momentum}</p>
                  <p className="text-xs text-muted">Keep completing — multiplier active</p>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
