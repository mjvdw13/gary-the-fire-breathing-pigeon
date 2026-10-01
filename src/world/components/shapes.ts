import { Vector3 } from 'three';

/**
 * Simple 3D shapes used for "did these touch?" checks in combat.
 * (Separate from the physics engine on purpose — it's simpler and fast enough.)
 */

/** A ball. */
export interface Sphere {
  kind: 'sphere';
  center: Vector3;
  radius: number;
}

/** An upright can shape. `base` is the center of the bottom. Good for characters. */
export interface Cylinder {
  kind: 'cylinder';
  base: Vector3;
  radius: number;
  height: number;
}

/** A flat donut lying on the ground, like an expanding shockwave. */
export interface Ring {
  kind: 'ring';
  base: Vector3;
  innerRadius: number;
  outerRadius: number;
  height: number;
}

export type Shape = Sphere | Cylinder | Ring;

const flatDistance = (a: Vector3, b: Vector3) => Math.hypot(a.x - b.x, a.z - b.z);

export function sphereVsCylinder(s: Sphere, c: Cylinder): boolean {
  // Closest point on the cylinder's vertical range
  const y = Math.min(Math.max(s.center.y, c.base.y), c.base.y + c.height);
  const dy = s.center.y - y;
  const flat = Math.max(0, flatDistance(s.center, c.base) - c.radius);
  return flat * flat + dy * dy <= s.radius * s.radius;
}

export function cylinderVsCylinder(a: Cylinder, b: Cylinder): boolean {
  const verticalOverlap = a.base.y < b.base.y + b.height && b.base.y < a.base.y + a.height;
  return verticalOverlap && flatDistance(a.base, b.base) <= a.radius + b.radius;
}

export function ringVsCylinder(r: Ring, c: Cylinder): boolean {
  const verticalOverlap = r.base.y < c.base.y + c.height && c.base.y < r.base.y + r.height;
  if (!verticalOverlap) return false;
  const d = flatDistance(r.base, c.base);
  return d + c.radius >= r.innerRadius && d - c.radius <= r.outerRadius;
}

/** Does `shape` touch the cylinder `target`? (Targets are always character cylinders.) */
export function overlapsCylinder(shape: Shape, target: Cylinder): boolean {
  switch (shape.kind) {
    case 'sphere':
      return sphereVsCylinder(shape, target);
    case 'cylinder':
      return cylinderVsCylinder(shape, target);
    case 'ring':
      return ringVsCylinder(shape, target);
  }
}

/**
 * Distance along a ray to where it first hits a cylinder, or null if it misses.
 * Used for aiming at enemies with the crosshair.
 */
export function rayVsCylinder(origin: Vector3, dir: Vector3, c: Cylinder, maxDistance: number): number | null {
  // Treat the cylinder as a sphere around its middle — plenty accurate for aiming.
  const center = new Vector3(c.base.x, c.base.y + c.height / 2, c.base.z);
  const radius = Math.max(c.radius, c.height / 2);
  const oc = origin.clone().sub(center);
  const b = oc.dot(dir);
  const cc = oc.lengthSq() - radius * radius;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0 || t > maxDistance) return null;
  return t;
}
