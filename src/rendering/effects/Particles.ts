import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  BoxGeometry,
  Quaternion,
  Scene,
  Vector3,
} from 'three';
import { PARTICLE_PRESETS, ParticlePresetName } from './presets';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  color: Color;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  spin: number;
}

const MAX_PARTICLES = 2000;

/**
 * All particle effects (explosions, fire trails, sparks, feathers...) drawn as little cubes
 * in ONE draw call. Effects are described as data in presets.ts.
 *
 *   ctx.particles.burst('poof', position);
 *   ctx.particles.burst('fireTrail', position, { count: 2 });
 */
export class Particles {
  private mesh: InstancedMesh;
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private matrix = new Matrix4();
  private quat = new Quaternion();
  private scale = new Vector3();
  private axis = new Vector3(1, 1, 0).normalize();

  constructor(scene: Scene) {
    this.mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ fog: true }), MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.setColorAt(0, new Color());
    scene.add(this.mesh);
  }

  burst(
    preset: ParticlePresetName,
    position: Vector3,
    options: { count?: number; direction?: Vector3; scale?: number } = {},
  ): void {
    const p = PARTICLE_PRESETS[preset];
    const count = options.count ?? p.count;
    const scale = options.scale ?? 1;
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const part = this.pool.pop() ?? {
        position: new Vector3(),
        velocity: new Vector3(),
        color: new Color(),
        size: 0,
        life: 0,
        maxLife: 0,
        gravity: 0,
        drag: 0,
        spin: 0,
      };
      part.position.copy(position).add(randomInSphere(p.spread * scale));
      const speed = lerp(p.speed[0], p.speed[1], Math.random()) * scale;
      part.velocity.copy(randomInSphere(1)).normalize().multiplyScalar(speed);
      if (options.direction) part.velocity.addScaledVector(options.direction, speed);
      part.velocity.y += p.upward * scale;
      part.color.set(p.colors[Math.floor(Math.random() * p.colors.length)]);
      part.size = lerp(p.size[0], p.size[1], Math.random()) * scale;
      part.maxLife = part.life = lerp(p.life[0], p.life[1], Math.random());
      part.gravity = p.gravity;
      part.drag = p.drag;
      part.spin = (Math.random() - 0.5) * 10;
      this.particles.push(part);
    }
  }

  /** Remove all particles (level change). */
  clear(): void {
    this.pool.push(...this.particles);
    this.particles = [];
    this.mesh.count = 0;
  }

  /** Called every frame. */
  update(dt: number): void {
    let n = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        this.pool.push(p);
        continue;
      }
      p.velocity.y -= p.gravity * dt;
      p.velocity.multiplyScalar(Math.max(0, 1 - p.drag * dt));
      p.position.addScaledVector(p.velocity, dt);

      const t = p.life / p.maxLife; // 1 → 0
      this.scale.setScalar(p.size * (0.3 + 0.7 * t));
      this.quat.setFromAxisAngle(this.axis, p.spin * (1 - t));
      this.matrix.compose(p.position, this.quat, this.scale);
      this.mesh.setMatrixAt(n, this.matrix);
      this.mesh.setColorAt(n, p.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function randomInSphere(radius: number): Vector3 {
  const v = new Vector3();
  do {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
  } while (v.lengthSq() > 1);
  return v.multiplyScalar(radius);
}
