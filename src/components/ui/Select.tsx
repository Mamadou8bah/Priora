import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

type Option = {
  value: string
  label: string
  disabled?: boolean
}

function readOptions(children: ReactNode): Option[] {
  const options: Option[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type !== 'option') return
    const props = child.props as {
      value?: string | number
      disabled?: boolean
      children?: ReactNode
    }
    options.push({
      value: props.value == null ? '' : String(props.value),
      label: String(props.children ?? ''),
      disabled: Boolean(props.disabled),
    })
  })
  return options
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  children: ReactNode
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
  required,
  'aria-label': ariaLabel,
}: SelectProps) {
  const options = useMemo(() => readOptions(children), [children])
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState(() =>
    value !== undefined ? String(value) : String(defaultValue ?? options[0]?.value ?? ''),
  )
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})

  const selectedValue = value !== undefined ? String(value) : internal
  const selected = options.find((o) => o.value === selectedValue) ?? options[0]
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === selectedValue),
  )
  const [highlight, setHighlight] = useState(activeIndex)

  useEffect(() => {
    if (value !== undefined) setInternal(String(value))
  }, [value])

  useEffect(() => {
    if (open) setHighlight(activeIndex)
  }, [open, activeIndex])

  const placeMenu = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const gap = 8
    const menuMax = Math.min(280, viewportH - 24)
    const spaceBelow = viewportH - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow
    const height = Math.min(menuMax, Math.max(120, openUp ? spaceAbove : spaceBelow))
    const width = Math.max(rect.width, 168)
    let left = rect.left
    if (left + width > viewportW - 12) left = Math.max(12, viewportW - width - 12)

    setMenuStyle({
      position: 'fixed',
      left,
      width,
      maxHeight: height,
      zIndex: 90,
      ...(openUp
        ? { bottom: viewportH - rect.top + gap, top: 'auto' }
        : { top: rect.bottom + gap, bottom: 'auto' }),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    placeMenu()
    menuRef.current?.focus()
    const onReposition = () => placeMenu()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, placeMenu])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function commit(next: string) {
    setInternal(next)
    setOpen(false)
    if (onChange) {
      const event = {
        target: { value: next, name: name ?? '' },
        currentTarget: { value: next, name: name ?? '' },
      } as ChangeEvent<HTMLSelectElement>
      onChange(event)
    }
    triggerRef.current?.focus()
  }

  function onTriggerKeyDown(e: ReactKeyboardEvent) {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  function onMenuKeyDown(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => {
        let n = i
        for (let step = 0; step < options.length; step++) {
          n = (n + 1) % options.length
          if (!options[n]?.disabled) return n
        }
        return i
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => {
        let n = i
        for (let step = 0; step < options.length; step++) {
          n = (n - 1 + options.length) % options.length
          if (!options[n]?.disabled) return n
        }
        return i
      })
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opt = options[highlight]
      if (opt && !opt.disabled) commit(opt.value)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = options.findIndex((o) => !o.disabled)
      if (first >= 0) setHighlight(first)
    } else if (e.key === 'End') {
      e.preventDefault()
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i]?.disabled) {
          setHighlight(i)
          break
        }
      }
    }
  }

  const isPlaceholder =
    !!selected && selected.value === '' && /select|choose|pick/i.test(selected.label)

  return (
    <div className={cn('relative w-full', className)}>
      <select
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={selectedValue}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
        onChange={(e) => commit(e.target.value)}
      >
        {options.map((opt) => (
          <option key={`${opt.value}::${opt.label}`} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'group relative flex h-11 w-full items-center gap-2 rounded-2xl border border-[var(--border)]',
          'bg-[var(--card)] backdrop-blur-2xl px-3.5 pr-10 text-left text-sm text-[var(--fg)]',
          'shadow-[var(--glass-shine)] outline-none transition duration-200',
          'hover:border-[var(--fg)]/20 hover:bg-[var(--card-solid)]',
          'focus-visible:border-[var(--fg)]/25 focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]',
          open && 'border-[var(--fg)]/25 ring-2 ring-[var(--accent-soft)] bg-[var(--card-solid)]',
          disabled && 'opacity-50 pointer-events-none',
          isPlaceholder && 'text-muted',
        )}
      >
        <span className="truncate flex-1 font-medium">{selected?.label ?? 'Select…'}</span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cn(
            'absolute right-3.5 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open && 'rotate-180 text-[var(--fg)]',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${listId}-opt-${highlight}`}
            style={menuStyle}
            onKeyDown={onMenuKeyDown}
            className="select-menu overflow-y-auto overscroll-contain rounded-2xl p-1.5 scrollbar-thin outline-none"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === selectedValue
              const isActive = i === highlight
              return (
                <button
                  key={`${opt.value}::${opt.label}`}
                  type="button"
                  role="option"
                  id={`${listId}-opt-${i}`}
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && setHighlight(i)}
                  onClick={() => !opt.disabled && commit(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition',
                    'disabled:opacity-40 disabled:pointer-events-none',
                    isSelected
                      ? 'bg-accent text-[var(--accent-fg)] shadow-[var(--glass-shine)]'
                      : isActive
                        ? 'bg-accent-soft text-[var(--fg)]'
                        : 'text-[var(--fg)] hover:bg-accent-soft',
                  )}
                >
                  <span className="flex-1 truncate font-medium">{opt.label}</span>
                  {isSelected && <Check size={15} strokeWidth={2.25} className="shrink-0 opacity-90" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
