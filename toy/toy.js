/**
 * The foam-dart blaster is just a crosshair. A press fires a dart into the
 * screen at whatever is there: a blank stretch of a content panel takes a
 * round hole that mends, the cardboard board holds the dart, a button is
 * pressed by it, and text and media only ever bounce it off. Past the
 * pages, the dart flies on into the toy table as a real foam body.
 *
 * Buttons still work by plain click, keyboard and focus: a click on one
 * fires a dart, and the dart is what presses it.
 */
import { classify, tear, stick, knockOff, dropAt } from "./surfaces.js";
import { sound, wakeAudio } from "./sound.js";

const NOT_A_TARGET = "a, input, textarea, select, iframe, label, dialog";
/** A dart leaves from below and to the right of the crosshair, near you */
const LAUNCH = { x: 110, y: 170 };
const START_SIZE = 64;
const PAGE_SIZE = 16;

export function createToy({ table, aim, fx, reducedMotion }) {
  const pointer = { x: 0, y: 0, inside: false };
  const pressed = new Set();
  let lastHover = 0;

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
    const button = el.closest("button, summary");
    if (button) return { kind: "button", el: button };
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
    if (!pointer.inside || document.querySelector("dialog[open]")) {
      aim.classList.remove("is-shown");
      return;
    }
    const t = targetAt(pointer.x, pointer.y);
    aim.classList.toggle("is-shown", t.kind !== "none");
    aim.classList.toggle("is-target", t.kind === "button" || t.kind === "dart");
  }

  /**
   * The dart, seen from behind, shrinks away from you into the crosshair
   * point. Then onArrive decides what it did there.
   */
  function fly(x, y, endSize, onArrive) {
    if (reducedMotion) {
      onArrive();
      return;
    }
    const dart = document.createElement("span");
    dart.className = "dart-fly";
    fx.appendChild(dart);
    const s0 = START_SIZE / 40;
    const s1 = endSize / 40;
    const anim = dart.animate(
      [
        { transform: `translate(${x + LAUNCH.x}px, ${y + LAUNCH.y}px) scale(${s0})` },
        { transform: `translate(${x + LAUNCH.x * 0.25}px, ${y + LAUNCH.y * 0.18 - 10}px) scale(${s0 * 0.45 + s1 * 0.55})`, offset: 0.6 },
        { transform: `translate(${x}px, ${y}px) scale(${s1})` },
      ],
      { duration: 150, easing: "cubic-bezier(0.25, 0.7, 0.45, 1)" }
    );
    anim.onfinish = () => {
      dart.remove();
      onArrive();
    };
  }

  /** The angle a stuck or falling dart leans: back the way it came */
  function leanAngle() {
    return Math.atan2(LAUNCH.y, LAUNCH.x) + (Math.random() - 0.5) * 0.5;
  }

  function pressButton(button) {
    button.classList.add("is-hit");
    setTimeout(() => button.classList.remove("is-hit"), 140);
    sound.press();
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
    button.click();
  }

  /** On through a hole, or past the pages, into the table */
  function intoTable(x, y) {
    const [nx, ny] = toNdc(x, y);
    const result = table.shoot(nx, ny);
    if (result === "cloud") sound.bounce();
  }

  function fire(x, y) {
    const target = targetAt(x, y);
    if (target.kind === "none") return;
    wakeAudio();
    sound.pop();

    if (target.kind === "table") {
      const [nx, ny] = toNdc(x, y);
      const { dist } = table.aim(nx, ny);
      fly(x, y, sizeAt(dist), () => intoTable(x, y));
      return;
    }

    if (target.kind === "button") {
      // Its own click is held back; the dart delivers it instead
      pressed.add(target.el);
      setTimeout(() => pressed.delete(target.el), 1500);
      fly(x, y, PAGE_SIZE, () => {
        pressButton(target.el);
        dropAt(x, y, leanAngle(), 18);
      });
      return;
    }

    if (target.kind === "dart") {
      fly(x, y, PAGE_SIZE, () => {
        if (target.el.isConnected) knockOff(target.el);
        sound.bounce();
        dropAt(x, y, leanAngle(), 18);
      });
      return;
    }

    if (target.kind === "content") {
      fly(x, y, PAGE_SIZE, () => {
        sound.bounce();
        dropAt(x, y, leanAngle(), 18);
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
        if (tear(target.panel, hx, hy)) {
          sound.tear();
          intoTable(hx, hy);
        } else {
          sound.bounce();
          dropAt(hx, hy, leanAngle(), 18);
        }
        return;
      }
      if (stick(target.el, hx, hy, leanAngle(), 16 + Math.random() * 6)) sound.stick();
      else {
        sound.bounce();
        dropAt(hx, hy, leanAngle(), 18);
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
    if (document.querySelector("dialog[open]")) return;
    if (e.clientX >= document.documentElement.clientWidth) return;
    fire(e.clientX, e.clientY);
  });

  // A pointer click on a button the dart is flying at waits for the dart.
  // Keyboard and assistive clicks carry no pointer detail and go straight
  // through, as does the click the dart itself makes.
  document.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted || e.detail === 0) return;
      const button = e.target.closest && e.target.closest("button, summary");
      if (!button || !pressed.has(button)) return;
      pressed.delete(button);
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  document.body.classList.add("toy-on");

  return {
    update(dt, now) {
      for (const k of table.takeKnocks()) sound.thunk(k.strength, k.small);
      // What is under a still pointer changes too: a dialog opens, a page scrolls
      if (now - lastHover > 150) {
        lastHover = now;
        updateHover();
      }
    },
  };
}
