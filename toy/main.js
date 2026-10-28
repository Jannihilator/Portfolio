/**
 * Builds the page first, so everything reads with no 3D at all, then
 * brings up the toy table under it and the crosshair over it.
 */
import { initCarousel } from "./carousel.js";
import { initOthers } from "./others.js";
import { initSurfaces, tickSurfaces } from "./surfaces.js";

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
const splash = $("splash");
const intro = $("intro-flip");
$("about").tabIndex = -1;
/** The toy table, once it is up and has the intro's picture */
let sheetTable = null;

function splashProgress() {
  const span = splash.offsetHeight;
  // A scroll can stop a fraction of a pixel short; that counts as up
  const raw = span > 0 ? window.scrollY / span : 1;
  return raw > 0.995 ? 1 : Math.max(0, raw);
}

{
  let queued = false;
  const update = () => {
    queued = false;
    if (!sheetTable) return;
    const p = splashProgress();
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
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("sheet-ready", queue);
}

/** Paints the intro panel into a picture for the sheet on the table */
async function renderSheet() {
  const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js");
  return html2canvas($("about"), {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.25,
    logging: false,
    onclone: (doc) => {
      doc.getElementById("intro-flip").style.opacity = "1";
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
// line sketch of the table, with a pencil at work on the intro. When all is
// ready the mist lifts off.
const curtain = $("curtain");
let sheetLoading = !!curtain;
const NOTES = ["Sharpening the pencils…", "Smoothing out the creases…", "Dusting off the résumé…", "Unfolding the intro…"];

function startNotes() {
  if (!curtain) return;
  let n = 0;
  const timer = setInterval(() => {
    if (!sheetLoading || n >= NOTES.length - 1) return clearInterval(timer);
    $("curtain-note").textContent = NOTES[++n];
  }, 2200);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The sketch's parts still to come fade in quickly, one after another; the
 * whole sheet shows for a moment, then the mist lifts and the table shows
 */
async function openCurtain() {
  if (!sheetLoading) return;
  sheetLoading = false;
  $("curtain-note").textContent = NOTES[NOTES.length - 1];
  const fades = [...curtain.querySelectorAll(".sketch-layer")].flatMap((layer) => layer.getAnimations());
  let next = 0;
  for (const fade of fades) {
    // Not yet begun: it starts soon, a beat after the one before it
    if (fade.currentTime < fade.effect.getComputedTiming().delay) {
      fade.effect.updateTiming({ delay: fade.currentTime + next * 160, duration: 320 });
      next++;
    }
  }
  if (reducedMotion) fades.forEach((fade) => fade.finish());
  await Promise.all(fades.map((fade) => fade.finished));
  // The whole sheet, for a moment, before it goes
  await wait(reducedMotion ? 0 : 800);
  curtain.classList.add("is-clearing");
  document.documentElement.classList.remove("sheet-loading");
  await wait(reducedMotion ? 350 : 2400);
  curtain.remove();
}

async function startSheet(table) {
  if (!splash.offsetHeight) return openCurtain();
  try {
    await document.fonts.ready;
    await paintSheet(table);
    await openCurtain();
    $("table").addEventListener("pickup", () => {
      if (sheetLoading || splashProgress() >= 1) return;
      window.scrollTo({ top: splash.offsetHeight, behavior: reducedMotion ? "auto" : "smooth" });
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
    return table;
  } catch (error) {
    // No WebGL or no network for the libraries: the page stands on its own
    console.warn("Toy table unavailable", error);
    $("table").remove();
    openCurtain();
    return null;
  }
}

startNotes();
// Never leave the page stuck behind the curtain
setTimeout(() => openCurtain(), 45000);
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
