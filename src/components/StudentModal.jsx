import { useState } from 'react'
import { useStore, useChipMaps, findStudent } from '../store'
import { CONCERNS, PALETTES } from '../data'
import { describeLog, timeAgo, downloadFile, logsToCSV, byCode } from '../utils'
import { Modal, BigButton, Chip } from './ui'
import { useToast } from '../App'

const concernByCode = byCode(CONCERNS)
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000

const kindBadge = {
  behavior: 'bg-rose-100 text-rose-800',
  intervention: 'bg-sky-100 text-sky-800',
  contact: 'bg-violet-100 text-violet-800',
}

export default function StudentModal() {
  const viewingStudent = useStore((s) => s.viewingStudent)
  const closeStudent = useStore((s) => s.closeStudent)
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const addLog = useStore((s) => s.addLog)
  const deleteLog = useStore((s) => s.deleteLog)
  const addFlag = useStore((s) => s.addFlag)
  const { bMap, iMap, cMap, contactMethods, behaviors, interventions } = useChipMaps()
  const toast = useToast()

  const [method, setMethod] = useState('phone')
  const [note, setNote] = useState('')

  const { student, cls } = findStudent(classes, viewingStudent)
  const open = !!student

  // Everything below is safe to compute against nulls when closed.
  const studentLogs = student ? logs.filter((l) => l.studentId === student.id).sort((a, b) => b.ts - a.ts) : []
  const negs = studentLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'neg' && Date.now() - l.ts < TWO_WEEKS).length
  const pos = studentLogs.filter((l) => l.kind === 'behavior' && bMap[l.code]?.polarity === 'pos').length
  const contacts = studentLogs.filter((l) => l.kind === 'contact').length
  const activeFlag = student ? flags.find((f) => f.active && f.studentId === student.id) : null
  const pal = cls ? PALETTES[cls.color] ?? PALETTES.sky : PALETTES.sky

  const logContact = () => {
    addLog({ classId: cls.id, studentId: student.id, kind: 'contact', code: method, note: note.trim() })
    const m = cMap[method]
    toast(`${m.emoji} ${m.label} logged for ${student.name}`)
    setNote('')
  }

  const flag = (concern) => {
    addFlag(student.id, cls.id, concern)
    toast(`${student.name} added to the radar 🛟`)
  }

  return (
    <Modal open={open} onClose={closeStudent} title={student?.name ?? ''} emoji="📇" wide>
      {student && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-xl px-2 py-0.5 text-sm font-bold ${pal.chip}`}>
              {cls.emoji} {cls.name}
            </span>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-sm font-bold text-rose-800">⚠️ {negs} in 2 wks</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-bold text-emerald-800">🌟 {pos}</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-sm font-bold text-violet-800">📞 {contacts}</span>
            <button
              onClick={() => {
                downloadFile(
                  `${student.name.replace(/[^\w-]+/g, '-')}-history.csv`,
                  logsToCSV(studentLogs, classes, behaviors, interventions),
                )
                toast(`${student.name}'s history exported 📊`)
              }}
              disabled={studentLogs.length === 0}
              className="ml-auto rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-sky-100 hover:text-sky-800 cursor-pointer disabled:opacity-40"
            >
              📊 Export CSV
            </button>
          </div>

          {/* Radar status */}
          {activeFlag ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
              🛟 On your radar — {concernByCode[activeFlag.concern]?.emoji} {concernByCode[activeFlag.concern]?.label}
            </div>
          ) : (
            <div>
              <div className="mb-1 text-sm font-bold text-ink/50">Add to radar</div>
              <div className="flex flex-wrap gap-2">
                {CONCERNS.map((c) => (
                  <Chip key={c.code} onClick={() => flag(c.code)}>
                    {c.emoji} {c.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Log a parent contact */}
          <div className="rounded-2xl bg-cream p-3">
            <div className="mb-2 font-display font-bold">📞 Log a parent / guardian contact</div>
            <div className="mb-2 flex flex-wrap gap-2">
              {contactMethods.map((m) => (
                <Chip key={m.code} active={method === m.code} onClick={() => setMethod(m.code)}>
                  {m.emoji} {m.label}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logContact()}
                placeholder="What was discussed? (optional)"
                className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
              />
              <BigButton className="shrink-0 bg-ink text-white" onClick={logContact}>
                Log it
              </BigButton>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="mb-2 font-display font-bold">🧾 History</div>
            {studentLogs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center text-sm text-ink/50">
                Nothing logged yet. Behaviors, interventions, and contacts will show up here.
              </div>
            ) : (
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                {studentLogs.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 ring-1 ring-ink/5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${kindBadge[l.kind] ?? 'bg-ink/5'}`}>
                      {l.kind}
                    </span>
                    <span className="text-sm font-bold">{describeLog(l, bMap, iMap, cMap)}</span>
                    {l.note && <span className="truncate text-sm italic text-ink/50">“{l.note}”</span>}
                    <span className="ml-auto shrink-0 text-xs font-bold text-ink/40">{timeAgo(l.ts)}</span>
                    <button
                      onClick={() => { deleteLog(l.id); toast('Entry removed ↩️') }}
                      className="shrink-0 text-xs font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
                      title="Delete this entry"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
