// Shared seating helpers + grid shell used by the editor and the Quick Log seating view.

export function cellMapOf(seating) {
  const map = {}
  if (!seating) return map
  for (const [studentId, pos] of Object.entries(seating.seats)) map[`${pos.r},${pos.c}`] = studentId
  return map
}

export function unseatedStudents(cls) {
  const seated = new Set(Object.keys(cls.seating?.seats ?? {}))
  return cls.students.filter((s) => !seated.has(s.id))
}

// Grid shell with a "front of room" banner. renderCell(r, c) returns the cell node.
export function SeatGrid({ cols, rows, renderCell }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto mb-3 w-fit rounded-full bg-ink/10 px-4 py-1 text-xs font-bold tracking-wide text-ink/50">
        ⬆ FRONT OF ROOM ⬆
      </div>
      <div
        className="mx-auto grid w-fit gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(72px, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => renderCell(Math.floor(i / cols), i % cols))}
      </div>
    </div>
  )
}
