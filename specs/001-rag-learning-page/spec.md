# Feature Specification: RAG Learning Page

**Feature Branch**: `001-rag-learning-page`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "A static GitHub Pages website that helps me learn and understand the RAG (Retrieval-Augmented Generation) process by splitting it into its stages — chunking, embedding, vector DB storage, and querying — with an interactive, visual, in-browser way to see how each stage works in real time, plus in-depth written explanations. Single user (myself), for studying/reference — no persistence required."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Chunking (Priority: P1)

As a learner, I want to paste or type text, choose a chunking strategy, and immediately see it visually split into chunks, so I understand how raw documents get broken down before being embedded.

**Why this priority**: Chunking is the first stage of the RAG pipeline and the easiest to grasp intuitively — it's the natural entry point to the site and validates the core "interact and watch it change" pattern the whole project depends on.

**Independent Test**: Can be fully tested by opening the chunking page alone, changing chunk size/overlap/strategy controls, and confirming the visualized chunks and explanation text update accordingly — no other stage needs to exist for this to deliver value.

**Acceptance Scenarios**:

1. **Given** the chunking page has loaded with a pre-filled sample paragraph, **When** the page finishes loading, **Then** the learner immediately sees the sample text already split into visualized chunks (no blank state).
2. **Given** the chunking page is open, **When** the learner adjusts the chunk-size slider, **Then** the chunk visualization re-splits instantly and the explanation panel shows a contextual note describing what changed and why.
3. **Given** the chunking page is open, **When** the learner switches the chunking strategy (e.g., fixed-size to sentence-based), **Then** the visualization reflects the new strategy's output and the explanation panel's general description updates to describe that strategy.
4. **Given** the chunking page is open, **When** the learner replaces the sample text with their own text, **Then** chunks are recalculated from the new text using the current strategy/settings.

---

### User Story 2 - Understand Embedding (Priority: P1)

As a learner, I want to see a piece of text turned into a vector representation, so I understand what "embedding" means and how similar text produces similar-looking vectors.

**Why this priority**: Embedding is the conceptual core of RAG that's hardest to grasp abstractly ("text becomes numbers") — a visual, toy demonstration is high-value on its own even before vector DB/query stages exist.

**Independent Test**: Can be fully tested by opening the embedding page alone, entering different text snippets, and confirming the vector visualization changes in a way that reflects text similarity/difference, independent of any other stage.

**Acceptance Scenarios**:

1. **Given** the embedding page has loaded with a pre-filled sample sentence, **When** the page finishes loading, **Then** the learner immediately sees a visualized toy vector for that sentence (no blank state).
2. **Given** the embedding page is open, **When** the learner enters a new piece of text, **Then** a new toy vector is generated and visualized, and the explanation panel describes what the values represent.
3. **Given** two pieces of text with overlapping words/themes are entered one after another, **When** their resulting vectors are visualized, **Then** the vectors visibly resemble each other more than they resemble a vector for an unrelated piece of text.

---

### User Story 3 - Understand Vector Storage (Priority: P2)

As a learner, I want to see a small collection of embedded example sentences stored and plotted together, so I understand what a vector database conceptually holds and how new items get added to it.

**Why this priority**: This stage bridges embedding and querying; it's slightly less immediately intuitive than the first two stages but essential to complete the mental model before querying makes sense.

**Independent Test**: Can be fully tested by opening the vector DB page alone, viewing the pre-loaded example store plotted on a 2D chart, and adding a new example sentence to confirm it appears in both the list and the plot.

**Acceptance Scenarios**:

1. **Given** the vector DB page has loaded, **When** the page finishes loading, **Then** the learner sees several pre-loaded example sentences already embedded and plotted on a 2D visualization (no blank state).
2. **Given** the vector DB page is open, **When** the learner adds a new sentence via the input control, **Then** its toy embedding is computed, it is added to the visible store list, and a new point appears on the plot with a brief flash animation.
3. **Given** the vector DB page is open, **When** the learner hovers or selects a plotted point, **Then** the corresponding stored sentence and its coordinate values are highlighted.

---

### User Story 4 - Understand Querying & Retrieval (Priority: P1)

As a learner, I want to type a query and see it compared against the stored vectors, ranked by similarity, so I understand how RAG retrieves the most relevant chunks for a given question.

**Why this priority**: This is the payoff stage where chunking, embedding, and storage concepts combine into the actual "retrieval" behavior that defines RAG — it's the moment the overall concept should "click," making it equally critical to P1 despite depending conceptually on the earlier stages.

**Independent Test**: Can be fully tested by opening the query page alone (backed by its own default example store), entering a query, and confirming ranked, visually-highlighted similarity results appear — independently testable because the query page ships with its own self-contained example vector store rather than requiring live hand-off from the vector DB page.

**Acceptance Scenarios**:

1. **Given** the query page has loaded with a pre-filled sample query and default example store, **When** the page finishes loading, **Then** the learner immediately sees ranked similarity results and a highlighted plot (no blank state).
2. **Given** the query page is open, **When** the learner enters a new query, **Then** the query is embedded using the same toy method as other stages, compared against every stored vector, and results are re-ranked live by similarity score.
3. **Given** results are displayed, **When** the learner views the plot, **Then** the closest matches are visually connected/highlighted (e.g., a line or marker) distinguishing them from lower-ranked points, and each result shows its numeric similarity score.

---

### Edge Cases

- What happens when the chunking input text is shorter than the configured chunk size? → The system MUST treat the entire input as a single chunk rather than producing an empty or broken chunk.
- What happens when the embedding or query input field is left empty? → The system MUST leave the visualization in its last valid state and MUST NOT attempt to compute or display a vector for empty input.
- What happens when two different input texts happen to produce identical toy embeddings? → The system MUST still display both as valid, distinguishable entries (e.g., by label) even if their plotted points coincide.
- How does the system handle extremely long pasted text on the chunking page? → The system MUST still chunk and render the result without freezing the page (reasonable practical input lengths for a single learner pasting a paragraph or two, not entire books).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide four distinct stage pages — Chunking, Embedding, Vector DB, and Querying — each reachable from a shared navigation present on every page.
- **FR-002**: Each stage page MUST load with a pre-filled, sensible default example so the visualization is never blank on first view.
- **FR-003**: Each stage page MUST provide interactive controls appropriate to its concept (e.g., chunk size/overlap/strategy for Chunking; free-text input for Embedding and Querying; an "add example" control for Vector DB).
- **FR-004**: Each stage page MUST update its visualization immediately (on input, without a separate "submit" step) when a control value changes.
- **FR-005**: Each stage page MUST include a written explanation panel containing (a) a general description of the concept and (b) a short reactive note describing the effect of the learner's most recent interaction.
- **FR-006**: The system MUST use only simulated/toy computations for chunking, embedding generation, and similarity scoring — no real machine learning model, no external API calls, no network dependency for core functionality.
- **FR-007**: The toy embedding method MUST be deterministic and MUST produce more similar output for texts that share more words/themes than for unrelated texts, so similarity is visually demonstrable.
- **FR-008**: The Vector DB stage MUST visualize its stored example vectors on a 2-dimensional plot and MUST allow the learner to add a new example, updating both the visible list and the plot.
- **FR-009**: The Querying stage MUST compute similarity between a learner-entered query and every vector in its example store, then display results ranked from most to least similar with a visible numeric score per result.
- **FR-010**: The system MUST require no backend server, database, authentication, or build step — all four pages MUST function correctly when served as static files (including directly from the local filesystem or GitHub Pages).
- **FR-011**: The system MUST NOT persist any learner input or state between page loads or browser sessions; every page returns to its default example on reload.
- **FR-012**: All four stage pages MUST follow the same locked visual design direction (dark background, monospace typography, single accent color, flash-on-change feedback) so the site reads as one coherent product.

### Key Entities

- **Chunk**: A contiguous segment of source text produced by splitting according to a chosen strategy and settings; has content, a position/order, and a length.
- **Toy Embedding Vector**: A small, fixed-length numeric representation deterministically derived from a piece of text; used for both stored example sentences and learner-entered queries.
- **Vector Store Entry**: A pairing of original text and its toy embedding vector, held in an in-memory example collection for the Vector DB and Querying stages.
- **Similarity Result**: A ranked pairing of a query vector against a stored entry, carrying a numeric similarity score used for ordering and display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can go from opening any single stage page to seeing a meaningful, non-blank visualization in under 5 seconds, with no loading spinners or network waits.
- **SC-002**: A learner can observe a visible change in a stage's visualization and explanation text within 1 second of adjusting any control, with no page reload required.
- **SC-003**: A learner unfamiliar with RAG can, after going through all four stage pages once, correctly describe in their own words what each of the four stages does (self-assessed; validated by the explanation panels covering the "what" and "why" of each stage without external reference material).
- **SC-004**: The entire site works correctly when opened directly from a GitHub Pages URL with no console errors and no failed network requests for core functionality.
- **SC-005**: All four stage pages are reachable from one another in a single click via shared navigation.

## Assumptions

- Single user (the site's author), used for self-study; multi-user accounts, saved progress, and analytics are explicitly out of scope.
- "Real-time" means the browser updates the visualization synchronously in response to input events — not literal streaming from a live model or server.
- Toy embeddings are deliberately simplified (e.g., based on word/character statistics) and are not expected to match real embedding-model behavior beyond demonstrating that similar text yields similar vectors.
- The Vector DB and Querying stages each ship with their own small, hardcoded set of example sentences; the site does not need to pass live state between pages (each page is independently viewable and testable, consistent with User Story 4's independent test).
- Modern desktop browser usage is assumed; mobile responsiveness and offline/PWA support are not required for this version.
- No automated test suite is required given the single-user, static-content nature of the project; manual verification in-browser is sufficient.
