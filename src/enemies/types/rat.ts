import { Vector3 } from 'three';
import type { GameContext } from '../../core/GameContext';
import { sym } from '../../rendering/modelHelpers';
import { Enemy } from '../Enemy';

/**
 * Rat — the simplest enemy. Scurries around fast, turning every so often,
 * usually toward the player. 1 hit to defeat.
 *
 * Good template for new enemies: copy this file, change the model and think().
 */
export class Rat extends Enemy {
  private heading = new Vector3(1, 0, 0);
  private turnTimer = 0;
  private speed = 5;

  constructor(position: Vector3) {
    super(
      {
        name: 'Rat',
        health: 1,
        points: 100,
        radius: 0.4,
        height: 0.5,
        model: {
          parts: [
            ...sym({ name: 'leg', pos: [0.15, 0.07, 0.2], pivot: [0.15, 0.14, 0.2], size: [0.08, 0.14, 0.08], color: '#5d5d66' }),
            ...sym({ name: 'arm', pos: [0.15, 0.07, -0.2], pivot: [0.15, 0.14, -0.2], size: [0.08, 0.14, 0.08], color: '#5d5d66' }),
            { name: 'body', pos: [0, 0.27, 0], size: [0.42, 0.3, 0.7], color: '#7a7a85' },
            { parent: 'body', pos: [0, 0.3, 0.42], size: [0.3, 0.24, 0.26], color: '#868692' },
            { parent: 'body', pos: [0, 0.27, 0.58], size: [0.08, 0.08, 0.08], color: '#ff9eb5' },
            ...sym({ parent: 'body', pos: [0.13, 0.48, 0.38], size: [0.12, 0.14, 0.04], color: '#ff9eb5' }),
            ...sym({ parent: 'body', pos: [0.09, 0.36, 0.55], size: [0.05, 0.05, 0.02], color: '#ff2222', glow: true }),
            { name: 'tail', parent: 'body', pivot: [0, 0.25, -0.35], pos: [0, 0.22, -0.65], size: [0.05, 0.05, 0.6], color: '#ff9eb5' },
          ],
        },
      },
      position,
    );
  }

  protected think(ctx: GameContext, dt: number): void {
    this.turnTimer -= dt;
    const player = ctx.player;

    // Time to pick a new direction (or we bumped into a wall).
    if (this.turnTimer <= 0 || this.motor.blocked) {
      this.turnTimer = 1 + ctx.random() * 1.5;
      if (player && ctx.random() < 0.65) {
        this.heading.subVectors(player.position, this.position).setY(0);
      } else {
        const angle = ctx.random() * Math.PI * 2;
        this.heading.set(Math.cos(angle), 0, Math.sin(angle));
      }
      this.heading.normalize();
    }

    this.motor.velocity.x = this.heading.x * this.speed;
    this.motor.velocity.z = this.heading.z * this.speed;
    this.faceToward(this.position.clone().add(this.heading), dt, 12);
  }
}
