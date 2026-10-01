import { Vector3 } from 'three';
import { TUNING } from '../config/tuning';
import type { GameContext } from '../core/GameContext';
import { ENEMIES } from '../enemies';

/**
 * Puts enemies into the level at good spots: on the ground (or up in the air for
 * flyers), never right on top of the player. Bosses appear at the level's boss spawn.
 */
export function spawnEnemy(ctx: GameContext, id: string): void {
  const def = ENEMIES.get(id);
  const enemy = def.create(new Vector3());
  const { radius, height } = enemy.hitbox!;
  const air = def.spawn === 'air';

  let position = def.spawn === 'boss' ? ctx.level.def.bossSpawn.clone() : findSpawnPoint(ctx, air);
  // Don't spawn inside a wall, beam or crate — try other spots until one is clear.
  for (let tries = 0; tries < 30 && !ctx.physics.isSpaceFree(position, radius, height); tries++) {
    position = findSpawnPoint(ctx, air);
  }
  enemy.position.copy(position);
  ctx.world.add(enemy, ctx);
}

function findSpawnPoint(ctx: GameContext, air: boolean): Vector3 {
  const level = ctx.level;
  const player = ctx.player?.position;
  let best = level.randomPoint(ctx.random, 3);
  let bestDist = -1;
  // Try a few random spots and keep the one farthest from the player (if none is far enough).
  for (let i = 0; i < 12; i++) {
    const p = level.randomPoint(ctx.random, 3);
    const d = player ? Math.hypot(p.x - player.x, p.z - player.z) : Infinity;
    if (d >= TUNING.waves.minSpawnDistance) {
      best = p;
      break;
    }
    if (d > bestDist) {
      best = p;
      bestDist = d;
    }
  }

  if (air) {
    const [lo, hi] = level.def.airHeight;
    best.y = lo + ctx.random() * (hi - lo);
  } else {
    best.y = level.groundHeightAt(ctx, best.x, best.z) + 0.1;
  }
  return best;
}
