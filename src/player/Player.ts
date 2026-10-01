import { MathUtils, Vector3 } from 'three';
import type { Ability } from '../abilities/Ability';
import { applyDamage } from '../combat/CombatSystem';
import { TUNING } from '../config/tuning';
import type { GameContext } from '../core/GameContext';
import { dampAngle } from '../core/math';
import { CharacterMotor } from '../physics/CharacterMotor';
import { animateCreature } from '../rendering/animation';
import { BlockModel, buildModel } from '../rendering/ModelFactory';
import { Entity } from '../world/Entity';
import { Health } from '../world/components/Health';
import type { CharacterDef, CharacterStats } from './CharacterDef';

/**
 * The bird you control. Turns keyboard/mouse input into movement, and runs the
 * character's abilities. Everything character-specific comes from its CharacterDef.
 */
export class Player extends Entity {
  motor!: CharacterMotor;
  readonly model: BlockModel;
  readonly abilities: Ability[];
  readonly stats: CharacterStats;
  /** Flat direction the player is trying to move (length 0 or 1). */
  readonly moveDirection = new Vector3();
  /** True while an ability is making us fly this tick. */
  flying = false;

  private dashVelocity: Vector3 | null = null;
  private dashTimeLeft = 0;
  /** After shooting, keep facing the aim direction for a moment (strafe while shooting). */
  private aimHoldTime = 0;
  private wasGrounded = true;
  private animTime = 0;

  constructor(
    readonly def: CharacterDef,
    spawn: Vector3,
  ) {
    super('player');
    this.team = 'player';
    this.stats = { ...def.stats };
    this.health = new Health(TUNING.player.maxHealth, TUNING.player.invincibleTime);
    this.hitbox = { radius: def.stats.radius, height: def.stats.height };
    this.abilities = def.abilities();
    this.position.copy(spawn);

    this.model = buildModel(def.model);
    this.object3D.add(this.model.root);
  }

  onAdded(ctx: GameContext): void {
    this.motor = new CharacterMotor(ctx.physics, this.position, {
      radius: this.stats.radius,
      height: this.stats.height,
    });
  }

  onRemoved(): void {
    this.motor.dispose();
  }

  get isDashing(): boolean {
    return this.dashTimeLeft > 0;
  }

  update(ctx: GameContext, dt: number): void {
    if (this.health!.isDead) {
      // Knocked out: no more controls, just drop to the ground.
      this.motor.velocity.x = this.motor.velocity.z = 0;
      this.motor.move(dt);
      this.position.copy(this.motor.position);
      this.model.setVisible(false);
      return;
    }
    this.health!.update(dt);
    this.aimHoldTime = Math.max(0, this.aimHoldTime - dt);
    this.flying = false;

    this.readMovementInput(ctx);
    this.applyHorizontalMovement(dt);

    // Ground jump
    let jumpedThisTick = false;
    if (ctx.input.pressed('jump') && this.motor.grounded) {
      this.motor.velocity.y = this.stats.jumpSpeed;
      jumpedThisTick = true;
      ctx.events.emit('playerJumped', { position: this.position.clone(), air: false });
    }

    // Abilities
    for (const ability of this.abilities) ability.update(this, ctx, dt);
    for (const ability of this.abilities) {
      const t = ability.trigger;
      const triggered = t.mode === 'pressed' ? ctx.input.pressed(t.action) : ctx.input.isDown(t.action);
      if (!triggered) continue;
      if (t.airOnly && (this.motor.grounded || jumpedThisTick)) continue;
      ability.tryActivate(this, ctx, dt);
    }

    this.motor.move(dt);
    this.position.copy(this.motor.position);

    if (this.motor.grounded && !this.wasGrounded) {
      for (const ability of this.abilities) ability.onLand(this);
      ctx.events.emit('playerLanded', { position: this.position.clone() });
    }
    this.wasGrounded = this.motor.grounded;

    // Fell off the world
    if (this.position.y < TUNING.player.killY) {
      this.motor.teleport(ctx.level.def.playerSpawn);
      this.position.copy(this.motor.position);
      this.previousPosition.copy(this.position);
      applyDamage(ctx, this, 1);
    }

    this.updateVisuals(ctx, dt);
  }

  onDamaged(ctx: GameContext): void {
    ctx.particles.burst('playerHurt', this.getCenter());
    ctx.events.emit('playerDamaged', { health: this.health!.current, maxHealth: this.health!.max });
    ctx.events.emit('cameraShake', { strength: 0.35 });
  }

  onDeath(ctx: GameContext): void {
    // The player isn't removed — the game flow shows the Game Over screen.
    ctx.particles.burst('bigExplosion', this.getCenter(), { scale: 0.6 });
    ctx.events.emit('playerDied', { position: this.position.clone() });
  }

  /** Turn to face a direction right away (used when shooting). */
  faceDirection(dir: Vector3): void {
    if (dir.x === 0 && dir.z === 0) return;
    this.yaw = Math.atan2(dir.x, dir.z);
  }

  /** Called by shooting abilities. */
  onShoot(): void {
    this.aimHoldTime = 0.6;
  }

  /** Flat unit vector the player is facing. */
  facingVector(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  /** World position projectiles come out of. */
  muzzlePosition(): Vector3 {
    const [x, y, z] = this.def.muzzle;
    return new Vector3(x, y, z).applyAxisAngle(UP, this.yaw).add(this.position);
  }

  /** Used by the Dash ability: move at `velocity` for `duration` seconds, ignoring input. */
  startDash(velocity: Vector3, duration: number): void {
    this.dashVelocity = velocity;
    this.dashTimeLeft = duration;
    this.faceDirection(velocity);
  }

  /** Put the player back at full health somewhere (new chapter). */
  respawn(at: Vector3): void {
    this.position.copy(at);
    this.previousPosition.copy(at);
    this.motor.teleport(at);
    this.health!.reset();
  }

  private readMovementInput(ctx: GameContext): void {
    const axis = ctx.input.moveAxis();
    const forward = ctx.camera.forward();
    const right = ctx.camera.right();
    this.moveDirection.set(0, 0, 0).addScaledVector(forward, axis.y).addScaledVector(right, axis.x);
    if (this.moveDirection.lengthSq() > 0) this.moveDirection.normalize();
  }

  private applyHorizontalMovement(dt: number): void {
    const v = this.motor.velocity;
    if (this.dashTimeLeft > 0 && this.dashVelocity) {
      this.dashTimeLeft -= dt;
      v.x = this.dashVelocity.x;
      v.z = this.dashVelocity.z;
      v.y = Math.max(v.y, 0); // air-dash stays level
      return;
    }
    const target = this.moveDirection.clone().multiplyScalar(this.stats.moveSpeed);
    const accel = TUNING.player.acceleration;
    v.x = MathUtils.damp(v.x, target.x, accel, dt);
    v.z = MathUtils.damp(v.z, target.z, accel, dt);

    // Turn to face where we're going (unless we just shot something).
    if (this.moveDirection.lengthSq() > 0 && this.aimHoldTime <= 0) {
      const targetYaw = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      this.yaw = dampAngle(this.yaw, targetYaw, TUNING.player.turnSpeed, dt);
    }
  }

  private updateVisuals(ctx: GameContext, dt: number): void {
    this.animTime += dt;
    const v = this.motor.velocity;
    animateCreature(this.model, {
      speed: Math.hypot(v.x, v.z),
      grounded: this.motor.grounded,
      flying: this.flying,
      time: this.animTime,
    });
    this.model.setTint(ctx.godMode ? '#ffd700' : null);
    // Blink while invincible after a hit.
    const h = this.health!;
    this.model.setVisible(!h.isInvincible || Math.floor(h.invincibleTimer * 12) % 2 === 0);
  }
}

const UP = new Vector3(0, 1, 0);
