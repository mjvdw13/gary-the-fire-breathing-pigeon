import type { Group, Vector3 } from 'three';
import type { SkySettings } from '../rendering/Renderer';

type Vec3 = [number, number, number];

/** A solid box in the level: floors, walls, platforms, beams. */
export interface BlockDef {
  /** Center of the box. */
  pos: Vec3;
  size: Vec3;
  color: string;
  rotY?: number;
  /** false = decoration you can walk through. Default true. */
  collide?: boolean;
}

/** Place a prop from level/props (AC unit, crate...) */
export interface PropPlacement {
  type: string;
  /** Where its base sits. */
  pos: Vec3;
  rotY?: number;
}

/**
 * Everything that describes a level, as data. See levels/rooftop.ts for an example.
 * The play area is a rectangle centered on (0, 0) with the floor top at y = 0.
 */
export interface LevelDef {
  id: string;
  name: string;
  sky: SkySettings;
  /** Play area size in meters (x and z). Invisible walls keep everyone inside. */
  width: number;
  depth: number;
  floorColor: string;
  /** Low wall around the edge. */
  edge: { color: string; height: number };
  blocks: BlockDef[];
  props: PropPlacement[];
  /** Fading cloud platforms: the TOP of each cloud. */
  clouds: Vec3[];
  playerSpawn: Vector3;
  bossSpawn: Vector3;
  /** Min/max height flying enemies cruise at. */
  airHeight: [number, number];
  /** Decoration outside the arena (skyline, cranes...). No collisions. */
  scenery?: (root: Group, random: () => number) => void;
}
