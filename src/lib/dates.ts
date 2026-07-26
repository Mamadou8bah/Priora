import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isBefore,
  startOfDay,
  endOfDay,
  addDays,
  differenceInMinutes,
  differenceInCalendarDays,
  parseISO,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns'

export function uid() {
  return crypto.randomUUID()
}

export function nowISO() {
  return new Date().toISOString()
}

export function formatDate(date: string | Date | null, pattern = 'MMM d, yyyy') {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatRelativeDate(date: string | Date | null) {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function isOverdue(deadline: string | null) {
  if (!deadline) return false
  return isPast(parseISO(deadline)) && !isToday(parseISO(deadline))
}

export function isDueToday(deadline: string | null) {
  if (!deadline) return false
  return isToday(parseISO(deadline))
}

export function daysUntil(deadline: string | null) {
  if (!deadline) return null
  return differenceInCalendarDays(parseISO(deadline), startOfDay(new Date()))
}

export function minutesUntil(date: string) {
  return differenceInMinutes(parseISO(date), new Date())
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function toDateKey(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function getMonthDays(date: Date, weekStartsOn: 0 | 1 = 1) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calStart = startOfWeek(monthStart, { weekStartsOn })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn })
  return eachDayOfInterval({ start: calStart, end: calEnd })
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1) {
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
  return eachDayOfInterval({ start, end })
}

export {
  isToday,
  isTomorrow,
  isPast,
  isBefore,
  startOfDay,
  endOfDay,
  addDays,
  parseISO,
  isSameDay,
  format,
  startOfWeek,
  endOfWeek,
}
