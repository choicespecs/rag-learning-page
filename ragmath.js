/* ===========================================================
   ragmath.js — shared toy math for the RAG Learning Page.
   Loaded via a plain <script> tag before each stage's own
   controller script. No modules, no build step (Constitution I).
   All functions here are deterministic toy implementations
   (Constitution II) — see specs/001-rag-learning-page/research.md
   and contracts/ragmath.md for the reasoning behind each one.
   =========================================================== */

// ---------- Chunking ----------

function chunkText(text, options) {
  const opts = options || {};
  const strategy = opts.strategy || "fixed";
  const size = opts.size || 100;
  const overlap = opts.overlap || 0;

  if (!text || text.trim().length === 0) return [];

  if (strategy === "sentence") {
    return chunkBySentence(text, size, overlap);
  }
  return chunkFixed(text, size, overlap);
}

function chunkFixed(text, size, overlap) {
  // step < 1 would loop forever, so it's clamped defensively even though
  // the UI is expected to keep overlap < size (see contracts/ragmath.md).
  const step = Math.max(1, size - overlap);
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const chunkStr = text.slice(start, end);
    chunks.push({
      index: index,
      text: chunkStr,
      startOffset: start,
      length: chunkStr.length,
    });
    index++;
    if (end >= text.length) break;
    start += step;
  }

  return chunks;
}

function splitSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return matches.map(function (s) { return s.trim(); }).filter(Boolean);
}

function chunkBySentence(text, targetSize, overlap) {
  const sentences = splitSentences(text);
  const groups = [];
  let current = [];
  let currentLen = 0;

  sentences.forEach(function (sentence) {
    const addLen = sentence.length + (current.length > 0 ? 1 : 0);
    if (current.length > 0 && currentLen + addLen > targetSize) {
      groups.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(sentence);
    currentLen += sentence.length + (current.length > 1 ? 1 : 0);
  });
  if (current.length > 0) groups.push(current);

  // Overlap for sentence mode: repeat the previous group's last sentence
  // as the first sentence of the next group, instead of a character count.
  if (overlap > 0) {
    for (let i = groups.length - 1; i > 0; i--) {
      const prevLast = groups[i - 1][groups[i - 1].length - 1];
      groups[i] = [prevLast].concat(groups[i]);
    }
  }

  let searchFrom = 0;
  return groups.map(function (group, index) {
    const chunkStr = group.join(" ");
    let startOffset = text.indexOf(group[0], searchFrom);
    if (startOffset === -1) startOffset = Math.max(0, searchFrom);
    searchFrom = startOffset + group[0].length;
    return {
      index: index,
      text: chunkStr,
      startOffset: startOffset,
      length: chunkStr.length,
    };
  });
}

// ---------- Embedding ----------

function hashWord(word) {
  // djb2 string hash, kept as an unsigned 32-bit int.
  let hash = 5381;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) + hash + word.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Common function words carry little topical meaning and, since they recur
// across unrelated sentences, would otherwise dilute the clustering effect
// below. Filtering them out lets shared content words dominate the average.
var STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "on", "in", "of", "and",
  "to", "for", "at", "by", "from", "into", "this", "that", "it", "as",
  "be", "with", "or", "but", "if", "then", "so", "than", "too", "very",
  "can", "will", "just", "not", "no", "do", "does", "did", "has", "have",
]);

function meaningfulWords(words) {
  var filtered = words.filter(function (w) { return !STOPWORDS.has(w); });
  return filtered.length > 0 ? filtered : words;
}

// Exposes toyEmbed()'s preprocessing steps (lowercase + word-split, then
// stopword filtering) for display, without duplicating that logic. Each
// word is tagged with whether it actually gets hashed into the embedding —
// mirrors meaningfulWords()'s all-stopword fallback, where every word is
// kept if filtering would otherwise leave nothing.
function previewTokens(text) {
  if (!text || text.trim().length === 0) return [];
  var allWords = text.toLowerCase().match(/[a-z0-9]+/g);
  if (!allWords || allWords.length === 0) return [];
  var kept = meaningfulWords(allWords);
  var fallbackTriggered = kept === allWords;
  return allWords.map(function (word) {
    return { word: word, kept: fallbackTriggered || !STOPWORDS.has(word) };
  });
}

// Feature-hashing bucket count. A 2D vector alone (bucket = angle-per-word,
// averaged) turned out too noisy to rank partial word overlap reliably —
// a couple of unrelated words can average out to nearly the same point as
// a couple of shared ones. 256 buckets gives similarity real resolution;
// see research.md's "Toy embedding algorithm" decision for the measurements
// that led here. `x`/`y` (below) are a fixed projection of these buckets
// used only for plotting — cosineSimilarity() compares the buckets directly.
const EMBED_DIMS = 256;

function toyEmbed(text) {
  if (!text || text.trim().length === 0) return null;

  const allWords = text.toLowerCase().match(/[a-z0-9]+/g);
  if (!allWords || allWords.length === 0) return null;
  const words = meaningfulWords(allWords);

  const dims = new Array(EMBED_DIMS).fill(0);
  words.forEach(function (word) {
    dims[hashWord(word) % EMBED_DIMS] += 1;
  });
  const norm = Math.sqrt(dims.reduce(function (sum, v) { return sum + v * v; }, 0)) || 1;
  const normalized = dims.map(function (v) { return v / norm; });

  // Project the bucket histogram onto 2D by placing each bucket at an
  // evenly spaced angle around a circle and summing its (weighted) point —
  // a deterministic stand-in for the PCA/t-SNE step a real system would use
  // to visualize high-dimensional embeddings in 2D.
  let x = 0;
  let y = 0;
  normalized.forEach(function (value, i) {
    const angle = (i * (360 / EMBED_DIMS)) * (Math.PI / 180);
    x += value * Math.cos(angle);
    y += value * Math.sin(angle);
  });

  return { x: x, y: y, dims: normalized, sourceText: text };
}

// ---------- Similarity ----------

function cosineSimilarity(vectorA, vectorB) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vectorA.dims.length; i++) {
    dot += vectorA.dims[i] * vectorB.dims[i];
    magA += vectorA.dims[i] * vectorA.dims[i];
    magB += vectorB.dims[i] * vectorB.dims[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function rankBySimilarity(queryVector, storeEntries) {
  return storeEntries
    .map(function (entry, originalIndex) {
      return {
        entryId: entry.id,
        score: cosineSimilarity(queryVector, entry.vector),
        _originalIndex: originalIndex,
      };
    })
    .sort(function (a, b) {
      return b.score - a.score || a._originalIndex - b._originalIndex;
    })
    .map(function (result, i) {
      return { entryId: result.entryId, score: result.score, rank: i + 1 };
    });
}
