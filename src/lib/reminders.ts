import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { db } from '../db'
import type { Reminder, ReminderOffset, Task } from '../types'
import { nowISO, uid } from './dates'
import { defaultReminderOffsets } from './engine'
import { parseISO, addDays, setHours, setMinutes } from 'date-fns'

const isNative = () => Capacitor.isNativePlatform()

/** Stable positive int id for Capacitor LocalNotifications. */
function notifId(reminderId: string): number {
  let h = 0
  for (let i = 0; i < reminderId.length; i++) {
    h = (Math.imul(31, h) + reminderId.charCodeAt(i)) | 0
  }
  const n = Math.abs(h) % 2_000_000_000
  return n === 0 ? 1 : n
}

function mergeOffsets(deadline: string, existing: ReminderOffset[]): ReminderOffset[] {
  const defaults = defaultReminderOffsets(deadline)
  if (!existing.length) return defaults

  const byKey = new Map(existing.map((o) => [`${o.label}:${o.offsetMinutes}`, o]))
  for (const d of defaults) {
    const key = `${d.label}:${d.offsetMinutes}`
    if (!byKey.has(key)) byKey.set(key, d)
  }
  return [...byKey.values()].filter((o) => {
    const fireAt = parseISO(deadline).getTime() + o.offsetMinutes * 60_000
    return fireAt > Date.now() - 60_000
  })
}

async function cancelNativeForReminders(reminders: Reminder[]) {
  if (!isNative() || !reminders.length) return
  try {
    await LocalNotifications.cancel({
      notifications: reminders.map((r) => ({ id: notifId(r.id) })),
    })
  } catch {
    /* plugin unavailable */
  }
}

async function ensureNativeChannel() {
  if (!isNative()) return
  try {
    await LocalNotifications.createChannel({
      id: 'priora-reminders',
      name: 'Task reminders',
      description: 'Deadline and reminder alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
  } catch {
    /* web / older android */
  }
}

async function scheduleNativeNotification(reminder: Reminder) {
  if (!isNative()) return
  const at = new Date(reminder.snoozedUntil ?? reminder.fireAt)
  if (at.getTime() <= Date.now() - 5_000) return

  try {
    await ensureNativeChannel()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId(reminder.id),
          title: reminder.title,
          body: reminder.body,
          schedule: { at, allowWhileIdle: true },
          channelId: 'priora-reminders',
          extra: { reminderId: reminder.id, taskId: reminder.taskId },
          smallIcon: 'ic_stat_priora',
          iconColor: '#0a0a0a',
        },
      ],
    })
  } catch (err) {
    console.warn('[priora] failed to schedule local notification', err)
  }
}

export async function scheduleRemindersForTask(task: Task) {
  const existing = await db.reminders.where('taskId').equals(task.id).toArray()
  await cancelNativeForReminders(existing)
  await db.reminders.where('taskId').equals(task.id).delete()

  if (!task.deadline) return
  if (task.status === 'completed' || task.status === 'cancelled') return

  const offsets = mergeOffsets(task.deadline, task.reminderOffsets ?? [])
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
    if (deadline.getTime() > Date.now() && deadline < tomorrowMorning) {
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

  if (!reminders.length) return

  await db.reminders.bulkAdd(reminders)

  if (isNative()) {
    for (const reminder of reminders) {
      await scheduleNativeNotification(reminder)
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      await ensureNativeChannel()
      let status = await LocalNotifications.checkPermissions()
      if (status.display !== 'granted') {
        status = await LocalNotifications.requestPermissions()
      }
      return status.display === 'granted'
    } catch {
      return false
    }
  }

  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function getNotificationPermissionLabel(): Promise<string> {
  if (isNative()) {
    try {
      const status = await LocalNotifications.checkPermissions()
      return status.display
    } catch {
      return 'unavailable'
    }
  }
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

async function showWebNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }
  const n = new Notification(title, {
    body,
    tag: tag ?? `priora-${Date.now()}`,
    icon: '/pwa-192.png',
    requireInteraction: true,
  })
  n.onclick = () => {
    window.focus()
    window.location.assign('/tasks')
    n.close()
  }
  return true
}

async function showReminderNotification(reminder: Reminder): Promise<boolean> {
  if (isNative()) {
    // Immediate delivery for anything already due
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId(reminder.id),
            title: reminder.title,
            body: reminder.body,
            schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
            extra: { reminderId: reminder.id, taskId: reminder.taskId },
            smallIcon: 'ic_stat_priora',
            iconColor: '#0a0a0a',
          },
        ],
      })
      return true
    } catch {
      return false
    }
  }

  return showWebNotification(reminder.title, reminder.body, reminder.id)
}

/** Instant test notification from Settings. */
export async function sendTestNotification(): Promise<{ ok: boolean; message: string }> {
  const allowed = await requestNotificationPermission()
  if (!allowed) {
    return {
      ok: false,
      message: 'Permission denied. Enable notifications for Priora in system settings.',
    }
  }

  await db.settings.update('main', { notificationsEnabled: true })

  if (isNative()) {
    try {
      await ensureNativeChannel()
      const id = 9_000_001
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'Priora test',
            body: 'Reminders work. You will also get alerts 30 minutes before task deadlines.',
            schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
            channelId: 'priora-reminders',
            smallIcon: 'ic_stat_priora',
            iconColor: '#0a0a0a',
          },
        ],
      })
      return { ok: true, message: 'Test notification scheduled — it should appear in about 1 second.' }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to schedule native notification.',
      }
    }
  }

  const shown = await showWebNotification(
    'Priora test',
    'Reminders work. You will also get alerts 30 minutes before task deadlines.',
    'priora-test',
  )
  if (!shown) {
    return { ok: false, message: 'Browser blocked the notification.' }
  }
  return { ok: true, message: 'Test notification sent.' }
}

export async function fireDueReminders() {
  const settings = await db.settings.get('main')
  if (settings && !settings.notificationsEnabled) return 0

  const now = new Date().toISOString()
  const pending = await db.reminders.filter((r) => !r.fired).toArray()
  const dueList = pending.filter((r) => (r.snoozedUntil ?? r.fireAt) <= now)

  let fired = 0
  for (const reminder of dueList) {
    const shown = await showReminderNotification(reminder)
    if (shown || isNative()) {
      // On native, OS may already have delivered a scheduled notif; mark done either way
      await db.reminders.update(reminder.id, { fired: true })
      fired += 1
    }
  }

  return fired
}

export async function snoozeReminder(reminderId: string, minutes: number) {
  const until = new Date(Date.now() + minutes * 60_000).toISOString()
  await db.reminders.update(reminderId, {
    snoozedUntil: until,
    fired: false,
  })
  const reminder = await db.reminders.get(reminderId)
  if (reminder) await scheduleNativeNotification(reminder)
}

/** Re-schedule future native notifications after app launch / permission grant. */
export async function resyncPendingNotifications() {
  if (!isNative()) return
  const pending = await db.reminders.filter((r) => !r.fired).toArray()
  const future = pending.filter((r) => new Date(r.snoozedUntil ?? r.fireAt).getTime() > Date.now())
  for (const reminder of future) {
    await scheduleNativeNotification(reminder)
  }
}

export function startReminderTicker(intervalMs = 20_000) {
  void (async () => {
    await resyncPendingNotifications()
    await fireDueReminders()
  })()
  return window.setInterval(() => {
    void fireDueReminders()
  }, intervalMs)
}
