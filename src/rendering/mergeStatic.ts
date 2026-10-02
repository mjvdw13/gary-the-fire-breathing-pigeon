import { BufferAttribute, BufferGeometry, Color, Matrix4, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getSurface, SurfaceName } from './surfaces';

/**
 * Speed trick: glue all the parts that never move into a few BIG meshes.
 *
 * The graphics card is fast at drawing lots of triangles, but slow at starting each
 * separate drawing ("draw call"). A level built from 400 boxes = 400 draw calls, done
 * 3 times a frame (picture, shadows, ambient occlusion). Glued together it's about 10.
 *
 * Each part's color is stored on its corners ("vertex colors"), so parts with different
 * colors can still share one mesh. Parts are grouped by surface (wood, brick...) because
 * each surface needs its own textures. Glowing and see-through parts are left alone.
 *
 * Only use this on things that don't move or animate parts (levels, props, clouds).
 */
export function mergeStatic(root: Object3D): MeshStandardMaterial[] {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const groups = new Map<string, { surface: SurfaceName; castShadow: boolean; geometries: BufferGeometry[] }>();
  const glued: Mesh[] = [];

  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const material = obj.material;
    if (!(material instanceof MeshStandardMaterial)) return;
    if (!material.userData.surface || material.userData.glow || material.transparent) return;

    const key = `${material.userData.surface}|${obj.castShadow}`;
    let group = groups.get(key);
    if (!group) {
      group = { surface: material.userData.surface, castShadow: obj.castShadow, geometries: [] };
      groups.set(key, group);
    }
    const matrix = new Matrix4().multiplyMatrices(toRoot, obj.matrixWorld);
    group.geometries.push(bakedCopy(obj.geometry, matrix, material.color));
    glued.push(obj);
  });

  for (const mesh of glued) {
    mesh.removeFromParent();
    (mesh.material as MeshStandardMaterial).dispose();
  }

  const materials: MeshStandardMaterial[] = [];
  for (const group of groups.values()) {
    const surface = getSurface(group.surface);
    const material = new MeshStandardMaterial({
      vertexColors: true,
      map: surface.map,
      normalMap: surface.normalMap,
      roughness: surface.roughness,
      metalness: surface.metalness,
    });
    material.userData = { surface: group.surface, baseOpacity: 1 };
    const mesh = new Mesh(mergeGeometries(group.geometries), material);
    mesh.castShadow = group.castShadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    materials.push(material);
    for (const geo of group.geometries) geo.dispose();
  }
  return materials;
}

/** A copy of a part's shape, moved to where the part is, with its color painted on. */
function bakedCopy(source: BufferGeometry, matrix: Matrix4, color: Color): BufferGeometry {
  const geo = source.index ? source.toNonIndexed() : source.clone();
  for (const name of Object.keys(geo.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
  }
  geo.applyMatrix4(matrix);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([color.r, color.g, color.b], i * 3);
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  return geo;
}
