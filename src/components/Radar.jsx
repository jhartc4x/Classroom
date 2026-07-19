import { useState } from 'react'
import { useStore, useChipMaps } from '../store'
import { CONCERNS, SHINE_REASONS, SUGGESTIONS, PALETTES } from '../data'
import { timeAgo, downloadFile, byCode, logsToCSV } from '../utils'
import { Card, SectionTitle, EmptyState, BigButton, Chip, Modal } from './ui'
import { useToast } from '../App'

const concernByCode = byCode(CONCERNS)
const shineByCode = byCode(SHINE_REASONS)
const reasonByCode = (kind) => (kind === 'shine' ? shineByCode : concernByCode)
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000

// A flag predates `kind` if it was created before Shine mode existed — treat as 'watch'.
const flagKind = (f) => f.kind ?? 'watch'

function AddFlagModal({ open, onClose, kind }) {
  const classes = useStore((s) => s.classes)
  const addFlag = useStore((s) => s.addFlag)
  const toast = useToast()
  const [classId, setClassId] = useState(null)
  const [studentId, setStudentId] = useState(null)
  const [reason, setReason] = useState(null)
  const [note, setNote] = useState('')

  const cls = classes.find((c) => c.id === classId)
  const reasons = kind === 'shine' ? SHINE_REASONS : CONCERNS

  const save = () => {
    addFlag(studentId, classId, reason, note.trim(), kind)
    toast(kind === 'shine' ? 'Added to Shine 🌟' : 'Added to the radar 🛟')
    setClassId(null); setStudentId(null); setReason(null); setNote('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={kind === 'shine' ? 'Recognize a student' : 'Add a student to the radar'} emoji={kind === 'shine' ? '🌟' : '🛟'} wide>
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1 text-sm font-bold text-ink/50">Class</div>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Chip key={c.id} active={classId === c.id} onClick={() => { setClassId(c.id); setStudentId(null) }}>
                {c.emoji} {c.name}
              </Chip>
            ))}
          </div>
        </div>
        {cls && (
          <div>
            <div className="mb-1 text-sm font-bold text-ink/50">Student</div>
            <div className="flex flex-wrap gap-2">
              {cls.students.map((st) => (
                <Chip key={st.id} active={studentId === st.id} onClick={() => setStudentId(st.id)}>
                  {st.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {studentId && (
          <div>
            <div className="mb-1 text-sm font-bold text-ink/50">{kind === 'shine' ? 'What are they doing well?' : 'What are you seeing?'}</div>
            <div className="flex flex-wrap gap-2">
              {reasons.map((c) => (
                <Chip key={c.code} active={reason === c.code} onClick={() => setReason(c.code)}>
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {reason && (
          <>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note — what prompted this?"
              className="w-full rounded-2xl bg-white px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
            />
            <BigButton className="bg-ink text-white" onClick={save}>
              {kind === 'shine' ? 'Add to Shine' : 'Add to radar'}
            </BigButton>
          </>
        )}
      </div>
    </Modal>
  )
}

function WatchBody({ flag, cls, student, studentLogs, iMap }) {
  const addLog = useStore((s) => s.addLog)
  const toast = useToast()
  const [expanded, setExpanded] = useState(false)

  const concern = concernByCode[flag.concern]
  const recentNeg = studentLogs.filter((l) => l.kind === 'behavior' && Date.now() - l.ts < TWO_WEEKS && l.__neg)
  const triedCodes = new Set(studentLogs.filter((l) => l.kind === 'intervention').map((l) => l.code))
  // Skip suggestions already tried, or whose intervention chip the teacher has since removed.
  const suggestions = (SUGGESTIONS[flag.concern] ?? []).filter((s) => !triedCodes.has(s.code) && iMap[s.code])
  const nextUp = suggestions.slice(0, expanded ? undefined : 2)

  const tryIt = (code) => {
    const item = iMap[code]
    if (!item) return
    addLog({ classId: cls.id, studentId: student.id, kind: 'intervention', code, note: `via radar (${concern.label})` })
    toast(`${item.emoji} ${item.label} logged for ${student.name}`)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 text-sm font-bold text-ink/60">
        <span>⚠️ {recentNeg.length} incident{recentNeg.length === 1 ? '' : 's'} in 2 wks</span>
        <span>
          🧰 tried:{' '}
          {triedCodes.size === 0 ? 'nothing yet' : [...triedCodes].map((c) => iMap[c]?.emoji ?? '·').join(' ')}
        </span>
      </div>

      <div className="rounded-2xl bg-cream p-3">
        <div className="mb-2 text-sm font-bold text-ink/50">💡 Next moves to try</div>
        {suggestions.length === 0 ? (
          <div className="text-sm text-ink/50">
            You&apos;ve tried the whole playbook — time to loop in the counselor or your team. 💪
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {nextUp.map((s) => {
              const item = iMap[s.code]
              return (
                <div key={s.code} className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="font-bold">{item.emoji} {item.label}</span>
                    <span className="ml-2 text-sm text-ink/60">{s.why}</span>
                  </div>
                  <button
                    onClick={() => tryIt(s.code)}
                    className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 hover:bg-emerald-200 active:scale-95 cursor-pointer"
                  >
                    I tried it ✓
                  </button>
                </div>
              )
            })}
            {suggestions.length > 2 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="self-start text-sm font-bold text-sky-600 hover:underline cursor-pointer"
              >
                {expanded ? 'Show fewer' : `Show ${suggestions.length - 2} more ideas…`}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function ShineBody({ studentLogs }) {
  const recentPos = studentLogs.filter((l) => l.kind === 'behavior' && Date.now() - l.ts < TWO_WEEKS && l.__pos)
  return (
    <div className="flex flex-wrap gap-3 text-sm font-bold text-ink/60">
      <span>🌟 {recentPos.length} positive mark{recentPos.length === 1 ? '' : 's'} in 2 wks</span>
    </div>
  )
}

function FlagCard({ flag }) {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const resolveFlag = useStore((s) => s.resolveFlag)
  const openStudent = useStore((s) => s.openStudent)
  const toast = useToast()

  const { bMap, iMap, behaviors, interventions } = useChipMaps()
  const kind = flagKind(flag)

  const cls = classes.find((c) => c.id === flag.classId)
  const student = cls?.students.find((s) => s.id === flag.studentId)
  if (!cls || !student) return null
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const reason = reasonByCode(kind)[flag.concern]
  if (!reason) return null

  const studentLogs = logs
    .filter((l) => l.studentId === student.id)
    .map((l) => ({ ...l, __neg: bMap[l.code]?.polarity === 'neg', __pos: bMap[l.code]?.polarity === 'pos' }))

  return (
    <Card className={`flex flex-col gap-3 ${kind === 'shine' ? 'ring-1 ring-amber-100' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-xl px-2 py-0.5 font-display font-bold ${pal.chip}`}>{student.name}</span>
        <span className="text-sm font-bold text-ink/50">{cls.emoji} {cls.name}</span>
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-sm font-bold">
          {reason.emoji} {reason.label}
        </span>
        <span className="ml-auto text-xs font-bold text-ink/40">
          {kind === 'shine' ? 'noted' : 'flagged'} {timeAgo(flag.ts)}
        </span>
      </div>
      {flag.note && <div className="text-sm italic text-ink/60">“{flag.note}”</div>}

      {kind === 'shine' ? (
        <ShineBody studentLogs={studentLogs} />
      ) : (
        <WatchBody flag={flag} cls={cls} student={student} studentLogs={studentLogs} iMap={iMap} />
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => openStudent(student.id)}
          className="mr-auto rounded-full bg-ink/5 px-4 py-1.5 text-sm font-bold hover:bg-ink/10 cursor-pointer"
          title="Full history & log a parent contact"
        >
          📇 Details &amp; contacts
        </button>
        <button
          onClick={() => {
            downloadFile(
              `${student.name.replace(/[^\w-]+/g, '-')}-history.csv`,
              logsToCSV(studentLogs, classes, behaviors, interventions),
            )
            toast(`${student.name}'s history exported 📊`)
          }}
          disabled={studentLogs.length === 0}
          className="rounded-full bg-ink/5 px-4 py-1.5 text-sm font-bold hover:bg-sky-100 hover:text-sky-800 cursor-pointer disabled:opacity-40"
          title="Export this student's full history — handy for conferences and referrals"
        >
          📊 History CSV
        </button>
        <button
          onClick={() => {
            resolveFlag(flag.id)
            toast(kind === 'shine' ? `Noted — keep it up, ${student.name}! 🌟` : `${student.name} is off the radar — nice work! 🎉`)
          }}
          className="rounded-full bg-ink/5 px-4 py-1.5 text-sm font-bold hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
        >
          {kind === 'shine' ? '✓ Noted' : '🎉 Doing better — resolve'}
        </button>
      </div>
    </Card>
  )
}

function AutoWatch() {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const addFlag = useStore((s) => s.addFlag)
  const { bMap } = useChipMaps()
  const toast = useToast()

  const flaggedIds = new Set(flags.filter((f) => f.active && flagKind(f) === 'watch').map((f) => f.studentId))
  const counts = {}
  for (const l of logs) {
    if (l.kind !== 'behavior') continue
    if (bMap[l.code]?.polarity !== 'neg') continue
    if (Date.now() - l.ts > TWO_WEEKS) continue
    counts[l.studentId] = (counts[l.studentId] ?? 0) + 1
  }
  const candidates = []
  for (const c of classes)
    for (const st of c.students)
      if (!flaggedIds.has(st.id) && (counts[st.id] ?? 0) >= 3)
        candidates.push({ student: st, cls: c, n: counts[st.id] })

  if (candidates.length === 0) return null
  return (
    <div className="mb-6 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 font-display font-bold">👀 Worth watching (3+ incidents in 2 weeks)</div>
      <div className="flex flex-wrap gap-2">
        {candidates.map(({ student, cls, n }) => (
          <button
            key={student.id}
            onClick={() => { addFlag(student.id, cls.id, 'behavior', `Auto-suggested after ${n} incidents`, 'watch'); toast(`${student.name} added to radar 🛟`) }}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-amber-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {student.name} · ⚠️ {n} — add to radar?
          </button>
        ))}
      </div>
    </div>
  )
}

function AutoShine() {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const addFlag = useStore((s) => s.addFlag)
  const { bMap } = useChipMaps()
  const toast = useToast()

  const flaggedIds = new Set(flags.filter((f) => f.active && flagKind(f) === 'shine').map((f) => f.studentId))
  const counts = {}
  for (const l of logs) {
    if (l.kind !== 'behavior') continue
    if (bMap[l.code]?.polarity !== 'pos') continue
    if (Date.now() - l.ts > TWO_WEEKS) continue
    counts[l.studentId] = (counts[l.studentId] ?? 0) + 1
  }
  const candidates = []
  for (const c of classes)
    for (const st of c.students)
      if (!flaggedIds.has(st.id) && (counts[st.id] ?? 0) >= 3)
        candidates.push({ student: st, cls: c, n: counts[st.id] })

  if (candidates.length === 0) return null
  return (
    <div className="mb-6 rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4">
      <div className="mb-2 font-display font-bold">✨ Racking up positives (3+ in 2 weeks)</div>
      <div className="flex flex-wrap gap-2">
        {candidates.map(({ student, cls, n }) => (
          <button
            key={student.id}
            onClick={() => { addFlag(student.id, cls.id, 'participation', `Auto-suggested after ${n} positive marks`, 'shine'); toast(`${student.name} added to Shine 🌟`) }}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-emerald-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {student.name} · 🌟 {n} — add to Shine?
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Radar() {
  const flags = useStore((s) => s.flags)
  const classes = useStore((s) => s.classes)
  const [mode, setMode] = useState('watch')
  const [adding, setAdding] = useState(false)
  const active = flags.filter((f) => f.active && flagKind(f) === mode)

  if (classes.length === 0)
    return <EmptyState emoji="🛟" title="Set up your classes first" hint="The radar tracks students you're keeping an eye on — add classes in Setup." />

  const isShine = mode === 'shine'

  return (
    <div>
      <SectionTitle
        emoji={isShine ? '🌟' : '🛟'}
        right={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-2xl text-sm font-bold ring-1 ring-ink/10">
              <button onClick={() => setMode('watch')} className={`px-3 py-2 cursor-pointer ${mode === 'watch' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                🛟 Watch
              </button>
              <button onClick={() => setMode('shine')} className={`px-3 py-2 cursor-pointer ${mode === 'shine' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                🌟 Shine
              </button>
            </div>
            <BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>
              {isShine ? '+ Recognize student' : '+ Add student'}
            </BigButton>
          </div>
        }
      >
        {isShine ? 'Students to recognize' : 'Students on your radar'}
      </SectionTitle>
      {isShine ? <AutoShine /> : <AutoWatch />}
      {active.length === 0 ? (
        isShine ? (
          <EmptyState
            emoji="🌱"
            title="Nobody flagged yet"
            hint="Recognize a student who's participating well, asking great questions, or being a good citizen — not just the ones who've improved from a rough patch."
            action={<BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>+ Recognize student</BigButton>}
          />
        ) : (
          <EmptyState
            emoji="🌤️"
            title="Radar is clear"
            hint="Flag a student you're worried about — struggling, checked out, or having a rough stretch — and get suggested next moves."
            action={<BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>+ Add student</BigButton>}
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((f) => (
            <FlagCard key={f.id} flag={f} />
          ))}
        </div>
      )}
      <AddFlagModal open={adding} onClose={() => setAdding(false)} kind={mode} />
    </div>
  )
}
