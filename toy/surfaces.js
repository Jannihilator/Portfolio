/**
 * What a dart meets on the page. Content panels ([data-panel]) take a
 * round hole almost anywhere, through blank paper, text and pictures
 * alike, and mend it; whatever lies over the hole is cut away with it.
 * Only video, embeds and buttons are never holed. The cardboard board
 * ([data-card]) holds suction darts for a while.
 */
import { Sheet } from "./paper.js";

/** Everything in a panel that is there to be read or watched or pressed */
const CONTENT =
  "p, h1, h2, h3, h4, li, figure, img, video, iframe, button, a, summary, .project-stack, .project-embed, .beat-flow, .beat-callout, .slide-note, .slide-count, .thumb, .pass-row";
/** What a dart bounces off instead of going through */
const SOLID = "video, iframe, .project-embed";
/** What a hole must stay clear of, so it never cuts a control in half */
const KEEP_WHOLE = `${SOLID}, button, a, summary`;
const HOLE = { min: 10, max: 26 };
/** Clearance between a hole or stuck dart and the nearest content */
const CLEAR = 6;
const MAX_DARTS = 60;
/** A dart stuck on the cardboard lets go after this long (ms) */
const DART_LIFE = 10000;
const panels = new Map();
const stuckDarts = [];

/** Darts on the page are reused, never made new for every shot */
function pool(className) {
  const free = [];
  return {
    take() {
      const el = free.pop() || document.createElement("span");
      el.className = className;
      el.removeAttribute("style");
      return el;
    },
    give(el) {
      el.getAnimations().forEach((a) => a.cancel());
      el.remove();
      free.push(el);
    },
  };
}
export const flyingDarts = pool("dart-fly");
const fallingDarts = pool("dart dart--falling");
const cardDarts = pool("dart");

function resize(panel) {
  const { el, sheet } = panel;
  sheet.resize(el.clientWidth, el.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5));
  panel.maskKey = null;
  cutContent(panel);
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
    const panel = {
      el,
      scroller: el.querySelector(":scope > [data-scroll]"),
      sheet: new Sheet(canvas, { radius, outline: el.hasAttribute("data-outline") }),
      // What lies on the paper, and is cut away over a hole
      layers: [...el.children].filter((c) => c !== canvas),
      maskKey: "",
    };
    if (panel.scroller) {
      panel.scroller.addEventListener(
        "scroll",
        () => {
          panel.sheet.setOffset(0, panel.scroller.scrollTop);
          cutContent(panel);
        },
        { passive: true }
      );
    }
    panels.set(el, panel);
    new ResizeObserver(() => resize(panel)).observe(el);
  });
}

/**
 * Masks every layer on a panel so each open hole shows straight through
 * it: a full layer, minus the hole outlines at their current size.
 */
function cutContent(panel) {
  const holes = panel.sheet.holes;
  const oy = panel.sheet.oy;
  const key = holes.length ? `${oy}|${holes.map((h) => `${h.id}:${h.cur.toFixed(1)}`).join()}` : "";
  if (key === panel.maskKey) return;
  panel.maskKey = key;
  for (const layer of panel.layers) {
    const s = layer.style;
    if (!holes.length) {
      s.maskImage = s.maskSize = s.maskPosition = s.maskRepeat = s.maskComposite = "";
      continue;
    }
    const images = ["linear-gradient(#000 0 0)"];
    const sizes = ["100% 100%"];
    const spots = ["0 0"];
    const ops = ["subtract"];
    for (const h of holes) {
      const d = h.cur * 2.6;
      images.push(h.svg);
      sizes.push(`${d}px ${d}px`);
      spots.push(`${h.x - h.cur * 1.3 - layer.offsetLeft}px ${h.y - oy - h.cur * 1.3 - layer.offsetTop}px`);
      ops.push("add");
    }
    s.maskImage = images.join(", ");
    s.maskSize = sizes.join(", ");
    s.maskPosition = spots.join(", ");
    s.maskRepeat = "no-repeat";
    s.maskComposite = ops.join(", ");
  }
}

/**
 * "content" when the dart can't go through, "blank" for a panel it can
 * hole, "card" for the cardboard board. null off the page.
 */
export function classify(el) {
  const panelEl = el.closest("[data-panel]");
  if (panelEl) {
    const solid = el.closest(SOLID);
    if (solid && panelEl.contains(solid)) return { kind: "content" };
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

/** Distance from a screen point to the nearest match inside root */
function clearance(root, x, y, reach, selector = CONTENT) {
  let best = Infinity;
  for (const el of root.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right < x - reach || r.left > x + reach || r.bottom < y - reach || r.top > y + reach) continue;
    best = Math.min(best, distToRect(x, y, r));
  }
  return best;
}

/** Punches a hole if there is room clear of controls and video. Returns its radius. */
export function tear(panel, x, y) {
  const want = HOLE.min + Math.random() * (HOLE.max - HOLE.min);
  const room = clearance(panel.el, x, y, HOLE.max * 1.5, KEEP_WHOLE) - CLEAR;
  const r = Math.min(want, room / 1.25);
  if (r < HOLE.min) return 0;
  const box = panel.el.getBoundingClientRect();
  const oy = panel.scroller ? panel.scroller.scrollTop : 0;
  panel.sheet.punch(x - box.left, y - box.top + oy, r);
  panel.sheet.draw(performance.now());
  cutContent(panel);
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
  const dart = cardDarts.take();
  dart.style.left = `${x - box.left - card.clientLeft}px`;
  dart.style.top = `${y - box.top - card.clientTop}px`;
  dart.style.setProperty("--angle", `${angle}rad`);
  dart.style.setProperty("--len", `${length}px`);
  card.appendChild(dart);
  stuckDarts.push(dart);
  dart.expires = setTimeout(() => letGo(dart), DART_LIFE);
  while (stuckDarts.length > MAX_DARTS) knockOff(stuckDarts[0]);
  return dart;
}

function unstick(dart) {
  const i = stuckDarts.indexOf(dart);
  if (i >= 0) stuckDarts.splice(i, 1);
  clearTimeout(dart.expires);
}

/** Its time is up: the suction lets go and it shrinks away */
function letGo(dart) {
  if (!dart.isConnected) return;
  unstick(dart);
  const anim = dart.animate([{ scale: 1, opacity: 1 }, { scale: 1.15, opacity: 1, offset: 0.3 }, { scale: 0, opacity: 0 }], {
    duration: 260,
    easing: "ease-in",
  });
  anim.onfinish = () => cardDarts.give(dart);
}

/** A dart that bounced off, or was knocked loose, drops off the page */
export function dropAt(x, y, angle, length, push = 1) {
  const fx = document.getElementById("fx");
  if (!fx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const falling = fallingDarts.take();
  falling.style.left = `${x}px`;
  falling.style.top = `${y}px`;
  falling.style.setProperty("--angle", `${angle}rad`);
  falling.style.setProperty("--len", `${length}px`);
  fx.appendChild(falling);
  const spin = (Math.random() - 0.5) * 540 * push;
  const drift = (Math.random() - 0.3) * 90;
  const anim = falling.animate(
    [{ transform: "none", opacity: 1 }, { transform: `translate(${drift}px, 75vh) rotate(${spin}deg)`, opacity: 0 }],
    { duration: 950, easing: "cubic-bezier(0.45, 0, 0.85, 0.6)", fill: "forwards" }
  );
  anim.onfinish = () => fallingDarts.give(falling);
}

export function knockOff(dart) {
  unstick(dart);
  const box = dart.getBoundingClientRect();
  const angle = parseFloat(dart.style.getPropertyValue("--angle")) || 0.8;
  const len = parseFloat(dart.style.getPropertyValue("--len")) || 20;
  cardDarts.give(dart);
  dropAt(box.left + box.width / 2, box.top + box.height / 2, angle, len);
}

/** Redraws every panel that has a hole still mending. */
export function tickSurfaces(now) {
  for (const p of panels.values()) {
    if (p.sheet.busy) p.sheet.draw(now);
    if (p.sheet.busy || p.maskKey) cutContent(p);
  }
}
