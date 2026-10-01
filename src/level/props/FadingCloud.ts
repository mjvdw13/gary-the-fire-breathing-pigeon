import { Vector3 } from 'three';
import type { GameContext } from '../../core/GameContext';
import type { RAPIER } from '../../physics/Physics';
import { BlockModel, buildModel } from '../../rendering/ModelFactory';
import { Entity } from '../../world/Entity';

const RADIUS = 1.7;
const THICKNESS = 0.5;

/**
 * A fluffy cloud you can stand on — but it fades away soon after you land on it,
 * then comes back a few seconds later. (Straight from the 2D game.)
 */
export class FadingCloud extends Entity {
  fadeDuration = 0.8;
  respawnDelay = 3;

  private state: 'solid' | 'fading' | 'gone' = 'solid';
  private timer = 0;
  private collider!: RAPIER.Collider;
  private model: BlockModel;
  private bobOffset = Math.random() * Math.PI * 2;

  /** `top` = the surface you stand on. */
  constructor(top: Vector3) {
    super('platform');
    this.position.copy(top);
    this.model = buildModel({
      parts: [
        { shape: 'sphere', pos: [0, -0.2, 0], size: [3.6, 0.7, 3.6], color: '#ffffff' },
        { shape: 'sphere', pos: [0.7, 0.05, 0.4], size: [1.6, 0.9, 1.6], color: '#f4f9ff' },
        { shape: 'sphere', pos: [-0.8, 0, -0.2], size: [1.8, 0.8, 1.8], color: '#ffffff' },
        { shape: 'sphere', pos: [0, 0.05, -0.9], size: [1.4, 0.7, 1.4], color: '#eef5fc' },
        { shape: 'sphere', pos: [-0.3, -0.35, 0.9], size: [1.5, 0.6, 1.5], color: '#e3eef8' },
      ],
    });
    this.object3D.add(this.model.root);
  }

  onAdded(ctx: GameContext): void {
    const center = this.position.clone().setY(this.position.y - THICKNESS / 2);
    this.collider = ctx.physics.addStaticCylinder(center, RADIUS, THICKNESS);
  }

  onRemoved(ctx: GameContext): void {
    ctx.physics.removeCollider(this.collider);
  }

  update(ctx: GameContext, dt: number): void {
    this.bobOffset += dt * 2;
    this.model.root.position.y = Math.sin(this.bobOffset) * 0.06;

    switch (this.state) {
      case 'solid':
        if (this.isPlayerStandingOn(ctx)) {
          this.state = 'fading';
          this.timer = 0;
        }
        break;
      case 'fading':
        this.timer += dt;
        this.model.setOpacity(1 - this.timer / this.fadeDuration);
        if (this.timer >= this.fadeDuration) {
          this.state = 'gone';
          this.timer = 0;
          this.collider.setEnabled(false);
          this.model.setVisible(false);
          ctx.particles.burst('cloudPuff', this.position);
        }
        break;
      case 'gone':
        this.timer += dt;
        if (this.timer >= this.respawnDelay && !this.isPlayerInside(ctx)) {
          this.state = 'solid';
          this.collider.setEnabled(true);
          this.model.setVisible(true);
          this.model.setOpacity(1);
        }
        break;
    }
  }

  private isPlayerStandingOn(ctx: GameContext): boolean {
    const p = ctx.player;
    if (!p || !p.motor.grounded) return false;
    const flat = Math.hypot(p.position.x - this.position.x, p.position.z - this.position.z);
    return flat < RADIUS + p.stats.radius && Math.abs(p.position.y - this.position.y) < 0.25;
  }

  /** Don't reappear around the player and trap them. */
  private isPlayerInside(ctx: GameContext): boolean {
    const p = ctx.player;
    if (!p) return false;
    const flat = Math.hypot(p.position.x - this.position.x, p.position.z - this.position.z);
    const dy = p.position.y - this.position.y;
    return flat < RADIUS + p.stats.radius && dy > -p.stats.height - THICKNESS && dy < 0.05;
  }
}
