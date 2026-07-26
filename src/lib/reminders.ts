import { db } from '../db'
import type { Reminder, Task } from '../types'
import { nowISO, uid } from './dates'
import { defaultReminderOffsets } from './engine'
import { parseISO, addDays, setHours, setMinutes } from 'date-fns'

export async function scheduleRemindersForTask(task: Task) {
  await db.reminders.where('taskId').equals(task.id).delete()

  if (!task.deadline) return

  const offsets =
    task.reminderOffsets.length > 0
      ? task.reminderOffsets
      : defaultReminderOffsets(task.deadline)

  const deadline = parseISO(task.deadline)
  const reminders: Reminder[] = offsets.map((offset) => {
    const fireAt = new Date(deadline.getTime() + offset.offsetMinutes * 60_000)
    let type: Reminder['type'] = 'deadline'
    if (offset.offsetMinutes < 0) type = 'time'
    if (offset.offsetMinutes > 0) type = 'escalation'

    return {
      id: uid(),
      taskId: task.id,
      eventId: null,
      title: task.title,
      body: offset.label,
      type,
      fireAt: fireAt.toISOString(),
      fired: false,
      snoozedUntil: null,
      createdAt: nowISO(),
    }
  })

  if (task.priority === 'critical' || task.priority === 'high') {
    const tomorrowMorning = setMinutes(setHours(addDays(new Date(), 1), 9), 0)
    if (deadline < tomorrowMorning) {
      reminders.push({
        id: uid(),
        taskId: task.id,
        eventId: null,
        title: task.title,
        body: 'Still pending — tomorrow morning check-in',
        type: 'missed',
        fireAt: tomorrowMorning.toISOString(),
        fired: false,
        snoozedUntil: null,
        createdAt: nowISO(),
      })
    }
  }

  if (reminders.length) await db.reminders.bulkAdd(reminders)
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function fireDueReminders() {
  const settings = await db.settings.get('main')
  if (settings && !settings.notificationsEnabled) return 0

  const now = new Date().toISOString()
  const pending = await db.reminders.filter((r) => !r.fired).toArray()
  const dueList = pending.filter((r) => (r.snoozedUntil ?? r.fireAt) <= now)

  for (const reminder of dueList) {
    await showReminderNotification(reminder)
    await db.reminders.update(reminder.id, { fired: true })
  }

  return dueList.length
}

async function showReminderNotification(reminder: Reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const n = new Notification(reminder.title, {
    body: reminder.body,
    tag: reminder.id,
    icon: '/pwa-192.png',
    requireInteraction: true,
  })

  n.onclick = () => {
    window.focus()
    window.location.assign('/tasks')
    n.close()
  }
}

export async function snoozeReminder(reminderId: string, minutes: number) {
  const until = new Date(Date.now() + minutes * 60_000).toISOString()
  await db.reminders.update(reminderId, {
    snoozedUntil: until,
    fired: false,
  })
}

export function startReminderTicker(intervalMs = 30_000) {
  fireDueReminders()
  return window.setInterval(() => {
    fireDueReminders()
  }, intervalMs)
}
