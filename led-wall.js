/**
 * Retro LED wall — self-playing snake sim used as a navigation surface.
 *
 * Four snakes chase the nearest shared dot, but never at the cost of their
 * own life: a step that boxes them in is refused even when it is the fast way
 * to food. Bumping into another snake kills the one that bumped, and its body
 * drops back onto the wall as dots that rot inward if nobody eats them, so the
 * population keeps recycling without any player input.
 *
 * Labels are the map: their LEDs are obstacles the snakes path around, and
 * hovering one turns it into a clickable button.
 *
 * Tunables: led-wall.config.js -> window.LED_WALL_CONFIG
 */

const GLYPHS_5X7 = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10001", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "&": ["01000", "10100", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

const GLYPHS_3X5 = {
  " ": ["000", "000", "000", "000", "000"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "111", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "-": ["000", "000", "111", "000", "000"],
  "&": ["010", "101", "010", "101", "011"],
  "!": ["010", "010", "010", "000", "010"],
  "?": ["110", "001", "010", "000", "010"],
  ".": ["000", "000", "000", "000", "010"],
  "0": ["010", "101", "101", "101", "010"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "110", "101", "010"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["010", "101", "010", "101", "010"],
  "9": ["010", "101", "011", "001", "110"],
};

function fontMetrics(name) {
  if (name === "5x7") return { glyphs: GLYPHS_5X7, w: 5, h: 7 };
  return { glyphs: GLYPHS_3X5, w: 3, h: 5 };
}

/**
 * Pixel-art bust. Black is empty wall (unlit LEDs). Every row must be the
 * same width.
 */
const PORTRAIT_PALETTE = {
  ".": null,
  /** Spiky hair */
  H: { r: 33, g: 33, b: 33 },
  /** Skin */
  S: { r: 229, g: 170, b: 122 },
  /** Black glasses */
  G: { r: 38, g: 50, b: 56 },
  /** Eyes */
  E: { r: 58, g: 34, b: 24 },
  /** Smile */
  M: { r: 229, g: 115, b: 115 },
  /** Light grey shirt */
  C: { r: 189, g: 189, b: 189 },
};

const PORTRAIT_SPRITE = [
  "..........H..H......",
  "........H.H.H..H....",
  ".......HHHHHHHH.....",
  "......HHHHHHHHHH....",
  ".....SSSHHHHSSSHH...",
  "....SSSSSSSSSSSSHH..",
  "....GGGGGSSGGGGGHH..",
  "...GSSSSGGGSSSSGGGG.",
  "...GSESSGSGSESSGSS..",
  "...GGGGGSSGGGGGSSS..",
  "....SSSSSSSSSSSSSS..",
  "....SSSSSSSSSSSSS...",
  ".....SSSSSMSSSSSS...",
  ".....SSMMMMSSSSS....",
  "......SSSSSSSSS.....",
  "......CCSSSSSCCC....",
  "....CCCCCCSCCCCCCC..",
  "....CCCCCCCCCCCCCC..",
];

/**
 * Rows of the sprite that are head rather than shoulders. The face is what the
 * wall centers on, so the bust hanging below it must not drag the eyes off
 * center. Kept near the original so the name still has a lane above the hair.
 */
const PORTRAIT_FACE_ROWS = 13;

function mergeConfig(overrides = {}) {
  const file = window.LED_WALL_CONFIG || {};
  const defaults = {
    targetCellPx: 11,
    minCellPx: 5,
    cellGapRatio: 0.28,
    bg: "#050506",
    diodeInset: 0.08,
    offColor: { r: 12, g: 12, b: 14 },
    font: "3x5",
    labelScale: 1,
    letterGap: 1,
    labelHitPadding: 2,
    labelMargin: 4,
    portraitScale: 1,
    portraitHair: { r: 33, g: 33, b: 33 },
    portraitGlasses: { r: 38, g: 50, b: 56 },
    portraitMouth: { r: 229, g: 115, b: 115 },
    portraitShirt: { r: 189, g: 189, b: 189 },
    labelColor: { r: 232, g: 236, b: 245 },
    labelAlpha: 0.8,
    labelHoverColor: { r: 255, g: 255, b: 255 },
    labelHoverAlpha: 1,
    labelHoverGlow: 2.6,
    labelHoverHalo: 0.22,
    labelShineSpeed: 0.9,
    labelShineStrength: 0.35,
    snakeColors: [
      { r: 255, g: 60, b: 48 },
      { r: 255, g: 165, b: 230 },
      { r: 64, g: 230, b: 255 },
      { r: 255, g: 176, b: 72 },
    ],
    snakeSpeed: 13,
    speedVariance: 0.3,
    readingSpeedScale: 0.35,
    startLength: 5,
    growPerFood: 3,
    maxLength: 80,
    respawnMs: 1500,
    tailFade: 0.45,
    wanderChanceSlow: 0.01,
    wanderChanceFast: 0.2,
    safetySpace: 64,
    foodColor: { r: 250, g: 204, b: 21 },
    foodTarget: 26,
    foodSpawnMs: 420,
    foodMax: 420,
    corpseLingerMs: 5200,
    corpseFadeMs: 900,
    burstCountMin: 4,
    burstCountMax: 10,
    burstSpeed: 30,
    burstDrag: 0.02,
    burstLifeMs: 380,
    burstTrail: 0.35,
    burstFlash: 3,
    panelBorderY: 3,
    panelBorderX: 6,
    panelGrow: 0.2,
    panelColor: { r: 255, g: 255, b: 255 },
    /** The color a cell flares to on the way up, whatever it settles on */
    panelIgniteColor: { r: 255, g: 255, b: 255 },
    panelIgniteMs: 240,
    panelSweepMs: 700,
    panelSweepJitter: 0.12,
    panelFlash: 3,
    panelGlow: 2.5,
    extrude: true,
    extrudeDepth: 0.25,
    extrudeLeanX: -0.45,
    extrudeLeanY: -0.32,
    extrudeCameraDist: 1.4,
    extrudeVanishX: 1.1,
    extrudeVanishY: 1.15,
    extrudeHeights: {
      wall: 0.5,
      label: 1.3,
      labelHover: 1.5,
      food: 0.8,
      snake: 1,
      snakeHead: 1.15,
      spark: 2,
    },
    extrudeSideShade: 0.82,
    extrudeAmbient: 34,
    extrudeLight: { x: 1, y: 0.5 },
    bloom: true,
    bloomStrength: 0.12,
    bloomSpread: 0.3,
    bloomBrightnessFloor: 50,
  };

  const cfg = { ...defaults, ...file, ...overrides };
  // Heights are a nested block, so a config naming only one of them still gets
  // the defaults for the rest
  cfg.extrudeHeights = {
    ...defaults.extrudeHeights,
    ...(file.extrudeHeights || {}),
    ...(overrides.extrudeHeights || {}),
  };
  return cfg;
}

/** Which way each side of a block points, in screen axes */
const FACE_NORMALS = {
  north: [0, -1],
  west: [-1, 0],
  east: [1, 0],
  south: [0, 1],
};
const FACE_ORDER = ["north", "west", "east", "south"];

/** A face thinner than this is not worth a fill */
const FACE_MIN_PX = 0.25;

/** Scratch for the two sides of a block the viewer can see, and their light */
const sideKeys = ["", ""];
const tint = [0, 0, 0];

function createLedWall(canvas, options = {}) {
  const cfg = mergeConfig(options);
  const onSelect = options.onSelect || (() => {});
  /** Fired once the middle has finished coming up as the page */
  const onPanelOpen = options.onPanelOpen || (() => {});
  /** Fired the moment a close starts, before the wall comes back */
  const onPanelClose = options.onPanelClose || (() => {});
  /** Fired when the page area moves, e.g. the window resized */
  const onPanelResize = options.onPanelResize || (() => {});

  const ctx = canvas.getContext("2d", { alpha: false });

  let cols = 0;
  let rows = 0;
  let cellSize = 0;
  let gap = 0;
  let offsetX = 0;
  let offsetY = 0;
  let pitch = 0;
  let cellCount = 0;
  /** The LED inside its cell, and the gap it leaves on each side */
  let insetPx = 0;
  let ledPx = 0;

  // --- Perspective ---
  /** The spot the viewer is standing at, in canvas pixels */
  let vpX = 0;
  let vpY = 0;
  /** Screen scale a block of height 1 gains: face = base scaled away from the
   *  vanishing point, which is all the perspective this needs */
  let extrudeK = 0;
  /** Pixels a block of height 1 leans, so a block still reads as standing
   *  even where it sits right under the viewer */
  let leanX = 0;
  let leanY = 0;
  /** What each side of a block keeps of its own light, and catches of the
   *  room's, worked out from where the light is standing */
  const faceLight = {};
  /** The dark wall is fixed geometry, so it is drawn once and blitted */
  let wallSheet = null;
  let wallSheetCtx = null;

  /** 1 where a label glyph blocks the wall */
  let obstacle = new Uint8Array(0);
  /** 1 inside a letter's own block — snakes may cross it, dots may not land */
  let letterBlock = new Uint8Array(0);
  /** 1 where the page has taken the wall over, penning the snakes into the border */
  let panelMask = new Uint8Array(0);
  /** snake id + 1 per cell, 0 when free */
  let occupancy = new Int16Array(0);
  /** Flat rgba frame buffer so color is computed once per cell per frame */
  let frameBuf = new Float32Array(0);
  /** Per-cell bloom multiplier, so a hovered label can glow harder */
  let glowBuf = new Float32Array(0);
  /** How far each cell's block stands off the wall */
  let heightBuf = new Float32Array(0);
  /** Lit cells of the current frame, sorted back to front before they are drawn */
  let litList = new Int32Array(0);
  /** How near each cell sits to the viewer, which is the order they paint in */
  let depthBuf = new Float32Array(0);
  /** 1 where a cell differs from the plain off color (lets dark LEDs batch) */
  let lit = new Uint8Array(0);

  /** Cell -> expiry time in ms (0 = stays until eaten) */
  /** @type {Map<number, number>} */
  const food = new Map();
  /** Dots mid-flight out of a click, before they settle onto the wall */
  /** @type {Array<object>} */
  let sparks = [];
  /** @type {Array<object>} */
  let snakes = [];
  /** @type {Array<object>} */
  let labelDefs = [];
  /** @type {Array<object>} */
  let labels = [];
  /** @type {Array<object>} */
  let mosaicDefs = [];
  /** @type {Array<object>} */
  let mosaics = [];

  // Breadth-first search scratch buffers (reused every step)
  let bfsStamp = new Int32Array(0);
  let bfsParent = new Int32Array(0);
  let bfsQueue = new Int32Array(0);
  let bfsGen = 0;

  let hoverLabel = null;
  let hoverMosaic = null;
  /** "closed" | "opening" | "open" | "closing" */
  const page = {
    state: "closed",
    label: null,
    rect: null,
    startedAt: 0,
    color: null,
  };
  let lastFoodAt = 0;
  /** Eased multiplier on every snake's speed, dropped while a page is open */
  let speedScale = 1;
  let raf = 0;
  let lastNow = 0;
  let timeMs = 0;
  /** Set while the sim is stopped, e.g. a phone page covering the whole wall */
  let paused = false;

  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  function idx(c, r) {
    return r * cols + c;
  }

  function colOf(i) {
    return i % cols;
  }

  function rowOf(i) {
    return (i - (i % cols)) / cols;
  }

  function inBounds(c, r) {
    return c >= 0 && r >= 0 && c < cols && r < rows;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // --- Labels -------------------------------------------------------------

  /**
   * Register a label. Position is a 0-1 anchor of its center on the wall, so
   * items can be scattered rather than aligned in a column.
   */
  function addLabel(text, opts = {}) {
    const def = {
      text: String(text).toUpperCase(),
      id: opts.id || String(text).toUpperCase(),
      href: opts.href || null,
      anchorX: opts.anchorX ?? 0.5,
      anchorY: opts.anchorY ?? 0.5,
      clickable: opts.clickable !== false,
      beside: opts.beside || null,
      side: opts.side || "right",
      hidden: !!opts.hidden,
    };
    labelDefs.push(def);
    layoutLabels();
    return def;
  }

  /**
   * Stamp the pixel-art bust onto the wall. Snakes path around the lit cells
   * the same way they do a word. `pageId` is which page a click opens; the
   * face is its own button and does not share hover with that word. The
   * anchor is where the face lands, not the top-left of the sprite.
   */
  function addMosaic(opts = {}) {
    const def = {
      id: opts.id || "portrait",
      pageId: opts.pageId || opts.linkId || null,
      anchorX: opts.anchorX ?? 0.5,
      anchorY: opts.anchorY ?? 0.5,
    };
    mosaicDefs.push(def);
    layoutLabels();
    return def;
  }

  function clearLabels() {
    labelDefs = [];
    labels = [];
    mosaicDefs = [];
    mosaics = [];
    obstacle.fill(0);
    letterBlock.fill(0);
  }

  function stampGlyphScaled(ch, ox, oy, metrics, scale, cells) {
    const g = metrics.glyphs[ch] || metrics.glyphs["?"];
    for (let gy = 0; gy < metrics.h; gy++) {
      for (let gx = 0; gx < metrics.w; gx++) {
        if (g[gy][gx] !== "1") continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const c = ox + gx * scale + sx;
            const r = oy + gy * scale + sy;
            if (!inBounds(c, r)) continue;
            const i = idx(c, r);
            obstacle[i] = 1;
            cells.push(i);
          }
        }
      }
    }
  }

  /**
   * Reserve a letter's whole bounding box, holes included, so no dot ever
   * lands inside an O or between the arms of an E. Snakes still walk it.
   */
  function stampLetterBlock(ox, oy, glyphW, glyphH) {
    for (let r = oy; r < oy + glyphH; r++) {
      for (let c = ox; c < ox + glyphW; c++) {
        if (inBounds(c, r)) letterBlock[idx(c, r)] = 1;
      }
    }
  }

  /** LEDs the longest registered word takes up, gaps between letters included */
  function widestLabel() {
    const metrics = fontMetrics(cfg.font);
    const glyphW = metrics.w * Math.max(1, cfg.labelScale | 0);
    const letterGap = Math.max(1, cfg.letterGap | 0);
    let widest = 0;
    for (const def of labelDefs) {
      if (def.hidden) continue;
      const n = [...def.text].length;
      widest = Math.max(widest, n * glyphW + Math.max(0, n - 1) * letterGap);
    }
    return widest;
  }

  /** Empty LEDs between two boxes along their most separated axis */
  function boxSeparation(a, b) {
    const gapX = Math.max(a.x0 - b.x1 - 1, b.x0 - a.x1 - 1);
    const gapY = Math.max(a.y0 - b.y1 - 1, b.y0 - a.y1 - 1);
    return Math.max(gapX, gapY);
  }

  /**
   * Nearest spot to (wantX, wantY) where a textW x textH box keeps `margin`
   * empty LEDs between itself and every box already placed. Nudges vertically
   * before sideways, so a label stays roughly under its anchor. On a cramped
   * wall the spacing is relaxed step by step rather than letting labels land
   * on top of each other.
   */
  function findLabelSpot(wantX, wantY, textW, textH, placed, margin, bounds) {
    const minX = bounds.x0;
    const minY = bounds.y0;
    const maxX = Math.max(minX, bounds.x1 - textW + 1);
    const maxY = Math.max(minY, bounds.y1 - textH + 1);
    const reach = Math.max(cols, rows);

    function collides(x, y, m) {
      for (const p of placed) {
        if (
          x - m <= p.x1 &&
          x + textW - 1 + m >= p.x0 &&
          y - m <= p.y1 &&
          y + textH - 1 + m >= p.y0
        ) {
          return true;
        }
      }
      return false;
    }

    for (let m = margin; m >= 0; m--) {
      for (let d = 0; d <= reach; d++) {
        const shifts =
          d === 0
            ? [[0, 0]]
            : [
                [0, d],
                [0, -d],
                [d, 0],
                [-d, 0],
                [d, d],
                [-d, d],
                [d, -d],
                [-d, -d],
              ];
        for (const [dx, dy] of shifts) {
          const x = clamp(wantX + dx, minX, maxX);
          const y = clamp(wantY + dy, minY, maxY);
          if (!collides(x, y, m)) return { x, y };
        }
      }
    }
    return { x: clamp(wantX, minX, maxX), y: clamp(wantY, minY, maxY) };
  }

  /**
   * Words live in the same region the page will cover, so a big monitor that
   * grows the snake lane also pulls the cluster into the middle.
   */
  function clusterBounds() {
    const rect = computePanelRect();
    return { x0: rect.c0, y0: rect.r0, x1: rect.c1, y1: rect.r1 };
  }

  /**
   * The sprite as a grid of colors, each pixel blown up by `portraitScale` and
   * the scale capped so the bust still leaves the words room around it.
   */
  function portraitInk(ch) {
    if (ch === ".") return null;
    if (ch === "H") return cfg.portraitHair || PORTRAIT_PALETTE.H;
    if (ch === "G") return cfg.portraitGlasses || PORTRAIT_PALETTE.G;
    if (ch === "M") return cfg.portraitMouth || PORTRAIT_PALETTE.M;
    if (ch === "C") return cfg.portraitShirt || PORTRAIT_PALETTE.C;
    return PORTRAIT_PALETTE[ch] || null;
  }

  function portraitSprite(bounds) {
    const sw = PORTRAIT_SPRITE[0].length;
    const sh = PORTRAIT_SPRITE.length;
    const fitX = Math.floor(((bounds.x1 - bounds.x0 + 1) * 0.42) / sw);
    const fitY = Math.floor(((bounds.y1 - bounds.y0 + 1) * 0.62) / sh);
    const scale = Math.max(1, Math.min(cfg.portraitScale | 0, fitX, fitY));
    const w = sw * scale;
    const h = sh * scale;
    const pixels = new Array(w * h).fill(null);

    for (let y = 0; y < sh; y++) {
      const row = PORTRAIT_SPRITE[y];
      for (let x = 0; x < sw; x++) {
        const col = portraitInk(row[x]);
        if (!col) continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            pixels[(y * scale + sy) * w + x * scale + sx] = col;
          }
        }
      }
    }

    return {
      pixels,
      w,
      h,
      // Where the anchor should land: the middle of the head, so the shoulders
      // hanging below it do not push the eyes off center
      faceX: (sw * scale - 1) / 2,
      faceY: (PORTRAIT_FACE_ROWS * scale - 1) / 2,
    };
  }

  function wantSpot(def, w, h, boxes, bounds) {
    if (def.beside) {
      const host = boxes.find((b) => b.id === def.beside);
      if (host) {
        const gap = Math.max(cfg.labelMargin | 0, 2);
        const hostH = host.y1 - host.y0 + 1;
        const y = host.y0 + Math.round((hostH - h) / 2);
        if (def.side === "left") {
          return { x: host.x0 - gap - w, y };
        }
        if (def.side === "below") {
          return {
            x: host.x0 + Math.round((host.x1 - host.x0 + 1 - w) / 2),
            y: host.y1 + gap + 1,
          };
        }
        return { x: host.x1 + gap + 1, y };
      }
    }
    const spanX = bounds.x1 - bounds.x0 + 1;
    const spanY = bounds.y1 - bounds.y0 + 1;
    return {
      x: Math.round(bounds.x0 + def.anchorX * spanX - w / 2),
      y: Math.round(bounds.y0 + def.anchorY * spanY - h / 2),
    };
  }

  function layoutLabels() {
    if (!cols || !rows) return;
    obstacle.fill(0);
    letterBlock.fill(0);
    labels = [];
    mosaics = [];

    const metrics = fontMetrics(cfg.font);
    const scale = Math.max(1, cfg.labelScale | 0);
    const glyphW = metrics.w * scale;
    const glyphH = metrics.h * scale;
    const letterGap = Math.max(1, cfg.letterGap | 0);
    const pad = Math.max(0, cfg.labelHitPadding | 0);
    // Hit boxes need clearance too, or one hover would claim two labels
    const margin = Math.max(cfg.labelMargin | 0, pad * 2 + 1);
    const bounds = clusterBounds();
    const boxes = [];

    // The face goes down first and does not move: it is what the wall is
    // centered on, and the words are the ones that step aside for it.
    for (const def of mosaicDefs) {
      const sprite = portraitSprite(bounds);
      const spanX = bounds.x1 - bounds.x0 + 1;
      const spanY = bounds.y1 - bounds.y0 + 1;
      const spot = {
        x: clamp(
          Math.round(bounds.x0 + def.anchorX * spanX - sprite.faceX),
          bounds.x0,
          Math.max(bounds.x0, bounds.x1 - sprite.w + 1)
        ),
        y: clamp(
          Math.round(bounds.y0 + def.anchorY * spanY - sprite.faceY),
          bounds.y0,
          Math.max(bounds.y0, bounds.y1 - sprite.h + 1)
        ),
      };
      const box = {
        id: def.id,
        x0: spot.x,
        y0: spot.y,
        x1: spot.x + sprite.w - 1,
        y1: spot.y + sprite.h - 1,
      };
      boxes.push(box);

      const cells = [];
      for (let y = 0; y < sprite.h; y++) {
        for (let x = 0; x < sprite.w; x++) {
          const px = sprite.pixels[y * sprite.w + x];
          if (!px) continue;
          const c = spot.x + x;
          const r = spot.y + y;
          if (!inBounds(c, r)) continue;
          const i = idx(c, r);
          obstacle[i] = 1;
          letterBlock[i] = 1;
          cells.push({ i, r: px.r, g: px.g, b: px.b });
        }
      }
      mosaics.push({
        id: def.id,
        pageId: def.pageId,
        cells,
        box,
        hit: new Set(cells.map((cell) => cell.i)),
        halo: [],
      });
    }

    for (const def of labelDefs) {
      if (def.hidden) continue;
      const chars = [...def.text];
      const textW = chars.length * glyphW + Math.max(0, chars.length - 1) * letterGap;
      const textH = glyphH;
      const want = wantSpot(def, textW, textH, boxes, bounds);
      const spot = findLabelSpot(want.x, want.y, textW, textH, boxes, margin, bounds);
      const box = {
        id: def.id,
        x0: spot.x,
        y0: spot.y,
        x1: spot.x + textW - 1,
        y1: spot.y + textH - 1,
      };
      boxes.push(box);

      const cells = [];
      let tx = spot.x;
      for (const ch of chars) {
        stampGlyphScaled(ch, tx, spot.y, metrics, scale, cells);
        // A blank carries no block, so dots may still sit in a word's spaces
        if (ch !== " ") stampLetterBlock(tx, spot.y, glyphW, glyphH);
        tx += glyphW + letterGap;
      }

      labels.push({
        id: def.id,
        text: def.text,
        href: def.href,
        clickable: def.clickable !== false,
        cells,
        box,
      });
    }

    // Grow each hover area into the room its neighbours actually left it
    for (const label of labels) {
      if (!label.clickable) {
        label.hit = { ...label.box };
        label.halo = [];
        continue;
      }
      let room = pad;
      for (const other of boxes) {
        if (other.id === label.id) continue;
        room = Math.min(room, boxSeparation(label.box, other) >> 1);
      }
      const p = Math.max(0, room);
      label.hit = {
        x0: label.box.x0 - p,
        y0: label.box.y0 - p,
        x1: label.box.x1 + p,
        y1: label.box.y1 + p,
      };
      label.halo = buildHalo(label.cells, Math.max(1, p));
    }

    for (const mosaic of mosaics) {
      if (!mosaic.pageId) continue;
      let room = pad;
      for (const other of boxes) {
        if (other.id === mosaic.id) continue;
        room = Math.min(room, boxSeparation(mosaic.box, other) >> 1);
      }
      mosaic.halo = buildHalo(
        mosaic.cells.map((cell) => cell.i),
        Math.max(1, Math.max(0, room))
      );
    }

    // A label may have landed on top of dots that were already lying there
    for (const i of food.keys()) {
      if (obstacle[i] || letterBlock[i]) food.delete(i);
    }
  }

  /**
   * Rings of LEDs hugging a word, each with its own falloff. Lit only while
   * the word is hovered, which is what makes the highlight read as a glow
   * rather than just brighter letters.
   */
  function buildHalo(cells, radius) {
    const seen = new Set(cells);
    const halo = [];
    let frontier = cells;

    for (let d = 1; d <= radius; d++) {
      const strength = Math.pow(0.45, d - 1);
      const next = [];
      for (const i of frontier) {
        const c0 = colOf(i);
        const r0 = rowOf(i);
        for (const [dc, dr] of DIRS) {
          const c = c0 + dc;
          const r = r0 + dr;
          if (!inBounds(c, r)) continue;
          const ni = idx(c, r);
          if (seen.has(ni)) continue;
          seen.add(ni);
          // Do not bleed the halo through a neighbouring word
          if (obstacle[ni]) continue;
          next.push(ni);
          halo.push({ i: ni, strength });
        }
      }
      frontier = next;
    }
    return halo;
  }

  function mosaicAt(c, r, i) {
    for (const mosaic of mosaics) {
      if (!mosaic.pageId) continue;
      if (page.state !== "closed" && overlapsPanel(mosaic.box)) continue;
      const b = mosaic.box;
      if (c < b.x0 || c > b.x1 || r < b.y0 || r > b.y1) continue;
      if (!mosaic.hit.has(i == null ? idx(c, r) : i)) continue;
      return mosaic;
    }
    return null;
  }

  function labelAt(c, r) {
    for (const label of labels) {
      if (label.clickable === false) continue;
      // A word under the page is not there to be clicked
      if (page.state !== "closed" && overlapsPanel(label.box)) continue;
      const h = label.hit;
      if (c >= h.x0 && c <= h.x1 && r >= h.y0 && r <= h.y1) return label;
    }
    return null;
  }

  // --- Page panel ---------------------------------------------------------

  /**
   * The wall keeps a border of LEDs around the page. Snakes are penned into
   * that border while a page is open, so the sim keeps running around it.
   */
  function computePanelRect() {
    // A border of 0 is honoured, so a phone can take the whole wall. Anything
    // wider is still capped to what the wall can spare.
    const minBx = cfg.panelBorderX | 0;
    const minBy = cfg.panelBorderY | 0;
    const spareX = Math.max(1, ((cols - 10) / 2) | 0);
    const spareY = Math.max(1, ((rows - 8) / 2) | 0);
    const bx = scaledPanelBorder(minBx, spareX, cols * pitch, 1280);
    const by = scaledPanelBorder(minBy, spareY, rows * pitch, 800);
    return {
      c0: bx,
      r0: by,
      c1: cols - 1 - bx,
      r1: rows - 1 - by,
    };
  }

  /**
   * 6 and 3 look right on a laptop. Extra wall beyond that size mostly stays
   * as snake lane, so the page does not become a billboard on a 4K.
   */
  function scaledPanelBorder(min, spare, wallPx, refPx) {
    if (min <= 0) return 0;
    const grow = cfg.panelGrow == null ? 0.2 : clamp(+cfg.panelGrow, 0, 1);
    const extra = Math.round((Math.max(0, wallPx - refPx) * (1 - grow)) / 2 / Math.max(1, pitch));
    return clamp(min + extra, 0, spare);
  }

  function overlapsPanel(box) {
    const rect = page.rect;
    if (!rect) return false;
    return (
      box.x0 <= rect.c1 && box.x1 >= rect.c0 && box.y0 <= rect.r1 && box.y1 >= rect.r0
    );
  }

  /** Pixel box of the page area, for whatever DOM the host puts on top */
  function panelPixelRect() {
    const rect = page.rect || computePanelRect();
    return {
      x: offsetX + rect.c0 * pitch,
      y: offsetY + rect.r0 * pitch,
      width: (rect.c1 - rect.c0 + 1) * pitch,
      height: (rect.r1 - rect.r0 + 1) * pitch,
    };
  }

  function paintPanelMask(on) {
    panelMask.fill(0);
    if (!on || !page.rect) return;
    const rect = page.rect;
    for (let r = rect.r0; r <= rect.r1; r++) {
      for (let c = rect.c0; c <= rect.c1; c++) {
        const i = idx(c, r);
        panelMask[i] = 1;
        food.delete(i);
      }
    }
  }

  /** Where a cell sits in the diagonal sweep, 0 at the top-left corner */
  function panelDelay(c, r) {
    const rect = page.rect;
    const span = Math.max(1, rect.c1 - rect.c0 + (rect.r1 - rect.r0));
    const wave = (c - rect.c0 + (r - rect.r0)) / span;
    // Hashed off the cell, so the leading edge is ragged rather than a ruled
    // diagonal and still sits in the same place from frame to frame
    const jitter = (((idx(c, r) * 2654435761) >>> 24) / 255 - 0.5) * cfg.panelSweepJitter;
    return clamp(wave + jitter, 0, 1);
  }

  function parseColor(input) {
    if (!input) return { ...cfg.panelColor };
    if (typeof input === "object" && input.r != null) {
      return { r: input.r | 0, g: input.g | 0, b: input.b | 0 };
    }
    if (typeof input === "string") {
      const hex = input.replace("#", "");
      if (hex.length === 6 && !Number.isNaN(parseInt(hex, 16))) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }
    return { ...cfg.panelColor };
  }

  function panelFillColor() {
    return page.color || cfg.panelColor;
  }

  /**
   * A page that settles dark still has to come up bright, or the sweep has no
   * flare to show and the wall around it never lights.
   */
  function panelIgniteColor() {
    return cfg.panelIgniteColor || panelFillColor();
  }

  /** 0 = still a diode, 1 = up at full page white */
  function panelProgress(c, r) {
    if (page.state === "open") return 1;
    if (page.state === "closed") return 0;
    const elapsed = timeMs - page.startedAt - panelDelay(c, r) * cfg.panelSweepMs;
    const up = clamp(elapsed / Math.max(1, cfg.panelIgniteMs), 0, 1);
    return page.state === "closing" ? 1 - up : up;
  }

  /** How far the sweep has crossed the panel as a whole */
  function panelLift() {
    if (page.state === "open") return 1;
    if (page.state === "closed") return 0;
    const t = clamp((timeMs - page.startedAt) / panelDurationMs(), 0, 1);
    return page.state === "closing" ? 1 - t : t;
  }

  function panelDurationMs() {
    // The last cell in the sweep still has its own ramp to run
    return cfg.panelSweepMs + cfg.panelIgniteMs;
  }

  function openPanel(label, color) {
    if (page.state !== "closed") return false;
    page.label = label || null;
    page.rect = computePanelRect();
    page.color = parseColor(color);
    page.state = "opening";
    page.startedAt = timeMs;
    hoverLabel = null;
    hoverMosaic = null;
    canvas.style.cursor = "default";
    // Snakes are shut out right away, so they walk themselves into the border
    // while the wave is still sweeping across the middle
    paintPanelMask(true);
    return true;
  }

  /**
   * Replay the ignite sweep onto a new fill while the page is already open.
   * The host should hide its overlay first so the diodes can be seen again.
   */
  function recolorPanel(color) {
    if (page.state !== "open") return false;
    page.color = parseColor(color);
    page.state = "opening";
    page.startedAt = timeMs;
    return true;
  }

  function closePanel() {
    if (page.state !== "open" && page.state !== "opening") return false;
    onPanelClose(page.label);
    page.state = "closing";
    page.startedAt = timeMs;
    return true;
  }

  function updatePanel() {
    if (page.state === "opening" && timeMs - page.startedAt >= panelDurationMs()) {
      page.state = "open";
      onPanelOpen(page.label, panelPixelRect());
    } else if (page.state === "closing" && timeMs - page.startedAt >= panelDurationMs()) {
      page.state = "closed";
      page.label = null;
      page.rect = null;
      page.color = null;
      paintPanelMask(false);
    }
  }

  // --- Simulation ---------------------------------------------------------

  /** Label glyphs and the open page are both walls as far as the sim cares */
  function blocked(i) {
    return obstacle[i] === 1 || panelMask[i] === 1;
  }

  function isFree(i) {
    return !blocked(i) && occupancy[i] === 0;
  }

  function randomFreeCell() {
    for (let tries = 0; tries < 400; tries++) {
      const i = (Math.random() * cellCount) | 0;
      if (isFree(i) && !food.has(i)) return i;
    }
    return -1;
  }

  /** Like randomFreeCell, but keeps out of the letters themselves */
  function randomDotCell() {
    for (let tries = 0; tries < 400; tries++) {
      const i = (Math.random() * cellCount) | 0;
      if (isFree(i) && !letterBlock[i] && !food.has(i)) return i;
    }
    return -1;
  }

  /** `expiresAt` of 0 means the dot waits forever to be eaten */
  function addFood(i, expiresAt = 0) {
    if (i < 0 || blocked(i) || letterBlock[i]) return;
    if (food.size >= cfg.foodMax) return;
    food.set(i, expiresAt);
  }

  // --- Click bursts -------------------------------------------------------

  /**
   * Clicking bare wall throws a handful of sparks out of that LED. They fly
   * on sub-cell positions but light whole diodes, drag themselves to a stop,
   * and then settle as ordinary dots for the snakes to come and eat.
   */
  function spawnBurst(c, r) {
    // Size varies click to click, so no two pops are the same handful
    const lo = Math.max(1, cfg.burstCountMin | 0);
    const hi = Math.max(lo, cfg.burstCountMax | 0);
    const count = lo + ((Math.random() * (hi - lo + 1)) | 0);
    // Whole fan is rotated per click, so two bursts never land the same way
    const turn = Math.random() * Math.PI * 2;
    for (let n = 0; n < count; n++) {
      const angle = turn + (n / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const speed = cfg.burstSpeed * (0.4 + Math.random() * 0.6);
      sparks.push({
        c: c + 0.5,
        r: r + 0.5,
        pc: c + 0.5,
        pr: r + 0.5,
        vc: Math.cos(angle) * speed,
        vr: Math.sin(angle) * speed,
        age: 0,
        life: (cfg.burstLifeMs / 1000) * (0.7 + Math.random() * 0.6),
      });
    }
  }

  /**
   * Nearest LED to a landing spark that can hold a dot, searched ring by ring
   * so a spark that came down on a letter or on another dot steps aside
   * instead of being thrown away.
   */
  function settleCell(c0, r0, allowOccupied) {
    for (let d = 0; d <= 6; d++) {
      const ring = [];
      for (let r = r0 - d; r <= r0 + d; r++) {
        for (let c = c0 - d; c <= c0 + d; c++) {
          if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== d) continue;
          if (!inBounds(c, r)) continue;
          const i = idx(c, r);
          if (blocked(i) || letterBlock[i] || food.has(i)) continue;
          if (!allowOccupied && occupancy[i] !== 0) continue;
          ring.push(i);
        }
      }
      if (ring.length) return ring[(Math.random() * ring.length) | 0];
    }
    return -1;
  }

  function landSpark(s) {
    const c = clamp(Math.floor(s.c), 0, cols - 1);
    const r = clamp(Math.floor(s.r), 0, rows - 1);
    // A cell with a snake on it will do if nothing clear is within reach: the
    // dot just waits under the body until a head comes back over it
    const i = settleCell(c, r, false);
    addFood(i >= 0 ? i : settleCell(c, r, true));
  }

  function updateSparks(dt) {
    if (!sparks.length) return;
    const keep = Math.pow(clamp(cfg.burstDrag, 0.0001, 0.999), dt);
    for (let n = sparks.length - 1; n >= 0; n--) {
      const s = sparks[n];
      s.pc = s.c;
      s.pr = s.r;
      s.c += s.vc * dt;
      s.r += s.vr * dt;
      s.vc *= keep;
      s.vr *= keep;
      // The wall is the whole world, so the edges throw a spark back in
      if (s.c < 0.5 || s.c > cols - 0.5) {
        s.c = clamp(s.c, 0.5, cols - 0.5);
        s.vc = -s.vc * 0.4;
      }
      if (s.r < 0.5 || s.r > rows - 0.5) {
        s.r = clamp(s.r, 0.5, rows - 0.5);
        s.vr = -s.vr * 0.4;
      }
      s.age += dt;
      if (s.age >= s.life) {
        landSpark(s);
        sparks.splice(n, 1);
      }
    }
  }

  function spawnSnake(snake, now) {
    // Prefer a straight open run so a fresh snake has somewhere to go
    for (let tries = 0; tries < 200; tries++) {
      const head = randomFreeCell();
      if (head < 0) continue;
      const [dx, dy] = DIRS[(Math.random() * DIRS.length) | 0];
      const body = [];
      let c = colOf(head);
      let r = rowOf(head);
      let ok = true;
      for (let n = 0; n < cfg.startLength; n++) {
        if (!inBounds(c, r)) {
          ok = false;
          break;
        }
        const i = idx(c, r);
        if (!isFree(i)) {
          ok = false;
          break;
        }
        body.push(i);
        // Body trails behind the head, so walk opposite the facing direction
        c -= dx;
        r -= dy;
      }
      if (!ok) continue;

      snake.body = body;
      for (const i of body) occupancy[i] = snake.id + 1;
      snake.grow = 0;
      snake.alive = true;
      snake.accum = 0;
      snake.deadAt = 0;
      return true;
    }
    // Wall is packed; try again on a later frame
    snake.deadAt = now;
    return false;
  }

  function killSnake(snake, now) {
    // The corpse rots inward: head and tail dots go first, the middle keeps
    // the full linger, so an uneaten body shrinks toward its center.
    const len = snake.body.length;
    const half = Math.max(1, (len - 1) / 2);
    for (let n = 0; n < len; n++) {
      const i = snake.body[n];
      occupancy[i] = 0;
      const fromMiddle = Math.abs(n - (len - 1) / 2) / half;
      addFood(i, now + cfg.corpseFadeMs + cfg.corpseLingerMs * (1 - fromMiddle));
    }
    snake.body = [];
    snake.alive = false;
    snake.grow = 0;
    snake.deadAt = now;
  }

  /** A snake may enter its own last segment, which vacates as it moves */
  function tailWillVacate(snake, i) {
    if (snake.grow > 0 || snake.body.length === 0) return false;
    return snake.body[snake.body.length - 1] === i;
  }

  function passable(i, snake) {
    if (blocked(i)) return false;
    if (occupancy[i] === 0) return true;
    return occupancy[i] === snake.id + 1 && tailWillVacate(snake, i);
  }

  /** First step of the shortest path from the head to the nearest dot */
  function planPath(snake) {
    const head = snake.body[0];
    bfsGen++;
    let qh = 0;
    let qt = 0;
    bfsQueue[qt++] = head;
    bfsStamp[head] = bfsGen;
    bfsParent[head] = -1;

    let target = -1;
    const spin = (Math.random() * DIRS.length) | 0;

    while (qh < qt) {
      const cur = bfsQueue[qh++];
      if (cur !== head && food.has(cur)) {
        target = cur;
        break;
      }
      const cc = colOf(cur);
      const cr = rowOf(cur);
      for (let d = 0; d < DIRS.length; d++) {
        // Rotate neighbour order so equal-length paths vary run to run
        const [dx, dy] = DIRS[(d + spin) % DIRS.length];
        const nc = cc + dx;
        const nr = cr + dy;
        if (!inBounds(nc, nr)) continue;
        const ni = idx(nc, nr);
        if (bfsStamp[ni] === bfsGen) continue;
        if (!passable(ni, snake)) continue;
        bfsStamp[ni] = bfsGen;
        bfsParent[ni] = cur;
        bfsQueue[qt++] = ni;
      }
    }

    if (target < 0) return -1;
    let step = target;
    while (bfsParent[step] !== head && bfsParent[step] !== -1) {
      step = bfsParent[step];
    }
    return step;
  }

  function safeNeighbours(snake) {
    const head = snake.body[0];
    const hc = colOf(head);
    const hr = rowOf(head);
    const out = [];
    for (const [dx, dy] of DIRS) {
      const nc = hc + dx;
      const nr = hr + dy;
      if (!inBounds(nc, nr)) continue;
      const ni = idx(nc, nr);
      if (passable(ni, snake)) out.push(ni);
    }
    return out;
  }

  /**
   * Free LEDs reachable from `start`, counting stops at `limit`. A pocket
   * smaller than the snake is a dead end with extra steps, so this is how a
   * snake tells a corridor from a trap.
   */
  function openSpace(start, snake, limit) {
    bfsGen++;
    let qh = 0;
    let qt = 0;
    bfsQueue[qt++] = start;
    bfsStamp[start] = bfsGen;
    let seen = 0;

    while (qh < qt) {
      const cur = bfsQueue[qh++];
      if (++seen >= limit) return seen;
      const cc = colOf(cur);
      const cr = rowOf(cur);
      for (const [dx, dy] of DIRS) {
        const nc = cc + dx;
        const nr = cr + dy;
        if (!inBounds(nc, nr)) continue;
        const ni = idx(nc, nr);
        if (bfsStamp[ni] === bfsGen) continue;
        if (!passable(ni, snake)) continue;
        bfsStamp[ni] = bfsGen;
        bfsQueue[qt++] = ni;
      }
    }
    return seen;
  }

  /** Room a snake insists on seeing before it commits to a step */
  function spaceNeeded(snake) {
    return Math.min(snake.body.length + 2, Math.max(4, cfg.safetySpace));
  }

  /** The steps that leave the snake enough room to fit its whole body */
  function survivableSteps(snake, options) {
    const need = spaceNeeded(snake);
    const out = [];
    for (const i of options) {
      if (openSpace(i, snake, need) >= need) out.push(i);
    }
    return out;
  }

  /** Fallback when nothing is comfortable: whichever step has the most room */
  function roomiestStep(snake, options) {
    const need = spaceNeeded(snake);
    let best = -1;
    let bestSpace = -1;
    for (const i of options) {
      const space = openSpace(i, snake, need);
      // Coin flip on ties, otherwise every snake would lean the same way
      if (space > bestSpace || (space === bestSpace && Math.random() < 0.5)) {
        bestSpace = space;
        best = i;
      }
    }
    return best;
  }

  /**
   * Survival outranks food. A snake picks from the steps that keep it alive
   * and only walks into a pocket when every option is a pocket, so the only
   * way it eats itself is a genuine dead end.
   */
  function chooseStep(snake, options) {
    if (!options.length) return -1;

    const safe = survivableSteps(snake, options);
    if (!safe.length) return roomiestStep(snake, options);

    if (Math.random() < snake.wanderChance) {
      return safe[(Math.random() * safe.length) | 0];
    }

    const planned = planPath(snake);
    if (planned >= 0 && safe.includes(planned)) return planned;
    // The nearest dot is only reachable through a trap: keep the room instead
    return roomiestStep(snake, safe);
  }

  function stepSnake(snake, now) {
    const options = safeNeighbours(snake);
    const next = chooseStep(snake, options);

    if (next < 0) {
      // Boxed in with nowhere legal to go
      killSnake(snake, now);
      return;
    }

    // Running into anyone (including itself) ends this snake
    const blockedBySnake =
      occupancy[next] !== 0 && !tailWillVacate(snake, next);
    if (blocked(next) || blockedBySnake) {
      killSnake(snake, now);
      return;
    }

    const ate = food.delete(next);
    if (ate && snake.body.length + snake.grow < cfg.maxLength) {
      snake.grow += cfg.growPerFood;
    }

    snake.body.unshift(next);
    occupancy[next] = snake.id + 1;

    if (snake.grow > 0) {
      snake.grow--;
    } else {
      const tail = snake.body.pop();
      if (occupancy[tail] === snake.id + 1) occupancy[tail] = 0;
    }
  }

  function updateSim(dt, now) {
    // Reading mode: the wall keeps playing around the page, but slowly enough
    // that it is movement in the corner of the eye rather than a distraction
    const target = page.state === "closed" ? 1 : clamp(cfg.readingSpeedScale, 0.05, 1);
    speedScale += (target - speedScale) * Math.min(1, dt * 3);

    for (const snake of snakes) {
      if (!snake.alive) {
        if (now - snake.deadAt >= cfg.respawnMs) spawnSnake(snake, now);
        continue;
      }
      snake.accum += dt * snake.speed * speedScale;
      // Cap catch-up so a stalled tab does not fast-forward the whole board
      let steps = 0;
      while (snake.accum >= 1 && steps < 3) {
        snake.accum -= 1;
        steps++;
        stepSnake(snake, now);
        if (!snake.alive) break;
      }
      if (snake.accum > 1) snake.accum = 0;
    }

    for (const [i, expiresAt] of food) {
      if (expiresAt && now >= expiresAt) food.delete(i);
    }

    if (food.size < cfg.foodTarget && now - lastFoodAt >= cfg.foodSpawnMs) {
      addFood(randomDotCell());
      lastFoodAt = now;
    }

    updateSparks(dt);
  }

  function resetSim(now) {
    occupancy.fill(0);
    food.clear();
    sparks = [];
    snakes = cfg.snakeColors.map((color, id) => ({
      id,
      color,
      body: [],
      grow: 0,
      accum: 0,
      alive: false,
      deadAt: 0,
      wanderChance: cfg.wanderChanceSlow,
      speed:
        cfg.snakeSpeed *
        (1 + (Math.random() * 2 - 1) * cfg.speedVariance),
    }));

    // Temperament follows speed: the fastest snake strays furthest from the
    // optimal path, the slowest one walks it almost every step. Neither one
    // ever trades its life for a dot.
    const speeds = snakes.map((s) => s.speed);
    const slowest = Math.min(...speeds);
    const spread = Math.max(...speeds) - slowest;
    for (const snake of snakes) {
      const t = spread > 0 ? (snake.speed - slowest) / spread : 0;
      snake.wanderChance =
        cfg.wanderChanceSlow + (cfg.wanderChanceFast - cfg.wanderChanceSlow) * t;
    }

    for (const snake of snakes) spawnSnake(snake, now);
    for (let n = 0; n < cfg.foodTarget; n++) addFood(randomDotCell());
    lastFoodAt = now;
  }

  // --- Rendering ----------------------------------------------------------

  function writeCell(i, r, g, b, a, glow = 1, height = cfg.extrudeHeights.wall) {
    const o = i * 4;
    frameBuf[o] = r;
    frameBuf[o + 1] = g;
    frameBuf[o + 2] = b;
    frameBuf[o + 3] = a;
    glowBuf[i] = glow;
    heightBuf[i] = height;
    lit[i] = 1;
  }

  /**
   * A hovered word goes full white, throws a halo onto the LEDs around it and
   * runs a highlight diagonally along the letters, so it is unmistakable
   * which item the cursor is on.
   */
  function paintHoveredLabel(label) {
    const col = cfg.labelHoverColor;
    const box = label.box;
    const span = Math.max(1, box.x1 - box.x0 + (box.y1 - box.y0));
    // The sweep runs past the end of the word, leaving a beat between passes
    const head = ((timeMs / 1000) * cfg.labelShineSpeed) % 1.45;
    const dip = clamp(cfg.labelShineStrength, 0, 1);
    // Between passes the word still sits above its resting brightness, so
    // hovering never makes an item look dimmer than its neighbours
    const floor = Math.max(cfg.labelAlpha, cfg.labelHoverAlpha * (1 - dip));

    // The word lifts a little off the wall on hover, and the sweep carries a
    // ripple of extra height along with the highlight
    const lift = cfg.extrudeHeights.labelHover;
    for (const i of label.cells) {
      const u = (colOf(i) - box.x0 + (rowOf(i) - box.y0)) / span;
      const d = (u - head) / 0.16;
      const shine = Math.exp(-d * d);
      writeCell(
        i,
        col.r,
        col.g,
        col.b,
        floor + (cfg.labelHoverAlpha - floor) * shine,
        cfg.labelHoverGlow * (0.8 + 0.7 * shine),
        lift + (lift - cfg.extrudeHeights.label) * shine
      );
    }

    if (cfg.labelHoverHalo <= 0) return;
    // The halo is light thrown onto the wall, so it stays at wall height
    for (const { i, strength } of label.halo) {
      writeCell(
        i,
        col.r,
        col.g,
        col.b,
        cfg.labelHoverHalo * strength,
        cfg.labelHoverGlow * 0.6 * strength,
        cfg.extrudeHeights.wall
      );
    }
  }

  function mosaicHovered(mosaic) {
    return hoverMosaic === mosaic;
  }

  /**
   * The bust sits up off the wall like a hovered word, and on hover it
   * gets the same shine sweep and halo the buttons use.
   */
  function paintMosaic(mosaic, hovered) {
    const rest = cfg.extrudeHeights.labelHover;
    if (!hovered) {
      for (const cell of mosaic.cells) {
        writeCell(cell.i, cell.r, cell.g, cell.b, 1, 1, rest);
      }
      return;
    }

    const box = mosaic.box;
    const span = Math.max(1, box.x1 - box.x0 + (box.y1 - box.y0));
    const head = ((timeMs / 1000) * cfg.labelShineSpeed) % 1.45;
    const lift = rest;
    for (const cell of mosaic.cells) {
      const u = (colOf(cell.i) - box.x0 + (rowOf(cell.i) - box.y0)) / span;
      const d = (u - head) / 0.16;
      const shine = Math.exp(-d * d);
      writeCell(
        cell.i,
        mix(cell.r, 255, 0.22 * shine),
        mix(cell.g, 255, 0.22 * shine),
        mix(cell.b, 255, 0.22 * shine),
        1,
        1 + cfg.labelHoverGlow * 0.45 * shine,
        lift + 0.35 * shine
      );
    }

    if (cfg.labelHoverHalo <= 0) return;
    const col = cfg.labelHoverColor;
    for (const { i, strength } of mosaic.halo) {
      writeCell(
        i,
        col.r,
        col.g,
        col.b,
        cfg.labelHoverHalo * strength,
        cfg.labelHoverGlow * 0.6 * strength,
        cfg.extrudeHeights.wall
      );
    }
  }

  function composeFrame() {
    lit.fill(0);

    // Labels are part of the map, so they sit under the sim. A word inside the
    // page area keeps burning: it is already white, so the sheet closes over
    // it rather than making it come up again.
    for (const mosaic of mosaics) {
      paintMosaic(mosaic, mosaicHovered(mosaic));
    }
    for (const label of labels) {
      if (hoverLabel === label) {
        paintHoveredLabel(label);
        continue;
      }
      const col = cfg.labelColor;
      for (const i of label.cells) {
        writeCell(i, col.r, col.g, col.b, cfg.labelAlpha, 1, cfg.extrudeHeights.label);
      }
    }

    const fc = cfg.foodColor;
    const fadeMs = Math.max(1, cfg.corpseFadeMs);
    for (const [i, expiresAt] of food) {
      const twinkle = 0.82 + 0.18 * Math.sin(timeMs * 0.004 + i * 0.7);
      // Dots on the clock dim away over their last stretch
      const life = expiresAt ? clamp((expiresAt - timeMs) / fadeMs, 0, 1) : 1;
      // The twinkle bobs the dot as well as brightening it
      writeCell(i, fc.r, fc.g, fc.b, twinkle * life, 1, cfg.extrudeHeights.food * twinkle);
    }

    for (const snake of snakes) {
      const len = snake.body.length;
      if (!len) continue;
      const col = snake.color;
      for (let n = 0; n < len; n++) {
        const t = len === 1 ? 0 : n / (len - 1);
        const a = 1 - (1 - cfg.tailFade) * t;
        const head = n === 0;
        // The body sinks back toward the wall along its length, so a snake
        // reads as a ridge with its head standing highest
        writeCell(
          snake.body[n],
          head ? Math.min(255, col.r + 40) : col.r,
          head ? Math.min(255, col.g + 40) : col.g,
          head ? Math.min(255, col.b + 40) : col.b,
          a,
          1,
          head
            ? cfg.extrudeHeights.snakeHead
            : cfg.extrudeHeights.snake * (1 - 0.35 * t)
        );
      }
    }

    // Sparks go down last: a click should read over everything already on the
    // wall, and they are only in the air for a moment
    for (const s of sparks) {
      const t = clamp(s.age / s.life, 0, 1);
      // White-hot at the pop, cooling into the dot yellow it lands as
      const heat = (1 - t) * (1 - t);
      const sr = mix(fc.r, 255, heat * 0.7);
      const sg = mix(fc.g, 255, heat * 0.7);
      const sb = mix(fc.b, 255, heat * 0.7);
      const a = 1 - 0.25 * t;
      const glow = 1 + cfg.burstFlash * heat;
      // A fast spark crosses several LEDs a frame, so the cells behind it are
      // lit dimly and the flight reads as a streak instead of a jump
      const span = Math.max(Math.abs(s.c - s.pc), Math.abs(s.r - s.pr));
      const steps = clamp(Math.ceil(span), 1, 12);
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const c = clamp(Math.floor(s.pc + (s.c - s.pc) * f), 0, cols - 1);
        const r = clamp(Math.floor(s.pr + (s.r - s.pr) * f), 0, rows - 1);
        const head = k === steps;
        // A spark is in the air, so it rides well above the wall and the
        // streak behind it climbs up to meet it
        const air = cfg.extrudeHeights.wall +
          (cfg.extrudeHeights.spark - cfg.extrudeHeights.wall) * (head ? 1 : f);
        writeCell(
          idx(c, r),
          sr,
          sg,
          sb,
          head ? a : a * cfg.burstTrail * f,
          head ? glow : 1,
          air
        );
      }
    }
  }

  /**
   * The wall is a field of blocks seen head-on. A block's face stands off the
   * wall by its own height, which on screen is just its base scaled away from
   * the spot the viewer is standing at — one vanishing point, no camera math.
   * Cells near that spot show only their face; the further out they sit, the
   * more of their sides come into view.
   */
  function faceScale(height) {
    return 1 + height * extrudeK;
  }

  /**
   * On top of the perspective, every block leans the same way by its own
   * height: the viewer is off to one side of the wall rather than square in
   * front of it. Perspective alone leaves the cells right under the vanishing
   * point flat, and the wall is meant to read as blocks everywhere, not only
   * out at the far corner.
   */
  function faceX(x, s, height) {
    return vpX + (x - vpX) * s + height * leanX;
  }

  function faceY(y, s, height) {
    return vpY + (y - vpY) * s + height * leanY;
  }

  /**
   * How much light each side of a block gets: some of the block's own, plus
   * whatever the room throws on it. The ambient term is what makes a dark
   * diode read as a block at all — no multiple of near-black shows up against
   * near-black.
   */
  function computeFaceLight() {
    const light = cfg.extrudeLight || { x: 1, y: 0.5 };
    const len = Math.hypot(light.x, light.y) || 1;
    for (const key of FACE_ORDER) {
      const n = FACE_NORMALS[key];
      // How square-on this side is to the light, 0 once it is turned away.
      // Only the room's light cares: a side keeps the same share of the
      // block's own light whichever way it faces, which is what keeps a white
      // word from doubling in width once its sides come into view.
      const facing = Math.max(0, (n[0] * light.x + n[1] * light.y) / len);
      faceLight[key] = {
        keep: 1 - cfg.extrudeSideShade,
        amb: cfg.extrudeAmbient * (0.25 + 0.75 * facing),
      };
    }
  }

  /** One side of a block, in its own light plus the room's */
  function faceTint(key, r, g, b) {
    const light = faceLight[key];
    tint[0] = Math.min(255, r * light.keep + light.amb) | 0;
    tint[1] = Math.min(255, g * light.keep + light.amb) | 0;
    tint[2] = Math.min(255, b * light.keep + light.amb) | 0;
    return tint;
  }

  /**
   * Traces one side of a block onto the current path and says whether the
   * viewer can see it at all. A face turned away from the vanishing point is
   * behind the block, so it is never drawn.
   */
  function traceFace(g, key, x, y, size, tx, ty, ts) {
    const x1 = x + size;
    const y1 = y + size;
    const tx1 = tx + ts;
    const ty1 = ty + ts;
    if (key === "west") {
      if (tx - x < FACE_MIN_PX) return false;
      g.moveTo(x, y);
      g.lineTo(tx, ty);
      g.lineTo(tx, ty1);
      g.lineTo(x, y1);
    } else if (key === "east") {
      if (x1 - tx1 < FACE_MIN_PX) return false;
      g.moveTo(x1, y);
      g.lineTo(tx1, ty);
      g.lineTo(tx1, ty1);
      g.lineTo(x1, y1);
    } else if (key === "north") {
      if (ty - y < FACE_MIN_PX) return false;
      g.moveTo(x, y);
      g.lineTo(tx, ty);
      g.lineTo(tx1, ty);
      g.lineTo(x1, y);
    } else {
      if (y1 - ty1 < FACE_MIN_PX) return false;
      g.moveTo(x, y1);
      g.lineTo(tx, ty1);
      g.lineTo(tx1, ty1);
      g.lineTo(x1, y1);
    }
    g.closePath();
    return true;
  }

  /** One lit cell as a block: its sides in its own light, then its face */
  function drawBlock(i) {
    const o = i * 4;
    const r = frameBuf[o] | 0;
    const g = frameBuf[o + 1] | 0;
    const b = frameBuf[o + 2] | 0;
    const a = frameBuf[o + 3];
    const x = offsetX + colOf(i) * pitch + insetPx;
    const y = offsetY + rowOf(i) * pitch + insetPx;
    const h = heightBuf[i];
    const s = faceScale(h);
    const tx = faceX(x, s, h);
    const ty = faceY(y, s, h);
    const ts = ledPx * s;

    // Only two of the four sides can face the viewer: one to the side of the
    // vanishing point, one above or below it. The other two are behind.
    sideKeys[0] = tx - x >= x + ledPx - (tx + ts) ? "west" : "east";
    sideKeys[1] = ty - y >= y + ledPx - (ty + ts) ? "north" : "south";
    for (const key of sideKeys) {
      ctx.beginPath();
      if (!traceFace(ctx, key, x, y, ledPx, tx, ty, ts)) continue;
      const side = faceTint(key, r, g, b);
      ctx.fillStyle = `rgba(${side[0]},${side[1]},${side[2]},${a})`;
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(tx, ty, ts, ts);
  }

  /**
   * The dark wall never changes shape, so its blocks are drawn once into their
   * own canvas and blitted every frame. Gaps are left transparent, so the
   * bloom underneath still shows between the blocks.
   *
   * Sides go down before faces: two blocks of the same height overlap where
   * one's face hangs over the other's side, and the face is always the nearer
   * of the two.
   */
  function paintWallSheet() {
    if (!wallSheetCtx || !cellCount || !wallSheet.width) return;
    const g = wallSheetCtx;
    const off = cfg.offColor;
    const height = cfg.extrudeHeights.wall;
    const s = faceScale(height);
    const ts = ledPx * s;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, wallSheet.width, wallSheet.height);
    const dpr = wallSheet.width / (canvas.clientWidth || window.innerWidth);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const key of FACE_ORDER) {
      const side = faceTint(key, off.r, off.g, off.b);
      g.fillStyle = `rgb(${side[0]},${side[1]},${side[2]})`;
      g.beginPath();
      let any = false;
      for (let i = 0; i < cellCount; i++) {
        const x = offsetX + colOf(i) * pitch + insetPx;
        const y = offsetY + rowOf(i) * pitch + insetPx;
        const drawn = traceFace(
          g,
          key,
          x,
          y,
          ledPx,
          faceX(x, s, height),
          faceY(y, s, height),
          ts
        );
        any = any || drawn;
      }
      if (any) g.fill();
    }

    g.fillStyle = `rgb(${off.r},${off.g},${off.b})`;
    g.beginPath();
    for (let i = 0; i < cellCount; i++) {
      const x = offsetX + colOf(i) * pitch + insetPx;
      const y = offsetY + rowOf(i) * pitch + insetPx;
      g.rect(faceX(x, s, height), faceY(y, s, height), ts, ts);
    }
    g.fill();
  }

  function draw() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    ctx.fillStyle = cfg.bg;
    ctx.fillRect(0, 0, w, h);

    composeFrame();

    if (cfg.bloom && cfg.bloomStrength > 0) {
      const basePad = cellSize * cfg.bloomSpread;
      for (let i = 0; i < cellCount; i++) {
        if (!lit[i]) continue;
        const o = i * 4;
        const r = frameBuf[o];
        const g = frameBuf[o + 1];
        const b = frameBuf[o + 2];
        const bright = (r + g + b) / 3;
        if (bright < cfg.bloomBrightnessFloor) continue;
        // The glow belongs to the face, so it rides up with it
        const height = heightBuf[i];
        const s = faceScale(height);
        const x = faceX(offsetX + colOf(i) * pitch, s, height);
        const y = faceY(offsetY + rowOf(i) * pitch, s, height);
        const boost = glowBuf[i];
        const pad = basePad * boost;
        const glow = (bright / 255) * cfg.bloomStrength * frameBuf[o + 3] * boost;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${glow})`;
        ctx.fillRect(x - pad, y - pad, cellSize * s + pad * 2, cellSize * s + pad * 2);
      }
      drawPanelGlow();
    }

    if (wallSheet && wallSheet.width) ctx.drawImage(wallSheet, 0, 0, w, h);

    // Back to front, so the block nearest the viewer is the one in front.
    // Height is not the key: a block's sides only ever sweep away from the
    // viewer, so the nearer cell wins the overlap however tall its neighbour
    // is standing.
    let n = 0;
    for (let i = 0; i < cellCount; i++) {
      if (lit[i]) litList[n++] = i;
    }
    const order = litList.subarray(0, n);
    order.sort((a, b) => depthBuf[a] - depthBuf[b]);
    for (let k = 0; k < n; k++) drawBlock(order[k]);

    if (page.state !== "closed") drawPanel();
  }

  /** The light a cell is showing right now, its LED flattened onto the wall */
  function cellFace(i) {
    const off = cfg.offColor;
    if (!lit[i]) return off;
    const o = i * 4;
    const a = clamp(frameBuf[o + 3], 0, 1);
    return {
      r: off.r + (frameBuf[o] - off.r) * a,
      g: off.g + (frameBuf[o + 1] - off.g) * a,
      b: off.b + (frameBuf[o + 2] - off.b) * a,
    };
  }

  function mix(a, b, t) {
    return (a + (b - a) * t) | 0;
  }

  /**
   * The bloom the settled sheet throws onto the wall around it. Same light as
   * a lit diode, just stacked in rings out from the edge, so the page reads as
   * a bright patch of the wall rather than a box pasted over it. It burns at
   * the ignite color, not the fill, so a page that settles dark still glows on
   * the wall exactly as the white one does.
   */
  function drawPanelGlow() {
    const lift = panelLift();
    if (lift <= 0 || cfg.panelGlow <= 0) return;
    const box = panelPixelRect();
    const ig = panelIgniteColor();
    const rings = 5;
    const step = (cellSize * cfg.bloomSpread * cfg.panelGlow) / rings;

    ctx.lineWidth = step;
    for (let n = 1; n <= rings; n++) {
      // First band carries the alpha a white diode would, then it falls away,
      // so the border LEDs sit in the spill a bright cell next to them makes
      const fade = Math.pow(1 - (n - 1) / rings, 2);
      ctx.strokeStyle = `rgba(${ig.r},${ig.g},${ig.b},${cfg.bloomStrength * lift * fade})`;
      // A stroke rides the middle of its line, so it starts half a band out
      const pad = step * (n - 0.5);
      ctx.strokeRect(box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2);
    }
  }

  /**
   * Opening a page drives the middle of the wall to full white. Each diode
   * flares, then swells past its own gap until it meets its neighbours and the
   * cells stop being cells. The sweep runs diagonally from the top-left with a
   * ragged edge, and a cell already lit as a label skips the flare: it is white
   * before the sweep arrives, so it only has to grow into the sheet.
   */
  function drawPanel() {
    const rect = page.rect;
    const back = panelFillColor();
    const ig = panelIgniteColor();
    const backStyle = `rgb(${back.r},${back.g},${back.b})`;

    if (page.state === "open") {
      const box = panelPixelRect();
      ctx.fillStyle = backStyle;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      return;
    }

    const inset = insetPx;
    const ledSize = ledPx;
    const flarePad = cellSize * cfg.bloomSpread * Math.max(0, cfg.panelFlash);
    const active = [];

    // Cells already at full white are one flat sheet, so they go down as a
    // single path instead of a fill each — that is most of the panel once the
    // sweep gets going
    ctx.fillStyle = backStyle;
    ctx.beginPath();
    for (let r = rect.r0; r <= rect.r1; r++) {
      for (let c = rect.c0; c <= rect.c1; c++) {
        const up = panelProgress(c, r);
        if (up <= 0) continue;
        if (up >= 1) {
          ctx.rect(offsetX + c * pitch, offsetY + r * pitch, pitch, pitch);
        } else {
          active.push(c, r, up);
        }
      }
    }
    ctx.fill();

    for (let n = 0; n < active.length; n += 3) {
      const c = active[n];
      const r = active[n + 1];
      const up = active[n + 2];
      const i = idx(c, r);
      const x = offsetX + c * pitch;
      const y = offsetY + r * pitch;

      // The block sinks back flush with the wall as its cell comes up, so the
      // sheet closes as one flat surface rather than over a field of studs
      const stand = (lit[i] ? heightBuf[i] : cfg.extrudeHeights.wall) * (1 - up);
      const s = faceScale(stand);

      // A diode driven up to white overshoots before it holds, so it blooms
      // hardest halfway through. A label is lit already and has nothing to
      // announce, so it comes up dark of the flare.
      const flare = obstacle[i] ? 0 : Math.sin(Math.PI * up);
      if (flare > 0 && flarePad > 0 && cfg.bloomStrength > 0) {
        const pad = flarePad * flare;
        const fx = faceX(x, s, stand) - pad;
        const fy = faceY(y, s, stand) - pad;
        ctx.fillStyle = `rgba(${ig.r},${ig.g},${ig.b},${cfg.bloomStrength * flare})`;
        ctx.fillRect(fx, fy, pitch * s + pad * 2, pitch * s + pad * 2);
      }

      // Color arrives ahead of size: the diode whitens first, then grows over
      // the gap until the sheet closes up. It drives up to the ignite color and
      // only falls into the fill at the end, so a dark page still comes up lit.
      const face = cellFace(i);
      const tone = Math.min(1, up * 1.8);
      const grow = up * up * (3 - 2 * up);
      const o = inset * (1 - grow);
      const size = (ledSize + (pitch - ledSize) * grow) * s;
      const tr = mix(ig.r, back.r, up);
      const tg = mix(ig.g, back.g, up);
      const tb = mix(ig.b, back.b, up);
      ctx.fillStyle = `rgb(${mix(face.r, tr, tone)},${mix(face.g, tg, tone)},${mix(
        face.b,
        tb,
        tone
      )})`;
      ctx.fillRect(faceX(x + o, s, stand), faceY(y + o, s, stand), size, size);
    }
  }

  // --- Wiring -------------------------------------------------------------

  function gapAt(size) {
    return Math.max(1, Math.floor(size * cfg.cellGapRatio));
  }

  function colsAt(size, w) {
    const g = gapAt(size);
    return Math.floor((w + g) / (size + g));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // A phone is narrower than the longest word is wide, and layoutLabels has
    // nowhere to put it but off the edge. So the diodes give way before the
    // words do: cells shrink until PROJECTS fits between its own margins.
    const needCols = widestLabel() + 4;
    cellSize = cfg.targetCellPx;
    while (cellSize > cfg.minCellPx && colsAt(cellSize, w) < needCols) cellSize--;

    gap = gapAt(cellSize);
    pitch = cellSize + gap;
    cols = Math.max(8, colsAt(cellSize, w));
    rows = Math.max(8, Math.floor((h + gap) / pitch));
    cellCount = cols * rows;

    const usedW = cols * cellSize + (cols - 1) * gap;
    const usedH = rows * cellSize + (rows - 1) * gap;
    offsetX = Math.floor((w - usedW) / 2);
    offsetY = Math.floor((h - usedH) / 2);
    insetPx = Math.max(0.5, cellSize * cfg.diodeInset);
    ledPx = cellSize - insetPx * 2;

    // Where the viewer is standing, and how much of a block's side that lets
    // them see. Lean and depth are in cells so the blocks keep their
    // proportions when the diodes shrink; the camera sits back a multiple of
    // the wall itself, so the perspective does not change with the window.
    vpX = offsetX + usedW * cfg.extrudeVanishX;
    vpY = offsetY + usedH * cfg.extrudeVanishY;
    const camera = Math.max(1, cfg.extrudeCameraDist * Math.max(usedW, usedH));
    extrudeK = cfg.extrude ? (cfg.extrudeDepth * cellSize) / camera : 0;
    leanX = cfg.extrude ? cfg.extrudeLeanX * cellSize : 0;
    leanY = cfg.extrude ? cfg.extrudeLeanY * cellSize : 0;
    computeFaceLight();

    obstacle = new Uint8Array(cellCount);
    letterBlock = new Uint8Array(cellCount);
    panelMask = new Uint8Array(cellCount);
    occupancy = new Int16Array(cellCount);
    frameBuf = new Float32Array(cellCount * 4);
    glowBuf = new Float32Array(cellCount);
    heightBuf = new Float32Array(cellCount);
    lit = new Uint8Array(cellCount);
    litList = new Int32Array(cellCount);
    depthBuf = new Float32Array(cellCount);

    // Which way the viewer sits, as one vector: the flat lean plus the way the
    // perspective pushes at the middle of the wall. A cell further along it is
    // nearer the viewer, and so paints later.
    const towardX = -leanX + (vpX - (offsetX + usedW / 2)) * extrudeK;
    const towardY = -leanY + (vpY - (offsetY + usedH / 2)) * extrudeK;
    for (let i = 0; i < cellCount; i++) {
      depthBuf[i] = colOf(i) * towardX + rowOf(i) * towardY;
    }
    bfsStamp = new Int32Array(cellCount);
    bfsParent = new Int32Array(cellCount);
    bfsQueue = new Int32Array(cellCount);
    bfsGen = 0;

    if (!wallSheet) {
      wallSheet = document.createElement("canvas");
      wallSheetCtx = wallSheet.getContext("2d");
    }
    wallSheet.width = canvas.width;
    wallSheet.height = canvas.height;
    paintWallSheet();

    layoutLabels();

    // An open page has to be re-cut on the new grid before snakes respawn,
    // or they would come back inside it
    if (page.state !== "closed") {
      page.rect = computePanelRect();
      paintPanelMask(true);
    }

    resetSim(timeMs || performance.now());
    if (page.state !== "closed") onPanelResize(panelPixelRect());
    // Nothing is going to come along and repaint a stopped wall
    if (paused) draw();
  }

  /**
   * The cursor is over the face of a block, not the wall behind it, so the
   * point is dropped back down to wall height before it is turned into a cell.
   * The height asked for is the one being aimed at: a word stands taller than
   * the wall it sits on, and by the edges of the wall that is several pixels
   * of difference.
   */
  function cellFromPointer(clientX, clientY, height = cfg.extrudeHeights.wall) {
    const rect = canvas.getBoundingClientRect();
    const s = faceScale(height);
    const x = vpX + (clientX - rect.left - height * leanX - vpX) / s - offsetX;
    const y = vpY + (clientY - rect.top - height * leanY - vpY) / s - offsetY;
    if (x < -pitch || y < -pitch || x >= cols * pitch + pitch || y >= rows * pitch + pitch) {
      return null;
    }
    const c = clamp(Math.floor(x / pitch), 0, cols - 1);
    const r = clamp(Math.floor(y / pitch), 0, rows - 1);
    return { c, r, i: idx(c, r) };
  }

  /**
   * Words are read at their resting height even while they are lifted, so the
   * hover cannot chase itself off the cursor.
   */
  function hitFromPointer(clientX, clientY) {
    // The bust sits at hover height, so read it there first or the cursor
    // would hit the wall behind the face
    const raised = cellFromPointer(clientX, clientY, cfg.extrudeHeights.labelHover);
    if (raised) {
      const mosaic = mosaicAt(raised.c, raised.r, raised.i);
      if (mosaic) return { mosaic };
    }
    const cell = cellFromPointer(clientX, clientY, cfg.extrudeHeights.label);
    if (!cell) return null;
    const mosaic = mosaicAt(cell.c, cell.r, cell.i);
    if (mosaic) return { mosaic };
    const label = labelAt(cell.c, cell.r);
    return label ? { label } : null;
  }

  function onPointerMove(e) {
    const hit = hitFromPointer(e.clientX, e.clientY);
    hoverMosaic = hit && hit.mosaic ? hit.mosaic : null;
    hoverLabel = hit && hit.label ? hit.label : null;
    canvas.style.cursor = hoverLabel || hoverMosaic ? "pointer" : "default";
  }

  function onPointerLeave() {
    hoverLabel = null;
    hoverMosaic = null;
  }

  function onClick(e) {
    const hit = hitFromPointer(e.clientX, e.clientY);
    if (hit && hit.mosaic) {
      onSelect({ id: hit.mosaic.pageId });
      return;
    }
    if (hit && hit.label) {
      onSelect(hit.label);
      return;
    }
    // Bare wall is aimed at down on the wall itself, not up where the words are
    const cell = cellFromPointer(e.clientX, e.clientY);
    if (!cell) return;
    // Bare wall: hand the snakes a fresh handful of dots. A stopped wall has
    // no frames to fly them in, so it takes no bursts.
    if (cfg.burstCountMax > 0 && !paused && !panelMask[cell.i]) {
      spawnBurst(cell.c, cell.r);
    }
  }

  function frame(now) {
    if (!lastNow) lastNow = now;
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    timeMs = now;
    updatePanel();
    updateSim(dt, now);
    draw();
    // A pause raised inside this frame has to land here, or the tail of the
    // frame would re-arm the loop it just stopped
    raf = paused ? 0 : requestAnimationFrame(frame);
  }

  /**
   * Stops the loop dead. The canvas keeps whatever was last drawn, so a page
   * covering the whole wall still has its sheet under it.
   */
  function pause() {
    if (paused) return;
    paused = true;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function resume() {
    if (!paused) return;
    paused = false;
    // The clock ran on while the loop was stopped, so bring every timer that
    // reads it back to now rather than replaying the gap
    timeMs = performance.now();
    lastNow = 0;
    lastFoodAt = timeMs;
    for (const snake of snakes) if (!snake.alive) snake.deadAt = timeMs;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerdown", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("click", onClick);
    window.removeEventListener("resize", resize);
  }

  return {
    start,
    destroy,
    resize,
    pause,
    resume,
    addLabel,
    addMosaic,
    clearLabels,
    openPanel,
    closePanel,
    recolorPanel,
    panelPixelRect,
    get panelState() {
      return page.state;
    },
    get panelColor() {
      return panelFillColor();
    },
    get paused() {
      return paused;
    },
    get config() {
      return cfg;
    },
    get labels() {
      return labels;
    },
    get snakes() {
      return snakes;
    },
    get food() {
      return food;
    },
    get grid() {
      return { cols, rows, cellSize, gap };
    },
  };
}

window.createLedWall = createLedWall;
