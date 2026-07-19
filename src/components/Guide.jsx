import { Card, SectionTitle, BigButton } from './ui'
import { useStore } from '../store'

const FEATURES = [
  ['✏️', 'Quick Log', 'Tap a student, then a behavior or support you used. Add a note before the next tap when context will help later.'],
  ['⏱️', 'Timers & Toolbox', 'Run reusable class timers, randomly choose a student, or make groups without repeats.'],
  ['📣', 'Reminders & Radar', 'Show period-specific reminders and spot students who may need support—or deserve recognition.'],
  ['📈', 'Trends & Wrap up', 'Review patterns by class and time window, then finish the day with a quick summary.'],
  ['🎒', 'Setup', 'Manage classes, rosters, seats, quick-log buttons, bell schedules, assessments, and backups.'],
]

export default function Guide({ onNavigate, hasClasses }) {
  const classes = useStore((s) => s.classes)
  const lastBackupTs = useStore((s) => s.lastBackupTs)
  const hasRoster = classes.some((cls) => cls.students.length > 0)
  const setupComplete = hasClasses && hasRoster && lastBackupTs

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Card className="border-2 border-sky-200 bg-sky-50">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">👋 Welcome to your classroom companion</h2>
            <p className="mt-1 max-w-2xl text-ink/70">
              Keep the little classroom details in one private, easy-to-use place—on this device only.
            </p>
          </div>
          <BigButton className="shrink-0 bg-ink text-white" onClick={() => onNavigate(hasClasses ? 'log' : 'setup')}>
            {hasClasses ? 'Open Quick Log' : 'Start setup'}
          </BigButton>
        </div>
      </Card>

      {!setupComplete && (
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <SectionTitle emoji="✅">Setup progress</SectionTitle>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className={`rounded-2xl px-3 py-2 font-bold ${hasClasses ? 'bg-emerald-200 text-emerald-900' : 'bg-white text-ink/60'}`}>
              {hasClasses ? '✓' : '○'} Add your classes
            </div>
            <div className={`rounded-2xl px-3 py-2 font-bold ${hasRoster ? 'bg-emerald-200 text-emerald-900' : 'bg-white text-ink/60'}`}>
              {hasRoster ? '✓' : '○'} Add a roster
            </div>
            <div className={`rounded-2xl px-3 py-2 font-bold ${lastBackupTs ? 'bg-emerald-200 text-emerald-900' : 'bg-white text-ink/60'}`}>
              {lastBackupTs ? '✓' : '○'} Download a backup
            </div>
          </div>
          <p className="mt-3 text-sm text-ink/70">Complete these once to be ready for day-to-day use. You can customize other settings whenever you need them.</p>
          <button onClick={() => onNavigate('setup')} className="mt-2 text-sm font-bold text-emerald-800 hover:underline cursor-pointer">
            Continue setup →
          </button>
        </Card>
      )}

      <Card>
        <SectionTitle emoji="🚀">Get started in three steps</SectionTitle>
        <ol className="grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-2xl bg-cream p-4"><strong>1. Add classes.</strong><br />In Setup, create each period and paste a roster.</li>
          <li className="rounded-2xl bg-cream p-4"><strong>2. Make it yours.</strong><br />Edit the quick-log buttons; optionally add seats, bells, and assessments.</li>
          <li className="rounded-2xl bg-cream p-4"><strong>3. Log as you go.</strong><br />Use Quick Log for quick notes, supports, and shout-outs during class.</li>
        </ol>
        <button onClick={() => onNavigate('setup')} className="mt-4 text-sm font-bold text-sky-700 hover:underline cursor-pointer">
          Go to Setup →
        </button>
      </Card>

      <Card>
        <SectionTitle emoji="🧭">Where everything is</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(([emoji, title, text]) => (
            <div key={title} className="rounded-2xl bg-cream p-4">
              <h3 className="font-display font-bold">{emoji} {title}</h3>
              <p className="mt-1 text-sm text-ink/70">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle emoji="🔄">A simple daily rhythm</SectionTitle>
        <p className="text-sm text-ink/70">
          Pick the current class from the header. During class, keep Quick Log open; select a student from the roster or seating chart and record a mark or intervention. Use the 📇 button on a student for their history and parent contacts. The bell pill can switch classes automatically when you map a bell schedule in Setup. At day&apos;s end, choose <strong>🌅 Wrap up</strong> in the header to review wins, follow-ups, and pending reminders.
        </p>
      </Card>

      <Card className="border-2 border-amber-200 bg-amber-50">
        <SectionTitle emoji="🔒">Privacy & backups</SectionTitle>
        <p className="text-sm text-ink/70">
          Classroom data stays in this browser&apos;s local storage; it is not sent anywhere. Use <strong>Setup → Download backup</strong> regularly, especially before moving to another computer. Restore that file from the same area if needed. Keep support-plan details in the private student card and assessment-prep views, not on projected screens.
        </p>
      </Card>
    </div>
  )
}
