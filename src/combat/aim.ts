import { Vector3 } from 'three';
import type { GameContext } from '../core/GameContext';
import { rayVsCylinder } from '../world/components/shapes';
import { areEnemies, Team } from '../world/components/Team';

const MAX_AIM_DISTANCE = 120;

/**
 * Where is the crosshair pointing in the world?
 * Checks the level and every target on the other team, and returns the closest hit
 * (or a far-away point if the crosshair is pointing at the sky).
 */
export function crosshairTarget(ctx: GameContext, team: Team): Vector3 {
  const { origin, direction } = ctx.camera.aimRay();
  let best = MAX_AIM_DISTANCE;

  const wall = ctx.physics.raycast(origin, direction, MAX_AIM_DISTANCE);
  if (wall) best = wall.distance;

  for (const e of ctx.world.all()) {
    if (!e.hitbox || !e.health || !areEnemies(team, e.team)) continue;
    const d = rayVsCylinder(origin, direction, e.getHitCylinder()!, best);
    if (d !== null && d < best) best = d;
  }
  return origin.addScaledVector(direction, best);
}

/**
 * Velocity to throw something from `from` so it lands on `target`, moving sideways at
 * `speed` m/s while `gravity` pulls it down. Handy for enemies that throw things.
 */
export function lobVelocity(from: Vector3, target: Vector3, speed: number, gravity: number): Vector3 {
  const flat = new Vector3(target.x - from.x, 0, target.z - from.z);
  const distance = Math.max(flat.length(), 0.01);
  const time = distance / speed;
  const vy = (target.y - from.y) / time + 0.5 * gravity * time;
  return flat.normalize().multiplyScalar(speed).setY(vy);
}

/** Direction from `from` to `target`. Uses the camera direction if the target is too close to aim at. */
export function aimFrom(ctx: GameContext, from: Vector3, target: Vector3): Vector3 {
  const dir = target.clone().sub(from);
  if (dir.length() < 2) return ctx.camera.aimRay().direction;
  return dir.normalize();
}
