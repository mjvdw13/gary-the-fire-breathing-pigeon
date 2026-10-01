import { Group, Vector3 } from 'three';
import type { GameContext } from '../core/GameContext';
import type { RAPIER } from '../physics/Physics';
import { buildModel, disposeObject, PartDef } from '../rendering/ModelFactory';
import type { LevelDef } from './LevelDef';
import { FadingCloud } from './props/FadingCloud';
import { PROPS } from './props';

const UP = new Vector3(0, 1, 0);

/** A built level: its meshes, its colliders, and helpers for finding spots in it. */
export class Level {
  readonly root = new Group();
  private colliders: RAPIER.Collider[] = [];

  constructor(readonly def: LevelDef) {}

  /** A random spot on the floor (y = 0), at least `margin` meters from the edge. */
  randomPoint(random: () => number, margin = 2): Vector3 {
    const hw = this.def.width / 2 - margin;
    const hd = this.def.depth / 2 - margin;
    return new Vector3((random() * 2 - 1) * hw, 0, (random() * 2 - 1) * hd);
  }

  /** Height of whatever is under (x, z) — floor, crate, platform... */
  groundHeightAt(ctx: GameContext, x: number, z: number): number {
    const hit = ctx.physics.raycast(new Vector3(x, 60, z), new Vector3(0, -1, 0), 120);
    return hit ? hit.point.y : 0;
  }

  /** @internal used by buildLevel */
  addCollider(c: RAPIER.Collider): void {
    this.colliders.push(c);
  }

  dispose(ctx: GameContext): void {
    for (const c of this.colliders) ctx.physics.removeCollider(c);
    this.colliders = [];
    ctx.scene.remove(this.root);
    disposeObject(this.root);
  }
}

/**
 * Turn a LevelDef into real meshes + colliders, and spawn its clouds.
 * Called by the Game when a chapter starts.
 */
export function buildLevel(def: LevelDef, ctx: GameContext): Level {
  const level = new Level(def);
  ctx.level = level;
  const { physics } = ctx;
  const hw = def.width / 2;
  const hd = def.depth / 2;

  const blockParts: PartDef[] = [];
  const addBlock = (pos: [number, number, number], size: [number, number, number], color: string, rotY = 0, collide = true) => {
    blockParts.push({ pos, size, color, rot: rotY ? [0, rotY, 0] : undefined });
    if (collide) level.addCollider(physics.addStaticBox(new Vector3(...pos), new Vector3(...size), rotY));
  };

  // Floor
  addBlock([0, -0.5, 0], [def.width + 2, 1, def.depth + 2], def.floorColor);

  // Edge walls (visible)
  const t = 0.6;
  const h = def.edge.height;
  addBlock([0, h / 2, -hd - t / 2], [def.width + 2 * t, h, t], def.edge.color);
  addBlock([0, h / 2, hd + t / 2], [def.width + 2 * t, h, t], def.edge.color);
  addBlock([-hw - t / 2, h / 2, 0], [t, h, def.depth], def.edge.color);
  addBlock([hw + t / 2, h / 2, 0], [t, h, def.depth], def.edge.color);

  // Invisible walls so nobody leaves the arena (tall enough for flying)
  const wallH = 80;
  for (const [pos, size] of [
    [[0, wallH / 2, -hd - t], [def.width + 4, wallH, 0.2]],
    [[0, wallH / 2, hd + t], [def.width + 4, wallH, 0.2]],
    [[-hw - t, wallH / 2, 0], [0.2, wallH, def.depth + 4]],
    [[hw + t, wallH / 2, 0], [0.2, wallH, def.depth + 4]],
  ] as [number[], number[]][]) {
    level.addCollider(physics.addStaticBox(new Vector3(...pos), new Vector3(...size)));
  }

  for (const b of def.blocks) addBlock(b.pos, b.size, b.color, b.rotY ?? 0, b.collide ?? true);
  level.root.add(buildModel({ parts: blockParts }).root);

  // Props
  for (const placement of def.props) {
    const prop = PROPS.get(placement.type);
    const rotY = placement.rotY ?? 0;
    const base = new Vector3(...placement.pos);
    const model = buildModel(prop.model);
    model.root.position.copy(base);
    model.root.rotation.y = rotY;
    level.root.add(model.root);
    for (const c of prop.colliders) {
      const center = new Vector3(...c.pos).applyAxisAngle(UP, rotY).add(base);
      level.addCollider(physics.addStaticBox(center, new Vector3(...c.size), rotY));
    }
  }

  // Background decoration
  if (def.scenery) {
    const scenery = new Group();
    def.scenery(scenery, ctx.random);
    level.root.add(scenery);
  }

  ctx.scene.add(level.root);

  // Clouds are entities because they change over time.
  for (const top of def.clouds) ctx.world.add(new FadingCloud(new Vector3(...top)), ctx);

  return level;
}
