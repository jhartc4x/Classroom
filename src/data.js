// Color palettes for classes — full literal class strings so Tailwind picks them up.
export const PALETTES = {
  sky:     { chip: 'bg-sky-200 text-sky-900',     soft: 'bg-sky-100',     ring: 'ring-sky-400',     dot: 'bg-sky-400' },
  rose:    { chip: 'bg-rose-200 text-rose-900',   soft: 'bg-rose-100',    ring: 'ring-rose-400',    dot: 'bg-rose-400' },
  amber:   { chip: 'bg-amber-200 text-amber-900', soft: 'bg-amber-100',   ring: 'ring-amber-400',   dot: 'bg-amber-400' },
  violet:  { chip: 'bg-violet-200 text-violet-900', soft: 'bg-violet-100', ring: 'ring-violet-400', dot: 'bg-violet-400' },
  emerald: { chip: 'bg-emerald-200 text-emerald-900', soft: 'bg-emerald-100', ring: 'ring-emerald-400', dot: 'bg-emerald-400' },
  orange:  { chip: 'bg-orange-200 text-orange-900', soft: 'bg-orange-100', ring: 'ring-orange-400', dot: 'bg-orange-400' },
}
export const PALETTE_KEYS = Object.keys(PALETTES)

export const CLASS_EMOJIS = ['📐', '🧪', '📖', '🌎', '🎨', '🎵', '💻', '🏀', '🔬', '✏️', '🧮', '🚀']

// Behaviors — negative and positive. Two taps: student, then one of these.
// These seed the editable chip lists in the store; teachers can customize them.
export const DEFAULT_BEHAVIORS = [
  { code: 'disruption', label: 'Disruption', emoji: '📢', polarity: 'neg' },
  { code: 'offtask', label: 'Off-task', emoji: '🎈', polarity: 'neg' },
  { code: 'phone', label: 'Phone', emoji: '📱', polarity: 'neg' },
  { code: 'disrespect', label: 'Disrespect', emoji: '⛈️', polarity: 'neg' },
  { code: 'tardy', label: 'Tardy', emoji: '🐌', polarity: 'neg' },
  { code: 'unprepared', label: 'Unprepared', emoji: '🎒', polarity: 'neg' },
  { code: 'outofseat', label: 'Wandering', emoji: '🚶', polarity: 'neg' },
  { code: 'shoutout', label: 'Shout-out!', emoji: '🌟', polarity: 'pos' },
  { code: 'helper', label: 'Helper', emoji: '🦸', polarity: 'pos' },
  { code: 'ontask', label: 'Locked in', emoji: '🎯', polarity: 'pos' },
]

export const DEFAULT_INTERVENTIONS = [
  { code: 'redirect', label: 'Verbal redirect', emoji: '🗣️', tier: 1 },
  { code: 'proximity', label: 'Proximity', emoji: '🧲', tier: 1 },
  { code: 'seatmove', label: 'Seat move', emoji: '🪑', tier: 1 },
  { code: 'checkin', label: 'Private check-in', emoji: '💬', tier: 1 },
  { code: 'brainbreak', label: 'Brain break', emoji: '🧠', tier: 1 },
  { code: 'choice', label: 'Offered choices', emoji: '🔀', tier: 1 },
  { code: 'buddy', label: 'Buddy pairing', emoji: '🤝', tier: 2 },
  { code: 'goalsheet', label: 'Goal sheet', emoji: '📝', tier: 2 },
  { code: 'extrahelp', label: 'Extra help time', emoji: '➕', tier: 2 },
  { code: 'parentcontact', label: 'Parent contact', emoji: '📞', tier: 2 },
  { code: 'counselor', label: 'Counselor referral', emoji: '🧭', tier: 3 },
  { code: 'admin', label: 'Admin referral', emoji: '🏢', tier: 3 },
]

export const CONCERNS = [
  { code: 'disengaged', label: 'Disengaged', emoji: '🫥' },
  { code: 'struggling', label: 'Struggling academically', emoji: '🧗' },
  { code: 'behavior', label: 'Behavior pattern', emoji: '🌪️' },
  { code: 'social', label: 'Social / emotional', emoji: '💙' },
  { code: 'attendance', label: 'Attendance', emoji: '🗓️' },
]

// How a parent/guardian was contacted. Logged as a 'contact'-kind entry.
export const CONTACT_METHODS = [
  { code: 'phone', label: 'Phone call', emoji: '📞' },
  { code: 'email', label: 'Email', emoji: '✉️' },
  { code: 'inperson', label: 'In person', emoji: '🤝' },
  { code: 'notehome', label: 'Note home', emoji: '📝' },
  { code: 'message', label: 'Message / app', emoji: '💬' },
]

// Suggested next moves per concern, roughly ordered from lightest touch to biggest lift.
export const SUGGESTIONS = {
  disengaged: [
    { code: 'checkin', why: 'A 60-second private chat often uncovers what’s really going on.' },
    { code: 'choice', why: 'Choice (topic, seat, format) restores a sense of control.' },
    { code: 'seatmove', why: 'Move them closer to the action — or away from a distracting orbit.' },
    { code: 'buddy', why: 'Pair with a positive peer for the next group task.' },
    { code: 'goalsheet', why: 'Tiny daily goals + quick wins rebuild momentum.' },
    { code: 'parentcontact', why: 'Loop in home with something positive first, then the concern.' },
    { code: 'counselor', why: 'If disengagement persists, the counselor can dig deeper.' },
  ],
  struggling: [
    { code: 'checkin', why: 'Ask them to show you where it stops making sense.' },
    { code: 'extrahelp', why: 'Offer a standing time — before school, lunch, or study hall.' },
    { code: 'buddy', why: 'A peer explaining it a second way often lands better.' },
    { code: 'goalsheet', why: 'Chunk the work: one skill at a time with visible progress.' },
    { code: 'parentcontact', why: 'Share specific skills to practice at home, not just "struggling".' },
    { code: 'counselor', why: 'Consider screening for supports if gaps keep widening.' },
  ],
  behavior: [
    { code: 'proximity', why: 'Teach from near their seat for a few minutes.' },
    { code: 'redirect', why: 'Quiet, private redirect — avoid the public showdown.' },
    { code: 'seatmove', why: 'Change the geography, change the behavior.' },
    { code: 'checkin', why: 'Ask what’s underneath it — behavior is communication.' },
    { code: 'goalsheet', why: 'A simple daily behavior goal with a check-out at the bell.' },
    { code: 'parentcontact', why: 'Partner with home before it escalates.' },
    { code: 'admin', why: 'If it’s repeated and disruptive, document and refer.' },
  ],
  social: [
    { code: 'checkin', why: 'Low-stakes check-in: "I noticed… everything okay?"' },
    { code: 'buddy', why: 'Engineer a positive pairing in group work.' },
    { code: 'brainbreak', why: 'A reset moment can defuse a rough day.' },
    { code: 'counselor', why: 'Counselors are the pros here — refer early, not late.' },
    { code: 'parentcontact', why: 'Compare notes with home, gently.' },
  ],
  attendance: [
    { code: 'checkin', why: '"We missed you" lands better than "you missed work".' },
    { code: 'goalsheet', why: 'A catch-up plan so returning doesn’t feel hopeless.' },
    { code: 'parentcontact', why: 'Ask home what mornings look like.' },
    { code: 'counselor', why: 'Chronic absence usually has a story — get support involved.' },
  ],
}

export const DEFAULT_TIMER_PRESETS = [
  { id: 'tp1', label: 'Warm-up', emoji: '☀️', seconds: 300 },
  { id: 'tp2', label: 'Group work', emoji: '👯', seconds: 900 },
  { id: 'tp3', label: 'Quiet work', emoji: '🤫', seconds: 600 },
  { id: 'tp4', label: 'Clean-up', emoji: '🧹', seconds: 120 },
  { id: 'tp5', label: 'Brain break', emoji: '🧠', seconds: 180 },
]

export const SAMPLE_CLASSES = [
  {
    name: 'Period 1 · Math', emoji: '🧮', color: 'sky',
    students: ['Ava M.', 'Ben T.', 'Carlos R.', 'Dena W.', 'Eli S.', 'Fiona K.', 'Gus P.', 'Hana L.'],
  },
  {
    name: 'Period 3 · Math', emoji: '📐', color: 'rose',
    students: ['Iris B.', 'Jayden C.', 'Kira D.', 'Liam F.', 'Maya G.', 'Noah H.', 'Olive J.', 'Pete N.'],
  },
  {
    name: 'Period 5 · Algebra', emoji: '🚀', color: 'violet',
    students: ['Quinn A.', 'Rosa E.', 'Sam V.', 'Tara Z.', 'Umar Y.', 'Vera X.', 'Wes O.', 'Xio Q.'],
  },
]
