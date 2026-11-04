/**
 * Builds the page first, so everything reads with no 3D at all, then
 * brings up the toy table under it and the crosshair over it.
 */
import { initCarousel } from "./carousel.js";
import { initOthers } from "./others.js";
import { initSurfaces, tickSurfaces } from "./surfaces.js";
import { estimate, SLOW_MS, sayLast, showPart, stopSketch } from "./loading.js";

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const carousel = initCarousel({ track: $("track"), tabs: $("tabs"), prev: $("prev-project"), next: $("next-project") });
initOthers({ list: $("other-list"), dialog: $("peek"), body: $("peek-body"), close: $("peek-close") });
initSurfaces();

/**
 * A quick glide down (or up) the page, in place of the browser's slow
 * smooth scroll: the paper unfolds on the way. Any touch of the wheel, a
 * key or a finger takes the page back.
 */
let glideFrame = 0;
function glideTo(top) {
  cancelAnimationFrame(glideFrame);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(max, Math.round(top)));
  const from = window.scrollY;
  const dist = Math.abs(to - from);
  if (reducedMotion || dist < 4) return window.scrollTo({ top: to, behavior: "instant" });
  const time = Math.min(1300, 550 + dist * 0.16);
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / time);
    const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    window.scrollTo({ top: from + (to - from) * ease, behavior: "instant" });
    if (k < 1) glideFrame = requestAnimationFrame(step);
  };
  glideFrame = requestAnimationFrame(step);
}
for (const type of ["wheel", "touchstart", "keydown"]) {
  window.addEventListener(type, () => cancelAnimationFrame(glideFrame), { passive: true });
}

/** Where the page scrolls to put a section at the top (the intro rests mid-screen) */
function sectionTop(id) {
  const el = $(id);
  if (id === "about" && splash.offsetHeight) return landing();
  return el.getBoundingClientRect().top + window.scrollY - (id === "about" ? introRest() : 16);
}

/** Takes the viewer to a section; Experience and the résumé are pages of the intro card */
function goTo(id) {
  if (id === "resume" || id === "experience") return showFace(id === "resume" ? "resume-side" : id);
  if (id === "about" && $("intro-flip").classList.contains("is-flipped")) return showFace("about");
  if (id === "about") return glideTo(sectionTop("about"));
  glideTo(sectionTop(id));
}

document.querySelectorAll("[data-goto]").forEach((button) => {
  button.addEventListener("click", () => {
    if ($(button.dataset.goto)) goTo(button.dataset.goto);
  });
});

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => goTo(button.dataset.nav));
});

// The clouds on the table are the page's nav: a dart that hits one sends the
// viewer to its section, once the cloud has had a moment to swing
$("table").addEventListener("cloudnav", (event) => {
  setTimeout(() => goTo(event.detail), reducedMotion ? 0 : 450);
});

// Many visitors have no mail app set up, so a mailto link opens nothing useful
// (or a stray built-in client): copy the address instead, and keep the link as
// the fallback for when the clipboard is not available.
document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  const label = link.querySelector("span");
  const address = link.getAttribute("href").slice("mailto:".length);
  link.title = address;
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      window.location.href = link.getAttribute("href");
      return;
    }
    label.textContent = "Copied " + address;
  });
});

// The splash is the table, with the intro lying on it as a real sheet of
// paper in the 3D scene (see the sheet in scene.js). Scrolling peels it up
// off the table until it lies exactly over the intro panel's place; a dart
// on it does the same, by scrolling there. The real panel fades in over it
// at the very end and takes over. Until the sheet is ready, or without the
// 3D table, the page is just the page. Phones skip the splash (see toy.css).
//
// The sheet lands with the intro in the middle of the screen (near the top
// when it is too tall for that), and the intro then holds still there for a
// stretch of scrolling before the page moves on (.has-hold in toy.css).
//
// A load that would take too long skips the splash, as on a phone: the page
// shows at once, and the table comes in under it when it is up.
const splash = $("splash");
const intro = $("intro-flip");
const stage = $("intro-stage");
$("about").tabIndex = -1;
/** The toy table, once it is up and has the intro's picture */
let sheetTable = null;

/** Room over the intro card for the bookmarks on its top edge */
const TAB_ROOM = 56;

/** Where the intro rests on the screen once the sheet has landed: by the
 * About page's own height, so the other pages never move where the sheet lands */
function introRest() {
  return Math.max(TAB_ROOM, (window.innerHeight - $("about").offsetHeight) / 2);
}

/** How far down the page the sheet has landed: the intro is then at its rest */
function landing() {
  const top = stage.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(intro).marginTop);
  return Math.max(1, top - introRest());
}

/** How far up the scroll to the intro's rest the sheet has handed over to the real panel */
const HANDOFF = 0.8;

function splashProgress() {
  if (!splash.offsetHeight) return 1;
  // A scroll can stop a fraction of a pixel short; that counts as up
  const raw = window.scrollY / landing();
  return raw > 0.995 ? 1 : Math.max(0, raw);
}

/** The painter for the sheet's picture starts downloading now, alongside the table */
const painter = splash.offsetHeight ? import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js") : null;
painter?.catch(() => {});

/** Off once the card has been turned over, until the sheet is back on the table */
let holdOff = false;

/** The intro holds at its rest only while it fits on the screen whole */
function placeRest() {
  const hold = !!sheetTable && !holdOff && introRest() > TAB_ROOM;
  document.documentElement.classList.toggle("has-hold", hold);
  stage.style.setProperty("--intro-rest", `${Math.round(introRest())}px`);
}

// On the splash, a beam of sun on the sheet, so the way in stands out from
// all the toys, and for a visitor who still has not found it, a note on the
// table pointing at it. All go as the sheet comes up.
const light = $("splash-light");
const beam = $("splash-beam");
const cue = $("splash-cue");

/** The note turns up only once the table has been in view this long */
const CUE_AFTER = 5000;
/** When the note may show, from when the table first came into view */
let cueAt = 0;

function placeCue(p) {
  const box = !sheetLoading && sheetTable?.sheetOnScreen();
  const fade = box ? 1 - Math.min(1, p / 0.12) : 0;
  if (box && !cueAt) {
    cueAt = performance.now() + CUE_AFTER;
    setTimeout(() => queueUpdate(), CUE_AFTER);
  }
  const noted = !!cueAt && performance.now() >= cueAt;
  light.style.opacity = beam.style.opacity = fade.toFixed(3);
  // The note stays through a stray scroll and goes only once the visitor is
  // about halfway up to the intro
  const noteFade = box ? 1 - Math.min(1, Math.max(0, (p - 0.45) / 0.1)) : 0;
  cue.style.opacity = noted ? noteFade.toFixed(3) : "0";
  cue.classList.toggle("is-on", noted && noteFade > 0);
  if (!box || (fade <= 0 && noteFade <= 0)) return;
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  light.style.setProperty("--x", `${Math.round(cx)}px`);
  light.style.setProperty("--y", `${Math.round(cy)}px`);
  light.style.setProperty("--rx", `${Math.round(w)}px`);
  light.style.setProperty("--ry", `${Math.round(h)}px`);
  aimBeam();
  // On the bare table just past the sheet's far edge, over its right half,
  // clear of the chips and the "all in" marker beside it; the arrow at its
  // left points down onto the sheet
  cue.style.left = `${Math.round(box.left + w * 0.32)}px`;
  cue.style.top = `${Math.round(box.top + h * 0.06 - cue.offsetHeight)}px`;
}

// The note at the far end of the page writes itself out the first time the
// visitor scrolls all the way down. Once it has finished, scrolling on down
// (or trying to, at the very bottom) fades it away. Visitors scroll up and
// down hard to make sure they've seen the end, so going back up brings the
// note back, ready to be found again on the way down.
{
  const endCue = $("end-cue");
  const room = endCue.parentElement;
  /** How long the note takes to write itself out, before it can be waved off */
  const SETTLE = 1200;
  /** How long it stays put after coming back, before it can be waved off again */
  const RESETTLE = 700;
  /** How far the visitor scrolls on, either way, to send the note off or bring it back */
  const ON_BY = 60;
  /** Scroll position the note settled at, once it can be waved off */
  let settledAt = null;
  /** Scroll position the note went at, while it is away */
  let goneAt = null;
  let timer = 0;

  const settleIn = (ms) => {
    clearTimeout(timer);
    settledAt = null;
    timer = setTimeout(() => (settledAt = window.scrollY), ms);
  };
  const goAway = () => {
    if (goneAt !== null || settledAt === null) return;
    goneAt = window.scrollY;
    endCue.classList.add("is-gone");
  };
  const comeBack = () => {
    goneAt = null;
    endCue.classList.remove("is-gone");
    settleIn(RESETTLE);
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (goneAt !== null) {
      if (y < goneAt - ON_BY) comeBack();
      return;
    }
    // The last page's bottom edge has come up into the lower part of the screen
    const inView = room.getBoundingClientRect().top <= window.innerHeight * 0.8;
    if (!endCue.classList.contains("is-on")) {
      if (!inView) return;
      endCue.classList.add("is-on");
      settleIn(SETTLE);
      return;
    }
    // Gone back up out of reach: start over the next time it comes into view
    if (!inView) {
      clearTimeout(timer);
      settledAt = null;
      timer = 0;
      return;
    }
    if (settledAt === null && !timer) settleIn(RESETTLE);
    if (settledAt !== null && y > settledAt + ON_BY) goAway();
  };
  // At the very bottom the page can't scroll, so the attempt itself counts
  const onWheel = (e) => e.deltaY > 0 && goAway();
  let touchY = null;
  const onTouch = (e) => {
    const y = e.touches[0]?.clientY;
    if (touchY !== null && settledAt !== null && touchY - y > ON_BY) goAway();
    if (touchY === null) touchY = y;
  };
  window.addEventListener("touchstart", () => (touchY = null), { passive: true });
  const onKey = (e) => settledAt !== null && ["ArrowDown", "PageDown", "End", " "].includes(e.key) && goAway();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("keydown", onKey);
}

/** The last beam set, so a still sun costs nothing frame to frame */
let beamAt = "";

/**
 * The sunbeam shines from the hanging sun down onto the sheet: narrow at
 * the sun, wide enough to take in the whole sheet where it lands, and a
 * little past it. It follows the sun when a dart sets it swinging.
 */
function aimBeam() {
  if (!(+beam.style.opacity > 0)) return;
  const box = sheetTable?.sheetOnScreen();
  const sun = sheetTable?.sunOnScreen();
  if (!box || !sun) return;
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  const reach = Math.hypot(cx - sun.x, cy - sun.y);
  const length = reach + h * 0.8;
  const wide = w * 1.25;
  const key = [sun.x, sun.y, cx, cy, w].map(Math.round).join();
  if (key === beamAt) return;
  beamAt = key;
  const shaft = beam.firstElementChild;
  const angle = Math.atan2(cy - sun.y, cx - sun.x);
  shaft.style.width = `${Math.round(length)}px`;
  shaft.style.height = `${Math.round(wide)}px`;
  shaft.style.transform = `translate(${sun.x.toFixed(1)}px, ${sun.y.toFixed(1)}px) rotate(${angle.toFixed(4)}rad) translateY(-50%)`;
  shaft.style.setProperty("--near", `${Math.round(sun.r * 0.55)}px`);
  // Where the beam reaches the sheet's near edge, as a share of its length
  shaft.style.setProperty("--land", `${(((reach - h * 0.7) / length) * 100).toFixed(1)}%`);
}

let queueUpdate = () => {};
{
  let queued = false;
  const update = () => {
    queued = false;
    if (!sheetTable) return placeCue(1);
    const p = splashProgress();
    placeCue(p);
    if (p < 0.9) holdOff = false;
    placeRest();
    // The sheet's flight runs over the first HANDOFF of the scroll, so the
    // real panel has taken over a little before the intro reaches its rest.
    // The panel's own place, which the sheet comes to rest on, moves with
    // the scroll, so the sheet stays on it to the end.
    const flight = Math.min(1, p / HANDOFF);
    sheetTable.setSheetProgress(flight, $("about").getBoundingClientRect());
    const show = Math.min(1, Math.max(0, (flight - 0.9) / 0.1));
    intro.style.opacity = show < 1 ? show.toFixed(3) : "";
    intro.style.pointerEvents = flight < 1 ? "none" : "";
    // The work below waits until the intro is upright, so it never shows up beside the flying sheet
    document.body.classList.toggle("sheet-flying", flight < 1);
  };
  const queue = () => {
    if (!queued) requestAnimationFrame(update);
    queued = true;
  };
  queueUpdate = queue;
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("sheet-ready", queue);
  // A taller or shorter intro rests somewhere else
  new ResizeObserver(queue).observe(intro);
}

/** Paints the intro panel into a picture for the sheet on the table */
async function renderSheet() {
  const { default: html2canvas } = await painter;
  return html2canvas($("about"), {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.25,
    logging: false,
    // The painter waits for every picture in what it copies, so it copies the intro card and
    // the way down to it, never the project pictures and thumbnails further down the page
    ignoreElements: (el) => !!el.closest?.("body") && !el.contains(intro) && !intro.contains(el),
    onclone: (doc) => {
      doc.getElementById("intro-flip").style.opacity = "1";
      doc.getElementById("page").style.opacity = "1";
      // The panel's paper is drawn on its canvas, which may not be painted yet: plain paper instead
      const copy = doc.getElementById("about");
      copy.style.background = "#fffdf7";
      copy.querySelector(".panel-canvas")?.remove();
      // The painter drops the text of inline-flex links; as inline blocks they keep it
      copy.querySelectorAll(".contact-links a").forEach((link) => (link.style.display = "inline-block"));
    },
  });
}

const sheetAspect = () => $("about").offsetWidth / $("about").offsetHeight;

/** Headroom painted over the bookmarks, for the open one that sticks up past the rest */
const TAB_LIFT = 14;

/**
 * Paints the bookmarks on the intro's top edge, so they come up off the
 * table on the sheet rather than turning up only once it has landed. Where
 * they sit is given in the sheet's own measure: its height is 1, its middle
 * the origin, y up.
 */
async function renderTabs() {
  const { default: html2canvas } = await painter;
  const tabs = $("intro-tabs");
  const picture = await html2canvas(tabs, {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.25,
    logging: false,
    ignoreElements: (el) => !!el.closest?.("body") && !el.contains(intro) && !intro.contains(el),
    onclone: (doc) => {
      doc.getElementById("intro-flip").style.opacity = "1";
      doc.getElementById("page").style.opacity = "1";
      // Grown upward, since it is held by its bottom edge, so nothing sticking up is cut off
      doc.getElementById("intro-tabs").style.paddingTop = `${TAB_LIFT}px`;
    },
  });
  const panel = $("about").getBoundingClientRect();
  const box = tabs.getBoundingClientRect();
  const midX = panel.left + panel.width / 2;
  const midY = panel.top + panel.height / 2;
  const top = (midY - (box.top - TAB_LIFT)) / panel.height;
  const bottom = (midY - box.bottom) / panel.height;
  return {
    picture,
    x: (box.left + box.width / 2 - midX) / panel.height,
    y: (top + bottom) / 2,
    w: box.width / panel.height,
    h: top - bottom,
  };
}

async function paintSheet(table) {
  const [picture, tabs] = await Promise.all([renderSheet(), renderTabs().catch(() => null)]);
  table.setSheet(picture, sheetAspect(), tabs);
  sheetTable = table;
  window.dispatchEvent(new Event("sheet-ready"));
}

// Until the table is up and the intro is painted, a bank of mist hides the
// page (see #curtain in index.html) and the page cannot be scrolled. On it a
// line sketch of the table, with a pencil at work on the intro: its parts
// come in as the load gets along (loading.js). When all is ready the mist
// lifts off.
//
// When the load looks like taking longer than SLOW_MS, it is not worth the
// wait: the mist lifts at once and the page shows without the splash.
const curtain = $("curtain");
const view = $("view");
let sheetLoading = !!curtain;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function watchLoading() {
  if (!curtain) return;
  const timer = setInterval(() => {
    if (!sheetLoading) return clearInterval(timer);
    const end = estimate();
    if (performance.now() > SLOW_MS || (end != null && end > SLOW_MS)) {
      clearInterval(timer);
      skipSplash();
    }
  }, 150);
}

/** The table, once it is up, shows through where the blurred view stood */
let tableUp = false;
function revealTable() {
  if (tableUp && !sheetLoading) view.classList.add("is-gone");
}

/** The mist lifts off and the page can scroll */
async function liftCurtain() {
  curtain.classList.add("is-clearing");
  document.documentElement.classList.remove("sheet-loading");
  revealTable();
  queueUpdate();
  await wait(reducedMotion ? 350 : 2400);
  curtain.remove();
}

/** Too slow for the splash: the page shows at once, as on a phone */
function skipSplash() {
  if (!sheetLoading) return;
  sheetLoading = false;
  stopSketch();
  document.documentElement.classList.add("no-splash");
  window.scrollTo(0, 0);
  liftCurtain();
}

/**
 * The sketch's parts still to come fade in quickly, one after another; the
 * whole sheet shows for a moment, then the mist lifts and the table shows
 */
async function openCurtain() {
  if (!sheetLoading) return revealTable();
  sheetLoading = false;
  stopSketch();
  const last = sayLast();
  while (showPart()) {
    if (!reducedMotion) await wait(160);
  }
  // The last part's fade, and the whole sheet for a moment, before it goes;
  // and the last words, which stay up long enough to be read
  await Promise.all([wait(reducedMotion ? 0 : 1100), last]);
  liftCurtain();
}

/** The icons' stylesheet loads on its own (index.html); the sheet's picture needs its fonts in */
async function iconsReady() {
  const link = $("icons");
  if (link && link.media !== "all") {
    await Promise.race([new Promise((resolve) => link.addEventListener("load", resolve, { once: true })), wait(5000)]);
  }
  await Promise.race([
    Promise.all([document.fonts.load('900 1em "Font Awesome 6 Free"'), document.fonts.load('400 1em "Font Awesome 6 Brands"')]),
    wait(5000),
  ]).catch(() => {});
}

async function startSheet(table) {
  if (!splash.offsetHeight) return openCurtain();
  try {
    await iconsReady();
    await document.fonts.ready;
    await paintSheet(table);
    // Too late: the page went on without the splash
    if (!splash.offsetHeight) {
      sheetTable = null;
      table.clearSheet();
      document.body.classList.remove("sheet-flying");
      intro.style.opacity = "";
      intro.style.pointerEvents = "";
      return;
    }
    await openCurtain();
    $("table").addEventListener("pickup", () => {
      if (sheetLoading || splashProgress() >= 1) return;
      window.scrollTo({ top: landing(), behavior: reducedMotion ? "auto" : "smooth" });
      $("about").focus({ preventScroll: true });
    });
    // A new width reflows the panel, so it is painted again once the resizing stops
    let again = 0;
    window.addEventListener("resize", () => {
      clearTimeout(again);
      again = setTimeout(() => paintSheet(table).catch(() => {}), 300);
    });
  } catch (error) {
    // The page keeps its plain panel
    console.warn("Intro sheet unavailable", error);
    sheetTable = null;
    document.documentElement.classList.remove("has-hold");
    // Without the sheet there is nothing to see on the splash, so it goes
    document.documentElement.classList.add("no-splash");
    table.clearSheet();
    openCurtain();
    placeCue(1);
    intro.style.opacity = "";
    intro.style.pointerEvents = "";
    document.body.classList.remove("sheet-flying");
  }
}

// The intro card's pages are About, Experience and the résumé. A bookmark
// (or the résumé's Back button) brings one to the front: it fades in over
// the page that was showing, which is then put away. The PDF only loads the
// first time it is asked for.
let showFace = () => {};
{
  const card = $("intro-flip");
  const faces = [$("about"), $("experience"), $("resume-side")];
  const marks = [...$("intro-tabs").querySelectorAll("[data-face]")];
  const frame = $("resume-side").querySelector(".resume-frame");
  let at = 0;
  let putAway = 0;
  let resizeEnd = 0;
  // The other pages are a screen tall, or as tall as About when About is the
  // longer one on a small screen, so they never cut About's height short
  const flippedHeight = () => Math.max(window.innerHeight - TAB_ROOM - 24, faces[0].offsetHeight);
  const syncHeight = () => card.style.setProperty("--flip-h", `${flippedHeight()}px`);
  syncHeight();
  window.addEventListener("resize", syncHeight);
  // With a change of height, the words fade out before the card moves on and
  // fade in once it has its new size, so none sit on a page they don't belong to
  const TEXT_OUT = 160;
  const RESIZE_TIME = 420;
  let swapPage = 0;
  let showText = 0;
  showFace = (id, focus) => {
    const to = faces.findIndex((face) => face.id === id);
    if (to < 0) return;
    const top = () => card.getBoundingClientRect().top + window.scrollY - TAB_ROOM;
    if (to === at) return glideTo(top());
    const from = at;
    const coming = faces[to];
    const going = faces[from];
    if (coming.id === "resume-side" && !frame.src) frame.src = frame.dataset.src;
    clearTimeout(putAway);
    faces.forEach((face, i) => {
      if (i !== from && i !== to) {
        face.classList.add("is-away");
        face.dataset.side = "away";
      }
      face.inert = i !== to;
    });
    // The page coming starts clear, then fades in on top of the page going
    coming.classList.add("no-turn");
    coming.dataset.side = "away";
    coming.classList.remove("is-away");
    void coming.offsetWidth;
    coming.classList.remove("no-turn");
    const resizing = (from === 0) !== (to === 0);
    syncHeight();
    clearTimeout(swapPage);
    clearTimeout(showText);
    faces.forEach((face) => face.classList.remove("text-hide"));
    if (!reducedMotion) {
      // The words of the page going fade out first, on its paper, with the
      // page coming lying bare under it. Only then, and once the card has
      // any new size, do the new words fade in: no words ever lie on top of
      // another page's words.
      const heightChanges = resizing && flippedHeight() !== faces[0].offsetHeight;
      going.dataset.side = "front";
      coming.classList.add("no-turn", "text-hide");
      coming.dataset.side = "behind";
      void coming.offsetWidth;
      coming.classList.remove("no-turn");
      going.classList.add("text-hide");
      swapPage = setTimeout(() => {
        coming.dataset.side = "front";
        going.dataset.side = "away";
      }, TEXT_OUT);
      putAway = setTimeout(() => {
        going.dataset.side = "away";
        going.classList.add("is-away");
        going.classList.remove("text-hide");
      }, TEXT_OUT + 300);
      showText = setTimeout(() => coming.classList.remove("text-hide"), heightChanges ? RESIZE_TIME : TEXT_OUT);
    } else {
      coming.dataset.side = "front";
      going.dataset.side = "away";
      going.classList.add("is-away");
    }
    at = to;
    // About is as tall as its page, the other pages a screen tall: the card
    // eases between the two, from and to fixed heights, then lets go again
    if ((from === 0) !== (to === 0)) {
      clearTimeout(resizeEnd);
      card.style.height = `${card.offsetHeight}px`;
      void card.offsetHeight;
      card.classList.toggle("is-flipped", to !== 0);
      card.style.height = to === 0 ? `${faces[0].offsetHeight}px` : `${flippedHeight()}px`;
      resizeEnd = setTimeout(() => (card.style.height = ""), reducedMotion ? 0 : 450);
    }
    marks.forEach((mark) => mark.setAttribute("aria-current", String(mark.dataset.face === id)));
    focus?.focus({ preventScroll: true });
    // A card that is changing pages and height no longer holds still
    holdOff = true;
    placeRest();
    glideTo(top());
  };
  marks.forEach((mark) => mark.addEventListener("click", () => showFace(mark.dataset.face)));
  $("flip-back").addEventListener("click", () => showFace("about", marks[0]));
}

async function startTable() {
  try {
    const { createTable } = await import("./scene.js");
    // The skill bricks on the table carry the same skills as the intro
    const skills = [...document.querySelectorAll(".skill-tags li")].map((li) => li.textContent.trim());
    const table = await createTable($("table"), { skills, reducedMotion });
    window.addEventListener("resize", () => table.resize());
    tableUp = true;
    return table;
  } catch (error) {
    // No WebGL or no network for the libraries: the page stands on its own
    console.warn("Toy table unavailable", error);
    $("table").remove();
    openCurtain();
    return null;
  }
}

watchLoading();
const table = await startTable();
if (table) startSheet(table);

let toy = null;
if (table) {
  try {
    const { createToy } = await import("./toy.js");
    toy = createToy({ table, aim: $("aim"), fx: $("fx"), reducedMotion, carousel });
    // ?debug puts the table on the console, for checking the toy by hand
    if (new URLSearchParams(location.search).has("debug")) Object.assign(window, { toyTable: table, toy });
  } catch (error) {
    console.warn("Blaster unavailable", error);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tickSurfaces(now);
  if (table) {
    table.update(dt);
    if (toy) toy.update(dt, now);
    aimBeam();
    table.render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
