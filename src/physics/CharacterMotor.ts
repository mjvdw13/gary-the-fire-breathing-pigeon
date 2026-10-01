import { Vector3 } from 'three';
import { TUNING } from '../config/tuning';
import { Layer, Physics, RAPIER, WORLD_ONLY, collisionGroups } from './Physics';

export interface MotorOptions {
  /** Capsule radius in meters. */
  radius: number;
  /** Total height in meters (feet to top of head). */
  height: number;
  /** 1 = normal gravity, 0 = floats (drones). */
  gravityScale?: number;
  /** Tallest ledge it can walk up without jumping. */
  stepHeight?: number;
}

/**
 * Moves a character around the level without going through walls or floors.
 * Used by the player AND by walking/flying enemies.
 *
 * You set `velocity` (meters/second), then call `move(dt)` once per update.
 * `position` is at the character's FEET.
 */
export class CharacterMotor {
  readonly velocity = new Vector3();
  readonly position = new Vector3();
  grounded = false;
  gravityScale: number;
  readonly radius: number;
  readonly height: number;

  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private controller: RAPIER.KinematicCharacterController;
  private halfHeight: number;

  constructor(private physics: Physics, feet: Vector3, options: MotorOptions) {
    this.radius = options.radius;
    this.height = Math.max(options.height, options.radius * 2);
    this.gravityScale = options.gravityScale ?? 1;
    this.halfHeight = this.height / 2;

    const world = physics.world;
    this.body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    const capsuleHalf = Math.max(this.halfHeight - this.radius, 0.01);
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(capsuleHalf, this.radius).setCollisionGroups(
        collisionGroups(Layer.CHARACTER, Layer.WORLD),
      ),
      this.body,
    );

    this.controller = world.createCharacterController(0.02);
    this.controller.enableAutostep(options.stepHeight ?? 0.35, 0.2, false);
    this.controller.enableSnapToGround(0.3);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setApplyImpulsesToDynamicBodies(false);

    this.teleport(feet);
  }

  /** Instantly put the character somewhere (respawns, spawning). */
  teleport(feet: Vector3): void {
    this.position.copy(feet);
    const c = this.centerOf(feet);
    this.body.setTranslation(c, true);
    this.body.setNextKinematicTranslation(c);
    this.collider.setTranslation(c);
    this.velocity.set(0, 0, 0);
  }

  /** Apply gravity and move by `velocity`, sliding along anything solid. */
  move(dt: number): void {
    this.velocity.y -= TUNING.gravity * this.gravityScale * dt;

    const desired = { x: this.velocity.x * dt, y: this.velocity.y * dt, z: this.velocity.z * dt };
    this.controller.computeColliderMovement(this.collider, desired, undefined, WORLD_ONLY);
    const actual = this.controller.computedMovement();

    this.position.x += actual.x;
    this.position.y += actual.y;
    this.position.z += actual.z;

    const c = this.centerOf(this.position);
    this.body.setNextKinematicTranslation(c);
    // Keep the collider in sync right away so another move() this tick starts from here.
    this.collider.setTranslation(c);

    this.grounded = this.controller.computedGrounded();
    if (this.grounded && this.velocity.y < 0) this.velocity.y = 0;
    // Bonked our head on a ceiling.
    if (desired.y > 0 && actual.y < desired.y * 0.5) this.velocity.y = Math.min(this.velocity.y, 0);
    // Hit a wall: stop pushing into it (prevents sticky walls).
    if (Math.abs(desired.x) > 1e-6 && Math.abs(actual.x) < Math.abs(desired.x) * 0.1) this.velocity.x = 0;
    if (Math.abs(desired.z) > 1e-6 && Math.abs(actual.z) < Math.abs(desired.z) * 0.1) this.velocity.z = 0;
  }

  /** True if the last move() was blocked sideways (walked into a wall). */
  get blocked(): boolean {
    for (let i = 0; i < this.controller.numComputedCollisions(); i++) {
      const hit = this.controller.computedCollision(i);
      if (hit && Math.abs(hit.normal1.y) < 0.5) return true;
    }
    return false;
  }

  dispose(): void {
    this.physics.world.removeCharacterController(this.controller);
    this.physics.removeBody(this.body);
  }

  private centerOf(feet: Vector3) {
    return { x: feet.x, y: feet.y + this.halfHeight, z: feet.z };
  }
}
