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
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import RAPIER from "rapier";
import { LAYOUT } from "./layout.js";
import { backdropCanvas, rng } from "./backdrop.js";

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
/**
 * Winding time with the clock: how many physics steps are kept to wind
 * back to (30 a second, so two minutes), how far the clock's minute hand
 * runs for each step wound (seconds), and how often old steps are dropped
 */
const REWIND = { keep: 30 * 120, clockSeconds: 20, trimEvery: 600 };
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


const css = (hex) => `#${hex.toString(16).padStart(6, "0")}`;


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
    ctx.font = `600 ${size}px Figtree, Nunito, sans-serif`;
    size -= 2;
  } while (ctx.measureText(text).width > w - 70 && size > 24);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, 86);
  return c;
}

/** A cream stone face with a serif letter, like the bears' letter stones */
function letterCanvas(letter, color, ink) {
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const ctx = c.getContext("2d");
  ctx.fillStyle = css(color);
  ctx.fillRect(0, 0, 160, 160);
  // A few soft grey chips, so it reads as carved stone
  const rand = rng(letter.charCodeAt(0));
  ctx.strokeStyle = "rgba(110, 96, 84, 0.22)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const r = 52 + rand() * 22;
    ctx.beginPath();
    ctx.arc(80, 80, r, a, a + 0.3 + rand() * 0.5);
    ctx.stroke();
  }
  ctx.font = "700 104px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 80, 86);
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

/** An alarm clock's dial: minute marks, the quarter hours in numbers, and a motto */
function clockFaceCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4a3526";
  ctx.lineCap = "round";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const r0 = big ? 196 : 214;
    ctx.lineWidth = big ? 11 : 4;
    ctx.beginPath();
    ctx.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0);
    ctx.lineTo(256 + Math.sin(a) * 232, 256 - Math.cos(a) * 232);
    ctx.stroke();
  }
  ctx.fillStyle = "#4a3526";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 68px Figtree, Nunito, sans-serif";
  for (const h of [12, 3, 6, 9]) {
    const a = ((h % 12) / 12) * Math.PI * 2;
    ctx.fillText(String(h), 256 + Math.sin(a) * 148, 262 - Math.cos(a) * 148);
  }
  ctx.fillStyle = "#9a6b3c";
  ctx.font = "italic 600 30px Georgia, 'Times New Roman', serif";
  ctx.fillText("tempus fugit", 256, 168);
  return c;
}

/** The brass plate on the clock's plinth, with a line engraved on it */
function plaqueCanvas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const ctx = c.getContext("2d");
  const brass = ctx.createLinearGradient(0, 0, 0, 160);
  brass.addColorStop(0, "#f0cf7a");
  brass.addColorStop(0.5, "#d6a947");
  brass.addColorStop(1, "#b9872f");
  ctx.fillStyle = brass;
  ctx.fillRect(0, 0, 1024, 160);
  ctx.strokeStyle = "rgba(90, 58, 20, 0.55)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 1004, 140);
  ctx.fillStyle = "#4a2e12";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 600 54px Georgia, 'Times New Roman', serif";
  ctx.fillText("“Lost time is never found again.”", 512, 66);
  ctx.font = "600 28px Georgia, 'Times New Roman', serif";
  ctx.fillText("— BENJAMIN FRANKLIN", 512, 122);
  return c;
}

/**
 * A copy of a geometry for its outline: one normal per corner, averaged
 * over the faces that meet there, so the pushed-out shell has no cracks
 */
function outlineGeometry(g) {
  const plain = new THREE.BufferGeometry();
  plain.setAttribute("position", g.attributes.position.clone());
  if (g.index) plain.setIndex(g.index.clone());
  const merged = mergeVertices(plain, 1e-4);
  merged.computeVertexNormals();
  return merged;
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
    await Promise.race([Promise.all([document.fonts.load("600 40px Figtree"), document.fonts.load("600 40px \"Shantell Sans\""), document.fonts.load("400 40px \"Shantell Sans\"")]), new Promise((r) => setTimeout(r, 1500))]);
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
  /** A goofy face, traced from a hand drawing: two dots and a hooked smile, on a transparent canvas */
  const uglyFaceTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    // the drawing's own pixels, moved so its middle sits on the canvas middle
    const k = 1.85;
    const at = ([x, y]) => [128 + (x - 202) * k, 120 + (y - 106) * k];
    ctx.fillStyle = "#111";
    for (const e of [[148, 74], [196, 63]]) {
      const [x, y] = at(e);
      ctx.beginPath();
      ctx.arc(x, y, 5.5 * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 8.5 * k;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    [[156, 146], [175, 150], [187, 151], [200, 146], [232, 136], [250, 126], [257, 115], [257, 102]].forEach((p, i) => {
      const [x, y] = at(p);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const uglyFaceMat = new THREE.MeshBasicMaterial({ map: uglyFaceTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  function uglyFace(m) {
    // the head is a circle of radius 0.2 centred 0.655 up, and the front face sits at z = 0.148
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.27), uglyFaceMat);
    face.position.set(0, 0.665, 0.152);
    m.add(face);
  }
  const talkers = [];
  function meeple(x, z, color, rotY, size = 1, face = false) {
    const m = new THREE.Mesh(meepleGeo, mat(color));
    if (face) uglyFace(m);
    m.scale.setScalar(size);
    const prop = addProp(m, [RAPIER.ColliderDesc.cuboid(0.36 * size, 0.41 * size, 0.15 * size).setTranslation(0, 0.41 * size, 0)], new THREE.Vector3(x, 0, z), rotY);
    // The one with a face yelps when a dart hits it
    if (face) talkers.push(prop);
    return prop;
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
        ctx.font = "700 30px Figtree, Nunito, sans-serif";
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
        ctx.font = `700 ${sides === 20 ? 40 : 48}px Figtree, Nunito, sans-serif`;
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
   * A stack of casino chips: a coloured body with six white spots round the
   * edge, a ring and a small inlay on the face, each chip a little out of true
   */
  function chipStack(x, z, colors, rotY = 0) {
    const r = 0.23;
    const h = 0.058;
    const white = 0xf6f1e6;
    const body = geo("chip", () => new THREE.CylinderGeometry(r, r, h, 36));
    const spot = geo("chipSpot", () => new THREE.BoxGeometry(0.06, h * 0.98, 0.1));
    const ring = geo("chipRing", () => new THREE.CylinderGeometry(r * 0.74, r * 0.74, h + 0.003, 36));
    const field = geo("chipField", () => new THREE.CylinderGeometry(r * 0.69, r * 0.69, h + 0.005, 36));
    const inlay = geo("chipInlay", () => new THREE.CylinderGeometry(r * 0.4, r * 0.4, h + 0.007, 28));
    const g = new THREE.Group();
    colors.forEach((color, i) => {
      const chip = new THREE.Group();
      chip.position.set(Math.sin(i * 2.3) * 0.012, h / 2 + i * h, Math.cos(i * 1.7) * 0.012);
      chip.rotation.y = i * 0.7;
      chip.add(new THREE.Mesh(body, mat(color)));
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const m = new THREE.Mesh(spot, mat(white));
        m.position.set(Math.cos(a) * (r - 0.018), 0, Math.sin(a) * (r - 0.018));
        m.rotation.y = -a;
        chip.add(m);
      }
      chip.add(new THREE.Mesh(ring, mat(white)), new THREE.Mesh(field, mat(color)), new THREE.Mesh(inlay, mat(white)));
      g.add(chip);
    });
    const H = colors.length * h;
    return addProp(g, [RAPIER.ColliderDesc.cylinder(H / 2, r).setTranslation(0, H / 2, 0).setDensity(1.2)], new THREE.Vector3(x, 0, z), rotY);
  }

  /**
   * The "all in" puck, as a toy: a cream triangular block with softened
   * corners and a painted face, a red border round black, a red spade and
   * the words in white. It lies with its point away from you.
   */
  function allInMarker(x, z, rotY) {
    const SIZE = 1.4;
    const corners = [new THREE.Vector2(0, 0.52), new THREE.Vector2(-0.45, -0.26), new THREE.Vector2(0.45, -0.26)];
    const rounded = (scale, k) => {
      const v = corners.map((p) => p.clone().multiplyScalar(scale));
      const shape = new THREE.Shape();
      v.forEach((p, i) => {
        const a = p.clone().lerp(v[(i + 2) % 3], k);
        const b = p.clone().lerp(v[(i + 1) % 3], k);
        if (i === 0) shape.moveTo(a.x, a.y);
        else shape.lineTo(a.x, a.y);
        shape.quadraticCurveTo(p.x, p.y, b.x, b.y);
      });
      shape.closePath();
      return shape;
    };
    const lip = 0.025;
    const depth = 0.07;
    const top = depth + 2 * lip;
    const body = new THREE.ExtrudeGeometry(rounded(0.97, 0.13), { depth, bevelEnabled: true, bevelThickness: lip, bevelSize: lip, bevelSegments: 3, curveSegments: 6 });
    body.rotateX(-Math.PI / 2).translate(0, lip, 0);

    // The painted face is a flat copy of the triangle, mapped onto a canvas: x runs -0.5..0.5, y -0.3..0.7
    const faceGeo = new THREE.ShapeGeometry(rounded(0.87, 0.13), 6);
    const uv = faceGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, faceGeo.attributes.position.getX(i) + 0.5, faceGeo.attributes.position.getY(i) + 0.3);
    faceGeo.rotateX(-Math.PI / 2).translate(0, top + 0.002, 0);

    const N = 512;
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const ctx = c.getContext("2d");
    const px = (p) => [(p.x + 0.5) * N, (0.7 - p.y) * N];
    ctx.fillStyle = "#c2392c";
    ctx.fillRect(0, 0, N, N);
    // The black field, with rounded corners from a thick round-joined stroke
    ctx.fillStyle = ctx.strokeStyle = "#1d1917";
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.05 * N;
    ctx.beginPath();
    corners.forEach((p, i) => {
      const [X, Y] = px(p.clone().multiplyScalar(0.6));
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // The spade: two lobes and a point, on a short stem
    const [cx, cy] = [N / 2, (0.7 - 0.12) * N];
    const k = 0.075 * N;
    ctx.fillStyle = "#e0432f";
    ctx.beginPath();
    ctx.moveTo(cx, cy - k);
    ctx.bezierCurveTo(cx + k * 1.4, cy - k * 0.1, cx + k * 0.95, cy + k * 0.85, cx, cy + k * 0.45);
    ctx.bezierCurveTo(cx - k * 0.95, cy + k * 0.85, cx - k * 1.4, cy - k * 0.1, cx, cy - k);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy + k * 0.3);
    ctx.lineTo(cx - k * 0.4, cy + k * 1.15);
    ctx.lineTo(cx + k * 0.4, cy + k * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fffaf0";
    ctx.font = `800 ${0.1 * N}px Figtree, Nunito, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("ALL IN", N / 2, (0.7 + 0.1) * N);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;

    const g = new THREE.Group();
    g.scale.setScalar(SIZE);
    g.add(
      new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: 0.7 })),
      new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }))
    );
    const pts = [];
    for (const p of corners) for (const y of [0, top]) pts.push(p.x * 0.95 * SIZE, y * SIZE, -p.y * 0.95 * SIZE);
    return addProp(g, [RAPIER.ColliderDesc.convexHull(new Float32Array(pts)).setDensity(1.1)], new THREE.Vector3(x, 0, z), rotY);
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
   * Little black resin bears, like the ones on James's shelf, each holding
   * a cream stone disc with a letter on it: tan muzzle, ears and paw pads,
   * snouts tipped up. Each has its own pose, as on the shelf:
   *   belly - standing, the disc hugged to its tummy
   *   scarf - the same, with a green scarf on
   *   head  - standing, arms out wide, the disc balanced on its head
   *   sit   - sitting, feet out, the disc held between its legs
   *   lean  - sitting back with its feet up, the disc in front
   * The bear and its disc are one prop, so a dart knocks them over together.
   */
  /**
   * A stone's outline: a rough round, a little wider than tall, with a few
   * soft lumps so no two are the same and none is a true circle
   */
  function stoneOutline(r, seed) {
    const rand = rng(seed * 7 + 3);
    const n = 8;
    const turn = rand() * Math.PI;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const k = 0.86 + rand() * 0.2;
      pts.push(new THREE.Vector2(Math.cos(a) * r * k * 1.1, Math.sin(a) * r * k));
    }
    const curve = new THREE.SplineCurve([...pts, pts[0], pts[1], pts[2]]);
    // Sampled over the middle of the run, so the loop closes smoothly
    const loop = [];
    for (let i = 0; i < 40; i++) loop.push(curve.getPoint((1 + (i / 40) * n) / (n + 2)));
    return new THREE.Shape(loop);
  }

  const BEAR = { s: 1.2, fur: 0x2b2624, tan: 0xd7a868, stone: 0xece3d1, scarf: 0x5f8a4a };
  function bear(x, z, letter, pose, rotY) {
    const { s, fur, tan } = BEAR;
    const g = new THREE.Group();
    const part = (parent, key, make, color, px, py, pz) => {
      const m = new THREE.Mesh(geo(key, make), mat(color));
      m.position.set(px * s, py * s, pz * s);
      parent.add(m);
      return m;
    };
    const ball = (r, sx = 1, sy = 1, sz = 1) => () => new THREE.SphereGeometry(r * s, 14, 10).scale(sx, sy, sz);
    const standing = pose === "belly" || pose === "scarf" || pose === "head";

    // Body and legs
    const body = new THREE.Group();
    g.add(body);
    if (standing) {
      part(body, "bearTorso", ball(0.2, 1, 1.35, 0.9), fur, 0, 0.4, 0);
      for (const side of [-1, 1]) part(body, "bearStandLeg", ball(0.1, 1, 1.2, 1.1), fur, side * 0.1, 0.1, 0.02);
    } else {
      part(body, "bearSeat", ball(0.21, 1, 1.15, 0.95), fur, 0, 0.25, 0);
      const up = pose === "lean";
      for (const side of [-1, 1]) {
        const leg = part(body, "bearSitLeg", ball(0.09, 1, 0.9, 1.5), fur, side * (up ? 0.19 : 0.16), up ? 0.15 : 0.09, 0.17);
        if (up) leg.rotation.x = -0.6;
        part(body, "bearPad", ball(0.07, 1, 1, 0.35), tan, side * (up ? 0.19 : 0.16), up ? 0.24 : 0.1, up ? 0.27 : 0.3);
      }
      if (up) body.rotation.x = -0.15;
    }

    // Head, tipped up a little
    const head = new THREE.Group();
    head.position.y = (standing ? 0.78 : 0.6) * s;
    head.rotation.x = -0.3;
    body.add(head);
    part(head, "bearHead", ball(0.17), fur, 0, 0, 0.02);
    part(head, "bearMuzzle", ball(0.08, 1, 0.8, 0.9), tan, 0, -0.04, 0.16);
    part(head, "bearNose", ball(0.03), COLORS.ink, 0, -0.02, 0.24);
    for (const side of [-1, 1]) {
      part(head, "bearEar", ball(0.065, 1, 1, 0.6), fur, side * 0.13, 0.14, -0.01);
      part(head, "bearInnerEar", ball(0.035, 1, 1, 0.4), tan, side * 0.13, 0.14, 0.03);
      part(head, "bearEye", ball(0.022), 0x17120f, side * 0.065, 0.04, 0.155);
    }

    // Arms, and where the disc goes
    let disc;
    if (pose === "head") {
      for (const side of [-1, 1]) {
        const arm = part(body, "bearWideArm", ball(0.065, 2.2, 0.8, 0.8), fur, side * 0.3, 0.52, 0);
        arm.rotation.z = side * 0.45;
        part(body, "bearPalm", ball(0.045, 1, 1, 0.4), tan, side * 0.43, 0.6, 0.04);
      }
      disc = [0, 1.07, 0.02];
    } else if (standing) {
      for (const side of [-1, 1]) part(body, "bearHugArm", ball(0.065, 0.8, 0.8, 1.7), fur, side * 0.17, 0.45, 0.14);
      if (pose === "scarf") {
        const scarf = part(body, "bearScarf", () => new THREE.TorusGeometry(0.13 * s, 0.035 * s, 8, 18), BEAR.scarf, 0, 0.6, 0.01);
        scarf.rotation.x = Math.PI / 2;
      }
      disc = [0, 0.4, 0.2];
    } else {
      for (const side of [-1, 1]) part(body, "bearSitArm", ball(0.06, 0.8, 0.8, 1.5), fur, side * 0.17, 0.27, 0.2);
      disc = [0, 0.22, 0.3];
    }
    // The stone: a lumpy hand-shaped disc, each one its own, the letter on the front
    const stone = new THREE.Group();
    stone.position.set(disc[0] * s, disc[1] * s, disc[2] * s);
    stone.rotation.x = -0.12;
    const r = 0.16 * s;
    const depth = 0.05 * s;
    const lip = 0.01 * s;
    const outline = stoneOutline(r, letter.charCodeAt(0));
    const rock = new THREE.Mesh(
      geo(`bearStone${letter}`, () =>
        new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelSize: lip * 0.8, bevelThickness: lip, bevelSegments: 2, curveSegments: 4 }).translate(0, 0, -depth / 2)
      ),
      mat(BEAR.stone)
    );
    // The face takes the letter canvas across the stone's whole width
    const faceGeo = geo(`bearStoneFace${letter}`, () => {
      const g2 = new THREE.ShapeGeometry(outline, 4);
      const p = g2.attributes.position;
      const uv = g2.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2.2 * r) + 0.5, p.getY(i) / (2.2 * r) + 0.5);
      return g2;
    });
    const face = new THREE.Mesh(faceGeo, canvasMaterial(letterCanvas(letter, BEAR.stone, "#3a2b36")));
    face.position.z = depth / 2 + lip + 0.002;
    stone.add(rock, face);
    (pose === "head" ? g : body).add(stone);

    const h = standing ? (pose === "head" ? 1.2 : 0.98) : 0.8;
    return addProp(
      g,
      [
        RAPIER.ColliderDesc.cuboid(0.24 * s, (h / 2) * s, 0.2 * s).setTranslation(0, (h / 2) * s, 0),
        RAPIER.ColliderDesc.cuboid(0.17 * s, 0.17 * s, 0.05 * s).setTranslation(0, disc[1] * s, disc[2] * s),
      ],
      new THREE.Vector3(x, 0, z),
      rotY
    );
  }

  /**
   * "James" in bear toys, out at the back between the castle and the
   * pinwheels, in a gentle curve and each bear turned to the camera
   */
  function bearName(word) {
    const poses = ["belly", "sit", "lean", "scarf", "head"];
    const rand = rng(41);
    [...word].forEach((letter, i) => {
      const k = i - (word.length - 1) / 2;
      const x = -5.75 + k * 0.68;
      const z = -3.3 - k * k * 0.06;
      const turn = Math.atan2(-x, camera.position.z - z) + (rand() - 0.5) * 0.25;
      bear(x, z, letter, poses[i % poses.length], turn);
    });
  }

  /**
   * Dice of every kind and the meeples: a few in the middle at the front
   * with the juggling balls and the controller, more round the dominoes,
   * and some out at the back among the pinwheels.
   */
  function deskToys() {
    // Where each thing lies is in layout.js; a thing with no entry there is left out
    const place = (name, make) => {
      const at = LAYOUT[name];
      if (at) make(at.x, at.z, at.turn ?? 0);
    };
    const animalAt = (kind, name, color, size) => place(name, (x, z, turn) => animal(kind, x, z, color, turn, size));
    const meepleAt = (name, color, size, face) => place(name, (x, z, turn) => meeple(x, z, color, turn, size, face));
    // The middle: a big meeple, a die and four juggling balls, three in a
    // triangle and one sat on top
    meepleAt("bigMeeple", COLORS.mustard, 1.35, true);
    place("die", (x, z, turn) => die(x, z, "#fffaf0", "#4a3526", turn, 4));
    place("jugglingBalls", (x, z) => {
      jugglingBall(x - 0.24, 0, z - 0.15, "#dc6a52", "#ebbb55", 0.4);
      jugglingBall(x + 0.24, 0, z - 0.15, "#7f9fcb", "#fffaf0", 1.1);
      jugglingBall(x, 0, z + 0.27, "#93a86c", "#ebbb55", 2.0);
      jugglingBall(x, 0.392, z - 0.01, "#ebbb55", "#dc6a52", 2.6);
    });
    place("allIn", allInMarker);
    // Round the dominoes, which run in front of the train's track
    meepleAt("sageMeeple", COLORS.sage, 0.6);
    place("chipsRed", (x, z, turn) => chipStack(x, z, [0xb3261e, 0xb3261e, 0xb3261e, 0xb3261e, 0xb3261e, 0x23201e], turn));
    place("chipsBlue", (x, z, turn) => chipStack(x, z, [0x2a4f9c, 0x2a4f9c, 0x2a4f9c], turn));
    place("d20", (x, z, turn) => polyDie(20, x, z, COLORS.red, turn));
    place("d4", (x, z, turn) => polyDie(4, x, z, COLORS.mustard, turn, "#4a3526"));
    animalAt("boar", "boarMiddle", 0x7a5236, 0.3);
    animalAt("sheep", "sheepDark", 0x4a4446, 0.38);
    animalAt("sheep", "sheepNearTrack", COLORS.cream, 0.32);
    animalAt("boar", "boarByDominoes", 0x7a5236, 0.4);
    animalAt("sheep", "sheepBig", COLORS.cream, 0.7);
    animalAt("sheep", "sheepFront", COLORS.cream, 0.55);
    // ...and on the near side and the left, so they ring it all round
    animalAt("sheep", "sheepMiddle", COLORS.cream, 0.55);
    meepleAt("coralMeeple", COLORS.coral, 0.42);
    animalAt("sheep", "sheepFarFront", COLORS.cream, 0.5);
    animalAt("boar", "boarFront", 0x7a5236, 0.42);
    // Out at the back, by the pinwheels and in front of the hoop
    meepleAt("redMeeple", COLORS.red, 1.1);
    animalAt("boar", "boarBack", 0x7a5236, 0.85);
    place("d20Back", (x, z, turn) => polyDie(20, x, z, COLORS.sage, turn));
    place("d8Back", (x, z, turn) => polyDie(8, x, z, COLORS.blue, turn));
    place("dieBack", (x, z, turn) => die(x, z, "#ebbb55", "#4a3526", turn, 2));
  }

  /** A big sheet of paper lying on the table, with a note written on it */
  /** A yellow sticky note's face: the glue band along the top, and the writing */
  function noteCanvas() {
    const c = document.createElement("canvas");
    c.width = c.height = 800;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f7df6f";
    ctx.fillRect(0, 0, 800, 800);
    // The glue band is a touch deeper and glossier
    const glue = ctx.createLinearGradient(0, 0, 0, 150);
    glue.addColorStop(0, "rgba(214, 170, 40, 0.28)");
    glue.addColorStop(1, "rgba(214, 170, 40, 0)");
    ctx.fillStyle = glue;
    ctx.fillRect(0, 0, 800, 150);
    // The free edge darkens a little where it curls away from the light
    const curl = ctx.createLinearGradient(0, 620, 0, 800);
    curl.addColorStop(0, "rgba(160, 110, 20, 0)");
    curl.addColorStop(1, "rgba(160, 110, 20, 0.22)");
    ctx.fillStyle = curl;
    ctx.fillRect(0, 620, 800, 180);
    // Marker-style handwriting, drawn tall: lying on the table the note is
    // seen at a low angle that squashes it, so the letters are stretched
    // up to read as normal from the camera
    const TALL = 1.9;
    // A light hand in soft ink, so the note is only a note beside the intro
    ctx.fillStyle = "#6a5444";
    ctx.save();
    ctx.scale(1, TALL);
    ctx.font = "400 92px \"Shantell Sans\", Figtree, sans-serif";
    ctx.fillText("toys:", 60, 180 / TALL);
    ctx.font = "400 54px \"Shantell Sans\", Figtree, sans-serif";
    const words = "an object or system you play with just for the joy of tinkering around".split(" ");
    let line = "";
    let y = 310;
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > 700) {
        ctx.fillText(line, 60, y / TALL);
        line = w;
        y += 125;
      } else line = next;
    }
    ctx.fillText(line, 60, y / TALL);
    ctx.restore();
    return c;
  }

  /**
   * A sticky note lying on the table: square and yellow, held down by its
   * glue along the far edge, its free edge near you curling up a little.
   * The glue holds it where it is: a dart never moves the note, but one on
   * the curled edge flicks it down, and it springs back up with a wobble.
   */
  const NOTE = { lift: 0.11, size: 2.0 };
  const noteState = { obj: null, geo: null, curl: null, from: 0, lift: NOTE.lift, v: 0 };
  function note(x, z, rotY) {
    const { size } = NOTE;
    const geo = new THREE.PlaneGeometry(size, size * 0.8, 1, 18).rotateX(-Math.PI / 2);
    // Local z runs from the glued edge (-size/2) to the free edge (+size/2);
    // past `from` the paper curls up, more the further out
    const pos = geo.attributes.position;
    const curl = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const k = Math.max(0, (pos.getZ(i) / size + 0.5 - 0.62) / 0.38);
      curl[i] = k * k;
    }
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(geo, canvasMaterial(noteCanvas())),
      new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xe8c95a, roughness: 0.9, side: THREE.BackSide }))
    );
    g.position.set(x, standOn, z);
    g.rotation.y = rotY;
    g.traverse((m) => {
      if (m.isMesh) m.castShadow = m.receiveShadow = true;
    });
    g.userData.hit = { kind: "note" };
    scene.add(g);
    hittables.push(g);
    Object.assign(noteState, { obj: g, geo, curl, from: (0.62 - 0.5) * size });
    shapeNote();
    return g;
  }

  function shapeNote() {
    const { geo, curl, lift } = noteState;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, 0.012 + lift * curl[i]);
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  /** A dart on the note: only a hit on the curled edge moves it */
  function flickNote(point, force) {
    if (!noteState.obj) return;
    const local = noteState.obj.worldToLocal(point.clone());
    if (local.z < noteState.from) return;
    noteState.v -= 1.8 * force;
  }

  function animateNote(dt) {
    const s = noteState;
    if (!s.obj || Math.abs(s.lift - NOTE.lift) + Math.abs(s.v) < 0.0004) return;
    // Small steps, so the stiff spring stays steady on a slow frame
    const n = Math.ceil(dt / (1 / 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      s.v += (-260 * (s.lift - NOTE.lift) - 7 * s.v) * h;
      s.lift += s.v * h;
      // Pressed flat, it slaps the table and comes off it again
      if (s.lift < 0) {
        s.lift = 0;
        s.v = -s.v * 0.3;
      }
    }
    if (Math.abs(s.lift - NOTE.lift) + Math.abs(s.v) < 0.0004) {
      s.lift = NOTE.lift;
      s.v = 0;
    }
    shapeNote();
    dirty = shadowsDirty = true;
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
    // On top, the clock that winds time, and a little desk calendar beside it
    onShelf(left, 3, -0.62, alarmClock, 0);
    onShelf(left, 3, 0.92, (x, z, yaw) => deskCalendar(x, z, yaw - 0.35));

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

  /**
   * Paper confetti for a basket. Five bursts share one mesh, so baskets in
   * quick succession each get their own and the earlier ones play out; a
   * sixth takes over the oldest.
   */
  const confetti = (() => {
    const per = 40;
    const count = per * 5;
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.14), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), count);
    const palette = [0xdc6a52, 0xebbb55, 0x7f9fcb, 0x93a86c, 0xe9906d].map((c) => new THREE.Color(c));
    const none = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, palette[i % palette.length]);
      mesh.setMatrixAt(i, none);
    }
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    const bursts = Array.from({ length: count / per }, (_, n) => ({
      age: 1,
      first: n * per,
      bits: Array.from({ length: per }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), spin: 0 })),
    }));
    return { mesh, bursts, none };
  })();

  function basket() {
    hoopState.scores++;
    hoopState.swishV += 6;
    cheers.push(1);
    // A burst that has finished, or else the one furthest along
    const burst = confetti.bursts.reduce((a, b) => (b.age > a.age ? b : a));
    burst.age = 0;
    confetti.mesh.visible = true;
    for (const b of burst.bits) {
      b.p.copy(hoopState.center);
      b.v.set((Math.random() - 0.5) * 4, 3 + Math.random() * 4, (Math.random() - 0.3) * 3);
      b.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      b.spin = (Math.random() - 0.5) * 16;
    }
  }

  const confettiM = new THREE.Matrix4();
  const confettiQ = new THREE.Quaternion();
  const confettiS = new THREE.Vector3(1, 1, 1);
  function animateConfetti(dt) {
    let playing = false;
    for (const burst of confetti.bursts) {
      if (burst.age >= 1) continue;
      burst.age = Math.min(1, burst.age + dt / 1.8);
      burst.bits.forEach((b, i) => {
        const at = burst.first + i;
        if (burst.age >= 1) return confetti.mesh.setMatrixAt(at, confetti.none);
        b.v.y -= 9 * dt;
        b.v.multiplyScalar(1 - 1.6 * dt);
        b.p.addScaledVector(b.v, dt);
        b.r.x += b.spin * dt;
        b.r.y += b.spin * 0.6 * dt;
        confettiQ.setFromEuler(b.r);
        confettiS.setScalar(burst.age > 0.75 ? (1 - burst.age) * 4 : 1);
        confetti.mesh.setMatrixAt(at, confettiM.compose(b.p, confettiQ, confettiS));
      });
      playing ||= burst.age < 1;
    }
    if (!confetti.mesh.visible) return;
    confetti.mesh.instanceMatrix.needsUpdate = true;
    confetti.mesh.visible = playing;
    dirty = true;
  }

  function animateHoop(dt) {
    if (Math.abs(hoopState.swish) + Math.abs(hoopState.swishV) > 0.0005) {
      hoopState.swishV += (-120 * hoopState.swish - 7 * hoopState.swishV) * dt;
      hoopState.swish += hoopState.swishV * dt;
      const s = hoopState.swish * 0.18;
      hoopState.net.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5).multiplyScalar(hoopState.size);
      dirty = true;
    }
    animateConfetti(dt);
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

  // ---------------------------------------------------------------- clock
  /**
   * A wind-up alarm clock with two bells, on a wooden plinth with a brass
   * plate. It is fixed where it stands: darts bounce off and nothing knocks
   * it over. Its hands keep the visitor's own time, and run backwards or
   * forwards as the wheel winds time over it (see rewind below). An outline
   * round it says it can be used; under the pointer the outline turns orange.
   */
  const CLOCK_EDGE = { idle: 0xfff3dc, hover: 0xff7a1f };
  const outlineMat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(CLOCK_EDGE.idle) }, thickness: { value: 0.0026 } },
    // Pushed out along its normals by the same few pixels however far away it is
    vertexShader: /* glsl */ `
      uniform float thickness;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        mv.xyz += normalize(normalMatrix * normal) * thickness * -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
  });
  const clockState = { obj: null, hands: null, hover: false, shown: "" };

  function alarmClock(x, z, yaw, s = 1.15) {
    const g = new THREE.Group();
    g.position.set(x, standOn, z);
    g.rotation.y = yaw;
    const outlined = [];
    const add = (geom, material, px, py, pz, edge = true) => {
      const m = new THREE.Mesh(geom, material);
      m.position.set(px * s, py * s, pz * s);
      m.scale.setScalar(s);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      if (edge) outlined.push(m);
      return m;
    };
    // The plinth, its brass plate and two little feet
    add(new RoundedBoxGeometry(1.5, 0.26, 0.72, 2, 0.06), mat(COLORS.wood), 0, 0.13, 0);
    add(new THREE.PlaneGeometry(1.3, 0.2), canvasMaterial(plaqueCanvas()), 0, 0.13, 0.362, false);
    for (const side of [-1, 1]) add(new THREE.SphereGeometry(0.1, 12, 8).scale(1, 0.7, 1), mat(COLORS.mustard), side * 0.36, 0.31, 0);
    // The drum, facing you, with a brass bezel round the dial
    const cy = 0.98;
    add(new THREE.CylinderGeometry(0.66, 0.66, 0.36, 40).rotateX(Math.PI / 2), mat(COLORS.navy), 0, cy, 0);
    add(new THREE.TorusGeometry(0.54, 0.045, 10, 40), mat(COLORS.mustard), 0, cy, 0.18);
    add(new THREE.CircleGeometry(0.53, 48), canvasMaterial(clockFaceCanvas()), 0, cy, 0.182, false);
    // Two bells on top, and the hammer that rings them between
    for (const side of [-1, 1]) {
      const a = side * 0.72;
      const bell = add(new THREE.SphereGeometry(0.24, 20, 12).scale(1, 0.82, 1), mat(COLORS.mustard), Math.sin(a) * 0.7, cy + Math.cos(a) * 0.7, 0);
      bell.rotation.z = -a;
    }
    add(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), mat(COLORS.ink), 0, cy + 0.78, 0);
    add(new THREE.SphereGeometry(0.065, 12, 8), mat(COLORS.ink), 0, cy + 0.94, 0);
    // The hands turn about the middle of the dial; they cast no shadow, so
    // turning them never has the shadow map redrawn
    const hand = (len, w, color, dz) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, cy * s, (0.19 + dz) * s);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.014).translate(0, len / 2 - 0.07, 0), mat(color));
      m.scale.setScalar(s);
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    clockState.hands = { hour: hand(0.32, 0.07, COLORS.ink, 0.01), minute: hand(0.46, 0.045, COLORS.ink, 0.026), second: hand(0.5, 0.02, COLORS.red, 0.042) };
    add(new THREE.SphereGeometry(0.05, 12, 8), mat(COLORS.mustard), 0, cy, 0.24, false);
    for (const m of outlined) {
      const edge = new THREE.Mesh(outlineGeometry(m.geometry), outlineMat);
      edge.raycast = () => {};
      m.add(edge);
    }
    g.userData.hit = { kind: "clock" };
    scene.add(g);
    hittables.push(g);
    clockState.obj = g;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, standOn, z).setRotation(q));
    const facing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.75 * s, 0.13 * s, 0.36 * s).setTranslation(0, 0.13 * s, 0), body);
    world.createCollider(RAPIER.ColliderDesc.cylinder(0.18 * s, 0.66 * s).setTranslation(0, cy * s, 0).setRotation(facing), body);
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.66 * s, 0.22 * s, 0.2 * s).setTranslation(0, (cy + 0.7) * s, 0), body);
    return g;
  }

  /** A tear-off page of the desk calendar: the month on a red band, the day big, and its weekday */
  const calendarPage = (() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 224;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    return { canvas: c, tex, day: "" };
  })();

  /** Paints the page for a date (read in UTC: the time is already shifted to the visitor's own) */
  function paintCalendar(date) {
    const ctx = calendarPage.canvas.getContext("2d");
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, 256, 224);
    ctx.fillStyle = css(COLORS.red);
    ctx.fillRect(0, 0, 256, 58);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fffaf0";
    ctx.font = "800 40px Figtree, Nunito, sans-serif";
    ctx.fillText(date.toLocaleString("en", { month: "short", timeZone: "UTC" }).toUpperCase(), 128, 32);
    ctx.fillStyle = "#4a3526";
    ctx.font = "800 108px Figtree, Nunito, sans-serif";
    ctx.fillText(String(date.getUTCDate()), 128, 128);
    ctx.fillStyle = "#8a6a4a";
    ctx.font = "600 28px Figtree, Nunito, sans-serif";
    ctx.fillText(date.toLocaleString("en", { weekday: "long", timeZone: "UTC" }), 128, 196);
    calendarPage.tex.needsUpdate = true;
  }

  /**
   * A small tent-shaped desk calendar, its pages bound by wire rings along
   * the top. It shows the day the clock's hands are on, so winding the clock
   * back far enough turns it back a day. A toy like any other: it can be
   * knocked over.
   */
  function deskCalendar(x, z, rotY) {
    const w = 0.56;
    const h = 0.5;
    const lean = 0.32;
    const g = new THREE.Group();
    const board = geo("calBoard", () => new RoundedBoxGeometry(w, h, 0.03, 2, 0.012));
    for (const side of [1, -1]) {
      const panel = new THREE.Group();
      panel.position.set(0, (Math.cos(lean) * h) / 2, (side * Math.sin(lean) * h) / 2);
      panel.rotation.x = -side * lean;
      const back = new THREE.Mesh(board, mat(COLORS.wood));
      back.castShadow = back.receiveShadow = true;
      panel.add(back);
      if (side > 0) {
        const page = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.07), new THREE.MeshStandardMaterial({ map: calendarPage.tex, roughness: 0.9 }));
        page.position.set(0, -0.02, 0.017);
        page.receiveShadow = true;
        panel.add(page);
      }
      g.add(panel);
    }
    // The wire rings that bind the pages, along the top
    const top = Math.cos(lean) * h;
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(geo("calRing", () => new THREE.TorusGeometry(0.035, 0.008, 6, 14)), mat(0x8c8a86));
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-w * 0.36 + i * w * 0.18, top - 0.01, 0);
      g.add(ring);
    }
    paintCalendar(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));
    const dz = Math.sin(lean) * h;
    const pts = new Float32Array([-w / 2, 0, dz, w / 2, 0, dz, -w / 2, 0, -dz, w / 2, 0, -dz, -w / 2, top, 0, w / 2, top, 0]);
    return addProp(g, [RAPIER.ColliderDesc.convexHull(pts).setDensity(0.6)], new THREE.Vector3(x, 0, z), rotY);
  }

  // A toy table laid out for its own sake. The pages lie on top of it.
  backWall(-9.6);
  castle(-8.5, -5);
  pinwheel(-2.5, -4.4, 1.0, 0x5f86b8, 0.3);
  pinwheel(-3.9, -5.8, 0.75, 0x6f9a4c, 0.45);
  pinwheel(4.6, -5.3, 0.9, 0xc8574a, -0.35);
  pinwheel(5.9, -4.3, 0.6, 0x6e5c9e, -0.4);
  bearName("JAMES");
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
  // A sticky note turned counter-clockwise, the other way from the intro
  // sheet, with the pencil and the marker left beside it
  for (const [name, make] of [
    ["note", note],
    ["pencil", pencil],
    ["marker", (x, z, turn) => marker(x, z, turn, COLORS.red)],
  ]) {
    const at = LAYOUT[name];
    if (at) make(at.x, at.z, at.turn ?? 0);
  }
  deskToys();
  // An S: away from you, over, back toward you, round, and off to the
  // right past the edge of the view
  // (over to the right, clear of the intro sheet and of the train's track)
  dominoPath(LAYOUT.dominoes, 33);

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
  const sunCutout = hanging(sunCanvas(), 2.8, 2.8, new THREE.Vector3(12.2, 9.6, -10.5));

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
    for (const c of [{ gap: 2.3, color: COLORS.blue, tub: COLORS.cream, r: 0.6, flip: 0 }, { gap: 4.4, color: COLORS.sage, tub: COLORS.mustard, r: 0.4, flip: 2.4 }]) {
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
      const target = { pivot, disc, car, tilt: 0, spin: 0, hits: 0, flip: reducedMotion ? 0 : c.flip };
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
      // The small one keeps turning on its post, so it goes edge-on and back
      if (t.flip) {
        t.disc.rotation.y += t.flip * dt;
        dirty = true;
      }
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
    // Its past goes with it: wound back, a dart already gone stays gone
    logged.delete(d);
    d.log = null;
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
    d.trainHit = false;
    d.talkerHit = null;
    d.clockHit = false;
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
    const attach = hit.kind === "target" ? hit.target.disc : porcupine.obj;
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
    return force <= WEAK.below && !["target", "porcupine", "cloud", "sheet"].includes(hit.kind) && hit.distance > 5;
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
    // A shot lets time run again first, from wherever it was wound to
    releaseTime();
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
    if (hit.kind === "sheet") {
      // A dart on the lying intro picks it up; the dart drops off it
      canvas.dispatchEvent(new Event("pickup"));
      spawnDart(hit.point.clone().addScaledVector(dir, -0.15), dir.clone().multiplyScalar(-3).add(new THREE.Vector3(0, 2, 0)));
      return "sheet";
    }
    if (hit.kind === "target" || hit.kind === "porcupine") {
      pin(hit, from, dir);
      return hit.kind;
    }
    if (hit.kind === "windmill") pushMill(hit.mill, hit.point, dir, force);
    if (hit.kind === "note") flickNote(hit.point, force);
    // Everything else, the hoop too, flies straight along the aim
    spawnDart(from, dir.clone().multiplyScalar(DART_SPEED * force));
    return hit.kind;
  }

  // ---------------------------------------------------------------- sheet
  /**
   * The intro, as a real sheet of paper lying on the table: a finely cut
   * plane wearing a picture of the intro panel, lit and shadowed with
   * everything else. Hovering it curls its top-right corner up. As the
   * page scrolls (progress 0 to 1) the corner peels further, then the
   * sheet comes up off the table, cupping and rippling as it flies, and
   * unrolls flat exactly over the intro panel's place on the screen, where
   * the page hands over to the real panel.
   *
   * The bend is a page curl: past a fold line across the top-right corner,
   * the paper wraps round a cylinder of radius R, so it rolls rather than
   * hinges. Lengths are in sheet heights.
   */
  const SHEET = {
    at: new THREE.Vector3(LAYOUT.sheet.x, 0.016, LAYOUT.sheet.z),
    turn: -0.12,
    height: 3.0,
    /** At most this wide, so a wide intro still clears the chips and the "all in" marker beside it */
    maxWidth: 3.1,
    /** How far in front of the eye the sheet meets the panel's place */
    depth: 4,
    hover: { peel: 0.3, radius: 0.1 },
    peel: { peel: 0.62, radius: 0.2 },
    /**
     * Every few seconds, while it lies untouched, the sheet floats up like a
     * magic page: after `rest` seconds on the table it rises `lift` sheet
     * heights over `rise` seconds, glowing a little, hangs there for `hang`,
     * and is let go. Then it simply drops: gravity against the air, so it
     * soon falls at about `terminal` (world units a second), and settles flat
     * when it lands.
     */
    flap: { rest: 1.6, rise: 0.8, hang: 0.35, lift: 0.16, gravity: 6, terminal: 0.5 },
  };
  const sheet = (() => {
    const geo = new THREE.PlaneGeometry(1, 1, 40, 40);
    const base = geo.attributes.position.array.slice();
    const front = new THREE.MeshStandardMaterial({ roughness: 0.92, alphaTest: 0.5, emissive: 0xffffff, emissiveIntensity: 0 });
    const back = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 0.95, side: THREE.BackSide });
    const faceMesh = new THREE.Mesh(geo, front);
    const backMesh = new THREE.Mesh(geo, back);
    const obj = new THREE.Group();
    obj.add(faceMesh, backMesh);
    for (const m of [faceMesh, backMesh]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.hit = { kind: "sheet" };
      hittables.push(m);
    }
    // Hidden mesh by mesh, since the darts' ray only skips hidden meshes
    for (const m of obj.children) m.visible = false;
    scene.add(obj);
    const qLie = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), SHEET.turn)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
    return {
      obj, geo, base, front, qLie,
      aspect: 1, ready: false, progress: 0, rect: null,
      hover: false, hoverK: 0, hoverV: 0,
      shape: null,
    };
  })();

  /**
   * The float: which part of it the sheet is in, and its height, fall speed,
   * tilt, ripple, droop and glow. Off the table, the sheet stops casting into
   * the shadow map, which would then have to be redrawn every frame, and this
   * soft shadow on the table stands in for it.
   */
  const float = { stage: "rest", t: 0, h: 0, v: 0, pitch: 0, pitchV: 0, roll: 0, rollV: 0, ripple: 0, phase: 0, cup: 0, glow: 0 };
  const floatShadow = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    // A soft rectangle, drawn as the blurred shadow of one kept off the canvas
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 1000;
    ctx.fillRect(24 - 1000, 24, 80, 80);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(128 / 80, 128 / 80),
      new THREE.MeshBasicMaterial({ map: tex, color: 0x4a2c16, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false })
    );
    m.visible = false;
    scene.add(m);
    return m;
  })();
  /** Which way, and how far per unit of height, a shadow falls along the table */
  const shadowLean = sun.position.clone().sub(sun.target.position);
  shadowLean.set(-shadowLean.x / shadowLean.y, 0, -shadowLean.z / shadowLean.y);

  /** The sheet's own shadow on or off, redrawing the shadow map once for the change */
  function castSheet(on) {
    if (sheet.obj.children[0].castShadow === on) return;
    for (const m of sheet.obj.children) m.castShadow = on;
    shadowsDirty = true;
  }

  /** Bends the flat sheet: a corner curl, a cup across it, and a ripple */
  function bendSheet(peel, radius, cup, wave, phase) {
    const key = [peel, radius, cup, wave, phase].map((v) => v.toFixed(4)).join();
    if (key === sheet.shape) return;
    sheet.shape = key;
    const A = sheet.aspect;
    const pos = sheet.geo.attributes.position.array;
    const b = sheet.base;
    // From the middle out to the top-right corner, and the fold line across it
    const len = Math.hypot(A / 2, 0.5);
    const dx = A / 2 / len;
    const dy = 0.5 / len;
    const line = len - peel;
    for (let i = 0; i < pos.length; i += 3) {
      let u = b[i] * A;
      let v = b[i + 1];
      let z = cup * (b[i] * b[i] - 1 / 12) + wave * Math.sin(Math.PI * 2 * (0.7 * b[i] + 0.45 * b[i + 1]) + phase);
      const t = u * dx + v * dy - line;
      if (peel > 0 && t > 0) {
        const phi = t / radius;
        let along;
        let lift;
        if (phi < Math.PI) {
          along = line + radius * Math.sin(phi);
          lift = radius * (1 - Math.cos(phi));
        } else {
          along = line - (t - Math.PI * radius);
          lift = 2 * radius;
        }
        const shift = along - (t + line);
        u += dx * shift;
        v += dy * shift;
        z += lift;
      }
      pos[i] = u;
      pos[i + 1] = v;
      pos[i + 2] = z;
    }
    sheet.geo.attributes.position.needsUpdate = true;
    sheet.geo.computeVertexNormals();
    sheet.geo.computeBoundingSphere();
    sheet.geo.computeBoundingBox();
  }

  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const camFwd = new THREE.Vector3();
  const easeInOut = (k) => k * k * (3 - 2 * k);
  const clamp01 = (k) => Math.min(1, Math.max(0, k));

  /** Where the sheet lies flat over the panel's place on the screen */
  function screenPose(rect) {
    const D = SHEET.depth;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * camera.aspect;
    const cx = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
    const cy = -(((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1);
    camera.matrixWorld.extractBasis(camRight, camUp, camFwd);
    camFwd.negate();
    const at = camera.position.clone().addScaledVector(camFwd, D).addScaledVector(camRight, cx * D * tanH).addScaledVector(camUp, cy * D * tanV);
    const height = (rect.height / window.innerHeight) * 2 * D * tanV;
    return { at, q: camera.quaternion.clone(), height };
  }

  const corner = new THREE.Vector3();
  function poseSheet() {
    const p = sheet.progress;
    const show = sheet.ready && p < 1 && sheet.rect;
    for (const m of sheet.obj.children) m.visible = !!show;
    dirty = true;
    if (sheet.obj.children[0].castShadow) shadowsDirty = true;
    floatShadow.visible = false;
    if (!show) return;
    // The corner peels first, while the sheet still lies; it rolls back flat as the sheet arrives
    const peelIn = easeInOut(clamp01(p / 0.22));
    const peelOut = 1 - easeInOut(clamp01((p - 0.3) / 0.55));
    const hk = sheet.hoverK * (1 - clamp01(p / 0.1));
    const peel = Math.max(SHEET.hover.peel * hk, SHEET.peel.peel * peelIn * peelOut);
    const radius = THREE.MathUtils.lerp(SHEET.hover.radius, SHEET.peel.radius, peelIn) * (1 + (1 - peelOut) * 2.5);
    // The sheet itself comes up a beat behind and is flat on the panel's place by 0.9
    const q = easeInOut(clamp01((p - 0.12) / 0.78));
    const air = Math.sin(Math.PI * q);
    // Floating, its edges droop and ripples run through it, never so much
    // that it dips through the table when it is low; the float gives way to
    // the scroll
    const fk = 1 - clamp01(p / 0.1);
    const lyingSize = Math.min(SHEET.height, SHEET.maxWidth / sheet.aspect);
    const room = 0.003 + float.h / lyingSize;
    const cup = 0.16 * air * (1 - q * 0.5) - Math.min(-float.cup, 6 * room) * fk;
    const wave = 0.035 * air + Math.min(float.ripple, room * 0.5) * fk;
    bendSheet(peel, radius, cup, wave, q * 7 + float.phase);

    const target = screenPose(sheet.rect);
    const o = sheet.obj;
    o.position.lerpVectors(SHEET.at, target.at, q);
    o.quaternion.slerpQuaternions(sheet.qLie, target.q, q);
    // A loose sheet sways as it goes: it rolls one way and back, and its top leads
    const sway = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.35 * air * (1 - q), 0.25 * Math.sin(Math.PI * 2 * q) * (1 - q), 0.3 * Math.sin(Math.PI * 1.5 * q) * (1 - q))
    );
    o.quaternion.multiply(sway);
    o.scale.setScalar(THREE.MathUtils.lerp(lyingSize, target.height, q));
    // Up off the table, tilted as the air has it
    const floating = float.stage !== "rest" && fk > 0;
    if (floating) {
      o.position.y += float.h * fk;
      o.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(float.pitch * fk, float.roll * fk, 0)));
    }
    // It never dips through the table: no point of the bent paper, tilted,
    // drooping or rippling, goes lower than where it lies flat
    o.updateMatrixWorld();
    const m = o.matrixWorld.elements;
    const pos = sheet.geo.attributes.position.array;
    let low = Infinity;
    for (let i = 0; i < pos.length; i += 3) low = Math.min(low, m[1] * pos[i] + m[5] * pos[i + 1] + m[9] * pos[i + 2] + m[13]);
    if (low < SHEET.at.y) o.position.y += SHEET.at.y - low;
    // Its stand-in shadow, falling away from the sun and spreading and
    // fading the higher it is
    if (floating && !sheet.obj.children[0].castShadow) {
      const up = o.position.y - SHEET.at.y;
      const spread = 1 + (0.7 * up) / lyingSize;
      floatShadow.visible = true;
      floatShadow.position.set(SHEET.at.x + shadowLean.x * up, 0.004, SHEET.at.z + shadowLean.z * up);
      floatShadow.quaternion.copy(sheet.qLie);
      floatShadow.scale.set(lyingSize * sheet.aspect * spread, lyingSize * spread, 1);
      floatShadow.material.opacity = (0.42 * fk * clamp01(up / (0.02 * lyingSize))) / spread;
    }
    // Lit by the room on the table, it turns into the page's own flat paper as it arrives
    const glow = easeInOut(clamp01((q - 0.55) / 0.45));
    sheet.front.color.setScalar(1 - glow);
    sheet.front.emissiveIntensity = glow + 0.16 * float.glow * fk * (1 - glow);
  }

  /** Moves the float on by dt, in small steps so it runs the same at any frame rate */
  function stepFloat(dt, lying) {
    const F = SHEET.flap;
    const f = float;
    const top = F.lift * Math.min(SHEET.height, SHEET.maxWidth / sheet.aspect);
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    const drag = F.gravity / (F.terminal * F.terminal);
    const go = (stage) => {
      f.stage = stage;
      f.t = 0;
    };
    for (let i = 0; i < steps; i++) {
      f.t += h;
      f.phase += h * 4.5;
      if (f.stage === "rest") {
        // A new float only starts on a sheet lying there untouched
        if (!lying || sheet.hover || reducedMotion) f.t = 0;
        else if (f.t >= F.rest) {
          go("rise");
          castSheet(false);
        }
      } else if (f.stage === "rise") {
        // Lifted, slowing as it reaches the top, then held there a moment
        const k = clamp01(f.t / F.rise);
        f.h = top * (1 - (1 - k) ** 3);
        if (f.t >= F.rise + F.hang) go("fall");
      } else if (f.stage === "fall") {
        // Gravity against the air: it soon falls at its slow, steady speed
        f.v += (-F.gravity - drag * f.v * Math.abs(f.v)) * h;
        f.h += f.v * h;
        if (f.h <= 0) {
          f.h = 0;
          f.v = 0;
          go("settle");
        }
      }
      // Tilt springs back to flat, softly in the air and firmly once down.
      // Rising, it sways a little.
      const inAir = f.stage === "rise" || f.stage === "fall";
      const [w, damp] = inAir ? [5, 3] : [11, 9];
      const sway = f.stage === "rise" ? 0.025 : 0;
      f.pitchV += (-w * w * (f.pitch - sway * Math.sin(f.phase * 0.6)) - damp * f.pitchV) * h;
      f.rollV += (-w * w * (f.roll + sway * Math.sin(f.phase * 0.45 + 1)) - damp * f.rollV) * h;
      f.pitch += f.pitchV * h;
      f.roll += f.rollV * h;
      // In the air it ripples a little and its edges droop; on the table both
      // die away. It glows only while held up.
      const ease = Math.min(1, h * (inAir ? 5 : 9));
      f.ripple += ((inAir ? 0.015 : 0) - f.ripple) * ease;
      f.cup += ((inAir ? -0.025 : 0) - f.cup) * ease;
      f.glow += ((f.stage === "rise" ? 1 : 0) - f.glow) * Math.min(1, h * 4);
    }
    const still = Math.abs(f.pitch) + Math.abs(f.roll) + Math.abs(f.pitchV) + Math.abs(f.rollV) + f.ripple - f.cup + f.glow;
    if (f.stage === "settle" && still < 0.002) {
      Object.assign(f, { stage: "rest", t: 0, pitch: 0, roll: 0, pitchV: 0, rollV: 0, ripple: 0, cup: 0, glow: 0, phase: 0 });
      return true;
    }
    return f.stage !== "rest";
  }

  function animateSheet(dt) {
    if (!sheet.ready) return;
    const lying = sheet.progress < 0.05;
    const floated = stepFloat(dt, lying);
    // Back on the table, or scrolled off it, the sheet casts its real shadow again
    if (!lying || float.stage === "rest") castSheet(true);
    // The hover curl springs up with a little bounce, and settles back down
    const goal = sheet.hover && lying ? 1 : 0;
    if (Math.abs(goal - sheet.hoverK) < 0.001 && Math.abs(sheet.hoverV) < 0.001) {
      if (floated) poseSheet();
      return;
    }
    if (reducedMotion) {
      sheet.hoverK = goal;
      sheet.hoverV = 0;
    } else {
      const k = Math.min(dt, 1 / 30);
      sheet.hoverV += ((goal - sheet.hoverK) * 160 - sheet.hoverV * 16) * k;
      sheet.hoverK += sheet.hoverV * k;
    }
    poseSheet();
  }

  const sheetRay = new THREE.Raycaster();
  function sheetAt(ndcX, ndcY) {
    if (!sheet.obj.children[0].visible) return false;
    sheetRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const hit = sheetRay.intersectObjects(hittables, true).find((h) => h.object.visible);
    return !!hit && rootHit(hit.object)?.kind === "sheet";
  }

  // -------------------------------------------------------------- rewind
  /**
   * Time, kept so the clock can wind it back. Each physics step is
   * numbered (tick). A toy keeps a log of itself only while it is awake,
   * one row a step: the step, where it was, how it was turned, its speed
   * and its spin. A toy at rest writes nothing, so a still table costs
   * nothing, and a toy waking first notes where it lay. The train and the
   * pinwheels share one small ring, a few numbers a step.
   *
   * Winding only moves what you see; the physics waits. When the wheel is
   * let go, every toy is put back exactly as it was at the step shown,
   * moving as it was moving then, and the future it had is dropped. Time
   * winds forward again only as far as now, never past it.
   */
  const LOG = 14;
  const RING = 2 + 2 * mills.length;
  const ring = new Float32Array(REWIND.keep * RING);
  /** Every toy that has a log */
  const logged = new Set();
  let tick = 0;
  /** The earliest step time can still be wound back to */
  let oldest = 0;
  const time = { scrubbing: false, cursor: 0, goal: 0, still: 0, dir: 0, beat: 0, offset: 0, secOffset: 0 };
  /** Clock ticks and the start and end of a wind, for their sounds */
  const timeEvents = [];
  /** A tick is heard every this many steps wound */
  const TICK_EVERY = 5;
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  const vA = new THREE.Vector3();
  const wA = new THREE.Vector3();
  const still = { x: 0, y: 0, z: 0 };

  function put(log, step, p, q, v, w) {
    if ((log.n + 1) * LOG > log.data.length) {
      const more = new Float32Array(log.data.length * 2);
      more.set(log.data);
      log.data = more;
    }
    const d = log.data;
    let k = log.n++ * LOG;
    d[k++] = step;
    d[k++] = p.x;
    d[k++] = p.y;
    d[k++] = p.z;
    d[k++] = q.x;
    d[k++] = q.y;
    d[k++] = q.z;
    d[k++] = q.w;
    d[k++] = v.x;
    d[k++] = v.y;
    d[k++] = v.z;
    d[k++] = w.x;
    d[k++] = w.y;
    d[k] = w.z;
  }

  /** An awake toy's row for this step; t and r are where physics has it */
  function record(prop, t, r) {
    if (!prop.log) prop.log = { data: new Float32Array(LOG * 32), n: 0 };
    const log = prop.log;
    logged.add(prop);
    // Just woken (or just thrown): where it lay the step before
    if (!log.n || log.data[(log.n - 1) * LOG] < tick - 1) put(log, tick - 1, prop.p0, prop.q0, still, still);
    put(log, tick, t, r, prop.body.linvel(), prop.body.angvel());
  }

  function recordWorld() {
    let k = (tick % REWIND.keep) * RING;
    ring[k++] = train.s;
    ring[k++] = train.wait;
    for (const m of mills) {
      ring[k++] = m.angle;
      ring[k++] = m.spin;
    }
    oldest = Math.max(oldest, tick - REWIND.keep + 1);
    if (tick % REWIND.trimEvery === 0) trimLogs();
  }

  /** The last row at or before a step, or -1 if the log starts after it */
  function logIndex(log, step) {
    let lo = 0;
    let hi = log.n - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (log.data[mid * LOG] <= step) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found;
  }

  function readPose(log, i, p, q) {
    const d = log.data;
    const k = i * LOG;
    p.set(d[k + 1], d[k + 2], d[k + 3]);
    q.set(d[k + 4], d[k + 5], d[k + 6], d[k + 7]);
  }

  /** Steps too old to wind back to are dropped; a toy keeps the row it lay in then */
  function trimLogs() {
    for (const prop of logged) {
      if (prop.goneAt && prop.goneAt <= oldest) {
        logged.delete(prop);
        prop.log = null;
        dropFrom(props, prop);
        prop.obj.removeFromParent();
        world.removeRigidBody(prop.body);
        continue;
      }
      const log = prop.log;
      const i = logIndex(log, oldest);
      if (i > 0) {
        log.data.copyWithin(0, i * LOG, log.n * LOG);
        log.n -= i;
      }
    }
  }

  function placeWheels() {
    for (const w of train.wheels) w.rotation.z = -train.s / 0.22;
  }

  /** Shows the table as it was at step S (between steps, part way) */
  function showAt(S) {
    const s0 = Math.floor(S);
    const k = S - s0;
    for (const prop of logged) {
      const log = prop.log;
      let a = logIndex(log, s0);
      if (prop.goneAt) prop.obj.visible = S < prop.goneAt;
      if (a < 0) {
        // A dart not yet thrown is not there; a toy not yet woken lies where it lay
        if (prop.dart) {
          prop.obj.visible = false;
          continue;
        }
        a = 0;
      } else if (prop.dart) prop.obj.visible = true;
      readPose(log, a, pA, qA);
      const b = k > 0 ? logIndex(log, s0 + 1) : a;
      if (b > a) {
        readPose(log, b, pB, qB);
        pA.lerp(pB, k);
        qA.slerp(qB, k);
      }
      prop.obj.position.copy(pA);
      prop.obj.quaternion.copy(qA);
    }
    const r0 = (s0 % REWIND.keep) * RING;
    const r1 = s0 + 1 <= tick ? ((s0 + 1) % REWIND.keep) * RING : r0;
    // The train runs smoothly between steps, but jumps back to the start of its run in one
    const sNext = Math.abs(ring[r1] - ring[r0]) < 2 ? ring[r1] : ring[r0];
    train.s = THREE.MathUtils.lerp(ring[r0], sNext, k);
    train.wait = ring[r0 + 1];
    placeTrain(false);
    placeWheels();
    mills.forEach((m, i) => {
      m.angle = THREE.MathUtils.lerp(ring[r0 + 2 + i * 2], ring[r1 + 2 + i * 2], k);
      m.sails.quaternion.copy(m.q).multiply(qSpin.setFromAxisAngle(zAxis, m.angle));
    });
    dirty = shadowsDirty = true;
  }

  /** Puts a toy back exactly as it was at step C, and forgets its future */
  function settleAt(prop, C) {
    const log = prop.log;
    const body = prop.body;
    let i = logIndex(log, C);
    if (i < 0) {
      if (prop.dart) return release(prop);
      i = 0;
    }
    readPose(log, i, pA, qA);
    // Not moved since C: the physics already has it right, and touching it
    // would only wake whatever it leans on
    if (i === log.n - 1 && log.data[i * LOG] <= C) {
      prop.obj.position.copy(prop.p1);
      prop.obj.quaternion.copy(prop.q1);
      prop.obj.visible = !prop.goneAt;
      return;
    }
    const d = log.data;
    const k = i * LOG;
    vA.set(d[k + 8], d[k + 9], d[k + 10]);
    wA.set(d[k + 11], d[k + 12], d[k + 13]);
    // No row at C means it lay still then
    const resting = d[k] < C || vA.lengthSq() + wA.lengthSq() < 1e-6;
    if (prop.goneAt && C < prop.goneAt) {
      prop.goneAt = 0;
      body.setEnabled(true);
      hittables.push(prop.obj);
    }
    prop.obj.visible = !prop.goneAt;
    body.setTranslation(pA, false);
    body.setRotation(qA, false);
    body.setLinvel(resting ? still : vA, false);
    body.setAngvel(resting ? still : wA, false);
    if (resting) body.sleep();
    else body.wakeUp();
    prop.p0.copy(pA);
    prop.p1.copy(pA);
    prop.q0.copy(qA);
    prop.q1.copy(qA);
    prop.obj.position.copy(pA);
    prop.obj.quaternion.copy(qA);
    prop.moving = false;
    prop.speed = resting ? 0 : vA.length();
    prop.slow = 0;
    prop.arc = 0;
    log.n = i + 1;
    if (d[k] > C) d[k] = C;
  }

  /** The wheel turned over the clock: steps back (-) or on (+) */
  function scrubTime(steps) {
    if (!steps) return;
    if (!time.scrubbing) {
      // Now is as far on as time goes: there is no winding on from it
      if (steps > 0) return;
      time.scrubbing = true;
      time.cursor = time.goal = tick;
      time.beat = Math.floor(tick / TICK_EVERY);
      timeEvents.push({ kind: "start", dir: -1 });
    }
    // Back as far as is kept; on, only as far as now
    time.goal = THREE.MathUtils.clamp(time.goal + steps, oldest, tick);
    time.dir = Math.sign(steps);
    time.still = 0;
  }

  /** While winding: the shown time eases after the wheel */
  function scrub(dt) {
    time.still += dt;
    time.cursor += (time.goal - time.cursor) * (1 - Math.exp(-dt * 10));
    if (Math.abs(time.goal - time.cursor) < 0.02) time.cursor = time.goal;
    showAt(time.cursor);
    const beat = Math.floor(time.cursor / TICK_EVERY);
    if (beat !== time.beat) {
      timeEvents.push({ kind: "tick", dir: Math.sign(beat - time.beat) });
      time.beat = beat;
    }
    // A moment after the wheel stops, time runs again from where it was left
    if (time.still > 0.7 && Math.abs(time.goal - time.cursor) < 0.05) releaseTime();
  }

  /** Time runs again from the step shown */
  function releaseTime() {
    if (!time.scrubbing) return;
    time.scrubbing = false;
    const C = THREE.MathUtils.clamp(Math.round(time.cursor), oldest, tick);
    // The clock keeps the time it was wound to
    time.offset += (C - tick) * REWIND.clockSeconds;
    time.secOffset += C - tick;
    for (const prop of [...logged]) settleAt(prop, C);
    const r = (C % REWIND.keep) * RING;
    train.s = ring[r];
    train.wait = ring[r + 1];
    train.moving = false;
    placeTrain(true);
    placeWheels();
    mills.forEach((m, i) => {
      m.angle = ring[r + 2 + i * 2];
      m.spin = ring[r + 3 + i * 2];
    });
    tick = C;
    acc = 0;
    active = true;
    dirty = shadowsDirty = true;
    timeEvents.push({ kind: "resume" });
  }

  /** The hands: the visitor's own time, plus however far it has been wound */
  function turnClock() {
    const h = clockState.hands;
    if (!h) return;
    const wound = time.scrubbing ? time.cursor - tick : 0;
    const local = Date.now() / 1000 - new Date().getTimezoneOffset() * 60;
    const t = local + time.offset + wound * REWIND.clockSeconds;
    // The second hand ticks; while winding it sweeps, a second a step
    const sec = local + time.secOffset + wound;
    const shown = time.scrubbing ? sec : Math.floor(sec);
    const key = `${Math.round(t)}|${shown.toFixed(2)}`;
    if (key === clockState.shown) return;
    clockState.shown = key;
    const turn = (v, period) => -(((v % period) + period) % period) / period * Math.PI * 2;
    h.second.rotation.z = turn(shown, 60);
    h.minute.rotation.z = turn(t, 3600);
    h.hour.rotation.z = turn(t, 43200);
    // The calendar beside it turns its page when the hands pass midnight
    const day = Math.floor(t / 86400);
    if (day !== calendarPage.day) {
      calendarPage.day = day;
      paintCalendar(new Date(day * 86400000));
    }
    dirty = true;
  }
  recordWorld();

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

  const carBox = new THREE.Box3();
  // A dart's middle stops about this far short of what it hits (the cup is at its tip)
  const DART_REACH = 0.32;
  // The meeple's yelp stands in for the usual knock of a dart landing
  let hushKnocks = 0;

  /**
   * A loose dart that meets one of the train's cars, wherever it was aimed
   * and however weakly it was thrown, is heard once as a train hit
   */
  function checkTrain(prop) {
    if (prop.trainHit || prop.state !== "loose") return;
    for (const c of train.cars) {
      c.obj.updateWorldMatrix(true, true);
      carBox.setFromObject(c.obj).expandByScalar(DART_REACH);
      if (carBox.containsPoint(prop.p1)) {
        prop.trainHit = true;
        landings.push("train");
        return;
      }
    }
  }

  /** The clock never moves, so the space round it is worked out once */
  const clockBox = new THREE.Box3();
  /** A loose dart that hits the clock rings its bells, once per dart */
  function checkClock(dart) {
    if (dart.clockHit || !clockState.obj) return;
    if (clockBox.isEmpty()) clockBox.setFromObject(clockState.obj).expandByScalar(DART_REACH);
    if (!clockBox.containsPoint(dart.p1)) return;
    dart.clockHit = true;
    hushKnocks = performance.now() + 350;
    landings.push("clock");
  }

  /** A loose dart that hits a meeple with a face is heard once, per dart */
  function checkTalkers(dart) {
    for (const m of talkers) {
      if (dart.talkerHit === m) continue;
      carBox.setFromObject(m.obj).expandByScalar(DART_REACH);
      if (carBox.containsPoint(dart.p1)) {
        dart.talkerHit = m;
        hushKnocks = performance.now() + 350;
        landings.push("meeple");
        return;
      }
    }
  }

  /**
   * A toy off the edge of the table is put away out of sight, not thrown
   * out: winding time back past its fall brings it back. Once that moment
   * is older than time can be wound back, it goes for good.
   */
  function vanish(prop) {
    prop.goneAt = tick;
    prop.obj.visible = false;
    prop.moving = false;
    dropFrom(hittables, prop.obj);
    prop.body.setEnabled(false);
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
    tick++;
    const now = performance.now();
    let awake = 0;
    for (let i = props.length - 1; i >= 0; i--) {
      const prop = props[i];
      if (prop.goneAt) continue;
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
      if (prop.dart && prop.state === "loose") {
        checkTalkers(prop);
        checkClock(prop);
      }
      // A sudden stop is a block landing on something
      const drop = prop.speed - speed;
      if (drop > 1.6) prop.arc = 0;
      if (drop > 1.6 && now - prop.lastKnock > 110 && now > hushKnocks) {
        prop.lastKnock = now;
        knocks.push({ strength: Math.min(1, drop / 9), small: Boolean(prop.dart) || body.mass() < 0.25 });
      }
      prop.speed = speed;
      if (prop.dart) {
        checkBasket(prop);
        checkTrain(prop);
      }
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
      record(prop, t, r);
      if (t.y < -12 || t.z < -40 || Math.abs(t.x) > 45) {
        if (prop.dart) release(prop);
        else vanish(prop);
      }
    }
    recordWorld();
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
      if (time.scrubbing) {
        scrub(dt);
        // A dart's ten seconds wait while time is being wound
        for (const d of live) {
          d.born += dt * 1000;
          if (d.dying) d.dying += dt * 1000;
        }
      } else {
        if (!reducedMotion) runTrain(dt);
        stepPhysics(dt);
        flyPinned(dt);
        settleQuills(dt);
        ageDarts(now);
        turnMills(dt);
      }
      animateTrainBits(dt);
      swingClouds(dt);
      animateHoop(dt);
      animateNote(dt);
      waveFlags(now);
      turnClock();
      watchFrames(dt);
      animateSheet(dt);
    },
    /** Whether the clock is at this point on the screen */
    clockAt(ndcX, ndcY) {
      return pick(ndcX, ndcY).kind === "clock";
    },
    /** The clock's outline turns orange under the pointer */
    hoverClock(on) {
      if (clockState.hover === on) return;
      clockState.hover = on;
      outlineMat.uniforms.color.value.set(on ? CLOCK_EDGE.hover : CLOCK_EDGE.idle);
      dirty = true;
    },
    scrubTime,
    releaseTime,
    /** Whether time is being wound, and which way: -1 back, 1 on */
    timeState() {
      if (!time.scrubbing) return { scrubbing: false, dir: 0 };
      const ahead = time.goal - time.cursor;
      return { scrubbing: true, dir: Math.abs(ahead) > 0.05 ? Math.sign(ahead) : time.dir };
    },
    takeTimeEvents() {
      return timeEvents.splice(0);
    },
    /** The intro's picture, for the sheet on the table; aspect is width over height */
    setSheet(picture, aspect) {
      // The same canvas, drawn on again: the texture only needs to be re-read
      if (sheet.picture === picture && sheet.front.map) {
        sheet.front.map.needsUpdate = true;
        sheet.aspect = aspect;
        dirty = true;
        return;
      }
      sheet.picture = picture;
      const tex = new THREE.CanvasTexture(picture);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      sheet.front.map?.dispose();
      sheet.front.map = tex;
      sheet.front.emissiveMap = tex;
      sheet.front.needsUpdate = true;
      sheet.aspect = aspect;
      sheet.shape = null;
      sheet.ready = true;
      poseSheet();
    },
    /** Takes the sheet off the table, when its picture could not be made */
    clearSheet() {
      sheet.ready = false;
      poseSheet();
    },
    /** How far the page has scrolled off the splash (0 to 1), and where the intro panel is on the screen */
    setSheetProgress(progress, rect) {
      sheet.progress = progress;
      sheet.rect = rect;
      poseSheet();
    },
    sheetAt,
    /** Where the sheet lies on the screen while it is on the table: its bounding box in pixels */
    sheetOnScreen() {
      if (!sheet.ready) return null;
      const lying = new THREE.Matrix4().compose(SHEET.at, sheet.qLie, new THREE.Vector3().setScalar(Math.min(SHEET.height, SHEET.maxWidth / sheet.aspect)));
      const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      for (const [x, y] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
        const p = corner.set(x * sheet.aspect, y, 0).applyMatrix4(lying).project(camera);
        const sx = (p.x + 1) * 0.5 * window.innerWidth;
        const sy = (1 - p.y) * 0.5 * window.innerHeight;
        box.left = Math.min(box.left, sx);
        box.right = Math.max(box.right, sx);
        box.top = Math.min(box.top, sy);
        box.bottom = Math.max(box.bottom, sy);
      }
      return box;
    },
    hoverSheet(on) {
      sheet.hover = on;
    },
    /** Where the hanging sun is on the screen: its middle and its radius in pixels */
    sunOnScreen() {
      const toScreen = (v) => {
        v.project(camera);
        return [(v.x + 1) * 0.5 * window.innerWidth, (1 - v.y) * 0.5 * window.innerHeight];
      };
      const middle = sunCutout.mesh.getWorldPosition(new THREE.Vector3());
      const [x, y] = toScreen(middle.clone());
      const [ex] = toScreen(middle.add(new THREE.Vector3(1.4, 0, 0)));
      return { x, y, r: Math.abs(ex - x) };
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
        sheet: { shown: sheet.obj.children[0].visible, at: sheet.obj.position.toArray().map((v) => Math.round(v * 100) / 100), scale: Math.round(sheet.obj.scale.x * 100) / 100, aspect: sheet.aspect, progress: sheet.progress },
        active,
        rewind: {
          tick,
          oldest,
          logged: logged.size,
          gone: props.filter((p) => p.goneAt).length,
          kb: Math.round(([...logged].reduce((n, p) => n + p.log.data.length, 0) * 4 + ring.length * 4) / 1024),
        },
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
