/**
 * The foam-dart blaster is just a crosshair. A press fires a dart, from
 * near you low on the screen, at whatever is there: a panel takes a round
 * hole that mends (through its text too) and the dart is spent, the
 * cardboard board holds the dart, a button or link is pressed by it, and
 * video only ever bounces it off. Where there is no page, the dart flies
 * on into the toy table as a real foam body.
 *
 * Buttons and links still work by plain click, keyboard and focus: a
 * click on one fires a dart, and the dart is what presses it.
 */
import { classify, tear, stick, knockOff, dropAt, flyingDarts } from "./surfaces.js";
import { sound, wakeAudio } from "./sound.js";

const NOT_A_TARGET = "input, textarea, select, iframe, label";
const PRESSABLE = "button, summary, a[href]";
/** A dart in flight is drawn this long (px) at its biggest, as it leaves */
const START_LEN = 120;
const PAGE_SIZE = 18;
/**
 * How hard each shot comes out, as a share of full force (1). Tune here:
 * weakChance is how often a shot comes out weak, weak is the range a weak
 * shot's force falls in (kept at or under WEAK.below in scene.js, which
 * makes it a lob), and normal is the range for every other shot. Full
 * speed itself is DART_SPEED in scene.js, and how a lob arcs is WEAK there.
 */
const SHOT = { weakChance: 0.25, weak: [0.6, 0.6], normal: [0.65, 0.95] };

function shotForce() {
  const [lo, hi] = Math.random() < SHOT.weakChance ? SHOT.weak : SHOT.normal;
  return lo + Math.random() * (hi - lo);
}

export function createToy({ table, aim, fx, reducedMotion }) {
  const pointer = { x: 0, y: 0, inside: false };
  const pressed = new Set();
  const ring = aim.querySelector(".aim-ring") || aim;
  let lastHover = 0;
  /** A tap shows the crosshair where it landed until this time */
  let tapShownUntil = 0;
  let launch = { x: 0, y: 0 };
  let force = 1;

  function toNdc(x, y) {
    return [(x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1];
  }

  /** Screen size of a dart's back end at this distance from the eye */
  function sizeAt(dist) {
    const pxPerUnit = window.innerHeight / (2 * Math.tan((table.camera.fov * Math.PI) / 360) * dist);
    return Math.max(5, 0.14 * pxPerUnit);
  }

  /** What the dart is going to meet at this screen point */
  function targetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return { kind: "none" };
    if (el.closest(NOT_A_TARGET)) return { kind: "none" };
    const dartEl = el.closest(".dart");
    if (dartEl) return { kind: "dart", el: dartEl };
    const button = el.closest(PRESSABLE);
    if (button) return { kind: "button", el: button };
    // Over an open dialog, everything else just bounces the dart off
    if (el.closest("dialog")) return { kind: "content" };
    // A panel's scrollbar is for scrolling, never a target
    const scroller = el.closest("[data-scroll]");
    if (scroller && x > scroller.getBoundingClientRect().right - (scroller.offsetWidth - scroller.clientWidth)) {
      return { kind: "none" };
    }
    const c = classify(el);
    if (c) return c;
    return { kind: "table" };
  }

  function updateHover() {
    if (!pointer.inside) {
      if (performance.now() > tapShownUntil) aim.classList.remove("is-shown");
      table.hoverSheet(false);
      return;
    }
    const t = targetAt(pointer.x, pointer.y);
    // The intro lying on the table is a thing to pick up: its corner lifts under the crosshair
    const onSheet = t.kind === "table" && table.sheetAt(...toNdc(pointer.x, pointer.y));
    table.hoverSheet(onSheet);
    aim.classList.toggle("is-shown", t.kind !== "none");
    aim.classList.toggle("is-target", t.kind === "button" || t.kind === "dart" || onSheet);
  }

  /** The crosshair pops on every shot */
  function pop() {
    if (reducedMotion) return;
    ring.animate(
      [
        { scale: 1, borderColor: "#ff7a1f" },
        { scale: 1.8, borderColor: "#ff7a1f", offset: 0.2 },
        { scale: 0.88, offset: 0.55 },
        { scale: 1 },
      ],
      { duration: 300, easing: "ease-out" }
    );
  }

  /** Darts leave from near you, low on the screen, a little to the right of the aim */
  function launchFor(x) {
    return { x: x * 0.7 + window.innerWidth * 0.3 + 40, y: window.innerHeight * 0.86 };
  }

  /**
   * The dart, a foam dart seen from the side and behind, leaves from near
   * you and flies away into the crosshair point: big as it leaves, small
   * and nearly end-on as it arrives. A weaker shot takes longer to get
   * there. Then onArrive decides what it did there.
   */
  function fly(x, y, endSize, onArrive) {
    if (reducedMotion) {
      onArrive();
      return;
    }
    const dart = flyingDarts.take();
    fx.appendChild(dart);
    const dx = x - launch.x;
    const dy = y - launch.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    // The element is 60 x 20 px: long, then shortening as it turns end-on
    const len0 = START_LEN / 60;
    const w0 = len0 * 1.1;
    const w1 = endSize / 20;
    const len1 = w1 * 0.55;
    const at = (k, lift) => `translate(${launch.x + dx * k}px, ${launch.y + dy * k - lift}px) rotate(${angle}rad)`;
    const time = Math.min(340, 190 + dist * 0.12) / Math.sqrt(force);
    const anim = dart.animate(
      [
        { transform: `${at(0, 0)} scale(${len0}, ${w0})` },
        { transform: `${at(0.62, 26)} scale(${len0 * 0.42 + len1 * 0.58}, ${w0 * 0.4 + w1 * 0.6})`, offset: 0.55 },
        { transform: `${at(1, 0)} scale(${len1}, ${w1})` },
      ],
      { duration: time, easing: "cubic-bezier(0.3, 0.65, 0.5, 1)" }
    );
    anim.onfinish = () => {
      flyingDarts.give(dart);
      onArrive();
    };
  }

  /** The angle a stuck or falling dart leans: back the way it came */
  function leanAngle(x, y) {
    return Math.atan2(launch.y - y, launch.x - x) + (Math.random() - 0.5) * 0.5;
  }

  function pressButton(button) {
    button.classList.add("is-hit");
    setTimeout(() => button.classList.remove("is-hit"), 140);
    sound.press();
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
    button.click();
  }

  /** Past the pages, into the table */
  function intoTable(x, y, f) {
    const [nx, ny] = toNdc(x, y);
    // A dart that holds on to a target or the porcupine is heard as it lands
    if (table.shoot(nx, ny, f, toNdc(launch.x, launch.y)) === "cloud") sound.bounce();
  }

  function fire(x, y) {
    const target = targetAt(x, y);
    if (target.kind === "none") return;
    wakeAudio();
    pop();
    launch = launchFor(x);
    // Each shot keeps its own force, even if another is fired before it lands
    const f = (force = shotForce());
    if (f < SHOT.normal[0]) sound.fizzle();
    else sound.pop();

    if (target.kind === "table") {
      const [nx, ny] = toNdc(x, y);
      const { dist, weak } = table.aim(nx, ny, f);
      // A weak shot is lobbed by the table itself, from your hand onto the crosshair
      if (weak) intoTable(x, y, f);
      else fly(x, y, sizeAt(dist), () => intoTable(x, y, f));
      return;
    }

    if (target.kind === "button") {
      // Its own click is held back; the dart delivers it instead
      pressed.add(target.el);
      setTimeout(() => pressed.delete(target.el), 1500);
      fly(x, y, PAGE_SIZE, () => {
        pressButton(target.el);
        dropAt(x, y, leanAngle(x, y), 18);
      });
      return;
    }

    if (target.kind === "dart") {
      fly(x, y, PAGE_SIZE, () => {
        if (target.el.isConnected) knockOff(target.el);
        sound.bounce();
        dropAt(x, y, leanAngle(x, y), 18);
      });
      return;
    }

    if (target.kind === "content") {
      fly(x, y, PAGE_SIZE, () => {
        sound.bounce();
        dropAt(x, y, leanAngle(x, y), 18);
      });
      return;
    }

    // Held relative to the page, so a scroll mid-flight still lands true
    const anchor = target.kind === "blank" ? target.panel.el : target.el;
    const box = anchor.getBoundingClientRect();
    const lx = x - box.left;
    const ly = y - box.top;
    fly(x, y, PAGE_SIZE, () => {
      const now = anchor.getBoundingClientRect();
      const hx = now.left + lx;
      const hy = now.top + ly;
      if (target.kind === "blank") {
        // The dart spends itself tearing through the page: nothing goes on
        // to the table below
        if (tear(target.panel, hx, hy)) sound.tear();
        else {
          sound.bounce();
          dropAt(hx, hy, leanAngle(hx, hy), 18);
        }
        return;
      }
      if (stick(target.el, hx, hy, leanAngle(hx, hy), 16 + Math.random() * 6)) sound.stick();
      else {
        sound.bounce();
        dropAt(hx, hy, leanAngle(hx, hy), 18);
      }
    });
  }

  // ---------------------------------------------------------------- input
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.inside = true;
    aim.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    updateHover();
  });
  // An embedded player takes the pointer for itself
  window.addEventListener("pointerover", (e) => {
    if (e.target.closest && e.target.closest("iframe")) {
      pointer.inside = false;
      updateHover();
    }
  });
  document.documentElement.addEventListener("pointerleave", () => {
    pointer.inside = false;
    updateHover();
  });
  window.addEventListener("blur", () => {
    pointer.inside = false;
    updateHover();
  });

  window.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary || e.pointerType === "touch") return;
    // A modified click on a link keeps its own meaning (new tab, and so on)
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.clientX >= document.documentElement.clientWidth) return;
    fire(e.clientX, e.clientY);
  });

  // On a touch screen, once scrolled all the way down to the table, a tap
  // fires: the crosshair shows where it landed and pops, like a click.
  // A touch that drags is a scroll, and fires nothing.
  let touch = null;
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || !e.isPrimary) return;
    touch = atBottom() ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp } : null;
  });
  window.addEventListener("pointercancel", () => (touch = null));
  window.addEventListener("pointerup", (e) => {
    const t = touch;
    touch = null;
    if (!t || e.pointerId !== t.id || e.timeStamp - t.at > 500) return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12 || !atBottom()) return;
    aim.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const target = targetAt(e.clientX, e.clientY);
    aim.classList.toggle("is-target", target.kind === "button" || target.kind === "dart");
    if (target.kind !== "none") {
      tapShownUntil = performance.now() + 600;
      aim.classList.add("is-shown");
    }
    fire(e.clientX, e.clientY);
  });

  // A pointer click on a button the dart is flying at waits for the dart.
  // Keyboard and assistive clicks carry no pointer detail and go straight
  // through, as does the click the dart itself makes.
  document.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted || e.detail === 0) return;
      const button = e.target.closest && e.target.closest(PRESSABLE);
      if (!button || !pressed.has(button)) return;
      pressed.delete(button);
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  // A modal dialog sits in the top layer, so the crosshair, the darts and
  // the blaster move in with it while it is open
  const overlay = [aim, fx];
  new MutationObserver(() => {
    const open = document.querySelector("dialog[open]");
    const home = open || document.body;
    for (const el of overlay) if (el.parentElement !== home) home.appendChild(el);
    updateHover();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  document.body.classList.add("toy-on");

  return {
    update(dt, now) {
      for (const k of table.takeKnocks()) sound.thunk(k.strength, k.small);
      if (table.takeCheers().length) sound.swish();
      for (const kind of table.takeLandings()) {
        if (kind === "target") sound.ding();
        else if (kind === "train") sound.whistle();
        else if (kind === "meeple") sound.squeal();
        else sound.stick();
      }
      // What is under a still pointer changes too: a dialog opens, a page scrolls
      if (now - lastHover > 150) {
        lastHover = now;
        updateHover();
      }
    },
  };
}
