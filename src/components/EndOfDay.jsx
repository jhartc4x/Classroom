import { useStore, useChipMaps } from '../store'
import { describeLog } from '../utils'
import { Modal } from './ui'

const startOfToday = () => new Date().setHours(0, 0, 0, 0)

function Tile({ emoji, label, value }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-3 text-center ring-1 ring-ink/5">
      <div className="text-2xl">{emoji}</div>
      <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs font-bold text-ink/50">{label}</div>
    </div>
  )
}

function Section({ title, items, renderItem, empty }) {
  return (
    <div>
      <div className="mb-1.5 font-display font-bold">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-xl bg-white/60 px-3 py-2 text-sm text-ink/40">{empty}</div>
      ) : (
        <div className="flex flex-col gap-1">{items.map(renderItem)}</div>
      )}
    </div>
  )
}

export default function EndOfDay({ open, onClose }) {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const reminders = useStore((s) => s.reminders)
  const openStudent = useStore((s) => s.openStudent)
  const { bMap, iMap, cMap } = useChipMaps()

  const today = startOfToday()
  const todayLogs = logs.filter((l) => l.ts >= today)
  const nameOf = (id) => {
    for (const c of classes) {
      const st = c.students.find((s) => s.id === id)
      if (st) return st.name
    }
    return '?'
  }

  const wins = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'pos')
  const incidents = todayLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'neg')
  const interventions = todayLogs.filter((l) => l.kind === 'intervention')
  const contacts = todayLogs.filter((l) => l.kind === 'contact')

  // Students with 2+ incidents today, or on the radar with any activity today.
  const flaggedIds = new Set(flags.filter((f) => f.active).map((f) => f.studentId))
  const incidentByStudent = {}
  for (const l of incidents) incidentByStudent[l.studentId] = (incidentByStudent[l.studentId] ?? 0) + 1
  const followUp = Object.entries(incidentByStudent)
    .filter(([id, n]) => n >= 2 || flaggedIds.has(id))
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => b.n - a.n)

  const pendingReminders = reminders.filter((r) => !r.done)

  const dateStr = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Modal open={open} onClose={onClose} title={`End of day — ${dateStr}`} emoji="🌅" wide>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile emoji="🌟" label="Shout-outs" value={wins.length} />
          <Tile emoji="⚠️" label="Incidents" value={incidents.length} />
          <Tile emoji="🧰" label="Interventions" value={interventions.length} />
          <Tile emoji="📞" label="Contacts" value={contacts.length} />
        </div>

        <Section
          title="🎉 Wins today"
          items={wins.slice(0, 12)}
          empty="No shout-outs logged today — tomorrow's a fresh chance to catch some good."
          renderItem={(l) => (
            <button key={l.id} onClick={() => openStudent(l.studentId)} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-left text-sm hover:bg-ink/5 cursor-pointer">
              <span className="font-bold">{nameOf(l.studentId)}</span>
              <span>{describeLog(l, bMap, iMap, cMap)}</span>
            </button>
          )}
        />

        <Section
          title="👀 Keep an eye on"
          items={followUp}
          empty="Nobody flagged for follow-up. Smooth day! 🌤️"
          renderItem={({ id, n }) => (
            <button key={id} onClick={() => openStudent(id)} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-left text-sm hover:bg-ink/5 cursor-pointer">
              <span className="font-bold">{nameOf(id)}</span>
              {flaggedIds.has(id) && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">🛟 radar</span>}
              <span className="ml-auto text-sm font-bold text-rose-500">⚠️ {n} today</span>
            </button>
          )}
        />

        <Section
          title="📞 Parent contacts made"
          items={contacts}
          empty="No parent contacts logged today."
          renderItem={(l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm">
              <span className="font-bold">{nameOf(l.studentId)}</span>
              <span>{describeLog(l, bMap, iMap, cMap)}</span>
              {l.note && <span className="truncate italic text-ink/50">“{l.note}”</span>}
            </div>
          )}
        />

        <Section
          title="📣 Still pending"
          items={pendingReminders}
          empty="All reminders handled — inbox zero! ✅"
          renderItem={(r) => {
            const targets = r.classIds.length ? r.classIds : classes.map((c) => c.id)
            const remaining = targets.filter((t) => !r.dismissed.includes(t)).length
            return (
              <div key={r.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm">
                <span>📌</span>
                <span className="font-bold">{r.text}</span>
                {remaining > 0 && <span className="ml-auto text-xs font-bold text-ink/40">{remaining} class{remaining === 1 ? '' : 'es'} to go</span>}
              </div>
            )
          }}
        />

        <div className="rounded-2xl bg-amber-50 p-3 text-center font-display font-bold text-amber-900">
          That&apos;s a wrap — {wins.length >= incidents.length ? 'more wins than worries today. Nice work! 🎈' : 'tomorrow is a fresh start. You’ve got this. 💪'}
        </div>
      </div>
    </Modal>
  )
}
