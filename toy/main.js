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
    return null;
  }
}

const table = await startTable();

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
