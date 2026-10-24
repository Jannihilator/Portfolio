/**
 * A content panel's sheet, drawn flat on a canvas under its content, with
 * round cartoon holes that a dart punches and that mend on their own.
 */

/** How long a hole stays open, then how long it takes to close (seconds). */
export const HEAL = { hold: 2.5, mend: 7 };

const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Every hole gets its own lumpy outline, so no two look alike */
function blob(seed) {
  const rand = rng(seed);
  const n = 6 + Math.floor(rand() * 4);
  const turn = rand() * TAU;
  const squash = 0.8 + rand() * 0.3;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU + (rand() - 0.5) * 0.5;
    const k = 0.78 + rand() * 0.4;
    pts.push({ x: Math.cos(a) * k, y: Math.sin(a) * k * squash });
  }
  return pts;
}

/** A smooth closed curve through the midpoints of the outline */
function blobPath(ctx, pts, cx, cy, r) {
  const p = (i) => pts[(i + pts.length) % pts.length];
  ctx.beginPath();
  const m0x = (p(0).x + p(1).x) / 2;
  const m0y = (p(0).y + p(1).y) / 2;
  ctx.moveTo(cx + m0x * r, cy + m0y * r);
  for (let i = 1; i <= pts.length; i++) {
    const a = p(i);
    const b = p(i + 1);
    ctx.quadraticCurveTo(cx + a.x * r, cy + a.y * r, cx + ((a.x + b.x) / 2) * r, cy + ((a.y + b.y) / 2) * r);
  }
  ctx.closePath();
}

/** 1 while fresh. Mending shrinks it with a small overshoot, like a pop. */
function openness(hole, now) {
  const t = (now - hole.born) / 1000 - HEAL.hold;
  if (t <= 0) return 1;
  const u = Math.min(1, t / HEAL.mend);
  const ease = u * u * (3 - 2 * u);
  return Math.max(0, 1 - ease + Math.sin(u * Math.PI) * 0.06);
}

export class Sheet {
  constructor(canvas, { fill = "#fffdf7", radius = 10 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.fill = fill;
    this.radius = radius;
    this.holes = [];
    this.w = 0;
    this.h = 0;
    this.scale = 1;
    this.ox = 0;
    this.oy = 0;
    this.seed = 1;
  }

  resize(w, h, scale) {
    this.w = w;
    this.h = h;
    this.scale = scale;
    this.canvas.width = Math.max(1, Math.round(w * scale));
    this.canvas.height = Math.max(1, Math.round(h * scale));
    this.draw(performance.now());
  }

  /** The content scroll, so holes stay where they were punched in it */
  setOffset(ox, oy) {
    if (ox === this.ox && oy === this.oy) return;
    this.ox = ox;
    this.oy = oy;
    if (this.holes.length) this.draw(performance.now());
  }

  /** x, y in content coordinates */
  punch(x, y, r) {
    const seed = (this.seed++ * 2654435761 + Math.floor(x * 31 + y * 17)) >>> 0;
    this.holes.push({ x, y, r, born: performance.now(), pts: blob(seed), tilt: rng(seed)() * TAU });
  }

  get busy() {
    return this.holes.length > 0;
  }

  draw(now) {
    const { ctx, scale, w, h } = this;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.fill;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, this.radius);
    ctx.fill();
    this.holes = this.holes.filter((hole) => {
      const k = openness(hole, now);
      if (k <= 0.03) return false;
      this.drawHole(hole, hole.r * k);
      return true;
    });
  }

  drawHole(hole, r) {
    const { ctx } = this;
    const x = hole.x - this.ox;
    const y = hole.y - this.oy;
    if (y + r * 1.5 < 0 || y - r * 1.5 > this.h) return;
    // A soft dent in the sheet around the hole
    ctx.fillStyle = "rgba(120, 84, 48, 0.1)";
    blobPath(ctx, hole.pts, x + 1, y + 2, r * 1.28);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    blobPath(ctx, hole.pts, x, y, r);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    // Cartoon ink rim, thicker on the shadow side
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(74, 50, 30, 0.75)";
    ctx.lineWidth = 2.6;
    blobPath(ctx, hole.pts, x, y, r);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.12, hole.tilt, hole.tilt + 0.9);
    ctx.stroke();
  }
}
