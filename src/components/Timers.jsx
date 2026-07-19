import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { fmtDuration, playChime } from '../utils'
import { Card, SectionTitle, BigButton, Modal, EmptyState } from './ui'
import { useToast } from '../App'

const RING_R = 90
const RING_C = 2 * Math.PI * RING_R

function ActiveTimer() {
  const t = useStore((s) => s.activeTimer)
  const pauseTimer = useStore((s) => s.pauseTimer)
  const resumeTimer = useStore((s) => s.resumeTimer)
  const stopTimer = useStore((s) => s.stopTimer)
  const addTimerMinute = useStore((s) => s.addTimerMinute)
  const [, tick] = useState(0)
  const chimedRef = useRef(false)

  const paused = t?.pausedRemaining != null
  const remaining = t ? (paused ? t.pausedRemaining : (t.endsAt - Date.now()) / 1000) : 0
  const done = t && remaining <= 0

  useEffect(() => {
    if (!t || paused) return
    const iv = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(iv)
  }, [t, paused])

  useEffect(() => {
    if (done && !chimedRef.current) {
      chimedRef.current = true
      playChime()
    }
    if (!done) chimedRef.current = false
  }, [done])

  if (!t) return null

  const frac = Math.max(0, remaining) / t.total
  const m = Math.floor(Math.max(0, remaining) / 60)
  const s = String(Math.floor(Math.max(0, remaining) % 60)).padStart(2, '0')

  return (
    <Card className={`mb-6 text-center transition-colors ${done ? 'bg-rose-50 ring-4 ring-rose-300 animate-pulse-ring' : ''}`}>
      <div className="font-display text-xl font-bold">
        {t.emoji} {t.label}
      </div>
      <div className="relative mx-auto my-2 h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={RING_R} fill="none" stroke="#eee7d8" strokeWidth="14" />
          <circle
            cx="100" cy="100" r={RING_R} fill="none"
            stroke={done ? '#f43f5e' : frac < 0.2 ? '#f59e0b' : '#38bdf8'}
            strokeWidth="14" strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.5s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-6xl font-extrabold tabular-nums">
            {done ? '🎉' : `${m}:${s}`}
          </span>
        </div>
      </div>
      {done ? (
        <div className="mb-3 font-display text-2xl font-bold text-rose-500">Time&apos;s up!</div>
      ) : null}
      <div className="flex justify-center gap-2">
        {!done && (
          <>
            <BigButton className="bg-sky-200 hover:bg-sky-300" onClick={addTimerMinute}>
              +1 min
            </BigButton>
            {paused ? (
              <BigButton className="bg-emerald-300 hover:bg-emerald-400" onClick={resumeTimer}>
                ▶ Resume
              </BigButton>
            ) : (
              <BigButton className="bg-amber-200 hover:bg-amber-300" onClick={pauseTimer}>
                ⏸ Pause
              </BigButton>
            )}
          </>
        )}
        <BigButton className="bg-ink/10 hover:bg-ink/20" onClick={stopTimer}>
          {done ? 'Dismiss' : '✕ Stop'}
        </BigButton>
      </div>
    </Card>
  )
}

function AddPresetModal({ open, onClose }) {
  const addTimerPreset = useStore((s) => s.addTimerPreset)
  const toast = useToast()
  const [label, setLabel] = useState('')
  const [minutes, setMinutes] = useState(5)
  const [emoji, setEmoji] = useState('⏱️')
  const emojis = ['⏱️', '☀️', '👯', '🤫', '🧹', '🧠', '📖', '✍️', '🧪', '🎤', '🍿', '🏁']

  const save = () => {
    if (!label.trim() || !minutes) return
    addTimerPreset(label.trim(), emoji, Math.round(minutes * 60))
    toast(`Timer "${label.trim()}" added ⏱️`)
    setLabel('')
    setMinutes(5)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New timer" emoji="⏱️">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Name</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Exit ticket"
            className="w-full rounded-2xl bg-white px-4 py-2 ring-1 ring-ink/10 focus:ring-2 focus:ring-sky-400 outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Minutes</label>
          <input
            type="number" min="0.5" step="0.5"
            value={minutes}
            onChange={(e) => setMinutes(parseFloat(e.target.value))}
            className="w-32 rounded-2xl bg-white px-4 py-2 ring-1 ring-ink/10 focus:ring-2 focus:ring-sky-400 outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Emoji</label>
          <div className="flex flex-wrap gap-1">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`rounded-xl p-2 text-xl cursor-pointer ${emoji === e ? 'bg-sky-200 ring-2 ring-sky-400' : 'hover:bg-ink/5'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <BigButton className="bg-ink text-white" onClick={save} disabled={!label.trim()}>
          Add timer
        </BigButton>
      </div>
    </Modal>
  )
}

export default function Timers() {
  const presets = useStore((s) => s.timerPresets)
  const startTimer = useStore((s) => s.startTimer)
  const deleteTimerPreset = useStore((s) => s.deleteTimerPreset)
  const active = useStore((s) => s.activeTimer)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <ActiveTimer />
      <SectionTitle
        emoji="⏱️"
        right={
          <div className="flex gap-2">
            <BigButton className="bg-white ring-1 ring-ink/10" onClick={() => setEditing((e) => !e)}>
              {editing ? 'Done' : 'Edit'}
            </BigButton>
            <BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>
              + New timer
            </BigButton>
          </div>
        }
      >
        Tap a timer to start
      </SectionTitle>
      {presets.length === 0 ? (
        <EmptyState emoji="⏳" title="No timers yet" hint="Add one and it'll be here for every class, all day." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {presets.map((p) => (
            <div key={p.id} className="relative">
              <button
                onClick={() => startTimer(p)}
                className={`sticker w-full rounded-3xl bg-white p-5 text-center transition-all hover:-rotate-2 hover:scale-105 active:scale-95 cursor-pointer ${
                  active?.label === p.label ? 'ring-2 ring-sky-400' : ''
                }`}
              >
                <div className="text-4xl">{p.emoji}</div>
                <div className="mt-1 font-display text-lg font-bold">{p.label}</div>
                <div className="text-sm font-bold text-ink/50">{fmtDuration(p.seconds)}</div>
              </button>
              {editing && (
                <button
                  onClick={() => deleteTimerPreset(p.id)}
                  className="absolute -right-2 -top-2 rounded-full bg-rose-400 px-2.5 py-1 text-sm font-bold text-white shadow hover:bg-rose-500 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-ink/50">
        💡 Timers stick around all day — start the same one next period without setting anything up again.
      </p>
      <AddPresetModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
