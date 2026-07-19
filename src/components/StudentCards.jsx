import { useMemo, useState } from 'react'
import { useStore, useChipMaps } from '../store'
import { PALETTES } from '../data'
import { timeAgo } from '../utils'
import { Card, SectionTitle, EmptyState, Chip } from './ui'

export default function StudentCards() {
  const classes = useStore((s) => s.classes)
  const logs = useStore((s) => s.logs)
  const flags = useStore((s) => s.flags)
  const plans = useStore((s) => s.plans)
  const openStudent = useStore((s) => s.openStudent)
  const [classId, setClassId] = useState('all')
  const [query, setQuery] = useState('')
  const { bMap } = useChipMaps()
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000

  const scopedStudents = useMemo(
    () => classes
      .filter((cls) => classId === 'all' || cls.id === classId)
      .flatMap((cls) => cls.students.map((student) => ({ cls, student }))),
    [classes, classId],
  )
  const students = scopedStudents.filter(({ student }) => student.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const scopedIds = new Set(scopedStudents.map(({ student }) => student.id))
  const kpis = {
    students: scopedStudents.length,
    plans: scopedStudents.filter(({ student }) => plans[student.id]?.type).length,
    watch: flags.filter((flag) => flag.active && (flag.kind ?? 'watch') === 'watch' && scopedIds.has(flag.studentId)).length,
    recentIncidents: logs.filter((log) => log.kind === 'behavior' && bMap[log.code]?.polarity === 'neg' && log.ts >= twoWeeksAgo && scopedIds.has(log.studentId)).length,
  }

  if (classes.length === 0) {
    return <EmptyState emoji="📇" title="No student cards yet" hint="Add a class and roster in Setup to create private student cards." />
  }

  return (
    <div>
      <SectionTitle emoji="📇">Student Cards</SectionTitle>
      <p className="mb-4 max-w-2xl text-sm text-ink/60">Private workspace for student history, contacts, IEP/504 plans, and follow-up. Use this away from projected screens.</p>
      <div className="mb-4 flex flex-col gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students…"
          className="w-full rounded-2xl bg-white px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={classId === 'all'} onClick={() => setClassId('all')}>All classes</Chip>
          {classes.map((cls) => (
            <Chip key={cls.id} active={classId === cls.id} onClick={() => setClassId(cls.id)}>
              {cls.emoji} {cls.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi emoji="🧑‍🎓" label="Students" value={kpis.students} />
        <Kpi emoji="🎯" label="IEP / 504 plans" value={kpis.plans} tone="violet" />
        <Kpi emoji="🛟" label="On Watch" value={kpis.watch} tone="amber" />
        <Kpi emoji="⚠️" label="Recent incidents" value={kpis.recentIncidents} tone="rose" />
      </div>

      {students.length === 0 ? (
        <EmptyState emoji="🔎" title="No matching students" hint="Try a different name or class." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map(({ cls, student }) => {
            const studentLogs = logs.filter((log) => log.studentId === student.id)
            const recentNeg = studentLogs.filter((log) => log.kind === 'behavior' && bMap[log.code]?.polarity === 'neg' && log.ts >= twoWeeksAgo).length
            const activeWatch = flags.some((flag) => flag.active && (flag.kind ?? 'watch') === 'watch' && flag.studentId === student.id)
            const activeShine = flags.some((flag) => flag.active && flag.kind === 'shine' && flag.studentId === student.id)
            const lastLog = [...studentLogs].sort((a, b) => b.ts - a.ts)[0]
            const pal = PALETTES[cls.color] ?? PALETTES.sky
            return (
              <button
                key={student.id}
                onClick={() => openStudent(student.id)}
                className="sticker flex min-h-44 flex-col rounded-3xl bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-lg font-bold">{student.name}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${pal.soft}`}>{cls.emoji} {cls.name}</span>
                  </div>
                  {plans[student.id]?.type && <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-900">{plans[student.id].type === 'iep' ? 'IEP' : '504'} plan</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-bold">
                  {recentNeg > 0 && <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">⚠️ {recentNeg} recent</span>}
                  {activeWatch && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">🛟 Watch</span>}
                  {activeShine && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-900">🌟 Shine</span>}
                  {!recentNeg && !activeWatch && !activeShine && <span className="rounded-full bg-ink/5 px-2 py-1 text-ink/50">No follow-up flags</span>}
                </div>
                <div className="mt-auto pt-4 text-xs font-bold text-ink/45">
                  {lastLog ? `Last entry ${timeAgo(lastLog.ts)}` : 'No entries yet'} <span className="float-right text-sky-700">Open card →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Kpi({ emoji, label, value, tone = 'ink' }) {
  const tones = {
    ink: 'bg-white text-ink',
    violet: 'bg-violet-50 text-violet-900',
    amber: 'bg-amber-50 text-amber-900',
    rose: 'bg-rose-50 text-rose-900',
  }
  return (
    <div className={`sticker rounded-2xl p-3 ${tones[tone]}`}>
      <div className="text-lg">{emoji}</div>
      <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs font-bold opacity-65">{label}</div>
    </div>
  )
}
