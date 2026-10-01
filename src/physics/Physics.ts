import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { TUNING } from '../config/tuning';

export { RAPIER };

/** Must be awaited once before creating a Physics world. */
export async function initPhysics(): Promise<void> {
  await RAPIER.init();
}

/**
 * Collision layers. Characters only bump into WORLD things (floors, walls, platforms) —
 * they pass through each other, and damage is handled by the combat system instead.
 */
export const Layer = {
  WORLD: 0x0001,
  CHARACTER: 0x0002,
  ALL: 0xffff,
} as const;

/** Pack "what I am" + "what I hit" into Rapier's collision-group number. */
export function collisionGroups(memberOf: number, collidesWith: number): number {
  return ((memberOf << 16) | collidesWith) >>> 0;
}

/** Query filter that only sees level geometry. */
export const WORLD_ONLY = collisionGroups(Layer.ALL, Layer.WORLD);

export interface RayHit {
  distance: number;
  point: Vector3;
  normal: Vector3;
}

/**
 * Thin wrapper around the Rapier physics world.
 * Level geometry = static colliders. Characters = kinematic capsules (see CharacterMotor).
 */
export class Physics {
  readonly world: RAPIER.World;

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -TUNING.gravity, z: 0 });
    this.world.timestep = TUNING.fixedStep;
  }

  /** Advance the physics world one fixed step (also refreshes collision queries). */
  step(): void {
    this.world.step();
  }

  /** Add a solid, unmoving box (floor, wall, crate...). `rotationY` in radians. */
  addStaticBox(center: Vector3, size: Vector3, rotationY = 0): RAPIER.Collider {
    const desc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
      .setTranslation(center.x, center.y, center.z)
      .setCollisionGroups(collisionGroups(Layer.WORLD, Layer.ALL));
    if (rotationY !== 0) {
      const half = rotationY / 2;
      desc.setRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
    }
    return this.world.createCollider(desc);
  }

  /** Add a solid, unmoving cylinder (pipes, cloud platforms, tanks...). */
  addStaticCylinder(center: Vector3, radius: number, height: number): RAPIER.Collider {
    const desc = RAPIER.ColliderDesc.cylinder(height / 2, radius)
      .setTranslation(center.x, center.y, center.z)
      .setCollisionGroups(collisionGroups(Layer.WORLD, Layer.ALL));
    return this.world.createCollider(desc);
  }

  removeCollider(collider: RAPIER.Collider): void {
    this.world.removeCollider(collider, false);
  }

  removeBody(body: RAPIER.RigidBody): void {
    this.world.removeRigidBody(body);
  }

  /** Shoot a ray against level geometry. `direction` must be normalized. */
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RayHit | null {
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRayAndGetNormal(ray, maxDistance, true, undefined, WORLD_ONLY);
    if (!hit) return null;
    const distance = hit.timeOfImpact;
    return {
      distance,
      point: origin.clone().addScaledVector(direction, distance),
      normal: new Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
    };
  }

  /** Is there room for a character of this size standing at `feet`? (Nothing solid in the way.) */
  isSpaceFree(feet: Vector3, radius: number, height: number): boolean {
    const half = Math.max(height / 2 - radius, 0.01);
    let blocked = false;
    this.world.intersectionsWithShape(
      { x: feet.x, y: feet.y + height / 2, z: feet.z },
      { x: 0, y: 0, z: 0, w: 1 },
      new RAPIER.Capsule(half, radius),
      () => {
        blocked = true;
        return false; // stop searching
      },
      undefined,
      WORLD_ONLY,
    );
    return !blocked;
  }

  /** Free everything. The world can't be used after this. */
  dispose(): void {
    this.world.free();
  }
}
