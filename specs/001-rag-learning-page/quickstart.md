# Quickstart: RAG Learning Page

## Prerequisites

- A modern desktop browser (Chrome, Firefox, Safari, or Edge).
- No installs, no package manager, no build step.

## Run locally

```bash
# From the repository root — any static file server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Opening `index.html` directly via `file://` also works for every stage page, since
there is no server-side logic and no fetch of local files across origins.

## Validation scenarios (manual — no automated test suite per plan.md)

### 1. Chunking stage
1. Open `chunking.html`. **Expect**: sample paragraph already visibly split into chunk blocks; explanation panel shows the general "what is chunking" description.
2. Drag the chunk-size slider. **Expect**: chunk blocks re-split immediately; explanation panel's reactive note updates to describe the change.
3. Switch strategy dropdown to sentence-based. **Expect**: chunks now break on sentence boundaries; general explanation text updates to describe that strategy.
4. Replace the sample text with your own paragraph. **Expect**: chunks recompute from the new text.

### 2. Embedding stage
1. Open `embedding.html`. **Expect**: sample sentence already shows a visualized toy vector.
2. Enter a sentence closely related in wording to the sample. **Expect**: resulting vector visually lands near the sample's vector.
3. Enter an unrelated sentence. **Expect**: resulting vector visually lands farther away.

### 3. Vector DB stage
1. Open `vectordb.html`. **Expect**: 5–8 pre-loaded example sentences already plotted on the 2D canvas.
2. Add a new sentence via the input control. **Expect**: it appears in the store list and as a new plotted point with a brief flash.
3. Hover/select a plotted point. **Expect**: corresponding sentence and coordinates highlight.

### 4. Querying stage
1. Open `query.html`. **Expect**: a sample query already shows ranked results against that page's own example store.
2. Enter a new query related to one topic cluster in the store (e.g., "cooking"). **Expect**: top-ranked results are the entries from that cluster, each showing a numeric similarity score; top match is visually distinguished on the plot.
3. Enter a query unrelated to any stored entry's topic. **Expect**: scores are visibly lower across the board, but results still render (no error state).

### Cross-cutting checks

- Every page reachable from every other page via the shared nav in one click (SC-005).
- No console errors, no network requests beyond the initial page/font load (SC-004) — check browser DevTools Network/Console tabs.
- All four pages visually match the "Terminal Lab" direction (dark background, monospace type, single cyan accent, hard edges) — no page looks like unstyled/default HTML.
