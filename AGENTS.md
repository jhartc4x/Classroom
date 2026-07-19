# Repository Guidelines

## Project Structure & Module Organization

This is a local-first React single-page app built with Vite, Tailwind CSS, and Zustand. Application entry points live in `src/main.jsx` and `src/App.jsx`. Keep feature UI in `src/components/` (for example, `Radar.jsx` or `SeatingEditor.jsx`), shared state in `src/store.js`, static application data in `src/data.js`, and reusable browser/date helpers in `src/utils.js`. Global styles belong in `src/index.css`; PWA icons and other static files belong in `public/`.

## Build, Test, and Development Commands

Run these from the repository root:

```bash
npm install       # install the locked dependency set
npm run dev       # start the Vite development server
npm run build     # create the production bundle in dist/
npm run preview   # serve the built bundle locally
```

There is currently no automated test or lint script. Always run `npm run build` before submitting a change; it is the available integration check. Test affected flows manually in the browser, including persistence after a refresh when changing the Zustand store.

## Coding Style & Naming Conventions

Use JavaScript/JSX with two-space indentation, single quotes, and no semicolons, matching the existing code. Prefer functional React components and hooks. Use PascalCase filenames and component names for UI (`StudentModal.jsx`, `AssessmentBanner`) and camelCase for functions, variables, and Zustand actions (`markBackedUp`). Keep Tailwind utility classes inline and preserve the existing readable multiline layout for long class lists.

Place feature-specific logic next to its component; move only genuinely shared logic to `utils.js`, `data.js`, or `store.js`. Because this app stores private classroom information in `localStorage`, avoid adding network calls or logging student data.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Add backup nudge` and `Add IEP/504 plan tracking`. Follow that format: `Add seating export` rather than `Added changes`. Keep commits focused on one user-visible change.

For pull requests, provide a concise description of the behavior change, note manual verification and build results, link any relevant issue, and include screenshots or a short recording for UI changes. Call out changes to persisted store data or backup/restore formats so reviewers can assess compatibility.
