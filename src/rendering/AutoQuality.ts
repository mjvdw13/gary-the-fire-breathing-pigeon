import { GRAPHICS } from '../config/graphics';

/**
 * Keeps the game smooth on slow computers.
 *
 * Every 2 seconds it checks the frame rate. Too slow (under 45 fps)? It steps DOWN
 * one quality level. Smooth (about 60 fps) for a while? It tries one step UP. If that
 * step up was too much, it waits twice as long before trying again.
 *
 * The level it settles on is remembered, so next time the game starts there.
 * Want a different order? Edit STEPS.
 */
const STEPS = [
  { resolution: 1, ambientOcclusion: true, bloom: true },
  { resolution: 0.85, ambientOcclusion: true, bloom: true },
  { resolution: 0.7, ambientOcclusion: true, bloom: true },
  { resolution: 0.7, ambientOcclusion: false, bloom: true },
  { resolution: 0.6, ambientOcclusion: false, bloom: false },
  { resolution: 0.5, ambientOcclusion: false, bloom: false },
];

const CHECK_EVERY = 2; // seconds
const TOO_SLOW_FPS = 45;
const SMOOTH_FPS = 57;
const SAVE_KEY = 'gary3d.qualityStep';

/** Live numbers for the debug panel. */
export const SPEED = { fps: 0, qualityStep: 0 };

export class AutoQuality {
  step = 0;
  private time = 0;
  private frames = 0;
  private smoothFor = 0;
  /** Seconds of smooth play needed before trying a better level. Doubles after a failed try. */
  private patience = 8;
  private justSteppedUp = false;

  constructor() {
    this.apply(loadStep());
  }

  /** Call once per drawn frame with the real time since the last one. */
  update(frameDt: number): void {
    if (frameDt > 0.25) return; // the game was paused or the tab was hidden — don't count it

    this.time += frameDt;
    this.frames++;
    if (this.time < CHECK_EVERY) return;
    const fps = this.frames / this.time;
    this.time = 0;
    this.frames = 0;
    SPEED.fps = Math.round(fps);
    if (!GRAPHICS.autoQuality) return;

    if (fps < TOO_SLOW_FPS && this.step < STEPS.length - 1) {
      if (this.justSteppedUp) this.patience *= 2; // that step up was too much
      this.apply(this.step + 1);
      this.justSteppedUp = false;
      this.smoothFor = 0;
    } else if (fps >= SMOOTH_FPS) {
      this.smoothFor += CHECK_EVERY;
      this.justSteppedUp = false;
      if (this.smoothFor >= this.patience && this.step > 0) {
        this.apply(this.step - 1);
        this.justSteppedUp = true;
        this.smoothFor = 0;
      }
    } else {
      this.smoothFor = 0;
    }
  }

  private apply(step: number): void {
    this.step = step;
    SPEED.qualityStep = step;
    Object.assign(GRAPHICS, STEPS[step]);
    saveStep(step);
  }
}

// Browser storage can be blocked (private windows), so never let it crash the game.
function loadStep(): number {
  try {
    const step = Number(localStorage.getItem(SAVE_KEY) ?? 0);
    return Number.isInteger(step) && step >= 0 && step < STEPS.length ? step : 0;
  } catch {
    return 0;
  }
}

function saveStep(step: number): void {
  try {
    localStorage.setItem(SAVE_KEY, String(step));
  } catch {
    // fine — we just won't remember it
  }
}
