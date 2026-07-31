# Design Spec: "Terminal Lab" (Simplified)

**Feature**: [spec.md](./spec.md) | **Status**: Locked

## Identity

- **Adjectives**: sharp, focused
- **References**: Duolingo, Khan Academy (guided-learning structure — reinterpreted here in a more precise/technical register, not their playful visual language)
- **User headspace**: casual, curious, self-drilling
- **Design intention**: seeing the concept actually click as you interact with it

## Philosophy

"You're debugging your own understanding, one step at a time." Dark, monospace-only,
hard rectangular edges, minimal chrome — a code-editor/debugger-console feel rather than
a marketing website. Simplified from the original three-direction pitch: one accent
color only, one animation pattern only, and a persistent in-depth explanation panel on
every stage (added per user feedback during brainstorming).

## 1. Design Tokens (CSS custom properties)

```css
:root {
  /* Color */
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent: #39d0d8;
  --accent-dim: #1f6e72;
  --success: #3fb950;
  --error: #f85149;

  /* Typography */
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --fs-xs: 0.8rem;
  --fs-sm: 0.9rem;
  --fs-base: 1rem;
  --fs-lg: 1.25rem;
  --fs-xl: 1.75rem;
  --fs-2xl: 2.25rem;
  --fw-regular: 400;
  --fw-bold: 600;

  /* Spacing (4px base unit) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;

  /* Shape */
  --radius: 0px;       /* hard edges everywhere, by design */
  --border-width: 1px;

  /* Motion */
  --flash-duration: 400ms;
  --transition-fast: 120ms ease-out;
}
```

## 2. Typography System

- **Font stack**: JetBrains Mono only, for both headers and body — reinforces the "lab console" feel.
- **Import method**: Google Fonts `<link>` in `<head>` of every page (weights 400 + 600 only, keeps page weight light).
- **Size scale**: `--fs-xs` (labels/meta) → `--fs-sm` (body/explanation text) → `--fs-base` (inputs/controls) → `--fs-lg` (section headers) → `--fs-xl` (stage title) → `--fs-2xl` (site title only, on index.html).
- **Weight roles**: 400 for body/explanation copy, 600 for headers, labels, and the active nav item.

## 3. Component Inventory

| File | Contains |
|---|---|
| `index.html` | Site title, one-paragraph RAG overview, clickable 4-stage pipeline diagram linking to each stage |
| `styles.css` | All design tokens, shared layout (nav, two-column grid: viz panel + explanation panel), shared component styles (buttons, sliders, chunk blocks, flash animation) |
| `chunking.html` / `chunking.js` | Text input, strategy dropdown, size/overlap sliders, chunk-block visualization, explanation panel with reactive notes |
| `embedding.html` / `embedding.js` | Text/chunk input, toy embedding output as a small vector readout, explanation panel |
| `vectordb.html` / `vectordb.js` | Canned example store, "add vector" action, simple 2D plot on `<canvas>`, explanation panel |
| `query.html` / `query.js` | Query input, live cosine-similarity ranking against the vector store, highlighted plot, explanation panel |
| `ragmath.js` | Shared toy-embedding function, cosine similarity function, chunk-splitting function — loaded via plain `<script src="ragmath.js">` |

## 4. Interaction Spec

- **Hover states**: interactive elements (buttons, chunk blocks, plotted points, nav links) get `border-color: var(--accent)` on hover — no background change, no shadow.
- **Focus rings**: `outline: 1px solid var(--accent); outline-offset: 2px` on all focusable elements.
- **Transitions** — exactly two motion types exist in the whole site:
  1. **Flash** — on any element whose underlying value just changed, background briefly shifts to `var(--accent-dim)` then fades back over `--flash-duration`.
  2. **Instant recompute** — sliders/dropdowns update the visualization and explanation panel immediately on the `input` event, no debounce.
- **No page transitions** — plain `<a>` navigation between stages, full page load each time.

## 5. Empty & Loading States

- No spinners anywhere — all computation is instant client-side toy math.
- **Empty state (no input yet)**: every stage page ships with a sensible default example pre-filled, so the visualization is never blank on first load.
- **Explanation panel default state**: shows the general "what is this stage" explanation before any interaction; switches to a reactive "here's what just changed" note after the first input event, prefixed with `>` to visually distinguish it from the static explanation above.

## Layout Reference (Chunking stage, representative of all four)

```
┌──────────────────────────────────────────────────────┐
│ RAG_LAB     [Chunking] Embedding  VectorDB  Query     │
├───────────────────────────────┬──────────────────────┤
│ INPUT TEXT                    │ WHAT IS CHUNKING?     │
│ ┌────────────────────────┐    │ Chunking splits raw   │
│ │ Paste your text here... │    │ text into smaller     │
│ └────────────────────────┘    │ pieces before it's    │
│                                │ embedded. This matters│
│ STRATEGY: [fixed ▾]           │ because...            │
│ size:    [====|----] 120      │                       │
│ overlap: [==|----] 20         │ > you just increased   │
│                                │   overlap to 20 —     │
│ CHUNKS ──────────────────     │   chunks now repeat    │
│ [ chunk_01 ][ chunk_02 ]      │   the last 20 chars    │
│ [ chunk_03 ][ chunk_04 ]      │   of the prior chunk.  │
│  ^^^^^^^^^^ flashed cyan      │                       │
│                                │                       │
│ > 4 chunks · avg len 118 chars│                       │
└───────────────────────────────┴──────────────────────┘
```
