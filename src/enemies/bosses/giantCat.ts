import { Vector3 } from 'three';
import { PROJECTILES } from '../../combat/projectiles/definitions';
import { Projectile } from '../../combat/projectiles/Projectile';
import { Shockwave } from '../../combat/Shockwave';
import { TUNING } from '../../config/tuning';
import type { GameContext } from '../../core/GameContext';
import { StateMachine } from '../../core/StateMachine';
import { sym } from '../../rendering/modelHelpers';
import { Enemy } from '../Enemy';

type CatState = 'idle' | 'leap' | 'land' | 'spit';

/**
 * Chapter 1 boss. Leaps at you and slams down (jump over the shockwave!),
 * or spits bouncing hairballs. Gets faster and angrier as it loses health.
 */
export class GiantCat extends Enemy {
  private brain: StateMachine<GiantCat, CatState>;
  private ctx!: GameContext;
  private spitsDone = 0;

  constructor(position: Vector3) {
    super(
      {
        name: 'Giant Cat',
        health: 30, // 2D: 15 — doubled because 3D has auto-fire and the bat buddy
        points: 1000,
        radius: 1.4,
        height: 2.4,
        boss: true,
        model: {
          scale: 1.6,
          parts: [
            ...sym({ name: 'leg', pos: [0.32, 0.3, 0.45], pivot: [0.32, 0.6, 0.45], size: [0.26, 0.6, 0.26], color: '#e07a2a' }),
            ...sym({ name: 'arm', pos: [0.32, 0.3, -0.45], pivot: [0.32, 0.6, -0.45], size: [0.26, 0.6, 0.26], color: '#e07a2a' }),
            ...sym({ parent: 'legL', pos: [0.32, 0.04, 0.5], size: [0.3, 0.08, 0.34], color: '#fff2e0' }),
            { name: 'body', pos: [0, 0.85, 0], size: [0.9, 0.6, 1.4], color: '#f08a32' },
            { parent: 'body', pos: [0, 0.68, 0.1], size: [0.7, 0.3, 1.1], color: '#fff2e0' },
            // Tiger stripes
            ...[-0.4, -0.1, 0.2].map((z) => ({ parent: 'body', pos: [0, 1.16, z] as [number, number, number], size: [0.92, 0.04, 0.12] as [number, number, number], color: '#b85a18' })),
            { name: 'head', parent: 'body', pos: [0, 1.3, 0.8], size: [0.72, 0.6, 0.55], color: '#f08a32' },
            { parent: 'head', pos: [0, 1.17, 1.08], size: [0.36, 0.22, 0.08], color: '#fff2e0' },
            { parent: 'head', pos: [0, 1.25, 1.12], size: [0.1, 0.07, 0.04], color: '#ff7a9a' },
            ...sym({ parent: 'head', pos: [0.22, 1.7, 0.75], size: [0.2, 0.26, 0.12], rot: [0, 0, -0.3], color: '#f08a32' }),
            ...sym({ parent: 'head', pos: [0.22, 1.68, 0.8], size: [0.1, 0.16, 0.04], rot: [0, 0, -0.3], color: '#ff9eb5' }),
            ...sym({ name: 'eye', parent: 'head', pos: [0.18, 1.4, 1.08], size: [0.14, 0.12, 0.04], color: '#a6ff4a', glow: true }),
            ...sym({ parent: 'head', pos: [0.18, 1.4, 1.1], size: [0.04, 0.12, 0.02], color: '#111111' }),
            // Whiskers
            ...sym({ parent: 'head', pos: [0.35, 1.2, 1.08], size: [0.4, 0.02, 0.02], rot: [0, 0, 0.15], color: '#ffffff' }),
            { name: 'tail', parent: 'body', pivot: [0, 1.0, -0.7], pos: [0, 1.4, -0.9], size: [0.16, 0.9, 0.16], rot: [-0.5, 0, 0], color: '#f08a32' },
          ],
        },
      },
      position,
    );

    this.brain = new StateMachine<GiantCat, CatState>(
      this,
      {
        idle: {
          update: (cat, dt) => {
            cat.stop();
            const player = cat.ctx.player;
            if (player) cat.faceToward(player.position, dt, 3);
            const cooldown = 2 - cat.anger * 0.8;
            if (cat.brain.time >= cooldown) {
              const leapChance = 0.4 + cat.anger * 0.3;
              cat.brain.change(cat.ctx.random() < leapChance ? 'leap' : 'spit');
            }
          },
        },
        leap: {
          enter: (cat) => cat.leapAtPlayer(),
          update: (cat) => {
            if (cat.brain.time > 0.2 && cat.motor.grounded) cat.brain.change('land');
          },
        },
        land: {
          enter: (cat) => {
            cat.stop();
            const ctx = cat.ctx;
            ctx.world.add(new Shockwave('enemy', cat.position, 6 + cat.anger * 3, 0.55), ctx);
            ctx.particles.burst('dust', cat.position, { scale: 1.5 });
            ctx.events.emit('cameraShake', { strength: 0.5 });
          },
          update: (cat) => {
            if (cat.brain.time > 0.4) cat.brain.change('idle');
          },
        },
        spit: {
          enter: (cat) => {
            cat.spitsDone = 0;
          },
          update: (cat, dt) => {
            const player = cat.ctx.player;
            if (player) cat.faceToward(player.position, dt, 6);
            const spitTimes = cat.anger > 0.5 ? [0.25, 0.5, 0.75] : [0.25, 0.55];
            if (cat.spitsDone < spitTimes.length && cat.brain.time >= spitTimes[cat.spitsDone]) {
              cat.spitHairball();
              cat.spitsDone++;
            }
            if (cat.brain.time >= 1) cat.brain.change('idle');
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
    this.model.part('tail').rotation.z = Math.sin(this.age * (3 + this.anger * 6)) * 0.4;
    // Crouch when landing.
    this.model.root.scale.y = 1.6 * (this.brain.is('land') ? 0.85 : 1);
  }

  private leapAtPlayer(): void {
    const player = this.ctx.player;
    const target = player ? player.position.clone() : this.position.clone();
    const flightTime = 1.1 - this.anger * 0.2;
    const g = TUNING.gravity;
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const maxSpeed = 16;
    const speed = Math.min(Math.hypot(dx, dz) / flightTime, maxSpeed);
    const len = Math.hypot(dx, dz) || 1;
    this.motor.velocity.set((dx / len) * speed, (g * flightTime) / 2, (dz / len) * speed);
    this.faceToward(target, 1, Infinity);
  }

  private spitHairball(): void {
    const ctx = this.ctx;
    const mouth = this.position.clone().add(new Vector3(0, 1.9, 0)).addScaledVector(this.forward(), 1.8);
    const player = ctx.player;
    const toPlayer = player ? player.getCenter().sub(mouth).setY(0).normalize() : this.forward();
    const dir = toPlayer.add(new Vector3(0, 0.35, 0)).normalize();
    const def = PROJECTILES.get('hairball');
    const ball = new Projectile({ ...def, speed: def.speed + this.anger * 5 }, 'enemy', mouth, dir);
    ctx.world.add(ball, ctx);
  }
}
