/**
 * Everything not on the board, as small thumbnails grouped the way
 * projects.js groups them. A thumbnail opens its project in a dialog.
 */
import { FEATURED } from "./carousel.js";
import { afterLoading } from "./loading.js";

const P = window.PortfolioProjects;

const GROUP_TITLES = {
  recent: "More projects",
  jams: "Game jams",
  past: "Past projects",
  prototypes: "Prototypes",
};

/** The grid's small copy of a picture (scripts/make-thumbs.py makes them) */
function thumbSrc(src) {
  const name = src.split("/").pop().replace(/\.[^.]+$/, "");
  return `./assets/thumbs/${name}.jpg`;
}

function thumbHtml(project) {
  const esc = P.escapeHtml;
  const shot = (project.media || []).find((item) => item.type === "image");
  const data = window.PROJECT_CONTRIBUTIONS || {};
  const line = String((data.awards || {})[project.id] || (data.taglines || {})[project.id] || "").trim();
  const tags = project.stack || [];
  return `<li>
    <button type="button" class="thumb" data-peek="${esc(project.id)}">
      <span class="thumb-shot">${shot ? `<img data-src="${esc(thumbSrc(shot.src))}" data-full="${esc(shot.src)}" alt="" decoding="async" />` : ""}</span>
      <span class="thumb-name">${esc(project.title)}</span>
      ${line ? `<span class="thumb-line">${esc(line)}</span>` : ""}
      ${tags.length ? `<span class="thumb-tags">${tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</span>` : ""}
    </button>
  </li>`;
}

export function initOthers({ list, dialog, body, close }) {
  const featured = new Set(FEATURED);
  list.innerHTML = P.sections
    .map((section) => {
      const rest = section.projects.filter((p) => !featured.has(p.id));
      if (!rest.length) return "";
      return `<section class="thumb-group">
        <h3>${P.escapeHtml(GROUP_TITLES[section.id] || section.title)}</h3>
        <ul class="thumb-grid">${rest.map(thumbHtml).join("")}</ul>
      </section>`;
    })
    .join("");

  // The browser's own lazy loading reaches a long way down the page, so the
  // thumbnails wait until they are about a screen away (and the page is up)
  const shots = [...list.querySelectorAll("img[data-src]")];
  const showShot = (img) => {
    // Without a small copy, the full picture
    img.addEventListener("error", () => (img.src = img.dataset.full), { once: true });
    img.src = img.dataset.src;
    delete img.dataset.src;
  };
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          showShot(entry.target);
          near.unobserve(entry.target);
        });
      },
      { rootMargin: "100% 0px" }
    );
    afterLoading(() => shots.forEach((img) => near.observe(img)));
  } else shots.forEach(showShot);

  let opener = null;

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-peek]");
    if (!button) return;
    const project = P.find(button.dataset.peek);
    if (!project) return;
    opener = button;
    P.renderDetail(body, project);
    const heading = body.querySelector("h1");
    if (heading) heading.id = "peek-title";
    dialog.showModal();
    body.scrollTop = 0;
  });

  close.addEventListener("click", () => dialog.close());
  // A click on the backdrop, outside the sheet, closes it too
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    P.stopMedia(body);
    body.innerHTML = "";
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  });
}
