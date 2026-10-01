import type { GameContext } from '../core/GameContext';
import type { Entity } from '../world/Entity';
import { cylinderVsCylinder, overlapsCylinder, sphereVsCylinder } from '../world/components/shapes';
import { areEnemies } from '../world/components/Team';
import { Projectile } from './projectiles/Projectile';

/**
 * Deals damage. Runs once per tick and checks three things:
 *   1. projectiles touching someone on the other team
 *   2. hazards (sweeps, slams, shockwaves) touching someone on the other team
 *   3. bodies touching (contactDamage)
 *
 * It never checks WHICH enemy something is — only teams, hitboxes and health.
 * That's why new enemies work without touching this file.
 */
export class CombatSystem {
  update(ctx: GameContext): void {
    const targets = [...ctx.world.all()].filter((e) => e.health && e.hitbox && e.team && !e.health.isDead);

    // 1. Projectiles
    for (const e of ctx.world.withTag('projectile')) {
      if (!(e instanceof Projectile)) continue;
      const sphere = { kind: 'sphere' as const, center: e.position, radius: e.radius };
      for (const target of targets) {
        if (!e.alive) break;
        if (!areEnemies(e.team, target.team) || e.hitIds.has(target.id)) continue;
        if (sphereVsCylinder(sphere, target.getHitCylinder()!)) {
          applyDamage(ctx, target, e.damage);
          e.onHitTarget(ctx, target);
        }
      }
    }

    for (const source of ctx.world.all()) {
      // 2. Hazards
      for (const hazard of source.hazards) {
        if (!hazard.active) continue;
        for (const target of targets) {
          if (!areEnemies(hazard.team, target.team)) continue;
          if (hazard.hitOnce && hazard.alreadyHit.has(target.id)) continue;
          if (overlapsCylinder(hazard.shape, target.getHitCylinder()!)) {
            if (applyDamage(ctx, target, hazard.damage) || target.health!.isInvincible) {
              hazard.alreadyHit.add(target.id);
            }
          }
        }
      }

      // 3. Touching
      if (source.contactDamage > 0 && source.hitbox && source.team && !source.health?.isDead) {
        const body = source.getHitCylinder()!;
        for (const target of targets) {
          if (target === source || !areEnemies(source.team, target.team)) continue;
          // Only the enemy team does contact damage (bumping enemies as the player doesn't hurt them).
          if (source.team !== 'enemy') continue;
          if (cylinderVsCylinder(body, target.getHitCylinder()!)) applyDamage(ctx, target, source.contactDamage);
        }
      }
    }
  }
}

/**
 * Hurt something. Returns true if the damage landed.
 * Use this anywhere you need to deal damage so god mode, i-frames, events and death all work.
 */
export function applyDamage(ctx: GameContext, target: Entity, amount: number): boolean {
  if (!target.health || target.health.isDead) return false;
  if (target.hasTag('player') && ctx.godMode) return false;
  if (!target.health.takeDamage(amount)) return false;

  target.onDamaged(ctx, amount);
  ctx.events.emit('entityDamaged', { entity: target, amount });
  if (target.health.isDead) target.onDeath(ctx);
  return true;
}
