import type { Shape } from './shapes';
import type { Team } from './Team';

/**
 * A damaging area that isn't a projectile: a broom sweep, a hammer slam,
 * a shockwave, a puddle of lava...
 *
 * The entity that owns it moves `shape` around and flips `active` on/off.
 * The CombatSystem does the rest — no special code needed per enemy.
 */
export class Hazard {
  active = false;
  /** Who has already been hit during this activation (so one slam = one hit). */
  readonly alreadyHit = new Set<number>();

  constructor(
    public team: Team,
    public damage: number,
    public shape: Shape,
    /** If true each target can only be hit once per activation. */
    public hitOnce = true,
  ) {}

  /** Turn the hazard on and forget who it hit last time. */
  activate(): void {
    this.active = true;
    this.alreadyHit.clear();
  }

  deactivate(): void {
    this.active = false;
  }
}
