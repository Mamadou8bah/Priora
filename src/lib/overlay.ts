import { useEffect, useState, useSyncExternalStore } from 'react'

let openCount = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function lockOverlay() {
  openCount += 1
  document.body.dataset.overlayOpen = 'true'
  document.body.style.overflow = 'hidden'
  emit()
}

export function unlockOverlay() {
  openCount = Math.max(0, openCount - 1)
  if (openCount === 0) {
    delete document.body.dataset.overlayOpen
    document.body.style.overflow = ''
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return openCount > 0
}

export function useOverlayOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** True when the soft keyboard likely covers the lower screen. */
export function useKeyboardOpen(threshold = 120) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const check = () => {
      const covered = window.innerHeight - vv.height > threshold
      setOpen(covered)
    }

    check()
    vv.addEventListener('resize', check)
    vv.addEventListener('scroll', check)
    return () => {
      vv.removeEventListener('resize', check)
      vv.removeEventListener('scroll', check)
    }
  }, [threshold])

  return open
}
