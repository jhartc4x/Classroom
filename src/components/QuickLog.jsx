import { useState } from 'react'
import { useStore, useCurrentClass, useChipMaps } from '../store'
import { PALETTES } from '../data'
import { timeAgo, burstConfetti, describeLog } from '../utils'
import { Card, SectionTitle, EmptyState, BigButton } from './ui'
import { useToast } from '../App'
import { cellMapOf, unseatedStudents, SeatGrid } from './seating'

function StudentGrid({ selected, onSelect }) {
  const cls = useCurrentClass()
  const logs = useStore((s) => s.logs)
  const openStudent = useStore((s) => s.openStudent)
  const plans = useStore((s) => s.plans)
  const { bMap } = useChipMaps()
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const today = new Date().setHours(0, 0, 0, 0)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {cls.students.map((st) => {
        const todayLogs = logs.filter((l) => l.studentId === st.id && l.ts >= today)
        const negs = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'neg').length
        const pos = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'pos').length
        const active = selected === st.id
        const hasPlan = !!plans[st.id]?.type
        return (
          <div key={st.id} className="relative">
            <button
              onClick={() => onSelect(active ? null : st.id)}
              className={`sticker w-full rounded-2xl p-3 pr-8 text-left transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ${
                active ? `${pal.chip} ring-2 ${pal.ring} -rotate-1 scale-105` : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-display font-bold">
                {hasPlan && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" title="Has a support plan on file — tap 📇 for details" />}
                {st.name}
              </div>
              <div className="mt-0.5 flex gap-2 text-xs font-bold text-ink/50">
                {pos > 0 && <span>🌟 {pos}</span>}
                {negs > 0 && <span>⚠️ {negs}</span>}
                {pos === 0 && negs === 0 && <span className="text-ink/30">no marks today</span>}
              </div>
            </button>
            <button
              onClick={() => openStudent(st.id)}
              className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-sm opacity-50 hover:bg-ink/10 hover:opacity-100 cursor-pointer"
              title={`${st.name}'s history & parent contacts`}
              aria-label={`Open ${st.name}'s history and parent contacts`}
            >
              📇
            </button>
          </div>
        )
      })}
    </div>
  )
}

function SeatMarks({ studentId, bMap }) {
  const logs = useStore((s) => s.logs)
  const today = new Date().setHours(0, 0, 0, 0)
  const todayLogs = logs.filter((l) => l.studentId === studentId && l.ts >= today)
  const negs = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'neg').length
  const pos = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'pos').length
  if (pos === 0 && negs === 0) return null
  return (
    <div className="mt-0.5 flex justify-center gap-1.5 text-[10px] font-bold text-ink/50">
      {pos > 0 && <span>🌟{pos}</span>}
      {negs > 0 && <span>⚠️{negs}</span>}
    </div>
  )
}

function SeatingView({ selected, onSelect }) {
  const cls = useCurrentClass()
  const plans = useStore((s) => s.plans)
  const { bMap } = useChipMaps()
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const seating = cls.seating
  const cellMap = cellMapOf(seating)
  const tray = unseatedStudents(cls)
  const nameOf = (id) => cls.students.find((s) => s.id === id)?.name ?? '?'

  const seatCount = seating ? Object.keys(seating.seats).length : 0
  if (!seating || seatCount === 0) {
    return (
      <EmptyState
        emoji="🪑"
        title="No seating chart yet"
        hint="Set one up in Setup → your class → 🪑 Seating. Then tap a desk to log, right from the seating map."
      />
    )
  }

  return (
    <div>
      <SeatGrid
        cols={seating.cols}
        rows={seating.rows}
        renderCell={(r, c) => {
          const occupant = cellMap[`${r},${c}`]
          if (!occupant)
            return <div key={`${r},${c}`} className="h-16 rounded-xl border-2 border-dashed border-ink/10" />
          const active = selected === occupant
          return (
            <button
              key={`${r},${c}`}
              onClick={() => onSelect(active ? null : occupant)}
              className={`sticker flex h-16 flex-col items-center justify-center rounded-xl p-1 text-center text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                active ? `${pal.chip} ring-2 ${pal.ring} scale-105` : 'bg-white'
              }`}
            >
              <span className="flex items-center gap-1 leading-tight">
                {plans[occupant]?.type && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" title="Has a support plan on file" />
                )}
                {nameOf(occupant)}
              </span>
              <SeatMarks studentId={occupant} bMap={bMap} />
            </button>
          )
        }}
      />
      {tray.length > 0 && (
        <div className="mt-3 rounded-2xl bg-cream p-3">
          <div className="mb-1.5 text-sm font-bold text-ink/50">Not seated — tap to log</div>
          <div className="flex flex-wrap gap-2">
            {tray.map((st) => (
              <button
                key={st.id}
                onClick={() => onSelect(selected === st.id ? null : st.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all hover:scale-105 cursor-pointer ${
                  selected === st.id ? `${pal.chip} ring-2 ${pal.ring}` : 'bg-white ring-1 ring-ink/10'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionPanel({ studentId, onDone }) {
  const cls = useCurrentClass()
  const addLog = useStore((s) => s.addLog)
  const openStudent = useStore((s) => s.openStudent)
  const { behaviors, interventions } = useChipMaps()
  const toast = useToast()
  const student = cls.students.find((s) => s.id === studentId)
  const [note, setNote] = useState('')
  if (!student) return null

  const log = (kind, item) => {
    addLog({ classId: cls.id, studentId, kind, code: item.code, note: note.trim() })
    if (kind === 'behavior' && item.polarity === 'pos') burstConfetti()
    toast(`${item.emoji} ${item.label} → ${student.name}`)
    setNote('')
    onDone()
  }

  return (
    <Card className="animate-slide-up mt-4 border-2 border-ink/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-display text-lg font-bold">
          Logging for <span className="rounded-xl bg-amber-200 px-2 py-0.5">{student.name}</span>
        </div>
        <button
          onClick={() => openStudent(student.id)}
          className="shrink-0 rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-ink/10 cursor-pointer"
        >
          📇 History &amp; contacts
        </button>
      </div>
      <div className="mb-1 text-sm font-bold text-ink/50">Behavior</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {behaviors.map((b) => (
          <button
            key={b.code}
            onClick={() => log('behavior', b)}
            className={`rounded-2xl px-3 py-2 font-bold transition-all hover:scale-105 active:scale-90 cursor-pointer ${
              b.polarity === 'pos'
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-900'
            }`}
          >
            {b.emoji} {b.label}
          </button>
        ))}
      </div>
      <div className="mb-1 text-sm font-bold text-ink/50">Intervention tried</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {interventions.map((i) => (
          <button
            key={i.code}
            onClick={() => log('intervention', i)}
            className="rounded-2xl bg-sky-50 px-3 py-2 font-bold text-sky-900 transition-all hover:scale-105 hover:bg-sky-100 active:scale-90 cursor-pointer"
          >
            {i.emoji} {i.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (attached to next tap)…"
        className="w-full rounded-2xl bg-white px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
      />
    </Card>
  )
}

function TodayFeed() {
  const cls = useCurrentClass()
  const logs = useStore((s) => s.logs)
  const deleteLog = useStore((s) => s.deleteLog)
  const { bMap, iMap, cMap } = useChipMaps()
  const toast = useToast()
  const today = new Date().setHours(0, 0, 0, 0)
  const todayLogs = logs.filter((l) => l.classId === cls.id && l.ts >= today).slice(0, 20)

  if (todayLogs.length === 0) return null
  return (
    <div className="mt-8">
      <SectionTitle emoji="🧾">Today in {cls.name}</SectionTitle>
      <div className="flex flex-col gap-2">
        {todayLogs.map((l) => {
          const st = cls.students.find((s) => s.id === l.studentId)
          return (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2 ring-1 ring-ink/5">
              <span className="font-bold">{st?.name ?? '?'}</span>
              <span className="text-sm">{describeLog(l, bMap, iMap, cMap)}</span>
              {l.note && <span className="text-sm italic text-ink/50">“{l.note}”</span>}
              <span className="ml-auto text-xs font-bold text-ink/40">{timeAgo(l.ts)}</span>
              <button
                onClick={() => { deleteLog(l.id); toast('Undone ↩️') }}
                className="text-xs font-bold text-ink/40 hover:text-rose-500 cursor-pointer"
                title="Undo this entry"
              >
                undo
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function QuickLog() {
  const cls = useCurrentClass()
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list')

  if (!cls)
    return (
      <EmptyState
        emoji="🎒"
        title="No classes yet"
        hint="Head to Setup to add your classes and rosters — takes about a minute."
      />
    )
  if (cls.students.length === 0)
    return (
      <EmptyState
        emoji="🧑‍🎓"
        title={`${cls.name} has no students yet`}
        hint="Add the roster in Setup — you can paste a whole list at once."
      />
    )

  return (
    <div>
      <SectionTitle
        emoji="✏️"
        right={
          <div className="flex overflow-hidden rounded-2xl text-sm font-bold ring-1 ring-ink/10">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 cursor-pointer ${view === 'list' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView('seating')}
              className={`px-3 py-2 cursor-pointer ${view === 'seating' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}
            >
              🪑 Seating
            </button>
          </div>
        }
      >
        Tap a student, then tap what happened
      </SectionTitle>
      {view === 'list' ? (
        <StudentGrid selected={selected} onSelect={setSelected} />
      ) : (
        <SeatingView selected={selected} onSelect={setSelected} />
      )}
      {selected && <ActionPanel studentId={selected} onDone={() => setSelected(null)} />}
      <TodayFeed />
    </div>
  )
}
