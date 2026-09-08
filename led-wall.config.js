/**
 * LED wall look & feel — tweak these and reload index.html
 *
 * Colors are { r, g, b } 0–255. Alphas / strengths are 0–1 unless noted.
 */
window.LED_WALL_CONFIG = {
  // --- Grid ---
  targetCellPx: 11,
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
  panelBorderX: 7,
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
  panelGlow: 5,

  // --- Glow / bloom ---
  bloom: true,
  bloomStrength: 0.12,
  bloomSpread: 0.3,
  bloomBrightnessFloor: 50,
};
