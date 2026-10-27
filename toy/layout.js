/**
 * Where the loose things on the toy table lie. Nudge any of them by editing
 * its numbers and reloading.
 *
 *   x     left (-) to right (+); 0 is the middle of the table
 *   z     back (-) to front (+); the camera is at the front, and the front
 *         edge of the picture is about z = 8
 *   turn  how far it is turned round, in radians (positive is anticlockwise
 *         seen from above); leave it out for none
 *
 * To take something off the table, delete its line (or comment it out).
 * Sizes and colours stay in scene.js.
 */
export const LAYOUT = {
  // The intro sheet, lying flat before it is peeled up
  sheet: { x: -0.3, z: 5.6 },

  // By the porcupine, front left
  note: { x: -5.85, z: 5.15, turn: 0.22 },
  pencil: { x: -4.5, z: 6.4, turn: 0.5 },
  marker: { x: -6.0, z: 6.8, turn: -0.25 },

  // The middle of the table
  bigMeeple: { x: -1.9, z: 1.0, turn: 0.15 },
  die: { x: -2.2, z: 2.2, turn: 0.5 },
  coralMeeple: { x: -0.6, z: 1.4, turn: 0.2 },
  sheepMiddle: { x: 1.1, z: 1.2, turn: -0.2 },
  boarMiddle: { x: 4.5, z: 2.1, turn: 0.2 },
  // sheepNearTrack: { x: 6.25, z: 3.4, turn: 0.4 },
  d4: { x: 6.6, z: -1.7, turn: 0.8 },

  // Left of the intro sheet. This is the middle of the four juggling balls.
  jugglingBalls: { x: -3.46, z: 3.95 },
  // The "all in" marker, left of the sheet
  allIn: { x: 1.9, z: 7, turn: -0.9 },

  // Round the dominoes, which run in front of the train's track
  chipsRed: { x: 2.2, z: 5.6, turn: 0.3 },
  chipsBlue: { x: 4.7, z: 6.8, turn: 1.1 },
  sageMeeple: { x: 4.5, z: 5.1, turn: -0.75 },
  d20: { x: 7.5, z: 3.0, turn: 0.3 },
  boarByDominoes: { x: 6.0, z: 7.0, turn: 0.5 },
  // sheepDark: { x: 6.0, z: 6.0, turn: -0.3 },
  // sheepBig: { x: 6.0, z: 4.0, turn: -0.15 },
  // sheepFront: { x: 9.9, z: 6.5, turn: 0.25 },
  // sheepFarFront: { x: 9.4, z: 6.9, turn: 0.15 },
  // boarFront: { x: 6.8, z: 7.2, turn: -0.3 },

  // The dominoes: points along the path they stand on, an S turning in front of the track
  dominoes: [[3.4, 8.8], [3.5, 5.4], [3.7, 4.2], [4.4, 3.6], [5.2, 4.2], [5.5, 5.4], [6.3, 6.0], [7.4, 5.8], [8.4, 5.4], [9.9, 5.2], [11.5, 5.2], [13, 5.3]],

  // Out at the back, by the pinwheels and in front of the hoop
  redMeeple: { x: -0.4, z: -5.3, turn: 0.3 },
  boarBack: { x: 2.3, z: -4.7, turn: -0.3 },
  d20Back: { x: -1.4, z: -4.7, turn: -0.2 },
  d8Back: { x: 1.0, z: -5.5, turn: -0.4 },
  dieBack: { x: 3.3, z: -4.3, turn: 0.3 },
};
