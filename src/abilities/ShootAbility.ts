import { Vector3 } from 'three';
import { aimFrom, crosshairTarget } from '../combat/aim';
import { PROJECTILES } from '../combat/projectiles/definitions';
import { Projectile } from '../combat/projectiles/Projectile';
import { TUNING } from '../config/tuning';
import type { GameContext } from '../core/GameContext';
import type { Player } from '../player/Player';
import { Ability, AbilityTrigger } from './Ability';

export interface ShootOptions {
  name: string;
  /** Id from combat/projectiles/definitions.ts */
  projectile: string;
  /** Seconds between shots. */
  cooldown: number;
  /** How many projectiles per shot (Quacks fires 3). */
  count?: number;
  /** Angle between projectiles in radians when count > 1. */
  spread?: number;
}

/**
 * Fires projectiles toward the crosshair. One class for every shooter —
 * fireballs, lasers, lightning and feathers are just different options.
 *
 *   new ShootAbility({ name: 'Fire Breath', projectile: 'fireball', cooldown: 0.3 })
 */
export class ShootAbility extends Ability {
  readonly name: string;
  readonly trigger: AbilityTrigger = { action: 'fire', mode: 'held' };

  constructor(private options: ShootOptions) {
    super();
    this.name = options.name;
    this.cooldown = options.cooldown;
  }

  protected activate(player: Player, ctx: GameContext): void {
    const def = PROJECTILES.get(this.options.projectile);
    // Turn toward the crosshair first, then fire from the beak/mouth.
    const target = crosshairTarget(ctx, 'player');
    player.faceDirection(target.clone().sub(player.position));
    player.onShoot();
    const muzzle = player.muzzlePosition();
    const aim = aimFrom(ctx, muzzle, target);

    const count = this.options.count ?? 1;
    const spread = this.options.spread ?? 0;
    const damage = def.damage * (ctx.godMode ? TUNING.combat.godModeDamageMultiplier : 1);
    for (let i = 0; i < count; i++) {
      const angle = (i - (count - 1) / 2) * spread;
      const dir = aim.clone().applyAxisAngle(UP, angle);
      ctx.world.add(new Projectile(def, 'player', muzzle, dir, { damage, golden: ctx.godMode }), ctx);
    }
    ctx.events.emit('projectileFired', { kind: def.id, position: muzzle.clone(), team: 'player' });
  }
}

const UP = new Vector3(0, 1, 0);
