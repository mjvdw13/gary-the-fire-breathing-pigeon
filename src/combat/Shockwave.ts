import { DoubleSide, Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from 'three';
import type { GameContext } from '../core/GameContext';
import { Entity } from '../world/Entity';
import { Hazard } from '../world/components/Hazard';
import type { Team } from '../world/components/Team';

/**
 * An expanding ring on the ground that hurts whoever it touches — jump over it!
 * Used by boss slams. Spawn one with:
 *   ctx.world.add(new Shockwave('enemy', position, 6), ctx);
 */
export class Shockwave extends Entity {
  private age = 0;
  private hazard: Hazard;
  private mesh: Mesh<RingGeometry, MeshBasicMaterial>;

  constructor(
    team: Team,
    center: Vector3,
    private maxRadius: number,
    private duration = 0.5,
    damage = 1,
    /** Thickness of the ring band. */
    private thickness = 0.8,
  ) {
    super('effect');
    this.position.copy(center);
    this.hazard = new Hazard(team, damage, {
      kind: 'ring',
      base: this.position,
      innerRadius: 0,
      outerRadius: 0,
      height: 0.6,
    });
    this.hazard.activate();
    this.hazards.push(this.hazard);

    this.mesh = new Mesh(
      new RingGeometry(0.9, 1, 48),
      new MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, side: DoubleSide }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.08;
    this.object3D.add(this.mesh);
  }

  update(_ctx: GameContext, dt: number): void {
    this.age += dt;
    const t = Math.min(1, this.age / this.duration);
    const outer = this.maxRadius * t;
    const shape = this.hazard.shape;
    if (shape.kind === 'ring') {
      shape.outerRadius = outer;
      shape.innerRadius = Math.max(0, outer - this.thickness);
    }
    this.mesh.scale.setScalar(Math.max(outer, 0.01));
    this.mesh.material.opacity = 0.85 * (1 - t);
    if (t >= 1) this.destroy();
  }
}
