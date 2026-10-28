/**
 * The table's backdrop, kept apart from scene.js so the loading curtain can
 * paint it without waiting for three.js.
 */

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let painted = null;

/**
 * The view out of the window: mostly sky, over a soft line of trees. It is
 * painted once and shared: the loading curtain shows it before the table is
 * up, and the table hangs the same picture behind itself.
 */
export function backdropCanvas() {
  return (painted ??= paintBackdrop());
}

function paintBackdrop() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext("2d");
  const rand = rng(21);
  const sky = ctx.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, "#9cc3e0");
  sky.addColorStop(0.32, "#b9d6e8");
  sky.addColorStop(0.55, "#e2ecdf");
  sky.addColorStop(0.68, "#f7ecd3");
  sky.addColorStop(1, "#d6c08f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2048, 1024);

  ctx.filter = "blur(30px)";
  const glow = ctx.createRadialGradient(1500, 330, 20, 1500, 330, 560);
  glow.addColorStop(0, "rgba(255, 246, 216, 0.95)");
  glow.addColorStop(1, "rgba(255, 246, 216, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 2048, 1024);

  // Far, soft clouds in the real sky
  ctx.filter = "blur(18px)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (const [x, y, w] of [[260, 380, 260], [820, 300, 200], [1180, 430, 300], [1780, 360, 240]]) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x + (i - 1.5) * w * 0.3, y - (i % 2) * 18, w * 0.3, 38 + rand() * 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Round, tall and pointed trees, so the line never repeats */
  function tree(x, base, size, color) {
    const kind = rand();
    ctx.fillStyle = "#8a6a4c";
    ctx.fillRect(x - size * 0.06, base - size * 0.5, size * 0.12, size * 0.5);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (kind < 0.45) {
      ctx.arc(x, base - size * 0.95, size * 0.55, 0, Math.PI * 2);
      ctx.arc(x - size * 0.35, base - size * 0.7, size * 0.38, 0, Math.PI * 2);
      ctx.arc(x + size * 0.38, base - size * 0.72, size * 0.36, 0, Math.PI * 2);
    } else if (kind < 0.75) {
      ctx.ellipse(x, base - size * 1.05, size * 0.3, size * 0.82, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(x - size * 0.42, base - size * 0.35);
      ctx.lineTo(x, base - size * 1.9);
      ctx.lineTo(x + size * 0.42, base - size * 0.35);
    }
    ctx.fill();
  }

  // Far woods: a hazy band, then a row of small trees
  ctx.filter = "blur(14px)";
  ctx.fillStyle = "#b9c79a";
  ctx.fillRect(0, 690, 2048, 80);
  const far = ["#a6b884", "#98ad78", "#b3c28c", "#9fb27e", "#adbd8a"];
  for (let x = -20; x < 2080; x += 34 + rand() * 40) tree(x, 735, 70 + rand() * 60, far[Math.floor(rand() * far.length)]);

  // A few houses tucked into the trees, each its own shape and colour, none in the middle behind the hoop
  ctx.filter = "blur(9px)";
  const houses = [
    { x: 300, w: 190, h: 120, wall: "#efc9a0", roof: "#a9654b", kind: "gable", chimney: true },
    { x: 1540, w: 240, h: 96, wall: "#f2dcbc", roof: "#7d8b5a", kind: "hip" },
    { x: 1880, w: 140, h: 120, wall: "#e3a882", roof: "#8a6a55", kind: "flat", chimney: true },
  ];
  for (const hs of houses) {
    const base = 772;
    const top = base - hs.h;
    ctx.fillStyle = hs.wall;
    ctx.fillRect(hs.x, top, hs.w, hs.h);
    ctx.fillStyle = hs.roof;
    ctx.beginPath();
    if (hs.kind === "gable") {
      ctx.moveTo(hs.x - 16, top);
      ctx.lineTo(hs.x + hs.w / 2, top - 70);
      ctx.lineTo(hs.x + hs.w + 16, top);
    } else if (hs.kind === "steep") {
      ctx.moveTo(hs.x - 10, top);
      ctx.lineTo(hs.x + hs.w / 2, top - 120);
      ctx.lineTo(hs.x + hs.w + 10, top);
    } else if (hs.kind === "hip") {
      ctx.moveTo(hs.x - 14, top);
      ctx.lineTo(hs.x + hs.w * 0.28, top - 46);
      ctx.lineTo(hs.x + hs.w * 0.72, top - 46);
      ctx.lineTo(hs.x + hs.w + 14, top);
    } else {
      ctx.rect(hs.x - 8, top - 16, hs.w + 16, 18);
    }
    ctx.fill();
    if (hs.chimney) ctx.fillRect(hs.x + hs.w * 0.7, top - (hs.kind === "flat" ? 46 : 64), 22, 44);
    // Windows, and a door on the bigger ones
    ctx.fillStyle = "rgba(255, 248, 230, 0.85)";
    const rows = hs.h > 130 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      for (let wx = hs.x + 22; wx < hs.x + hs.w - 30; wx += 56) ctx.fillRect(wx, top + 22 + r * 56, 26, 34);
    }
    if (hs.w > 130) {
      ctx.fillStyle = "rgba(120, 80, 60, 0.6)";
      ctx.fillRect(hs.x + hs.w / 2 - 14, base - 46, 28, 46);
    }
  }

  // Nearer trees in front of the houses, bigger and greener
  ctx.filter = "blur(8px)";
  const near = ["#8da862", "#9db56a", "#7f9a58", "#a8bb70", "#93ad66"];
  for (let x = 0; x < 2048; x += 120 + rand() * 170) {
    // Leave the houses mostly in view
    if ([[300, 490], [1560, 1770]].some(([a, b]) => x > a + 30 && x < b - 30)) continue;
    tree(x, 800, 120 + rand() * 90, near[Math.floor(rand() * near.length)]);
  }

  // Garden in front, and bushes
  ctx.fillStyle = "#b9a46a";
  ctx.fillRect(0, 790, 2048, 234);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = near[i % near.length];
    ctx.beginPath();
    ctx.arc(rand() * 2048, 795 + rand() * 30, 30 + rand() * 50, 0, Math.PI * 2);
    ctx.fill();
  }
  // Two sunlit canopies just reaching into the top corners of the window
  ctx.filter = "blur(16px)";
  const top = ["#c9cd78", "#dcd88f", "#b7bf69"];
  for (let i = 0; i < 10; i++) {
    const right = i % 2;
    ctx.fillStyle = top[i % top.length];
    ctx.beginPath();
    ctx.arc(right ? 1850 + rand() * 260 : rand() * 220, rand() * 240, 80 + rand() * 90, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";
  return c;
}
