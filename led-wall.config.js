/**
 * LED wall look & feel — tweak these and reload index.html
 *
 * Colors are { r, g, b } 0–255. Alphas / strengths are 0–1 unless noted.
 */
window.LED_WALL_CONFIG = {
  // --- Grid ---
  targetCellPx: 11,
  /** Cells shrink to this on a wall too narrow to fit the longest label */
  minCellPx: 5,
  cellGapRatio: 0.28,
  bg: "#050506",
  diodeInset: 0.08,
  offColor: { r: 12, g: 12, b: 14 },

  // --- Labels (they are the map: snakes must path around them, and dots
  //     never spawn inside a letter's own block) ---
  /** "3x5" or "5x7" pixel font */
  font: "3x5",
  /** Integer blow-up of each glyph pixel (2 = each dot becomes 2x2 LEDs) */
  labelScale: 1,
  /** LEDs between letters (already scaled) */
  letterGap: 1,
  /** Extra LEDs around a label that still count as hover/click area */
  labelHitPadding: 2,
  /** Clear LEDs kept between labels so snakes always have a lane through */
  labelMargin: 4,
  /** Resting label: white, but held back so the wall stays calm */
  labelColor: { r: 232, g: 236, b: 245 },
  labelAlpha: 0.8,
  /** Hovered label: full white with a much wider bloom */
  labelHoverColor: { r: 255, g: 255, b: 255 },
  labelHoverAlpha: 1,
  /** Bloom multiplier for a hovered label (1 = same glow as everything else) */
  labelHoverGlow: 1,
  /** Alpha of the halo lit around a hovered word (0 = no halo) */
  labelHoverHalo: 0.1,
  /** Highlight sweeps per second along a hovered word */
  labelShineSpeed: 0.7,
  /** How far the sweep dips the rest of the word (0 = flat, no shine) */
  labelShineStrength: 0.3,

  // --- Snakes ---
  /** Pac-Man ghost palette: Blinky, Pinky, Inky, Clyde */
  snakeColors: [
    { r: 255, g: 60, b: 48 },
    { r: 255, g: 165, b: 230 },
    { r: 64, g: 230, b: 255 },
    { r: 145, g: 218, b: 115 },
  ],
  /** LED steps per second */
  snakeSpeed: 13,
  /** Per-snake speed jitter (0.15 = up to +/-15%) */
  speedVariance: 0.3,
  /** Speed multiplier while a page is open, so the wall calms down to read */
  readingSpeedScale: 1,
  /** Segments a fresh snake starts with */
  startLength: 5,
  /** Segments gained per dot */
  growPerFood: 3,
  /** Snakes stop growing here so no one dominates the wall */
  maxLength: 80,
  /** Delay before a dead snake comes back */
  respawnMs: 1500,
  /** Tail dimming: alpha at the very end of the body */
  tailFade: 0.45,
  /**
   * Staying alive always beats reaching a dot: every snake refuses a step
   * into a pocket it cannot fit inside. Speed only decides how much it
   * wanders off the optimal path while it is safe to do so.
   */
  /** Chance per step to ignore the optimal path — slowest snake */
  wanderChanceSlow: 0.01,
  /** Chance per step to ignore the optimal path — fastest snake */
  wanderChanceFast: 0.16,
  /** Free LEDs a snake wants ahead of a step (capped by its own length) */
  safetySpace: 64,

  // --- Food (mutual dots) ---
  foodColor: { r: 250, g: 204, b: 21 },
  /** Dots kept on the wall while nobody is dying */
  foodTarget: 26,
  /** Milliseconds between top-up dots */
  foodSpawnMs: 420,
  /** Hard ceiling so a big death does not flood the wall forever */
  foodMax: 420,
  /**
   * A corpse rots inward: its dots expire from head and tail toward the
   * middle, so leftovers nobody eats disappear instead of piling up.
   */
  corpseLingerMs: 5200,
  /** How long a dot spends fading out once its time is up */
  corpseFadeMs: 900,

  // --- Click burst (clicking bare wall pops dots out for the snakes) ---
  /** Sparks per click, rolled fresh each time (0 max = clicks do nothing) */
  burstCountMin: 4,
  burstCountMax: 10,
  /** LEDs per second a spark leaves the click at, before drag */
  burstSpeed: 30,
  /** Fraction of its speed a spark keeps per second (lower = stops harder) */
  burstDrag: 0.02,
  /** How long a spark stays in the air before it settles as a dot */
  burstLifeMs: 380,
  /** Brightness of the cells a spark just left (0 = no streak) */
  burstTrail: 0.35,
  /** Extra bloom on a spark at the moment of the pop */
  burstFlash: 3,

  // --- Page panel (clicking a label drives the middle of the wall to white) ---
  /** LEDs of wall kept above and below the page */
  panelBorderY: 3,
  /** LEDs kept either side of it — the lane the snakes are left with */
  panelBorderX: 6,
  /** The color the middle settles on, and so the page background */
  panelColor: { r: 255, g: 255, b: 255 },
  /** The color a cell flares to on the way up, whatever fill it settles on */
  panelIgniteColor: { r: 255, g: 255, b: 255 },
  /** How long one cell takes to come up to full white */
  panelIgniteMs: 240,
  /** Delay between the top-left cell and the bottom-right one lighting */
  panelSweepMs: 700,
  /** Ragged edge on the sweep, in fractions of its length (0 = ruled line) */
  panelSweepJitter: 0.12,
  /** Extra bloom a cell throws while it comes up (0 = no flare) */
  panelFlash: 3,
  /** Bloom spread multiplier along the edge of the settled sheet */
  panelGlow: 0,

  // --- Perspective (every cell is a block standing off the wall, seen from
  //     down at the bottom right, so the blocks lean up and to the left and
  //     show the two sides turned back toward the viewer) ---
  extrude: true,
  /** How far a height-1 block leans, in cells. Negative is up / left, so this
   *  pair is where the viewer is standing: below and right of the wall. This
   *  is the strength of the whole effect — turn it up to lean harder */
  extrudeLeanX: -0.15,
  extrudeLeanY: -0.32,
  /** The perspective laid over that lean: how much harder the far corner
   *  leans than the near one (0 = the same lean everywhere, no perspective) */
  extrudeDepth: 0.25,
  /** Viewer distance in multiples of the wall's longest side. Lower = the
   *  perspective splays out harder */
  extrudeCameraDist: 1.4,
  /** Where the viewer is standing, 0-1 across the wall. Just past the bottom
   *  right corner, so the perspective leans every block the same way the flat
   *  lean does instead of fighting it somewhere in the middle */
  extrudeVanishX: 1.1,
  extrudeVanishY: 1.15,
  /** Block heights per kind of cell — this is what makes a word read as a
   *  raised plate, a snake as a ridge running over it, and a dot as a stud */
  extrudeHeights: {
    wall: 0.5,
    label: 1.5,
    /** A hovered word lifts off the wall; keep it near `label` or the hover
     *  will sit visibly off the cursor */
    labelHover: 2,
    food: 0.8,
    snake: 1,
    snakeHead: 1.15,
    /** Sparks are in the air, so they ride well above everything */
    spark: 2,
  },
  /** How much of its own light a block's sides lose (0 = sides as bright as
   *  the face). Keep this high: a word whose sides stay bright reads as twice
   *  its width once they come into view */
  extrudeSideShade: 0.82,
  /** Light the room throws on the sides, 0-255. A dark diode has no light of
   *  its own to shade, so this is the only thing that gives it edges */
  extrudeAmbient: 34,
  /** Where the light is standing, in screen axes. Over the viewer's shoulder
   *  by default, so the sides they can see are the lit ones */
  extrudeLight: { x: 1, y: 0.5 },

  // --- Glow / bloom ---
  bloom: true,
  bloomStrength: 0.2,
  bloomSpread: 0.3,
  bloomBrightnessFloor: 50,
};
