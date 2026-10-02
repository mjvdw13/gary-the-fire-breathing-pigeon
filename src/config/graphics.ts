/**
 * Graphics switches. Flip them in the debug panel (` key) to see what each one does —
 * or turn some off if the game is slow on your computer.
 */
export const GRAPHICS = {
  /**
   * Let the game turn the switches below down (and back up) by itself to stay smooth.
   * See rendering/AutoQuality.ts. Turn this off to set them by hand.
   */
  autoQuality: true,
  /** How sharp the picture is: 1 = full, 0.5 = blurrier but MUCH faster (4x fewer pixels). */
  resolution: 1,
  /** Shadows in corners and where things touch the ground ("ambient occlusion"). */
  ambientOcclusion: true,
  /** Glowing things (eyes, fire, lasers, the sun) shine and blur. */
  bloom: true,
  /** The sky reflects off everything and lights it softly. */
  skyLighting: true,
  /** Slightly richer colors and darker screen corners, like a camera. */
  colorGrading: true,
  /** Turn ALL the effects above on/off at once (off = no post-processing). */
  effects: true,
};
