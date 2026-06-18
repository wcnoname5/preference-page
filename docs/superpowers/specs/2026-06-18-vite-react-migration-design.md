# Migration: vanilla TS SPA → Vite + React + TypeScript + TailwindCSS

Date: 2026-06-18

## Goal

Replace the hand-rolled DOM/router frontend with Vite + React + TypeScript +
TailwindCSS, keeping the 2AFC preference-elicitation behavior identical and
preserving the project's "shell vs algorithm" separation. Still deploys to
GitHub Pages as a static site.

## Principle

The codebase already splits pure logic from DOM. The migration keeps the logic,
inverts the runner's DOM coupling, and rewrites the UI shell as React.

### Three buckets

1. **Pure logic — kept verbatim** (only `.js` import suffixes dropped):
   `algorithms`, `tasks`, `stopConditions`, `taskLogger`, `config`, `types`.
2. **Mixed concerns — refactored** (`runner.ts`): keeps the control-flow logic,
   stops pushing to a `View`. Becomes a headless controller exposing state.
3. **Pure UI — deleted, becomes JSX**: `view`, `dom`, `router`, `pages/*`,
   `main`, `index.html` body, `style.css`.

## Project layout

```
index.html              # Vite root entry, <div id="root">, no CDN script
vite.config.ts          # base:'/preference-page/', react + tailwind plugins
tsconfig.json           # jsx react-jsx, bundler resolution, noEmit
tsconfig.node.json
package.json            # react, react-dom, chart.js, react-chartjs-2
src/
  main.tsx              # createRoot → <App/>
  index.css            # @import "tailwindcss";
  App.tsx              # page state 'setup'|'experiment'|'result'
  logic/
    algorithms.ts tasks.ts stopConditions.ts taskLogger.ts config.ts types.ts
    experiment.ts        # refactored headless controller
  hooks/useExperiment.ts
  components/
    SetupForm.tsx Experiment.tsx DebugTable.tsx Result.tsx
```

Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config.js`, no PostCSS file.

## Controller refactor (the only non-mechanical part)

`logic/experiment.ts` keeps `Runner` + `Experiment` logic but drops the `View`
import. It maintains a snapshot and fires `onChange`:

```ts
type Phase = 'choosing' | 'slider' | 'roundDone' | 'done';
interface ExperimentState {
  taskHeader: string;
  alternatives: Alternatives;
  algoState: AlgorithmState;
  debugRows: DebugRow[];
  phase: Phase;
  sliderSpec?: SliderSpec;
  result?: { sequence: stdSeq; lossAversion: LossAversionResult };
}
```

`Experiment` takes `onChange(state)` instead of a `View`. Each former
`view.render/log/showSlider/beginRound/showNextRound` call mutates the snapshot
and fires `onChange`. The slider-finalize and target-chaining edge cases are
carried over unchanged. `useExperiment` holds the snapshot in `useState` and
exposes `{ state, choose, next, slideTo, confirmSlider }`.

## Components ↔ current code

- **SetupForm** ← `index.html#setup` + `pages/setup.ts`. Native form validation
  kept (`min/max/step`, integer message via `setCustomValidity`).
- **Experiment** ← `index.html#experiment` + `view.ts`. `phase` drives which
  controls render. Debug `<details>` stays native.
- **DebugTable** ← `view.log`'s row building, now `state.debugRows.map(...)`.
- **Result** ← `pages/result.ts`. Imperative tables → JSX; Chart.js → `<Scatter>`
  from react-chartjs-2 with the same options (zero-axis grid, y-tick name
  mapping, tooltip).

## Build / deploy

- Vite `base: '/preference-page/'` for the Pages subpath.
- `deploy.yml`: `npm ci` → `npm run build` → upload `dist/`. Drops manual `tsc`
  and `_site` assembly.
- Local dev: `npm run dev` (localhost — satisfies the ES-module requirement).

## Testing

One runnable smoke check: drive a full HaB run through the controller and assert
it reaches `phase:'done'` with the expected sequence length. No test framework.

## Skipped (YAGNI)

Component tests, error boundaries, routing lib, Tailwind config file.
