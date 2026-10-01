import { Vector3 } from 'three';
import type { GameContext } from '../../core/GameContext';
import { sym } from '../../rendering/modelHelpers';
import { Hazard } from '../../world/components/Hazard';
import { Enemy } from '../Enemy';

/**
 * Park Ranger — slowly walks toward you, and when close, swings his broom.
 * The broom swing is a Hazard (a damaging area in front of him). Takes 3 hits.
 */
export class ParkRanger extends Enemy {
  private speed = 2.2;
  private sweepCooldown = 2;
  private sweepTimer = 0;
  private sweeping = false;
  private sweepTime = 0;
  private readonly sweepDuration = 0.5;
  private sweep: Hazard;
  private sweepCenter = new Vector3();

  constructor(position: Vector3) {
    super(
      {
        name: 'Park Ranger',
        health: 3,
        points: 250,
        radius: 0.42,
        height: 1.75,
        model: {
          parts: [
            ...sym({ name: 'leg', pos: [0.13, 0.4, 0], pivot: [0.13, 0.8, 0], size: [0.22, 0.8, 0.24], color: '#7a6a48' }),
            ...sym({ parent: 'legL', pos: [0.13, 0.05, 0.04], size: [0.24, 0.1, 0.32], color: '#3b2a1a' }),
            { name: 'body', pos: [0, 1.12, 0], size: [0.6, 0.66, 0.32], color: '#3f6b3a' },
            { parent: 'body', pos: [0, 0.82, 0], size: [0.62, 0.08, 0.34], color: '#3b2a1a' },
            { parent: 'body', pos: [0.15, 1.28, 0.17], size: [0.12, 0.12, 0.02], color: '#ffd24a' },
            { name: 'head', parent: 'body', pos: [0, 1.66, 0], size: [0.4, 0.4, 0.38], color: '#f1c27d' },
            { parent: 'head', pos: [0, 1.58, 0.2], size: [0.24, 0.06, 0.04], color: '#5a3a1a' },
            ...sym({ parent: 'head', pos: [0.09, 1.7, 0.195], size: [0.06, 0.06, 0.02], color: '#111111' }),
            // Ranger hat
            { parent: 'head', pos: [0, 1.88, 0], size: [0.7, 0.05, 0.7], color: '#8b6b3a' },
            { parent: 'head', pos: [0, 1.98, 0], size: [0.36, 0.18, 0.36], color: '#8b6b3a' },
            { parent: 'head', pos: [0, 1.92, 0], size: [0.37, 0.05, 0.37], color: '#3f6b3a' },
            ...sym({ name: 'arm', parent: 'body', pos: [0.4, 1.12, 0], pivot: [0.4, 1.4, 0], size: [0.18, 0.6, 0.2], color: '#3f6b3a' }),
            // Broom (swings during the sweep attack)
            { name: 'broom', parent: 'body', pivot: [-0.4, 1.0, 0.25], pos: [-0.4, 0.75, 0.55], size: [0.06, 0.06, 1.0], rot: [0.5, 0, 0], color: '#a0703a' },
            { parent: 'broom', pos: [-0.4, 0.45, 1.05], size: [0.32, 0.3, 0.12], rot: [0.5, 0, 0], color: '#d8b04a' },
          ],
        },
      },
      position,
    );
    this.sweep = new Hazard('enemy', 1, { kind: 'cylinder', base: this.sweepCenter, radius: 1.0, height: 1.4 });
    this.hazards.push(this.sweep);
  }

  protected think(ctx: GameContext, dt: number): void {
    const player = ctx.player;
    if (!player) return this.stop();

    if (this.sweeping) {
      this.stop();
      this.sweepTime += dt;
      // Damage only in the middle of the swing.
      const midSwing = this.sweepTime > 0.1 && this.sweepTime < 0.4;
      if (midSwing && !this.sweep.active) this.sweep.activate();
      if (!midSwing) this.sweep.deactivate();
      this.sweepCenter.copy(this.position).addScaledVector(this.forward(), 1.0);
      if (this.sweepTime >= this.sweepDuration) {
        this.sweeping = false;
        this.sweep.deactivate();
      }
      return;
    }

    this.faceToward(player.position, dt, 5);
    const dist = this.flatDistanceTo(player.position);
    if (dist > 1.2) this.moveToward(player.position, this.speed);
    else this.stop();

    this.sweepTimer += dt;
    if (this.sweepTimer >= this.sweepCooldown && dist < 2.4) {
      this.sweeping = true;
      this.sweepTime = 0;
      this.sweepTimer = 0;
    }
  }

  protected animate(ctx: GameContext, dt: number): void {
    super.animate(ctx, dt);
    const broom = this.model.part('broom');
    if (this.sweeping) {
      const t = this.sweepTime / this.sweepDuration;
      broom.rotation.y = Math.sin(t * Math.PI) * 1.8 - 0.6;
      broom.rotation.x = -0.3;
    } else {
      broom.rotation.set(0, 0, 0);
    }
  }
}
