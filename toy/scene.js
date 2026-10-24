/**
 * The toy table under the pages: a warm tabletop by a sunny window, with a
 * block wall along the back, toy trees, block castles and towers, a wall
 * of skill bricks, a wooden train on its track and a yarn-ball porcupine,
 * and paper clouds on strings. Darts are real foam bodies that bounce off
 * whatever they hit, except the train's targets and the porcupine, which
 * hold them. The pages simply lie on top of all this.
 *
 * Physics runs at a fixed 30 Hz and only while something is awake or the
 * train is running; every frame in between is interpolated, so motion
 * stays smooth at 60 fps.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import RAPIER from "rapier";

/** The width the camera always shows, whatever the window's shape */
const H_FOV = 60;
const GRAVITY = -26;
const STEP = 1 / 30;
/** A dart's speed (units/s) at full force; a shot's force is 1 or less */
const DART_SPEED = 21;
/** A dart in flight is handed to physics this far short of what it hits */
const HANDOFF = 2.2;
/** Darts in play at once, loose or held by a target. They are reused. */
const POOL_MAX = 40;
/** A dart lasts this long (ms), unless the porcupine keeps it as a quill */
const DART_LIFE = 10000;
const SHRINK = 260;
/** Most pixels the table is drawn at, however big or sharp the screen */
const MAX_PIXELS = 2.2e6;
/**
 * Weak shots: a shot at or under `below` force is lobbed instead of fired
 * straight. It leaves your hand and drops onto the crosshair point in an
 * arc, all of it in the table's own physics. Every lob has the same shape:
 * it rises `arc` units above the straight line for each unit it travels,
 * which is what a lob at the hoop needs to come down through the rim and
 * stay in view. It comes down `past` units beyond what the crosshair
 * touches: about the rim's radius, so a lob at the rim drops through its
 * middle for a swish. (How often shots come out weak, and their force, is
 * SHOT in toy.js.)
 */
const WEAK = { below: 0.6, arc: 0.12, past: -0.6 };
const QUILLS_MAX = 240;
/** The track's path across the table (x, z), winding in the open strips either side of the pages */
const TRACK = [
  [-34, -3.4], [-18, -3.6], [-13.4, -3.4], [-11, -2.2], [-11.8, -0.4], [-10.6, 1], [-8.6, 0.8], [-7.6, -0.6],
  [-5.4, -1.2], [0, -0.7], [5.4, -0.3], [7.7, 1], [8.5, 2.6], [10.3, 3.3], [11.9, 2.4], [11.3, 0.8], [12.7, -0.3], [16, 0], [34, 0.2],
];
const TRAIN = { fast: 3.6, slow: 1.7 };
/**
 * Standing picture frames, on the table or on a bookcase shelf. Each is
 * sized so the opening matches its picture: 4:3 landscape or 3:4 portrait.
 * src is the picture's path; without one, a doodle stands in.
 */
const FRAMES = [
  { on: "table", x: -4.9, z: 3.5, w: 0.95, h: 1.18, color: "mustard", src: "./assets/frames/noita.svg" },
  { on: "table", x: 2.4, z: 3, w: 1.2, h: 0.965, color: "blue", src: "./assets/frames/rounds.svg" },
  { on: "left", level: 1, lx: -0.7, lz: 0.15, w: 1.1, h: 0.89, color: "red", src: "./assets/frames/snakeio.svg" },
  { on: "right", level: 1, lx: 0.7, lz: 0.15, w: 1.1, h: 0.89, color: "sage", src: "./assets/frames/brotato.svg" },
  { on: "right", level: 3, lx: 0.6, lz: 0.35, w: 1.2, h: 1.5, color: "coral", src: "./assets/frames/blueprince.svg" },
];

const COLORS = {
  cream: 0xf3e2c2,
  wood: 0xe4c497,
  sand: 0xd9b98c,
  red: 0xdc6a52,
  coral: 0xe9906d,
  blue: 0x7f9fcb,
  navy: 0x52709e,
  mustard: 0xebbb55,
  sage: 0x93a86c,
  green: 0x7d9b5b,
  olive: 0x8c9a58,
  trunk: 0xc89a6b,
  ink: 0x4a3526,
};

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const css = (hex) => `#${hex.toString(16).padStart(6, "0")}`;

/** The view out of the window: mostly sky, over a soft line of trees */
function backdropCanvas() {
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

/**
 * A paper cloud: soft lumps with a cartoon outline. A tall one is fatter:
 * four bigger lumps on a deeper sheet.
 */
function cloudCanvas(seed, tall = false) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = tall ? 240 : 180;
  const ctx = c.getContext("2d");
  const rand = rng(seed);
  const lumps = [];
  const base = tall ? 150 : 110;
  const count = tall ? 4 : 5;
  for (let i = 0; i < count; i++) {
    if (tall) {
      const middle = i === 1 || i === 2;
      lumps.push({ x: 78 + i * 55 + (rand() - 0.5) * 12, y: base - (middle ? 38 : 8) - rand() * 10, r: 44 + rand() * 12 + (middle ? 22 : 0) });
    } else {
      lumps.push({ x: 60 + i * 50 + (rand() - 0.5) * 16, y: base - (i % 2 ? 22 : 0) - (i === 2 ? 18 : 0), r: 38 + rand() * 16 + (i === 2 ? 12 : 0) });
    }
  }
  const shape = () => {
    ctx.beginPath();
    for (const l of lumps) {
      ctx.moveTo(l.x + l.r, l.y);
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    }
    if (tall) ctx.rect(62, base - 10, 196, 52);
    else ctx.rect(50, base - 10, 220, 46);
  };
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#7a604a";
  shape();
  ctx.stroke();
  ctx.fillStyle = "#fffaf0";
  shape();
  ctx.fill();
  // A soft shade along the underside, inside the outline
  ctx.save();
  shape();
  ctx.clip();
  const shade = ctx.createLinearGradient(0, base - 20, 0, base + 40);
  shade.addColorStop(0, "rgba(226, 210, 186, 0)");
  shade.addColorStop(1, "rgba(226, 210, 186, 0.9)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, base - 20, 320, 70);
  ctx.restore();
  return c;
}

function sunCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f2b33d";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.moveTo(128 + Math.cos(a - 0.17) * 78, 128 + Math.sin(a - 0.17) * 78);
    ctx.lineTo(128 + Math.cos(a) * 122, 128 + Math.sin(a) * 122);
    ctx.lineTo(128 + Math.cos(a + 0.17) * 78, 128 + Math.sin(a + 0.17) * 78);
  }
  ctx.fill();
  ctx.fillStyle = "#f8c95a";
  ctx.strokeStyle = "#8a5a2c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  return c;
}

/** A painted brick face with a skill on it, like a letter block */
function skillCanvas(text, color, ink, w = 400) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.fillStyle = css(color);
  ctx.fillRect(0, 0, w, 160);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(16, 16, w - 32, 128, 16);
  ctx.stroke();
  let size = 76;
  do {
    ctx.font = `600 ${size}px Fredoka, Nunito, sans-serif`;
    size -= 2;
  } while (ctx.measureText(text).width > w - 70 && size > 24);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, 86);
  return c;
}

/** Rings of a toy target, seen face on */
function bullseyeCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const rings = ["#4a3526", "#fffaf0", "#dc6a52", "#fffaf0", "#dc6a52", "#fffaf0", "#ebbb55"];
  const radii = [128, 120, 100, 80, 60, 40, 22];
  rings.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(128, 128, radii[i], 0, Math.PI * 2);
    ctx.fill();
  });
  return c;
}

/** Strands of wound yarn, wrapped round a ball */
function yarnCanvas() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  const rand = rng(7);
  ctx.fillStyle = "#7f9fcb";
  ctx.fillRect(0, 0, 512, 256);
  ctx.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const amp = 20 + rand() * 60;
    const phase = rand() * Math.PI * 2;
    const mid = rand() * 256;
    const turns = 1 + Math.floor(rand() * 2);
    ctx.strokeStyle = i % 3 ? "rgba(70, 98, 148, 0.55)" : "rgba(196, 214, 238, 0.7)";
    ctx.lineWidth = 3 + rand() * 3;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = mid + Math.sin((x / 512) * Math.PI * 2 * turns + phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c;
}

/** A soft round shadow for things that move all the time */
function blobCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, "rgba(60, 34, 14, 0.45)");
  g.addColorStop(1, "rgba(60, 34, 14, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

/** A soft cone, rounded at the tip like a sanded toy tree */
function softCone(r, h) {
  const pts = [new THREE.Vector2(0, 0)];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const rad = r * Math.pow(1 - t, 0.95) * (1 - 0.08 * t);
    pts.push(new THREE.Vector2(Math.max(0.001, i === 0 ? r : rad), t * h));
  }
  pts[pts.length - 1].x = 0.001;
  const geo = new THREE.LatheGeometry(pts, 16);
  geo.translate(0, -h / 2, 0);
  return geo;
}

function prismGeometry(w, h, d) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(0, h / 2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 });
  geo.translate(0, 0, -d / 2);
  return geo;
}

/** Paints one flat colour into a geometry, so parts can share one mesh */
function tinted(g, color) {
  const geo = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  for (const key of Object.keys(geo.attributes)) if (!["position", "normal", "color"].includes(key)) geo.deleteAttribute(key);
  return geo;
}

/** Cup at the front (-y), foam body, lighter cap at the back (+y), as one mesh */
function dartGeometry() {
  const cup = new THREE.CylinderGeometry(0.095, 0.05, 0.06, 12).translate(0, -0.23, 0);
  const body = new THREE.CylinderGeometry(0.065, 0.065, 0.4, 10);
  const end = new THREE.CylinderGeometry(0.067, 0.067, 0.03, 10).translate(0, 0.215, 0);
  return mergeGeometries([tinted(cup, 0x2f6fd6), tinted(body, 0xff7a1f), tinted(end, 0xffb57a)]);
}

export async function createTable(canvas, { skills = [], reducedMotion = false } = {}) {
  await RAPIER.init();
  // The skill bricks are painted with the page's own font
  try {
    await Promise.race([document.fonts.load("600 40px Fredoka"), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    // Painted in the fallback font instead
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  // The table is soft and matte, so it never needs every pixel of a big
  // screen: the drawing is held to a pixel budget, and drops further if
  // frames run slow
  let quality = 1;
  const frameLog = { time: 0, frames: 0 };
  function pixelRatio() {
    const css = Math.max(1, window.innerWidth * window.innerHeight);
    return Math.min(window.devicePixelRatio, 1.5, Math.sqrt(MAX_PIXELS / css)) * quality;
  }
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Shadows are redrawn only when something on the table has moved
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1e2c6);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 140);
  camera.position.set(0, 5, 18);
  camera.lookAt(0, 2.2, -2);

  function fitCamera() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.aspect = aspect;
    const tanH = Math.tan(THREE.MathUtils.degToRad(H_FOV / 2));
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanH / aspect));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  fitCamera();

  // Late-afternoon sun from behind the left shoulder, warm bounce below
  scene.add(new THREE.HemisphereLight(0xfff0d4, 0xa06a48, 1.35));
  const sun = new THREE.DirectionalLight(0xffdfae, 3.1);
  sun.position.set(-11, 15, 5);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 12, bottom: -12, near: 2, far: 50 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
  world.timestep = STEP;

  const hittables = [];
  const props = [];
  const clouds = [];
  let dirty = true;
  let shadowsDirty = true;
  let active = false;

  // ------------------------------------------------------------ backdrop
  {
    const tex = new THREE.CanvasTexture(backdropCanvas());
    tex.colorSpace = THREE.SRGBColorSpace;
    const view = new THREE.Mesh(
      new THREE.PlaneGeometry(84, 42),
      new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false })
    );
    view.position.set(0, 6, -36);
    // Plain sky on up above the picture, for a tall phone screen that sees higher
    const above = new THREE.Mesh(new THREE.PlaneGeometry(84, 80), new THREE.MeshBasicMaterial({ color: 0x9cc3e0, fog: false, toneMapped: false }));
    above.position.set(0, 6 + 21 + 40 - 0.05, -36.01);
    scene.add(view, above);
  }

  // --------------------------------------------------------------- table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(60, 1, 34),
    new THREE.MeshStandardMaterial({ color: 0xb98563, roughness: 0.9 })
  );
  table.position.set(0, -0.5, 5.5);
  table.receiveShadow = true;
  table.userData.hit = { kind: "table" };
  scene.add(table);
  hittables.push(table);
  world.createCollider(RAPIER.ColliderDesc.cuboid(30, 0.5, 17).setTranslation(0, -0.5, 5.5).setFriction(0.8));

  // ------------------------------------------------------------ materials
  const mats = new Map();
  function mat(color) {
    if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
    return mats.get(color);
  }
  const geos = new Map();
  function geo(key, make) {
    if (!geos.has(key)) geos.set(key, make());
    return geos.get(key);
  }
  function canvasMaterial(canvasEl) {
    const tex = new THREE.CanvasTexture(canvasEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 });
  }

  function shapeFor(shape, size) {
    const [a, b, c] = size;
    switch (shape) {
      case "box":
        return {
          geo: geo(`box${size}`, () => new RoundedBoxGeometry(a, b, c, 2, Math.min(a, b, c) * 0.18)),
          col: RAPIER.ColliderDesc.cuboid(a / 2, b / 2, c / 2),
        };
      case "cyl":
        return {
          geo: geo(`cyl${size}`, () => new THREE.CylinderGeometry(a, a, b, 16)),
          col: RAPIER.ColliderDesc.cylinder(b / 2, a),
        };
      case "cone":
        return {
          geo: geo(`cone${size}`, () => softCone(a, b)),
          col: RAPIER.ColliderDesc.cone(b / 2, a),
        };
      case "ball":
        return {
          geo: geo(`ball${size}`, () => new THREE.SphereGeometry(a, 16, 12)),
          col: RAPIER.ColliderDesc.ball(a),
        };
      case "prism": {
        const pts = new Float32Array([
          -a / 2, -b / 2, -c / 2, a / 2, -b / 2, -c / 2, 0, b / 2, -c / 2,
          -a / 2, -b / 2, c / 2, a / 2, -b / 2, c / 2, 0, b / 2, c / 2,
        ]);
        return { geo: geo(`prism${size}`, () => prismGeometry(a, b, c)), col: RAPIER.ColliderDesc.convexHull(pts) };
      }
      default:
        throw new Error(`unknown shape ${shape}`);
    }
  }

  // --------------------------------------------------------------- props
  function track(obj, body, extra = {}) {
    const prop = {
      obj,
      body,
      p0: obj.position.clone(),
      q0: obj.quaternion.clone(),
      p1: obj.position.clone(),
      q1: obj.quaternion.clone(),
      moving: false,
      speed: 0,
      lastKnock: 0,
      ...extra,
    };
    obj.userData.hit = { kind: "prop", prop };
    props.push(prop);
    hittables.push(obj);
    scene.add(obj);
    return prop;
  }

  /** Height of the shelf board things are being set on, while laying out */
  let standOn = 0;

  function addProp(obj, colliders, at, rotY = 0, tune) {
    const pos = at.clone();
    pos.y += standOn;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    let desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(0.12)
      .setAngularDamping(0.9)
      .setCanSleep(true);
    if (tune) desc = tune(desc);
    const body = world.createRigidBody(desc);
    for (const c of colliders) world.createCollider(c.setFriction(0.75).setRestitution(0.1), body);
    // Everything starts asleep exactly where it was set down
    body.sleep();
    obj.position.copy(pos);
    obj.quaternion.copy(q);
    obj.traverse((m) => {
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return track(obj, body);
  }

  function block(shape, size, color, x, y, z, rotY = 0) {
    const s = shapeFor(shape, size);
    return addProp(new THREE.Mesh(s.geo, mat(color)), [s.col], new THREE.Vector3(x, y, z), rotY);
  }

  /** Egg and cone trees on short wooden stubs, like toy-box trees */
  function tree(x, z, { kind = "egg", scale = 1, color = COLORS.sage, rotY = 0 } = {}) {
    const g = new THREE.Group();
    const stubH = 0.6 * scale;
    const stubR = 0.17 * scale;
    const stub = new THREE.Mesh(geo(`stub${scale}`, () => new THREE.CylinderGeometry(stubR * 0.9, stubR * 1.1, stubH, 12)), mat(COLORS.trunk));
    stub.position.y = stubH / 2;
    g.add(stub);
    const cols = [RAPIER.ColliderDesc.cylinder(stubH / 2, stubR * 1.6).setTranslation(0, stubH / 2, 0).setDensity(1.4)];
    if (kind === "egg") {
      const r = 0.78 * scale;
      const crown = new THREE.Mesh(geo(`egg${scale}`, () => new THREE.SphereGeometry(r, 18, 12).scale(1, 1.32, 1)), mat(color));
      crown.position.y = stubH + r * 1.2;
      g.add(crown);
      cols.push(RAPIER.ColliderDesc.capsule(r * 0.36, r * 0.95).setTranslation(0, crown.position.y, 0).setDensity(0.35));
    } else {
      const r = 0.72 * scale;
      const h = 2.1 * scale;
      const crown = new THREE.Mesh(geo(`pine${scale}`, () => softCone(r, h)), mat(color));
      crown.position.y = stubH * 0.6 + h / 2;
      g.add(crown);
      cols.push(RAPIER.ColliderDesc.cone(h / 2, r).setTranslation(0, crown.position.y, 0).setDensity(0.35));
    }
    return addProp(g, cols, new THREE.Vector3(x, 0, z), rotY);
  }

  const U = 0.55;

  /** A block wall along the back edge of the table, with crenels on top */
  function backWall(z) {
    const plank = [3, 1.1, 1];
    for (let i = 0; i < 12; i++) {
      const x = -16.5 + i * plank[0];
      block("box", plank, i % 2 ? COLORS.cream : COLORS.wood, x, plank[1] / 2, z);
      if (i % 2 === 0) block("box", [1.1, 0.85, 1], COLORS.cream, x - 0.6, plank[1] + 0.425, z);
      else block("box", [1.1, 0.85, 1], COLORS.wood, x + 0.6, plank[1] + 0.425, z);
    }
  }

  /** Two towers, a running-bond wall with crenels, and a round keep behind */
  function castle(cx, cz) {
    const brick = [U * 2, U * 0.7, U];
    const wallLen = U * 4;
    for (let c = 0; c < 3; c++) {
      const y = brick[1] / 2 + c * brick[1];
      if (c % 2) {
        // Half blocks at the ends, so the joints never line up course to course
        block("box", [U, brick[1], U], COLORS.wood, cx - wallLen / 2 + U / 2, y, cz);
        block("box", [U, brick[1], U], COLORS.wood, cx + wallLen / 2 - U / 2, y, cz);
        block("box", brick, COLORS.cream, cx, y, cz);
      } else {
        block("box", brick, COLORS.cream, cx - U, y, cz);
        block("box", brick, COLORS.wood, cx + U, y, cz);
      }
    }
    const top = 3 * brick[1];
    for (let i = 0; i < 3; i++) block("box", [U * 0.6, U * 0.6, U * 0.8], COLORS.coral, cx - U * 1.2 + i * U * 1.2, top + U * 0.3, cz);
    for (const side of [-1, 1]) {
      const tx = cx + side * (wallLen / 2 + U * 0.55);
      for (let i = 0; i < 4; i++) block("box", [U * 1.1, U * 1.1, U * 1.1], i % 2 ? COLORS.blue : COLORS.cream, tx, U * 0.55 + i * U * 1.1, cz);
      const roof = block("cone", [U * 0.8, U * 1.3], COLORS.red, tx, 4 * U * 1.1 + U * 0.65, cz);
      flag(roof.obj, U * 0.65, side < 0 ? COLORS.mustard : COLORS.sage, 0.5);
    }
    const kz = cz - U * 1.8;
    for (let i = 0; i < 3; i++) block("cyl", [U * 0.7, U * 1.4], i === 1 ? COLORS.mustard : COLORS.wood, cx, U * 0.7 + i * U * 1.4, kz);
    const keep = block("cone", [U * 0.85, U * 1.5], COLORS.blue, cx, U * 4.2 + U * 0.75, kz);
    flag(keep.obj, U * 0.75, COLORS.coral, 0.65);
  }

  /**
   * A pennant on a stick, planted in the tip of a roof. It flutters while
   * the table is being drawn anyway, and falls with the roof.
   */
  const flags = [];
  const pennantGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.22, -0.02, 0.44, -0.11);
    s.quadraticCurveTo(0.22, -0.16, 0, -0.24);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }).translate(0, 0, -0.01);
  })();
  const flagPoleGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 6);
  function flag(roof, tipY, color, height) {
    const pole = new THREE.Mesh(flagPoleGeo, mat(COLORS.wood));
    pole.scale.y = height;
    pole.position.y = tipY + height / 2 - 0.05;
    const cloth = new THREE.Mesh(pennantGeo, mat(color));
    cloth.position.set(0.02, tipY + height - 0.06, 0);
    pole.castShadow = cloth.castShadow = true;
    roof.add(pole, cloth);
    flags.push({ cloth, phase: Math.random() * 6 });
  }

  function waveFlags(now) {
    if (!dirty) return;
    for (const f of flags) {
      const t = now / 1000 + f.phase;
      f.cloth.rotation.y = 0.5 + Math.sin(t * 2.3) * 0.35;
      f.cloth.scale.x = 1 + Math.sin(t * 4.1) * 0.06;
    }
  }

  function house(cx, cz, rotY = 0) {
    const s = U * 1.8;
    block("box", [s, s, s], COLORS.cream, cx, s / 2, cz, rotY);
    block("prism", [s * 1.15, s * 0.6, s * 1.05], COLORS.red, cx, s + s * 0.3, cz, rotY);
  }

  const SKILL_FACES = [
    [COLORS.red, "#fffaf0"],
    [COLORS.blue, "#fffaf0"],
    [COLORS.mustard, "#4a3526"],
    [COLORS.sage, "#fffaf0"],
    [COLORS.coral, "#4a3526"],
    [COLORS.cream, "#4a3526"],
  ];
  const BRICK = [1.2, 0.54, 0.54];

  /** A painted brick with a skill on both broad sides */
  function skillBrick(name, i, size, x, y, z, rotY) {
    const [color, ink] = SKILL_FACES[i % SKILL_FACES.length];
    const label = canvasMaterial(skillCanvas(name, color, ink, Math.round((160 * size[0]) / size[1])));
    const plain = mat(color);
    const s = shapeFor("box", size);
    // Box faces: +x, -x, +y, -y, +z, -z. The name goes on the broad sides.
    addProp(new THREE.Mesh(s.geo, [plain, plain, plain, plain, label, label]), [s.col], new THREE.Vector3(x, y, z), rotY);
  }

  /**
   * The skills built into a toy brick wall out on the right, clear of the
   * pages: running bond, half bricks closing alternate courses and carrying
   * the short names. Nearly every brick has a skill on it; plain wooden
   * blocks only step the wall down on its left, where it tucks behind the
   * pages, and the last few bricks are dropped on top any old way.
   */
  function skillWall(names) {
    const cx = 9.7;
    const cz = -3;
    const face = Math.atan2(-cx, camera.position.z - cz);
    const [L, H] = BRICK;
    const HALF = [L / 2, H, BRICK[2]];
    const rand = rng(23);
    // The face of the wall runs from -L to 1.5L. Even courses: two whole
    // bricks, then a half on the right. Odd courses: a half on the left,
    // then two whole bricks.
    const slots = [];
    const courses = Math.max(3, Math.ceil((names.length - 3) / 3));
    for (let row = 0; row < courses; row++) {
      if (row % 2 === 0) slots.push({ lx: -0.5 * L, row }, { lx: 0.5 * L, row }, { lx: 1.25 * L, row, half: true });
      else slots.push({ lx: -0.75 * L, row, half: true }, { lx: 0, row }, { lx: L, row });
    }
    const top = courses;
    slots.push({ lx: -0.2 * L, row: top, turn: 0.22 }, { lx: 0.95 * L, row: top, half: true, turn: -0.18 }, { lx: 0.05 * L, row: top + 1, half: true, turn: 0.4 });
    // The shortest names go on the half bricks; which brick gets which is shuffled
    const shuffled = (list) => list.map((v) => [rand(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    const bySize = names.map((n, i) => ({ n, i })).sort((a, b) => a.n.length - b.n.length);
    const halves = shuffled(slots.filter((sl) => sl.half));
    const wholes = shuffled(slots.filter((sl) => !sl.half));
    const short = bySize.slice(0, Math.min(halves.length, bySize.length));
    const long = bySize.slice(short.length);
    halves.forEach((sl, j) => (sl.name = short[j]));
    wholes.forEach((sl, j) => (sl.name = long[j]));
    // A few plain blocks stepping down to the left
    slots.push({ lx: -1.5 * L, row: 0 }, { lx: -2.5 * L, row: 0 }, { lx: -1.25 * L, row: 1, half: true }, { lx: -2 * L, row: 1 }, { lx: -1.5 * L, row: 2 });

    const cos = Math.cos(face);
    const sin = Math.sin(face);
    const naturals = [COLORS.wood, COLORS.cream, COLORS.sand];
    // A hair of space between bricks, and a hair of wobble, so it looks built by hand
    const spread = 1.012;
    let k = 0;
    slots.forEach((sl, j) => {
      const size = sl.half ? HALF : BRICK;
      const lx = sl.lx * spread;
      const x = cx + lx * cos;
      const y = H / 2 + sl.row * H;
      const z = cz - lx * sin;
      const rotY = face + (sl.turn || (rand() - 0.5) * 0.03);
      if (sl.name) skillBrick(sl.name.n, k++, size, x, y, z, rotY);
      else block("box", size, naturals[(j * 7 + sl.row) % naturals.length], x, y, z, rotY);
    });
    // Any skills that found no brick lie at its foot
    const placed = new Set(slots.filter((sl) => sl.name).map((sl) => sl.name.i));
    bySize
      .filter((p) => !placed.has(p.i))
      .forEach((p, j) => skillBrick(p.n, k++, BRICK, cx - 1.2 + j * 1.7, H / 2, cz + 1.2, face + 0.3 - j * 0.5));
  }

  // ----------------------------------------------------------- desk toys
  /** A hardback: two covers and a spine round a block of cream pages */
  function book(x, y, z, w, d, t, cover, rotY) {
    const g = new THREE.Group();
    const board = 0.035;
    const part = (pw, ph, pd, c, px, py, pz) => {
      const m = new THREE.Mesh(geo(`book${pw},${ph},${pd}`, () => new RoundedBoxGeometry(pw, ph, pd, 2, Math.min(pw, ph, pd) * 0.35)), mat(c));
      m.position.set(px, py, pz);
      g.add(m);
    };
    part(w, board, d, cover, 0, t / 2 - board / 2, 0);
    part(w, board, d, cover, 0, -t / 2 + board / 2, 0);
    part(0.05, t, d, cover, -w / 2 + 0.025, 0, 0);
    part(w - 0.08, t - board * 2 + 0.01, d - 0.06, COLORS.cream, 0.02, 0, 0);
    return addProp(g, [RAPIER.ColliderDesc.cuboid(w / 2, t / 2, d / 2)], new THREE.Vector3(x, y, z), rotY);
  }

  /** The board-game meeple: a little person cut from wood */
  const meepleGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.46, 0);
    s.lineTo(-0.16, 0);
    s.quadraticCurveTo(0, 0.28, 0.16, 0);
    s.lineTo(0.46, 0);
    s.quadraticCurveTo(0.52, 0.06, 0.44, 0.15);
    s.lineTo(0.22, 0.42);
    s.quadraticCurveTo(0.5, 0.5, 0.5, 0.6);
    s.quadraticCurveTo(0.5, 0.7, 0.36, 0.68);
    s.lineTo(0.17, 0.64);
    s.quadraticCurveTo(0.26, 0.72, 0.26, 0.8);
    s.absarc(0, 0.8, 0.26, 0, Math.PI, false);
    s.quadraticCurveTo(-0.26, 0.72, -0.17, 0.64);
    s.lineTo(-0.36, 0.68);
    s.quadraticCurveTo(-0.5, 0.7, -0.5, 0.6);
    s.quadraticCurveTo(-0.5, 0.5, -0.22, 0.42);
    s.lineTo(-0.44, 0.15);
    s.quadraticCurveTo(-0.52, 0.06, -0.46, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0.04, -0.15);
    g.scale(0.78, 0.78, 0.78);
    return g;
  })();
  function meeple(x, z, color, rotY, size = 1) {
    const m = new THREE.Mesh(meepleGeo, mat(color));
    m.scale.setScalar(size);
    return addProp(m, [RAPIER.ColliderDesc.cuboid(0.36 * size, 0.41 * size, 0.15 * size).setTranslation(0, 0.41 * size, 0)], new THREE.Vector3(x, 0, z), rotY);
  }

  function pipCanvas(n, face, pip) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = face;
    ctx.fillRect(0, 0, 128, 128);
    const at = { 1: [[64, 64]], 2: [[36, 36], [92, 92]], 3: [[34, 34], [64, 64], [94, 94]], 4: [[38, 38], [90, 38], [38, 90], [90, 90]], 5: [[36, 36], [92, 36], [64, 64], [36, 92], [92, 92]], 6: [[38, 32], [90, 32], [38, 64], [90, 64], [38, 96], [90, 96]] };
    ctx.fillStyle = pip;
    for (const [px, py] of at[n]) {
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  }
  /** Box faces +x, -x, +y, -y, +z, -z for each face up; opposite faces add up to seven */
  const DIE_FACES = { 1: [3, 4, 1, 6, 2, 5], 2: [3, 4, 2, 5, 1, 6], 3: [2, 5, 3, 4, 1, 6], 4: [1, 6, 4, 3, 2, 5], 5: [3, 4, 5, 2, 1, 6], 6: [4, 3, 6, 1, 2, 5] };
  const pipMats = new Map();
  /** A chunky die, size s, resting with `top` facing up, its bottom at y */
  function die(x, z, face, pip, rotY, top, s = 0.44, y = 0) {
    const mats = DIE_FACES[top].map((n) => {
      const key = `${n}${face}${pip}`;
      if (!pipMats.has(key)) pipMats.set(key, canvasMaterial(pipCanvas(n, face, pip)));
      return pipMats.get(key);
    });
    const m = new THREE.Mesh(geo(`die${s}`, () => new RoundedBoxGeometry(s, s, s, 3, s * 0.18)), mats);
    return addProp(m, [RAPIER.ColliderDesc.cuboid(s / 2, s / 2, s / 2)], new THREE.Vector3(x, y + s / 2, z), rotY);
  }

  /** A mug: a turned cup, hollow inside, with a handle */
  const mugGeo = new THREE.LatheGeometry(
    [[0, 0], [0.28, 0], [0.31, 0.03], [0.31, 0.58], [0.29, 0.61], [0.26, 0.58], [0.26, 0.07], [0, 0.07]].map(([r, y]) => new THREE.Vector2(r, y)),
    28
  );
  const handleGeo = new THREE.TorusGeometry(0.15, 0.045, 8, 18, Math.PI).rotateZ(-Math.PI / 2);
  function mug(x, z, color, rotY) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(mugGeo, mat(color)));
    const h = new THREE.Mesh(handleGeo, mat(color));
    h.position.set(0.3, 0.31, 0);
    g.add(h);
    return addProp(g, [RAPIER.ColliderDesc.cylinder(0.3, 0.31).setTranslation(0, 0.3, 0)], new THREE.Vector3(x, 0, z), rotY);
  }

  /** A hardback standing up, its spine facing out */
  function bookUpright(x, z, h, d, t, cover, rotY) {
    const g = new THREE.Group();
    const board = 0.035;
    const part = (pw, ph, pd, c, px, py, pz) => {
      const m = new THREE.Mesh(geo(`ubook${pw},${ph},${pd}`, () => new RoundedBoxGeometry(pw, ph, pd, 2, Math.min(pw, ph, pd) * 0.35)), mat(c));
      m.position.set(px, py, pz);
      g.add(m);
    };
    part(board, h, d, cover, -t / 2 + board / 2, h / 2, 0);
    part(board, h, d, cover, t / 2 - board / 2, h / 2, 0);
    part(t, h, 0.05, cover, 0, h / 2, d / 2 - 0.025);
    part(t - board * 2 + 0.01, h - 0.08, d - 0.06, COLORS.cream, 0, h / 2, -0.02);
    return addProp(g, [RAPIER.ColliderDesc.cuboid(t / 2, h / 2, d / 2).setTranslation(0, h / 2, 0)], new THREE.Vector3(x, 0, z), rotY);
  }

  /**
   * A d4, d8 or d20: a faceted toy die with its numbers painted on. Every
   * face gets its own cell of one painted sheet. A d8 or d20 shows one
   * number in the middle of each face; a d4 shows three, one by each
   * corner, every corner keeping its number on all three faces it touches.
   */
  const polyShapes = {
    4: () => new THREE.TetrahedronGeometry(0.36),
    8: () => new THREE.OctahedronGeometry(0.3),
    20: () => new THREE.IcosahedronGeometry(0.32),
  };
  /** Where a face's three corners sit in its cell (fractions, y down) */
  const CELL_TRI = [[0.5, 0.08], [0.06, 0.86], [0.94, 0.86]];
  const polyCache = new Map();

  function numberedDie(sides, color, ink) {
    const key = `${sides}${color}${ink}`;
    if (polyCache.has(key)) return polyCache.get(key);
    const shape = polyShapes[sides]();
    const g = shape.index ? shape.toNonIndexed() : shape;
    const pos = g.attributes.position;
    const faces = pos.count / 3;
    const cols = Math.min(5, faces);
    const rows = Math.ceil(faces / cols);
    const cell = 128;
    const c = document.createElement("canvas");
    c.width = cols * cell;
    c.height = rows * cell;
    const ctx = c.getContext("2d");
    ctx.fillStyle = css(color);
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // A d4's corners: the same number wherever that corner turns up
    const corners = [];
    const cornerOf = (v) => {
      let i = corners.findIndex((q) => q.distanceToSquared(v) < 1e-6);
      if (i < 0) i = corners.push(v.clone()) - 1;
      return i + 1;
    };
    const uv = new Float32Array(pos.count * 2);
    const v = new THREE.Vector3();
    for (let f = 0; f < faces; f++) {
      const col = f % cols;
      const row = Math.floor(f / cols);
      const at = CELL_TRI.map(([fx, fy]) => [(col + fx) * cell, (row + fy) * cell]);
      at.forEach(([px, py], k) => {
        uv[(f * 3 + k) * 2] = px / c.width;
        uv[(f * 3 + k) * 2 + 1] = 1 - py / c.height;
      });
      const mid = [(at[0][0] + at[1][0] + at[2][0]) / 3, (at[0][1] + at[1][1] + at[2][1]) / 3];
      if (sides === 4) {
        ctx.font = "700 30px Fredoka, Nunito, sans-serif";
        at.forEach(([px, py], k) => {
          const n = cornerOf(v.fromBufferAttribute(pos, f * 3 + k));
          const tx = mid[0] + (px - mid[0]) * 0.55;
          const ty = mid[1] + (py - mid[1]) * 0.55;
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(Math.atan2(py - mid[1], px - mid[0]) + Math.PI / 2);
          ctx.fillText(String(n), 0, 0);
          ctx.restore();
        });
      } else {
        ctx.font = `700 ${sides === 20 ? 40 : 48}px Fredoka, Nunito, sans-serif`;
        const n = f + 1;
        ctx.fillText(String(n), mid[0], mid[1]);
        // 6 and 9 get a line under them, as real dice do
        if (n === 6 || n === 9) ctx.fillRect(mid[0] - 10, mid[1] + 20, 20, 4);
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    const made = { geo: g, mat: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, flatShading: true }) };
    polyCache.set(key, made);
    return made;
  }

  function polyDie(sides, x, z, color, rotY, ink = "#fffaf0") {
    const { geo: g, mat: m0 } = numberedDie(sides, color, ink);
    const m = new THREE.Mesh(g, m0);
    // Turned so one face lies flat on the table
    const pts = g.attributes.position.array;
    const [a, b, c] = [0, 3, 6].map((i) => new THREE.Vector3().fromArray(pts, i));
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    const tilt = new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, -1, 0));
    m.quaternion.copy(tilt);
    let low = Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < pts.length; i += 3) low = Math.min(low, v.fromArray(pts, i).applyQuaternion(tilt).y);
    const holder = new THREE.Group();
    m.position.y = -low;
    holder.add(m);
    const hull = RAPIER.ColliderDesc.convexHull(new Float32Array(pts));
    return addProp(holder, [hull.setTranslation(0, -low, 0).setRotation(tilt)], new THREE.Vector3(x, 0, z), rotY);
  }

  /** A juggling ball: six leather panels in two colours, sewn round */
  function jugglingCanvas(a, b) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d");
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? a : b;
      ctx.fillRect((i * 256) / 6, 0, 256 / 6 + 1, 128);
    }
    ctx.strokeStyle = "rgba(74, 53, 38, 0.5)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 256) / 6, 0);
      ctx.lineTo((i * 256) / 6, 128);
      ctx.stroke();
    }
    return c;
  }
  function jugglingBall(x, y, z, a, b, turn) {
    const r = 0.24;
    const m = new THREE.Mesh(geo("juggle", () => new THREE.SphereGeometry(r, 24, 16)), canvasMaterial(jugglingCanvas(a, b)));
    m.rotation.z = turn;
    const g = new THREE.Group();
    m.position.y = r;
    g.add(m);
    return addProp(g, [RAPIER.ColliderDesc.ball(r).setTranslation(0, r, 0).setDensity(0.8)], new THREE.Vector3(x, y, z), turn);
  }

  /**
   * A retro game controller lying on the table: a flat grey body, a black
   * d-pad, two red buttons, start and select, and its cable running off
   * toward you.
   */
  function controller(x, z, rotY) {
    const g = new THREE.Group();
    const add = (mesh, px, py, pz) => {
      mesh.position.set(px, py, pz);
      g.add(mesh);
      return mesh;
    };
    add(new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.14, 0.62, 3, 0.06), mat(0xd9d4ca)), 0, 0.07, 0);
    add(new THREE.Mesh(new RoundedBoxGeometry(1.36, 0.02, 0.48, 2, 0.008), mat(0x55504c)), 0, 0.145, 0.0);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.025, 0.36, 2, 0.01), mat(0xc9c2b4)), 0.02, 0.16, 0.0);
    // D-pad
    add(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.05, 0.1, 2, 0.015), mat(0x2b2724)), -0.44, 0.17, 0.02);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.05, 0.3, 2, 0.015), mat(0x2b2724)), -0.44, 0.17, 0.02);
    // B and A
    for (const bx of [0.36, 0.53]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 20), mat(COLORS.red)), bx, 0.17, 0.05);
    }
    // Select and start
    for (const sx of [-0.08, 0.1]) {
      const pill = add(new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.03, 0.045, 2, 0.02), mat(0x2b2724)), sx, 0.165, 0.06);
      pill.rotation.y = -0.4;
    }
    // The cable leaves the near edge and wanders off toward you, out of view
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.07, 0.31),
      new THREE.Vector3(0.08, 0.04, 0.75),
      new THREE.Vector3(-0.35, 0.035, 1.4),
      new THREE.Vector3(-0.2, 0.035, 2.3),
      new THREE.Vector3(0.35, 0.035, 3.6),
      new THREE.Vector3(0.2, 0.035, 5),
    ]);
    add(new THREE.Mesh(new THREE.TubeGeometry(cable, 48, 0.03, 6, false), mat(0x3a3532)), 0, 0, 0);
    g.traverse((m) => {
      if (m.isMesh) m.castShadow = m.receiveShadow = true;
    });
    return addProp(g, [RAPIER.ColliderDesc.cuboid(0.75, 0.07, 0.31).setTranslation(0, 0.07, 0).setDensity(0.6)], new THREE.Vector3(x, 0, z), rotY);
  }

  /**
   * Animal pieces like the ones in farming board games: a woolly sheep and
   * a bristly boar, cut from wood in side view, facing +x.
   */
  const animalShapes = {
    sheep() {
      const s = new THREE.Shape();
      s.moveTo(-0.4, 0);
      s.lineTo(-0.28, 0);
      s.lineTo(-0.28, 0.2);
      s.lineTo(0.18, 0.2);
      s.lineTo(0.18, 0);
      s.lineTo(0.3, 0);
      s.lineTo(0.3, 0.24);
      s.quadraticCurveTo(0.4, 0.3, 0.5, 0.32);
      s.quadraticCurveTo(0.66, 0.38, 0.6, 0.54);
      s.quadraticCurveTo(0.56, 0.62, 0.48, 0.6);
      s.quadraticCurveTo(0.44, 0.7, 0.36, 0.64);
      // Wool in bumps along the back
      s.quadraticCurveTo(0.32, 0.8, 0.18, 0.74);
      s.quadraticCurveTo(0.1, 0.86, -0.04, 0.76);
      s.quadraticCurveTo(-0.14, 0.88, -0.28, 0.74);
      s.quadraticCurveTo(-0.46, 0.8, -0.46, 0.6);
      s.quadraticCurveTo(-0.58, 0.48, -0.44, 0.38);
      s.lineTo(-0.42, 0.2);
      s.closePath();
      return s;
    },
    boar() {
      const s = new THREE.Shape();
      s.moveTo(-0.42, 0);
      s.lineTo(-0.3, 0);
      s.lineTo(-0.3, 0.18);
      s.lineTo(0.14, 0.18);
      s.lineTo(0.14, 0);
      s.lineTo(0.26, 0);
      s.lineTo(0.26, 0.2);
      s.quadraticCurveTo(0.42, 0.22, 0.6, 0.28);
      s.lineTo(0.64, 0.42);
      s.quadraticCurveTo(0.56, 0.48, 0.48, 0.5);
      // An ear, then the bristly ridge of the back
      s.lineTo(0.46, 0.64);
      s.lineTo(0.38, 0.54);
      s.lineTo(0.28, 0.66);
      s.lineTo(0.2, 0.6);
      s.lineTo(0.1, 0.7);
      s.lineTo(0.0, 0.62);
      s.lineTo(-0.1, 0.7);
      s.lineTo(-0.2, 0.62);
      s.quadraticCurveTo(-0.38, 0.62, -0.44, 0.5);
      // A curly tail
      s.quadraticCurveTo(-0.56, 0.56, -0.54, 0.46);
      s.quadraticCurveTo(-0.5, 0.42, -0.46, 0.44);
      s.quadraticCurveTo(-0.5, 0.3, -0.42, 0.18);
      s.closePath();
      return s;
    },
  };
  const animalGeos = {};
  function animal(kind, x, z, color, rotY, size = 1) {
    if (!animalGeos[kind]) {
      const g = new THREE.ExtrudeGeometry(animalShapes[kind](), { depth: 0.28, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 8 });
      g.translate(0, 0.03, -0.14);
      animalGeos[kind] = g;
    }
    const m = new THREE.Mesh(animalGeos[kind], mat(color));
    m.scale.setScalar(size);
    return addProp(m, [RAPIER.ColliderDesc.cuboid(0.5 * size, 0.42 * size, 0.17 * size).setTranslation(0.05 * size, 0.42 * size, 0)], new THREE.Vector3(x, 0, z), rotY);
  }

  /**
   * Dice of every kind and the meeples: a few in the middle at the front
   * with the juggling balls and the controller, more round the dominoes,
   * and some out at the back among the pinwheels.
   */
  function deskToys() {
    // The middle: a big meeple, a die, three juggling balls and a controller
    meeple(-1.0, 5.0, COLORS.mustard, 0.15, 1.35);
    die(-2.2, 4.4, "#fffaf0", "#4a3526", 0.5, 4);
    // Four juggling balls: three in a triangle and one sat on top
    jugglingBall(-2.9, 0, 6.0, "#dc6a52", "#ebbb55", 0.4);
    jugglingBall(-2.42, 0, 6.0, "#7f9fcb", "#fffaf0", 1.1);
    jugglingBall(-2.66, 0, 6.42, "#93a86c", "#ebbb55", 2.0);
    jugglingBall(-2.66, 0.392, 6.14, "#ebbb55", "#dc6a52", 2.6);
    controller(0.6, 7.2, -0.2);
    // Round the dominoes: inside the first arch, in the loop, and beyond
    meeple(3.4, 6.5, COLORS.sage, -0.25, 0.6);
    die(3.7, 7.3, "#dc6a52", "#fffaf0", -0.3, 3);
    polyDie(20, 7.0, 4.7, COLORS.red, 0.3);
    die(3.9, 6.0, "#7f9fcb", "#fffaf0", 0.2, 6);
    animal("boar", 4.5, 4.3, 0x7a5236, 0.2, 0.3);
    animal("sheep", 7.65, 6.95, 0x4a4446, -0.3, 0.38);
    animal("sheep", 6.25, 5.6, COLORS.cream, 0.4, 0.32);
    animal("boar", 8.2, 4.6, 0x7a5236, -0.5, 0.4);
    polyDie(4, 6.1, 4.4, COLORS.mustard, 0.8, "#4a3526");
    animal("sheep", 8.4, 6.7, COLORS.cream, -0.15, 0.7);
    animal("sheep", 7.3, 7.5, COLORS.cream, 0.25, 0.55);
    animal("sheep", 3.2, 4.2, COLORS.cream, 0.3, 0.45);
    // ...and on the near side and the left, so they ring it all round
    animal("boar", 1.65, 6.4, 0x7a5236, 0.3, 0.34);
    animal("sheep", 1.5, 5.3, COLORS.cream, -0.2, 0.55);
    meeple(1.8, 7.6, COLORS.coral, 0.2, 0.42);
    animal("sheep", 9.6, 6.7, COLORS.cream, 0.15, 0.5);
    animal("boar", 6.2, 7.95, 0x7a5236, -0.3, 0.42);
    animal("sheep", 3.1, 8.0, COLORS.cream, -0.4, 0.42);
    // Out at the back, by the pinwheels and in front of the hoop
    meeple(-0.4, -5.3, COLORS.red, 0.3, 1.1);
    animal("boar", 2.3, -4.7, 0x7a5236, -0.3, 0.85);
    polyDie(20, -1.4, -4.7, COLORS.sage, -0.2);
    polyDie(8, 1.0, -5.5, COLORS.blue, -0.4);
    die(3.3, -4.3, "#ebbb55", "#4a3526", 0.3, 2);
  }

  /** A big sheet of paper lying on the table, with a note written on it */
  function noteCanvas() {
    const c = document.createElement("canvas");
    c.width = 700;
    c.height = 1110;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, 700, 1110);
    // Faint ruled lines, like a page torn from a notebook
    ctx.strokeStyle = "rgba(127, 159, 203, 0.35)";
    ctx.lineWidth = 3;
    for (let y = 70; y < 1110; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(700, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(220, 106, 82, 0.45)";
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(70, 1110);
    ctx.stroke();
    // The writing sits up the far side, on the part of the sheet in view
    ctx.fillStyle = "#4a3526";
    ctx.font = "600 68px Fredoka, Nunito, sans-serif";
    ctx.fillText("toys:", 100, 118);
    ctx.font = "500 44px Fredoka, Nunito, sans-serif";
    const words = "an object or system you play with just for the joy of tinkering around".split(" ");
    let line = "";
    let y = 180;
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > 560) {
        ctx.fillText(line, 100, y);
        line = w;
        y += 60;
      } else line = next;
    }
    ctx.fillText(line, 100, y);
    return c;
  }

  function note(x, z) {
    const w = 2.3;
    const h = 3.7;
    const paper = canvasMaterial(noteCanvas());
    const blank = mat(COLORS.cream);
    // Box faces +x, -x, +y, -y, +z, -z: the writing is on top
    const card = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, h), [blank, blank, paper, blank, blank, blank]);
    card.position.y = 0.01;
    const g = new THREE.Group();
    g.add(card);
    return addProp(g, [RAPIER.ColliderDesc.cuboid(w / 2, 0.01, h / 2).setTranslation(0, 0.01, 0).setDensity(0.3)], new THREE.Vector3(x, 0, z), 0.03);
  }

  /** A yellow hexagonal pencil, sharpened, with a pink eraser, lying down */
  function pencil(x, z, rotY) {
    const g = new THREE.Group();
    const part = (geom, color) => {
      const m = new THREE.Mesh(geom.rotateZ(-Math.PI / 2), mat(color));
      m.position.y = 0.065;
      g.add(m);
    };
    part(new THREE.CylinderGeometry(0.065, 0.065, 1.0, 6).translate(0, -0.02, 0), COLORS.mustard);
    part(new THREE.CylinderGeometry(0.004, 0.065, 0.2, 6).translate(0, 0.58, 0), COLORS.wood);
    part(new THREE.CylinderGeometry(0.004, 0.024, 0.06, 6).translate(0, 0.65, 0), COLORS.ink);
    part(new THREE.CylinderGeometry(0.068, 0.068, 0.09, 12).translate(0, -0.565, 0), 0xc9c2b4);
    part(new THREE.CylinderGeometry(0.064, 0.064, 0.1, 12).translate(0, -0.66, 0), 0xe89aa0);
    return addProp(g, [RAPIER.ColliderDesc.capsule(0.62, 0.065).setTranslation(0, 0.065, 0).setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2))], new THREE.Vector3(x, 0, z), rotY);
  }

  /** A fat felt-tip marker with its cap on, lying down */
  function marker(x, z, rotY, color) {
    const g = new THREE.Group();
    const part = (geom, c) => {
      const m = new THREE.Mesh(geom.rotateZ(-Math.PI / 2), mat(c));
      m.position.y = 0.1;
      g.add(m);
    };
    part(new THREE.CylinderGeometry(0.1, 0.1, 0.62, 16).translate(0, -0.15, 0), COLORS.cream);
    part(new THREE.CylinderGeometry(0.105, 0.105, 0.36, 16).translate(0, 0.32, 0), color);
    part(new THREE.CylinderGeometry(0.06, 0.1, 0.06, 16).translate(0, 0.53, 0), color);
    part(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16).translate(0, -0.485, 0), color);
    return addProp(g, [RAPIER.ColliderDesc.capsule(0.42, 0.1).setTranslation(0, 0.1, 0).setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2))], new THREE.Vector3(x, 0, z), rotY);
  }

  /**
   * Dominoes stood along a winding path, each one square to it. Where the
   * path heads away from you, they face you.
   */
  function dominoPath(points, count) {
    const path = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
    const size = [U * 0.22, U * 1.6, U * 0.8];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const p = path.getPointAt(u);
      const t = path.getTangentAt(u);
      block("box", size, i % 2 ? COLORS.blue : COLORS.cream, p.x, size[1] / 2, p.z, Math.atan2(-t.z, t.x));
    }
  }

  /**
   * A toy bookcase standing at the back, turned to face you. Its boards
   * are fixed in place; whatever stands on them can be knocked off.
   */
  const SHELF = { w: 3.4, d: 0.9, boards: [0.07, 1.3, 2.5, 3.7], board: 0.12 };
  function shelf(x, z) {
    const face = Math.atan2(-x, camera.position.z - z);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = face;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), face);
    const { w, d, board } = SHELF;
    const top = SHELF.boards[SHELF.boards.length - 1] + board / 2;
    const part = (pw, ph, pd, color, px, py, pz) => {
      const m = new THREE.Mesh(geo(`shelf${pw},${ph},${pd}`, () => new RoundedBoxGeometry(pw, ph, pd, 2, Math.min(pw, ph, pd) * 0.3)), mat(color));
      m.position.set(px, py, pz);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      const at = m.position.clone().applyQuaternion(q).add(g.position);
      world.createCollider(RAPIER.ColliderDesc.cuboid(pw / 2, ph / 2, pd / 2).setTranslation(at.x, at.y, at.z).setRotation(q).setFriction(0.7));
    };
    for (const side of [-1, 1]) part(board, top, d, COLORS.coral, side * (w / 2 - board / 2), top / 2, 0);
    for (const y of SHELF.boards) part(w - board * 2, board, d, COLORS.cream, 0, y, 0);
    part(w - board * 2, top, 0.05, COLORS.wood, 0, top / 2, -d / 2 + 0.025);
    g.userData.hit = { kind: "table" };
    scene.add(g);
    hittables.push(g);
    return { x, z, face, q };
  }

  /** Lay something out on a shelf board: make(x, z, yaw) as if on the table */
  function onShelf(sh, level, lx, make, lz = 0.05) {
    const at = new THREE.Vector3(lx, 0, lz).applyQuaternion(sh.q);
    standOn = SHELF.boards[level] + SHELF.board / 2;
    const prop = make(sh.x + at.x, sh.z + at.z, sh.face);
    standOn = 0;
    return prop;
  }

  /** Books, mugs and meeples on the two bookcases */
  function shelfToys({ left, right }) {
    const row = (sh, level, from, books) => {
      let lx = from;
      for (const [h, t, color, lean] of books) {
        onShelf(sh, level, lx + t / 2, (x, z, yaw) => bookUpright(x, z, h, 0.62, t, color, yaw + lean));
        lx += t + 0.02;
      }
    };
    row(left, 0, -1.45, [[0.98, 0.22, COLORS.navy, 0], [0.9, 0.18, COLORS.coral, 0], [1.0, 0.26, COLORS.sage, 0], [0.86, 0.2, COLORS.mustard, 0]]);
    onShelf(left, 0, 0.9, (x, z, yaw) => mug(x, z, COLORS.cream, yaw + 2.6));
    onShelf(left, 1, 0.75, (x, z, yaw) => animal("boar", x, z, 0x7a5236, yaw + 0.2, 0.9));
    onShelf(left, 2, -0.6, (x, z, yaw) => book(x, 0.11, z, 1.1, 0.75, 0.22, COLORS.red, yaw + 0.1));
    onShelf(left, 2, -0.6, (x, z, yaw) => book(x, 0.31, z, 1.0, 0.7, 0.18, COLORS.blue, yaw - 0.15));
    onShelf(left, 2, 0.8, (x, z, yaw) => mug(x, z, COLORS.coral, yaw + 2.2));
    onShelf(left, 3, 0.4, (x, z, yaw) => meeple(x, z, COLORS.sage, yaw - 0.3, 1.5));

    onShelf(right, 0, -0.7, (x, z, yaw) => book(x, 0.11, z, 1.1, 0.8, 0.22, COLORS.navy, yaw + 0.15));
    onShelf(right, 0, -0.7, (x, z, yaw) => book(x, 0.31, z, 1.0, 0.74, 0.18, COLORS.coral, yaw - 0.12));
    onShelf(right, 0, -0.7, (x, z, yaw) => book(x, 0.53, z, 0.92, 0.7, 0.26, COLORS.sage, yaw + 0.3));
    onShelf(right, 0, 0.9, (x, z, yaw) => animal("sheep", x, z, COLORS.cream, yaw + 0.1, 0.75));
    onShelf(right, 1, -0.7, (x, z, yaw) => mug(x, z, COLORS.mustard, yaw + 2.8));
    row(right, 2, -0.2, [[0.96, 0.2, COLORS.red, 0], [1.0, 0.24, COLORS.cream, 0], [0.9, 0.18, COLORS.blue, 0], [0.98, 0.22, COLORS.mustard, 0], [0.86, 0.2, COLORS.sage, 0]]);
    onShelf(right, 2, -1.0, (x, z, yaw) => meeple(x, z, COLORS.navy, yaw - 0.2));
    onShelf(right, 3, -0.5, (x, z, yaw) => mug(x, z, COLORS.sage, yaw + 2.4));
  }

  // ---------------------------------------------------------------- hoop
  /** A toy basketball hoop's net: a loose diamond mesh of cord */
  function netCanvas() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = 5;
    for (let i = -8; i < 24; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 16, 0);
      ctx.lineTo(i * 16 + 128, 128);
      ctx.moveTo(i * 16, 0);
      ctx.lineTo(i * 16 - 128, 128);
      ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(256, 4);
    ctx.stroke();
    return c;
  }
  function boardCanvas() {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 210;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, 320, 210);
    ctx.strokeStyle = "#dc6a52";
    ctx.lineWidth = 12;
    ctx.strokeRect(14, 14, 292, 182);
    ctx.strokeRect(112, 92, 96, 76);
    return c;
  }

  const hoopState = { center: new THREE.Vector3(), r: 0.44, net: null, swish: 0, swishV: 0, scores: 0 };
  /**
   * A big toy hoop standing at the back of the table, the centrepiece once
   * the pages have scrolled away. Darts fly at it like at anything else:
   * a basket takes a lucky bounce off the board or the rim. Everything is
   * drawn at size 1 and scaled by s.
   */
  function hoop(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const add = (mesh, px, py, pz) => {
      mesh.position.set(px * s, py * s, pz * s);
      mesh.scale.setScalar(s);
      mesh.castShadow = mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    const r = 0.36;
    add(new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.2, 1.0, 2, 0.06), mat(COLORS.navy)), 0, 0.1, -0.5);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.2, 14), mat(COLORS.cream)), 0, 1.7, -0.75);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.12, 0.45, 2, 0.03), mat(COLORS.cream)), 0, 3.05, -0.55);
    const boardMat = canvasMaterial(boardCanvas());
    add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.05, 0.08), [mat(COLORS.cream), mat(COLORS.cream), mat(COLORS.cream), mat(COLORS.cream), boardMat, mat(COLORS.cream)]), 0, 3.0, -0.3);
    const rimY = 2.62;
    const rimZ = -0.26 + 0.05 + r;
    add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 10, 32).rotateX(Math.PI / 2), mat(COLORS.coral)), 0, rimY, rimZ);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.08, 0.12, 2, 0.02), mat(COLORS.coral)), 0, rimY, -0.22);
    const netTex = new THREE.CanvasTexture(netCanvas());
    netTex.wrapS = THREE.RepeatWrapping;
    netTex.colorSpace = THREE.SRGBColorSpace;
    const net = add(
      new THREE.Mesh(
        new THREE.LatheGeometry([new THREE.Vector2(r, 0), new THREE.Vector2(r * 0.8, -0.28), new THREE.Vector2(r * 0.62, -0.52)], 24),
        new THREE.MeshStandardMaterial({ map: netTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 })
      ),
      0,
      rimY,
      rimZ
    );
    net.castShadow = false;
    g.userData.hit = { kind: "table" };
    scene.add(g);
    hittables.push(g);
    hoopState.net = net;
    hoopState.r = r * s;
    hoopState.size = s;
    hoopState.center.set(x, rimY * s, z + rimZ * s);

    // Fixed colliders: the board for bank shots, a ring of beads for the rim
    const at = (px, py, pz) => ({ x: x + px * s, y: py * s, z: z + pz * s });
    const fixed = (desc, p) => world.createCollider(desc.setTranslation(p.x, p.y, p.z).setFriction(0.5));
    fixed(RAPIER.ColliderDesc.cuboid(0.65 * s, 0.1 * s, 0.5 * s), at(0, 0.1, -0.5));
    fixed(RAPIER.ColliderDesc.cylinder(1.6 * s, 0.08 * s), at(0, 1.7, -0.75));
    fixed(RAPIER.ColliderDesc.cuboid(0.8 * s, 0.525 * s, 0.04 * s).setRestitution(0.35), at(0, 3.0, -0.3));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      fixed(RAPIER.ColliderDesc.ball(0.04 * s).setRestitution(0.4), at(Math.cos(a) * r, rimY, rimZ + Math.sin(a) * r));
    }
  }

  // ------------------------------------------------------------ pinwheels
  /**
   * Paper pinwheels on sticks: four tan blades whose points curl toward
   * you, with the coloured underside folded in between them, like the ones from a fair. A
   * dart pushing on any blade turns it, hardest out at the points, and
   * it spins down slowly. The blades are kinematic, so darts glance off
   * them as they turn.
   */
  const mills = [];
  /** One pinwheel head's geometry: the coloured folds and the tan blades */
  function pinwheelGeometry(a) {
    const square = [];
    const blades = [];
    const at = (r, deg, z = 0) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180), z];
    for (let k = 0; k < 4; k++) {
      const t = k * 90;
      // The coloured underside shows only in a fold between two blades,
      // inside the reach of the blades
      square.push(0, 0, 0.01, ...at(a * 0.9, t - 50), ...at(a, t));
      // The folded blade: from the middle out along one side to a point past the corner
      blades.push(0, 0, 0.03, ...at(a, t, 0.04), ...at(a * 1.5, t + 36, a * 0.28));
    }
    const make = (pts) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      g.computeVertexNormals();
      return g;
    };
    return { square: make(square), blades: make(blades) };
  }

  function pinwheel(x, z, size, color, turn) {
    const s = size;
    const yaw = Math.atan2(-x, camera.position.z - z) + turn;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const stickH = 2.3 * s;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.05 * s, stickH, 8), mat(0xa39a8c));
    stick.position.set(x, stickH / 2, z);
    stick.castShadow = stick.receiveShadow = true;
    stick.userData.hit = { kind: "table" };
    scene.add(stick);
    hittables.push(stick);
    world.createCollider(RAPIER.ColliderDesc.cylinder(stickH / 2, 0.06 * s).setTranslation(x, stickH / 2, z).setFriction(0.6));

    // The head is pinned to the front of the stick, near its top
    const hub = new THREE.Vector3(0, stickH - 0.12 * s, 0.08 * s).applyQuaternion(q).add(new THREE.Vector3(x, 0, z));
    const axis = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const a = 0.5 * s;
    const R = a * 1.5;
    const { square, blades } = pinwheelGeometry(a);
    const head = new THREE.Group();
    head.position.copy(hub);
    head.quaternion.copy(q);
    const paper = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
    head.add(new THREE.Mesh(square, paper(color)), new THREE.Mesh(blades, paper(0xd8c08a)));
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 10, 8), mat(COLORS.cream));
    pin.position.z = 0.06 * s;
    head.add(pin);
    // The head turns all the time, so it casts no shadow: the sun's shadow
    // map is only redrawn when something on the table moves
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(hub.x, hub.y, hub.z).setRotation(q));
    for (let k = 0; k < 4; k++) {
      const ang = ((k * 90 + 30) * Math.PI) / 180;
      const qb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ang);
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(R * 0.45, a * 0.32, 0.05 * s).setTranslation(Math.cos(ang) * R * 0.5, Math.sin(ang) * R * 0.5, 0.06 * s).setRotation(qb),
        body
      );
    }
    const mill = { sails: head, body, q, axis, hub, R, size: s, angle: 0, spin: 0.6, hits: 0 };
    head.userData.hit = { kind: "windmill", mill };
    scene.add(head);
    hittables.push(head);
    mills.push(mill);
    return mill;
  }

  /** A dart pushing on a blade: the blades' tilt turns the push into spin */
  function pushMill(mill, point, dir, force) {
    const r = point.clone().sub(mill.hub);
    const reach = Math.min(1, r.length() / mill.R);
    // Square on: the pitched sails turn it one way; across: the lever does too
    const head = -dir.dot(mill.axis);
    const lever = r.clone().cross(dir).dot(mill.axis) / mill.R;
    mill.spin += (head * 5.5 * reach + lever * 2.5) * force / mill.size;
    mill.hits++;
    active = true;
  }

  const qSpin = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  function turnMills(dt) {
    for (const m of mills) {
      if (Math.abs(m.spin) < 0.002) continue;
      m.angle += m.spin * dt;
      // A slow spin-down, with a gentle breeze that never quite stops it
      const breeze = 0.35 / m.size;
      m.spin += (breeze * Math.sign(m.spin || 1) - m.spin) * Math.min(1, dt * 0.35);
      m.sails.quaternion.copy(m.q).multiply(qSpin.setFromAxisAngle(zAxis, m.angle));
      dirty = true;
    }
  }

  function placeMills() {
    for (const m of mills) {
      qSpin.setFromAxisAngle(zAxis, m.angle);
      const q = m.q.clone().multiply(qSpin);
      m.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
  }

  /** Paper confetti for a basket */
  const confetti = (() => {
    const count = 40;
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.14), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), count);
    const palette = [0xdc6a52, 0xebbb55, 0x7f9fcb, 0x93a86c, 0xe9906d].map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) mesh.setColorAt(i, palette[i % palette.length]);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    const bits = Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), spin: 0 }));
    return { mesh, bits, age: 1 };
  })();

  function basket() {
    hoopState.scores++;
    hoopState.swishV += 6;
    cheers.push(1);
    confetti.age = 0;
    confetti.mesh.visible = true;
    for (const b of confetti.bits) {
      b.p.copy(hoopState.center);
      b.v.set((Math.random() - 0.5) * 4, 3 + Math.random() * 4, (Math.random() - 0.3) * 3);
      b.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      b.spin = (Math.random() - 0.5) * 16;
    }
  }

  const confettiM = new THREE.Matrix4();
  const confettiQ = new THREE.Quaternion();
  const confettiS = new THREE.Vector3(1, 1, 1);
  function animateHoop(dt) {
    if (Math.abs(hoopState.swish) + Math.abs(hoopState.swishV) > 0.0005) {
      hoopState.swishV += (-120 * hoopState.swish - 7 * hoopState.swishV) * dt;
      hoopState.swish += hoopState.swishV * dt;
      const s = hoopState.swish * 0.18;
      hoopState.net.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5).multiplyScalar(hoopState.size);
      dirty = true;
    }
    if (confetti.age >= 1) return;
    confetti.age = Math.min(1, confetti.age + dt / 1.8);
    confetti.bits.forEach((b, i) => {
      b.v.y -= 9 * dt;
      b.v.multiplyScalar(1 - 1.6 * dt);
      b.p.addScaledVector(b.v, dt);
      b.r.x += b.spin * dt;
      b.r.y += b.spin * 0.6 * dt;
      confettiQ.setFromEuler(b.r);
      confettiS.setScalar(confetti.age > 0.75 ? (1 - confetti.age) * 4 : 1);
      confetti.mesh.setMatrixAt(i, confettiM.compose(b.p, confettiQ, confettiS));
    });
    confetti.mesh.instanceMatrix.needsUpdate = true;
    if (confetti.age >= 1) confetti.mesh.visible = false;
    dirty = true;
  }

  /** A doodle that stands in until a real picture goes in the frame */
  function placeholderCanvas(seed) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 200;
    const ctx = c.getContext("2d");
    const rand = rng(seed);
    ctx.fillStyle = ["#cfe2ef", "#f6e3c6", "#dfe9cf", "#f3d6cc"][seed % 4];
    ctx.fillRect(0, 0, 256, 200);
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(60 + rand() * 140, 55, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93a86c";
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(0, 150);
    ctx.quadraticCurveTo(80, 90 + rand() * 30, 150, 140);
    ctx.quadraticCurveTo(210, 110, 256, 135);
    ctx.lineTo(256, 200);
    ctx.fill();
    return c;
  }

  /**
   * A standing picture frame leaning back on its stand. src is a picture
   * to show; until there is one, a doodle stands in.
   */
  function pictureFrame(x, z, w, h, color, src, seed) {
    const t = 0.13;
    const d = 0.12;
    const lean = 0.2;
    const g = new THREE.Group();
    const face = new THREE.Group();
    // Leaning back from its bottom edge, which rests on the table
    face.position.set(0, Math.cos(lean) * h * 0.5, -Math.sin(lean) * h * 0.5);
    face.rotation.x = -lean;
    const part = (pw, ph, pd, c, px, py, pz) => {
      const m = new THREE.Mesh(geo(`frame${pw},${ph},${pd}`, () => new RoundedBoxGeometry(pw, ph, pd, 2, Math.min(pw, ph, pd) * 0.3)), mat(c));
      m.position.set(px, py, pz);
      face.add(m);
    };
    part(w, t, d, color, 0, h / 2 - t / 2, 0);
    part(w, t, d, color, 0, -h / 2 + t / 2, 0);
    part(t, h - t * 2, d, color, -w / 2 + t / 2, 0, 0);
    part(t, h - t * 2, d, color, w / 2 - t / 2, 0, 0);
    part(w - 0.04, h - 0.04, 0.03, COLORS.wood, 0, 0, -d / 2 + 0.02);
    const picture = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(placeholderCanvas(seed)), roughness: 0.7 });
    picture.map.colorSpace = THREE.SRGBColorSpace;
    if (src) {
      new THREE.TextureLoader().load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        picture.map = tex;
        picture.needsUpdate = true;
        dirty = true;
      });
    }
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(w - t * 2 + 0.02, h - t * 2 + 0.02), picture);
    photo.position.z = 0.0;
    face.add(photo);
    g.add(face);
    // The stand: a strut from the back of the frame down to the table
    const top = new THREE.Vector3(0, h * 0.2, -d / 2).applyEuler(face.rotation).add(face.position);
    const foot = new THREE.Vector3(0, 0.03, -h * 0.55);
    const legLen = top.distanceTo(foot);
    const leg = new THREE.Mesh(geo(`leg${legLen.toFixed(2)}`, () => new RoundedBoxGeometry(0.1, legLen, 0.05, 2, 0.02)), mat(color));
    leg.position.copy(top).add(foot).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
    g.add(leg);
    const qFace = new THREE.Quaternion().setFromEuler(face.rotation);
    return addProp(
      g,
      [
        RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(face.position.x, face.position.y, face.position.z).setRotation(qFace).setDensity(0.6),
        RAPIER.ColliderDesc.cuboid(0.05, legLen / 2, 0.03).setTranslation(leg.position.x, leg.position.y, leg.position.z).setRotation(leg.quaternion).setDensity(0.6),
      ],
      new THREE.Vector3(x, 0, z),
      Math.atan2(-x, camera.position.z - z) + ((seed * 0.37) % 0.3) - 0.15
    );
  }

  // A toy table laid out for its own sake. The pages lie on top of it.
  backWall(-9.6);
  castle(-8.5, -5);
  pinwheel(-2.5, -4.4, 1.0, 0x4a4446, 0.3);
  pinwheel(-3.9, -5.8, 0.75, 0x6f9a4c, 0.45);
  pinwheel(-3.8, -4.0, 0.6, 0x6e5c9e, 0.4);
  pinwheel(4.6, -5.3, 0.9, 0xc8574a, -0.35);
  house(11.6, -6.8, -0.35);
  tree(2.9, -3.4, { kind: "egg", scale: 0.95, color: COLORS.green });
  if (skills.length) skillWall(skills);
  tree(-12.2, -6.8, { kind: "egg", scale: 1.25, color: COLORS.sage });
  tree(-10.6, -7.6, { kind: "cone", scale: 1.1, color: COLORS.green });
  tree(14.4, -5.4, { kind: "cone", scale: 1.1, color: COLORS.olive });
  tree(-13.6, 2.4, { kind: "cone", scale: 0.95, color: COLORS.olive });
  tree(14, 3.6, { kind: "cone", scale: 0.85, color: COLORS.green });
  // The hoop stands at the back, between two shelves of odds and ends.
  // It shows once the pages have scrolled away.
  hoop(0.4, -7, 1.75);
  const shelves = { left: shelf(-4.6, -8.4), right: shelf(5.4, -8.4) };
  shelfToys(shelves);
  // Picture frames on the table and the shelves. Put a picture's path in FRAMES to show it.
  FRAMES.forEach((f, i) => {
    if (f.on === "table") pictureFrame(f.x, f.z, f.w, f.h, COLORS[f.color], f.src, i + 1);
    else onShelf(shelves[f.on], f.level, f.lx, (x, z) => pictureFrame(x, z, f.w, f.h, COLORS[f.color], f.src, i + 1), f.lz);
  });
  // Near the front edge: a note with a pencil and a marker by the porcupine,
  // dice and meeples in the middle, and dominoes snaking off to the right
  // The sheet runs off the edge of the view; the pencil and marker lie on it
  note(-5.5, 7.4);
  standOn = 0.02;
  pencil(-5.0, 7.95, 0.45);
  marker(-5.8, 8.6, -0.1, COLORS.red);
  standOn = 0;
  deskToys();
  // An S: away from you, over, back toward you, round, and off to the
  // right past the edge of the view
  dominoPath([[2.3, 9], [2.4, 7.5], [2.5, 5.9], [3.3, 4.9], [4.2, 5.5], [4.6, 6.9], [5.5, 7.6], [6.5, 7.1], [7.4, 6.1], [8.8, 5.6], [10.4, 5.5], [12, 5.6]], 33);

  // ------------------------------------------------------------ porcupine
  /**
   * A yarn ball with a snout and feet. Darts that hit it stay for good and
   * turn into its quills. It can be nudged but never rolls onto its back.
   */
  const porcupine = (() => {
    const R = 0.8;
    const g = new THREE.Group();
    const yarn = canvasMaterial(yarnCanvas());
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), yarn);
    ball.position.y = R + 0.12;
    g.add(ball);
    const snout = new THREE.Mesh(softCone(0.3, 0.5), mat(COLORS.cream));
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, R * 0.95, R * 0.92);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), mat(COLORS.ink));
    nose.position.set(0, R * 0.95, R * 0.92 + 0.26);
    g.add(snout, nose);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(COLORS.ink));
      eye.position.set(side * 0.25, R * 1.28, R * 0.78);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8).scale(1, 1, 0.5), mat(COLORS.cream));
      ear.position.set(side * 0.42, R * 1.62, R * 0.42);
      g.add(eye, ear);
      for (const front of [-1, 1]) {
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8).scale(1, 0.55, 1.3), mat(COLORS.cream));
        foot.position.set(side * 0.42, 0.09, front * 0.38 + 0.08);
        g.add(foot);
      }
    }
    // A few short yarn spikes on the back, so it reads as a porcupine
    const spikes = [];
    const rand = rng(5);
    for (let i = 0; i < 16; i++) {
      const a = (rand() - 0.5) * Math.PI * 1.3;
      const b = 0.35 + rand() * 0.9;
      const n = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), -Math.cos(a) * Math.cos(b) * 0.9 - 0.25).normalize();
      const cone = softCone(0.09, 0.42);
      cone.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n));
      cone.translate(n.x * (R + 0.12), R + 0.12 + n.y * (R + 0.12), n.z * (R + 0.12));
      spikes.push(cone);
    }
    g.add(new THREE.Mesh(mergeGeometries(spikes), mat(COLORS.navy)));
    const prop = addProp(
      g,
      [RAPIER.ColliderDesc.ball(R).setTranslation(0, R + 0.12, 0).setDensity(0.4)],
      new THREE.Vector3(-7.4, 0, 3),
      0.3,
      (d) => d.enabledRotations(false, true, false).setAngularDamping(2.5).setLinearDamping(0.6)
    );
    g.userData.hit = { kind: "porcupine", prop };
    return { prop, obj: g, center: new THREE.Vector3(0, R + 0.12, 0), quills: [] };
  })();

  // -------------------------------------------------------------- clouds
  const stringMat = new THREE.MeshBasicMaterial({ color: 0x7a6450 });
  const stringGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 4);
  /**
   * Strings run up out of view to a pivot high above, even on a tall phone
   * screen. A swing's angle is scaled by SWAY, so it moves the cloud as far
   * as it would on a 10-unit string.
   */
  const STRING = 30;
  const SWAY = 10 / STRING;
  function hanging(canvasEl, w, h, pos) {
    const tex = new THREE.CanvasTexture(canvasEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    const pivot = new THREE.Group();
    pivot.position.set(pos.x, pos.y + h / 2 + STRING, pos.z);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      // Unlit, so the paper stays bright whichever way it swings
      new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false })
    );
    mesh.position.y = -STRING - h / 2;
    pivot.add(mesh);
    // Each string runs on down behind the paper to its middle, so it is
    // tied on wherever the outline dips
    const top = 4;
    const bottom = -STRING - h / 2;
    for (const sx of [-w * 0.22, w * 0.22]) {
      const s = new THREE.Mesh(stringGeo, stringMat);
      s.scale.y = top - bottom;
      s.position.set(sx, (top + bottom) / 2, -0.02);
      pivot.add(s);
    }
    scene.add(pivot);
    const cloud = { pivot, mesh, canvas: canvasEl, ax: 0, ay: 0, az: 0, vx: 0, vy: 0, vz: 0, hits: 0 };
    mesh.userData.hit = { kind: "cloud", cloud };
    hittables.push(mesh);
    clouds.push(cloud);
    return cloud;
  }
  hanging(cloudCanvas(3), 3.6, 2, new THREE.Vector3(-11.5, 7.6, -7.5));
  hanging(cloudCanvas(8, true), 2.8, 2.1, new THREE.Vector3(-5, 8.8, -9.5));
  hanging(cloudCanvas(5), 3.4, 1.9, new THREE.Vector3(8.6, 8, -8));
  hanging(cloudCanvas(13, true), 2.3, 1.72, new THREE.Vector3(13.2, 6.4, -5.5));
  hanging(sunCanvas(), 2.8, 2.8, new THREE.Vector3(12.2, 9.6, -10.5));

  function swingClouds(dt) {
    for (const c of clouds) {
      if (Math.abs(c.ax) + Math.abs(c.ay) + Math.abs(c.az) + Math.abs(c.vx) + Math.abs(c.vy) + Math.abs(c.vz) < 0.0001) continue;
      // A pendulum each way, and a slower twist that the two strings pull back
      const k = 6;
      const damp = 0.45;
      c.vx += (-k * c.ax - damp * c.vx) * dt;
      c.vz += (-k * c.az - damp * c.vz) * dt;
      c.vy += (-3 * c.ay - 0.6 * c.vy) * dt;
      c.ax += c.vx * dt;
      c.ay += c.vy * dt;
      c.az += c.vz * dt;
      c.pivot.rotation.set(c.ax, c.ay, c.az);
      dirty = true;
    }
  }

  // --------------------------------------------------------------- train
  /**
   * A wooden engine pulling two cars, each carrying a target, on a wooden
   * track that winds back and forth in the open strips either side of the
   * pages. It runs slower there and quicker through the middle, so it
   * spends its time where it can be seen. It comes in from the far left,
   * goes out at the far right, waits off the table and comes again. Each
   * car is kinematic, so it shoves anything left lying on its track.
   */
  const train = (() => {
    const curve = new THREE.CatmullRomCurve3(TRACK.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
    const length = curve.getLength();

    /** A box section swept along the curve, offset sideways by off */
    function sweep(off, halfW, y0, y1, segs) {
      const pos = [];
      const idx = [];
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const p = curve.getPointAt(u);
        const t = curve.getTangentAt(u);
        const n = new THREE.Vector3(-t.z, 0, t.x).normalize();
        const l = p.clone().addScaledVector(n, off - halfW);
        const r = p.clone().addScaledVector(n, off + halfW);
        pos.push(l.x, y0, l.z, l.x, y1, l.z, r.x, y1, r.z, r.x, y0, r.z);
      }
      const quad = (a, b, c, d) => idx.push(a, c, b, a, d, c);
      for (let i = 0; i < segs; i++) {
        const a = i * 4;
        const b = a + 4;
        quad(a, b, b + 1, a + 1);
        quad(a + 1, b + 1, b + 2, a + 2);
        quad(a + 2, b + 2, b + 3, a + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    // A wooden toy track: one plank with two grooves for the wheels
    const segs = 420;
    const bed = sweep(0, 0.55, 0, 0.1, segs);
    const plank = new THREE.Mesh(bed, mat(COLORS.wood));
    plank.receiveShadow = plank.castShadow = true;
    const grooves = new THREE.Group();
    for (const side of [-1, 1]) grooves.add(new THREE.Mesh(sweep(side * 0.32, 0.06, 0.1, 0.104, segs), mat(COLORS.trunk)));
    const rails = new THREE.Group();
    rails.add(plank, grooves);
    rails.userData.hit = { kind: "table" };
    scene.add(rails);
    hittables.push(rails);
    world.createCollider(
      RAPIER.ColliderDesc.trimesh(new Float32Array(bed.attributes.position.array), new Uint32Array(bed.index.array)).setFriction(0.8)
    );

    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 18).rotateX(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 10).rotateX(Math.PI / 2);
    const wheels = [];
    const box = (size, color, x, y, z = 0) => {
      const mesh = new THREE.Mesh(geo(`tbox${size}`, () => new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.2)), mat(color));
      mesh.position.set(x, y, z);
      return mesh;
    };
    const cyl = (r, h, color, x, y, z = 0, axisX = false) => {
      const g = new THREE.CylinderGeometry(r, r, h, 18);
      if (axisX) g.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(g, mat(color));
      mesh.position.set(x, y, z);
      return mesh;
    };
    function axles(car, xs, color) {
      for (const x of xs) {
        for (const side of [-1, 1]) {
          const w = new THREE.Group();
          w.position.set(x, 0.38, side * 0.47);
          w.add(new THREE.Mesh(wheelGeo, mat(color)), new THREE.Mesh(hubGeo, mat(COLORS.wood)));
          car.add(w);
          wheels.push(w);
        }
      }
    }
    // Moving all the time, each car wears a soft blob shadow of its own
    // instead of making the sun's shadow map redraw every frame
    const blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobCanvas()), transparent: true, depthWrite: false });
    function blob(car, len) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.5, 1.5).rotateX(-Math.PI / 2), blobMat);
      b.position.set(0.25, 0.115, -0.2);
      b.raycast = () => {};
      car.add(b);
    }

    const loco = new THREE.Group();
    loco.add(
      box([2.2, 0.22, 0.86], COLORS.navy, 0, 0.5),
      cyl(0.34, 1.15, COLORS.red, 0.42, 0.95, 0, true),
      cyl(0.36, 0.06, COLORS.cream, 1.02, 0.95, 0, true),
      box([0.8, 0.9, 0.86], COLORS.mustard, -0.6, 1.06),
      box([0.42, 0.32, 0.9], COLORS.cream, -0.6, 1.2),
      box([1.02, 0.12, 1.02], COLORS.red, -0.6, 1.57),
      cyl(0.12, 0.38, COLORS.navy, 0.75, 1.44),
      cyl(0.18, 0.1, COLORS.navy, 0.75, 1.66),
      box([0.08, 0.18, 0.8], COLORS.red, 1.13, 0.5)
    );
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat(COLORS.mustard));
    dome.position.set(0.2, 1.27, 0);
    loco.add(dome);
    axles(loco, [-0.65, 0, 0.65], COLORS.red);
    blob(loco, 2.2);

    const bullseye = canvasMaterial(bullseyeCanvas());
    const targets = [];
    const cars = [{ obj: loco, gap: 0, half: [1.1, 0.75, 0.5], at: [0, 0.9, 0] }];
    for (const c of [{ gap: 2.3, color: COLORS.blue, tub: COLORS.cream, r: 0.6 }, { gap: 4.4, color: COLORS.sage, tub: COLORS.mustard, r: 0.4 }]) {
      const car = new THREE.Group();
      car.add(box([1.8, 0.22, 0.86], c.color, 0, 0.5), box([1.7, 0.36, 0.84], c.tub, 0, 0.79), box([0.36, 0.08, 0.1], COLORS.ink, 1.0, 0.48));
      axles(car, [-0.55, 0.55], COLORS.mustard);
      blob(car, 1.8);
      // The target turns to face you wherever the track goes, and leans
      // back on its post when a dart hits it
      const pivot = new THREE.Group();
      pivot.rotation.order = "YXZ";
      pivot.position.set(0, 0.97, 0);
      const post = cyl(0.05, 0.6, COLORS.wood, 0, 0.3);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, 0.08, 32).rotateX(Math.PI / 2), [mat(COLORS.wood), bullseye, bullseye]);
      disc.position.set(0, 0.35 + c.r, 0);
      pivot.add(post, disc);
      car.add(pivot);
      const target = { pivot, disc, car, tilt: 0, spin: 0, hits: 0 };
      disc.userData.hit = { kind: "target", target };
      targets.push(target);
      cars.push({ obj: car, gap: c.gap, half: [0.9, 0.5, 0.48], at: [0, 0.6, 0] });
    }

    // Steam puffs from the chimney
    const puffs = [];
    const puffGeo = new THREE.SphereGeometry(0.2, 12, 8);
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 1, transparent: true, opacity: 0 }));
      p.visible = false;
      scene.add(p);
      puffs.push({ mesh: p, age: 1 });
    }

    for (const c of cars) {
      c.obj.traverse((o) => {
        if (o.isMesh && !o.material.transparent) o.receiveShadow = true;
      });
      c.obj.userData.hit = { kind: "train" };
      scene.add(c.obj);
      hittables.push(c.obj);
      c.body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
      world.createCollider(RAPIER.ColliderDesc.cuboid(...c.half).setTranslation(...c.at), c.body);
    }

    return { curve, length, cars, wheels, targets, puffs, s: reducedMotion ? length * 0.42 : -6, wait: reducedMotion ? Infinity : 1.5, puffClock: 0, moving: false };
  })();

  const yUp = new THREE.Vector3(0, 1, 0);
  const qYaw = new THREE.Quaternion();

  /** Where a car is s along the track: past either end it runs on straight */
  function trackPose(s, pos) {
    const L = train.length;
    const u = THREE.MathUtils.clamp(s / L, 0, 1);
    train.curve.getPointAt(u, pos);
    const t = train.curve.getTangentAt(u);
    if (s < 0) pos.addScaledVector(t, s);
    else if (s > L) pos.addScaledVector(t, s - L);
    return Math.atan2(-t.z, t.x);
  }

  function placeTrain(teleport) {
    for (const c of train.cars) {
      const yaw = trackPose(train.s - c.gap, c.obj.position);
      c.obj.rotation.y = yaw;
      qYaw.setFromAxisAngle(yUp, yaw);
      const p = c.obj.position;
      if (teleport) {
        c.body.setTranslation({ x: p.x, y: 0, z: p.z }, true);
        c.body.setRotation(qYaw, true);
      } else {
        c.next = { x: p.x, y: 0, z: p.z, q: { x: qYaw.x, y: qYaw.y, z: qYaw.z, w: qYaw.w } };
      }
    }
  }
  placeTrain(true);

  /** Slower in the open strips either side of the pages, quick behind them */
  function trainSpeed(x) {
    const ax = Math.abs(x);
    const side = THREE.MathUtils.smoothstep(ax, 4, 6.5) * (1 - THREE.MathUtils.smoothstep(ax, 13, 15.5));
    return THREE.MathUtils.lerp(TRAIN.fast, TRAIN.slow, side);
  }

  const camFlat = new THREE.Vector3();
  const discAt = new THREE.Vector3();

  function runTrain(dt) {
    if (train.wait > 0) {
      train.wait -= dt;
      train.moving = false;
      if (train.wait <= 0) {
        train.s = -6;
        placeTrain(true);
      } else return;
    }
    train.moving = true;
    train.s += trainSpeed(train.cars[0].obj.position.x) * dt;
    if (train.s - train.cars[train.cars.length - 1].gap > train.length + 4) train.wait = 3 + Math.random() * 5;
    placeTrain(false);
    for (const w of train.wheels) w.rotation.z = -train.s / 0.22;
    // A gentle chuff in time with the wheels
    const bob = Math.abs(Math.sin(train.s * 2.2)) * 0.02;
    for (const c of train.cars) c.obj.position.y = bob;
    train.puffClock -= dt;
    if (train.puffClock <= 0) {
      train.puffClock = 0.45;
      const p = train.puffs.find((q) => q.age >= 1);
      if (p) {
        p.age = 0;
        p.mesh.visible = true;
        p.mesh.position.set(0.75, 1.75, 0);
        train.cars[0].obj.localToWorld(p.mesh.position);
      }
    }
    active = true;
    dirty = true;
  }

  function animateTrainBits(dt) {
    for (const p of train.puffs) {
      if (p.age >= 1) continue;
      p.age = Math.min(1, p.age + dt / 1.6);
      p.mesh.position.y += dt * 0.9;
      p.mesh.scale.setScalar(0.6 + p.age * 1.6);
      p.mesh.material.opacity = 0.85 * (1 - p.age);
      if (p.age >= 1) p.mesh.visible = false;
      dirty = true;
    }
    camFlat.copy(camera.position);
    for (const t of train.targets) {
      // Turn the face toward the eye, whichever way the car is heading
      t.disc.getWorldPosition(discAt);
      const face = Math.atan2(camFlat.x - discAt.x, camFlat.z - discAt.z);
      t.pivot.rotation.y = face - t.car.rotation.y;
      if (Math.abs(t.tilt) + Math.abs(t.spin) > 0.0005) {
        t.spin += (-90 * t.tilt - 6 * t.spin) * dt;
        t.tilt += t.spin * dt;
        t.pivot.rotation.x = -t.tilt;
        dirty = true;
      }
    }
  }

  // --------------------------------------------------------------- darts
  const dartGeo = dartGeometry();
  const dartMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const yAxis = new THREE.Vector3(0, 1, 0);
  /** Idle darts, ready to fire again */
  const pool = [];
  /** Darts in play, oldest first: loose on the table or pinned to a target */
  const live = [];
  /** Darts on their last short flight into a target or the porcupine */
  const flights = [];
  /** Darts swinging round to stand out of the porcupine as quills */
  const settling = [];
  let made = 0;

  function makeDart() {
    const mesh = new THREE.Mesh(dartGeo, dartMat);
    mesh.castShadow = true;
    return mesh;
  }

  function newDart() {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setAngularDamping(0.5).setCcdEnabled(true).setCanSleep(true).setEnabled(false)
    );
    world.createCollider(RAPIER.ColliderDesc.capsule(0.2, 0.068).setDensity(9).setRestitution(0.45).setFriction(0.6), body);
    const obj = makeDart();
    obj.visible = false;
    scene.add(obj);
    made++;
    return {
      obj,
      body,
      dart: true,
      state: "idle",
      born: 0,
      dying: 0,
      p0: new THREE.Vector3(),
      q0: new THREE.Quaternion(),
      p1: new THREE.Vector3(),
      q1: new THREE.Quaternion(),
      moving: false,
      speed: 0,
      lastKnock: 0,
    };
  }

  /** An idle dart, or the oldest one in play when all are out */
  function takeDart() {
    let d = pool.pop();
    if (!d && made < POOL_MAX) d = newDart();
    if (!d) {
      d = live[0];
      release(d, false);
    }
    d.born = performance.now();
    d.dying = 0;
    d.obj.scale.setScalar(1);
    d.obj.visible = true;
    live.push(d);
    return d;
  }

  function dropFrom(list, item) {
    const i = list.indexOf(item);
    if (i >= 0) list.splice(i, 1);
  }

  function release(d, toPool = true) {
    dropFrom(live, d);
    if (d.state === "loose") {
      dropFrom(props, d);
      dropFrom(hittables, d.obj);
      d.body.setEnabled(false);
    }
    const f = flights.find((x) => x.d === d);
    if (f) dropFrom(flights, f);
    if (d.obj.parent !== scene) scene.add(d.obj);
    d.obj.visible = false;
    d.obj.userData.hit = null;
    d.state = "idle";
    d.moving = false;
    if (toPool) pool.push(d);
    dirty = shadowsDirty = true;
  }

  /** A foam dart body, flying, that bounces off whatever it meets */
  function spawnDart(pos, vel) {
    const d = takeDart();
    const q = new THREE.Quaternion().setFromUnitVectors(yAxis, vel.clone().normalize().negate());
    const b = d.body;
    b.setEnabled(true);
    b.setTranslation(pos, true);
    b.setRotation(q, true);
    b.setLinvel(vel, true);
    b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    b.wakeUp();
    d.obj.position.copy(pos);
    d.obj.quaternion.copy(q);
    d.p0.copy(pos);
    d.p1.copy(pos);
    d.q0.copy(q);
    d.q1.copy(q);
    d.moving = true;
    d.speed = 0;
    d.arc = 0;
    d.state = "loose";
    d.scored = false;
    d.obj.userData.hit = { kind: "prop", prop: d };
    props.push(d);
    hittables.push(d.obj);
    active = true;
    return d;
  }

  /**
   * A dart that will hold where it lands: it flies the last stretch on its
   * own, following the moving target, then joins it.
   */
  function pin(hit, from, dir) {
    const d = takeDart();
    d.state = "flying";
    d.obj.userData.hit = null;
    const attach = hit.kind === "target" ? hit.target.pivot : porcupine.obj;
    attach.updateWorldMatrix(true, false);
    flights.push({
      d,
      hit,
      attach,
      local: attach.worldToLocal(hit.point.clone()),
      from: from.clone(),
      dir: dir.clone(),
      q: new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().negate()),
      t: 0,
      dur: Math.max(0.02, hit.point.distanceTo(from) / DART_SPEED),
    });
    d.obj.position.copy(from);
    d.obj.quaternion.copy(flights[flights.length - 1].q);
  }

  const tmp = new THREE.Vector3();

  function flyPinned(dt) {
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.t += dt;
      f.attach.updateWorldMatrix(true, false);
      const to = f.attach.localToWorld(tmp.copy(f.local));
      const k = Math.min(1, f.t / f.dur);
      // The cup lands on the surface: the dart's middle stays 0.2 short of it
      f.d.obj.position.lerpVectors(f.from, to, k).addScaledVector(f.dir, -0.2);
      f.d.obj.quaternion.copy(f.q);
      dirty = true;
      if (k < 1) continue;
      flights.splice(i, 1);
      land(f);
    }
  }

  function land(f) {
    const d = f.d;
    f.attach.attach(d.obj);
    shadowsDirty = true;
    landings.push(f.hit.kind);
    if (f.hit.kind === "target") {
      const t = f.hit.target;
      d.state = "pinned";
      t.spin += 5 + Math.random() * 2;
      t.hits++;
      return;
    }
    // The porcupine keeps it: no longer in play, and never shrinks away
    d.state = "quill";
    dropFrom(live, d);
    made--;
    porcupine.quills.push(d);
    if (porcupine.quills.length > QUILLS_MAX) {
      const old = porcupine.quills.shift();
      old.obj.removeFromParent();
    }
    const normal = f.local.clone().sub(porcupine.center).normalize();
    settling.push({
      obj: d.obj,
      p0: d.obj.position.clone(),
      q0: d.obj.quaternion.clone(),
      p1: porcupine.center.clone().addScaledVector(normal, 0.8 + 0.12),
      q1: new THREE.Quaternion().setFromUnitVectors(yAxis, normal),
      t: 0,
    });
    const body = porcupine.prop.body;
    const push = f.dir.clone().setY(0).multiplyScalar(0.55);
    body.applyImpulseAtPoint(push, f.hit.point, true);
    active = true;
  }

  function settleQuills(dt) {
    for (let i = settling.length - 1; i >= 0; i--) {
      const s = settling[i];
      s.t = Math.min(1, s.t + dt / 0.22);
      // A little overshoot, like the quill springing upright
      const k = 1 + 2.4 * Math.pow(s.t - 1, 3) + 1.4 * Math.pow(s.t - 1, 2);
      s.obj.position.lerpVectors(s.p0, s.p1, k);
      s.obj.quaternion.slerpQuaternions(s.q0, s.q1, Math.min(1, k));
      dirty = shadowsDirty = true;
      if (s.t >= 1) settling.splice(i, 1);
    }
  }

  /** After ten seconds a dart shrinks away and goes back in the box */
  function ageDarts(now) {
    for (let i = live.length - 1; i >= 0; i--) {
      const d = live[i];
      if (d.state === "flying") continue;
      if (!d.dying && now - d.born > DART_LIFE) d.dying = now;
      if (!d.dying) continue;
      const t = (now - d.dying) / SHRINK;
      if (t >= 1) release(d);
      else {
        d.obj.scale.setScalar(1 - t * t);
        dirty = shadowsDirty = true;
      }
    }
  }

  // ----------------------------------------------------------- hit tests
  const raycaster = new THREE.Raycaster();
  const ndcV = new THREE.Vector2();
  const alphaProbe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  alphaProbe.canvas.width = alphaProbe.canvas.height = 1;

  function rootHit(obj) {
    while (obj && !obj.userData.hit) obj = obj.parent;
    return obj ? obj.userData.hit : null;
  }

  function solidAt(canvasEl, uv) {
    alphaProbe.clearRect(0, 0, 1, 1);
    alphaProbe.drawImage(canvasEl, Math.floor(uv.x * canvasEl.width), Math.floor((1 - uv.y) * canvasEl.height), 1, 1, 0, 0, 1, 1);
    return alphaProbe.getImageData(0, 0, 1, 1).data[3] > 127;
  }

  function pick(ndcX, ndcY) {
    ndcV.set(ndcX, ndcY);
    raycaster.setFromCamera(ndcV, camera);
    const dir = raycaster.ray.direction.clone();
    for (const h of raycaster.intersectObjects(hittables, true)) {
      if (!h.object.visible) continue;
      const info = rootHit(h.object);
      if (!info) continue;
      if (info.kind === "cloud" && !solidAt(info.cloud.canvas, h.uv)) continue;
      return { ...info, point: h.point.clone(), distance: h.distance, dir };
    }
    return { kind: "miss", dir, point: camera.position.clone().addScaledVector(dir, 30), distance: 30 };
  }

  /** A weak shot at the table or a toy falls short of it, instead of flying straight */
  function weak(hit, force) {
    return force <= WEAK.below && !["target", "porcupine", "cloud"].includes(hit.kind) && hit.distance > 5;
  }

  /** Where the flying dart is handed from the page to the table. A weak shot is the table's from the start. */
  function aim(ndcX, ndcY, force = 1) {
    const hit = pick(ndcX, ndcY);
    const dist = hit.kind === "cloud" ? hit.distance : Math.max(4, hit.distance - HANDOFF);
    return { hit, dist, weak: weak(hit, force), point: camera.position.clone().addScaledVector(hit.dir, dist) };
  }

  /**
   * A weak shot: thrown from your hand at `hand` (screen, -1..1) in an arc
   * that comes down on the crosshair.
   */
  function lob(hit, hand) {
    ndcV.set(hand[0], hand[1]);
    raycaster.setFromCamera(ndcV, camera);
    const start = raycaster.ray.at(2.5, new THREE.Vector3());
    const land = camera.position.clone().addScaledVector(hit.dir, hit.distance + WEAK.past);
    const flat = Math.hypot(land.x - start.x, land.z - start.z);
    const peak = Math.max((start.y + land.y) / 2 + WEAK.arc * flat, start.y + 0.1, land.y + 0.1);
    // Up to the peak, then down onto the landing point: that sets how long it is in the air
    const vy = Math.sqrt(-2 * GRAVITY * (peak - start.y));
    const t = vy / -GRAVITY + Math.sqrt((2 * (peak - land.y)) / -GRAVITY);
    const vel = new THREE.Vector3((land.x - start.x) / t, vy, (land.z - start.z) / t);
    // Nose first along the arc until it comes down
    spawnDart(start, vel).arc = Math.ceil(t / STEP);
  }

  /** The dart reaches the table. Returns what it met, for the sound. */
  function shoot(ndcX, ndcY, force = 1, hand = [0.3, -0.72]) {
    const { hit, dist, weak: isWeak } = aim(ndcX, ndcY, force);
    const dir = hit.dir;
    if (isWeak) {
      lob(hit, hand);
      return "weak";
    }
    if (hit.kind === "cloud") {
      const c = hit.cloud;
      // Pushed away, it swings back on its strings; the dart drops off it
      // An off-centre hit also turns it on its strings
      const off = THREE.MathUtils.clamp((hit.point.x - c.pivot.position.x) / 1.5, -1, 1);
      c.vx += -dir.z * 0.32 * SWAY;
      c.vz += (dir.x * 0.3 + (Math.random() - 0.5) * 0.12) * SWAY;
      c.vy += off * 2.4;
      c.hits++;
      spawnDart(hit.point.clone().addScaledVector(dir, -0.15), dir.clone().multiplyScalar(-5).add(new THREE.Vector3(0, -1.5, 0)));
      return "cloud";
    }
    const from = camera.position.clone().addScaledVector(dir, dist);
    if (hit.kind === "target" || hit.kind === "porcupine") {
      pin(hit, from, dir);
      return hit.kind;
    }
    if (hit.kind === "windmill") pushMill(hit.mill, hit.point, dir, force);
    // Everything else, the hoop too, flies straight along the aim
    spawnDart(from, dir.clone().multiplyScalar(DART_SPEED * force));
    return hit.kind;
  }

  // ---------------------------------------------------------------- loop
  let acc = 0;
  const knocks = [];
  /** Baskets made since the page last asked, for the cheer */
  const cheers = [];
  /** Darts that held on to a target or the porcupine, for their sound */
  const landings = [];

  /** A dart falling down through the rim, inside it, is a basket */
  function checkBasket(prop) {
    const c = hoopState.center;
    if (prop.scored || !(prop.p0.y > c.y && prop.p1.y <= c.y)) return;
    const k = (prop.p0.y - c.y) / (prop.p0.y - prop.p1.y);
    const x = prop.p0.x + (prop.p1.x - prop.p0.x) * k;
    const z = prop.p0.z + (prop.p1.z - prop.p0.z) * k;
    if (Math.hypot(x - c.x, z - c.z) > hoopState.r - 0.04) return;
    prop.scored = true;
    basket();
  }

  function stepOnce() {
    placeMills();
    if (train.moving) {
      for (const c of train.cars) {
        c.body.setNextKinematicTranslation(c.next);
        c.body.setNextKinematicRotation(c.next.q);
      }
    }
    for (const prop of props) {
      if (!prop.arc) continue;
      prop.arc--;
      const v = prop.body.linvel();
      prop.body.setRotation(new THREE.Quaternion().setFromUnitVectors(yAxis, new THREE.Vector3(v.x, v.y, v.z).normalize().negate()), false);
      prop.body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    }
    world.step();
    const now = performance.now();
    let awake = 0;
    for (let i = props.length - 1; i >= 0; i--) {
      const prop = props[i];
      const body = prop.body;
      if (body.isSleeping()) {
        if (prop.moving) {
          // Settled: rest exactly on the last pose
          prop.p0.copy(prop.p1);
          prop.q0.copy(prop.q1);
          prop.obj.position.copy(prop.p1);
          prop.obj.quaternion.copy(prop.q1);
          prop.moving = false;
          shadowsDirty = dirty = true;
        }
        prop.speed = 0;
        continue;
      }
      awake++;
      const t = body.translation();
      const r = body.rotation();
      prop.p0.copy(prop.p1);
      prop.q0.copy(prop.q1);
      prop.p1.set(t.x, t.y, t.z);
      prop.q1.set(r.x, r.y, r.z, r.w);
      prop.moving = true;
      const v = body.linvel();
      const speed = Math.hypot(v.x, v.y, v.z);
      // A sudden stop is a block landing on something
      const drop = prop.speed - speed;
      if (drop > 1.6) prop.arc = 0;
      if (drop > 1.6 && now - prop.lastKnock > 110) {
        prop.lastKnock = now;
        knocks.push({ strength: Math.min(1, drop / 9), small: Boolean(prop.dart) || body.mass() < 0.25 });
      }
      prop.speed = speed;
      if (prop.dart) checkBasket(prop);
      // Round things would roll on for ages: once barely moving for a
      // second, they stop and settle
      if (speed < 0.6) prop.slow = (prop.slow || 0) + STEP;
      else prop.slow = 0;
      if (prop.slow > 1) {
        prop.slow = 0;
        body.setLinvel({ x: 0, y: 0, z: 0 }, false);
        body.setAngvel({ x: 0, y: 0, z: 0 }, false);
        body.sleep();
      }
      if (t.y < -12 || t.z < -40 || Math.abs(t.x) > 45) {
        if (prop.dart) release(prop);
        else {
          dropFrom(props, prop);
          dropFrom(hittables, prop.obj);
          prop.obj.removeFromParent();
          world.removeRigidBody(prop.body);
        }
      }
    }
    if (awake === 0 && !train.moving) active = false;
  }

  function stepPhysics(dt) {
    if (!active) return;
    acc = Math.min(acc + dt, STEP * 3);
    while (acc >= STEP && active) {
      stepOnce();
      acc -= STEP;
    }
    const alpha = active ? acc / STEP : 1;
    for (const prop of props) {
      if (!prop.moving) continue;
      prop.obj.position.lerpVectors(prop.p0, prop.p1, alpha);
      prop.obj.quaternion.slerpQuaternions(prop.q0, prop.q1, alpha);
      shadowsDirty = true;
    }
    dirty = true;
    if (!active) acc = 0;
  }

  function wake() {
    active = true;
  }

  /** Two seconds of slow frames while drawing every frame: draw fewer pixels */
  function watchFrames(dt) {
    if (!dirty) {
      frameLog.time = frameLog.frames = 0;
      return;
    }
    frameLog.time += dt;
    frameLog.frames++;
    if (frameLog.time < 2) return;
    const avg = frameLog.time / frameLog.frames;
    frameLog.time = frameLog.frames = 0;
    if (avg > 1 / 48 && quality > 0.55) {
      quality *= 0.82;
      resize();
    }
  }

  function resize() {
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    fitCamera();
    dirty = shadowsDirty = true;
  }

  // Draw once with a dart and a puff out, hidden under the table, so their
  // shaders are ready before the first shot instead of stalling it
  {
    const d = newDart();
    d.obj.visible = true;
    d.obj.position.set(0, -3, 0);
    const puff = train.puffs[0].mesh;
    puff.visible = true;
    puff.position.set(0, -3, 0);
    renderer.compile(scene, camera);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    d.obj.visible = puff.visible = false;
    pool.push(d);
  }

  return {
    camera,
    aim,
    shoot,
    resize,
    wake,
    takeCheers() {
      return cheers.splice(0);
    },
    takeLandings() {
      return landings.splice(0);
    },
    takeKnocks() {
      return knocks.splice(0);
    },
    update(dt) {
      const now = performance.now();
      if (!reducedMotion) runTrain(dt);
      stepPhysics(dt);
      flyPinned(dt);
      settleQuills(dt);
      ageDarts(now);
      animateTrainBits(dt);
      swingClouds(dt);
      animateHoop(dt);
      turnMills(dt);
      waveFlags(now);
      watchFrames(dt);
    },
    render() {
      if (!dirty) return;
      dirty = false;
      if (shadowsDirty) {
        renderer.shadowMap.needsUpdate = true;
        shadowsDirty = false;
      }
      renderer.render(scene, camera);
    },
    /** Counts for checking the toy from the console */
    stats() {
      return {
        props: props.length,
        awake: props.filter((p) => !p.body.isSleeping()).length,
        fallen: props.filter((p) => !p.dart && new THREE.Vector3(0, 1, 0).applyQuaternion(p.obj.quaternion).y < 0.8).length,
        darts: { made, live: live.length, idle: pool.length, quills: porcupine.quills.length },
        targetHits: train.targets.map((t) => t.hits),
        baskets: hoopState.scores,
        mills: mills.map((m) => Math.round(m.spin * 100) / 100),
        rim: hoopState.center.toArray().map((v) => Math.round(v * 100) / 100),
        lastDart: live.length ? live[live.length - 1].p1.toArray().map((v) => Math.round(v * 100) / 100) : null,
        trainS: Math.round(train.s * 10) / 10,
        cloudHits: clouds.map((c) => c.hits),
        active,
        quality: Math.round(quality * 100) / 100,
        buffer: [renderer.domElement.width, renderer.domElement.height],
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      };
    },
    /** Fires one shot and follows it, frame by frame, for tests */
    traceShot(ndcX, ndcY, force = 1, frames = 20) {
      const kind = shoot(ndcX, ndcY, force);
      const d = live[live.length - 1];
      const path = [];
      for (let i = 0; i < frames; i++) {
        this.update(1 / 60);
        if (!d || d.state !== "loose") break;
        const v = d.body.linvel();
        path.push({ at: d.p1.toArray().map((n) => Math.round(n * 100) / 100), speed: Math.round(Math.hypot(v.x, v.y, v.z) * 10) / 10 });
      }
      return { kind, cam: camera.position.toArray(), path };
    },
    /** What is still awake, and how fast it moves, for tests */
    awakeProps() {
      return props
        .filter((p) => !p.body.isSleeping())
        .map((p) => {
          const v = p.body.linvel();
          const w = p.body.angvel();
          const t = p.body.translation();
          return { dart: Boolean(p.dart), at: [t.x, t.y, t.z].map((n) => Math.round(n * 10) / 10), v: Math.round(Math.hypot(v.x, v.y, v.z) * 100) / 100, w: Math.round(Math.hypot(w.x, w.y, w.z) * 100) / 100, slow: p.slow };
        });
    },
    /** Screen position of a prop, by index, for tests */
    propOnScreen(i) {
      const p = props[i].obj.getWorldPosition(new THREE.Vector3()).project(camera);
      return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - p.y) * 0.5 * window.innerHeight };
    },
    /** Screen position of a named thing, for tests */
    onScreen(name) {
      if (name.startsWith("mill")) {
        const p = mills[Number(name.slice(4)) || 0].hub.clone().project(camera);
        return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - p.y) * 0.5 * window.innerHeight };
      }
      if (name === "hoop" || name === "board") {
        const p = hoopState.center.clone();
        if (name === "board") p.set(p.x, p.y + 0.42 * hoopState.size, p.z - hoopState.r - 0.2 * hoopState.size);
        p.project(camera);
        return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - p.y) * 0.5 * window.innerHeight };
      }
      const obj = name === "porcupine" ? porcupine.obj : name.startsWith("target") ? train.targets[Number(name.slice(6)) || 0].disc : null;
      if (!obj) return null;
      const p = obj.getWorldPosition(new THREE.Vector3());
      if (name === "porcupine") p.y += 0.9;
      p.project(camera);
      return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - p.y) * 0.5 * window.innerHeight };
    },
  };
}
