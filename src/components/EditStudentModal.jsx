import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Modal, BigButton, Chip } from './ui'
import { useToast } from '../App'

export default function EditStudentModal({ classId, studentId, open, onClose }) {
  const student = useStore((s) => s.classes.find((c) => c.id === classId)?.students.find((st) => st.id === studentId))
  const classes = useStore((s) => s.classes)
  const updateStudent = useStore((s) => s.updateStudent)
  const moveStudent = useStore((s) => s.moveStudent)
  const removeStudent = useStore((s) => s.removeStudent)
  const homeLanguages = useStore((s) => s.homeLanguages)
  const toast = useToast()
  const [name, setName] = useState('')
  const [homeLanguage, setHomeLanguage] = useState(null)
  const [healthNote, setHealthNote] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const otherClasses = classes.filter((c) => c.id !== classId)

  useEffect(() => {
    if (open && student) {
      setName(student.name)
      setHomeLanguage(student.homeLanguage ?? null)
      setHealthNote(student.healthNote ?? '')
      setMoveTo('')
      setConfirmDelete(false)
    }
  }, [open, student])

  const save = () => {
    if (!name.trim()) return
    updateStudent(classId, studentId, {
      name: name.trim(),
      homeLanguage,
      healthNote: healthNote.trim(),
    })
    toast(`${name.trim()} updated`)
    onClose()
  }

  const move = () => {
    if (!moveTo) return
    const target = classes.find((c) => c.id === moveTo)
    moveStudent(studentId, moveTo)
    toast(`${student.name} moved to ${target?.emoji ?? ''} ${target?.name ?? 'the class'}`.trim())
    onClose()
  }

  const remove = () => {
    removeStudent(classId, studentId)
    toast(`${student.name} removed`)
    onClose()
  }

  return (
    <Modal open={open && !!student} onClose={onClose} title="Edit student" emoji="✏️">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full rounded-2xl bg-white px-4 py-2 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Home language</label>
          <div className="flex flex-wrap gap-1.5">
            {homeLanguages.map((l) => (
              <Chip
                key={l.code}
                active={homeLanguage === l.code}
                onClick={() => setHomeLanguage(homeLanguage === l.code ? null : l.code)}
              >
                {l.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink/40">
            Need another language? Add it in Setup → Home languages.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Health concerns / alerts</label>
          <textarea
            value={healthNote}
            onChange={(e) => setHealthNote(e.target.value)}
            rows={3}
            placeholder="e.g. severe peanut allergy — carries EpiPen"
            className="w-full resize-none rounded-2xl bg-cream px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-rose-400"
          />
          <p className="mt-1 text-xs text-ink/40">
            A 🏥 icon shows next to their name anywhere this note isn&apos;t empty.
          </p>
        </div>
        <BigButton className="bg-ink text-white" onClick={save} disabled={!name.trim()}>
          Save
        </BigButton>

        {otherClasses.length > 0 && (
          <div className="rounded-2xl bg-cream p-3">
            <label className="mb-1 block text-sm font-bold text-ink/60">Move to another class</label>
            <div className="flex gap-2">
              <select
                value={moveTo}
                onChange={(e) => setMoveTo(e.target.value)}
                className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">Choose a class…</option>
                {otherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={move}
                disabled={!moveTo}
                className="shrink-0 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
              >
                Move
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100">
          <span className="text-sm font-bold text-rose-900">Remove {student?.name ?? 'this student'} from the roster</span>
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-sm font-bold">
              <button onClick={remove} className="rounded-full bg-rose-500 px-3 py-1 text-white hover:bg-rose-600 cursor-pointer">
                Yes, delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-rose-900/60 hover:underline cursor-pointer">
                cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-full bg-white px-3 py-1 text-sm font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 cursor-pointer"
            >
              Delete student
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
