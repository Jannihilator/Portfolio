/**
 * Portfolio projects, ported from the previous site's cards + modals.
 * Clicking a card swaps to the info view in the same panel.
 */
window.PORTFOLIO_PROJECTS = [
  {
    id: "recent",
    title: "Notable Projects",
    layout: "stack",
    projects: [
      {
        id: "star-fishing",
        title: "Star Fishing (In Development)",
        size: "big",
        media: [
          { type: "image", src: "./assets/star-fishing.png", alt: "Star Fishing" },
          { type: "video", src: "./assets/Shooting_Star_Medias/demo.mp4" },
        ],
        description:
          "A game about fishing for shooting stars and collecting constellations.",
        stack: ["Shader", "Upgrade / Ability System", "Skill Tree"],
        beats: [
          {
            blocks: [
              {
                type: "text",
                text: "I started with the sky. Adding foreground water, fog and reflection to bring it to life.",
              },
              {
                type: "row",
                cols: 3,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/just_sky.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/just_sky.jpg",
                    caption: "Sky only",
                    note: "Flat sky with no focal point.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/water_no_fog.mp4",
                    caption: "Water shader",
                    note: "Adding foreground water shader with waves and glints.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/fog_reflection.mp4",
                    caption: "Fog and reflection",
                    note: "The cut looks fake, adding fog and a blurred edge blend sky and water.",
                  },
                ],
              },
            ],
          },
          {
            blocks: [
              {
                type: "text",
                text: "I made the first stars with a particle system, however colliders on particles are bot the best way to tell if you hit one, so each star became a prefab with a trail and its own particles. I also wanted an avatar for the player to project their actions into the game for better immersiveness, so I added a fishing boat to the foreground.",
              },
              {
                type: "row",
                cols: 2,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/prefab.mp4",
                    caption: "Prefab",
                    note: "A collider on a particle is a bad hit test, so each star is a prefab with a trail and its own particles.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/fishing_particles.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/fishing_particles.jpg",
                    caption: "Boat",
                    note: "A boat as a focal point. However the shooting stars lies disconnected in the background layer.",
                  },
                ],
              },
            ],
          },
          {
            blocks: [
              {
                type: "text",
                text: "Using 2D stars as the interactable layer, it offers clarity and allows for different rarity and looks. Which will be used as our main progression of the game to collect rare stars and complete constellation. In addition, I don't want catching to be too easy, so the spin aims on a timed click and the line flings out along the tangent. Problem is you end up staring at the spin instead of the sky, so I changed it to a mouse drag and swing making the rod cast out and waits until a star is close, fully portrays the star fishing fantasy.",
              },
              {
                type: "row",
                cols: 2,
                items: [
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/spin_cast.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/spin_cast.png",
                    caption: "Spin cast",
                    note: "A timed click flings the line along the tangent. Harder on purpose, so windup, homing, and guiding lines fit, but you stop watching the sky.",
                  },
                  {
                    type: "video",
                    src: "./assets/Shooting_Star_Medias/lay_cast.mp4",
                    poster: "./assets/Shooting_Star_Medias/posters/lay_cast.png",
                    caption: "Lay cast",
                    note: "You swing the mouse out and the rod waits until a star is close. Closer to real fishing, where you sit and wait.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "borderless",
        title: "Borderless",
        size: "big",
        media: [
          { type: "image", src: "./assets/borderless-phones.png", alt: "Borderless on four phones" },
          { type: "video", src: "./assets/borderless-website.mp4" },
        ],
        description:
          "Big Picture Studio is an interdisciplinary team innovating a new medium across 4 mobile phones by creating a 20-minute, cooperative puzzle-narrative seamlessly integrating film narrative, game design, and comic art storytelling.",
        stack: ["Networking", "Mobile", "Puzzle"],
        href: "https://projects.etc.cmu.edu/big-picture-studio/",
        iframe: "https://www.youtube.com/embed/ulOF7EMQaaA?si=Ya-9DIRYZQONljsz",
      },
      {
        id: "renushu",
        title: "Camp Movewell",
        size: "big",
        media: [
          { type: "image", src: "./assets/renushu-game.png", alt: "Camp Movewell gameplay" },
          { type: "image", src: "./assets/renushu-pt.jpeg", alt: "Camp Movewell physical therapy" },
          {
            type: "image",
            src: "./assets/g4c.jpeg",
            alt: "The Camp Movewell team at the 2026 Games for Change Awards",
            detailOnly: true,
          },
        ],
        description:
          "Camp Movewell, from the ReNUSHU team at CMU’s Entertainment Technology Center with Magnes AG, is an exergame that makes physical therapy fun and measurable with NuShu smart shoes for gait sensing and haptic feedback. From rehab to play, from play to progress, every step is progress you can see and measure.",
        stack: ["Local Networking", "Web", "Sensor"],
        href: "https://projects.etc.cmu.edu/renushu/",
        iframe: "https://www.youtube.com/embed/Ba08R8ydzJk?si=unLnzsuObv6Sbwyk",
      },
      {
        id: "serainity",
        title: "Serainity (In Development)",
        size: "big",
        media: [
          { type: "image", src: "./assets/rain-to-serene.png", alt: "Serainity" },
          { type: "video", src: "./assets/rain-demo.mp4" },
        ],
        description:
          "A serene incremental game where rain falls on lily pads to earn drops, spent on expanding the pond through two distinct upgrade paths across rain and sunny phases. Every ephemeral element (raindrops, ripple effects, leaf splashes, water beads, floating score popups, frogs) runs through object pools to keep low memory allocations. The water surface is a custom shader driven by a ping-pong render texture wave simulation, while each lily pad carries unique procedurally-assigned shader properties.",
        stack: ["Shader", "Object Pooling"],
        iframe:
          "https://drive.google.com/file/d/1Udm21wbATYzfJfTBL4Q8_MjhB9S8pgze/preview",
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
        media: [
          { type: "image", src: "./assets/mento.png", alt: "Mento-Issue" },
          { type: "video", src: "./assets/MentoIssueDemo.mp4" },
        ],
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

  function cardItems(project) {
    return (project.media || []).filter((item) => !item.detailOnly);
  }

  function featuredMedia(project) {
    const items = cardItems(project);
    const video = items.find((item) => item.type === "video");
    return video ? [video] : items;
  }

  /** Wide cards show still and clip together. A grid card stays on the still. */
  function cardMedia(project) {
    const items = cardItems(project);
    if (project.size === "big") return items;
    const stills = items.filter((item) => item.type !== "video");
    return stills.length ? stills : items;
  }

  function passCaption(block) {
    return block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
  }

  function passNote(block) {
    return block.note ? `<p class="pass-note">${escapeHtml(block.note)}</p>` : "";
  }

  function passBox(media, block) {
    return `<div class="pass-box">${media}${passNote(block)}</div>`;
  }

  function passVideoHtml(block) {
    const poster = block.poster ? ` poster="${escapeHtml(block.poster)}"` : "";
    const media = `<video class="beat-video" muted loop playsinline autoplay preload="metadata"${poster} src="${escapeHtml(
      block.src
    )}"></video>`;
    return `<figure class="pass">
      ${passCaption(block)}
      ${passBox(media, block)}
    </figure>`;
  }

  function passItemHtml(block) {
    if (block.type === "image") {
      const media = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" />`;
      return `<figure class="pass">
        ${passCaption(block)}
        ${passBox(media, block)}
      </figure>`;
    }
    return passVideoHtml(block);
  }

  function beatBlockHtml(block) {
    if (block.type === "text") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "row") {
      const cols = block.cols === 2 || block.cols === 3 ? ` cols-${block.cols}` : "";
      return `<div class="pass-row${cols}">${(block.items || []).map(passItemHtml).join("")}</div>`;
    }
    return "";
  }

  function beatsHtml(project) {
    if (!Array.isArray(project.beats) || !project.beats.length) return "";
    return project.beats
      .map((beat) => {
        const heading = beat.heading ? `<h2>${escapeHtml(beat.heading)}</h2>` : "";
        const blocks = (beat.blocks || []).map(beatBlockHtml).join("");
        return `<section class="beat">${heading}${blocks}</section>`;
      })
      .join("");
  }

  /** Loops the passes you can see. Offscreen clips stay paused, and a
   *  reduced-motion setting leaves them stopped with controls. */
  let beatObserver = null;

  function bindBeatPlayers(root) {
    if (beatObserver) {
      beatObserver.disconnect();
      beatObserver = null;
    }
    const videos = [...root.querySelectorAll("video.beat-video")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      videos.forEach((video) => {
        video.removeAttribute("autoplay");
        video.controls = true;
        video.pause();
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      videos.forEach((video) => video.play().catch(() => {}));
      return;
    }
    beatObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.35 }
    );
    videos.forEach((video) => beatObserver.observe(video));
  }

  function detailPhotoHtml(project) {
    const photos = (project.media || []).filter((item) => item.detailOnly && item.type === "image");
    return photos
      .map(
        (item) => `<figure class="project-detail-photo">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || "")}" />
        </figure>`
      )
      .join("");
  }

  /**
   * Clips live under a hidden panel, so a <video> there does not download
   * until the panel opens. Fetch them during the wall instead, and point the
   * elements at those bytes.
   */
  const preloadedVideo = new Map();
  /** Original URL when the early fetch was skipped or failed, so the clip still plays. */
  const videoFallback = new Set();
  let preloadActive = true;
  /** Bytes in flight for the loading line. Each clip weighs the same, so one
   *  finished file is a quarter of the way whether it was the short one or not. */
  const videoLoads = new Map();

  function eachVideoSrc(visit) {
    const seen = new Set();
    for (const section of projects) {
      for (const project of section.projects) {
        for (const item of project.media || []) {
          if (item.type !== "video" || seen.has(item.src)) continue;
          seen.add(item.src);
          visit(item.src);
        }
      }
    }
  }

  function videoViewOpen(video) {
    const page = document.getElementById("page");
    if (!page || page.hidden) return false;
    const body = video.closest("[data-view]");
    return Boolean(body && !body.hidden);
  }

  function usePreloadedVideo(src, url) {
    document.querySelectorAll("video[data-video]").forEach((video) => {
      if (video.dataset.video !== src) return;
      const source = video.querySelector("source");
      if (!source || source.getAttribute("src") === url) return;
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
      source.setAttribute("src", url);
      video.load();
      if (videoViewOpen(video)) video.play().catch(() => {});
    });
  }

  function keepNetworkSrc(src) {
    videoFallback.add(src);
    usePreloadedVideo(src, src);
  }

  function finishVideoLoad(src) {
    const slot = videoLoads.get(src);
    if (slot) slot.done = true;
  }

  /** 0 until the first byte, 1 when every clip has landed or been given up on. */
  function videoLoadProgress() {
    if (videoLoads.size === 0) return 1;
    let sum = 0;
    for (const item of videoLoads.values()) {
      if (item.done) sum += 1;
      else if (item.total > 0) sum += Math.min(1, item.loaded / item.total);
    }
    return sum / videoLoads.size;
  }

  async function readVideo(src, res) {
    if (!res.ok || !res.body || !res.body.getReader) {
      keepNetworkSrc(src);
      finishVideoLoad(src);
      return;
    }
    const slot = videoLoads.get(src);
    const total = Number(res.headers.get("content-length")) || 0;
    if (slot) slot.total = total;
    const reader = res.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      if (slot) slot.loaded += value.byteLength;
    }
    const blob = new Blob(chunks, { type: "video/mp4" });
    if (!blob.size) {
      keepNetworkSrc(src);
      finishVideoLoad(src);
      return;
    }
    const url = URL.createObjectURL(blob);
    preloadedVideo.set(src, url);
    usePreloadedVideo(src, url);
    if (slot && slot.total > 0) slot.loaded = slot.total;
    finishVideoLoad(src);
  }

  function preloadProjectVideos() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) {
      preloadActive = false;
      return;
    }
    eachVideoSrc((src) => {
      videoLoads.set(src, { loaded: 0, total: 0, done: false });
      fetch(src, { priority: "low" })
        .then((res) => readVideo(src, res))
        .catch(() => {
          keepNetworkSrc(src);
          finishVideoLoad(src);
        });
    });
  }

  function mediaHtml(items, extraClass, options) {
    if (!items || !items.length) return "";
    const bits = items
      .map((item) => {
        if (item.type === "video") {
          const autoplay = options && options.autoplay ? " autoplay" : "";
          let direct = preloadedVideo.get(item.src) || "";
          if (!direct && (!preloadActive || videoFallback.has(item.src))) direct = item.src;
          const srcAttr = direct ? ` src="${escapeHtml(direct)}"` : "";
          return `<video class="${extraClass}" muted loop playsinline preload="auto" data-video="${escapeHtml(
            item.src
          )}"${autoplay}>
            <source${srcAttr} data-src="${escapeHtml(item.src)}" type="video/mp4" />
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

  function contributionLines(project) {
    const data = window.PROJECT_CONTRIBUTIONS || {};
    const lines = data[project.id];
    if (!Array.isArray(lines)) return [];
    return lines.map((line) => String(line).trim()).filter(Boolean);
  }

  function awardHtml(project) {
    const awards = (window.PROJECT_CONTRIBUTIONS && window.PROJECT_CONTRIBUTIONS.awards) || {};
    const award = awards[project.id];
    if (!award || !String(award).trim()) return "";
    return `<p class="project-award">${escapeHtml(String(award).trim())}</p>`;
  }

  function contributionsHtml(project) {
    const lines = contributionLines(project);
    if (!lines.length) return "";
    const data = window.PROJECT_CONTRIBUTIONS || {};
    const personal = Array.isArray(data.personal) ? data.personal : [];
    const label = personal.includes(project.id)
      ? data.personalLabel || "Highlights"
      : data.label || "My contributions";
    return `<div class="project-contributions">
      <h4>${escapeHtml(label)}</h4>
      <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
    </div>`;
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
              ${mediaHtml(cardMedia(project), "project-thumb")}
              ${awardHtml(project)}
              <h3>${escapeHtml(project.title)}</h3>
              ${contributionsHtml(project)}
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
    const beats = beatsHtml(project);
    const hero = beats
      ? ""
      : project.iframe
        ? `<div class="project-embed" data-embed></div>`
        : mediaHtml(featuredMedia(project), "project-detail-media", { autoplay: true });
    container.innerHTML = `
      <div class="project-detail">
        <h1>${escapeHtml(project.title)}</h1>
        ${stackHtml(project.stack)}
        ${awardHtml(project)}
        ${contributionsHtml(project)}
        ${desc}
        ${beats}
        ${hero}
        ${detailPhotoHtml(project)}
        ${linkHtml(project.href, "Project website")}
      </div>`;
    const host = container.querySelector("[data-embed]");
    if (host) mountEmbed(host, project.iframe, project.title);
    if (beats) bindBeatPlayers(container);
    else {
      container.querySelectorAll("video").forEach((video) => {
        video.play().catch(() => {});
      });
    }
  }

  function stopMedia(root) {
    if (beatObserver) {
      beatObserver.disconnect();
      beatObserver = null;
    }
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
    loadProgress: videoLoadProgress,
  };

  preloadProjectVideos();
})(window.PORTFOLIO_PROJECTS);
