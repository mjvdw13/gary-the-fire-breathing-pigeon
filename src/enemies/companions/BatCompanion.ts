import { Vector3 } from 'three';
import { PROJECTILES } from '../../combat/projectiles/definitions';
import { Projectile } from '../../combat/projectiles/Projectile';
import type { GameContext } from '../../core/GameContext';
import { dampAngle } from '../../core/math';
import { animateCreature } from '../../rendering/animation';
import { BlockModel, buildModel } from '../../rendering/ModelFactory';
import { batModel } from '../../player/characters/violet';
import { Entity } from '../../world/Entity';
import { areEnemies } from '../../world/components/Team';

/**
 * A little bat friend who follows the player and zaps the nearest enemy with lasers.
 * Unlocked by beating the Chapter 1 boss. It can't be hurt.
 */
export class BatCompanion extends Entity {
  private model: BlockModel;
  private shootTimer = 0;
  private readonly shootInterval = 0.5;
  private readonly range = 22;
  private age = 0;
  private aimYaw: number | null = null;

  constructor(position: Vector3) {
    super('companion');
    this.team = 'player';
    this.position.copy(position);
    this.model = buildModel({ ...batModel, scale: 0.55 });
    this.object3D.add(this.model.root);
  }

  update(ctx: GameContext, dt: number): void {
    this.age += dt;
    const player = ctx.player;
    if (!player) return;

    // Hover just behind the player's shoulder.
    const offset = new Vector3(-0.9, 1.7 + Math.sin(this.age * 3) * 0.15, -0.6).applyAxisAngle(UP, player.yaw);
    const target = player.position.clone().add(offset);
    this.position.lerp(target, 1 - Math.exp(-6 * dt));

    const enemy = this.findTarget(ctx);
    this.shootTimer += dt;
    if (enemy && this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      const from = this.position.clone().setY(this.position.y + 0.4);
      const dir = enemy.getCenter().sub(from).normalize();
      ctx.world.add(new Projectile(PROJECTILES.get('laser'), 'player', from, dir), ctx);
      this.aimYaw = Math.atan2(dir.x, dir.z);
    }
    const wantYaw = enemy && this.aimYaw !== null ? this.aimYaw : player.yaw;
    this.yaw = dampAngle(this.yaw, wantYaw, 10, dt);

    animateCreature(this.model, { speed: 0, grounded: false, flying: true, time: this.age });
  }

  private findTarget(ctx: GameContext): Entity | null {
    let best: Entity | null = null;
    let bestDist = this.range;
    for (const e of ctx.world.all()) {
      if (!e.health || e.health.isDead || !e.hitbox || !areEnemies(this.team, e.team)) continue;
      const d = e.position.distanceTo(this.position);
      if (d < bestDist) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }
}

const UP = new Vector3(0, 1, 0);
