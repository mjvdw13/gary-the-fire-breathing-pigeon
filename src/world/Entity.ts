import { Group, Vector3 } from 'three';
import type { GameContext } from '../core/GameContext';
import type { Hazard } from './components/Hazard';
import type { Health } from './components/Health';
import type { Cylinder } from './components/shapes';
import type { Team } from './components/Team';

/** Labels for finding groups of entities, e.g. world.withTag('enemy'). Add your own! */
export type Tag = 'player' | 'enemy' | 'boss' | 'projectile' | 'companion' | 'platform' | (string & {});

/**
 * Base class for everything that lives in the game world and updates every tick:
 * the player, enemies, projectiles, clouds, companions...
 *
 * Optional "components" switch on shared behavior handled elsewhere:
 *  - health + team + hitbox → can be damaged by the CombatSystem
 *  - hazards               → damage the other team when touching them
 *  - contactDamage         → hurts the other team just by touching
 */
export abstract class Entity {
  private static nextId = 1;
  readonly id = Entity.nextId++;
  readonly tags = new Set<Tag>();

  /** Everything you see for this entity. Added to the scene automatically. */
  readonly object3D = new Group();

  /** Where the entity is in the game (at its feet for characters). */
  readonly position = new Vector3();
  /** Where it was last tick — used to draw smooth motion between ticks. */
  readonly previousPosition = new Vector3();
  /** Which way it faces, in radians around the vertical axis. 0 = facing +Z. */
  yaw = 0;

  /** Set to false (via destroy()) and the World removes it at the end of the tick. */
  alive = true;

  // --- Optional combat components ---
  health?: Health;
  team?: Team;
  /** Size of the "can be hit" cylinder, standing on `position`. */
  hitbox?: { radius: number; height: number };
  hazards: Hazard[] = [];
  /** Damage dealt to the other team by bumping into this entity. */
  contactDamage = 0;

  constructor(...tags: Tag[]) {
    for (const tag of tags) this.tags.add(tag);
  }

  /** Called once when added to the world. Create physics bodies etc. here. */
  onAdded(_ctx: GameContext): void {}

  /** Called every fixed tick (60/sec). */
  update(_ctx: GameContext, _dt: number): void {}

  /** Called once when removed. Free physics bodies etc. here. */
  onRemoved(_ctx: GameContext): void {}

  /** Called by the CombatSystem after this entity loses health. */
  onDamaged(_ctx: GameContext, _amount: number): void {}

  /** Called by the CombatSystem when health reaches 0. Default: disappear. */
  onDeath(_ctx: GameContext): void {
    this.destroy();
  }

  /** Remove this entity at the end of the tick. */
  destroy(): void {
    this.alive = false;
  }

  hasTag(tag: Tag): boolean {
    return this.tags.has(tag);
  }

  /** The hitbox as a world-space cylinder (or null if this can't be hit). */
  getHitCylinder(): Cylinder | null {
    if (!this.hitbox) return null;
    return { kind: 'cylinder', base: this.position, radius: this.hitbox.radius, height: this.hitbox.height };
  }

  /** The middle of the hitbox — good for aiming at and spawning effects. */
  getCenter(target = new Vector3()): Vector3 {
    const h = this.hitbox?.height ?? 0;
    return target.copy(this.position).setY(this.position.y + h / 2);
  }

  /** Move the visible model to match the game position, blending between ticks. */
  syncVisual(alpha: number): void {
    this.object3D.position.lerpVectors(this.previousPosition, this.position, alpha);
    this.object3D.rotation.y = this.yaw;
  }
}
