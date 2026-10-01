import { Action, DEFAULT_BINDINGS } from './Actions';

/**
 * Keyboard + mouse state.
 *
 * - isDown(action):   held right now
 * - pressed(action):  went down since the last game tick (one-shot, like "fire once")
 * - Mouse movement for the camera: consumeMouseDelta()
 *
 * Clicking the game captures the mouse (pointer lock) so moving it turns the camera.
 */
export class Input {
  bindings: Record<Action, string[]> = structuredClone(DEFAULT_BINDINGS);

  private down = new Set<string>();
  private justPressed = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private wheel = 0;
  /** Set by the game: should clicking the canvas grab the mouse? */
  wantsPointerLock = false;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.press(e.code);
      // Stop the page from scrolling when using game keys.
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());

    canvas.addEventListener('mousedown', (e) => {
      if (this.wantsPointerLock && !this.pointerLocked) {
        void canvas.requestPointerLock();
        return; // the click that grabs the mouse shouldn't also shoot
      }
      this.press(`Mouse${e.button}`);
    });
    window.addEventListener('mouseup', (e) => this.down.delete(`Mouse${e.button}`));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    window.addEventListener(
      'wheel',
      (e) => {
        this.wheel += Math.sign(e.deltaY);
      },
      { passive: true },
    );

    document.addEventListener('pointerlockchange', () => {
      if (!this.pointerLocked) this.down.clear();
    });
  }

  get pointerLocked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  releasePointer(): void {
    if (this.pointerLocked) document.exitPointerLock();
  }

  isDown(action: Action): boolean {
    return this.bindings[action].some((code) => this.down.has(code));
  }

  pressed(action: Action): boolean {
    return this.bindings[action].some((code) => this.justPressed.has(code));
  }

  /** -1..1 on each axis from WASD/arrows. x = right, y = forward. */
  moveAxis(): { x: number; y: number } {
    const x = (this.isDown('moveRight') ? 1 : 0) - (this.isDown('moveLeft') ? 1 : 0);
    const y = (this.isDown('moveForward') ? 1 : 0) - (this.isDown('moveBack') ? 1 : 0);
    return { x, y };
  }

  /** Mouse movement since last call (pixels). */
  consumeMouseDelta(): { x: number; y: number } {
    const d = { x: this.mouseDX, y: this.mouseDY };
    this.mouseDX = this.mouseDY = 0;
    return d;
  }

  /** Scroll wheel clicks since last call (+ = scroll down / zoom out). */
  consumeWheel(): number {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  /** Called by the game loop after each tick so `pressed()` only fires once. */
  endTick(): void {
    this.justPressed.clear();
  }

  private press(code: string): void {
    if (!this.down.has(code)) this.justPressed.add(code);
    this.down.add(code);
  }
}
