import { useState } from 'react'
import { useStore } from '../store'
import { PALETTES } from '../data'
import { timeAgo } from '../utils'
import { SectionTitle, EmptyState, BigButton, Chip, Card } from './ui'
import { useToast } from '../App'

function NewReminder() {
  const classes = useStore((s) => s.classes)
  const addReminder = useStore((s) => s.addReminder)
  const toast = useToast()
  const [text, setText] = useState('')
  const [target, setTarget] = useState([]) // empty = every class

  const toggle = (id) =>
    setTarget((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const save = () => {
    if (!text.trim()) return
    addReminder(text.trim(), target)
    toast('Reminder set 📣 — it’ll pop up in each class')
    setText('')
    setTarget([])
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="e.g. Collect permission slips · Announce quiz Friday"
          className="w-full rounded-2xl bg-cream px-4 py-3 font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink/50">Show in:</span>
          <Chip active={target.length === 0} onClick={() => setTarget([])}>
            🌍 Every class
          </Chip>
          {classes.map((c) => (
            <Chip key={c.id} active={target.includes(c.id)} onClick={() => toggle(c.id)}>
              {c.emoji} {c.name}
            </Chip>
          ))}
          <BigButton className="ml-auto bg-ink text-white" onClick={save} disabled={!text.trim()}>
            Set reminder
          </BigButton>
        </div>
      </div>
    </Card>
  )
}

export default function Reminders() {
  const reminders = useStore((s) => s.reminders)
  const classes = useStore((s) => s.classes)
  const completeReminder = useStore((s) => s.completeReminder)
  const deleteReminder = useStore((s) => s.deleteReminder)
  const toast = useToast()

  const active = reminders.filter((r) => !r.done)
  const done = reminders.filter((r) => r.done).slice(0, 10)

  const targetsLabel = (r) => {
    if (r.classIds.length === 0) return '🌍 every class'
    return r.classIds
      .map((id) => classes.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => `${c.emoji} ${c.name}`)
      .join(' · ')
  }

  return (
    <div>
      <SectionTitle emoji="📣">Set it once — it pops up in each class</SectionTitle>
      <NewReminder />

      {active.length === 0 && done.length === 0 && (
        <EmptyState
          emoji="🕊️"
          title="Nothing to remember (lucky you)"
          hint='Try something like "Return graded tests" and pick which periods should see it.'
        />
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          {active.map((r) => {
            const targets = r.classIds.length ? r.classIds : classes.map((c) => c.id)
            const remaining = targets.filter((t) => !r.dismissed.includes(t))
            return (
              <div key={r.id} className="sticker flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-xl">📌</span>
                <div className="flex-1">
                  <div className="font-bold">{r.text}</div>
                  <div className="text-xs font-bold text-ink/40">
                    {targetsLabel(r)} · {remaining.length} class{remaining.length === 1 ? '' : 'es'} to go · {timeAgo(r.createdTs)}
                  </div>
                </div>
                <div className="flex gap-1">
                  {targets.map((tid) => {
                    const c = classes.find((x) => x.id === tid)
                    if (!c) return null
                    const pal = PALETTES[c.color] ?? PALETTES.sky
                    const seen = r.dismissed.includes(tid)
                    return (
                      <span
                        key={tid}
                        title={`${c.name}${seen ? ' — done' : ' — pending'}`}
                        className={`h-3 w-3 rounded-full ${seen ? 'bg-ink/15' : pal.dot}`}
                      />
                    )
                  })}
                </div>
                <button
                  onClick={() => { completeReminder(r.id); toast('Reminder finished ✅') }}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                >
                  ✓ Done
                </button>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-8">
          <SectionTitle emoji="🗂️">Recently finished</SectionTitle>
          <div className="flex flex-col gap-1">
            {done.map((r) => (
              <div key={r.id} className="flex items-center gap-2 px-2 py-1 text-sm text-ink/40">
                <span>✅</span>
                <span className="line-through">{r.text}</span>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="ml-auto font-bold hover:text-rose-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
