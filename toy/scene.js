/**
 * The toy table under the pages: a warm tabletop by a sunny window, with a
 * block wall along the back, toy trees, block castles and towers, and
 * paper clouds on strings. Darts are real foam bodies that bounce off
 * whatever they hit. The pages simply lie on top of all this.
 *
 * Physics runs at a fixed 30 Hz and only while something is awake; every
 * frame in between is interpolated, so motion stays smooth at 60 fps.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import RAPIER from "rapier";

/** The width the camera always shows, whatever the window's shape */
const H_FOV = 60;
const GRAVITY = -26;
const STEP = 1 / 30;
const MAX_LOOSE = 30;
const DART_SPEED = 38;
/** A dart in flight is handed to physics this far short of what it hits */
const HANDOFF = 2.2;

const COLORS = {
  cream: 0xf3e2c2,
  wood: 0xe4c497,
  sand: 0xd9b98c,
  red: 0xdc6a52,
  coral: 0xe9906d,
  blue: 0x7f9fcb,
  mustard: 0xebbb55,
  sage: 0x93a86c,
  green: 0x7d9b5b,
  olive: 0x8c9a58,
  trunk: 0xc89a6b,
};

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The view out of the window: sunlit houses and trees, out of focus */
function backdropCanvas() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext("2d");
  const rand = rng(21);
  const sky = ctx.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, "#f6e4c2");
  sky.addColorStop(0.45, "#fbf0da");
  sky.addColorStop(0.7, "#efdcb5");
  sky.addColorStop(1, "#c9ad7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2048, 1024);

  ctx.filter = "blur(16px)";
  const glow = ctx.createRadialGradient(1450, 260, 20, 1450, 260, 620);
  glow.addColorStop(0, "rgba(255, 246, 214, 0.95)");
  glow.addColorStop(1, "rgba(255, 246, 214, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 2048, 1024);

  // Far trees behind the houses
  const leaves = ["#b4b866", "#a3aa5c", "#c8c67a", "#9aa257", "#d6cf8a"];
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = leaves[i % leaves.length];
    ctx.beginPath();
    ctx.arc(rand() * 2048, 470 + rand() * 120, 70 + rand() * 90, 0, Math.PI * 2);
    ctx.fill();
  }
  // Houses along the lane
  const walls = ["#e7b48a", "#d98f6a", "#f0cfa6", "#c97d5e", "#e9c39a"];
  let x = 40;
  while (x < 2048) {
    const w = 220 + rand() * 160;
    const h = 190 + rand() * 130;
    const base = 760;
    ctx.fillStyle = walls[Math.floor(rand() * walls.length)];
    ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = "#8b5a43";
    ctx.beginPath();
    ctx.moveTo(x - 20, base - h);
    ctx.lineTo(x + w / 2, base - h - 90 - rand() * 50);
    ctx.lineTo(x + w + 20, base - h);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 244, 222, 0.8)";
    for (let wx = x + 30; wx < x + w - 40; wx += 70) ctx.fillRect(wx, base - h + 50, 34, 46);
    x += w + 60 + rand() * 120;
  }
  // Garden in front, and bushes
  ctx.fillStyle = "#b9a46a";
  ctx.fillRect(0, 760, 2048, 264);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = leaves[(i + 2) % leaves.length];
    ctx.beginPath();
    ctx.arc(rand() * 2048, 760 + rand() * 40, 40 + rand() * 60, 0, Math.PI * 2);
    ctx.fill();
  }
  // Big sunlit canopies close to the window
  const near = ["#c9cd78", "#dcd88f", "#b7bf69"];
  for (let i = 0; i < 26; i++) {
    const right = i % 2;
    ctx.fillStyle = near[i % near.length];
    ctx.beginPath();
    ctx.arc(right ? 1600 + rand() * 500 : rand() * 420, rand() * 380, 90 + rand() * 110, 0, Math.PI * 2);
    ctx.fill();
  }
  // The window frame, nearer, so a little less soft
  ctx.filter = "blur(5px)";
  ctx.fillStyle = "#fbf4e8";
  ctx.fillRect(1240, 0, 46, 1024);
  ctx.fillRect(0, 0, 2048, 34);
  ctx.filter = "none";
  return c;
}

/** A paper cloud: soft lumps with a cartoon outline */
function cloudCanvas(seed) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 180;
  const ctx = c.getContext("2d");
  const rand = rng(seed);
  const lumps = [];
  for (let i = 0; i < 5; i++) {
    lumps.push({ x: 60 + i * 50 + (rand() - 0.5) * 16, y: 110 - (i % 2 ? 22 : 0) - (i === 2 ? 18 : 0), r: 38 + rand() * 16 + (i === 2 ? 12 : 0) });
  }
  const shape = () => {
    ctx.beginPath();
    for (const l of lumps) {
      ctx.moveTo(l.x + l.r, l.y);
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    }
    ctx.rect(50, 100, 220, 46);
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
  const shade = ctx.createLinearGradient(0, 90, 0, 150);
  shade.addColorStop(0, "rgba(226, 210, 186, 0)");
  shade.addColorStop(1, "rgba(226, 210, 186, 0.9)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 90, 320, 70);
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

/** A soft cone, rounded at the tip like a sanded toy tree */
function softCone(r, h) {
  const pts = [new THREE.Vector2(0, 0)];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const rad = r * Math.pow(1 - t, 0.95) * (1 - 0.08 * t) + (t > 0.85 ? 0 : 0);
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

export async function createTable(canvas) {
  await RAPIER.init();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Shadows are redrawn only when something on the table has moved
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

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
  const loose = [];
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
    scene.add(view);
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

  function addProp(obj, colliders, pos, rotY = 0) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinearDamping(0.08)
        .setAngularDamping(0.4)
        .setCanSleep(true)
    );
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
      block("cone", [U * 0.8, U * 1.3], COLORS.red, tx, 4 * U * 1.1 + U * 0.65, cz);
    }
    const kz = cz - U * 1.8;
    for (let i = 0; i < 3; i++) block("cyl", [U * 0.7, U * 1.4], i === 1 ? COLORS.mustard : COLORS.wood, cx, U * 0.7 + i * U * 1.4, kz);
    block("cone", [U * 0.85, U * 1.5], COLORS.blue, cx, U * 4.2 + U * 0.75, kz);
  }

  /** Layers of three sticks, each layer turned a quarter */
  function stickTower(cx, cz, layers) {
    const stick = [U * 2.4, U * 0.42, U * 0.75];
    for (let l = 0; l < layers; l++) {
      const y = stick[1] / 2 + l * stick[1];
      const color = [COLORS.wood, COLORS.mustard, COLORS.cream, COLORS.sage][l % 4];
      for (let i = -1; i <= 1; i++) {
        if (l % 2) block("box", stick, color, cx, y, cz + i * stick[2]);
        else block("box", stick, color, cx + i * stick[2], y, cz, Math.PI / 2);
      }
    }
  }

  function pyramid(cx, cz, base) {
    const s = U * 1.05;
    const colors = [COLORS.red, COLORS.blue, COLORS.mustard, COLORS.sage];
    for (let row = 0; row < base; row++) {
      const n = base - row;
      for (let i = 0; i < n; i++) block("box", [s, s, s], colors[(i + row) % 4], cx + (i - (n - 1) / 2) * s, s / 2 + row * s, cz);
    }
  }

  function house(cx, cz, rotY = 0) {
    const s = U * 1.8;
    block("box", [s, s, s], COLORS.cream, cx, s / 2, cz, rotY);
    block("prism", [s * 1.15, s * 0.6, s * 1.05], COLORS.red, cx, s + s * 0.3, cz, rotY);
  }

  /** Closer than half their height apart, so each one reaches the next */
  function dominoes(from, to, count) {
    const size = [U * 0.22, U * 1.6, U * 0.8];
    const ang = Math.atan2(to.x - from.x, to.z - from.z) + Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = from.x + (to.x - from.x) * t + Math.sin(t * 6) * 0.25;
      const z = from.z + (to.z - from.z) * t;
      block("box", size, i % 2 ? COLORS.blue : COLORS.cream, x, size[1] / 2, z, ang);
    }
  }

  // A toy table laid out for its own sake. The pages lie on top of it.
  backWall(-9.6);
  castle(-8.5, -5);
  stickTower(8.4, -3.6, 9);
  house(11.2, -6.4, -0.35);
  pyramid(-1.5, -6, 4);
  tree(-12.2, -6.8, { kind: "egg", scale: 1.25, color: COLORS.sage });
  tree(-10.6, -7.6, { kind: "cone", scale: 1.1, color: COLORS.green });
  tree(-4.6, -7.2, { kind: "egg", scale: 1, color: COLORS.olive });
  tree(3, -7.4, { kind: "cone", scale: 1.15, color: COLORS.sage });
  tree(5.8, -6.8, { kind: "egg", scale: 1.1, color: COLORS.green });
  tree(12.4, -2.4, { kind: "egg", scale: 1.15, color: COLORS.olive });
  tree(-11.4, 0.4, { kind: "cone", scale: 0.95, color: COLORS.olive });
  tree(-7.6, 2.6, { kind: "egg", scale: 0.85, color: COLORS.sage });
  tree(7.4, 1.6, { kind: "cone", scale: 0.85, color: COLORS.green });
  tree(0.6, -2.5, { kind: "egg", scale: 0.9, color: COLORS.sage });
  dominoes({ x: 7.1, z: 4.4 }, { x: 8.1, z: -1.8 }, 15);
  block("cyl", [U * 0.45, U * 2.2], COLORS.wood, -6.4, U * 1.1, 4.6);
  block("ball", [U * 0.42], COLORS.red, -6.4, U * 2.2 + U * 0.42, 4.6);
  block("box", [U, U, U], COLORS.mustard, -5.1, U / 2, 3.4, 0.3);
  block("box", [U, U, U], COLORS.blue, -5.1, U * 1.5, 3.4, 0.1);
  block("box", [U, U, U], COLORS.red, -5.1, U * 2.5, 3.4, -0.2);
  block("box", [U, U, U], COLORS.cream, -2, U / 2, 2.6, 0.5);
  block("cyl", [U * 0.5, U], COLORS.coral, 3, U / 2, 3.4);
  block("box", [U * 2, U * 0.7, U], COLORS.sage, 4.8, U * 0.35, -1.4, 0.7);
  block("box", [U, U, U], COLORS.blue, -3.8, U / 2, -1.2, 0.2);

  // -------------------------------------------------------------- clouds
  const stringMat = new THREE.MeshBasicMaterial({ color: 0x7a6450 });
  const stringGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 4);
  /** Strings run up out of view to a pivot high above, so a swing is slow */
  const STRING = 10;
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
    for (const sx of [-w * 0.22, w * 0.22]) {
      const s = new THREE.Mesh(stringGeo, stringMat);
      s.scale.y = STRING + 4;
      s.position.set(sx, (4 - STRING) / 2, -0.02);
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
  hanging(cloudCanvas(8), 3, 1.7, new THREE.Vector3(-5, 9, -9.5));
  hanging(cloudCanvas(5), 3.4, 1.9, new THREE.Vector3(8.6, 8, -8));
  hanging(cloudCanvas(13), 2.8, 1.55, new THREE.Vector3(13.2, 6.3, -5.5));
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

  // --------------------------------------------------------------- darts
  const foam = new THREE.MeshStandardMaterial({ color: 0xff7a1f, roughness: 0.85 });
  const cap = new THREE.MeshStandardMaterial({ color: 0xffb57a, roughness: 0.85 });
  const cup = new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: 0.5 });
  const dartGeo = {
    body: new THREE.CylinderGeometry(0.065, 0.065, 0.4, 10),
    end: new THREE.CylinderGeometry(0.067, 0.067, 0.03, 10),
    cup: new THREE.CylinderGeometry(0.095, 0.05, 0.06, 12),
  };

  /** Cup at the front (-y), foam body, lighter cap at the back (+y) */
  function makeDart() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(dartGeo.cup, cup);
    c.position.y = -0.23;
    const b = new THREE.Mesh(dartGeo.body, foam);
    const e = new THREE.Mesh(dartGeo.end, cap);
    e.position.y = 0.215;
    g.add(c, b, e);
    g.traverse((m) => (m.castShadow = true));
    return g;
  }

  const yAxis = new THREE.Vector3(0, 1, 0);

  /** A foam dart body, flying, that bounces off whatever it meets */
  function spawnDart(pos, vel) {
    const q = new THREE.Quaternion().setFromUnitVectors(yAxis, vel.clone().normalize().negate());
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinvel(vel.x, vel.y, vel.z)
        .setAngularDamping(0.5)
        .setCcdEnabled(true)
        .setCanSleep(true)
    );
    world.createCollider(RAPIER.ColliderDesc.capsule(0.2, 0.068).setDensity(9).setRestitution(0.45).setFriction(0.6), body);
    const obj = makeDart();
    obj.position.copy(pos);
    obj.quaternion.copy(q);
    const prop = track(obj, body, { dart: true });
    prop.moving = true;
    loose.push(prop);
    while (loose.length > MAX_LOOSE) removeProp(loose.shift());
    active = true;
    return prop;
  }

  function removeProp(prop) {
    const i = props.indexOf(prop);
    if (i >= 0) props.splice(i, 1);
    const hi = hittables.indexOf(prop.obj);
    if (hi >= 0) hittables.splice(hi, 1);
    const li = loose.indexOf(prop);
    if (li >= 0) loose.splice(li, 1);
    prop.obj.removeFromParent();
    world.removeRigidBody(prop.body);
    dirty = shadowsDirty = true;
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
      const info = rootHit(h.object);
      if (!info) continue;
      if (info.kind === "cloud" && !solidAt(info.cloud.canvas, h.uv)) continue;
      return { ...info, point: h.point.clone(), distance: h.distance, dir };
    }
    return { kind: "miss", dir, point: camera.position.clone().addScaledVector(dir, 30), distance: 30 };
  }

  /** Where the flying dart is handed from the page to the table */
  function aim(ndcX, ndcY) {
    const hit = pick(ndcX, ndcY);
    const dist = hit.kind === "cloud" ? hit.distance : Math.max(4, hit.distance - HANDOFF);
    return { hit, dist, point: camera.position.clone().addScaledVector(hit.dir, dist) };
  }

  /** The dart reaches the table. Returns what it met, for the sound. */
  function shoot(ndcX, ndcY) {
    const { hit, dist } = aim(ndcX, ndcY);
    const dir = hit.dir;
    if (hit.kind === "cloud") {
      const c = hit.cloud;
      // Pushed away, it swings back on its strings; the dart drops off it
      // An off-centre hit also turns it on its strings
      const off = THREE.MathUtils.clamp((hit.point.x - c.pivot.position.x) / 1.5, -1, 1);
      c.vx += -dir.z * 0.32;
      c.vz += dir.x * 0.3 + (Math.random() - 0.5) * 0.12;
      c.vy += off * 2.4;
      c.hits++;
      spawnDart(hit.point.clone().addScaledVector(dir, -0.15), dir.clone().multiplyScalar(-5).add(new THREE.Vector3(0, -1.5, 0)));
      return "cloud";
    }
    spawnDart(camera.position.clone().addScaledVector(dir, dist), dir.clone().multiplyScalar(DART_SPEED));
    return hit.kind;
  }

  // ---------------------------------------------------------------- loop
  let acc = 0;
  const knocks = [];

  function stepOnce() {
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
          prop.moving = false;
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
      if (drop > 1.6 && now - prop.lastKnock > 110) {
        prop.lastKnock = now;
        knocks.push({ strength: Math.min(1, drop / 9), small: Boolean(prop.dart) || body.mass() < 0.25 });
      }
      prop.speed = speed;
      if (t.y < -12 || t.z < -40 || Math.abs(t.x) > 45) removeProp(prop);
    }
    if (awake === 0) active = false;
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
      if (!prop.moving && alpha !== 1) continue;
      prop.obj.position.lerpVectors(prop.p0, prop.p1, alpha);
      prop.obj.quaternion.slerpQuaternions(prop.q0, prop.q1, alpha);
    }
    dirty = shadowsDirty = true;
    if (!active) acc = 0;
  }

  function wake() {
    active = true;
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    fitCamera();
    dirty = shadowsDirty = true;
  }

  return {
    camera,
    aim,
    shoot,
    resize,
    wake,
    takeKnocks() {
      return knocks.splice(0);
    },
    update(dt) {
      stepPhysics(dt);
      swingClouds(dt);
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
        darts: loose.length,
        cloudHits: clouds.map((c) => c.hits),
        active,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      };
    },
    /** Screen position of a prop, by index, for tests */
    propOnScreen(i) {
      const p = props[i].obj.getWorldPosition(new THREE.Vector3()).project(camera);
      return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - p.y) * 0.5 * window.innerHeight };
    },
  };
}
