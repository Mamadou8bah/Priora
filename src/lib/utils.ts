import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const PRIORITY_META = {
  critical: { label: 'Critical', color: '#525252', bg: 'rgba(0,0,0,0.12)' },
  high: { label: 'High', color: '#525252', bg: 'rgba(0,0,0,0.1)' },
  medium: { label: 'Medium', color: '#737373', bg: 'rgba(0,0,0,0.08)' },
  low: { label: 'Low', color: '#a3a3a3', bg: 'rgba(0,0,0,0.06)' },
  someday: { label: 'Someday', color: '#a3a3a3', bg: 'rgba(0,0,0,0.04)' },
} as const

export const STATUS_META = {
  inbox: { label: 'Inbox', column: 'Inbox' },
  planned: { label: 'Planned', column: 'To Do' },
  in_progress: { label: 'In Progress', column: 'Doing' },
  waiting: { label: 'Waiting', column: 'Waiting' },
  blocked: { label: 'Blocked', column: 'Waiting' },
  completed: { label: 'Completed', column: 'Done' },
  cancelled: { label: 'Cancelled', column: 'Done' },
} as const

export const KANBAN_COLUMNS = [
  { id: 'inbox', statuses: ['inbox'] as const, title: 'Inbox' },
  { id: 'todo', statuses: ['planned'] as const, title: 'To Do' },
  { id: 'doing', statuses: ['in_progress'] as const, title: 'Doing' },
  { id: 'waiting', statuses: ['waiting', 'blocked'] as const, title: 'Waiting' },
  { id: 'done', statuses: ['completed'] as const, title: 'Done' },
] as const
