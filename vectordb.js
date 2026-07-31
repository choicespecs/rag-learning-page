/* Vector DB stage controller. Depends on toyEmbed() from ragmath.js.
   Ships its own example store, independent from query.js's store
   (see spec.md Assumptions). */

var STORE_TEXTS = [
  "The trail climbs steeply through pine forest before reaching the summit ridge.",
  "Pack enough water for a full day above the tree line.",
  "A sturdy pair of boots prevents blisters on long mountain descents.",
  "The function throws an exception when the array index is out of bounds.",
  "Refactoring the module reduced duplicate code across the test suite.",
  "A race condition appeared only when two threads wrote to the cache simultaneously.",
];

var EXPLANATION_PARAGRAPHS = [
  "A vector database stores embedded items so the closest ones to any new " +
  "vector can be found quickly later. Each row below is one stored item — " +
  "its original text plus the toy vector computed from it. Add your own " +
  "sentence and watch it join the plot as a new point, positioned near " +
  "whichever existing entries it shares the most words with.",

  { heading: "Vector DB vs. Regular Database" },

  "A regular database (like SQL) is built to answer questions like \"find " +
  "the row where id = 5\" — it uses indexes that rely on exact matches or " +
  "sortable ranges. There's no way to ask a SQL table \"find me the rows " +
  "most similar to this one,\" because similarity isn't something a normal " +
  "index understands. A vector database exists specifically to answer " +
  "that question: given a new vector, which stored vectors are closest to " +
  "it?",

  { heading: "How Real Vector Databases Search At Scale" },

  "At small scale, finding the closest vectors just means checking every " +
  "stored point directly — exactly what happens here and on the Querying " +
  "page. Real vector databases holding millions of entries can't check " +
  "everything one by one, so nearly all of them rely on a specific kind " +
  "of graph-based index built for this exact problem.",

  "The most common one is called HNSW — Hierarchical Navigable Small " +
  "World — used under the hood by Pinecone, Weaviate, FAISS, and most " +
  "other production vector databases. Picture a multi-layer graph " +
  "connecting every stored vector as a node: the top layer has very few " +
  "nodes with long-range connections, like a highway system that lets " +
  "you jump across the vector space quickly; each layer below adds more " +
  "nodes with shorter, denser connections, like local streets for " +
  "fine-grained navigation.",

  "To search, you start at the sparse top layer and greedily hop to " +
  "whichever connected neighbor is closest to your query vector, then " +
  "drop down a layer and repeat with finer resolution — highway to get " +
  "in the right neighborhood fast, then local streets to pinpoint the " +
  "closest match. This finds approximately the nearest vectors in " +
  "roughly logarithmic time, instead of checking every stored vector one " +
  "by one.",

  "That \"approximately\" is the actual trade being made: HNSW gives up a " +
  "small amount of accuracy for a large amount of speed, which is worth " +
  "it once you're searching millions of vectors, but is completely " +
  "unnecessary for the handful of examples in this demo — so this page " +
  "(and the Querying page) intentionally stays brute-force, comparing " +
  "against every point directly instead.",
];

var store = STORE_TEXTS.map(function (text, i) {
  return { id: "e" + i, label: text, vector: toyEmbed(text) };
});
var nextId = store.length;
var selectedId = null;

var els = {
  addInput: document.getElementById("add-input"),
  addButton: document.getElementById("add-button"),
  canvas: document.getElementById("plot"),
  plotHint: document.getElementById("plot-hint"),
  entryList: document.getElementById("entry-list"),
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

function drawPlot(justAddedId) {
  var w = els.canvas.width;
  var h = els.canvas.height;
  var border = cssVar("--border");
  var accent = cssVar("--accent");
  var textSecondary = cssVar("--text-secondary");

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  store.forEach(function (entry) {
    var isSelected = entry.id === selectedId;
    var pos = toCanvasXY(entry.vector);
    ctx.fillStyle = isSelected ? accent : textSecondary;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isSelected ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "11px " + cssVar("--font-mono");
    var label = entry.label.length > 16 ? entry.label.slice(0, 16) + "…" : entry.label;
    ctx.fillText(label, pos.x + 8, pos.y - 8);
  });

  if (justAddedId) {
    // brief accent ring around the newly added point to draw the eye to it
    var added = store.find(function (e) { return e.id === justAddedId; });
    var pos = toCanvasXY(added.vector);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function renderList(flashId) {
  els.entryList.innerHTML = "";
  store.forEach(function (entry) {
    var li = document.createElement("li");
    li.className = (entry.id === selectedId ? "selected" : "") + (entry.id === flashId ? " flash" : "");
    li.dataset.id = entry.id;

    var label = document.createElement("span");
    label.textContent = entry.label;

    var coords = document.createElement("span");
    coords.className = "coords";
    coords.textContent = "(" + entry.vector.x.toFixed(2) + ", " + entry.vector.y.toFixed(2) + ")";

    li.appendChild(label);
    li.appendChild(coords);
    li.addEventListener("click", function () {
      selectedId = entry.id;
      renderList();
      drawPlot();
    });
    els.entryList.appendChild(li);
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

function render(reactiveMessage, flashId) {
  drawPlot(flashId);
  renderList(flashId);
  setParagraphs(els.explanationGeneral, EXPLANATION_PARAGRAPHS);
  els.explanationReactive.textContent = reactiveMessage || "";
}

function findNearestEntry(canvasX, canvasY) {
  var nearest = null;
  var nearestDist = Infinity;
  store.forEach(function (entry) {
    var pos = toCanvasXY(entry.vector);
    var dist = Math.hypot(pos.x - canvasX, pos.y - canvasY);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = entry;
    }
  });
  return nearestDist <= 12 ? nearest : null;
}

function canvasCoordsFromEvent(evt) {
  var rect = els.canvas.getBoundingClientRect();
  var scaleX = els.canvas.width / rect.width;
  var scaleY = els.canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

els.canvas.addEventListener("mousemove", function (evt) {
  var pos = canvasCoordsFromEvent(evt);
  var hit = findNearestEntry(pos.x, pos.y);
  els.canvas.style.cursor = hit ? "pointer" : "default";
  if (hit) {
    els.plotHint.textContent = hit.label + " · (" + hit.vector.x.toFixed(2) + ", " + hit.vector.y.toFixed(2) + ")";
  } else {
    els.plotHint.textContent = "hover or click a point to inspect it";
  }
});

els.canvas.addEventListener("click", function (evt) {
  var pos = canvasCoordsFromEvent(evt);
  var hit = findNearestEntry(pos.x, pos.y);
  if (hit) {
    selectedId = hit.id;
    renderList();
    drawPlot();
  }
});

function addEntry() {
  var text = els.addInput.value.trim();
  var vector = toyEmbed(text);
  if (!vector) return; // empty input: no-op

  var entry = { id: "e" + nextId, label: text, vector: vector };
  nextId++;
  store.push(entry);
  selectedId = entry.id;
  els.addInput.value = "";

  render(
    "\"" + entry.label + "\" was embedded and added to the store — its position on the plot " +
    "reflects which existing entries it shares the most words with.",
    entry.id
  );
}

els.addButton.addEventListener("click", addEntry);
els.addInput.addEventListener("keydown", function (evt) {
  if (evt.key === "Enter") addEntry();
});

// Initial state: pre-loaded store, non-blank plot, no flash on first paint.
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
