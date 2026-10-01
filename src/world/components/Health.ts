/**
 * Hit points. Anything that can be hurt has one of these.
 * Optionally gives a few seconds of invincibility after each hit (the player uses this).
 */
export class Health {
  current: number;
  /** Seconds of invincibility left. */
  invincibleTimer = 0;

  constructor(
    public max: number,
    /** Seconds of invincibility after taking damage (0 = none). */
    public invincibleAfterHit = 0,
  ) {
    this.current = max;
  }

  get isDead(): boolean {
    return this.current <= 0;
  }

  get isInvincible(): boolean {
    return this.invincibleTimer > 0;
  }

  /** 0..1, handy for health bars. */
  get fraction(): number {
    return Math.max(0, this.current) / this.max;
  }

  /** Returns true if the damage actually landed. */
  takeDamage(amount: number): boolean {
    if (this.isDead || this.isInvincible || amount <= 0) return false;
    this.current = Math.max(0, this.current - amount);
    if (this.invincibleAfterHit > 0) this.invincibleTimer = this.invincibleAfterHit;
    return true;
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  reset(): void {
    this.current = this.max;
    this.invincibleTimer = 0;
  }

  update(dt: number): void {
    if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
  }
}
