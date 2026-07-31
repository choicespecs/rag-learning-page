# Phase 1 Data Model: RAG Learning Page

All entities below are in-memory JavaScript objects/arrays, scoped to a single page view.
Nothing is persisted (Constitution V) — this document describes shape and validation
rules only, not a database schema.

## Chunk

Represents one segment of source text produced by the Chunking stage.

| Field | Type | Notes |
|---|---|---|
| `index` | number | 0-based position among chunks produced from the same input |
| `text` | string | The chunk's content, always a non-empty substring of the input |
| `startOffset` | number | Character offset in the original input where this chunk begins |
| `length` | number | `text.length`, displayed in the UI (e.g., "118 chars") |

**Validation rules**:
- `text` MUST NOT be empty (edge case: input shorter than chunk size produces exactly one chunk containing the full input, per spec Edge Cases).
- `length` MUST equal `text.length`.

## Toy Embedding Vector

Represents the simulated embedding for a piece of text (used for chunks, free-text
embedding input, vector-store entries, and queries alike).

| Field | Type | Notes |
|---|---|---|
| `x` | number | Plotting-only projection of `dims`, roughly [-1, 1] |
| `y` | number | Plotting-only projection of `dims`, roughly [-1, 1] |
| `dims` | number[256] | L2-normalized feature-hash histogram; similarity is computed on this, not `x`/`y` |
| `sourceText` | string | The text this vector was derived from (kept for display/labeling) |

**Validation rules**:
- Generation MUST be a pure function of `sourceText` — same input text always yields the same output (determinism, FR-007).
- MUST NOT be computed for empty/whitespace-only `sourceText` (edge case in spec).
- `x`/`y` are derived from `dims` via a fixed projection and MUST NOT be used for similarity comparisons — only `dims` is (see contracts/ragmath.md; a plain 2D vector was tried first and found too noisy to rank partial word overlap reliably).

## Vector Store Entry

Represents one item held in the Vector DB / Querying stages' in-memory example store.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Simple incrementing id or slug, unique within the store |
| `label` | string | Short display text (the original sentence) |
| `vector` | Toy Embedding Vector | Embedding for `label` |

**Validation rules**:
- `id` MUST be unique within a store instance so two entries with coincidentally
  identical vectors remain distinguishable in the UI (edge case in spec).
- A store is a plain array of these entries; "adding" one (Vector DB stage) appends a
  new entry computed from learner input.

## Similarity Result

Represents one ranked comparison between a query vector and a stored entry, used only
by the Querying stage's results list and highlighted plot.

| Field | Type | Notes |
|---|---|---|
| `entryId` | string | References a Vector Store Entry's `id` |
| `score` | number | Cosine similarity, range [-1, 1], higher = more similar |
| `rank` | number | 1-based position after sorting all results descending by `score` |

**Validation rules**:
- Results MUST be recomputed and re-ranked on every query change (FR-009).
- `rank` 1 (top match) MUST be visually distinguished on the plot per FR-009/Acceptance Scenario 3.

## Relationships

```
Input Text ──(chunk strategy + settings)──> Chunk[]
Chunk.text / any free text ──(toy embed)──> Toy Embedding Vector
Toy Embedding Vector + label ──(store)──> Vector Store Entry
Query text ──(toy embed)──> query Toy Embedding Vector
query vector × Vector Store Entry[] ──(cosine similarity)──> Similarity Result[]
```

No entity is persisted across page loads; each stage page constructs its own
in-memory instances on load (pre-filled defaults) and on every subsequent interaction.
