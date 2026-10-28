/**
 * How the first load is getting along, for the loading curtain: how much of
 * what the curtain waits for has come in, and how long the whole of it will
 * likely take. Times are in milliseconds since the page was asked for.
 */

/** What the curtain waits for, and about how much of each comes over the wire (bytes) */
const CRITICAL = [
  ["rapier.es.js", 572e3],
  ["three.core.min.js", 104e3],
  ["three.module.min.js", 90e3],
  ["html2canvas", 72e3],
  ["profile-2026-web.jpg", 95e3],
  ["toy/scene.js", 39e3],
  ["fa-solid-900", 150e3],
  ["fa-brands-400", 110e3],
  // The page's own fonts, several small files
  ["fonts.gstatic.com", 120e3],
];
const TOTAL = CRITICAL.reduce((sum, [, bytes]) => sum + bytes, 0);

/** Under this much in, a measured speed is mostly round trips, so the connection's own hint counts instead */
const TRUST_BYTES = 150e3;

/** Bytes in so far, by entry of CRITICAL */
const got = new Map();
const counted = new Set();

function record(entry) {
  const item = CRITICAL.find(([match]) => entry.name.includes(match));
  if (!item || counted.has(entry.name)) return;
  counted.add(entry.name);
  const [match, size] = item;
  // Another host only tells its sizes when it allows it; until then, its share counts in whole
  const bytes = entry.transferSize || entry.encodedBodySize || size;
  got.set(match, Math.min(size, (got.get(match) || 0) + bytes));
}

performance.getEntriesByType("resource").forEach(record);
try {
  new PerformanceObserver((list) => list.getEntries().forEach(record)).observe({ type: "resource", buffered: true });
} catch {
  // Without it, the estimate rests on the connection's hint and the clock
}

function done() {
  let bytes = 0;
  for (const b of got.values()) bytes += b;
  return bytes;
}

/** 0 to 1: how much of what the curtain waits for is in */
export function loaded() {
  return done() / TOTAL;
}

/** What the browser says of the connection, as a guess at the whole load */
function hinted() {
  const c = navigator.connection;
  if (!c) return null;
  if (c.saveData || c.effectiveType === "slow-2g" || c.effectiveType === "2g") return Infinity;
  if (!c.downlink) return null;
  // A handful of round trips to reach the hosts, then the bytes
  return (c.rtt || 100) * 6 + (TOTAL * 8) / (c.downlink * 1000);
}

/** When the whole load will likely be in, or null while there is nothing to go on */
export function estimate() {
  const now = performance.now();
  const bytes = done();
  if (bytes >= TOTAL) return now;
  // The speed so far, kept up for what is left
  if (bytes >= TRUST_BYTES) return now + (TOTAL - bytes) / (bytes / now);
  const hint = hinted();
  return hint == null ? null : Math.max(now, hint);
}

/** Runs fn once the curtain has lifted, so nothing else is on the line until then and the page has its final shape */
export function afterLoading(fn) {
  const html = document.documentElement;
  if (!html.classList.contains("sheet-loading")) return fn();
  const watch = new MutationObserver(() => {
    if (html.classList.contains("sheet-loading")) return;
    watch.disconnect();
    fn();
  });
  watch.observe(html, { attributes: true, attributeFilter: ["class"] });
}

/** A load that will take longer than this is not worth the wait: the page shows without the splash */
export const SLOW_MS = 8000;

// The curtain's sketch: its parts come in as the load gets along, by the
// clock toward when it should be in (or by what has come in, when that is
// further on). The last part waits for the end (main.js).
const NOTES = ["Sharpening the pencils…", "Smoothing out the creases…", "Dusting off the résumé…", "Unfolding the intro…"];
const parts = [...document.querySelectorAll("#curtain .sketch-layer")];
let shown = 0;
let pacer = 0;

/** Brings in the sketch's next part; false once they are all in */
export function showPart() {
  if (shown >= parts.length) return false;
  parts[shown++].classList.add("is-in");
  // The note moves on with the sketch, keeping the last one for the end
  const n = shown >= parts.length ? NOTES.length - 1 : Math.min(NOTES.length - 2, Math.floor((shown / parts.length) * (NOTES.length - 1)));
  const note = document.getElementById("curtain-note");
  if (note) note.textContent = NOTES[n];
  return true;
}

export function paceSketch() {
  if (pacer || !parts.length) return;
  let pace = 0;
  pacer = setInterval(() => {
    const now = performance.now();
    const end = estimate();
    pace = Math.max(pace, Math.min(0.8, Math.max(now / Math.max(end ?? SLOW_MS, now + 500), loaded())));
    // One part at a time, so a late start still draws them in one after another
    if (shown < parts.length - 1 && pace >= (shown + 1) / parts.length) showPart();
  }, 150);
}

/** The pacing stops: the load is in, or it went on without the splash */
export function stopSketch() {
  clearInterval(pacer);
}
