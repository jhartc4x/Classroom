import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { PALETTES } from '../data'
import { Modal, BigButton } from './ui'
import { useToast } from '../App'
import { cellMapOf, unseatedStudents, SeatGrid } from './seating'

export default function SeatingEditor({ classId, open, onClose }) {
  const classes = useStore((s) => s.classes)
  const ensureSeating = useStore((s) => s.ensureSeating)
  const setSeatingSize = useStore((s) => s.setSeatingSize)
  const placeStudent = useStore((s) => s.placeStudent)
  const unseatStudent = useStore((s) => s.unseatStudent)
  const autoArrangeSeating = useStore((s) => s.autoArrangeSeating)
  const clearSeating = useStore((s) => s.clearSeating)
  const toast = useToast()
  const [held, setHeld] = useState(null) // studentId currently "picked up"

  const cls = classes.find((c) => c.id === classId)

  useEffect(() => {
    if (open && classId) ensureSeating(classId)
    if (!open) setHeld(null)
  }, [open, classId, ensureSeating])

  if (!cls) return null
  const seating = cls.seating ?? { cols: 6, rows: 4, seats: {} }
  const cellMap = cellMapOf(seating)
  const tray = unseatedStudents(cls)
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const nameOf = (id) => cls.students.find((s) => s.id === id)?.name ?? '?'

  const onCell = (r, c) => {
    const occupant = cellMap[`${r},${c}`]
    if (held) {
      placeStudent(cls.id, held, r, c)
      setHeld(null)
    } else if (occupant) {
      setHeld(occupant) // pick up
    }
  }

  const onTray = () => {
    if (held) {
      unseatStudent(cls.id, held)
      setHeld(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Seating — ${cls.name}`} emoji="🪑" wide>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink/60">
          Tap a student, then tap a desk to seat them. Tap a seated student to pick them up and move (or drop them
          back in the tray). Works great on a touchscreen.
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-3">
          <label className="flex items-center gap-1.5 text-sm font-bold text-ink/60">
            Rows
            <input
              type="number" min="1" max="12" value={seating.rows}
              onChange={(e) => setSeatingSize(cls.id, Math.max(1, Number(e.target.value)), seating.cols)}
              className="w-16 rounded-xl bg-white px-2 py-1 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm font-bold text-ink/60">
            Cols
            <input
              type="number" min="1" max="12" value={seating.cols}
              onChange={(e) => setSeatingSize(cls.id, seating.rows, Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-xl bg-white px-2 py-1 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>
          <BigButton className="bg-white ring-1 ring-ink/10 text-sm" onClick={() => { autoArrangeSeating(cls.id); toast('Filled seats in order ↔️') }}>
            ✨ Auto-arrange
          </BigButton>
          <BigButton className="bg-white ring-1 ring-ink/10 text-sm" onClick={() => { clearSeating(cls.id); setHeld(null) }}>
            Clear
          </BigButton>
        </div>

        <SeatGrid
          cols={seating.cols}
          rows={seating.rows}
          renderCell={(r, c) => {
            const occupant = cellMap[`${r},${c}`]
            const isHeld = occupant && occupant === held
            return (
              <button
                key={`${r},${c}`}
                onClick={() => onCell(r, c)}
                className={`flex h-16 items-center justify-center rounded-xl p-1 text-center text-xs font-bold transition-all cursor-pointer ${
                  occupant
                    ? isHeld
                      ? `${pal.chip} ring-2 ring-ink scale-105`
                      : `${pal.soft} hover:scale-105`
                    : held
                      ? 'border-2 border-dashed border-sky-400 bg-sky-50 text-sky-500 hover:bg-sky-100'
                      : 'border-2 border-dashed border-ink/10 text-ink/20'
                }`}
              >
                {occupant ? nameOf(occupant) : held ? 'drop here' : '·'}
              </button>
            )
          }}
        />

        {/* Tray of unseated students */}
        <div
          onClick={onTray}
          className={`rounded-2xl p-3 transition-colors ${
            held ? 'bg-rose-50 ring-2 ring-dashed ring-rose-300' : 'bg-cream'
          }`}
        >
          <div className="mb-2 text-sm font-bold text-ink/50">
            {held ? '↩︎ Tap here to return the held student to the tray' : `Not seated (${tray.length})`}
          </div>
          <div className="flex flex-wrap gap-2">
            {tray.length === 0 && !held && <span className="text-sm text-ink/40">Everyone has a seat 🎉</span>}
            {tray.map((st) => (
              <button
                key={st.id}
                onClick={(e) => { e.stopPropagation(); setHeld(held === st.id ? null : st.id) }}
                className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all hover:scale-105 cursor-pointer ${
                  held === st.id ? 'bg-ink text-white ring-2 ring-ink' : 'bg-white ring-1 ring-ink/10'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>

        <BigButton className="self-end bg-ink text-white" onClick={onClose}>
          Done
        </BigButton>
      </div>
    </Modal>
  )
}
