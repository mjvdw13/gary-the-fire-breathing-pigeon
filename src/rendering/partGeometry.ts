import { BoxGeometry, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * The 3D shapes for model parts, made at their real size.
 *
 * - Boxes get slightly ROUNDED EDGES (a "bevel"). Real toys have them, and the
 *   rounded edge catches the light, which makes blocky things look solid instead of flat.
 * - Texture coordinates (UVs) are in METERS, so a wood texture looks the same size on a
 *   tiny crate and a giant wall instead of being stretched.
 *
 * Shapes are cached: every part with the same shape and size shares one geometry.
 */

type Shape = 'box' | 'sphere' | 'cylinder' | 'cone';
type Vec3 = [number, number, number];

const cache = new Map<string, BufferGeometry>();

export function partGeometry(shape: Shape, size: Vec3): BufferGeometry {
  const key = `${shape}:${size.join(',')}`;
  let geo = cache.get(key);
  if (!geo) {
    geo = shape === 'box' ? roundedBox(size) : roundShape(shape, size);
    geo.userData.shared = true; // don't throw it away when one model is removed
    cache.set(key, geo);
  }
  return geo;
}

/** How round the box edges are: small, and never more than a fifth of the thinnest side. */
function bevelFor(size: Vec3): number {
  return Math.min(0.05, Math.min(...size) * 0.2);
}

/**
 * A rounded box has ~9x more triangles than a plain one, so only round the edges where
 * you could actually see it: not on huge things (buildings, floors) or paper-thin ones.
 */
function worthRounding(size: Vec3): boolean {
  return Math.max(...size) <= 6 && bevelFor(size) >= 0.01;
}

function roundedBox([w, h, d]: Vec3): BufferGeometry {
  const geo = worthRounding([w, h, d])
    ? new RoundedBoxGeometry(w, h, d, 1, bevelFor([w, h, d])) // 1 segment = one soft edge strip
    : new BoxGeometry(w, h, d);
  // "Box projection": each face gets UVs from the two directions it spreads along.
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const [nx, ny, nz] = [Math.abs(normal.getX(i)), Math.abs(normal.getY(i)), Math.abs(normal.getZ(i))];
    if (ny >= nx && ny >= nz) uv.set([x, z], i * 2); // top / bottom
    else if (nx >= nz) uv.set([z, y], i * 2); // left / right
    else uv.set([x, y], i * 2); // front / back
  }
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  return geo;
}

function roundShape(shape: Exclude<Shape, 'box'>, [w, h, d]: Vec3): BufferGeometry {
  const geo =
    shape === 'sphere'
      ? new SphereGeometry(0.5, 16, 10)
      : shape === 'cylinder'
        ? new CylinderGeometry(0.5, 0.5, 1, 16)
        : new ConeGeometry(0.5, 1, 16);
  geo.scale(w, h, d);
  // Stretch the UVs so 1 UV unit = 1 meter around and up the shape.
  const around = Math.PI * (w + d) * 0.5;
  const up = shape === 'sphere' ? around / 2 : h;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * around, uv.getY(i) * up);
  return geo;
}
