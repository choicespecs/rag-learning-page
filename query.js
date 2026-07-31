/* Querying stage controller. Depends on toyEmbed() and rankBySimilarity()
   from ragmath.js. Ships its own example store, independent from
   vectordb.js's store, so this page is fully testable on its own
   (see spec.md Assumptions). */

var SAMPLE_QUERY = "What ingredients make a good pasta sauce?";

var STORE_TEXTS = [
  "Simmer the tomato sauce for twenty minutes before adding fresh basil.",
  "A pinch of salt brings out the sweetness in roasted vegetables.",
  "Whisk the eggs until they turn pale and fluffy for a soft omelette.",
  "The rocket's second stage ignited moments after separating from the booster.",
  "Astronauts aboard the station conducted a six hour spacewalk to repair solar panels.",
  "Mission control tracked the satellite as it settled into low earth orbit.",
];

var EXPLANATION_PARAGRAPHS = [
  "This is retrieval — the step that gives RAG its name. Your query gets " +
  "embedded into a vector the same way every stored sentence was, then " +
  "compared against every stored vector, and the results are ranked from " +
  "most to least similar.",

  { heading: "Why Angle, Not Distance?" },

  "The comparison is cosine similarity — it measures the angle between " +
  "two vectors rather than the distance between them: cos(θ) = (A · B) / " +
  "(|A| × |B|). The result ranges from 1 (pointing the same direction, " +
  "maximally similar) through 0 (unrelated) to −1 (opposite directions).",

  "A vector's magnitude — how far it sits from the origin — is easy to " +
  "inflate for reasons that have nothing to do with topic: a longer " +
  "document, a sentence that repeats itself, or words that just happen to " +
  "occur more often all push a vector's raw size up without changing what " +
  "it's actually about. If similarity were based on raw distance, a short " +
  "sentence and a much longer, more repetitive version of that exact same " +
  "sentence would come out looking completely dissimilar, even though " +
  "they mean the same thing.",

  "Concretely: say a cooking-related sentence produces the vector (3, 4), " +
  "and a longer, three-times-repeated version of it produces (9, 12) — " +
  "same direction, three times the magnitude. Euclidean distance between " +
  "them is 10, which looks huge. But cosine similarity is (3×9 + 4×12) / " +
  "(5 × 15) = 75 / 75 = 1.0 — perfectly similar, because both vectors " +
  "point along the exact same ray from the origin; one just sits further " +
  "out along it.",

  "That's the general rule: multiplying a vector by any positive number " +
  "moves the point further along the same ray without changing its " +
  "direction. Cosine similarity measures only that direction and " +
  "deliberately ignores how far out along it a point happens to sit — " +
  "exactly the property retrieval needs, since a chunk shouldn't be judged " +
  "more or less relevant just because it happens to be longer or repeats " +
  "itself more. This is why cosine similarity has been the default " +
  "metric in information retrieval and NLP for decades, back to the " +
  "earliest search-engine vector-space models, where documents of wildly " +
  "different lengths still had to be compared fairly by topic rather than " +
  "by size.",

  { heading: "The Full RAG Pipeline" },

  "Zoom out and this page is the second half of a two-phase pipeline. " +
  "Phase 1 (indexing) happens once, ahead of time: documents get chunked, " +
  "each chunk gets embedded, and every (text, vector) pair gets stored — " +
  "that's the Chunking, Embedding, and Vector DB stages. Phase 2 (query " +
  "time) happens every time someone asks a question: the question gets " +
  "embedded, the nearest stored chunks get retrieved — this page — and " +
  "then, in a real system, the original text of those top-ranked chunks " +
  "gets inserted into a prompt alongside the question and sent to a " +
  "language model, which generates its answer grounded in that retrieved " +
  "text instead of only what it memorized during training. This page " +
  "stops right before that last generation step, since it would require " +
  "a real model rather than the toy math used everywhere else here.",
];

var store = STORE_TEXTS.map(function (text, i) {
  return { id: "e" + i, label: text, vector: toyEmbed(text) };
});

var els = {
  input: document.getElementById("query-input"),
  canvas: document.getElementById("plot"),
  resultsList: document.getElementById("results-list"),
  explanationGeneral: document.getElementById("explanation-general"),
  explanationReactive: document.getElementById("explanation-reactive"),
};

var ctx = els.canvas.getContext("2d");

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toCanvasXY(vector) {
  var w = els.canvas.width;
  var h = els.canvas.height;
  var margin = 24;
  return {
    x: w / 2 + vector.x * (w / 2 - margin),
    y: h / 2 - vector.y * (h / 2 - margin),
  };
}

function drawPlot(queryVector, results) {
  var w = els.canvas.width;
  var h = els.canvas.height;
  var border = cssVar("--border");
  var accent = cssVar("--accent");
  var textSecondary = cssVar("--text-secondary");
  var scoreById = {};
  results.forEach(function (r) { scoreById[r.entryId] = r; });

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  var queryPos = queryVector ? toCanvasXY(queryVector) : null;

  // Dashed connector from the query to the top-ranked match only.
  if (queryPos) {
    var top = results.find(function (r) { return r.rank === 1; });
    if (top) {
      var topEntry = store.find(function (e) { return e.id === top.entryId; });
      var topPos = toCanvasXY(topEntry.vector);
      ctx.strokeStyle = accent;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(queryPos.x, queryPos.y);
      ctx.lineTo(topPos.x, topPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  store.forEach(function (entry) {
    var result = scoreById[entry.id];
    var isTop = result && result.rank === 1;
    var pos = toCanvasXY(entry.vector);
    ctx.fillStyle = isTop ? accent : textSecondary;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isTop ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "11px " + cssVar("--font-mono");
    var label = entry.label.length > 16 ? entry.label.slice(0, 16) + "…" : entry.label;
    ctx.fillText(label, pos.x + 8, pos.y - 8);
  });

  if (queryPos) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(queryPos.x, queryPos.y - 7);
    ctx.lineTo(queryPos.x - 6, queryPos.y + 5);
    ctx.lineTo(queryPos.x + 6, queryPos.y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.font = "11px " + cssVar("--font-mono");
    ctx.fillText("query", queryPos.x + 8, queryPos.y - 8);
  }
}

function renderResults(results, flash) {
  els.resultsList.innerHTML = "";
  results.forEach(function (result) {
    var entry = store.find(function (e) { return e.id === result.entryId; });
    var li = document.createElement("li");
    li.className = "rank-" + result.rank + (flash ? " flash" : "");

    var label = document.createElement("span");
    label.textContent = result.rank + ". " + entry.label;

    var score = document.createElement("span");
    score.className = "score";
    score.textContent = result.score.toFixed(3);

    li.appendChild(label);
    li.appendChild(score);
    els.resultsList.appendChild(li);
  });
}

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

function render(reactiveMessage, flash) {
  var text = els.input.value;
  var queryVector = toyEmbed(text);

  var results = queryVector ? rankBySimilarity(queryVector, store) : [];
  drawPlot(queryVector, results);
  renderResults(results, flash);

  setParagraphs(els.explanationGeneral, EXPLANATION_PARAGRAPHS);
  els.explanationReactive.textContent = reactiveMessage || "";
}

els.input.addEventListener("input", function () {
  var text = els.input.value;
  var queryVector = toyEmbed(text);
  if (!queryVector) return; // empty input: leave last valid state as-is

  var results = rankBySimilarity(queryVector, store);
  var top = results.find(function (r) { return r.rank === 1; });
  var topEntry = store.find(function (e) { return e.id === top.entryId; });

  render(
    "top match: \"" + topEntry.label + "\" (score " + top.score.toFixed(3) + ") — " +
    "everything below it is ranked by how closely its vector points in the same direction as your query's.",
    true
  );
});

// Initial state: pre-filled sample query, no blank results, no flash on first paint.
els.input.value = SAMPLE_QUERY;
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
