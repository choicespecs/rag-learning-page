/* Embedding stage controller. Depends on toyEmbed() from ragmath.js. */

var SAMPLE_TEXT = "The cat sat on the warm windowsill in the afternoon sun.";

var EXPLANATION_CONTENT = [
  "A vector is just an ordered list of numbers that marks a point in " +
  "space — the same idea as a coordinate pair like (3, 5) on a graph. " +
  "Embedding is the process of turning a piece of text into that kind of " +
  "point: the model reads the text and outputs a list of numbers, where " +
  "each number captures some measurable property of it.",

  "Here, each vector has just 2 numbers (x, y) so it can be plotted " +
  "directly on the chart below; real embedding models use hundreds or " +
  "thousands of numbers, but the idea is identical — distance or angle " +
  "between two points becomes a stand-in for \"how related are these two " +
  "pieces of text.\" Type a sentence and pause for a moment: your current " +
  "vector is the bright point, and each sentence you settle on joins the " +
  "dimmer points behind it, so you can watch related sentences land near " +
  "each other while unrelated ones land far apart.",

  { heading: "Preprocessing: Tokenize & Filter (Shown Below)" },

  "Before any vector math happens, the text below goes through two " +
  "preprocessing steps you can watch happen live: it's lowercased and " +
  "split into words — a simplified stand-in for real tokenization, which " +
  "splits into subword pieces rather than whole words. Then common " +
  "function words (\"the,\" \"a,\" \"is,\" ...) get filtered out, shown " +
  "crossed out below, since they carry little topical meaning and would " +
  "otherwise crowd out the words that actually distinguish one sentence " +
  "from another. Only the remaining, bordered words get hashed into the " +
  "vector further down — tokenization and embedding are genuinely " +
  "separate steps; this is what tokenization's output looks like just " +
  "before embedding takes over.",

  { heading: "How Real Models Actually Do It" },

  "A real model doesn't hash words — it tokenizes the sentence into " +
  "subword pieces (\"chunking\" might become \"chunk\" + \"##ing\"), looks " +
  "up a starting vector for each token, then runs them through attention " +
  "layers where every token's vector gets adjusted based on the other " +
  "tokens around it. That's why the same word gets a different vector " +
  "depending on context — \"bank\" near \"river\" ends up somewhere " +
  "different than \"bank\" near \"money.\" The per-token vectors are then " +
  "pooled (often averaged) into one fixed-length sentence vector — " +
  "typically 384 to 1536 numbers, not 2.",

  { heading: "Ideas For Embedding A Sentence — A Brief History" },

  "Bag-of-words / TF-IDF: count which words appear; sparse and huge, " +
  "with no sense of word order or meaning (the closest ancestor to what " +
  "this toy page does). Word2Vec / GloVe: dense vectors per word, learned " +
  "so similar words land nearby; early sentence vectors were just the " +
  "average of word vectors, which throws away word order. RNN/LSTM " +
  "encoders: read the sentence in order and use the final hidden state, " +
  "capturing order but struggling with long sentences. Transformers " +
  "(BERT and descendants): attention lets every word see every other " +
  "word at once, producing much richer context. Purpose-built sentence " +
  "embedders (Sentence-BERT, OpenAI's embedding models): trained with a " +
  "contrastive objective — shown pairs of similar and dissimilar " +
  "sentences, and adjusted until similar pairs score high cosine " +
  "similarity and dissimilar pairs score low. That's the exact property " +
  "our toy method fakes by hashing shared words instead of learning it " +
  "from data.",

  { heading: "Our Toy Version, By Comparison" },

  "Our toy method compares literal shared words, not true meaning, so a " +
  "same-topic sentence using entirely different words may not cluster the " +
  "way a real model would — real embedding models are trained on huge " +
  "amounts of text and learn to place synonyms and related concepts near " +
  "each other even without shared words, which this toy version can't do.",
];

var MAX_COMMITTED = 5;
var COMMIT_DELAY_MS = 800;

var committed = []; // past, settled entries — drawn dim
var live = null;    // the currently-typed entry — drawn as the accent point
var commitTimer = null;

var els = {
  input: document.getElementById("input-text"),
  canvas: document.getElementById("plot"),
  tokenList: document.getElementById("token-list"),
  tokenSummary: document.getElementById("token-summary"),
  coordReadout: document.getElementById("coord-readout"),
  barReadout: document.getElementById("bar-readout"),
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

function drawPoint(entry, isCurrent) {
  var accent = cssVar("--accent");
  var textSecondary = cssVar("--text-secondary");
  var pos = toCanvasXY(entry.vector);

  ctx.fillStyle = isCurrent ? accent : textSecondary;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, isCurrent ? 6 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "11px " + cssVar("--font-mono");
  var label = entry.text.length > 18 ? entry.text.slice(0, 18) + "…" : entry.text;
  ctx.fillText(label, pos.x + 8, pos.y - 8);
}

function drawPlot() {
  var w = els.canvas.width;
  var h = els.canvas.height;
  var border = cssVar("--border");

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  committed.forEach(function (entry) { drawPoint(entry, false); });
  if (live) drawPoint(live, true);
}

function renderBar(dimLabel, value) {
  var row = document.createElement("div");
  row.className = "bar-row";

  var dim = document.createElement("span");
  dim.className = "bar-dim";
  dim.textContent = dimLabel;

  var track = document.createElement("div");
  track.className = "bar-track";
  var zero = document.createElement("div");
  zero.className = "bar-zero";
  track.appendChild(zero);

  var fill = document.createElement("div");
  fill.className = "bar-fill";
  var pct = Math.min(1, Math.abs(value)) * 50;
  if (value >= 0) {
    fill.style.left = "50%";
    fill.style.width = pct + "%";
  } else {
    fill.style.left = (50 - pct) + "%";
    fill.style.width = pct + "%";
  }
  track.appendChild(fill);

  var valueEl = document.createElement("span");
  valueEl.className = "bar-value";
  valueEl.textContent = value.toFixed(3);

  row.appendChild(dim);
  row.appendChild(track);
  row.appendChild(valueEl);
  return row;
}

function renderTokens(text) {
  var tokens = previewTokens(text);
  els.tokenList.innerHTML = "";
  tokens.forEach(function (t) {
    var chip = document.createElement("span");
    chip.className = "token-chip " + (t.kept ? "kept" : "removed");
    chip.textContent = t.word;
    els.tokenList.appendChild(chip);
  });
  var keptCount = tokens.filter(function (t) { return t.kept; }).length;
  els.tokenSummary.textContent =
    tokens.length + " words tokenized · " + keptCount + " kept · " +
    (tokens.length - keptCount) + " filtered as low-signal";
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
  drawPlot();

  if (live) {
    renderTokens(live.text);
    els.coordReadout.textContent = "vector = (" + live.vector.x.toFixed(3) + ", " + live.vector.y.toFixed(3) + ")";
    els.barReadout.innerHTML = "";
    els.barReadout.appendChild(renderBar("x", live.vector.x));
    els.barReadout.appendChild(renderBar("y", live.vector.y));
    if (flash) {
      els.barReadout.classList.remove("flash");
      void els.barReadout.offsetWidth; // restart animation
      els.barReadout.classList.add("flash");
    }
  }

  setParagraphs(els.explanationGeneral, EXPLANATION_CONTENT);
  els.explanationReactive.textContent = reactiveMessage || "";
}

function commitLive() {
  if (!live) return;
  var lastCommitted = committed[committed.length - 1];
  if (lastCommitted && lastCommitted.text === live.text) return; // no-op, nothing new to settle
  committed.push({ text: live.text, vector: live.vector });
  if (committed.length > MAX_COMMITTED) committed.shift();
  drawPlot();
}

function onInputChange() {
  var text = els.input.value;
  var vector = toyEmbed(text);

  if (commitTimer) clearTimeout(commitTimer);

  if (!vector) {
    // Empty/whitespace input: leave the last valid visualization as-is.
    return;
  }

  live = { text: text, vector: vector };
  render(
    "this text's vector is currently at (" + vector.x.toFixed(2) + ", " + vector.y.toFixed(2) +
    ") — compare its position to the dimmer points behind it: shared words pull points together, unrelated words push them apart. Pause typing for a moment to lock this point in.",
    true
  );

  commitTimer = setTimeout(commitLive, COMMIT_DELAY_MS);
}

els.input.addEventListener("input", onInputChange);

// Initial state: pre-filled sample, no blank plot, no flash on first paint.
els.input.value = SAMPLE_TEXT;
live = { text: SAMPLE_TEXT, vector: toyEmbed(SAMPLE_TEXT) };
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
