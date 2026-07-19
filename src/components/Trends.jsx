import { useState, useMemo } from 'react'
import { useStore, useChipMaps } from '../store'
import { PALETTES } from '../data'
import { Card, SectionTitle, EmptyState } from './ui'

const C = {
  neg: '#fb7185', // rose-400 — incidents
  pos: '#34d399', // emerald-400 — positives
  intervention: '#38bdf8', // sky-400
  contact: '#a78bfa', // violet-400
  neutral: '#94a3b8', // slate-400
}

const DAY = 24 * 60 * 60 * 1000
const WINDOWS = [
  { key: 14, label: '2 weeks' },
  { key: 30, label: '30 days' },
  { key: 0, label: 'All time' },
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Horizontal bar with a direct value label — magnitude is never color-alone.
function Bar({ label, value, max, color, onClick }) {
  const pct = max > 0 ? Math.max(value > 0 ? 6 : 0, (value / max) * 100) : 0
  return (
    <div
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer hover:bg-ink/5 rounded-lg px-1 -mx-1' : ''}`}
      onClick={onClick}
    >
      <div className="w-32 shrink-0 truncate text-sm font-bold" title={label}>
        {label}
      </div>
      <div className="relative h-3 flex-1 rounded-full bg-ink/5">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-7 shrink-0 text-right text-sm font-bold tabular-nums text-ink/70">{value}</div>
    </div>
  )
}

function Panel({ title, children, empty }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="font-display font-bold">{title}</div>
      {empty ? <div className="py-4 text-center text-sm text-ink/40">{empty}</div> : children}
    </Card>
  )
}

function StatTile({ emoji, label, value, color }) {
  return (
    <div className="sticker flex flex-col items-center rounded-2xl bg-white p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="font-display text-2xl font-extrabold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-xs font-bold text-ink/50">{label}</div>
    </div>
  )
}

export default function Trends() {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const currentClassId = useStore((s) => s.currentClassId)
  const openStudent = useStore((s) => s.openStudent)
  const { bMap, iMap } = useChipMaps()

  const [scope, setScope] = useState('all') // 'all' | 'current'
  const [win, setWin] = useState(14)

  const analysis = useMemo(() => {
    const cutoff = win === 0 ? 0 : Date.now() - win * DAY
    const inScope = (l) =>
      l.ts >= cutoff && (scope === 'all' || l.classId === currentClassId)
    const scoped = logs.filter(inScope)

    const isNeg = (l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'neg'
    const isPos = (l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'pos'

    const totals = {
      neg: scoped.filter(isNeg).length,
      pos: scoped.filter(isPos).length,
      intervention: scoped.filter((l) => l.kind === 'intervention').length,
      contact: scoped.filter((l) => l.kind === 'contact').length,
    }

    // Per-class climate (only meaningful in all-classes scope)
    const perClass = classes.map((c) => ({
      name: `${c.emoji} ${c.name}`,
      neg: scoped.filter((l) => l.classId === c.id && isNeg(l)).length,
      pos: scoped.filter((l) => l.classId === c.id && isPos(l)).length,
    }))

    // Behavior breakdown
    const behaviorCounts = {}
    for (const l of scoped) if (l.kind === 'behavior') behaviorCounts[l.code] = (behaviorCounts[l.code] ?? 0) + 1
    const behaviors = Object.entries(behaviorCounts)
      .map(([code, n]) => ({ code, n, item: bMap[code] }))
      .filter((b) => b.item)
      .sort((a, b) => b.n - a.n)

    // Interventions
    const interventionCounts = {}
    for (const l of scoped) if (l.kind === 'intervention') interventionCounts[l.code] = (interventionCounts[l.code] ?? 0) + 1
    const interventions = Object.entries(interventionCounts)
      .map(([code, n]) => ({ code, n, item: iMap[code] }))
      .filter((i) => i.item)
      .sort((a, b) => b.n - a.n)

    // By day of week (incidents)
    const byDay = WEEKDAYS.map((d) => ({ label: d, value: 0 }))
    for (const l of scoped) if (isNeg(l)) byDay[new Date(l.ts).getDay()].value += 1

    // Students to watch — incident counts + "slipping" (last 7d vs prior fortnight)
    const now = Date.now()
    const flaggedIds = new Set(flags.filter((f) => f.active && (f.kind ?? 'watch') === 'watch').map((f) => f.studentId))
    const students = []
    for (const c of classes) {
      if (scope === 'current' && c.id !== currentClassId) continue
      for (const st of c.students) {
        const mine = logs.filter((l) => l.studentId === st.id)
        const negWin = mine.filter((l) => isNeg(l) && l.ts >= cutoff).length
        const posWin = mine.filter((l) => isPos(l) && l.ts >= cutoff).length
        const recent7 = mine.filter((l) => isNeg(l) && now - l.ts <= 7 * DAY).length
        const prior = mine.filter((l) => isNeg(l) && now - l.ts > 7 * DAY && now - l.ts <= 21 * DAY).length
        const priorWeekly = prior / 2
        // "Slipping" = a clear jump this week over the prior fortnight's weekly baseline.
        const slipping = recent7 >= 2 && recent7 - priorWeekly >= 2
        if (negWin > 0 || slipping)
          students.push({ st, cls: c, negWin, posWin, slipping, onRadar: flaggedIds.has(st.id) })
      }
    }
    students.sort((a, b) => Number(b.slipping) - Number(a.slipping) || b.negWin - a.negWin)

    return { totals, perClass, behaviors, interventions, byDay, students: students.slice(0, 10) }
  }, [logs, classes, flags, scope, win, currentClassId, bMap, iMap])

  if (classes.length === 0)
    return <EmptyState emoji="📈" title="No data yet" hint="Trends show up once you have classes and a few logged moments." />

  const a = analysis
  const hasAny = a.totals.neg + a.totals.pos + a.totals.intervention + a.totals.contact > 0
  const behaviorMax = Math.max(1, ...a.behaviors.map((b) => b.n))
  const interventionMax = Math.max(1, ...a.interventions.map((i) => i.n))
  const dayMax = Math.max(1, ...a.byDay.map((d) => d.value))
  const classMax = Math.max(1, ...a.perClass.flatMap((c) => [c.neg, c.pos]))

  return (
    <div>
      <SectionTitle
        emoji="📈"
        right={
          <div className="flex flex-wrap gap-2">
            <div className="flex overflow-hidden rounded-2xl text-sm font-bold ring-1 ring-ink/10">
              <button onClick={() => setScope('current')} className={`px-3 py-2 cursor-pointer ${scope === 'current' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                This class
              </button>
              <button onClick={() => setScope('all')} className={`px-3 py-2 cursor-pointer ${scope === 'all' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                All classes
              </button>
            </div>
            <div className="flex overflow-hidden rounded-2xl text-sm font-bold ring-1 ring-ink/10">
              {WINDOWS.map((w) => (
                <button key={w.key} onClick={() => setWin(w.key)} className={`px-3 py-2 cursor-pointer ${win === w.key ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        Trends
      </SectionTitle>

      {!hasAny ? (
        <EmptyState emoji="🌱" title="Nothing logged in this window" hint="Try a wider time range, or log a few moments in Quick Log." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile emoji="⚠️" label="Incidents" value={a.totals.neg} color={C.neg} />
            <StatTile emoji="🌟" label="Positives" value={a.totals.pos} color={C.pos} />
            <StatTile emoji="🧰" label="Interventions" value={a.totals.intervention} color={C.intervention} />
            <StatTile emoji="📞" label="Contacts" value={a.totals.contact} color={C.contact} />
          </div>

          {scope === 'all' && (
            <Panel title="🏫 Classroom climate by period" empty={a.perClass.every((c) => c.neg + c.pos === 0) ? 'No behavior logs yet.' : null}>
              <div className="mb-1 flex gap-4 text-xs font-bold text-ink/50">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: C.neg }} /> Incidents</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: C.pos }} /> Positives</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {a.perClass.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 text-sm font-bold">{c.name}</div>
                    <div className="flex flex-col gap-1">
                      <Bar label="⚠️ Incidents" value={c.neg} max={classMax} color={C.neg} />
                      <Bar label="🌟 Positives" value={c.pos} max={classMax} color={C.pos} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="🎭 Most common behaviors" empty={a.behaviors.length === 0 ? 'No behaviors logged yet.' : null}>
              <div className="flex flex-col gap-1.5">
                {a.behaviors.map((b) => (
                  <Bar
                    key={b.code}
                    label={`${b.item.emoji} ${b.item.label}`}
                    value={b.n}
                    max={behaviorMax}
                    color={b.item.polarity === 'pos' ? C.pos : C.neg}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="🧰 Most-used interventions" empty={a.interventions.length === 0 ? 'No interventions logged yet.' : null}>
              <div className="flex flex-col gap-1.5">
                {a.interventions.map((i) => (
                  <Bar key={i.code} label={`${i.item.emoji} ${i.item.label}`} value={i.n} max={interventionMax} color={C.intervention} />
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="📅 When incidents happen" empty={a.totals.neg === 0 ? 'No incidents in this window.' : null}>
              <div className="flex flex-col gap-1.5">
                {a.byDay.map((d) => (
                  <Bar key={d.label} label={d.label} value={d.value} max={dayMax} color={C.neutral} />
                ))}
              </div>
            </Panel>

            <Panel title="👀 Students to watch" empty={a.students.length === 0 ? 'Nobody trending — nice and calm! 🌤️' : null}>
              <div className="flex flex-col gap-1.5">
                {a.students.map(({ st, cls, negWin, posWin, slipping, onRadar }) => (
                  <button
                    key={st.id}
                    onClick={() => openStudent(st.id)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-ink/5 cursor-pointer"
                  >
                    <span className="font-bold">{st.name}</span>
                    <span className="text-xs font-bold text-ink/40">{cls.emoji}</span>
                    {slipping && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">📈 slipping</span>}
                    {onRadar && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">🛟 radar</span>}
                    <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: C.neg }}>⚠️ {negWin}</span>
                    {posWin > 0 && <span className="text-sm font-bold tabular-nums" style={{ color: C.pos }}>🌟 {posWin}</span>}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
