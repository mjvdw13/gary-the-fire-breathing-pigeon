import type { GameContext } from '../core/GameContext';
import { disposeObject } from '../rendering/ModelFactory';
import type { Entity, Tag } from './Entity';

/**
 * Holds every entity in the current game and updates them each tick.
 * Entities spawned during an update join the list right after that update.
 */
export class World {
  private entities: Entity[] = [];
  private spawned: Entity[] = [];

  /** Put an entity into the game. Returns it so you can write `const e = world.add(new Rat())`. */
  add<T extends Entity>(entity: T, ctx: GameContext): T {
    entity.previousPosition.copy(entity.position);
    entity.syncVisual(1);
    ctx.scene.add(entity.object3D);
    this.spawned.push(entity);
    entity.onAdded(ctx);
    return entity;
  }

  update(ctx: GameContext, dt: number): void {
    this.flushSpawned();
    for (const entity of this.entities) {
      if (!entity.alive) continue;
      entity.previousPosition.copy(entity.position);
      entity.update(ctx, dt);
    }
    this.flushSpawned();
  }

  /** Remove everything that was destroy()ed this tick. */
  removeDead(ctx: GameContext): void {
    let write = 0;
    for (const entity of this.entities) {
      if (entity.alive) {
        this.entities[write++] = entity;
      } else {
        this.removeNow(entity, ctx);
      }
    }
    this.entities.length = write;
  }

  /** Remove every entity (new level / restart). */
  clear(ctx: GameContext): void {
    this.flushSpawned();
    for (const entity of this.entities) this.removeNow(entity, ctx);
    this.entities = [];
  }

  /** All living entities with a tag. */
  *withTag(tag: Tag): Iterable<Entity> {
    for (const e of this.all()) if (e.alive && e.tags.has(tag)) yield e;
  }

  countTag(tag: Tag): number {
    let n = 0;
    for (const _ of this.withTag(tag)) n++;
    return n;
  }

  /** Every living entity (including ones spawned this tick). */
  *all(): Iterable<Entity> {
    for (const e of this.entities) if (e.alive) yield e;
    for (const e of this.spawned) if (e.alive) yield e;
  }

  syncVisuals(alpha: number): void {
    for (const e of this.entities) e.syncVisual(alpha);
  }

  private flushSpawned(): void {
    if (this.spawned.length === 0) return;
    this.entities.push(...this.spawned);
    this.spawned = [];
  }

  private removeNow(entity: Entity, ctx: GameContext): void {
    entity.alive = false;
    entity.onRemoved(ctx);
    ctx.scene.remove(entity.object3D);
    disposeObject(entity.object3D);
  }
}
