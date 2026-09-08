/**
 * Portfolio projects, ported from the previous site's cards + modals.
 * Clicking a card swaps to the info view in the same panel.
 */
window.PORTFOLIO_PROJECTS = [
  {
    id: "recent",
    title: "Recent Projects",
    layout: "stack",
    projects: [
      {
        id: "rain-to-serene",
        title: "Rain to Serene (In Progress)",
        size: "big",
        media: [{ type: "video", src: "./assets/rain-demo.mp4" }],
        description:
          "A serene incremental game where rain falls on lily pads to earn drops, spent on expanding the pond through two distinct upgrade paths across rain and sunny phases. Every ephemeral element (raindrops, ripple effects, leaf splashes, water beads, floating score popups, frogs) runs through object pools to keep low memory allocations. The water surface is a custom shader driven by a ping-pong render texture wave simulation, while each lily pad carries unique procedurally-assigned shader properties.",
        stack: ["Shader", "Object Pooling"],
        iframe:
          "https://drive.google.com/file/d/1Udm21wbATYzfJfTBL4Q8_MjhB9S8pgze/preview",
      },
      {
        id: "borderless",
        title: "Borderless",
        size: "big",
        media: [{ type: "video", src: "./assets/borderless-website.mp4" }],
        description:
          "Big Picture Studio is an interdisciplinary team innovating a new medium across 4 mobile phones by creating a 20-minute, cooperative puzzle-narrative seamlessly integrating film narrative, game design, and comic art storytelling.",
        stack: ["Networking", "Mobile", "Puzzle"],
        href: "https://projects.etc.cmu.edu/big-picture-studio/",
        iframe: "https://www.youtube.com/embed/ulOF7EMQaaA?si=Ya-9DIRYZQONljsz",
      },
      {
        id: "renushu",
        title: "ReNushu",
        size: "big",
        media: [
          { type: "image", src: "./assets/renushu-game.png", alt: "ReNushu gameplay" },
          { type: "image", src: "./assets/renushu-pt.jpeg", alt: "ReNushu physical therapy" },
        ],
        description:
          "ReNUSHU at CMU’s Entertainment Technology Center partners with Magnes AG to build an exergame that makes physical therapy fun and measurable with NuShu smart shoes for gait sensing and haptic feedback. From rehab to play, from play to progress, every step is progress you can see and measure.",
        stack: ["Local Networking", "Web", "Sensor"],
        href: "https://projects.etc.cmu.edu/renushu/",
        iframe: "https://www.youtube.com/embed/Ba08R8ydzJk?si=unLnzsuObv6Sbwyk",
      },
      {
        id: "xhaler",
        title: "XHaler",
        size: "big",
        media: [
          { type: "image", src: "./assets/xhaler-archer.png", alt: "XHaler archer prototype" },
          { type: "image", src: "./assets/xhaler-dive.png", alt: "XHaler dive prototype" },
        ],
        description:
          "Xhaler is a student-driven project exploring the use of breathing as a game input. By developing prototypes that map different breathing patterns to in-game actions, we aim to enhance immersion in virtual reality.",
        stack: ["VR", "Python", "Arduino"],
        href: "https://projects.etc.cmu.edu/xhaler/about-us/",
        iframe: "https://www.youtube.com/embed/fUHDFnX35RE?si=fEktM0qxvHswPbne",
      },
    ],
  },
  {
    id: "jams",
    title: "Game Jams",
    layout: "grid",
    projects: [
      {
        id: "wool-you-mask-it",
        title: "Wool You Mask It",
        media: [{ type: "image", src: "./assets/sheep.png", alt: "Wool You Mask It" }],
        description:
          'A Global Game Jam 2026 submission for the theme "Mask". Programmed organic herding animal behaviors with state machine. Implemented special mask abilities that cross influence the animals.',
        stack: ["Unity", "Local Multiplayer", "Animal AI"],
        iframe: "https://www.youtube.com/embed/h6fDWDABDJI?si=jGGutDBmGCm1bqKO",
      },
      {
        id: "voice-in-the-void",
        title: "Voice in the Void",
        media: [{ type: "image", src: "./assets/void.png", alt: "Voice in the Void" }],
        description:
          'A thatgamecompany × COREBLAZER GAME JAM 2025 submission for the theme "Gererousity," created in two days. It\'s a chat-based game where players show generosity to aliens whose encrypted messages gradually become clearer, eventually receiving gifts that decorate their home planets as symbols of connection.',
        stack: ["Unity", "Open AI api"],
        href: "https://yenchun.itch.io/voice-in-the-void",
      },
      {
        id: "moustache-twins",
        title: "Moustache Twins",
        media: [{ type: "image", src: "./assets/twin.png", alt: "Moustache Twins" }],
        description:
          'A Garena Game Jam 2025 submission for the theme "Super Hero," created in two days. It\'s a cooperative arcade game that challange the player to coordinate with each other while dodging cheetos and saving people.',
        stack: ["Unity", "Online Leaderboard"],
        href: "https://loyiwu.itch.io/moustache-twins",
      },
      {
        id: "mento-issue",
        title: "Mento-Issue",
        media: [{ type: "image", src: "./assets/mento.png", alt: "Mento-Issue" }],
        description:
          'A Global Game Jam 2025 submission for the theme "Bubble," created in two days. It\'s a puzzle platformer with 10 levels, where players use Mentos and soda bottles to strategically elevate themselves. The game won the Pittsburgh site non-traditional award for its creative approach.',
        stack: ["Unity", "Level Design"],
        href: "https://yenchun.itch.io/mento-issue",
      },
      {
        id: "no-sight-all-might",
        title: "No Sight All Might",
        media: [{ type: "image", src: "./assets/nosight.png", alt: "No Sight All Might" }],
        description:
          'A 1-bit Jam 2024 submission for the theme "Light and Dark." Players control a ball while dodging enemies. The twist is that players can only attack enemies when they’re out of sight, requiring them to anticipate movements and track them in the dark.',
        stack: ["Unity", "Skill System", "Boss Fight"],
        href: "https://yenchun.itch.io/no-sight-all-might",
      },
      {
        id: "reefenge",
        title: "Reefenge",
        media: [{ type: "image", src: "./assets/reefenge.png", alt: "Reefenge" }],
        description:
          'A game for GMTK Game Jam 2023 titled "Roles-Reverse." In this bullet hell game, players control the enemy ships instead of the player, with the goal of eliminating the player\'s ship as quickly as possible. Resource management and strategic troop deployment are key.',
        stack: ["Unity"],
        href: "https://yenchun.itch.io/reefenge",
      },
    ],
  },
  {
    id: "past",
    title: "Past Projects",
    layout: "grid",
    projects: [
      {
        id: "gpt-battle",
        title: "GPT Battle",
        media: [{ type: "image", src: "./assets/gpt.png", alt: "GPT Battle" }],
        description:
          "A 2v2 wizard spell battle where spells are created by shouting them out loud. The microphone transcribes the voice, and ChatGPT interprets it through carefully designed rules to offer a corresponding spell.",
        stack: ["Unity", "Shader", "VFX Graph"],
        iframe:
          "https://drive.google.com/file/d/180ETl7H-uREpvFuKvvtqr6q_F-UW0wGZ/preview",
      },
      {
        id: "keep-your-head-up",
        title: "Keep Your Head Up",
        media: [{ type: "image", src: "./assets/snowman.png", alt: "Keep Your Head Up" }],
        description:
          "Using two 3D Rudders as input, where both players put there feet on the rudders. One player controling the head's movement while the other is tilting the entire map. Chaotic fun between players and the environment.",
        stack: ["Unity", "3D Rudder"],
        iframe:
          "https://drive.google.com/file/d/1FJYkTiRtiy5pZPC0bid_faIG67U2nox1/preview",
      },
      {
        id: "bar-vr",
        title: "Bar VR",
        media: [{ type: "image", src: "./assets/bar.png", alt: "Bar VR" }],
        description:
          "A VR bar fighting experience where player engages in a card game followed by throwing and dodging glass bottles. Customized hand grabbing and throwing to bypass hardware limitations.",
        stack: ["Unity", "VR", "Hand Gesture"],
        iframe:
          "https://drive.google.com/file/d/1u-qRbpnzGRsChvOJRoRvUrrPOzW0WTQQ/preview",
      },
      {
        id: "meow-spa",
        title: "Meow Spa",
        media: [{ type: "image", src: "./assets/cat.png", alt: "Meow Spa" }],
        description:
          "A two player game using buttons to control the conveyor belt and the machines. The game is desinged to challange coordination between players by putting the correct washing procedure on cats.",
        stack: ["Unity", "Adaptive Controllers"],
        iframe:
          "https://drive.google.com/file/d/1Kq54EDSm5exo5r31GHUDo-qaoCR2mZXG/preview",
      },
      {
        id: "qduel",
        title: "Q*duel",
        media: [{ type: "image", src: "./assets/qduel.png", alt: "Q*duel" }],
        description:
          "Inspired by the arcade game Q*bert, this game turns the classic into a local two player area control challange. Color the cube to your color to win, and watch out for the environment!",
        stack: ["Unity", "Enemy AI", "Vocal SFX"],
        href: "https://yenchun.itch.io/qduel",
      },
      {
        id: "virtual-gallery",
        title: "3D Virtual Gallery",
        media: [{ type: "image", src: "./assets/gallery.png", alt: "3D Virtual Gallery" }],
        description:
          "An online gallery showcasing past student works of Prof. Ei Jane Janet Lin. Explored various possibility of how art can be presented in a digital way. Implemented interesting mechanism where visitors can interact with art or the gallery itself, such as painting on the wall, taking the travelator, etc.",
        stack: ["JavaScript", "3D", "HTML/CSS"],
        href: "https://jannihilator.github.io/Virtual-Gallery/",
        iframe:
          "https://drive.google.com/file/d/1VmaGXVE7c82ZA8KSUYO9l4r9jqV6ZxNV/preview",
      },
      {
        id: "hand-motion",
        title: "Hand Motion",
        media: [{ type: "image", src: "./assets/hand.png", alt: "Hand Motion Recognition" }],
        description:
          "A hand motion recognition tool using MediaPipe's solution. It not only recognizes static gestures but also movements. Users will be able to browse through web pages by scrolling with their hand mid air, reducing human contact during epidemic times. Later transformed into a game of shooting faces.",
        stack: ["Python", "MediaPipe", "Raspberry Pi"],
        iframe:
          "https://drive.google.com/file/d/1WYP1o24g-h2uRECVJx0-WsvQZa_qck2g/preview",
      },
      {
        id: "duel-zone",
        title: "Duel zone",
        media: [{ type: "image", src: "./assets/duelzone.png", alt: "Duel zone" }],
        description:
          "Duel zone is a two player card and area control game. Players manage their action cards to play them in the most efficient sequence. Win by either claim the most territory, develop techs or simply knock the opponent out. The game is about strategizing and anticipating moves of your opponent.",
        stack: ["Board Game", "Paper Prototype"],
        href: "./assets/duelzone.pdf",
      },
    ],
  },
  {
    id: "prototypes",
    title: "Prototypes",
    layout: "grid",
    projects: [
      {
        id: "pencil-shoot",
        title: "Pencil Shoot",
        media: [{ type: "image", src: "./assets/pencil.png", alt: "Pencil Shoot" }],
        description: "",
        stack: ["Unity", "Tile Map"],
      },
      {
        id: "slash-moji",
        title: "Slash-Moji",
        media: [{ type: "image", src: "./assets/dash.png", alt: "Slash-Moji" }],
        description: "",
        stack: ["Unity", "2D Destruction"],
      },
      {
        id: "ghost-hunt",
        title: "Ghost Hunt",
        media: [{ type: "image", src: "./assets/ghost.png", alt: "Ghost Hunt" }],
        description: "",
        stack: ["Unity", "Networking"],
      },
    ],
  },
];

(function (projects) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findProject(id) {
    for (const section of projects) {
      const match = section.projects.find((p) => p.id === id);
      if (match) return match;
    }
    return null;
  }

  function mediaHtml(items, extraClass) {
    if (!items || !items.length) return "";
    const bits = items
      .map((item) => {
        if (item.type === "video") {
          return `<video class="${extraClass}" muted loop playsinline>
            <source src="${escapeHtml(item.src)}" type="video/mp4" />
          </video>`;
        }
        return `<img class="${extraClass}" src="${escapeHtml(item.src)}" alt="${escapeHtml(
          item.alt || ""
        )}" loading="lazy" decoding="async" />`;
      })
      .join("");
    return `<div class="project-card-media">${bits}</div>`;
  }

  function stackHtml(stack) {
    if (!stack || !stack.length) return "";
    return `<ul class="project-stack">${stack
      .map((tag) => `<li>${escapeHtml(tag)}</li>`)
      .join("")}</ul>`;
  }

  function linkHtml(href, label) {
    if (!href) return "";
    return `<a class="pixel-btn project-link" href="${escapeHtml(
      href
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || "Open")}</a>`;
  }

  function parseUrl(url) {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  function isYoutube(url) {
    const host = parseUrl(url)?.hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtube-nocookie.com";
  }

  function youtubeId(url) {
    const parsed = parseUrl(url);
    if (!parsed) return "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedAt = parts.indexOf("embed");
    return embedAt >= 0 ? parts[embedAt + 1] || "" : "";
  }

  function canSendReferrer() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  /** YouTube 153: identify this page as the embed host before the player loads. */
  function embedSrc(url) {
    const parsed = parseUrl(url);
    if (!parsed || !isYoutube(url) || !canSendReferrer()) return url;
    parsed.searchParams.set("enablejsapi", "1");
    parsed.searchParams.set("origin", location.origin);
    parsed.searchParams.set("widget_referrer", location.origin);
    return parsed.toString();
  }

  function mountYoutubeFallback(host, url, title) {
    const id = youtubeId(url);
    const watch = id ? `https://www.youtube.com/watch?v=${id}` : url;
    const link = document.createElement("a");
    link.className = "project-embed-fallback";
    link.href = watch;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Watch ${title} on YouTube`);
    if (id) {
      const img = document.createElement("img");
      img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      img.alt = "";
      link.appendChild(img);
    }
    const label = document.createElement("span");
    label.textContent = "Watch on YouTube";
    link.appendChild(label);
    host.appendChild(link);
  }

  /**
   * Build the iframe in the DOM so referrerPolicy is set before src.
   * innerHTML with src first lets the player request fire with no Referer,
   * which is YouTube error 153. file:// has no origin at all, so fall back
   * to a thumbnail that opens the video on YouTube.
   */
  function mountEmbed(host, url, title) {
    host.replaceChildren();
    if (isYoutube(url) && !canSendReferrer()) {
      mountYoutubeFallback(host, url, title);
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = title;
    iframe.allowFullscreen = true;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    host.appendChild(iframe);
    iframe.src = embedSrc(url);
  }

  function renderList(container) {
    container.innerHTML = projects
      .map((section) => {
        const cards = section.projects
          .map((project) => {
            const sizeClass = project.size === "big" ? " project-card--big" : "";
            return `<article class="project-card${sizeClass}" data-project-id="${escapeHtml(
              project.id
            )}" tabindex="0">
              ${mediaHtml(project.media, "project-thumb")}
              <h3>${escapeHtml(project.title)}</h3>
              ${stackHtml(project.stack)}
            </article>`;
          })
          .join("");
        return `<section class="projects-section">
          <h2>${escapeHtml(section.title)}</h2>
          <div class="projects-${section.layout}">${cards}</div>
        </section>`;
      })
      .join("");
  }

  function renderDetail(container, project) {
    if (!project) {
      container.innerHTML = "";
      return;
    }
    const desc = project.description ? `<p>${escapeHtml(project.description)}</p>` : "";
    container.innerHTML = `
      <div class="project-detail">
        <h1>${escapeHtml(project.title)}</h1>
        ${project.iframe ? `<div class="project-embed" data-embed></div>` : mediaHtml(project.media, "project-detail-media")}
        ${desc}
        ${stackHtml(project.stack)}
        ${linkHtml(project.href, "Project website")}
      </div>`;
    const host = container.querySelector("[data-embed]");
    if (host) mountEmbed(host, project.iframe, project.title);
  }

  function stopMedia(root) {
    if (!root) return;
    root.querySelectorAll("video").forEach((video) => {
      video.pause();
    });
    root.querySelectorAll("iframe").forEach((frame) => {
      frame.src = "";
    });
  }

  window.PortfolioProjects = {
    sections: projects,
    find: findProject,
    renderList,
    renderDetail,
    stopMedia,
  };
})(window.PORTFOLIO_PROJECTS);
