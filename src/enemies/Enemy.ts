import { Vector3 } from 'three';
import { TUNING } from '../config/tuning';
import type { GameContext } from '../core/GameContext';
import { CharacterMotor } from '../physics/CharacterMotor';
import { animateCreature } from '../rendering/animation';
import { BlockModel, ModelDef, buildModel } from '../rendering/ModelFactory';
import { Entity } from '../world/Entity';
import { Health } from '../world/components/Health';

export interface EnemyOptions {
  /** Shown on the boss health bar. */
  name: string;
  health: number;
  /** Score for defeating it. */
  points: number;
  radius: number;
  height: number;
  model: ModelDef;
  /** Damage for touching the player (default 1). */
  contactDamage?: number;
  /** 0 = flies (drones), 1 = normal gravity. */
  gravityScale?: number;
  boss?: boolean;
}

/**
 * Base class for every bad guy. Handles health, getting hit (white flash), dying (poof + score),
 * moving with physics, and basic animation.
 *
 * To make a new enemy: extend this and write `think()` — the enemy's brain, which runs
 * every tick and usually sets `this.motor.velocity` and `this.yaw`.
 * See types/rat.ts for the simplest example.
 */
export abstract class Enemy extends Entity {
  readonly name: string;
  readonly points: number;
  readonly model: BlockModel;
  motor!: CharacterMotor;
  /** Seconds this enemy has been alive. */
  age = 0;
  private flashTimer = 0;
  private options: EnemyOptions;
  private detour = new Vector3();
  private detourTime = 0;

  constructor(options: EnemyOptions, position: Vector3) {
    super('enemy');
    if (options.boss) this.tags.add('boss');
    this.options = options;
    this.name = options.name;
    this.points = options.points;
    this.team = 'enemy';
    this.health = new Health(options.health);
    this.hitbox = { radius: options.radius, height: options.height };
    this.contactDamage = options.contactDamage ?? 1;
    this.position.copy(position);

    this.model = buildModel(options.model);
    this.object3D.add(this.model.root);
  }

  get isBoss(): boolean {
    return this.hasTag('boss');
  }

  /** 0 at full health → 1 almost dead. Bosses get angrier (faster, more attacks) as this rises. */
  get anger(): number {
    return 1 - this.health!.fraction;
  }

  onAdded(ctx: GameContext): void {
    this.motor = new CharacterMotor(ctx.physics, this.position, {
      radius: this.options.radius,
      height: this.options.height,
      gravityScale: this.options.gravityScale ?? 1,
    });
    ctx.particles.burst('poof', this.getCenter(), { count: 12 });
  }

  onRemoved(): void {
    this.motor.dispose();
  }

  update(ctx: GameContext, dt: number): void {
    this.age += dt;
    this.think(ctx, dt);
    this.motor.move(dt);
    this.position.copy(this.motor.position);

    // Fell out of the level somehow — just remove it.
    if (this.position.y < TUNING.player.killY) this.destroy();

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.model.setFlash(this.flashTimer > 0 ? 1 : 0);
    }
    this.animate(ctx, dt);
  }

  /** The enemy's brain. Runs every tick. */
  protected abstract think(ctx: GameContext, dt: number): void;

  /** Default animation: legs/wings/arms. Override for special moves. */
  protected animate(_ctx: GameContext, _dt: number): void {
    const v = this.motor.velocity;
    animateCreature(this.model, { speed: Math.hypot(v.x, v.z), grounded: this.motor.grounded, time: this.age });
  }

  onDamaged(ctx: GameContext): void {
    this.flashTimer = TUNING.combat.hitFlashTime;
    this.model.setFlash(1);
    ctx.particles.burst('hit', this.getCenter());
  }

  onDeath(ctx: GameContext): void {
    const center = this.getCenter();
    ctx.particles.burst(this.isBoss ? 'bigExplosion' : 'poof', center, { scale: this.isBoss ? 1.5 : 1 });
    ctx.events.emit('enemyKilled', { enemy: this, points: this.points, position: center });
    if (this.isBoss) {
      ctx.events.emit('bossDefeated', { boss: this, position: center });
      ctx.events.emit('cameraShake', { strength: 0.8 });
    }
    this.destroy();
  }

  // ---------- Helpers for writing enemy brains ----------

  /** Flat distance to a point (ignores height). */
  flatDistanceTo(point: Vector3): number {
    return Math.hypot(point.x - this.position.x, point.z - this.position.z);
  }

  /**
   * Set velocity to walk toward a point at `speed` (keeps vertical velocity).
   * If something is in the way, it sidesteps for a moment to get around it.
   */
  protected moveToward(point: Vector3, speed: number): void {
    if (this.detourTime > 0) {
      this.detourTime -= TUNING.fixedStep;
      this.motor.velocity.x = this.detour.x * speed;
      this.motor.velocity.z = this.detour.z * speed;
      return;
    }
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) return this.stop();
    if (this.motor.blocked) {
      // Bumped into something: walk sideways (left or right at random) for a bit.
      const side = Math.random() < 0.5 ? 1 : -1;
      this.detour.set((-dz / len) * side, 0, (dx / len) * side);
      this.detourTime = 0.9;
      return;
    }
    this.motor.velocity.x = (dx / len) * speed;
    this.motor.velocity.z = (dz / len) * speed;
  }

  /** Stop moving sideways. */
  protected stop(): void {
    this.motor.velocity.x = 0;
    this.motor.velocity.z = 0;
  }

  /** Turn to face a point. `turnSpeed` in radians/sec (Infinity = instantly). */
  protected faceToward(point: Vector3, dt: number, turnSpeed = 8): void {
    const target = Math.atan2(point.x - this.position.x, point.z - this.position.z);
    let diff = target - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxStep = turnSpeed * dt;
    this.yaw += Math.abs(diff) <= maxStep ? diff : Math.sign(diff) * maxStep;
  }

  /** Flat unit vector this enemy is facing. */
  protected forward(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }
}
