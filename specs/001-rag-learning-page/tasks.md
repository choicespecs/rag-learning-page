# Tasks: RAG Learning Page

**Input**: Design documents from `/specs/001-rag-learning-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ragmath.md, quickstart.md, design.md

**Tests**: No automated test suite requested (plan.md: manual in-browser verification is
proportionate for a single-user static site). Each user story phase ends with a manual
verification task instead of automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing, per spec.md priorities (US1 Chunking P1, US2 Embedding P1, US3 Vector DB
P2, US4 Querying P1).

## Phase 1: Setup (Project Initialization)

- [ ] T001 Create flat repository file scaffold — empty `index.html`, `chunking.html`, `chunking.js`, `embedding.html`, `embedding.js`, `vectordb.html`, `vectordb.js`, `query.html`, `query.js`, `ragmath.js`, `styles.css` at repository root per plan.md Project Structure
- [ ] T002 [P] Define all design tokens as CSS custom properties in `styles.css` per design.md Section 1 (color, typography, spacing, shape, motion)
- [ ] T003 [P] Add JetBrains Mono font import and base body/heading/typography styles in `styles.css` per design.md Section 2
- [ ] T004 [P] Build shared nav component styles and the two-column page layout (viz panel + explanation panel grid) in `styles.css` per design.md Layout Reference

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared toy-math module and landing page that every user story depends on.

**⚠️ CRITICAL**: No user story phase can be considered done until its required functions here exist and match the contract in `contracts/ragmath.md`.

- [ ] T005 Implement `chunkText(text, options)` in `ragmath.js` per contracts/ragmath.md — `fixed` and `sentence` strategies, overlap handling, single-chunk edge case when input shorter than chunk size, empty-array return on empty input
- [ ] T006 Implement `toyEmbed(text)` in `ragmath.js` per contracts/ragmath.md — deterministic word/character-stat-based 2D vector, `null` return on empty/whitespace input, verified manually that related texts land closer together than unrelated ones (research.md)
- [ ] T007 Implement `cosineSimilarity(vectorA, vectorB)` in `ragmath.js` per contracts/ragmath.md — standard formula with zero-magnitude guard returning `0` instead of `NaN`
- [ ] T008 Implement `rankBySimilarity(queryVector, storeEntries)` in `ragmath.js` per contracts/ragmath.md — depends on T006 and T007, stable sort descending by score, assigns 1-based rank
- [ ] T009 Build `index.html` landing page: site title, one-paragraph RAG overview, and a clickable 4-stage pipeline diagram (Chunking → Embedding → Vector DB → Querying) linking to each stage page, styled per `styles.css` tokens

**Checkpoint**: `ragmath.js` fully implements the shared contract; `index.html` links to all four (still-empty) stage pages. Foundation ready — user story implementation can now begin.

## Phase 3: User Story 1 — Understand Chunking (Priority: P1) 🎯 MVP

**Goal**: Learner pastes/types text, adjusts strategy/size/overlap controls, and sees the text visually split into chunks in real time with an in-depth explanation.

**Independent Test**: Open `chunking.html` alone; adjust controls; confirm chunk visualization and explanation panel respond correctly with no dependency on any other stage page.

- [ ] T010 [US1] Build `chunking.html` structure: shared nav (Chunking active), input textarea pre-filled with a sample paragraph, strategy dropdown (`fixed`/`sentence`), size and overlap sliders, chunk-visualization container, explanation panel — two-column layout per design.md
- [ ] T011 [US1] Implement `chunking.js`: wire all controls to `chunkText()` on the `input`/`change` event, render each returned chunk as a bordered block (`[ chunk_01 ]` style), apply the flash-on-change animation to blocks that just changed, render the summary line ("N chunks generated · avg len M chars")
- [ ] T012 [US1] Implement `chunking.js` explanation panel logic: static general description of chunking (updates per selected strategy) plus a `>`-prefixed reactive note describing the effect of the most recent control change, per FR-005
- [ ] T013 [US1] Manual verification: run quickstart.md "Chunking stage" scenarios 1–4, including the short-input edge case (input shorter than chunk size yields exactly one chunk)

**Checkpoint**: Chunking stage fully functional and independently demoable — this is the suggested MVP stopping point if scope needs to shrink.

## Phase 4: User Story 2 — Understand Embedding (Priority: P1)

**Goal**: Learner enters text and sees it turned into a visualized toy vector, with similar texts producing visibly similar vectors.

**Independent Test**: Open `embedding.html` alone; enter different text snippets; confirm the vector visualization and explanation panel respond, independent of any other stage.

- [ ] T014 [US2] Build `embedding.html` structure: shared nav (Embedding active), text input pre-filled with a sample sentence, vector-output visualization area, explanation panel — two-column layout per design.md
- [ ] T015 [US2] Implement `embedding.js`: wire the text input to `toyEmbed()` on the `input` event, render the resulting `{x, y}` as a small visualized point/bar readout, apply the flash-on-change animation when the vector updates
- [ ] T016 [US2] Implement `embedding.js` explanation panel logic: general description of what an embedding vector represents plus a reactive note describing the current vector's values, per FR-005
- [ ] T017 [US2] Manual verification: run quickstart.md "Embedding stage" scenarios 1–3, confirming related text lands near the sample vector and unrelated text lands farther away, and that empty input leaves the last valid state unchanged

**Checkpoint**: Embedding stage fully functional and independently demoable.

## Phase 5: User Story 3 — Understand Vector Storage (Priority: P2)

**Goal**: Learner sees a small collection of pre-embedded example sentences plotted together and can add a new one to see it join the store.

**Independent Test**: Open `vectordb.html` alone; view the pre-loaded store plotted on a 2D chart; add a new sentence and confirm it appears in both the list and the plot.

- [ ] T018 [US3] Build `vectordb.html` structure: shared nav (Vector DB active), pre-loaded example-store list container, "add sentence" input control, `<canvas>` plot area, explanation panel — two-column layout per design.md
- [ ] T019 [US3] Implement `vectordb.js`: define a hardcoded example store array (5–8 short sentences spanning at least two distinguishable topics, per research.md), compute each entry's vector via `toyEmbed()` on load, render the store list and the canvas plot (axes + points)
- [ ] T020 [US3] Implement `vectordb.js` add-entry flow: on submitting the "add sentence" control, compute a new Vector Store Entry via `toyEmbed()`, append to the in-memory store, re-render the list and plot, apply the flash-on-change animation to the new point
- [ ] T021 [US3] Implement `vectordb.js` hover/select interaction: hovering or clicking a plotted point highlights the corresponding store-list entry and displays its coordinate values
- [ ] T022 [US3] Implement `vectordb.js` explanation panel logic: general description of what a vector database conceptually holds plus a reactive note when a new entry is added, per FR-005
- [ ] T023 [US3] Manual verification: run quickstart.md "Vector DB stage" scenarios 1–3

**Checkpoint**: Vector DB stage fully functional and independently demoable.

## Phase 6: User Story 4 — Understand Querying & Retrieval (Priority: P1)

**Goal**: Learner types a query and sees it compared against a stored set of vectors, ranked by similarity, with the top matches visually highlighted.

**Independent Test**: Open `query.html` alone (backed by its own self-contained example store per research.md); enter a query; confirm ranked, visually-highlighted similarity results appear with no dependency on the Vector DB page's live state.

- [ ] T024 [US4] Build `query.html` structure: shared nav (Query active), query input pre-filled with a sample query, ranked-results list container, `<canvas>` plot area, explanation panel — two-column layout per design.md
- [ ] T025 [US4] Implement `query.js`: define its own hardcoded example store (independent from vectordb.js's store, per research.md), compute entry vectors via `toyEmbed()` on load, wire the query input to `toyEmbed()` + `rankBySimilarity()` on the `input` event
- [ ] T026 [US4] Implement `query.js` results rendering: display the ranked list with each entry's numeric similarity score, re-rank live as the query changes, apply flash-on-change animation on re-rank
- [ ] T027 [US4] Implement `query.js` plot rendering: draw the store points and the query point on the canvas, visually distinguish the top-ranked match(es) (e.g., dashed connecting line or highlight color) from lower-ranked points
- [ ] T028 [US4] Implement `query.js` explanation panel logic: general description of retrieval/ranking plus a reactive note describing the current top match and its score, per FR-005
- [ ] T029 [US4] Manual verification: run quickstart.md "Querying stage" scenarios 1–3, including the unrelated-query edge case (still renders, just with lower scores across the board)

**Checkpoint**: Querying stage fully functional and independently demoable. All four stages now complete.

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Style the `index.html` pipeline diagram's hover/click states to match design.md's interaction spec (accent border on hover, no shadow/glow)
- [ ] T031 [P] Cross-page consistency pass: confirm the shared nav correctly highlights the current page on all five pages (`index.html` + 4 stage pages)
- [ ] T032 Verify no console errors and no unexpected network requests on any page (SC-004), per quickstart.md cross-cutting checks
- [ ] T033 Verify all four stage pages use only `styles.css` tokens with zero inline hex values or unstyled default elements (Constitution IV)
- [ ] T034 Confirm every page is reachable from every other page in a single click (SC-005) and that resizing the browser window doesn't break the canvas plots on Vector DB/Query pages

## Dependencies & Execution Order

- **Phase 1 (Setup)** has no dependencies; T002–T004 are parallelizable (different concerns within `styles.css`, but see note below).
- **Phase 2 (Foundational)** depends on Phase 1 (`styles.css` base, `ragmath.js` file existing). T005–T008 all edit `ragmath.js` sequentially (not marked `[P]` despite no logical dependency between T005 and T006/T007, to avoid concurrent edits to the same file). T009 (`index.html`) can start any time after T001.
- **User Story phases (3–6)** each depend only on Phase 2 being complete (`ragmath.js` functions + `index.html` links existing) — they do **not** depend on each other. US1, US2, and US4 are all P1; US3 is P2. Recommended order follows spec.md priority (US1 → US2 → US4 → US3), but any order is valid once Phase 2 is done.
- **Phase 7 (Polish)** depends on all four user story phases being complete.

```
Setup (T001-T004) → Foundational (T005-T009) → { US1 (T010-T013) | US2 (T014-T017) | US3 (T018-T023) | US4 (T024-T029) } → Polish (T030-T034)
```

Within each user story phase, the HTML-structure task must come before its controller-script task, which must come before its manual-verification task (e.g., T010 → T011 → T012 → T013).

## Parallel Execution Examples

Once Phase 2 is complete, the four user story phases touch entirely separate file pairs
(`chunking.html`/`chunking.js`, `embedding.html`/`embedding.js`, `vectordb.html`/`vectordb.js`,
`query.html`/`query.js`) and can be implemented in parallel by different sessions/agents:

```
Track A: T010 → T011 → T012 → T013   (Chunking)
Track B: T014 → T015 → T016 → T017   (Embedding)
Track C: T018 → T019 → T020 → T021 → T022 → T023   (Vector DB)
Track D: T024 → T025 → T026 → T027 → T028 → T029   (Querying)
```

Within Phase 1, T002/T003/T004 touch different rule-sets inside the same `styles.css`
file — safe to draft in parallel if merged carefully, but sequential is simpler for a
single-author project.

## Implementation Strategy

**MVP first**: Complete Phase 1 → Phase 2 → Phase 3 (US1 Chunking) and stop there for a
demoable, independently valuable slice — this proves the core "interact and watch it
change" pattern end-to-end on the simplest stage.

**Incremental delivery** from there, in priority order: US2 (Embedding) → US4 (Querying)
→ US3 (Vector DB), finishing with Phase 7 Polish once all four stages exist. Because
each user story is independently testable, any subset can be demoed at any point without
the others being finished.
