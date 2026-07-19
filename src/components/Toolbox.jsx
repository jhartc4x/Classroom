import { useState, useRef, useEffect } from 'react'
import { useStore, useCurrentClass } from '../store'
import { PALETTES } from '../data'
import { shuffle, burstConfetti } from '../utils'
import { Card, SectionTitle, EmptyState, BigButton, Chip } from './ui'
import { useToast } from '../App'

const GROUP_THEMES = [
  { emoji: '🦊', name: 'Foxes' },
  { emoji: '🐢', name: 'Turtles' },
  { emoji: '🦉', name: 'Owls' },
  { emoji: '🐙', name: 'Octopi' },
  { emoji: '🦁', name: 'Lions' },
  { emoji: '🐝', name: 'Bees' },
  { emoji: '🦄', name: 'Unicorns' },
  { emoji: '🐬', name: 'Dolphins' },
  { emoji: '🐼', name: 'Pandas' },
  { emoji: '🦖', name: 'Raptors' },
  { emoji: '🐸', name: 'Frogs' },
  { emoji: '🦩', name: 'Flamingos' },
]

// ---------------- Random Picker ----------------
function Picker({ cls }) {
  const pickedByClass = useStore((s) => s.pickedByClass)
  const markPicked = useStore((s) => s.markPicked)
  const resetPicked = useStore((s) => s.resetPicked)
  const openStudent = useStore((s) => s.openStudent)
  const [display, setDisplay] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [noRepeat, setNoRepeat] = useState(true)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const picked = pickedByClass[cls.id] ?? []
  const pickedSet = new Set(picked)
  const pool = noRepeat ? cls.students.filter((s) => !pickedSet.has(s.id)) : cls.students
  const allCalled = noRepeat && pool.length === 0 && cls.students.length > 0

  const spin = () => {
    if (rolling || pool.length === 0) return
    const finalPick = pool[Math.floor(Math.random() * pool.length)]
    setRolling(true)
    let delay = 50
    const step = () => {
      setDisplay(cls.students[Math.floor(Math.random() * cls.students.length)])
      delay *= 1.14
      if (delay < 340) {
        timer.current = setTimeout(step, delay)
      } else {
        setDisplay(finalPick)
        setRolling(false)
        markPicked(cls.id, finalPick.id)
        burstConfetti()
      }
    }
    step()
  }

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <label className="flex cursor-pointer items-center gap-2 self-end text-sm font-bold text-ink/60">
        <input type="checkbox" checked={noRepeat} onChange={(e) => setNoRepeat(e.target.checked)} className="h-4 w-4 accent-ink" />
        No repeats until everyone&apos;s had a turn
      </label>

      <div
        className={`flex h-40 w-full items-center justify-center rounded-3xl bg-cream text-4xl font-display font-extrabold transition-transform ${
          rolling ? 'scale-95' : ''
        }`}
      >
        {allCalled ? (
          <span className="text-2xl">🎉 Everyone&apos;s had a turn!</span>
        ) : display ? (
          <button
            onClick={() => !rolling && openStudent(display.id)}
            className={`px-4 ${rolling ? 'opacity-70 blur-[0.4px]' : 'cursor-pointer hover:underline'}`}
            title={rolling ? '' : `Open ${display.name}`}
          >
            {display.name}
          </button>
        ) : (
          <span className="text-2xl text-ink/40">Tap Spin to pick a student 🎯</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {allCalled ? (
          <BigButton className="bg-ink text-white" onClick={() => { resetPicked(cls.id); setDisplay(null) }}>
            🔄 New round
          </BigButton>
        ) : (
          <BigButton className="bg-ink text-white text-lg" onClick={spin} disabled={rolling}>
            {rolling ? 'Spinning…' : '🎲 Spin!'}
          </BigButton>
        )}
        {noRepeat && picked.length > 0 && !allCalled && (
          <BigButton className="bg-white ring-1 ring-ink/10" onClick={() => { resetPicked(cls.id); setDisplay(null) }}>
            Reset
          </BigButton>
        )}
      </div>

      {noRepeat && cls.students.length > 0 && (
        <div className="w-full">
          <div className="mb-1 text-sm font-bold text-ink/50">
            {picked.length} / {cls.students.length} called
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {cls.students.map((st) => (
              <span
                key={st.id}
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  pickedSet.has(st.id) ? 'bg-ink/10 text-ink/40 line-through' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {st.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ---------------- Group Generator ----------------
function keepApartKey(a, b) {
  return [a, b].sort().join('|')
}

function makeGroups(students, groupCount, keepApart) {
  const shuffled = shuffle(students)
  const groups = Array.from({ length: groupCount }, () => [])
  const apart = new Set((keepApart ?? []).map(([a, b]) => keepApartKey(a, b)))
  const conflicts = (group, st) => group.some((g) => apart.has(keepApartKey(g.id, st.id)))
  for (const st of shuffled) {
    const order = groups
      .map((g, i) => ({ g, i }))
      .sort((x, y) => x.g.length - y.g.length)
    let placed = false
    for (const { g } of order) {
      if (!conflicts(g, st)) {
        g.push(st)
        placed = true
        break
      }
    }
    if (!placed) order[0].g.push(st) // constraint impossible — keep groups balanced instead
  }
  return groups
}

function KeepApartManager({ cls }) {
  const addKeepApart = useStore((s) => s.addKeepApart)
  const removeKeepApart = useStore((s) => s.removeKeepApart)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const pairs = cls.keepApart ?? []
  const nameOf = (id) => cls.students.find((s) => s.id === id)?.name ?? '?'

  const add = () => {
    if (!a || !b || a === b) return
    addKeepApart(cls.id, a, b)
    setA(''); setB('')
  }

  return (
    <div className="mt-3 rounded-2xl bg-cream p-3">
      <div className="mb-2 text-sm font-bold text-ink/60">🚧 Keep apart (optional) — these students won&apos;t share a group</div>
      {pairs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pairs.map(([x, y], i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-sm font-bold ring-1 ring-ink/10">
              {nameOf(x)} ✕ {nameOf(y)}
              <button onClick={() => removeKeepApart(cls.id, i)} className="text-ink/40 hover:text-rose-500 cursor-pointer">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select value={a} onChange={(e) => setA(e.target.value)} className="rounded-xl bg-white px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Student…</option>
          {cls.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="font-bold text-ink/40">✕</span>
        <select value={b} onChange={(e) => setB(e.target.value)} className="rounded-xl bg-white px-2 py-1.5 text-sm font-bold ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Student…</option>
          {cls.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <BigButton className="bg-white ring-1 ring-ink/10 text-sm" onClick={add} disabled={!a || !b || a === b}>
          Add pair
        </BigButton>
      </div>
    </div>
  )
}

function Groups({ cls }) {
  const pal = PALETTES[cls.color] ?? PALETTES.sky
  const [mode, setMode] = useState('size') // 'size' | 'count'
  const [size, setSize] = useState(3)
  const [count, setCount] = useState(4)
  const [groups, setGroups] = useState(null)

  const n = cls.students.length
  const groupCount =
    mode === 'size' ? Math.max(1, Math.ceil(n / Math.max(1, size))) : Math.min(Math.max(1, count), n || 1)

  const generate = () => setGroups(makeGroups(cls.students, groupCount, cls.keepApart))

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-2xl ring-1 ring-ink/10 text-sm font-bold">
          <button onClick={() => setMode('size')} className={`px-3 py-2 cursor-pointer ${mode === 'size' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
            Groups of N
          </button>
          <button onClick={() => setMode('count')} className={`px-3 py-2 cursor-pointer ${mode === 'count' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
            N groups
          </button>
        </div>
        {mode === 'size' ? (
          <label className="flex items-center gap-2 font-bold">
            <span className="text-sm text-ink/60">Students per group</span>
            <input type="number" min="1" max={n || 1} value={size} onChange={(e) => setSize(Math.max(1, Number(e.target.value)))} className="w-20 rounded-xl bg-cream px-3 py-1.5 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400" />
          </label>
        ) : (
          <label className="flex items-center gap-2 font-bold">
            <span className="text-sm text-ink/60">Number of groups</span>
            <input type="number" min="1" max={n || 1} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} className="w-20 rounded-xl bg-cream px-3 py-1.5 ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-sky-400" />
          </label>
        )}
        <span className="text-sm font-bold text-ink/50">→ {groupCount} group{groupCount === 1 ? '' : 's'}</span>
        <BigButton className="ml-auto bg-ink text-white" onClick={generate}>
          {groups ? '🔀 Reshuffle' : '✨ Make groups'}
        </BigButton>
      </div>

      <KeepApartManager cls={cls} />

      {groups && (
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => {
            const theme = GROUP_THEMES[i % GROUP_THEMES.length]
            return (
              <div key={i} className={`animate-pop rounded-2xl p-4 ${pal.soft}`}>
                <div className="mb-2 font-display font-bold">
                  {theme.emoji} Team {theme.name} <span className="text-ink/40">· {g.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.map((st) => (
                    <span key={st.id} className="rounded-full bg-white/80 px-2.5 py-1 text-sm font-bold">
                      {st.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function Toolbox() {
  const cls = useCurrentClass()
  const [tool, setTool] = useState('picker')

  if (!cls)
    return <EmptyState emoji="🎲" title="Set up a class first" hint="The picker and group maker work from your class roster — add one in Setup." />
  if (cls.students.length === 0)
    return <EmptyState emoji="🧑‍🎓" title={`${cls.name} has no students yet`} hint="Add the roster in Setup to use the picker and group maker." />

  return (
    <div>
      <SectionTitle
        emoji="🎲"
        right={
          <div className="flex overflow-hidden rounded-2xl ring-1 ring-ink/10 text-sm font-bold">
            <button onClick={() => setTool('picker')} className={`px-3 py-2 cursor-pointer ${tool === 'picker' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
              🎡 Picker
            </button>
            <button onClick={() => setTool('groups')} className={`px-3 py-2 cursor-pointer ${tool === 'groups' ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
              👥 Groups
            </button>
          </div>
        }
      >
        Toolbox — {cls.emoji} {cls.name}
      </SectionTitle>
      {tool === 'picker' ? <Picker cls={cls} /> : <Groups cls={cls} />}
    </div>
  )
}
