import type { Scene } from 'three';
import type { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import type { Input } from '../input/Input';
import type { Level } from '../level/LevelBuilder';
import type { Physics } from '../physics/Physics';
import type { Player } from '../player/Player';
import type { Particles } from '../rendering/effects/Particles';
import type { World } from '../world/World';
import type { EventBus } from './EventBus';
import type { GameEvents } from './events';

/**
 * The "toolbox" handed to every entity's update(). Everything an enemy, ability
 * or projectile might need lives here, so nobody has to reach into the Game class.
 */
export interface GameContext {
  scene: Scene;
  physics: Physics;
  world: World;
  events: EventBus<GameEvents>;
  input: Input;
  camera: ThirdPersonCamera;
  particles: Particles;
  /** The current level (ground, walls, spawn points). */
  level: Level;
  /** The player, or null between runs. */
  player: Player | null;
  /** G key: no damage taken, double damage dealt, golden bird. */
  godMode: boolean;
  /** Seconds since the run started (game time, pauses when paused). */
  time: number;
  /** Random number 0..1. Use this instead of Math.random() so tests can control it. */
  random: () => number;
}
