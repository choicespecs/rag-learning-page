# Contract: `ragmath.js` Shared Module

This is the project's only internal "interface" — the shared function surface every
stage page's controller script depends on. Contract, not implementation: function
signatures, inputs, outputs, and guarantees. All four stage controllers (`chunking.js`,
`embedding.js`, `vectordb.js`, `query.js`) MUST call these functions rather than
reimplementing equivalent logic, per Constitution III.

## `chunkText(text, options) -> Chunk[]`

- **Input**: `text` (string, raw input), `options` = `{ strategy: 'fixed' | 'sentence', size: number, overlap: number }`
- **Output**: Array of `Chunk` objects (see data-model.md), in order, covering the entire input with no gaps.
- **Guarantees**:
  - Never returns an empty array for non-empty input.
  - If `text.length <= size`, returns exactly one chunk containing the full input.
  - For `strategy: 'fixed'`, each chunk after the first repeats the last `overlap` characters of the previous chunk.
  - For `strategy: 'sentence'`, splits occur only at sentence-ending punctuation boundaries.
  - Throws no exceptions on empty/whitespace input; returns an empty array instead (callers must handle this per the "empty input" edge case).

## `toyEmbed(text) -> ToyEmbeddingVector`

- **Input**: `text` (string)
- **Output**: `{ x: number, y: number, dims: number[256], sourceText: text }`
- **Guarantees**:
  - Pure function: identical `text` always produces identical output (determinism).
  - `dims` is an L2-normalized 256-bucket feature-hash histogram over the text's
    meaningful (non-stopword) words — this is what similarity is actually computed on.
  - `x`/`y` are a fixed deterministic projection of `dims` (each bucket placed at an
    evenly spaced angle, summed) — for plotting only, never used for similarity scoring.
  - Texts sharing more words/themes produce `dims` vectors with higher cosine similarity
    than unrelated texts (FR-007) — verified manually against the project's example
    store (see research.md); a plain 2-dimension vector was tried first and rejected for
    being too noisy to rank partial overlap reliably.
  - Returns `null` (not a vector) for empty/whitespace-only input; callers must not plot or store a null result.

## `previewTokens(text) -> {word: string, kept: boolean}[]`

- **Input**: `text` (string)
- **Output**: One entry per word found by the same lowercase + word-split step `toyEmbed()` uses internally, in original order, each tagged with whether it survives stopword filtering (`kept: true`) or gets dropped (`kept: false`).
- **Guarantees**:
  - Does not duplicate `toyEmbed()`'s preprocessing logic — calls `meaningfulWords()` internally so the two can never drift out of sync.
  - Mirrors `meaningfulWords()`'s all-stopword fallback: if every word would otherwise be filtered out, every entry is tagged `kept: true` instead, matching what `toyEmbed()` actually hashes in that case.
  - Returns `[]` for empty/whitespace-only input.
  - Purely for UI display (the Embedding page's preprocessing visualization) — never used for similarity scoring.

## `cosineSimilarity(vectorA, vectorB) -> number`

- **Input**: two `ToyEmbeddingVector`-shaped objects (`dims` arrays used, not `x`/`y`)
- **Output**: number in range [-1, 1]
- **Guarantees**:
  - Standard cosine similarity formula computed over the full `dims` arrays.
  - Returns `0` if either vector has zero magnitude (guards divide-by-zero) rather than `NaN`.

## `rankBySimilarity(queryVector, storeEntries) -> SimilarityResult[]`

- **Input**: `queryVector` (ToyEmbeddingVector), `storeEntries` (Vector Store Entry[])
- **Output**: Array of `SimilarityResult` (see data-model.md), sorted descending by `score`, with `rank` assigned 1..N.
- **Guarantees**:
  - Length of output always equals length of `storeEntries` (every entry is scored, none dropped).
  - Ties in score are broken by original store order (stable sort) so results are deterministic.

## Consumers

| Function | Used by |
|---|---|
| `chunkText` | `chunking.js` |
| `toyEmbed` | `chunking.js` (optional preview), `embedding.js`, `vectordb.js`, `query.js` |
| `previewTokens` | `embedding.js` (preprocessing visualization) |
| `cosineSimilarity` | `rankBySimilarity` internally; `vectordb.js` (point-hover distance, optional) |
| `rankBySimilarity` | `query.js` |
