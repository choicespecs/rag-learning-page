/* Chunking stage controller. Depends on chunkText() from ragmath.js. */

var SAMPLE_TEXT =
  "Retrieval-Augmented Generation lets a language model answer questions " +
  "using your own documents instead of only what it memorized during " +
  "training. Before any of that can happen, the source text has to be " +
  "split into smaller pieces called chunks. Chunking is the very first " +
  "step in the pipeline, and the settings you choose here shape " +
  "everything that happens afterward.";

var STRATEGY_DESCRIPTIONS = {
  fixed:
    "Fixed-size chunking cuts the text every N characters, regardless of " +
    "where sentences or ideas begin and end. It's simple and predictable, " +
    "but a clean cut can slice a sentence in half — which is what the " +
    "overlap setting exists to soften.",
  sentence:
    "Sentence-based chunking never cuts inside a sentence — it groups " +
    "whole sentences together until adding one more would exceed the " +
    "target size. This keeps each chunk semantically coherent, at the " +
    "cost of less predictable chunk lengths.",
};

var OVERLAP_MECHANICS = {
  fixed:
    "Overlap works by advancing less than a full chunk size each step: " +
    "step = size − overlap. With size 120 and overlap 20, each chunk " +
    "starts only 100 characters after the previous one, so the last 20 " +
    "characters of one chunk repeat as the first 20 of the next — that " +
    "repeated slice is what carries context across the cut.",
  sentence:
    "Sentence mode can't repeat \"part of\" a sentence, so overlap here is " +
    "closer to on/off: turning it on repeats the previous chunk's entire " +
    "last sentence as the first sentence of the next chunk, rather than a " +
    "fixed character count.",
};

var TRADEOFFS_PARAGRAPH =
  "Both size and overlap are tradeoffs, not settings to maximize. Bigger " +
  "chunks keep more context together but blend several ideas into one " +
  "embedding, which hurts retrieval precision; smaller chunks are more " +
  "focused but risk losing surrounding context and cost more to store. " +
  "More overlap protects against an idea being split awkwardly at a " +
  "boundary, at the cost of redundant, repeated content between chunks. " +
  "Most real pipelines use just enough overlap — commonly 10–20% of " +
  "chunk size — to avoid clean cuts, not the maximum available.";

var REAL_WORLD_NOTE =
  "In a real pipeline, chunk size and overlap are configuration values " +
  "decided once, ahead of time, by whoever builds the system — not " +
  "something recalculated per document. The sliders here stand in for " +
  "that upfront decision.";

var OTHER_STRATEGIES_PARAGRAPHS = [
  "Real pipelines use several other approaches beyond the two here. " +
  "Recursive (or hierarchical) chunking tries a list of separators in " +
  "priority order — paragraph breaks, then line breaks, then sentences, " +
  "then words — falling back to a coarser split only when a piece is " +
  "still too big, so it respects document structure whenever it can. " +
  "Semantic chunking embeds adjacent sentences and splits wherever their " +
  "similarity drops sharply, treating a topic shift as the natural chunk " +
  "boundary instead of a fixed rule. Token-based chunking is fixed-size " +
  "chunking's cousin — it counts by the tokens a language model actually " +
  "processes rather than raw characters, which matters because context " +
  "windows and API costs are both measured in tokens, not characters. " +
  "Structure-aware chunking splits along a document's own markup — " +
  "markdown headers, HTML tags, or code function/class boundaries — so " +
  "chunks align with logical sections rather than an arbitrary character " +
  "count.",

  "This page sticks to fixed-size and sentence-based because they're the " +
  "simplest two to demonstrate directly: fixed-size shows the raw " +
  "mechanics of overlap and boundary cuts, and sentence-based shows what " +
  "changes once a strategy respects structure. The others build on the " +
  "same core idea — decide where a \"good enough\" boundary is — just " +
  "with smarter, and more expensive, rules for finding it.",
];

function setParagraphs(container, items) {
  container.innerHTML = "";
  items.forEach(function (item) {
    if (item && typeof item === "object" && item.heading) {
      var h = document.createElement("h3");
      h.textContent = item.heading;
      container.appendChild(h);
    } else {
      var p = document.createElement("p");
      p.textContent = item;
      container.appendChild(p);
    }
  });
}

var els = {
  input: document.getElementById("input-text"),
  strategy: document.getElementById("strategy"),
  size: document.getElementById("size"),
  sizeValue: document.getElementById("size-value"),
  overlap: document.getElementById("overlap"),
  overlapValue: document.getElementById("overlap-value"),
  overlapUnit: document.getElementById("overlap-unit"),
  chunkList: document.getElementById("chunk-list"),
  summary: document.getElementById("chunk-summary"),
  explanationGeneral: document.getElementById("explanation-general"),
  explanationReactive: document.getElementById("explanation-reactive"),
};

var hasInteracted = false;

function clampOverlap() {
  // overlap must stay below size or the step in chunkFixed() would stall.
  var size = Number(els.size.value);
  var maxOverlap = Math.max(0, size - 5);
  els.overlap.max = maxOverlap;
  if (Number(els.overlap.value) > maxOverlap) {
    els.overlap.value = maxOverlap;
  }
}

function render(reactiveMessage) {
  var text = els.input.value;
  var strategy = els.strategy.value;
  var size = Number(els.size.value);
  var overlap = Number(els.overlap.value);

  els.sizeValue.textContent = size;
  if (strategy === "sentence") {
    // Sentence mode repeats a whole sentence, not a character count — the
    // slider still drives it, but display it as on/off so the label stays
    // honest about what's actually happening (see chunkBySentence()).
    els.overlapValue.textContent = overlap > 0 ? "ON" : "OFF";
    els.overlapUnit.textContent = overlap > 0
      ? "(repeats the last sentence of the previous chunk)"
      : "(no repeated content between chunks)";
  } else {
    els.overlapValue.textContent = overlap;
    els.overlapUnit.textContent = "characters";
  }

  var chunks = chunkText(text, { strategy: strategy, size: size, overlap: overlap });

  els.chunkList.innerHTML = "";
  chunks.forEach(function (chunk) {
    var block = document.createElement("div");
    block.className = "chunk-block" + (hasInteracted ? " flash" : "");
    var label = document.createElement("span");
    label.className = "chunk-label";
    label.textContent = "chunk_" + String(chunk.index + 1).padStart(2, "0") + " · " + chunk.length + " chars";
    block.appendChild(label);
    block.appendChild(document.createTextNode(chunk.text));
    els.chunkList.appendChild(block);
  });

  var avgLen = chunks.length > 0
    ? Math.round(chunks.reduce(function (sum, c) { return sum + c.length; }, 0) / chunks.length)
    : 0;
  els.summary.textContent = chunks.length + " chunks generated · avg len " + avgLen + " chars";

  setParagraphs(els.explanationGeneral, [
    STRATEGY_DESCRIPTIONS[strategy],
    { heading: "Overlap Mechanics" },
    OVERLAP_MECHANICS[strategy],
    { heading: "Size & Overlap Tradeoffs" },
    TRADEOFFS_PARAGRAPH,
    REAL_WORLD_NOTE,
    { heading: "Other Chunking Strategies" },
    OTHER_STRATEGIES_PARAGRAPHS[0],
    OTHER_STRATEGIES_PARAGRAPHS[1],
  ]);
  els.explanationReactive.textContent = reactiveMessage || "";
}

function onControlChange(reactiveMessage) {
  hasInteracted = true;
  clampOverlap();
  render(reactiveMessage);
}

els.input.addEventListener("input", function () {
  onControlChange("you edited the input text — chunks were recomputed from the new content.");
});

els.strategy.addEventListener("change", function () {
  var label = els.strategy.options[els.strategy.selectedIndex].text;
  onControlChange("you switched strategy to " + label + " — notice how the chunk boundaries move.");
});

els.size.addEventListener("input", function () {
  onControlChange(
    "you set chunk size to " + els.size.value + " characters — " +
    "smaller sizes produce more, more-focused chunks; larger sizes produce fewer, broader ones."
  );
});

els.overlap.addEventListener("input", function () {
  var message = els.strategy.value === "sentence"
    ? (Number(els.overlap.value) > 0
        ? "overlap is now on — each chunk after the first repeats the previous chunk's last sentence in full, since sentence mode can't split mid-sentence."
        : "overlap is now off — chunks share no repeated content, so a sentence could feel abrupt right at a chunk boundary.")
    : "you set overlap to " + els.overlap.value + " characters — " +
      "each chunk after the first now repeats that much of the previous chunk's tail to preserve boundary context.";
  onControlChange(message);
});

// Initial state: pre-filled sample, no blank view, no flash on first paint.
els.input.value = SAMPLE_TEXT;
els.strategy.value = "fixed";
els.size.value = 120;
els.overlap.value = 20;
clampOverlap();
render("");

// Explanation panel collapse toggle.
var explanationToggle = document.getElementById("explanation-toggle");
var explanationBody = document.getElementById("explanation-body");
var toggleIndicator = document.getElementById("toggle-indicator");
explanationToggle.addEventListener("click", function () {
  var collapsed = explanationBody.classList.toggle("collapsed");
  toggleIndicator.textContent = collapsed ? "[+]" : "[-]";
  explanationToggle.setAttribute("aria-expanded", String(!collapsed));
});
