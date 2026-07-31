# Implementation Plan: RAG Learning Page

**Branch**: `001-rag-learning-page` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-rag-learning-page/spec.md`

## Summary

Build a static, four-page GitHub Pages site that teaches the RAG pipeline (Chunking,
Embedding, Vector DB, Querying) through interactive, in-browser, toy-math visualizations
paired with reactive written explanations. Plain HTML/CSS/JS, no build step, no real
models — every stage is independently viewable and pre-filled with a working example on
load, following the locked "Terminal Lab" visual direction.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020+, browser-native, no transpilation)

**Primary Dependencies**: None (no npm packages, no frameworks, no CDN scripts). One
self-hosted or Google Fonts import for JetBrains Mono is the only external asset.

**Storage**: N/A — no persistence; each stage holds its state in-memory in page-local JS variables for the duration of the page view only.

**Testing**: Manual in-browser verification (open each page, exercise each control, confirm visualization + explanation panel respond). No automated test suite — proportionate to a single-user static learning tool with no business logic requiring regression protection.

**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari/Edge, current versions), served as static files via GitHub Pages.

**Project Type**: Static web site (single frontend, no backend)

**Performance Goals**: Visualization updates render within 1 second of any control input (SC-002); initial page content visible within 5 seconds with no network waits (SC-001) — trivially achievable since there is no network dependency for core functionality.

**Constraints**: No build tool, no bundler, no framework, no backend, no external API calls, no persisted state (Constitution I, II, V). All four stages must share identical visual language (Constitution IV) and identical toy-math logic via one shared file (Constitution III).

**Scale/Scope**: 4 stage pages + 1 landing page + shared stylesheet + shared toy-math module. Single user. No concurrency, no data volume concerns beyond a learner pasting a paragraph or two of text.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Simplicity & Speed of Development | Plain HTML/CSS/JS only, zero dependencies, zero build step | PASS |
| II. Toy Math Only, No Real Models | All embedding/similarity/chunking logic is deterministic toy math in `ragmath.js`; no model downloads, no API keys | PASS |
| III. Equal Depth Across All Four Stages | Each of the 4 stage pages gets: control panel + visualization + explanation panel (spec FR-001–FR-005) | PASS |
| IV. Locked Visual Direction ("Terminal Lab") | `styles.css` holds all design tokens from design.md; no page deviates | PASS |
| V. Static, Stateless, No Backend | No storage layer, no auth, no server; FR-010/FR-011 confirm | PASS |
| VI. Explanation Is a First-Class Feature | Explanation panel required on every stage (FR-005), general + reactive text | PASS |

No violations. Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-learning-page/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── design.md            # UI design spec (from brainstorming Step 4)
├── contracts/           # Phase 1 output — DOM/rendering contracts (see below)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html          # Landing page: RAG overview + links to all 4 stages
chunking.html        # Stage 1 page
chunking.js          # Stage 1 controller (reads DOM controls, calls ragmath.js, renders viz + explanation)
embedding.html       # Stage 2 page
embedding.js         # Stage 2 controller
vectordb.html        # Stage 3 page
vectordb.js          # Stage 3 controller
query.html           # Stage 4 page
query.js             # Stage 4 controller
ragmath.js           # Shared toy-math: chunkText(), toyEmbed(), cosineSimilarity()
styles.css           # Shared design tokens + layout + component styles ("Terminal Lab")
```

**Structure Decision**: Flat repository-root static site (no `src/`, no `docs/` build
output, no framework directory conventions) — matches Constitution's Repository Layout
section and GitHub Pages' default expectation of serving from the repo root or `/docs`.
Each stage is one HTML file + one JS controller file, all sharing `ragmath.js` and
`styles.css` via plain `<script>`/`<link>` tags. This is Option 1 (single project),
simplified further since there is no `src/`/`tests/` split — a flat file layout is the
simplest structure that satisfies Constitution I for a project this size.

## Complexity Tracking

*No violations — section not applicable.*
