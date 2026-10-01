import { Vector3 } from 'three';
import { lobVelocity } from '../../combat/aim';
import { GroundTelegraph } from '../../combat/GroundTelegraph';
import { PROJECTILES } from '../../combat/projectiles/definitions';
import { Projectile } from '../../combat/projectiles/Projectile';
import { Shockwave } from '../../combat/Shockwave';
import type { GameContext } from '../../core/GameContext';
import { StateMachine } from '../../core/StateMachine';
import { sym } from '../../rendering/modelHelpers';
import { Hazard } from '../../world/components/Hazard';
import { Enemy } from '../Enemy';

type WorkerState = 'idle' | 'walk' | 'windup' | 'slam' | 'throw';

/**
 * Chapter 2 boss. Walks up to you, raises his giant hammer while a red circle
 * warns where it'll land (get out!), then SLAMS. Also throws handfuls of nails.
 */
export class ConstructionWorker extends Enemy {
  private brain: StateMachine<ConstructionWorker, WorkerState>;
  private ctx!: GameContext;
  private slamCenter = new Vector3();
  private slamRadius = 2.5;
  private slamZone: Hazard;
  private nailsThrown = 0;
  private hammerAngle = 0;

  constructor(position: Vector3) {
    super(
      {
        name: 'Construction Worker',
        health: 40, // 2D: 20 — doubled because 3D has auto-fire and the bat buddy
        points: 1500,
        radius: 0.9,
        height: 3,
        boss: true,
        model: {
          scale: 1.7,
          parts: [
            ...sym({ name: 'leg', pos: [0.17, 0.4, 0], pivot: [0.17, 0.8, 0], size: [0.28, 0.8, 0.3], color: '#3a5a8a' }),
            ...sym({ parent: 'legL', pos: [0.17, 0.06, 0.05], size: [0.3, 0.12, 0.4], color: '#4a3020' }),
            { name: 'body', pos: [0, 1.15, 0], size: [0.75, 0.7, 0.42], color: '#3a5a8a' },
            // Hi-vis vest
            { parent: 'body', pos: [0, 1.18, 0], size: [0.77, 0.6, 0.44], color: '#ff8a1a' },
            { parent: 'body', pos: [0, 1.1, 0], size: [0.78, 0.07, 0.45], color: '#e8ff5a', glow: true },
            { parent: 'body', pos: [0, 1.32, 0], size: [0.78, 0.07, 0.45], color: '#e8ff5a', glow: true },
            { name: 'head', parent: 'body', pos: [0, 1.72, 0], size: [0.44, 0.44, 0.42], color: '#e0a878' },
            { parent: 'head', pos: [0, 1.62, 0.21], size: [0.32, 0.14, 0.04], color: '#6b4428' },
            ...sym({ name: 'eye', parent: 'head', pos: [0.1, 1.78, 0.215], size: [0.08, 0.06, 0.02], color: '#111111' }),
            // Hard hat
            { parent: 'head', pos: [0, 1.98, 0.02], size: [0.52, 0.18, 0.5], color: '#ffd400' },
            { parent: 'head', pos: [0, 1.9, 0.1], size: [0.56, 0.04, 0.6], color: '#ffd400' },
            { name: 'armL', parent: 'body', pos: [0.48, 1.12, 0], pivot: [0.48, 1.42, 0], size: [0.2, 0.62, 0.22], color: '#ff8a1a' },
            // Right arm holds the big hammer
            { name: 'hammerArm', parent: 'body', pos: [-0.48, 1.12, 0], pivot: [-0.48, 1.42, 0], size: [0.2, 0.62, 0.22], color: '#ff8a1a' },
            { parent: 'hammerArm', pos: [-0.48, 0.82, 0.45], size: [0.08, 0.08, 1.0], color: '#8a5a2a' },
            { parent: 'hammerArm', pos: [-0.48, 0.82, 0.98], size: [0.34, 0.34, 0.5], rot: [0, 0, 0], color: '#6a6f78' },
          ],
        },
      },
      position,
    );

    this.slamZone = new Hazard('enemy', 1, { kind: 'cylinder', base: this.slamCenter, radius: 2.5, height: 1.2 });
    this.hazards.push(this.slamZone);

    this.brain = new StateMachine<ConstructionWorker, WorkerState>(
      this,
      {
        idle: {
          update: (w, dt) => {
            w.stop();
            const player = w.ctx.player;
            if (player) w.faceToward(player.position, dt, 3);
            if (w.brain.time >= 2.2 - w.anger * 0.8) {
              const slamChance = 0.5 + w.anger * 0.2;
              w.brain.change(w.ctx.random() < slamChance ? 'walk' : 'throw');
            }
          },
        },
        walk: {
          update: (w, dt) => {
            const player = w.ctx.player;
            if (!player) return w.brain.change('idle');
            w.faceToward(player.position, dt, 4);
            w.moveToward(player.position, 3 + w.anger * 1.5);
            if (w.flatDistanceTo(player.position) < 3.2 || w.brain.time > 6) w.brain.change('windup');
          },
        },
        windup: {
          enter: (w) => {
            w.stop();
            w.slamRadius = 2.5 + w.anger * 1.2;
            w.slamCenter.copy(w.position).addScaledVector(w.forward(), 2.6);
            w.ctx.world.add(new GroundTelegraph(w.slamCenter, w.slamRadius, 1.0), w.ctx);
          },
          update: (w) => {
            w.hammerAngle = -Math.min(w.brain.time / 1.0, 1) * 2.4;
            if (w.brain.time >= 1.0) w.brain.change('slam');
          },
        },
        slam: {
          enter: (w) => {
            const ctx = w.ctx;
            const shape = w.slamZone.shape;
            if (shape.kind === 'cylinder') shape.radius = w.slamRadius;
            w.slamZone.activate();
            ctx.world.add(new Shockwave('enemy', w.slamCenter, w.slamRadius + 3, 0.5), ctx);
            ctx.particles.burst('dust', w.slamCenter, { scale: 1.6 });
            ctx.events.emit('cameraShake', { strength: 0.6 });
          },
          update: (w) => {
            w.hammerAngle = Math.min(0, -2.4 + w.brain.time * 30);
            if (w.brain.time > 0.15) w.slamZone.deactivate();
            if (w.brain.time > 0.7) w.brain.change('idle');
          },
          exit: (w) => w.slamZone.deactivate(),
        },
        throw: {
          enter: (w) => {
            w.nailsThrown = 0;
          },
          update: (w, dt) => {
            const player = w.ctx.player;
            if (player) w.faceToward(player.position, dt, 6);
            const count = w.anger > 0.5 ? 3 : 2;
            if (w.nailsThrown < count && w.brain.time >= 0.2 + w.nailsThrown * 0.25) {
              w.throwNails();
              w.nailsThrown++;
            }
            if (w.brain.time >= 0.2 + count * 0.25 + 0.3) w.brain.change('idle');
          },
        },
      },
      'idle',
    );
  }

  protected think(ctx: GameContext, dt: number): void {
    this.ctx = ctx;
    this.brain.update(dt);
  }

  protected animate(ctx: GameContext, dt: number): void {
    super.animate(ctx, dt);
    this.model.part('hammerArm').rotation.x = this.hammerAngle;
  }

  /** A small fan of nails aimed at the player. */
  private throwNails(): void {
    const ctx = this.ctx;
    const player = ctx.player;
    if (!player) return;
    const hand = this.position.clone().add(new Vector3(0, 2.6, 0)).addScaledVector(this.forward(), 1);
    const def = PROJECTILES.get('nail');
    // Arc the nails so gravity brings them down right on the player.
    const velocity = lobVelocity(hand, player.getCenter(), def.speed + this.anger * 6, def.gravity ?? 0);
    const speed = velocity.length();
    for (const spread of [-0.12, 0, 0.12]) {
      const dir = velocity.clone().applyAxisAngle(UP, spread + (ctx.random() - 0.5) * 0.05).normalize();
      ctx.world.add(new Projectile({ ...def, speed }, 'enemy', hand, dir), ctx);
    }
  }
}

const UP = new Vector3(0, 1, 0);
