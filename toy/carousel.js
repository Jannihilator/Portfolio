/**
 * The featured projects, one paper slide each, on a sideways track that
 * snaps. Every slide keeps its own vertical scroll for the beats.
 */
const P = window.PortfolioProjects;

export const FEATURED = ["star-fishing", "borderless", "renushu", "xhaler", "wool-you-mask-it"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** "(In Development)" comes off the title and becomes a tag beside it. */
function splitTitle(title) {
  const match = String(title || "").match(/^(.*?)\s*\(\s*(in (?:progress|development))\s*\)\s*$/i);
  return match ? { name: match[1], status: "In development" } : { name: title, status: "" };
}

function heroImage(project) {
  return (project.media || []).find((item) => item.type === "image" && !item.detailOnly);
}

function slideHtml(project, i, total) {
  const esc = P.escapeHtml;
  const { name, status } = splitTitle(project.title);
  const hero = heroImage(project);
  const placeholder = project.placeholder
    ? `<p class="slide-note">Placeholder beats. The real thinking process goes here.</p>`
    : "";
  const links = [
    project.href
      ? `<a class="block-btn block-btn--link" href="${esc(project.href)}" target="_blank" rel="noopener noreferrer">Project website</a>`
      : "",
  ].join("");
  const trailer = project.iframe
    ? `<section class="beat slide-trailer"><h3>Trailer</h3><div class="project-embed" data-embed></div></section>`
    : "";
  return `<article class="slide panel" data-panel data-project="${esc(project.id)}"
      role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${esc(name)}">
    <div class="slide-scroll" data-scroll tabindex="0" aria-label="${esc(name)}, scrolls">
      <header class="slide-head">
        <span class="slide-count" aria-hidden="true">${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
        ${P.awardHtml(project)}
        <h2>${esc(name)}${status ? ` <span class="slide-status">${esc(status)}</span>` : ""}</h2>
        ${P.stackHtml(project.stack)}
      </header>
      <div class="slide-lead">
        ${hero ? `<figure class="slide-hero"><img src="${esc(hero.src)}" alt="${esc(hero.alt || "")}" loading="lazy" decoding="async" /></figure>` : ""}
        <div class="slide-lead-copy">
          ${P.contributionsHtml(project)}
          ${project.description ? `<p class="slide-desc">${esc(project.description)}</p>` : ""}
          ${links ? `<div class="slide-links">${links}</div>` : ""}
        </div>
      </div>
      <h3 class="slide-process">Thinking process</h3>
      ${placeholder}
      ${P.beatsHtml(project)}
      ${trailer}
    </div>
  </article>`;
}

export function initCarousel({ track, tabs, prev, next, onChange }) {
  const projects = FEATURED.map((id) => P.find(id)).filter(Boolean);
  track.innerHTML = projects.map((p, i) => slideHtml(p, i, projects.length)).join("");
  tabs.innerHTML = projects
    .map(
      (p, i) =>
        `<button type="button" class="block-btn block-btn--tab" data-slide="${i}">${P.escapeHtml(splitTitle(p.title).name)}</button>`
    )
    .join("");

  const slides = [...track.querySelectorAll(".slide")];
  const tabButtons = [...tabs.querySelectorAll("button")];
  const embedsMounted = new Set();
  let active = -1;

  P.bindBeatPlayers(track);

  function setActive(i) {
    if (i === active) return;
    active = i;
    slides.forEach((slide, j) => {
      // Slides off the board are out of the tab order until they come round
      slide.toggleAttribute("inert", j !== i);
      slide.setAttribute("aria-hidden", j !== i ? "true" : "false");
    });
    tabButtons.forEach((b, j) => b.setAttribute("aria-current", j === i ? "true" : "false"));
    prev.disabled = i <= 0;
    next.disabled = i >= slides.length - 1;
    // The trailer only loads once someone is on its slide
    const project = projects[i];
    const host = slides[i].querySelector("[data-embed]");
    if (host && !embedsMounted.has(i)) {
      embedsMounted.add(i);
      P.mountEmbed(host, project.iframe, project.title);
    }
    if (onChange) onChange(i, project);
  }

  function current() {
    const w = track.clientWidth || 1;
    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
  }

  function go(i) {
    const target = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
    // Arrow presses should not wait for the scroll to settle before the
    // tabs and the tab order catch up
    setActive(target);
  }

  let settleTimer = 0;
  track.addEventListener("scroll", () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => setActive(current()), 90);
  });

  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-slide]");
    if (button) go(Number(button.dataset.slide));
  });

  // Left and right page the board whenever focus is on it
  track.closest(".board").addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest("input, textarea, select, iframe")) return;
    if (event.key === "ArrowLeft") go(active - 1);
    else if (event.key === "ArrowRight") go(active + 1);
    else return;
    event.preventDefault();
  });

  // A resize keeps the same slide on the board
  new ResizeObserver(() => {
    if (active >= 0) track.scrollLeft = active * track.clientWidth;
  }).observe(track);

  setActive(0);
  return { go, get active() { return active; }, slides };
}
