import { useStore } from '../store'
import { PALETTES, PLAN_TYPES } from '../data'
import { Modal } from './ui'
import { useToast } from '../App'

const planLabel = (code) => PLAN_TYPES.find((t) => t.code === code)?.label ?? code

export default function AssessmentPrep() {
  const viewingAssessment = useStore((s) => s.viewingAssessment)
  const closeAssessment = useStore((s) => s.closeAssessment)
  const assessments = useStore((s) => s.assessments)
  const classes = useStore((s) => s.classes)
  const plans = useStore((s) => s.plans)
  const accommodationOptions = useStore((s) => s.accommodationOptions)
  const toggleProvided = useStore((s) => s.toggleProvided)
  const openStudent = useStore((s) => s.openStudent)
  const toast = useToast()

  const assessment = assessments.find((a) => a.id === viewingAssessment)
  const open = !!assessment

  const aMap = Object.fromEntries(accommodationOptions.map((a) => [a.code, a]))
  const rows = []
  if (assessment) {
    for (const classId of assessment.classIds) {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) continue
      for (const st of cls.students) {
        const plan = plans[st.id]
        const hasAccommodations = plan?.type && (plan.accommodationCodes.length > 0 || plan.customAccommodations.length > 0)
        if (hasAccommodations) rows.push({ student: st, cls, plan })
      }
    }
  }

  const dateStr = assessment?.date
    ? new Date(`${assessment.date}T00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    : 'no date set'

  return (
    <Modal open={open} onClose={closeAssessment} title={assessment?.name ?? ''} emoji="📋" wide>
      {assessment && (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-ink/60">{dateStr}</div>
          {assessment.note && <div className="rounded-xl bg-cream px-3 py-2 text-sm italic text-ink/60">“{assessment.note}”</div>}

          {rows.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center text-sm text-ink/50">
              Nobody in these classes has accommodations on file for this assessment.
            </div>
          ) : (
            <div>
              <div className="mb-2 text-sm font-bold text-ink/50">
                {rows.length} student{rows.length === 1 ? '' : 's'} need accommodations — check off as provided
              </div>
              <div className="flex flex-col gap-2">
                {rows.map(({ student, cls, plan }) => {
                  const pal = PALETTES[cls.color] ?? PALETTES.sky
                  const provided = !!assessment.provided[student.id]
                  return (
                    <div key={student.id} className={`rounded-2xl p-3 ${provided ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-white ring-1 ring-ink/5'}`}>
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <button onClick={() => openStudent(student.id)} className={`rounded-lg px-2 py-0.5 font-bold hover:underline cursor-pointer ${pal.chip}`}>
                          {student.name}
                        </button>
                        <span className="text-xs font-bold text-ink/40">{cls.emoji} {cls.name} · {planLabel(plan.type)}</span>
                        <label className="ml-auto flex items-center gap-1.5 text-sm font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={provided}
                            onChange={() => {
                              toggleProvided(assessment.id, student.id)
                              if (!provided) toast(`${student.name}'s accommodations marked provided ✓`)
                            }}
                            className="h-4 w-4 accent-emerald-500"
                          />
                          Provided
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.accommodationCodes.map((code) => (
                          <span key={code} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">
                            {aMap[code]?.emoji} {aMap[code]?.label ?? code}
                          </span>
                        ))}
                        {plan.customAccommodations.map((a) => (
                          <span key={a.id} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">
                            {a.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
