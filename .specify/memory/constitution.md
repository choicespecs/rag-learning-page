<!--
Sync Impact Report
- Version change: [none] → 1.0.0 (initial ratification)
- Modified principles: n/a (new document)
- Added sections: Core Principles (I–VI), Design Direction, Repository Layout, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (generic Constitution Check gate already references this file)
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed
- Follow-up TODOs: none
-->

# RAG Learning Page Constitution

## Core Principles

### I. Simplicity & Speed of Development (NON-NEGOTIABLE)
The project MUST use plain HTML, CSS, and JavaScript only — no frameworks, no bundlers,
no build tools, no npm dependencies. Every file MUST be deployable to GitHub Pages by
pushing it as-is. This is a single-user study tool, not a production product; when a
choice exists between "simple and fast to build" and "robust and general," simplicity
wins. Do not add tooling that requires a build step to demonstrate a concept.

### II. Toy Math Only, No Real Models
All embeddings, chunking, and similarity computations MUST be lightweight, deterministic,
simulated implementations — never a real ML model, external API call, or API key.
Correctness of the underlying math is secondary to conceptual clarity: an algorithm is
"good enough" if it visibly demonstrates the concept (e.g., similar text produces
similar-looking vectors) without needing model downloads or network calls. This keeps
the site fully static, dependency-free, and instant to interact with.

### III. Equal Depth Across All Four RAG Stages
Chunking, Embedding, Vector DB, and Querying MUST each receive the same structure and
level of detail: one interactive control panel, one live visualization, and one written
explanation panel that reacts to user input. No stage may be a stub or afterthought
relative to the others. Shared toy-math logic (chunk splitting, embedding generation,
cosine similarity) MUST live in a single shared `ragmath.js` file, loaded via plain
`<script>` tags, so behavior stays consistent across stages without a module bundler.

### IV. Locked Visual Direction ("Terminal Lab")
The site MUST follow the confirmed "Terminal Lab" design direction: dark background,
JetBrains Mono typography throughout, hard rectangular edges (no rounded corners, no
shadows), a single cyan accent color reserved for signaling state changes, and a
flash-on-change animation as the only motion pattern. Generic default/unstyled HTML or
off-the-shelf component-library styling is not acceptable — every page must visibly
carry this identity. Design tokens are defined once in `styles.css` and reused
everywhere; no inline hex values in component code.

### V. Static, Stateless, No Backend
The site MUST run entirely client-side with no server, no database, no authentication,
and no cross-session persistence. Each stage page may pre-fill a sensible default
example so it is never blank on load, but nothing needs to be saved between visits.
Deployment is "push files to GitHub Pages" — nothing else.

### VI. Explanation Is a First-Class Feature
Every stage MUST pair its interaction with an in-depth, tutor-style written explanation
(a few sentences, not a tooltip) that (a) describes the concept generally by default and
(b) reacts with a short contextual note after the user changes an input. Visual
interactivity without explanation, or explanation without interactivity, both fail the
project's core purpose of making the concept "click."

## Design Direction

The locked visual direction, its full token set, typography scale, and component
inventory are recorded in `.specify/specs/001-rag-learning-page/design.md`. That file is
authoritative for all styling decisions; this constitution governs *that a direction is
locked and followed*, not the token values themselves.

## Repository Layout

Plain static files at the repository root (or a `docs/` folder if GitHub Pages requires
it): `index.html`, `chunking.html` + `chunking.js`, `embedding.html` + `embedding.js`,
`vectordb.html` + `vectordb.js`, `query.html` + `query.js`, `ragmath.js`, `styles.css`.
No `src/`, no framework-specific directory conventions, no build output directory.

## Governance

This constitution supersedes ad-hoc styling or architecture choices made during
implementation. Any change that would violate a Core Principle (introducing a build
tool, a real embedding model, an unequal-depth stage, or off-brand styling) requires an
explicit amendment to this document before the change is made, not after. Amendments
follow semantic versioning: MAJOR for removing/redefining a principle, MINOR for adding
a principle or materially expanding guidance, PATCH for wording/clarity fixes. All spec,
plan, and task artifacts produced by `/speckit-specify`, `/speckit-plan`, and
`/speckit-tasks` MUST be checked against these principles before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
