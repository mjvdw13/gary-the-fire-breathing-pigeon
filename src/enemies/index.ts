import type { Vector3 } from 'three';
import { Registry } from '../core/Registry';
import { ConstructionWorker } from './bosses/constructionWorker';
import { GiantCat } from './bosses/giantCat';
import type { Enemy } from './Enemy';
import { Drone } from './types/drone';
import { ParkRanger } from './types/parkRanger';
import { Rat } from './types/rat';

export interface EnemyDef {
  id: string;
  /** Builds the enemy at a position. */
  create: (position: Vector3) => Enemy;
  /** Where it spawns: on the ground, up in the air, or at the level's boss spot. */
  spawn: 'ground' | 'air' | 'boss';
}

/**
 * Every enemy and boss, by id. Waves and chapters refer to enemies by these ids.
 * New enemy? Write its class in types/ (or bosses/), then add one line here.
 */
export const ENEMIES = new Registry<EnemyDef>('enemy').register(
  { id: 'rat', create: (p) => new Rat(p), spawn: 'ground' },
  { id: 'drone', create: (p) => new Drone(p), spawn: 'air' },
  { id: 'parkRanger', create: (p) => new ParkRanger(p), spawn: 'ground' },
  { id: 'giantCat', create: (p) => new GiantCat(p), spawn: 'boss' },
  { id: 'constructionWorker', create: (p) => new ConstructionWorker(p), spawn: 'boss' },
);
