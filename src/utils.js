import { CONTACT_METHODS } from './data'

export const uid = () => Math.random().toString(36).slice(2, 10)

// Build a { code: item } lookup from a chip list.
export const byCode = (arr) => Object.fromEntries((arr ?? []).map((x) => [x.code, x]))

// Fisher–Yates shuffle (returns a new array).
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Human label for a log entry, given the current chip maps.
export function describeLog(log, bMap = {}, iMap = {}, cMap = {}) {
  const map = log.kind === 'behavior' ? bMap : log.kind === 'contact' ? cMap : iMap
  const item = map[log.code]
  if (item) return `${item.emoji} ${item.label}`
  return log.code // chip was removed — fall back to its code
}

export const fmtClock = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export const fmtDuration = (seconds) => {
  if (seconds % 60 === 0) return `${seconds / 60} min`
  return fmtClock(seconds)
}

export const timeAgo = (ts) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

// Calendar features use the device's local date, not UTC. This keeps an assessment
// scheduled for "today" visible throughout the local school day.
export const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- bell schedule helpers ----------
export const parseHM = (hm) => {
  if (!hm || !/^\d{1,2}:\d{2}$/.test(hm)) return null
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export const minutesNow = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

export const fmtHM = (hm) => {
  const mins = parseHM(hm)
  if (mins == null) return hm ?? ''
  const h = Math.floor(mins / 60)
  const m = String(mins % 60).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${((h + 11) % 12) + 1}:${m}${ampm}`
}

export const sortedPeriods = (schedule) =>
  [...(schedule?.periods ?? [])].sort((a, b) => (parseHM(a.start) ?? 9999) - (parseHM(b.start) ?? 9999))

export function findCurrentPeriod(schedule, nowMins = minutesNow()) {
  if (!schedule) return null
  return (
    sortedPeriods(schedule).find((p) => {
      const s = parseHM(p.start)
      const e = parseHM(p.end)
      return s != null && e != null && nowMins >= s && nowMins < e
    }) ?? null
  )
}

export function findNextPeriod(schedule, nowMins = minutesNow()) {
  if (!schedule) return null
  return sortedPeriods(schedule).find((p) => (parseHM(p.start) ?? -1) > nowMins) ?? null
}

// ---------- CSV ----------
export function toCSV(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
}

export function downloadFile(filename, content, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CONTACT_MAP = byCode(CONTACT_METHODS)

// Flatten logs (behaviors, interventions, parent contacts) into a CSV string.
export function logsToCSV(logs, classes, behaviors, interventions) {
  const bMap = byCode(behaviors)
  const iMap = byCode(interventions)
  const rows = [['Date', 'Time', 'Class', 'Student', 'Type', 'What', 'Note']]
  const sorted = [...logs].sort((a, b) => a.ts - b.ts)
  for (const l of sorted) {
    const cls = classes.find((c) => c.id === l.classId)
    const student = cls?.students.find((st) => st.id === l.studentId)
    const item =
      l.kind === 'behavior' ? bMap[l.code] : l.kind === 'contact' ? CONTACT_MAP[l.code] : iMap[l.code]
    const type =
      l.kind === 'behavior'
        ? bMap[l.code]?.polarity === 'pos'
          ? 'Positive'
          : 'Behavior'
        : l.kind === 'contact'
          ? 'Parent contact'
          : 'Intervention'
    const d = new Date(l.ts)
    rows.push([
      d.toLocaleDateString(),
      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      cls?.name ?? '?',
      student?.name ?? '?',
      type,
      item?.label ?? l.code,
      l.note ?? '',
    ])
  }
  return toCSV(rows)
}

// Cheerful three-note chime, no audio assets needed.
export function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99] // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.6)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.65)
    })
    setTimeout(() => ctx.close(), 2000)
  } catch {
    // audio blocked — no big deal
  }
}

// Tiny DOM confetti burst for positive moments.
export function burstConfetti() {
  const emojis = ['🎉', '✨', '⭐', '🌟', '💫']
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div')
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
    const size = 14 + Math.random() * 18
    Object.assign(el.style, {
      position: 'fixed',
      left: `${20 + Math.random() * 60}vw`,
      top: '-30px',
      fontSize: `${size}px`,
      zIndex: 9999,
      pointerEvents: 'none',
      transition: `transform ${1.2 + Math.random()}s cubic-bezier(0.2, 0.6, 0.4, 1), opacity 0.4s ease ${1 + Math.random()}s`,
    })
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      el.style.transform = `translateY(${70 + Math.random() * 25}vh) rotate(${(Math.random() - 0.5) * 540}deg)`
      el.style.opacity = '0'
    })
    setTimeout(() => el.remove(), 2600)
  }
}
