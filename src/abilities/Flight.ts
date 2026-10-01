import type { GameContext } from '../core/GameContext';
import type { Player } from '../player/Player';
import { Ability, AbilityTrigger } from './Ability';

export interface FlightOptions {
  /** Upward speed while flying (m/s). */
  flySpeed: number;
  /** Seconds of flight on a full meter. */
  maxFlyTime: number;
  /** Meter seconds regained per second while on the ground. */
  rechargeRate: number;
}

/** Hold jump in the air to fly upward until the meter runs out. (Violet and Quacks) */
export class Flight extends Ability {
  readonly name = 'Flight';
  readonly trigger: AbilityTrigger = { action: 'jump', mode: 'held', airOnly: true };
  private fuel: number;

  constructor(private options: FlightOptions) {
    super();
    this.fuel = options.maxFlyTime;
  }

  canActivate(): boolean {
    return this.fuel > 0;
  }

  protected activate(player: Player, ctx: GameContext, dt: number): void {
    this.fuel = Math.max(0, this.fuel - dt);
    // Never slower than a jump that's still rising.
    player.motor.velocity.y = Math.max(player.motor.velocity.y, this.options.flySpeed);
    player.flying = true;
    if (Math.random() < 0.3) ctx.particles.burst('jumpPuff', player.position, { count: 1, scale: 0.6 });
  }

  update(player: Player, ctx: GameContext, dt: number): void {
    super.update(player, ctx, dt);
    if (player.motor.grounded) {
      this.fuel = Math.min(this.options.maxFlyTime, this.fuel + this.options.rechargeRate * dt);
    }
  }

  hud() {
    const fraction = this.fuel / this.options.maxFlyTime;
    return { label: 'Flight', fraction, color: fraction > 0.3 ? '#44aaff' : '#ff4444' };
  }
}
