import { TUNING } from '../config/tuning';

/**
 * Runs the game.
 *
 * - `update(dt)` is called at a FIXED rate (60 times per second), no matter how fast the
 *   computer is. All game logic goes there, so jumps are always the same height.
 * - `render(alpha)` is called once per screen refresh. `alpha` (0..1) says how far we are
 *   between two updates, so movement can be drawn smoothly on 120/144Hz screens.
 */
export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  constructor(
    private update: (dt: number) => void,
    private render: (alpha: number, frameDt: number) => void,
  ) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
  }

  private frame = (now: number): void => {
    if (!this.running) return;

    const step = TUNING.fixedStep;
    const frameDt = Math.min((now - this.lastTime) / 1000, TUNING.maxFrameTime);
    this.lastTime = now;
    this.accumulator += frameDt;

    while (this.accumulator >= step) {
      this.update(step);
      this.accumulator -= step;
    }

    this.render(this.accumulator / step, frameDt);
    requestAnimationFrame(this.frame);
  };
}
