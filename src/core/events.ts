import type { Vector3 } from 'three';
import type { Entity } from '../world/Entity';

/**
 * Every event the game can announce on the EventBus, and the data that comes with it.
 * Want sound, particles, achievements, or stats for something? Listen for its event:
 *
 *   ctx.events.on('enemyKilled', ({ points }) => console.log('got', points));
 *
 * Need a new event? Add a line here, then `ctx.events.emit('yourEvent', {...})`.
 */
export interface GameEvents {
  // Combat
  enemyKilled: { enemy: Entity; points: number; position: Vector3 };
  bossDefeated: { boss: Entity; position: Vector3 };
  entityDamaged: { entity: Entity; amount: number };
  playerDamaged: { health: number; maxHealth: number };
  playerDied: { position: Vector3 };
  projectileFired: { kind: string; position: Vector3; team: string };
  projectileHit: { kind: string; position: Vector3 };

  // Player movement
  playerJumped: { position: Vector3; air: boolean };
  playerLanded: { position: Vector3 };
  playerDashed: { position: Vector3 };

  // Waves & story
  waveStarted: { wave: number; chapter: number; isBoss: boolean };
  waveCleared: { wave: number };
  chapterComplete: { chapter: number };
  victory: { score: number };
  scoreChanged: { score: number };

  // World
  cameraShake: { strength: number };
  companionUnlocked: { id: string };
}
