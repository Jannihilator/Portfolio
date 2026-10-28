/**
 * Builds the page first, so everything reads with no 3D at all, then
 * brings up the toy table under it and the crosshair over it.
 */
import { initCarousel } from "./carousel.js";
import { initOthers } from "./others.js";
import { initSurfaces, tickSurfaces } from "./surfaces.js";
import { estimate, SLOW_MS, showPart, stopSketch } from "./loading.js";

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const carousel = initCarousel({ track: $("track"), tabs: $("tabs"), prev: $("prev"), next: $("next") });
initOthers({ list: $("other-list"), dialog: $("peek"), body: $("peek-body"), close: $("peek-close") });
initSurfaces();

document.querySelectorAll("[data-goto]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = $(button.dataset.goto);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
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

/** The intro's height face up; the résumé side never moves where the sheet lands */
let frontHeight = 0;

/** Where the intro rests on the screen once the sheet has landed */
function introRest() {
  if (!intro.classList.contains("is-flipped") || !frontHeight) frontHeight = intro.offsetHeight;
  return Math.max(28, (window.innerHeight - frontHeight) / 2);
}

/** How far down the page the sheet has landed: the intro is then at its rest */
function landing() {
  const top = stage.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(intro).marginTop);
  return Math.max(1, top - introRest());
}

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
  const hold = !!sheetTable && !holdOff && introRest() > 28;
  document.documentElement.classList.toggle("has-hold", hold);
  stage.style.setProperty("--intro-rest", `${Math.round(introRest())}px`);
}

let queueUpdate = () => {};
{
  let queued = false;
  const update = () => {
    queued = false;
    if (!sheetTable) return;
    const p = splashProgress();
    if (p < 0.9) holdOff = false;
    placeRest();
    // The panel's own place, which the sheet comes to rest on
    sheetTable.setSheetProgress(p, $("about").getBoundingClientRect());
    const show = Math.min(1, Math.max(0, (p - 0.9) / 0.1));
    intro.style.opacity = show < 1 ? show.toFixed(3) : "";
    intro.style.pointerEvents = p < 1 ? "none" : "";
    // The work below waits until the intro is upright, so it never shows up beside the flying sheet
    document.body.classList.toggle("sheet-flying", p < 1);
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

async function paintSheet(table) {
  const picture = await renderSheet();
  table.setSheet(picture, sheetAspect());
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
  while (showPart()) {
    if (!reducedMotion) await wait(160);
  }
  // The last part's fade, and the whole sheet for a moment, before it goes
  await wait(reducedMotion ? 0 : 1100);
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
    intro.style.opacity = "";
    intro.style.pointerEvents = "";
    document.body.classList.remove("sheet-flying");
  }
}

// The Résumé button turns the intro card over to the résumé on its back;
// the PDF only loads the first time it is asked for
{
  const card = $("intro-flip");
  const front = $("about");
  const back = $("resume-side");
  const open = $("flip-resume");
  const frame = back.querySelector(".resume-frame");
  const turn = (toBack) => {
    if (toBack && !frame.src) frame.src = frame.dataset.src;
    card.classList.toggle("is-flipped", toBack);
    front.inert = toBack;
    back.inert = !toBack;
    open.setAttribute("aria-expanded", String(toBack));
    (toBack ? $("flip-back") : open).focus({ preventScroll: true });
    // A card that is turning and changing height no longer holds still
    holdOff = true;
    placeRest();
    card.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };
  open.addEventListener("click", () => turn(true));
  $("flip-back").addEventListener("click", () => turn(false));
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
    table.render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
