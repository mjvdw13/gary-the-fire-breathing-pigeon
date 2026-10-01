/**
 * Global game numbers in one place. Tweak these to change how the game feels.
 *
 * Units: 3D distances are in meters, speeds in meters per second, times in seconds.
 * The original 2D game used pixels, so `px()` converts old pixel numbers into meters.
 */

/** How many 2D pixels make one 3D meter. */
export const PIXELS_PER_METER = 40;

/** Convert a number from the 2D game (pixels) into meters. */
export const px = (pixels: number): number => pixels / PIXELS_PER_METER;

export const TUNING = {
  /** Downward acceleration (2D game used 1200 px/s²). */
  gravity: px(1200),

  /** Simulation runs at a fixed rate so the game behaves the same on every computer. */
  fixedStep: 1 / 60,
  /** Biggest chunk of time we'll simulate after a lag spike. */
  maxFrameTime: 0.1,

  player: {
    maxHealth: 5,
    /** Seconds of blinking invincibility after getting hit. */
    invincibleTime: 1.5,
    /** How quickly the player reaches full speed (higher = snappier). */
    acceleration: 18,
    /** How quickly the player turns to face where they're going (radians/sec-ish). */
    turnSpeed: 14,
    /** Falling below this height respawns the player. */
    killY: -25,
  },

  camera: {
    distance: 7,
    minDistance: 2.5,
    maxDistance: 16,
    /** Height above the player's feet that the camera looks at. */
    lookHeight: 1.5,
    mouseSensitivity: 0.0025,
    minPitch: -0.35,
    maxPitch: 1.2,
  },

  waves: {
    /** Pause between waves. */
    delayBetween: 2,
    /** Enemies never spawn closer than this to the player. */
    minSpawnDistance: 10,
  },

  combat: {
    /** Multiplies player projectile damage in god mode (2D game: fireballs did 2 instead of 1). */
    godModeDamageMultiplier: 2,
    /** Seconds an enemy glows white after being hit. */
    hitFlashTime: 0.1,
  },
};
