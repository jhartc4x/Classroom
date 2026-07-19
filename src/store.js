import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, byCode } from './utils'
import {
  DEFAULT_TIMER_PRESETS,
  SAMPLE_CLASSES,
  PALETTE_KEYS,
  DEFAULT_BEHAVIORS,
  DEFAULT_INTERVENTIONS,
  CONTACT_METHODS,
} from './data'

const move = (arr, id, dir) => {
  const i = arr.findIndex((x) => x.id === id || x.code === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ---------- classes & students ----------
      classes: [],
      currentClassId: null,

      addClass: (name, emoji, color) => {
        const cls = { id: uid(), name, emoji, color, students: [] }
        set((s) => ({
          classes: [...s.classes, cls],
          currentClassId: s.currentClassId ?? cls.id,
        }))
        return cls.id
      },
      updateClass: (id, patch) =>
        set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClass: (id) =>
        set((s) => {
          const classes = s.classes.filter((c) => c.id !== id)
          return {
            classes,
            currentClassId: s.currentClassId === id ? classes[0]?.id ?? null : s.currentClassId,
            logs: s.logs.filter((l) => l.classId !== id),
            flags: s.flags.filter((f) => f.classId !== id),
          }
        }),
      setCurrentClass: (id) => set({ currentClassId: id }),
      addStudents: (classId, names) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId
              ? { ...c, students: [...c.students, ...names.map((n) => ({ id: uid(), name: n }))] }
              : c,
          ),
        })),
      removeStudent: (classId, studentId) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId ? { ...c, students: c.students.filter((st) => st.id !== studentId) } : c,
          ),
        })),

      // ---------- editable chips (behaviors + interventions) ----------
      behaviors: DEFAULT_BEHAVIORS, // {code, label, emoji, polarity: 'pos'|'neg'}
      interventions: DEFAULT_INTERVENTIONS, // {code, label, emoji, tier: 1|2|3}

      addBehavior: (label, emoji, polarity) =>
        set((s) => ({ behaviors: [...s.behaviors, { code: uid(), label, emoji, polarity }] })),
      updateBehavior: (code, patch) =>
        set((s) => ({ behaviors: s.behaviors.map((b) => (b.code === code ? { ...b, ...patch } : b)) })),
      deleteBehavior: (code) => set((s) => ({ behaviors: s.behaviors.filter((b) => b.code !== code) })),
      moveBehavior: (code, dir) => set((s) => ({ behaviors: move(s.behaviors, code, dir) })),
      resetBehaviors: () => set({ behaviors: DEFAULT_BEHAVIORS }),

      addIntervention: (label, emoji, tier) =>
        set((s) => ({ interventions: [...s.interventions, { code: uid(), label, emoji, tier }] })),
      updateIntervention: (code, patch) =>
        set((s) => ({ interventions: s.interventions.map((i) => (i.code === code ? { ...i, ...patch } : i)) })),
      deleteIntervention: (code) => set((s) => ({ interventions: s.interventions.filter((i) => i.code !== code) })),
      moveIntervention: (code, dir) => set((s) => ({ interventions: move(s.interventions, code, dir) })),
      resetInterventions: () => set({ interventions: DEFAULT_INTERVENTIONS }),

      // ---------- student detail modal ----------
      viewingStudent: null, // studentId currently shown in the detail modal (ephemeral, not persisted)
      openStudent: (studentId) => set({ viewingStudent: studentId }),
      closeStudent: () => set({ viewingStudent: null }),

      // ---------- toolbox: random picker ----------
      pickedByClass: {}, // { classId: [studentId, ...] } already called this round (ephemeral)
      markPicked: (classId, studentId) =>
        set((s) => ({
          pickedByClass: {
            ...s.pickedByClass,
            [classId]: [...new Set([...(s.pickedByClass[classId] ?? []), studentId])],
          },
        })),
      resetPicked: (classId) =>
        set((s) => ({ pickedByClass: { ...s.pickedByClass, [classId]: [] } })),

      // ---------- seating chart (per class) ----------
      // cls.seating = { cols, rows, seats: { [studentId]: { r, c } } }
      ensureSeating: (classId) =>
        set((s) => ({
          classes: s.classes.map((c) => {
            if (c.id !== classId || c.seating) return c
            const cols = Math.min(6, Math.max(2, c.students.length || 4))
            const rows = Math.max(4, Math.ceil((c.students.length || 1) / cols))
            return { ...c, seating: { cols, rows, seats: {} } }
          }),
        })),
      setSeatingSize: (classId, rows, cols) =>
        set((s) => ({
          classes: s.classes.map((c) => {
            if (c.id !== classId) return c
            const seating = c.seating ?? { cols: 6, rows: 4, seats: {} }
            // Drop any seats that now fall outside the grid.
            const seats = {}
            for (const [id, pos] of Object.entries(seating.seats))
              if (pos.r < rows && pos.c < cols) seats[id] = pos
            return { ...c, seating: { rows, cols, seats } }
          }),
        })),
      placeStudent: (classId, studentId, r, c) =>
        set((s) => ({
          classes: s.classes.map((cl) => {
            if (cl.id !== classId) return cl
            const seating = cl.seating ?? { cols: 6, rows: 4, seats: {} }
            const seats = { ...seating.seats }
            const from = seats[studentId] // where the moved student currently sits (if anywhere)
            const occupant = Object.keys(seats).find(
              (id) => id !== studentId && seats[id].r === r && seats[id].c === c,
            )
            if (occupant) {
              if (from) seats[occupant] = { ...from } // swap seats
              else delete seats[occupant] // came from the tray → bump occupant back to tray
            }
            seats[studentId] = { r, c }
            return { ...cl, seating: { ...seating, seats } }
          }),
        })),
      unseatStudent: (classId, studentId) =>
        set((s) => ({
          classes: s.classes.map((cl) => {
            if (cl.id !== classId || !cl.seating) return cl
            const seats = { ...cl.seating.seats }
            delete seats[studentId]
            return { ...cl, seating: { ...cl.seating, seats } }
          }),
        })),
      autoArrangeSeating: (classId) =>
        set((s) => ({
          classes: s.classes.map((cl) => {
            if (cl.id !== classId) return cl
            const cols = cl.seating?.cols ?? Math.min(6, Math.max(2, cl.students.length || 4))
            const rows = Math.max(cl.seating?.rows ?? 0, Math.ceil(cl.students.length / cols) || 1)
            const seats = {}
            cl.students.forEach((st, i) => {
              seats[st.id] = { r: Math.floor(i / cols), c: i % cols }
            })
            return { ...cl, seating: { cols, rows, seats } }
          }),
        })),
      clearSeating: (classId) =>
        set((s) => ({
          classes: s.classes.map((cl) =>
            cl.id === classId && cl.seating ? { ...cl, seating: { ...cl.seating, seats: {} } } : cl,
          ),
        })),

      // ---------- toolbox: keep-apart pairs (per class, for grouping) ----------
      addKeepApart: (classId, a, b) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId ? { ...c, keepApart: [...(c.keepApart ?? []), [a, b]] } : c,
          ),
        })),
      removeKeepApart: (classId, idx) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId ? { ...c, keepApart: (c.keepApart ?? []).filter((_, i) => i !== idx) } : c,
          ),
        })),

      // ---------- quick log (behaviors + interventions + contacts) ----------
      logs: [], // {id, ts, classId, studentId, kind: 'behavior'|'intervention'|'contact', code, note}
      addLog: (entry) => {
        const log = { id: uid(), ts: Date.now(), note: '', ...entry }
        set((s) => ({ logs: [log, ...s.logs] }))
        return log.id
      },
      updateLog: (id, patch) =>
        set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      // ---------- radar flags ----------
      flags: [], // {id, studentId, classId, concern, ts, active, note}
      addFlag: (studentId, classId, concern, note = '') =>
        set((s) => ({
          flags: [{ id: uid(), studentId, classId, concern, ts: Date.now(), active: true, note }, ...s.flags],
        })),
      resolveFlag: (id) =>
        set((s) => ({ flags: s.flags.map((f) => (f.id === id ? { ...f, active: false, resolvedTs: Date.now() } : f)) })),
      deleteFlag: (id) => set((s) => ({ flags: s.flags.filter((f) => f.id !== id) })),

      // ---------- reminders ----------
      reminders: [], // {id, text, classIds: [] (empty = every class), createdTs, done, dismissed: [classId]}
      addReminder: (text, classIds) =>
        set((s) => ({
          reminders: [{ id: uid(), text, classIds, createdTs: Date.now(), done: false, dismissed: [] }, ...s.reminders],
        })),
      dismissReminderFor: (id, classId) =>
        set((s) => ({
          reminders: s.reminders.map((r) => {
            if (r.id !== id) return r
            const dismissed = [...new Set([...r.dismissed, classId])]
            const targets = r.classIds.length ? r.classIds : s.classes.map((c) => c.id)
            const done = targets.every((t) => dismissed.includes(t))
            return { ...r, dismissed, done }
          }),
        })),
      completeReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: true } : r)) })),
      deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      // ---------- timers ----------
      timerPresets: DEFAULT_TIMER_PRESETS,
      addTimerPreset: (label, emoji, seconds) =>
        set((s) => ({ timerPresets: [...s.timerPresets, { id: uid(), label, emoji, seconds }] })),
      deleteTimerPreset: (id) =>
        set((s) => ({ timerPresets: s.timerPresets.filter((p) => p.id !== id) })),
      // Active timer: {label, emoji, total, endsAt} when running; {pausedRemaining} when paused.
      activeTimer: null,
      startTimer: (preset) =>
        set({
          activeTimer: {
            label: preset.label,
            emoji: preset.emoji,
            total: preset.seconds,
            endsAt: Date.now() + preset.seconds * 1000,
            pausedRemaining: null,
          },
        }),
      pauseTimer: () =>
        set((s) => {
          const t = s.activeTimer
          if (!t || t.pausedRemaining != null) return {}
          return { activeTimer: { ...t, pausedRemaining: Math.max(0, (t.endsAt - Date.now()) / 1000), endsAt: null } }
        }),
      resumeTimer: () =>
        set((s) => {
          const t = s.activeTimer
          if (!t || t.pausedRemaining == null) return {}
          return { activeTimer: { ...t, endsAt: Date.now() + t.pausedRemaining * 1000, pausedRemaining: null } }
        }),
      addTimerMinute: () =>
        set((s) => {
          const t = s.activeTimer
          if (!t) return {}
          if (t.pausedRemaining != null)
            return { activeTimer: { ...t, total: t.total + 60, pausedRemaining: t.pausedRemaining + 60 } }
          return { activeTimer: { ...t, total: t.total + 60, endsAt: t.endsAt + 60000 } }
        }),
      stopTimer: () => set({ activeTimer: null }),

      // ---------- bell schedules ----------
      bellSchedules: [], // {id, name, periods: [{id, label, start 'HH:MM', end 'HH:MM', classId|null}]}
      activeScheduleId: null, // which schedule is in effect today
      autoSwitch: true, // follow the bell schedule to auto-select the current class

      addBellSchedule: (name) => {
        const sched = { id: uid(), name, periods: [] }
        set((s) => ({
          bellSchedules: [...s.bellSchedules, sched],
          activeScheduleId: s.activeScheduleId ?? sched.id,
        }))
        return sched.id
      },
      updateBellSchedule: (id, patch) =>
        set((s) => ({
          bellSchedules: s.bellSchedules.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      deleteBellSchedule: (id) =>
        set((s) => ({
          bellSchedules: s.bellSchedules.filter((b) => b.id !== id),
          activeScheduleId: s.activeScheduleId === id ? null : s.activeScheduleId,
        })),
      setActiveSchedule: (id) => set({ activeScheduleId: id }),
      setAutoSwitch: (v) => set({ autoSwitch: v }),
      addPeriod: (scheduleId) =>
        set((s) => ({
          bellSchedules: s.bellSchedules.map((b) =>
            b.id === scheduleId
              ? {
                  ...b,
                  periods: [
                    ...b.periods,
                    { id: uid(), label: `Period ${b.periods.length + 1}`, start: '', end: '', classId: null },
                  ],
                }
              : b,
          ),
        })),
      updatePeriod: (scheduleId, periodId, patch) =>
        set((s) => ({
          bellSchedules: s.bellSchedules.map((b) =>
            b.id === scheduleId
              ? { ...b, periods: b.periods.map((p) => (p.id === periodId ? { ...p, ...patch } : p)) }
              : b,
          ),
        })),
      deletePeriod: (scheduleId, periodId) =>
        set((s) => ({
          bellSchedules: s.bellSchedules.map((b) =>
            b.id === scheduleId ? { ...b, periods: b.periods.filter((p) => p.id !== periodId) } : b,
          ),
        })),

      // ---------- backup / sample data ----------
      loadSampleData: () =>
        set(() => {
          const classes = SAMPLE_CLASSES.map((c, i) => ({
            id: uid(),
            name: c.name,
            emoji: c.emoji,
            color: c.color ?? PALETTE_KEYS[i % PALETTE_KEYS.length],
            students: c.students.map((n) => ({ id: uid(), name: n })),
          }))
          return { classes, currentClassId: classes[0].id }
        }),
      exportData: () => {
        const s = get()
        return JSON.stringify(
          {
            version: 3,
            classes: s.classes,
            currentClassId: s.currentClassId,
            logs: s.logs,
            flags: s.flags,
            reminders: s.reminders,
            timerPresets: s.timerPresets,
            bellSchedules: s.bellSchedules,
            activeScheduleId: s.activeScheduleId,
            autoSwitch: s.autoSwitch,
            behaviors: s.behaviors,
            interventions: s.interventions,
          },
          null,
          2,
        )
      },
      importData: (json) => {
        const data = JSON.parse(json)
        if (!Array.isArray(data.classes)) throw new Error('Not a valid backup file')
        set({
          classes: data.classes,
          currentClassId: data.currentClassId ?? data.classes[0]?.id ?? null,
          logs: data.logs ?? [],
          flags: data.flags ?? [],
          reminders: data.reminders ?? [],
          timerPresets: data.timerPresets ?? DEFAULT_TIMER_PRESETS,
          bellSchedules: data.bellSchedules ?? [],
          activeScheduleId: data.activeScheduleId ?? null,
          autoSwitch: data.autoSwitch ?? true,
          behaviors: data.behaviors ?? DEFAULT_BEHAVIORS,
          interventions: data.interventions ?? DEFAULT_INTERVENTIONS,
        })
      },
    }),
    {
      name: 'bos-classroom',
      // Keep ephemeral, session-only UI state out of storage.
      partialize: ({ viewingStudent, pickedByClass, ...rest }) => rest,
    },
  ),
)

if (import.meta.env.DEV) window.__store = useStore

// ---------- derived helpers ----------
export const useCurrentClass = () =>
  useStore((s) => s.classes.find((c) => c.id === s.currentClassId) ?? null)

const CONTACT_MAP = byCode(CONTACT_METHODS)

// Editable chip lists plus memoized code→item lookups for the current class UI.
// cMap (contact methods) is static, folded in so describeLog has all three maps.
export function useChipMaps() {
  const behaviors = useStore((s) => s.behaviors)
  const interventions = useStore((s) => s.interventions)
  return useMemo(
    () => ({
      behaviors,
      interventions,
      contactMethods: CONTACT_METHODS,
      bMap: byCode(behaviors),
      iMap: byCode(interventions),
      cMap: CONTACT_MAP,
    }),
    [behaviors, interventions],
  )
}

export function findStudent(classes, studentId) {
  for (const c of classes) {
    const st = c.students.find((x) => x.id === studentId)
    if (st) return { student: st, cls: c }
  }
  return { student: null, cls: null }
}
