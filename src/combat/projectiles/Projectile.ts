import { Quaternion, Vector3 } from 'three';
import type { GameContext } from '../../core/GameContext';
import type { ParticlePresetName } from '../../rendering/effects/presets';
import { BlockModel, ModelDef, buildModel } from '../../rendering/ModelFactory';
import { Entity } from '../../world/Entity';
import { areEnemies, Team } from '../../world/components/Team';

/**
 * Everything about a kind of projectile, as plain data.
 * Add new ones in definitions.ts — no new class needed.
 */
export interface ProjectileDef {
  id: string;
  /** Meters per second. */
  speed: number;
  damage: number;
  /** Size of the hit sphere in meters. */
  radius: number;
  /** Seconds before it disappears on its own. */
  lifetime: number;
  /** Downward pull in m/s² (0 = flies straight like a laser). */
  gravity?: number;
  /** How many times it bounces off walls/floors before popping. */
  bounces?: number;
  /** Speed kept after a bounce (0..1). */
  bounciness?: number;
  /** Curves toward the nearest target. */
  homing?: { turnRate: number; range: number };
  model: ModelDef;
  /** Point the model in the direction of travel (lasers, nails, feathers). */
  alignToVelocity?: boolean;
  /** Spin the model (radians per second). */
  spin?: number;
  trail?: ParticlePresetName;
  /** Trail used when the player is in god mode. */
  goldTrail?: ParticlePresetName;
  impact?: ParticlePresetName;
  /** Keeps flying after hitting someone. */
  piercing?: boolean;
}

const FORWARD = new Vector3(0, 0, 1);
const tmp = new Vector3();

/** A flying thing that damages the other team: fireballs, lasers, hairballs, nails... */
export class Projectile extends Entity {
  readonly velocity: Vector3;
  damage: number;
  private age = 0;
  private bouncesLeft: number;
  private model: BlockModel;
  private target: Entity | null = null;
  private golden: boolean;
  /** Entities this projectile has already hit (for piercing projectiles). */
  readonly hitIds = new Set<number>();

  constructor(
    readonly def: ProjectileDef,
    team: Team,
    position: Vector3,
    direction: Vector3,
    options: { damage?: number; golden?: boolean } = {},
  ) {
    super('projectile');
    this.team = team;
    this.position.copy(position);
    this.velocity = direction.clone().normalize().multiplyScalar(def.speed);
    this.damage = options.damage ?? def.damage;
    this.golden = options.golden ?? false;
    this.bouncesLeft = def.bounces ?? 0;
    this.model = buildModel(def.model);
    this.object3D.add(this.model.root);
    if (this.golden) this.model.setTint('#ffd700');
  }

  get radius(): number {
    return this.def.radius;
  }

  update(ctx: GameContext, dt: number): void {
    this.age += dt;
    if (this.age > this.def.lifetime) {
      this.destroy();
      return;
    }

    if (this.def.homing) this.steerTowardTarget(ctx, dt);
    if (this.def.gravity) this.velocity.y -= this.def.gravity * dt;

    // Check the level geometry along the path we're about to travel.
    const stepLength = this.velocity.length() * dt;
    const dir = tmp.copy(this.velocity).normalize();
    const hit = ctx.physics.raycast(this.position, dir, stepLength + this.radius);
    if (hit) {
      if (this.bouncesLeft > 0) {
        this.bouncesLeft--;
        this.position.copy(hit.point).addScaledVector(hit.normal, this.radius + 0.01);
        const vn = this.velocity.dot(hit.normal);
        this.velocity.addScaledVector(hit.normal, -2 * vn).multiplyScalar(this.def.bounciness ?? 0.8);
      } else {
        this.position.copy(hit.point);
        this.explode(ctx);
        return;
      }
    } else {
      this.position.addScaledVector(this.velocity, dt);
    }

    const trail = this.golden && this.def.goldTrail ? this.def.goldTrail : this.def.trail;
    if (trail) ctx.particles.burst(trail, this.position);
  }

  /** Called by the CombatSystem when this hits a target. */
  onHitTarget(ctx: GameContext, target: Entity): void {
    this.hitIds.add(target.id);
    if (!this.def.piercing) this.explode(ctx);
  }

  explode(ctx: GameContext): void {
    if (this.def.impact) ctx.particles.burst(this.def.impact, this.position);
    ctx.events.emit('projectileHit', { kind: this.def.id, position: this.position.clone() });
    this.destroy();
  }

  syncVisual(alpha: number): void {
    this.object3D.position.lerpVectors(this.previousPosition, this.position, alpha);
    if (this.def.alignToVelocity && this.velocity.lengthSq() > 0) {
      this.object3D.quaternion.setFromUnitVectors(FORWARD, tmp.copy(this.velocity).normalize());
    }
    if (this.def.spin) {
      this.model.root.rotation.x = this.age * this.def.spin;
      this.model.root.rotation.y = this.age * this.def.spin * 0.7;
    }
  }

  private steerTowardTarget(ctx: GameContext, dt: number): void {
    const homing = this.def.homing!;
    if (!this.target || !this.target.alive) this.target = this.findTarget(ctx, homing.range);
    if (!this.target) return;

    const speed = this.velocity.length();
    const current = this.velocity.clone().normalize();
    const desired = this.target.getCenter().sub(this.position).normalize();
    const angle = current.angleTo(desired);
    if (angle < 1e-4) return;
    const t = Math.min(1, (homing.turnRate * dt) / angle);
    // Rotate a bit toward the target each tick.
    const q = new Quaternion().setFromUnitVectors(current, desired);
    const partial = new Quaternion().slerp(q, t);
    this.velocity.copy(current.applyQuaternion(partial).multiplyScalar(speed));
  }

  private findTarget(ctx: GameContext, range: number): Entity | null {
    let best: Entity | null = null;
    let bestDist = range;
    const heading = this.velocity.clone().normalize();
    for (const e of ctx.world.all()) {
      if (!e.health || !e.hitbox || !areEnemies(this.team, e.team) || e.health.isDead) continue;
      const toTarget = e.getCenter().sub(this.position);
      const d = toTarget.length();
      // Only lock on to things roughly in front of us.
      if (d < bestDist && toTarget.normalize().dot(heading) > 0.2) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }
}
