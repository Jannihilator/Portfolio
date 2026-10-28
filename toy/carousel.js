/**
 * The featured projects, one paper slide each, on a sideways track that
 * snaps. Every slide keeps its own vertical scroll for the beats.
 */
import { afterLoading } from "./loading.js";

const P = window.PortfolioProjects;

export const FEATURED = ["xhaler", "borderless", "star-fishing", "renushu"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** "(In Development)" comes off the title and becomes a tag beside it. */
function splitTitle(title) {
  const match = String(title || "").match(/^(.*?)\s*\(\s*(in (?:progress|development))\s*\)\s*$/i);
  return match ? { name: match[1], status: "In development" } : { name: title, status: "" };
}

/** A still waiting in data-poster goes up */
function showPoster(video) {
  if (!video.dataset.poster) return;
  video.setAttribute("poster", video.dataset.poster);
  delete video.dataset.poster;
}

function heroImage(project) {
  return (project.media || []).find((item) => item.type === "image" && !item.detailOnly);
}

/** The demo video the old project card played, when the project has one */
function heroVideo(project) {
  return (project.media || []).find((item) => item.type === "video" && !item.detailOnly);
}

function heroHtml(project) {
  const esc = P.escapeHtml;
  const image = heroImage(project);
  const video = heroVideo(project);
  if (video) {
    // Plays only while its slide is on the board and in view; its still goes up once the board is near
    const fallback = video.fallback ? `data-fallback="${esc(video.fallback)}"` : "";
    return `<figure class="slide-hero"><video data-hero muted loop playsinline preload="none" ${fallback}
      ${image ? `data-poster="${esc(image.src)}"` : ""} aria-label="${esc(project.title)} demo"><source src="${esc(video.src)}" type="video/mp4" /></video></figure>`;
  }
  return image ? `<figure class="slide-hero"><img src="${esc(image.src)}" alt="${esc(image.alt || "")}" loading="lazy" decoding="async" /></figure>` : "";
}

/** Team, role and timeline, under the demo reel */
function factsHtml(project) {
  const esc = P.escapeHtml;
  const rows = [
    ["Team", project.team && esc(project.team)],
    [
      "Role",
      project.role &&
        `${esc(project.role)}${project.duties ? `<span class="slide-duties">${esc(project.duties)}</span>` : ""}`,
    ],
    ["Timeline", project.timeline && esc(project.timeline)],
  ].filter(([, value]) => value);
  if (!rows.length) return "";
  return `<dl class="slide-facts">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}

function slideHtml(project, i, total) {
  const esc = P.escapeHtml;
  const parsed = splitTitle(project.title);
  const name = parsed.name;
  const status = project.status || parsed.status;
  const placeholder = project.placeholder
    ? `<p class="slide-note">Placeholder beats. The real working process goes here.</p>`
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
        <div class="slide-lead-media">
          ${heroHtml(project)}
          ${factsHtml(project)}
        </div>
        <div class="slide-lead-copy">
          ${P.contributionsHtml(project)}
          ${project.description ? `<p class="slide-desc">${esc(project.description)}</p>` : ""}
          ${links ? `<div class="slide-links">${links}</div>` : ""}
        </div>
      </div>
      <h3 class="slide-process">Working process</h3>
      ${placeholder}
      ${P.beatsHtml(project)}
      ${trailer}
    </div>
  </article>`;
}

export function initCarousel({ track, tabs, onChange }) {
  const projects = FEATURED.map((id) => P.find(id)).filter(Boolean);
  track.innerHTML = projects.map((p, i) => slideHtml(p, i, projects.length)).join("");
  tabs.innerHTML = projects
    .map(
      (p, i) =>
        `<button type="button" class="bookmark" data-slide="${i}">${P.escapeHtml(splitTitle(p.title).name)}</button>`
    )
    .join("");

  const slides = [...track.querySelectorAll(".slide")];
  const tabButtons = [...tabs.querySelectorAll("button")];
  const embedsMounted = new Set();
  let active = -1;

  P.bindBeatPlayers(track);

  function playHero(video) {
    if (reduceMotion.matches) return;
    P.watchStall(video);
    // A clip that never got its source going (a play() while the board was
    // still hidden) starts its fetch again
    if (video.readyState === HTMLMediaElement.HAVE_NOTHING && video.networkState !== HTMLMediaElement.NETWORK_LOADING) {
      video.load();
    }
    video.play().catch(() => {});
  }

  function activeHero() {
    return active >= 0 ? slides[active].querySelector("video[data-hero]") : null;
  }

  // A reel only starts once it is in view, so nothing downloads while the
  // board is still far down the page (and phones refuse a play() until then)
  const heroes = slides.map((slide) => slide.querySelector("video[data-hero]")).filter(Boolean);
  const inView = new Set("IntersectionObserver" in window ? [] : heroes);
  if ("IntersectionObserver" in window) {
    const heroWatch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) inView.add(video);
        else inView.delete(video);
        if (video !== activeHero()) return;
        if (entry.isIntersecting) {
          if (video.paused) playHero(video);
        } else video.pause();
      });
    }, { threshold: 0.25 });
    heroes.forEach((video) => heroWatch.observe(video));
    // Every slide's still at once, as the board comes near, so paging along never shows an empty frame
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      heroes.forEach(showPoster);
      near.disconnect();
    }, { rootMargin: "50% 0px" });
    afterLoading(() => near.observe(track));
  } else heroes.forEach(showPoster);

  // Low Power Mode on iOS holds muted autoplay until the first touch
  const wake = () => {
    const video = activeHero();
    if (video && video.paused && inView.has(video)) playHero(video);
  };
  document.addEventListener("touchend", wake, { once: true, passive: true });
  document.addEventListener("click", wake, { once: true });

  function setActive(i) {
    if (i === active) return;
    active = i;
    slides.forEach((slide, j) => {
      // Slides off the board are out of the tab order until they come round
      slide.toggleAttribute("inert", j !== i);
      slide.setAttribute("aria-hidden", j !== i ? "true" : "false");
    });
    tabButtons.forEach((b, j) => b.setAttribute("aria-current", j === i ? "true" : "false"));
    slides.forEach((slide, j) => {
      const video = slide.querySelector("video[data-hero]");
      if (!video) return;
      if (j === i && inView.has(video)) playHero(video);
      else if (j !== i) video.pause();
    });
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
