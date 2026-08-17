import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Modal, BigButton, Chip } from './ui'
import { useToast } from '../App'

export default function EditStudentModal({ classId, studentId, open, onClose }) {
  const student = useStore((s) => s.classes.find((c) => c.id === classId)?.students.find((st) => st.id === studentId))
  const updateStudent = useStore((s) => s.updateStudent)
  const homeLanguages = useStore((s) => s.homeLanguages)
  const toast = useToast()
  const [name, setName] = useState('')
  const [homeLanguage, setHomeLanguage] = useState(null)
  const [healthNote, setHealthNote] = useState('')

  useEffect(() => {
    if (open && student) {
      setName(student.name)
      setHomeLanguage(student.homeLanguage ?? null)
      setHealthNote(student.healthNote ?? '')
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
      </div>
    </Modal>
  )
}
