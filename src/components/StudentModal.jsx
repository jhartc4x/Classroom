import { useState } from 'react'
import { useStore, useChipMaps, findStudent } from '../store'
import { CONCERNS, SHINE_REASONS, PALETTES, GOAL_STATUSES, PLAN_TYPES } from '../data'
import { describeLog, timeAgo, downloadFile, logsToCSV, byCode } from '../utils'
import { Modal, BigButton, Chip } from './ui'
import { useToast } from '../App'

const concernByCode = byCode(CONCERNS)
const shineByCode = byCode(SHINE_REASONS)
const goalStatusByCode = byCode(GOAL_STATUSES)
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000

const kindBadge = {
  behavior: 'bg-rose-100 text-rose-800',
  intervention: 'bg-sky-100 text-sky-800',
  contact: 'bg-violet-100 text-violet-800',
}

function GoalRow({ studentId, goal }) {
  const updateGoalStatus = useStore((s) => s.updateGoalStatus)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const addGoalNote = useStore((s) => s.addGoalNote)
  const deleteGoalNote = useStore((s) => s.deleteGoalNote)
  const [noteText, setNoteText] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const addNote = () => {
    if (!noteText.trim()) return
    addGoalNote(studentId, goal.id, noteText.trim())
    setNoteText('')
    setShowNotes(true)
  }

  return (
    <div className="rounded-xl bg-white/70 p-2.5 ring-1 ring-ink/5">
      <div className="flex items-start gap-2">
        <span className="shrink-0">{goalStatusByCode[goal.status]?.emoji}</span>
        <span className="flex-1 text-sm font-bold">{goal.text}</span>
        <select
          value={goal.status}
          onChange={(e) => updateGoalStatus(studentId, goal.id, e.target.value)}
          className="shrink-0 rounded-lg bg-cream px-2 py-1 text-xs font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
        >
          {GOAL_STATUSES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => deleteGoal(studentId, goal.id)}
          className="shrink-0 text-xs font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
          title="Delete goal"
          aria-label={`Delete goal: ${goal.text}`}
        >
          ✕
        </button>
      </div>
      <button
        onClick={() => setShowNotes((v) => !v)}
        className="mt-1 text-xs font-bold text-violet-600 hover:underline cursor-pointer"
      >
        {goal.notes.length === 0 ? '+ add progress note' : `${showNotes ? 'hide' : 'show'} ${goal.notes.length} progress note${goal.notes.length === 1 ? '' : 's'}`}
      </button>
      {showNotes && (
        <div className="mt-1.5 flex flex-col gap-1">
          {goal.notes.map((n) => (
            <div key={n.id} className="flex items-center gap-2 rounded-lg bg-cream px-2 py-1 text-xs">
              <span className="flex-1">{n.text}</span>
              <span className="shrink-0 text-ink/40">{timeAgo(n.ts)}</span>
              <button
                onClick={() => deleteGoalNote(studentId, goal.id, n.id)}
                className="shrink-0 text-ink/30 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-1.5">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Progress note…"
              className="min-w-0 flex-1 rounded-lg bg-cream px-2 py-1 text-xs ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={addNote}
              disabled={!noteText.trim()}
              className="shrink-0 rounded-lg bg-ink px-2 py-1 text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlanSection({ student }) {
  const plans = useStore((s) => s.plans)
  const accommodationOptions = useStore((s) => s.accommodationOptions)
  const setPlanType = useStore((s) => s.setPlanType)
  const setPlanReviewDate = useStore((s) => s.setPlanReviewDate)
  const toggleAccommodationCode = useStore((s) => s.toggleAccommodationCode)
  const addCustomAccommodation = useStore((s) => s.addCustomAccommodation)
  const removeCustomAccommodation = useStore((s) => s.removeCustomAccommodation)
  const addGoal = useStore((s) => s.addGoal)
  const deletePlan = useStore((s) => s.deletePlan)
  const toast = useToast()

  const [adding, setAdding] = useState(false)
  const [customText, setCustomText] = useState('')
  const [goalText, setGoalText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const plan = plans[student.id]

  if (!plan || !plan.type) {
    return adding ? (
      <div className="rounded-2xl bg-cream p-3">
        <div className="mb-2 text-sm font-bold text-ink/60">What kind of plan?</div>
        <div className="flex gap-2">
          {PLAN_TYPES.map((t) => (
            <Chip key={t.code} onClick={() => setPlanType(student.id, t.code)}>
              {t.label}
            </Chip>
          ))}
          <button onClick={() => setAdding(false)} className="text-sm font-bold text-ink/40 hover:underline cursor-pointer">
            cancel
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setAdding(true)}
        className="self-start rounded-full bg-ink/5 px-3 py-1.5 text-sm font-bold hover:bg-violet-100 hover:text-violet-800 cursor-pointer"
      >
        + Add IEP/504 plan
      </button>
    )
  }

  const addCustom = () => {
    if (!customText.trim()) return
    addCustomAccommodation(student.id, customText.trim())
    setCustomText('')
  }
  const addNewGoal = () => {
    if (!goalText.trim()) return
    addGoal(student.id, goalText.trim())
    setGoalText('')
  }

  return (
    <div className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-display font-bold">🎯 {PLAN_TYPES.find((t) => t.code === plan.type)?.label ?? plan.type} plan</span>
        <label className="flex items-center gap-1.5 text-xs font-bold text-ink/50">
          Review date
          <input
            type="date"
            value={plan.reviewDate}
            onChange={(e) => setPlanReviewDate(student.id, e.target.value)}
            className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
          />
        </label>
        {confirmDelete ? (
          <span className="ml-auto flex items-center gap-2 text-xs font-bold">
            Remove plan?
            <button onClick={() => { deletePlan(student.id); toast('Plan removed') }} className="rounded-full bg-rose-400 px-2.5 py-1 text-white hover:bg-rose-500 cursor-pointer">
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-ink/50 hover:underline cursor-pointer">
              cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="ml-auto text-xs font-bold text-ink/30 hover:text-rose-500 cursor-pointer">
            remove plan
          </button>
        )}
      </div>

      <div className="mb-1 text-sm font-bold text-ink/50">Accommodations</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {accommodationOptions.map((a) => (
          <Chip key={a.code} active={plan.accommodationCodes.includes(a.code)} onClick={() => toggleAccommodationCode(student.id, a.code)}>
            {a.emoji} {a.label}
          </Chip>
        ))}
      </div>
      {plan.customAccommodations.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {plan.customAccommodations.map((a) => (
            <span key={a.id} className="flex items-center gap-1 rounded-full bg-violet-200 px-3 py-1 text-sm font-bold text-violet-900">
              {a.text}
              <button onClick={() => removeCustomAccommodation(student.id, a.id)} className="text-violet-900/50 hover:text-rose-600 cursor-pointer">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-3 flex gap-1.5">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Other accommodation…"
          className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button onClick={addCustom} disabled={!customText.trim()} className="shrink-0 rounded-lg bg-ink px-3 py-1 text-sm font-bold text-white disabled:opacity-40 cursor-pointer">
          Add
        </button>
      </div>

      <div className="mb-1 text-sm font-bold text-ink/50">Goals & progress</div>
      <div className="flex flex-col gap-1.5">
        {plan.goals.map((g) => (
          <GoalRow key={g.id} studentId={student.id} goal={g} />
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNewGoal()}
          placeholder="New goal…"
          className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button onClick={addNewGoal} disabled={!goalText.trim()} className="shrink-0 rounded-lg bg-ink px-3 py-1 text-sm font-bold text-white disabled:opacity-40 cursor-pointer">
          Add goal
        </button>
      </div>
    </div>
  )
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
  const activeWatch = student ? flags.find((f) => f.active && (f.kind ?? 'watch') === 'watch' && f.studentId === student.id) : null
  const activeShine = student ? flags.find((f) => f.active && f.kind === 'shine' && f.studentId === student.id) : null
  const pal = cls ? PALETTES[cls.color] ?? PALETTES.sky : PALETTES.sky

  const logContact = () => {
    addLog({ classId: cls.id, studentId: student.id, kind: 'contact', code: method, note: note.trim() })
    const m = cMap[method]
    toast(`${m.emoji} ${m.label} logged for ${student.name}`)
    setNote('')
  }

  const flag = (concern, kind = 'watch') => {
    addFlag(student.id, cls.id, concern, '', kind)
    toast(kind === 'shine' ? `${student.name} added to Shine 🌟` : `${student.name} added to the radar 🛟`)
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

          {/* Radar status — Watch (struggling) and Shine (doing well) are independent */}
          <div className="grid gap-2 sm:grid-cols-2">
            {activeWatch ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
                🛟 On your radar — {concernByCode[activeWatch.concern]?.emoji} {concernByCode[activeWatch.concern]?.label}
              </div>
            ) : (
              <div>
                <div className="mb-1 text-sm font-bold text-ink/50">Add to Watch</div>
                <div className="flex flex-wrap gap-2">
                  {CONCERNS.map((c) => (
                    <Chip key={c.code} onClick={() => flag(c.code, 'watch')}>
                      {c.emoji} {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {activeShine ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">
                🌟 On Shine — {shineByCode[activeShine.concern]?.emoji} {shineByCode[activeShine.concern]?.label}
              </div>
            ) : (
              <div>
                <div className="mb-1 text-sm font-bold text-ink/50">Add to Shine</div>
                <div className="flex flex-wrap gap-2">
                  {SHINE_REASONS.map((c) => (
                    <Chip key={c.code} onClick={() => flag(c.code, 'shine')}>
                      {c.emoji} {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* IEP / 504 plan */}
          <PlanSection student={student} />

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
                      aria-label={`Delete ${describeLog(l, bMap, iMap, cMap)} entry`}
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
