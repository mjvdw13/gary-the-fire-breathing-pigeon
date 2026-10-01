import type { GameContext } from '../core/GameContext';
import type { Player } from '../player/Player';
import { Ability, AbilityTrigger } from './Ability';

/** Jump again in mid-air. Recharges when you land. (Gary and Fang) */
export class DoubleJump extends Ability {
  readonly name = 'Double Jump';
  readonly trigger: AbilityTrigger = { action: 'jump', mode: 'pressed', airOnly: true };
  private jumpsLeft: number;

  constructor(private extraJumps = 1) {
    super();
    this.jumpsLeft = extraJumps;
  }

  canActivate(): boolean {
    return this.jumpsLeft > 0;
  }

  protected activate(player: Player, ctx: GameContext): void {
    this.jumpsLeft--;
    player.motor.velocity.y = player.stats.jumpSpeed;
    ctx.particles.burst('jumpPuff', player.position);
    ctx.events.emit('playerJumped', { position: player.position.clone(), air: true });
  }

  onLand(): void {
    this.jumpsLeft = this.extraJumps;
  }
}
