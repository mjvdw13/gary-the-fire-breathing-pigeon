import { CircleGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import type { GameContext } from '../core/GameContext';
import { Entity } from '../world/Entity';

/**
 * A red warning circle on the ground: "something is about to hit here — move!"
 * Purely visual; pair it with a Hazard or Shockwave when the attack lands.
 */
export class GroundTelegraph extends Entity {
  private age = 0;
  private mesh: Mesh<CircleGeometry, MeshBasicMaterial>;

  constructor(
    center: Vector3,
    radius: number,
    private duration: number,
    color = '#ff2a2a',
  ) {
    super('effect');
    this.position.copy(center);
    this.mesh = new Mesh(
      new CircleGeometry(radius, 40),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.06;
    this.object3D.add(this.mesh);
  }

  update(_ctx: GameContext, dt: number): void {
    this.age += dt;
    const t = this.age / this.duration;
    // Pulses faster and gets stronger as the hit gets closer.
    this.mesh.material.opacity = 0.2 + 0.35 * t + Math.sin(this.age * (10 + t * 30)) * 0.1;
    if (this.age >= this.duration) this.destroy();
  }
}
