import type { GameContext } from '../core/GameContext';
import type { Player } from '../player/Player';
import { Ability, AbilityTrigger } from './Ability';

export interface DashOptions {
  /** m/s during the dash. 2D: 800 px/s */
  speed: number;
  /** Seconds the dash lasts. */
  duration: number;
  cooldown: number;
}

/** A super-fast burst in the direction you're moving (or facing). (Fang) */
export class Dash extends Ability {
  readonly name = 'Dash';
  readonly trigger: AbilityTrigger = { action: 'special', mode: 'pressed' };

  constructor(private options: DashOptions) {
    super();
    this.cooldown = options.cooldown;
  }

  protected activate(player: Player, ctx: GameContext): void {
    const dir = player.moveDirection.lengthSq() > 0 ? player.moveDirection.clone() : player.facingVector();
    player.startDash(dir.multiplyScalar(this.options.speed), this.options.duration);
    ctx.particles.burst('sparks', player.getCenter(), { count: 12 });
    ctx.events.emit('playerDashed', { position: player.position.clone() });
  }

  update(player: Player, ctx: GameContext, dt: number): void {
    super.update(player, ctx, dt);
    if (player.isDashing) ctx.particles.burst('sparks', player.getCenter(), { count: 2 });
  }

  hud() {
    const fraction = this.cooldown > 0 ? 1 - this.cooldownLeft / this.cooldown : 1;
    return { label: 'Dash', fraction, color: fraction >= 1 ? '#7fd4ff' : '#557788' };
  }
}
