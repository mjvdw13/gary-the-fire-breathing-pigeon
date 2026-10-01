import type { Ability } from '../abilities/Ability';
import type { ModelDef } from '../rendering/ModelFactory';

export interface CharacterStats {
  /** Running speed in m/s. */
  moveSpeed: number;
  /** Upward speed when jumping, m/s. Jump height = jumpSpeed² / (2 × gravity). */
  jumpSpeed: number;
  /** Body size for collisions and getting hit. */
  radius: number;
  height: number;
}

/**
 * Everything that makes a playable character unique.
 * Make a new file in player/characters/, fill one of these in, and register it in index.ts.
 */
export interface CharacterDef {
  id: string;
  name: string;
  /** Shown under the name, e.g. "The Fire Pigeon". */
  title: string;
  description: string;
  /** Main color used in menus. */
  color: string;
  model: ModelDef;
  stats: CharacterStats;
  /** Where shots come out, relative to the feet (x = left, y = up, z = forward). */
  muzzle: [number, number, number];
  /** Builds a fresh set of abilities each time the character spawns. */
  abilities: () => Ability[];
  /** Can the bat companion join this character? (Not Violet — she IS a bat.) */
  allowsCompanion?: boolean;
}
