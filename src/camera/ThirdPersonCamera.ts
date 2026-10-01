import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { TUNING } from '../config/tuning';
import type { Input } from '../input/Input';
import type { Physics } from '../physics/Physics';

/**
 * Roblox-style camera that orbits behind the player.
 * Mouse = look around, scroll wheel = zoom. It slides closer when a wall is in the way.
 */
export class ThirdPersonCamera {
  readonly camera: PerspectiveCamera;
  /** Horizontal angle around the player (radians). */
  yaw = 0;
  /** Vertical angle: 0 = level, positive = looking down from above. */
  pitch = 0.3;
  /** How far you WANT the camera to be (scroll wheel changes this). */
  distance = TUNING.camera.distance;

  private currentDistance = TUNING.camera.distance;
  private shake = 0;
  private readonly lookTarget = new Vector3();

  constructor(aspect: number) {
    this.camera = new PerspectiveCamera(65, aspect, 0.1, 500);
  }

  /** Shake the screen (big landings, explosions). Strength ~0.1 small, ~0.6 huge. */
  addShake(strength: number): void {
    this.shake = Math.min(1, this.shake + strength);
  }

  /** Point the camera behind something facing `yaw` (used when spawning). */
  snapBehind(yaw: number): void {
    this.yaw = yaw + Math.PI;
    this.pitch = 0.3;
  }

  /**
   * Call once per frame. `focus` is the player's (smoothed) feet position.
   * `allowLook` is false while menus are open.
   */
  update(input: Input, physics: Physics | null, focus: Vector3, dt: number, allowLook: boolean): void {
    const c = TUNING.camera;
    if (allowLook) {
      const mouse = input.consumeMouseDelta();
      this.yaw -= mouse.x * c.mouseSensitivity;
      this.pitch += mouse.y * c.mouseSensitivity;
      this.pitch = MathUtils.clamp(this.pitch, c.minPitch, c.maxPitch);
      this.distance = MathUtils.clamp(this.distance + input.consumeWheel() * 0.8, c.minDistance, c.maxDistance);
    } else {
      input.consumeMouseDelta();
      input.consumeWheel();
    }

    this.lookTarget.set(focus.x, focus.y + c.lookHeight, focus.z);

    // Direction from the player to the camera
    const back = new Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );

    // Don't let walls get between the camera and the player.
    let wanted = this.distance;
    if (physics) {
      const hit = physics.raycast(this.lookTarget, back, this.distance + 0.3);
      if (hit) wanted = Math.max(0.6, hit.distance - 0.3);
    }
    // Snap in quickly, ease back out slowly.
    this.currentDistance =
      wanted < this.currentDistance ? wanted : MathUtils.damp(this.currentDistance, wanted, 6, dt);

    this.camera.position.copy(this.lookTarget).addScaledVector(back, this.currentDistance);
    this.camera.lookAt(this.lookTarget);

    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }
  }

  /** Flat (no up/down) direction the camera faces. W moves this way. */
  forward(target = new Vector3()): Vector3 {
    return target.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  /** Flat direction to the camera's right. D moves this way. */
  right(target = new Vector3()): Vector3 {
    return target.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }

  /** Ray straight out through the crosshair (center of screen). */
  aimRay(): { origin: Vector3; direction: Vector3 } {
    const direction = new Vector3();
    this.camera.getWorldDirection(direction);
    return { origin: this.camera.position.clone(), direction };
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
