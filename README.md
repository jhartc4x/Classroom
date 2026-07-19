# 🎒 Ms. Ambrogio's Classroom

A whimsical, local-first classroom companion for a middle school teacher.
Installable as a PWA — in Chrome/Edge use the install icon in the address bar to get a
dock/desktop app that works offline.

## Features

- **🔔 Bell schedules** — define each schedule the school runs (regular, early release, assembly…),
  map periods to classes, and pick which schedule is in effect today. The header shows a live
  countdown to the end of the current period, and the selected class follows the bell automatically
  (toggleable). Manually picking a class mid-period always wins.
- **📊 CSV export** — per-student history from any Radar card (for conferences/referrals), or the
  full log from Setup.

- **⏱️ Timers** — reusable named presets (Warm-up, Group work, …) that persist all day; start the same timer every period without re-configuring. Big projector-friendly ring display, pause / +1 min, cheerful chime when time's up, mini-timer always visible in the header.
- **✏️ Quick Log** — two taps to record anything: tap a student, tap a behavior (negative *or* positive — shout-outs get confetti) or an intervention you tried. Today's feed with one-click undo.
- **📣 Reminders** — set it once, pick which periods should see it (or every class), and a banner pops up when that class is selected. "Got it" dismisses per class; the reminder completes itself once every class has seen it.
- **🛟 Radar** — flag students you're worried about (disengaged, struggling, behavior, social/emotional, attendance). Each card shows recent incidents, what you've already tried, and suggests tiered next moves with a one-tap "I tried it" logger. Students with 3+ incidents in 2 weeks are auto-suggested for the radar.
- **📇 Student cards** — tap any student (in the grid, the seating chart, or a Radar card) for a full history timeline (behaviors, interventions, parent contacts), a one-tap parent-contact logger, radar status, and a per-student CSV export.
- **🎲 Toolbox** — a whimsical random student picker (with a "no repeats until everyone's had a turn" mode) and a group generator (by size or count, with reshuffle and optional keep-apart pairs).
- **🪑 Seating chart** — arrange desks per class with a touch-friendly tap-to-place editor, then flip Quick Log into a seating view and tap a desk to log — with today's marks shown right on each seat.
- **📈 Trends** — classroom climate by period, most-common behaviors, most-used interventions, incidents by weekday, and a "students to watch" list that flags anyone whose incidents are *slipping* (a jump over their recent baseline). Filter by class and time window.
- **🌅 End-of-day summary** — a one-tap "Wrap up" digest: today's wins, who to keep an eye on, parent contacts made, and reminders still pending.
- **🎛️ Editable quick-log buttons** — rename, reorder, add, or remove the behavior and intervention buttons in Setup to match your school's language.
- **🎒 Setup** — classes with emoji + color, paste-a-list roster import, JSON backup/restore, and full-log CSV export.

## Privacy

All data lives in the browser's localStorage on this device. Nothing is ever sent anywhere.
Use **Setup → Download backup** to save/move your data.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # static production build in dist/
```

Built with React + Vite + Tailwind CSS v4 + zustand.
