import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { useStore, useCurrentClass } from './store'
import { PALETTES } from './data'
import { findCurrentPeriod, findNextPeriod, minutesNow, fmtHM, parseHM, downloadFile, todayKey } from './utils'
import Timers from './components/Timers'
import QuickLog from './components/QuickLog'
import Reminders from './components/Reminders'
import Radar from './components/Radar'
import Setup from './components/Setup'
import Toolbox from './components/Toolbox'
import Trends from './components/Trends'
import StudentModal from './components/StudentModal'
import EndOfDay from './components/EndOfDay'
import AssessmentPrep from './components/AssessmentPrep'
import Guide from './components/Guide'
import { Modal } from './components/ui'

const TABS = [
  { id: 'log', label: 'Quick Log', emoji: '✏️' },
  { id: 'timers', label: 'Timers', emoji: '⏱️' },
  { id: 'toolbox', label: 'Toolbox', emoji: '🎲' },
  { id: 'reminders', label: 'Reminders', emoji: '📣' },
  { id: 'radar', label: 'Radar', emoji: '🛟' },
  { id: 'trends', label: 'Trends', emoji: '📈' },
  { id: 'guide', label: 'Guide', emoji: '🧭' },
  { id: 'setup', label: 'Setup', emoji: '🎒' },
]

// ---------- toasts ----------
const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="sticker animate-slide-up rounded-2xl bg-ink px-4 py-2 font-bold text-white">
          {t.text}
        </div>
      ))}
    </div>
  )
}

const WEEK = 7 * 24 * 60 * 60 * 1000
const SNOOZE = 3 * 24 * 60 * 60 * 1000

// Gently reminds the teacher to back up when it's been a while — local data is only
// as safe as the last export.
function BackupNudge() {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const lastBackupTs = useStore((s) => s.lastBackupTs)
  const dismissedTs = useStore((s) => s.backupNudgeDismissedTs)
  const exportData = useStore((s) => s.exportData)
  const markBackedUp = useStore((s) => s.markBackedUp)
  const dismiss = useStore((s) => s.dismissBackupNudge)
  const toast = useToast()

  if (classes.length === 0 || logs.length === 0) return null

  const firstActivity = Math.min(...logs.map((l) => l.ts))
  const reference = lastBackupTs ?? firstActivity
  const due = Date.now() - reference > WEEK
  const snoozed = dismissedTs && Date.now() - dismissedTs < SNOOZE
  if (!due || snoozed) return null

  const daysSince = Math.floor((Date.now() - reference) / (24 * 60 * 60 * 1000))
  const doBackup = () => {
    downloadFile(
      `classroom-backup-${todayKey()}.json`,
      exportData(),
      'application/json',
    )
    markBackedUp()
    toast('Backup downloaded 💾')
  }

  return (
    <div className="mx-auto mb-4 flex max-w-5xl items-center gap-3 rounded-2xl border-2 border-sky-300 bg-sky-50 px-4 py-3 sticker animate-slide-up">
      <span className="text-2xl">💾</span>
      <div className="flex-1 text-sm font-bold">
        {lastBackupTs
          ? `It's been ${daysSince} days since your last backup.`
          : "You haven't backed up yet — your data lives only in this browser."}{' '}
        <span className="font-normal text-ink/60">A quick download keeps it safe.</span>
      </div>
      <button
        onClick={doBackup}
        className="rounded-full bg-ink px-4 py-1.5 font-display font-bold text-white hover:scale-105 active:scale-95 cursor-pointer"
      >
        ⬇️ Back up now
      </button>
      <button
        onClick={dismiss}
        className="rounded-full px-3 py-1.5 text-sm font-bold text-ink/40 hover:bg-ink/5 cursor-pointer"
      >
        Later
      </button>
    </div>
  )
}

function ReminderBanner() {
  const reminders = useStore((s) => s.reminders)
  const dismissReminderFor = useStore((s) => s.dismissReminderFor)
  const cls = useCurrentClass()
  if (!cls) return null

  const dueHere = reminders.filter(
    (r) =>
      !r.done &&
      (r.classIds.length === 0 || r.classIds.includes(cls.id)) &&
      !r.dismissed.includes(cls.id),
  )
  if (dueHere.length === 0) return null

  return (
    <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-2">
      {dueHere.map((r) => (
        <div
          key={r.id}
          className="sticker animate-slide-up flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 py-3"
        >
          <span className="animate-wiggle text-2xl">📣</span>
          <div className="flex-1 font-bold">{r.text}</div>
          <button
            onClick={() => dismissReminderFor(r.id, cls.id)}
            className="rounded-full bg-amber-300 px-4 py-1.5 font-display font-bold hover:bg-amber-400 active:scale-95 cursor-pointer"
          >
            Got it ✓
          </button>
        </div>
      ))}
    </div>
  )
}

// Same-day nudge for scheduled assessments, cross-referencing IEP/504 accommodations.
function AssessmentBanner() {
  const assessments = useStore((s) => s.assessments)
  const openAssessment = useStore((s) => s.openAssessment)
  const cls = useCurrentClass()
  if (!cls) return null

  const today = todayKey()
  const dueToday = assessments.filter((a) => a.date === today && a.classIds.includes(cls.id))
  if (dueToday.length === 0) return null

  return (
    <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-2">
      {dueToday.map((a) => (
        <div
          key={a.id}
          className="sticker animate-slide-up flex items-center gap-3 rounded-2xl border-2 border-violet-300 bg-violet-100 px-4 py-3"
        >
          <span className="animate-wiggle text-2xl">📋</span>
          <div className="flex-1 font-bold">
            Today is <span className="italic">{a.name}</span> for this class — check accommodations.
          </div>
          <button
            onClick={() => openAssessment(a.id)}
            className="rounded-full bg-violet-300 px-4 py-1.5 font-display font-bold hover:bg-violet-400 active:scale-95 cursor-pointer"
          >
            View prep list
          </button>
        </div>
      ))}
    </div>
  )
}

function ClassPicker() {
  const classes = useStore((s) => s.classes)
  const currentClassId = useStore((s) => s.currentClassId)
  const setCurrentClass = useStore((s) => s.setCurrentClass)

  if (classes.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {classes.map((c) => {
        const pal = PALETTES[c.color] ?? PALETTES.sky
        const active = c.id === currentClassId
        return (
          <button
            key={c.id}
            onClick={() => setCurrentClass(c.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all active:scale-90 cursor-pointer ${
              active ? `${pal.chip} ring-2 ${pal.ring} scale-105 shadow` : 'bg-white/70 ring-1 ring-ink/10 hover:scale-105'
            }`}
          >
            {c.emoji} {c.name}
          </button>
        )
      })}
    </div>
  )
}

function BackupStatus({ onGoToSetup }) {
  const classes = useStore((s) => s.classes)
  const lastBackupTs = useStore((s) => s.lastBackupTs)
  if (classes.length === 0) return null

  const daysSince = lastBackupTs ? Math.floor((Date.now() - lastBackupTs) / (24 * 60 * 60 * 1000)) : null
  const overdue = daysSince == null || daysSince >= 7
  const label = daysSince == null ? 'Back up' : daysSince === 0 ? 'Backed up today' : `${daysSince}d since backup`

  return (
    <button
      onClick={onGoToSetup}
      title="Open backup and export options"
      className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
        overdue ? 'bg-amber-100 text-amber-900 ring-amber-300' : 'bg-white/70 text-ink/70 ring-ink/10'
      }`}
    >
      💾 {label}
    </button>
  )
}

function StudentSearch({ open, onClose }) {
  const classes = useStore((s) => s.classes)
  const setCurrentClass = useStore((s) => s.setCurrentClass)
  const openStudent = useStore((s) => s.openStudent)
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase()
  const matches = normalized
    ? classes.flatMap((cls) => cls.students.filter((student) => student.name.toLocaleLowerCase().includes(normalized)).map((student) => ({ cls, student }))).slice(0, 12)
    : []

  const choose = ({ cls, student }) => {
    setCurrentClass(cls.id)
    openStudent(student.id)
    setQuery('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Find a student" emoji="🔎">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a student name…"
        className="w-full rounded-2xl bg-white px-4 py-2 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
      />
      <div className="mt-3 flex flex-col gap-2">
        {!normalized && <p className="px-1 text-sm text-ink/60">Search every class and jump straight to a student&apos;s private card.</p>}
        {normalized && matches.length === 0 && <p className="px-1 text-sm text-ink/60">No students match “{query}”.</p>}
        {matches.map((match) => (
          <button
            key={match.student.id}
            onClick={() => choose(match)}
            className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-left font-bold hover:bg-sky-100 cursor-pointer"
          >
            <span>{match.student.name}</span>
            <span className="text-sm text-ink/60">{match.cls.emoji} {match.cls.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function MiniTimer({ onGoToTimers }) {
  const activeTimer = useStore((s) => s.activeTimer)
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!activeTimer || activeTimer.pausedRemaining != null) return
    const iv = setInterval(() => forceTick((n) => n + 1), 500)
    return () => clearInterval(iv)
  }, [activeTimer])

  if (!activeTimer) return null
  const remaining =
    activeTimer.pausedRemaining != null
      ? activeTimer.pausedRemaining
      : (activeTimer.endsAt - Date.now()) / 1000
  const m = Math.floor(Math.max(0, remaining) / 60)
  const s = String(Math.floor(Math.max(0, remaining) % 60)).padStart(2, '0')
  return (
    <button
      onClick={onGoToTimers}
      className={`sticker flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 font-display font-bold text-white cursor-pointer ${
        remaining <= 0 ? 'animate-pulse-ring bg-rose-500' : ''
      }`}
    >
      {activeTimer.emoji} {m}:{s}
    </button>
  )
}

// Countdown to the end of the current bell-schedule period; also auto-selects
// the mapped class when a new period begins (if auto-switch is on).
function BellPill({ onGoToSetup }) {
  const bellSchedules = useStore((s) => s.bellSchedules)
  const activeScheduleId = useStore((s) => s.activeScheduleId)
  const autoSwitch = useStore((s) => s.autoSwitch)
  const setCurrentClass = useStore((s) => s.setCurrentClass)
  const [, tick] = useState(0)
  const lastPeriodRef = useRef(null)

  const schedule = bellSchedules.find((b) => b.id === activeScheduleId)
  const period = findCurrentPeriod(schedule)

  useEffect(() => {
    const iv = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    // Key on period + its mapping so remapping the current period switches immediately,
    // while a manual class pick within a period is left alone.
    const key = period ? `${period.id}:${period.classId ?? ''}` : null
    if (key === lastPeriodRef.current) return
    lastPeriodRef.current = key
    if (autoSwitch && period?.classId) setCurrentClass(period.classId)
  }, [period, autoSwitch, setCurrentClass])

  if (!schedule) return null

  if (period) {
    const left = parseHM(period.end) - minutesNow()
    const m = Math.floor(left)
    const s = String(Math.floor((left - m) * 60)).padStart(2, '0')
    const low = left <= 2
    return (
      <button
        onClick={onGoToSetup}
        title={`${schedule.name} — ${period.label} ends at ${fmtHM(period.end)}`}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1 cursor-pointer transition-colors ${
          low ? 'bg-amber-200 ring-amber-400 animate-pulse-ring' : 'bg-white/70 ring-ink/10'
        }`}
      >
        🔔 {period.label} · {m}:{s} left
      </button>
    )
  }

  const next = findNextPeriod(schedule)
  return (
    <button
      onClick={onGoToSetup}
      title={schedule.name}
      className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-ink/60 ring-1 ring-ink/10 cursor-pointer"
    >
      🔔 {next ? `${next.label} at ${fmtHM(next.start)}` : 'done for today 🎉'}
    </button>
  )
}

export default function App() {
  const classes = useStore((s) => s.classes)
  const [tab, setTab] = useState(classes.length === 0 ? 'guide' : 'log')
  const [toasts, setToasts] = useState([])
  const [endOfDayOpen, setEndOfDayOpen] = useState(false)
  const [studentSearchOpen, setStudentSearchOpen] = useState(false)

  const toast = useCallback((text) => {
    const id = Math.random()
    setToasts((ts) => [...ts, { id, text }])
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2200)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            <span className="mr-1 inline-block animate-float">🎒</span> Ms. Ambrogio&apos;s Classroom
          </h1>
          <div className="flex items-center gap-3">
            <MiniTimer onGoToTimers={() => setTab('timers')} />
            <BellPill onGoToSetup={() => setTab('setup')} />
            <BackupStatus onGoToSetup={() => setTab('setup')} />
            {classes.length > 0 && (
              <button
                onClick={() => setEndOfDayOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 hover:scale-105 active:scale-95 cursor-pointer"
                title="End-of-day summary"
              >
                🌅 Wrap up
              </button>
            )}
            <ClassPicker />
            {classes.length > 0 && (
              <button
                onClick={() => setStudentSearchOpen(true)}
                className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 hover:scale-105 active:scale-95 cursor-pointer"
              >
                🔎 Find student
              </button>
            )}
          </div>
        </header>

        <BackupNudge />
        <ReminderBanner />
        <AssessmentBanner />

        <nav className="mb-6 flex flex-nowrap gap-2 overflow-x-auto pb-2" aria-label="App sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`shrink-0 rounded-2xl px-4 py-2 font-display font-bold transition-all active:scale-95 cursor-pointer ${
                tab === t.id
                  ? 'sticker -rotate-1 scale-105 bg-ink text-white'
                  : 'bg-white/70 ring-1 ring-ink/10 hover:scale-105 hover:-rotate-1'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </nav>

        <main className="animate-pop" key={tab}>
          {tab === 'log' && <QuickLog />}
          {tab === 'timers' && <Timers />}
          {tab === 'toolbox' && <Toolbox />}
          {tab === 'reminders' && <Reminders />}
          {tab === 'radar' && <Radar />}
          {tab === 'trends' && <Trends />}
          {tab === 'guide' && <Guide onNavigate={setTab} hasClasses={classes.length > 0} />}
          {tab === 'setup' && <Setup />}
        </main>
      </div>
      <EndOfDay open={endOfDayOpen} onClose={() => setEndOfDayOpen(false)} />
      <StudentModal />
      <StudentSearch open={studentSearchOpen} onClose={() => setStudentSearchOpen(false)} />
      <AssessmentPrep />
      <Toasts toasts={toasts} />
    </ToastContext.Provider>
  )
}
