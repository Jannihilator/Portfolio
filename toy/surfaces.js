/**
 * What a dart meets on the page. Content panels ([data-panel]) take a
 * round hole in their blank paper and mend it; text and media are never
 * holed or covered, and a dart bounces off them. The cardboard board
 * ([data-card]) holds suction darts.
 */
import { Sheet } from "./paper.js";

/** Everything in a panel that is there to be read or watched or pressed */
const CONTENT =
  "p, h1, h2, h3, h4, li, figure, img, video, iframe, button, a, summary, .project-stack, .project-embed, .beat-flow, .beat-callout, .slide-note, .slide-count, .thumb, .pass-row";
const HOLE = { min: 10, max: 26 };
/** Clearance between a hole or stuck dart and the nearest content */
const CLEAR = 6;
const MAX_DARTS = 60;
const panels = new Map();
const stuckDarts = [];

function resize(panel) {
  const { el, sheet } = panel;
  sheet.resize(el.clientWidth, el.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5));
}

export function initSurfaces(root = document) {
  root.querySelectorAll("[data-panel]").forEach((el) => {
    if (panels.has(el)) return;
    const canvas = document.createElement("canvas");
    canvas.className = "panel-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.prepend(canvas);
    el.classList.add("has-sheet");
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const panel = { el, scroller: el.querySelector(":scope > [data-scroll]"), sheet: new Sheet(canvas, { radius }) };
    if (panel.scroller) {
      panel.scroller.addEventListener("scroll", () => panel.sheet.setOffset(0, panel.scroller.scrollTop), { passive: true });
    }
    panels.set(el, panel);
    new ResizeObserver(() => resize(panel)).observe(el);
  });
}

/**
 * "content" when the element is something to read, "blank" for a panel's
 * own paper, "card" for the cardboard board. null off the page.
 */
export function classify(el) {
  const panelEl = el.closest("[data-panel]");
  if (panelEl) {
    const content = el.closest(CONTENT);
    if (content && panelEl.contains(content)) return { kind: "content" };
    return { kind: "blank", panel: panels.get(panelEl) };
  }
  const card = el.closest("[data-card]");
  if (card) {
    const content = el.closest(CONTENT);
    if (content && card.contains(content)) return { kind: "content" };
    return { kind: "card", el: card };
  }
  return null;
}

function distToRect(x, y, r) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  if (dx === 0 && dy === 0) return -1;
  return Math.hypot(dx, dy);
}

/** Distance from a screen point to the nearest content inside root */
function clearance(root, x, y, reach) {
  let best = Infinity;
  for (const el of root.querySelectorAll(CONTENT)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right < x - reach || r.left > x + reach || r.bottom < y - reach || r.top > y + reach) continue;
    best = Math.min(best, distToRect(x, y, r));
  }
  return best;
}

/** Punches a hole if there is room clear of the content. Returns its radius. */
export function tear(panel, x, y) {
  const want = HOLE.min + Math.random() * (HOLE.max - HOLE.min);
  const room = clearance(panel.el, x, y, HOLE.max * 1.5) - CLEAR;
  const r = Math.min(want, room / 1.25);
  if (r < HOLE.min) return 0;
  const box = panel.el.getBoundingClientRect();
  const oy = panel.scroller ? panel.scroller.scrollTop : 0;
  panel.sheet.punch(x - box.left, y - box.top + oy, r);
  panel.sheet.draw(performance.now());
  return r;
}

/**
 * A stuck dart is seen nearly end-on: the cup on the cardboard and the
 * foam tail leaning back the way it came. angle is that screen direction.
 */
export function stick(card, x, y, angle, length) {
  const tipX = x + Math.cos(angle) * (length + 8);
  const tipY = y + Math.sin(angle) * (length + 8);
  const reach = length + 30;
  const room = Math.min(
    clearance(card, x, y, reach),
    clearance(card, tipX, tipY, reach),
    clearance(card, (x + tipX) / 2, (y + tipY) / 2, reach)
  );
  if (room < CLEAR + 6) return null;
  const box = card.getBoundingClientRect();
  const dart = document.createElement("span");
  dart.className = "dart";
  dart.style.left = `${x - box.left - card.clientLeft}px`;
  dart.style.top = `${y - box.top - card.clientTop}px`;
  dart.style.setProperty("--angle", `${angle}rad`);
  dart.style.setProperty("--len", `${length}px`);
  card.appendChild(dart);
  stuckDarts.push(dart);
  while (stuckDarts.length > MAX_DARTS) knockOff(stuckDarts[0]);
  return dart;
}

/** A dart that bounced off, or was knocked loose, drops off the page */
export function dropAt(x, y, angle, length, push = 1) {
  const fx = document.getElementById("fx");
  if (!fx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const falling = document.createElement("span");
  falling.className = "dart dart--falling";
  falling.style.left = `${x}px`;
  falling.style.top = `${y}px`;
  falling.style.setProperty("--angle", `${angle}rad`);
  falling.style.setProperty("--len", `${length}px`);
  falling.style.setProperty("--spin", `${(Math.random() - 0.5) * 540 * push}deg`);
  falling.style.setProperty("--drift", `${(Math.random() - 0.3) * 90}px`);
  falling.addEventListener("animationend", () => falling.remove());
  fx.appendChild(falling);
}

export function knockOff(dart) {
  const i = stuckDarts.indexOf(dart);
  if (i >= 0) stuckDarts.splice(i, 1);
  const box = dart.getBoundingClientRect();
  const angle = parseFloat(dart.style.getPropertyValue("--angle")) || 0.8;
  const len = parseFloat(dart.style.getPropertyValue("--len")) || 20;
  dart.remove();
  dropAt(box.left + box.width / 2, box.top + box.height / 2, angle, len);
}

/** Redraws every panel that has a hole still mending. */
export function tickSurfaces(now) {
  for (const p of panels.values()) if (p.sheet.busy) p.sheet.draw(now);
}
