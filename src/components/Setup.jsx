import { useState, useRef } from 'react'
import { useStore } from '../store'
import { PALETTES, PALETTE_KEYS, CLASS_EMOJIS } from '../data'
import { sortedPeriods, downloadFile, logsToCSV, todayKey } from '../utils'
import { Card, SectionTitle, EmptyState, BigButton, Modal, Chip } from './ui'
import { useToast } from '../App'
import SeatingEditor from './SeatingEditor'

function AddClassModal({ open, onClose }) {
  const addClass = useStore((s) => s.addClass)
  const classes = useStore((s) => s.classes)
  const toast = useToast()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(CLASS_EMOJIS[0])
  const [color, setColor] = useState(PALETTE_KEYS[0])

  const save = () => {
    if (!name.trim()) return
    addClass(name.trim(), emoji, color)
    toast(`${emoji} ${name.trim()} added!`)
    setName('')
    setEmoji(CLASS_EMOJIS[(classes.length + 1) % CLASS_EMOJIS.length])
    setColor(PALETTE_KEYS[(classes.length + 1) % PALETTE_KEYS.length])
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New class" emoji="🏫">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Class name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="e.g. Period 2 · Science"
            className="w-full rounded-2xl bg-white px-4 py-2 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Emoji</label>
          <div className="flex flex-wrap gap-1">
            {CLASS_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`rounded-xl p-2 text-xl cursor-pointer ${emoji === e ? 'bg-sky-200 ring-2 ring-sky-400' : 'hover:bg-ink/5'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink/60">Color</label>
          <div className="flex gap-2">
            {PALETTE_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setColor(k)}
                className={`h-8 w-8 rounded-full ${PALETTES[k].dot} cursor-pointer transition-transform hover:scale-110 ${
                  color === k ? 'ring-4 ring-ink/30 scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>
        <BigButton className="bg-ink text-white" onClick={save} disabled={!name.trim()}>
          Add class
        </BigButton>
      </div>
    </Modal>
  )
}

function RosterEditor({ cls }) {
  const addStudents = useStore((s) => s.addStudents)
  const removeStudent = useStore((s) => s.removeStudent)
  const updateClass = useStore((s) => s.updateClass)
  const deleteClass = useStore((s) => s.deleteClass)
  const logs = useStore((s) => s.logs)
  const toast = useToast()
  const [text, setText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [seatingOpen, setSeatingOpen] = useState(false)
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const logCount = logs.filter((log) => log.classId === cls.id).length

  const add = () => {
    const names = text
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean)
    if (names.length === 0) return
    addStudents(cls.id, names)
    toast(`${names.length} student${names.length === 1 ? '' : 's'} added to ${cls.name} 🎉`)
    setText('')
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`rounded-xl px-3 py-1 font-display text-lg font-bold ${pal.chip}`}>
          {cls.emoji} {cls.name}
        </span>
        <span className="text-sm font-bold text-ink/40">{cls.students.length} students</span>
        {cls.students.length > 0 && (
          <button
            onClick={() => setSeatingOpen(true)}
            className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-ink/10 cursor-pointer"
          >
            🪑 Seating
          </button>
        )}
        {confirmDelete ? (
          <span className="ml-auto flex flex-wrap items-center justify-end gap-2 text-sm font-bold">
            Delete {cls.name}, {logCount} log{logCount === 1 ? '' : 's'}, and its student plans?
            <button
              onClick={() => { deleteClass(cls.id); toast(`${cls.name} deleted`) }}
              className="rounded-full bg-rose-400 px-3 py-1 text-white hover:bg-rose-500 cursor-pointer"
            >
              Delete class
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-ink/50 hover:underline cursor-pointer">
              cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
          >
            delete
          </button>
        )}
      </div>

      {cls.students.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cls.students.map((st) => (
            <span key={st.id} className={`group flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${pal.soft}`}>
              {st.name}
              <button
                onClick={() => removeStudent(cls.id, st.id)}
                className="hidden text-ink/40 hover:text-rose-500 group-hover:inline cursor-pointer"
                title={`Remove ${st.name}`}
                aria-label={`Remove ${st.name} from ${cls.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={text.includes('\n') ? 4 : 1}
          placeholder="Add students — paste a list (one per line) or type names separated by commas"
          className="flex-1 resize-none rounded-2xl bg-cream px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
        />
        <BigButton className="self-start bg-ink text-white" onClick={add} disabled={!text.trim()}>
          Add
        </BigButton>
      </div>
      <SeatingEditor classId={cls.id} open={seatingOpen} onClose={() => setSeatingOpen(false)} />
    </Card>
  )
}

function EmojiInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-12 shrink-0 rounded-xl bg-cream px-1 py-1.5 text-center text-xl ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
    />
  )
}

function RowControls({ first, last, onUp, onDown, onDelete, itemName }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        onClick={onUp}
        disabled={first}
        className="rounded-lg px-1.5 py-1 text-sm font-bold text-ink/40 hover:bg-ink/5 disabled:opacity-20 cursor-pointer disabled:cursor-default"
        title="Move up"
        aria-label={`Move ${itemName} up`}
      >
        ↑
      </button>
      <button
        onClick={onDown}
        disabled={last}
        className="rounded-lg px-1.5 py-1 text-sm font-bold text-ink/40 hover:bg-ink/5 disabled:opacity-20 cursor-pointer disabled:cursor-default"
        title="Move down"
        aria-label={`Move ${itemName} down`}
      >
        ↓
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg px-1.5 py-1 text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
        title="Delete"
        aria-label={`Delete ${itemName}`}
      >
        ✕
      </button>
    </div>
  )
}

function BehaviorRow({ b, first, last }) {
  const updateBehavior = useStore((s) => s.updateBehavior)
  const deleteBehavior = useStore((s) => s.deleteBehavior)
  const moveBehavior = useStore((s) => s.moveBehavior)
  return (
    <div className="flex items-center gap-2">
      <EmojiInput value={b.emoji} onChange={(v) => updateBehavior(b.code, { emoji: v })} />
      <input
        value={b.label}
        onChange={(e) => updateBehavior(b.code, { label: e.target.value })}
        className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
      />
      <div className="flex shrink-0 overflow-hidden rounded-xl text-sm font-bold ring-1 ring-ink/10">
        <button
          onClick={() => updateBehavior(b.code, { polarity: 'pos' })}
          className={`px-2 py-1 cursor-pointer ${b.polarity === 'pos' ? 'bg-emerald-200' : 'hover:bg-ink/5'}`}
          title="Positive"
          aria-label={`Mark ${b.label} as positive`}
        >
          🌟
        </button>
        <button
          onClick={() => updateBehavior(b.code, { polarity: 'neg' })}
          className={`px-2 py-1 cursor-pointer ${b.polarity === 'neg' ? 'bg-rose-200' : 'hover:bg-ink/5'}`}
          title="Negative"
          aria-label={`Mark ${b.label} as negative`}
        >
          ⚠️
        </button>
      </div>
      <RowControls
        first={first}
        last={last}
        onUp={() => moveBehavior(b.code, -1)}
        onDown={() => moveBehavior(b.code, 1)}
        onDelete={() => deleteBehavior(b.code)}
        itemName={b.label}
      />
    </div>
  )
}

function InterventionRow({ i, first, last }) {
  const updateIntervention = useStore((s) => s.updateIntervention)
  const deleteIntervention = useStore((s) => s.deleteIntervention)
  const moveIntervention = useStore((s) => s.moveIntervention)
  return (
    <div className="flex items-center gap-2">
      <EmojiInput value={i.emoji} onChange={(v) => updateIntervention(i.code, { emoji: v })} />
      <input
        value={i.label}
        onChange={(e) => updateIntervention(i.code, { label: e.target.value })}
        className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
      />
      <select
        value={i.tier}
        onChange={(e) => updateIntervention(i.code, { tier: Number(e.target.value) })}
        className="shrink-0 rounded-xl bg-cream px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
        title="Support tier"
      >
        <option value={1}>Tier 1</option>
        <option value={2}>Tier 2</option>
        <option value={3}>Tier 3</option>
      </select>
      <RowControls
        first={first}
        last={last}
        onUp={() => moveIntervention(i.code, -1)}
        onDown={() => moveIntervention(i.code, 1)}
        onDelete={() => deleteIntervention(i.code)}
        itemName={i.label}
      />
    </div>
  )
}

function ChipManager() {
  const behaviors = useStore((s) => s.behaviors)
  const interventions = useStore((s) => s.interventions)
  const addBehavior = useStore((s) => s.addBehavior)
  const addIntervention = useStore((s) => s.addIntervention)
  const resetBehaviors = useStore((s) => s.resetBehaviors)
  const resetInterventions = useStore((s) => s.resetInterventions)
  const toast = useToast()

  const [bEmoji, setBEmoji] = useState('✏️')
  const [bLabel, setBLabel] = useState('')
  const [bPol, setBPol] = useState('neg')
  const [iEmoji, setIEmoji] = useState('🧩')
  const [iLabel, setILabel] = useState('')

  const addB = () => {
    if (!bLabel.trim()) return
    addBehavior(bLabel.trim(), bEmoji.trim() || '✏️', bPol)
    toast(`Behavior "${bLabel.trim()}" added`)
    setBLabel(''); setBEmoji('✏️')
  }
  const addI = () => {
    if (!iLabel.trim()) return
    addIntervention(iLabel.trim(), iEmoji.trim() || '🧩', 1)
    toast(`Intervention "${iLabel.trim()}" added`)
    setILabel(''); setIEmoji('🧩')
  }

  return (
    <div className="mt-10">
      <SectionTitle emoji="🎛️">Quick Log buttons</SectionTitle>
      <p className="mb-3 -mt-1 text-sm text-ink/50">
        Rename, reorder, add, or remove the behavior and intervention buttons so they match your school&apos;s
        language. Existing entries you&apos;ve already logged stay intact.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold">Behaviors</div>
            <button
              onClick={() => { resetBehaviors(); toast('Behaviors reset to defaults') }}
              className="text-xs font-bold text-ink/40 hover:text-ink cursor-pointer"
            >
              reset to defaults
            </button>
          </div>
          {behaviors.map((b, idx) => (
            <BehaviorRow key={b.code} b={b} first={idx === 0} last={idx === behaviors.length - 1} />
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-ink/10 pt-3">
            <EmojiInput value={bEmoji} onChange={setBEmoji} />
            <input
              value={bLabel}
              onChange={(e) => setBLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addB()}
              placeholder="New behavior…"
              className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
            />
            <div className="flex shrink-0 overflow-hidden rounded-xl text-sm font-bold ring-1 ring-ink/10">
              <button
                onClick={() => setBPol('pos')}
                className={`px-2 py-1 cursor-pointer ${bPol === 'pos' ? 'bg-emerald-200' : 'hover:bg-ink/5'}`}
              >
                🌟
              </button>
              <button
                onClick={() => setBPol('neg')}
                className={`px-2 py-1 cursor-pointer ${bPol === 'neg' ? 'bg-rose-200' : 'hover:bg-ink/5'}`}
              >
                ⚠️
              </button>
            </div>
            <BigButton className="shrink-0 bg-ink text-white text-sm" onClick={addB} disabled={!bLabel.trim()}>
              Add
            </BigButton>
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold">Interventions</div>
            <button
              onClick={() => { resetInterventions(); toast('Interventions reset to defaults') }}
              className="text-xs font-bold text-ink/40 hover:text-ink cursor-pointer"
            >
              reset to defaults
            </button>
          </div>
          {interventions.map((i, idx) => (
            <InterventionRow key={i.code} i={i} first={idx === 0} last={idx === interventions.length - 1} />
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-ink/10 pt-3">
            <EmojiInput value={iEmoji} onChange={setIEmoji} />
            <input
              value={iLabel}
              onChange={(e) => setILabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addI()}
              placeholder="New intervention…"
              className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
            />
            <BigButton className="shrink-0 bg-ink text-white text-sm" onClick={addI} disabled={!iLabel.trim()}>
              Add
            </BigButton>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AccommodationRow({ a, first, last }) {
  const updateAccommodationOption = useStore((s) => s.updateAccommodationOption)
  const deleteAccommodationOption = useStore((s) => s.deleteAccommodationOption)
  const moveAccommodationOption = useStore((s) => s.moveAccommodationOption)
  return (
    <div className="flex items-center gap-2">
      <EmojiInput value={a.emoji} onChange={(v) => updateAccommodationOption(a.code, { emoji: v })} />
      <input
        value={a.label}
        onChange={(e) => updateAccommodationOption(a.code, { label: e.target.value })}
        className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
      />
      <RowControls
        first={first}
        last={last}
        onUp={() => moveAccommodationOption(a.code, -1)}
        onDown={() => moveAccommodationOption(a.code, 1)}
        onDelete={() => deleteAccommodationOption(a.code)}
        itemName={a.label}
      />
    </div>
  )
}

function AccommodationManager() {
  const accommodationOptions = useStore((s) => s.accommodationOptions)
  const addAccommodationOption = useStore((s) => s.addAccommodationOption)
  const resetAccommodationOptions = useStore((s) => s.resetAccommodationOptions)
  const toast = useToast()
  const [emoji, setEmoji] = useState('🗂️')
  const [label, setLabel] = useState('')

  const add = () => {
    if (!label.trim()) return
    addAccommodationOption(label.trim(), emoji.trim() || '🗂️')
    toast(`Accommodation "${label.trim()}" added`)
    setLabel(''); setEmoji('🗂️')
  }

  return (
    <div className="mt-10">
      <SectionTitle emoji="🎯">IEP / 504 accommodation options</SectionTitle>
      <p className="mb-3 -mt-1 text-sm text-ink/50">
        The quick-pick list used when setting up a student&apos;s support plan. Customize it to match your
        district&apos;s language — you can still type a one-off accommodation for a specific student too.
      </p>
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="font-display font-bold">Accommodations</div>
          <button
            onClick={() => { resetAccommodationOptions(); toast('Accommodations reset to defaults') }}
            className="text-xs font-bold text-ink/40 hover:text-ink cursor-pointer"
          >
            reset to defaults
          </button>
        </div>
        {accommodationOptions.map((a, idx) => (
          <AccommodationRow key={a.code} a={a} first={idx === 0} last={idx === accommodationOptions.length - 1} />
        ))}
        <div className="mt-2 flex items-center gap-2 border-t border-ink/10 pt-3">
          <EmojiInput value={emoji} onChange={setEmoji} />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New accommodation…"
            className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
          />
          <BigButton className="shrink-0 bg-ink text-white text-sm" onClick={add} disabled={!label.trim()}>
            Add
          </BigButton>
        </div>
      </Card>
    </div>
  )
}

function ScheduleCard({ schedule }) {
  const classes = useStore((s) => s.classes)
  const activeScheduleId = useStore((s) => s.activeScheduleId)
  const setActiveSchedule = useStore((s) => s.setActiveSchedule)
  const updateBellSchedule = useStore((s) => s.updateBellSchedule)
  const deleteBellSchedule = useStore((s) => s.deleteBellSchedule)
  const addPeriod = useStore((s) => s.addPeriod)
  const updatePeriod = useStore((s) => s.updatePeriod)
  const deletePeriod = useStore((s) => s.deletePeriod)
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isActive = schedule.id === activeScheduleId

  return (
    <Card className={`flex flex-col gap-3 ${isActive ? 'ring-2 ring-amber-400' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={schedule.name}
          onChange={(e) => updateBellSchedule(schedule.id, { name: e.target.value })}
          className="rounded-xl bg-transparent px-2 py-1 font-display text-lg font-bold outline-none ring-1 ring-transparent hover:ring-ink/10 focus:bg-white focus:ring-ink/20"
        />
        {isActive ? (
          <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-bold">🔔 today&apos;s schedule</span>
        ) : (
          <button
            onClick={() => { setActiveSchedule(schedule.id); toast(`${schedule.name} is now today's schedule 🔔`) }}
            className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-amber-100 cursor-pointer"
          >
            Use today
          </button>
        )}
        {confirmDelete ? (
          <span className="ml-auto flex items-center gap-2 text-sm font-bold">
            Delete schedule?
            <button
              onClick={() => deleteBellSchedule(schedule.id)}
              className="rounded-full bg-rose-400 px-3 py-1 text-white hover:bg-rose-500 cursor-pointer"
            >
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-ink/50 hover:underline cursor-pointer">
              cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
          >
            delete
          </button>
        )}
      </div>

      {schedule.periods.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1fr_auto_auto_1fr_auto] items-center gap-2 px-1 text-xs font-bold text-ink/40">
            <span>Period</span><span>Starts</span><span>Ends</span><span>Class in the room</span><span />
          </div>
          {sortedPeriods(schedule).map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_auto_1fr_auto] items-center gap-2">
              <input
                value={p.label}
                onChange={(e) => updatePeriod(schedule.id, p.id, { label: e.target.value })}
                className="rounded-xl bg-cream px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="time"
                value={p.start}
                onChange={(e) => updatePeriod(schedule.id, p.id, { start: e.target.value })}
                className="rounded-xl bg-cream px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="time"
                value={p.end}
                onChange={(e) => updatePeriod(schedule.id, p.id, { end: e.target.value })}
                className="rounded-xl bg-cream px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
              />
              <select
                value={p.classId ?? ''}
                onChange={(e) => updatePeriod(schedule.id, p.id, { classId: e.target.value || null })}
                className="rounded-xl bg-cream px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">— none (planning, lunch…) —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => deletePeriod(schedule.id, p.id)}
                className="text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer"
                title="Remove period"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <BigButton className="self-start bg-ink/5 hover:bg-ink/10 text-sm" onClick={() => addPeriod(schedule.id)}>
        + Add period
      </BigButton>
    </Card>
  )
}

function BellSchedules() {
  const bellSchedules = useStore((s) => s.bellSchedules)
  const addBellSchedule = useStore((s) => s.addBellSchedule)
  const autoSwitch = useStore((s) => s.autoSwitch)
  const setAutoSwitch = useStore((s) => s.setAutoSwitch)
  const toast = useToast()
  const [name, setName] = useState('')

  const add = () => {
    if (!name.trim()) return
    addBellSchedule(name.trim())
    toast(`Schedule "${name.trim()}" added 🔔`)
    setName('')
  }

  return (
    <div className="mt-10">
      <SectionTitle
        emoji="🔔"
        right={
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink/60">
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={(e) => setAutoSwitch(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Auto-switch class with the bell
          </label>
        }
      >
        Bell schedules
      </SectionTitle>
      <p className="mb-3 -mt-1 text-sm text-ink/50">
        Add each schedule your school runs (regular, early release, assembly…). Pick which one is in effect
        today, map periods to your classes, and the app follows the bell: the header shows a countdown and the
        current class selects itself.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder='New schedule name — e.g. "Regular day"'
          className="flex-1 rounded-2xl bg-white px-4 py-2 font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <BigButton className="bg-ink text-white" onClick={add} disabled={!name.trim()}>
          + Add schedule
        </BigButton>
      </div>

      {bellSchedules.length === 0 ? (
        <EmptyState
          emoji="🔕"
          title="No bell schedules yet"
          hint="Add one above whenever you have the times — everything works fine without them too."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {bellSchedules.map((b) => (
            <ScheduleCard key={b.id} schedule={b} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssessmentRow({ a }) {
  const classes = useStore((s) => s.classes)
  const plans = useStore((s) => s.plans)
  const updateAssessment = useStore((s) => s.updateAssessment)
  const deleteAssessment = useStore((s) => s.deleteAssessment)
  const openAssessment = useStore((s) => s.openAssessment)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const needCount = a.classIds.reduce((n, cid) => {
    const cls = classes.find((c) => c.id === cid)
    if (!cls) return n
    return (
      n +
      cls.students.filter((st) => {
        const plan = plans[st.id]
        return plan?.type && (plan.accommodationCodes.length > 0 || plan.customAccommodations.length > 0)
      }).length
    )
  }, 0)

  const classNames = a.classIds
    .map((cid) => classes.find((c) => c.id === cid))
    .filter(Boolean)
    .map((c) => `${c.emoji} ${c.name}`)
    .join(' · ')

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink/5">
      <input
        value={a.name}
        onChange={(e) => updateAssessment(a.id, { name: e.target.value })}
        className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-1.5 font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
      />
      <input
        type="date"
        value={a.date}
        onChange={(e) => updateAssessment(a.id, { date: e.target.value })}
        className="rounded-xl bg-cream px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
      />
      <span className="text-xs font-bold text-ink/40">{classNames}</span>
      {needCount > 0 && (
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">
          🎯 {needCount} need accommodations
        </span>
      )}
      <button
        onClick={() => openAssessment(a.id)}
        className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-violet-100 hover:text-violet-800 cursor-pointer"
      >
        📋 Prep list
      </button>
      {confirmDelete ? (
        <span className="flex items-center gap-2 text-sm font-bold">
          Delete?
          <button onClick={() => deleteAssessment(a.id)} className="rounded-full bg-rose-400 px-2.5 py-1 text-white hover:bg-rose-500 cursor-pointer">
            Yes
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-ink/50 hover:underline cursor-pointer">
            cancel
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="text-sm font-bold text-ink/30 hover:text-rose-500 cursor-pointer">
          delete
        </button>
      )}
    </div>
  )
}

function AssessmentManager() {
  const classes = useStore((s) => s.classes)
  const assessments = useStore((s) => s.assessments)
  const addAssessment = useStore((s) => s.addAssessment)
  const toast = useToast()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [classIds, setClassIds] = useState([])

  const toggleClass = (id) => setClassIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const add = () => {
    if (!name.trim() || classIds.length === 0) return
    addAssessment(name.trim(), date, classIds)
    toast(`"${name.trim()}" scheduled 📋`)
    setName(''); setDate(''); setClassIds([])
  }

  const sorted = [...assessments].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))

  return (
    <div className="mt-10">
      <SectionTitle emoji="📋">Assessment days</SectionTitle>
      <p className="mb-3 -mt-1 text-sm text-ink/50">
        Schedule a test or assessment day and the app will cross-reference IEP/504 accommodations for the
        students in that class — a same-day reminder shows up, plus a prep checklist any time.
      </p>
      <Card className="mb-4 flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Assessment name — e.g. "Unit 3 Test"'
          className="w-full rounded-2xl bg-cream px-4 py-2 font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl bg-cream px-3 py-2 font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-violet-400"
          />
          {classes.map((c) => (
            <Chip key={c.id} active={classIds.includes(c.id)} onClick={() => toggleClass(c.id)}>
              {c.emoji} {c.name}
            </Chip>
          ))}
          <BigButton className="ml-auto bg-ink text-white" onClick={add} disabled={!name.trim() || classIds.length === 0}>
            + Schedule
          </BigButton>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState emoji="🗓️" title="No assessment days scheduled" hint="Add one above whenever you know a test date." />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((a) => (
            <AssessmentRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function BackupControls() {
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const logs = useStore((s) => s.logs)
  const classes = useStore((s) => s.classes)
  const behaviors = useStore((s) => s.behaviors)
  const interventions = useStore((s) => s.interventions)
  const markBackedUp = useStore((s) => s.markBackedUp)
  const toast = useToast()
  const fileRef = useRef(null)

  const doExport = () => {
    downloadFile(
      `classroom-backup-${todayKey()}.json`,
      exportData(),
      'application/json',
    )
    markBackedUp()
    toast('Backup downloaded 💾')
  }

  const doCSV = () => {
    downloadFile(
      `classroom-log-${todayKey()}.csv`,
      logsToCSV(logs, classes, behaviors, interventions),
    )
    toast('Full log exported 📊')
  }

  const doImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(reader.result)
        toast('Backup restored! 🎉')
      } catch {
        toast('Hmm, that file doesn’t look like a backup 🤔')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <Card className="mt-6">
      <div className="mb-2 font-display font-bold">💾 Your data lives on this device only</div>
      <p className="mb-3 text-sm text-ink/60">
        Nothing is sent anywhere — student info stays in this browser. Download a backup now and then
        (or to move to another computer).
      </p>
      <div className="flex gap-2">
        <BigButton className="bg-sky-200 hover:bg-sky-300" onClick={doExport}>
          ⬇️ Download backup
        </BigButton>
        <BigButton className="bg-white ring-1 ring-ink/10" onClick={() => fileRef.current?.click()}>
          ⬆️ Restore backup
        </BigButton>
        <BigButton className="bg-emerald-100 hover:bg-emerald-200" onClick={doCSV} disabled={logs.length === 0}>
          📊 Export all logs (CSV)
        </BigButton>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={doImport} />
      </div>
    </Card>
  )
}

function SetupSection({ title, children }) {
  return (
    <details className="mt-5 rounded-3xl bg-white/60 p-5 ring-1 ring-ink/10">
      <summary className="cursor-pointer font-display text-lg font-bold marker:text-ink/50">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

export default function Setup() {
  const classes = useStore((s) => s.classes)
  const loadSampleData = useStore((s) => s.loadSampleData)
  const toast = useToast()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <SectionTitle
        emoji="🎒"
        right={
          <BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>
            + New class
          </BigButton>
        }
      >
        Classes & rosters
      </SectionTitle>

      {classes.length === 0 ? (
        <EmptyState
          emoji="🏫"
          title="Welcome! Let's set up your classes"
          hint="Add each class period, then paste in the roster. Or poke around with sample data first."
          action={
            <div className="flex gap-2">
              <BigButton className="bg-ink text-white" onClick={() => setAdding(true)}>
                + Add my first class
              </BigButton>
              <BigButton
                className="bg-white ring-1 ring-ink/10"
                onClick={() => { loadSampleData(); toast('Sample classes loaded — explore away! 🧪') }}
              >
                🧪 Try sample data
              </BigButton>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {classes.map((c) => (
            <RosterEditor key={c.id} cls={c} />
          ))}
        </div>
      )}

      <SetupSection title="🎛️ Customize Quick Log buttons">
        <ChipManager />
      </SetupSection>
      <SetupSection title="🎯 Support-plan accommodation options">
        <AccommodationManager />
      </SetupSection>
      <SetupSection title="🔔 Bell schedules">
        <BellSchedules />
      </SetupSection>
      <SetupSection title="📋 Assessment days">
        <AssessmentManager />
      </SetupSection>
      <SetupSection title="💾 Backup, restore & export">
        <BackupControls />
      </SetupSection>
      <AddClassModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
