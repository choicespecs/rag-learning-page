# Phase 0 Research: RAG Learning Page

No items in Technical Context were marked `NEEDS CLARIFICATION` — the brainstorming
conversation already resolved stack, dependency, and scope questions. This document
instead records the toy-algorithm decisions needed before implementation, since these
directly affect whether the site fulfills Constitution II (toy math must still visibly
demonstrate the real concept).

## Decision: Chunking strategies to implement

**Decision**: Implement two strategies — **fixed-size** (split every N characters, with
an optional overlap of M characters repeated at the start of each subsequent chunk) and
**sentence-based** (split on sentence-ending punctuation `. ! ?`, then greedily group
sentences until the configured target size is reached).

**Rationale**: These two are the most commonly discussed real-world chunking strategies
and are trivial to implement without a tokenizer library. Fixed-size demonstrates the
overlap concept cleanly; sentence-based demonstrates that chunking can respect semantic
boundaries instead of cutting mid-sentence.

**Alternatives considered**: Recursive/hierarchical splitting (as used by real RAG
frameworks) was rejected as too complex to visualize simply for a two-strategy toy demo;
token-based splitting was rejected because it would require either a real tokenizer
dependency (violates Constitution I) or a fake token approximation that adds complexity
without adding teaching value beyond what character-based splitting already shows.

## Decision: Toy embedding algorithm

**Decision (revised during implementation)**: Generate a 256-dimension feature-hashed
"bucket count" vector — each meaningful word hashes into one of 256 buckets, bucket
counts are incremented and then L2-normalized. A fixed deterministic projection (each
bucket placed at an evenly spaced angle around a circle, summed) derives a 2D `(x, y)`
point from that same vector for plotting. `cosineSimilarity()` compares the full
256-dimension vectors, not the 2D projection.

**Rationale**: The original plan (see "Alternatives considered" below) used a plain 2D
vector directly — a per-word hash-angle averaged across a sentence's words. Manual
verification while building the Querying stage (per contracts/ragmath.md's requirement
to check that related text scores higher than unrelated text) showed this was too
noisy: with only 2 dimensions, a couple of unrelated words can coincidentally average to
nearly the same point as a couple of genuinely shared words, so ranking by partial word
overlap was unreliable (a query about pasta sauce ranked an unrelated space sentence
above the one sentence that actually shared the word "sauce"). Increasing to 256 buckets
reduces hash-collision noise enough that shared words reliably dominate the similarity
score, while still keeping the *plot* 2-dimensional by deriving `(x, y)` from the same
vector via a fixed projection — mirroring how a real system would use PCA/t-SNE to
visualize a high-dimensional embedding in 2D without changing what's actually compared.

**Alternatives considered**: A pure 2-dimension vector (no separate similarity
representation) was the original decision, rejected per the measurement above. IDF-style
word reweighting on top of the 2-dimension vector was also tried and did not fix the
noise (the problem is dimensionality, not word weighting). A much higher bucket count
(512+) was tried and occasionally introduced its own noise from very sparse vectors;
256 was the smallest count that produced correct top-1 rankings across several test
queries against the project's example store.

## Decision: Similarity metric

**Decision**: Cosine similarity, computed directly on the 2D toy vectors, implemented
once in `ragmath.js` and reused by both the Vector DB and Querying stages.

**Rationale**: Cosine similarity is the standard metric in real RAG systems, so this is
one place toy and real implementations align exactly — good for teaching value at no
extra complexity cost since it's a ~3-line formula.

**Alternatives considered**: Euclidean distance was considered (marginally simpler) but
rejected because cosine similarity is the metric learners will actually encounter in
real RAG documentation, so using it here transfers directly.

## Decision: Vector DB / Query example store content

**Decision**: Each of the Vector DB and Querying pages ships its own small hardcoded
array (5–8 short example sentences spanning at least two distinguishable topics, e.g.
"cooking" vs. "space travel") defined as a plain JS array literal at the top of the
page's controller script.

**Rationale**: Satisfies the spec's Assumption that each page is independently testable
without live hand-off between pages, keeps state in-memory only, and gives the
similarity demo obviously-clustered topics so retrieval results are intuitively
"correct" to a learner.

**Alternatives considered**: Sharing one store via `localStorage` across pages was
considered, but rejected — it would reintroduce a form of persistence/coupling between
pages that Constitution V and the spec's Assumptions explicitly avoid.

## Decision: 2D plotting approach

**Decision**: Render plots using an HTML5 `<canvas>` element with plain 2D context
drawing calls (axes, points, labels, dashed lines) — no charting library.

**Rationale**: A charting library would be the first real dependency in the project,
violating Constitution I. Canvas drawing for a handful of points and a couple of axes is
straightforward vanilla JS.

**Alternatives considered**: Inline SVG was considered and is a reasonable alternative
(also dependency-free); canvas was chosen because imperative redraw-on-input-event
matches the "recompute and redraw everything" model used throughout the site, and because
hit-testing hover/selection on canvas points is simple enough at this scale (small number
of points, direct distance check against mouse coordinates).
