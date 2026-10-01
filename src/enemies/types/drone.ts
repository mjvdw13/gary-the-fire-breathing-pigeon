import { Vector3 } from 'three';
import type { GameContext } from '../../core/GameContext';
import { spinParts } from '../../rendering/animation';
import { Enemy } from '../Enemy';

type DroneMode = 'patrol' | 'swoop' | 'climb';

/**
 * Drone — flies high above the roof, cruising between random points.
 * Every few seconds it swoops down at the player, then climbs back up.
 */
export class Drone extends Enemy {
  private mode: DroneMode = 'patrol';
  private modeTime = 0;
  private destination = new Vector3();
  private cruiseHeight = 6;
  private swoopTarget = new Vector3();

  constructor(position: Vector3) {
    super(
      {
        name: 'Drone',
        health: 1,
        points: 150,
        radius: 0.55,
        height: 0.5,
        gravityScale: 0,
        model: {
          parts: [
            { name: 'body', pos: [0, 0.25, 0], size: [0.5, 0.22, 0.5], color: '#3a3f47' },
            { parent: 'body', pos: [0, 0.12, 0.15], shape: 'sphere', size: [0.2, 0.2, 0.2], color: '#111111' },
            { parent: 'body', pos: [0, 0.12, 0.24], size: [0.08, 0.08, 0.04], color: '#ff3333', glow: true },
            // Arms to the four rotors
            { parent: 'body', pos: [0, 0.28, 0], size: [1.1, 0.06, 0.08], rot: [0, Math.PI / 4, 0], color: '#555b63' },
            { parent: 'body', pos: [0, 0.28, 0], size: [1.1, 0.06, 0.08], rot: [0, -Math.PI / 4, 0], color: '#555b63' },
            ...[
              [0.39, 0.39],
              [-0.39, 0.39],
              [0.39, -0.39],
              [-0.39, -0.39],
            ].map(([x, z], i) => ({
              name: `prop${i + 1}`,
              parent: 'body',
              pos: [x, 0.34, z] as [number, number, number],
              size: [0.46, 0.02, 0.06] as [number, number, number],
              color: '#cfd6de',
            })),
            { parent: 'body', pos: [0.18, 0.37, 0], size: [0.05, 0.05, 0.05], color: '#33ff66', glow: true },
          ],
        },
      },
      position,
    );
    this.cruiseHeight = position.y;
  }

  onAdded(ctx: GameContext): void {
    super.onAdded(ctx);
    const [lo, hi] = ctx.level.def.airHeight;
    this.cruiseHeight = lo + ctx.random() * (hi - lo);
    this.pickDestination(ctx);
  }

  protected think(ctx: GameContext, dt: number): void {
    this.modeTime += dt;
    const player = ctx.player;
    const bob = Math.sin(this.age * 4) * 0.4;

    switch (this.mode) {
      case 'patrol': {
        const target = this.destination.clone().setY(this.cruiseHeight + bob);
        this.flyToward(target, 4);
        if (this.position.distanceTo(target) < 1 || this.motor.blocked) this.pickDestination(ctx);
        if (player && this.modeTime > 4 && this.flatDistanceTo(player.position) < 22 && ctx.random() < 0.01) {
          this.mode = 'swoop';
          this.modeTime = 0;
          player.getCenter(this.swoopTarget);
        }
        break;
      }
      case 'swoop':
        this.flyToward(this.swoopTarget, 8);
        if (this.modeTime > 1.6 || this.position.distanceTo(this.swoopTarget) < 0.6) {
          this.mode = 'climb';
          this.modeTime = 0;
        }
        break;
      case 'climb':
        this.flyToward(this.position.clone().setY(this.cruiseHeight), 4);
        if (this.modeTime > 1.5 || Math.abs(this.position.y - this.cruiseHeight) < 0.5) {
          this.mode = 'patrol';
          this.modeTime = 0;
          this.pickDestination(ctx);
        }
        break;
    }

    const lookAt = player && this.mode === 'swoop' ? player.position : this.position.clone().add(this.motor.velocity);
    this.faceToward(lookAt, dt, 4);
  }

  protected animate(): void {
    spinParts(this.model, 'prop', 4, this.age * 40);
    // Tilt forward into the direction of travel.
    const speed = Math.hypot(this.motor.velocity.x, this.motor.velocity.z);
    this.model.part('body').rotation.x = Math.min(speed * 0.05, 0.35);
  }

  private flyToward(target: Vector3, speed: number): void {
    const dir = target.clone().sub(this.position);
    const dist = dir.length();
    if (dist < 0.05) {
      this.motor.velocity.set(0, 0, 0);
      return;
    }
    this.motor.velocity.copy(dir.multiplyScalar(Math.min(speed, dist * 3) / dist));
  }

  private pickDestination(ctx: GameContext): void {
    this.destination.copy(ctx.level.randomPoint(ctx.random, 4));
  }
}
