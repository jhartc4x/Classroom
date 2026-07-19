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
- **🛟 Radar** — two modes. **Watch** flags students you're worried about (disengaged, struggling, behavior, social/emotional, attendance) with tiered next-move suggestions and a one-tap "I tried it" logger; students with 3+ incidents in 2 weeks are auto-suggested. **Shine** recognizes students who are participating well, asking great questions, or being a good citizen — not just kids who've improved from a rough patch — with the same auto-suggestion for 3+ positive marks in 2 weeks.
- **🎯 IEP / 504 plans** — per student: plan type, review date, accommodations (quick-pick chips, editable in Setup, plus one-off custom text), and goals with a status (not started/in progress/met) and a dated progress-note log. A subtle, generic dot on the roster card hints a student has a plan on file without naming the plan type — full detail only shows in their private card.
- **📋 Assessment days** — schedule a test day per class in Setup; a same-day banner shows up, and a prep-list checklist cross-references which students have accommodations, what they need, and lets you check off each as provided.
- **📇 Student cards** — tap any student (in the grid, the seating chart, or a Radar card) for a full history timeline (behaviors, interventions, parent contacts), a one-tap parent-contact logger, Watch/Shine status, IEP/504 plan, and a per-student CSV export.
- **🎲 Toolbox** — a whimsical random student picker (with a "no repeats until everyone's had a turn" mode) and a group generator (by size or count, with reshuffle and optional keep-apart pairs).
- **🪑 Seating chart** — arrange desks per class with a touch-friendly tap-to-place editor, then flip Quick Log into a seating view and tap a desk to log — with today's marks shown right on each seat.
- **📈 Trends** — classroom climate by period, most-common behaviors, most-used interventions, incidents by weekday, and a "students to watch" list that flags anyone whose incidents are *slipping* (a jump over their recent baseline). Filter by class and time window.
- **🌅 End-of-day summary** — a one-tap "Wrap up" digest: today's wins, who to keep an eye on, parent contacts made, and reminders still pending.
- **🎛️ Editable quick-log buttons** — rename, reorder, add, or remove the behavior and intervention buttons in Setup to match your school's language.
- **🎒 Setup** — classes with emoji + color, paste-a-list roster import, JSON backup/restore, and full-log CSV export.

## Privacy

All data lives in the browser's localStorage on this device. Nothing is ever sent anywhere.
Use **Setup → Download backup** to save/move your data.

IEP/504 plan details never appear on any roster view that might be projected — only in a
student's private detail card and the assessment prep list. The roster shows a small neutral
dot (no plan type) as a quiet reminder to check there.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # static production build in dist/
```

Built with React + Vite + Tailwind CSS v4 + zustand.
