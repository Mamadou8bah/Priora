import { useEffect, useState } from 'react'
import { Bell, Download, Moon, Sun, Monitor, Vibrate } from 'lucide-react'
import { useSettingsStore } from '../stores/useAppStores'
import { Button, Input, PageHeader, Select } from '../components/ui'
import {
  getNotificationPermissionLabel,
  requestNotificationPermission,
  sendTestNotification,
  resyncPendingNotifications,
} from '../lib/reminders'
import { db } from '../db'
import { cn } from '../lib/utils'

export function SettingsPage() {
  const { settings, stats, load, update } = useSettingsStore()
  const [name, setName] = useState('')
  const [perm, setPerm] = useState('…')
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (settings) setName(settings.userName)
  }, [settings])

  useEffect(() => {
    void getNotificationPermissionLabel().then(setPerm)
  }, [])

  if (!settings) return null

  async function exportData() {
    const data = {
      tasks: await db.tasks.toArray(),
      projects: await db.projects.toArray(),
      categories: await db.categories.toArray(),
      inbox: await db.inbox.toArray(),
      notes: await db.notes.toArray(),
      reminders: await db.reminders.toArray(),
      dailyPlans: await db.dailyPlans.toArray(),
      stats: await db.stats.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `priora-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const themes = [
    { id: 'light' as const, icon: Sun, label: 'Light' },
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
    { id: 'system' as const, icon: Monitor, label: 'System' },
  ]

  async function enableReminders() {
    const ok = await requestNotificationPermission()
    setPerm(await getNotificationPermissionLabel())
    await update({ notificationsEnabled: ok })
    if (ok) await resyncPendingNotifications()
    await load()
    setTestMsg(
      ok
        ? 'Reminders enabled. Deadlines get alerts at 30 minutes before, at due time, and when overdue.'
        : 'Could not enable notifications. Check system permission for Priora.',
    )
  }

  async function runTest() {
    setTesting(true)
    setTestMsg(null)
    const result = await sendTestNotification()
    setPerm(await getNotificationPermissionLabel())
    if (result.ok) await update({ notificationsEnabled: true })
    setTestMsg(result.message)
    setTesting(false)
    await load()
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Settings" subtitle="Private · offline · yours" />

      <section className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Your name</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should Priora greet you?"
            />
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => update({ userName: name.trim() })}
            >
              Save
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => update({ theme: id })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl p-3 border transition',
                  settings.theme === id
                    ? 'border-[var(--accent)] bg-accent-soft'
                    : 'border-app',
                )}
              >
                <Icon size={18} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Daily goal</label>
            <Input
              type="number"
              min={1}
              value={settings.dailyGoal}
              onChange={(e) => update({ dailyGoal: Number(e.target.value) || 5 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Pomodoro (min)</label>
            <Input
              type="number"
              min={5}
              value={settings.pomodoroMinutes}
              onChange={(e) =>
                update({ pomodoroMinutes: Number(e.target.value) || 25 })
              }
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Week starts on</label>
          <Select
            value={settings.weekStartsOn}
            onChange={(e) =>
              update({ weekStartsOn: Number(e.target.value) as 0 | 1 })
            }
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </Select>
        </div>

        <div className="surface rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Bell size={18} className="accent mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">Local reminders</p>
              <p className="text-xs text-muted mt-0.5">
                Permission: <span className="font-medium text-[var(--fg)]">{perm}</span>
                {settings.notificationsEnabled ? ' · on' : ' · off'}
              </p>
              <p className="text-xs text-muted mt-2">
                For each task with a deadline you get: 1 day before, 2 hours before,{' '}
                <span className="font-medium text-[var(--fg)]">30 minutes before</span>, at
                deadline, then overdue follow-ups. Stored on this device — no cloud.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => void enableReminders()}
            >
              <Bell size={14} /> Enable reminders
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={testing}
              onClick={() => void runTest()}
            >
              <Vibrate size={14} /> {testing ? 'Sending…' : 'Send test'}
            </Button>
          </div>
          {testMsg && (
            <p className="text-xs rounded-xl px-3 py-2 bg-accent-soft text-[var(--fg)]">
              {testMsg}
            </p>
          )}
        </div>

        <div className="surface rounded-2xl p-4">
          <p className="text-sm font-medium mb-1">Progress</p>
          <p className="text-muted text-sm">
            Level {stats?.level ?? 1} · {stats?.xp ?? 0} XP · {stats?.tasksCompleted ?? 0}{' '}
            completed · {stats?.streak ?? 0} day streak · {stats?.focusMinutes ?? 0} focus
            minutes
          </p>
        </div>

        <Button variant="secondary" className="w-full" onClick={() => void exportData()}>
          <Download size={16} /> Export local backup
        </Button>

        <p className="text-xs text-muted text-center pt-4">
          Priora v1.0 · Offline-first · No accounts · No tracking
        </p>
      </section>
    </div>
  )
}
