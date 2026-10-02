import { Color, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeStatic } from './mergeStatic';
import { partGeometry } from './partGeometry';
import { getSurface, SurfaceName } from './surfaces';

/**
 * Builds the blocky, Roblox-style 3D models from a simple list of parts.
 * Each part is a box (or sphere/cylinder/cone) with a size, position and color —
 * just like the drawRect() pixel art in the 2D game, but in 3D.
 *
 * Model coordinates: origin at the FEET, +Y up, the model FACES +Z.
 *
 * Later you can swap any model for one made in Blockbench: export a .glb into
 * public/assets/models/ and use `{ gltf: 'assets/models/gary.glb' }` instead of parts.
 */

type Vec3 = [number, number, number];

export interface PartDef {
  /** Give a part a name to animate it (e.g. 'wingL', 'legR', 'head'). */
  name?: string;
  shape?: 'box' | 'sphere' | 'cylinder' | 'cone';
  /** Width (x), height (y), depth (z) in meters. */
  size: Vec3;
  /** Center of the part, relative to the model's feet. */
  pos: Vec3;
  /** Rotation in radians around x, y, z. */
  rot?: Vec3;
  color: string;
  /** What it's made of: 'wood', 'brick', 'metal', 'concrete', 'glass'... (default 'plastic'). See surfaces.ts. */
  surface?: SurfaceName;
  /** Glows (not affected by lighting). Use for eyes, lasers, fire. */
  glow?: boolean;
  /** Point the part swings around when animated (defaults to its center). E.g. a wing's shoulder. */
  pivot?: Vec3;
  /** Attach to another named part so it moves with it. */
  parent?: string;
  /** Transparency 0..1 (1 = solid). */
  opacity?: number;
}

export interface PartsModelDef {
  parts: PartDef[];
  /** Scale the whole model. */
  scale?: number;
}

export interface GltfModelDef {
  gltf: string;
  scale?: number;
}

export type ModelDef = PartsModelDef | GltfModelDef;

/** A built model: the root object plus quick access to named parts for animation. */
export class BlockModel {
  readonly root = new Group();
  readonly parts = new Map<string, Object3D>();
  readonly materials: MeshStandardMaterial[] = [];
  private baseColors: Color[] = [];
  private tinted = false;

  /** Get a named part (or a do-nothing placeholder so animations never crash). */
  part(name: string): Object3D {
    return this.parts.get(name) ?? DUMMY;
  }

  /** White glow when hit. 0 = normal, 1 = full white. */
  setFlash(amount: number): void {
    for (const m of this.materials) {
      if (m.userData.glow) continue;
      m.emissive.setRGB(amount, amount, amount);
    }
  }

  /** Recolor the whole model (e.g. gold in god mode). null = original colors. */
  setTint(color: string | null): void {
    if (!color && !this.tinted) return;
    this.materials.forEach((m, i) => {
      if (m.userData.glow) return;
      if (color) {
        const lightness = this.baseColors[i].getHSL({ h: 0, s: 0, l: 0 }).l;
        m.color.set(color).offsetHSL(0, 0, (lightness - 0.5) * 0.6);
      } else {
        m.color.copy(this.baseColors[i]);
      }
    });
    this.tinted = color !== null;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  /** Fade the whole model (fading clouds). */
  setOpacity(opacity: number): void {
    for (const m of this.materials) {
      m.transparent = opacity < 1 || m.userData.baseOpacity < 1;
      m.opacity = opacity * m.userData.baseOpacity;
    }
  }

  /**
   * Speed trick for models that never animate their parts (clouds, props):
   * glue the parts into a few meshes. See mergeStatic.ts.
   */
  mergeParts(): this {
    mergeStatic(this.root);
    this.materials.length = 0;
    this.baseColors.length = 0;
    this.root.traverse((obj) => {
      if (obj instanceof Mesh && obj.material instanceof MeshStandardMaterial) this.trackMaterial(obj.material);
    });
    return this;
  }

  /** @internal */
  trackMaterial(m: MeshStandardMaterial): void {
    this.materials.push(m);
    this.baseColors.push(m.color.clone());
  }
}

const DUMMY = new Object3D();

export function buildModel(def: ModelDef): BlockModel {
  const model = new BlockModel();
  if ('gltf' in def) {
    loadGltfInto(model, def.gltf);
  } else {
    buildParts(model, def.parts);
  }
  model.root.scale.setScalar(def.scale ?? 1);
  return model;
}

function buildParts(model: BlockModel, parts: PartDef[]): void {
  for (const part of parts) {
    const surface = getSurface(part.surface ?? 'plastic');
    const material = new MeshStandardMaterial({
      color: part.color,
      map: surface.map,
      normalMap: surface.normalMap,
      roughness: surface.roughness,
      metalness: surface.metalness,
      // Glowing parts are extra bright so the bloom effect makes them shine.
      emissive: part.glow ? new Color(part.color) : new Color(0),
      emissiveIntensity: part.glow ? 2.5 : 1,
      transparent: (part.opacity ?? 1) < 1,
      opacity: part.opacity ?? 1,
    });
    material.userData.glow = !!part.glow;
    material.userData.surface = part.surface ?? 'plastic';
    material.userData.baseOpacity = part.opacity ?? 1;
    model.trackMaterial(material);

    const mesh = new Mesh(partGeometry(part.shape ?? 'box', part.size), material);
    if (part.rot) mesh.rotation.set(...part.rot);
    mesh.castShadow = (part.opacity ?? 1) >= 1;
    mesh.receiveShadow = true;

    const parent = part.parent ? model.part(part.parent) : model.root;
    // Positions of child parts are given in model space; convert to the parent's space.
    const parentOrigin = part.parent ? worldOffsetOf(model, part.parent) : [0, 0, 0];

    if (part.name || part.pivot) {
      // Named parts get a pivot group so rotating them swings around the pivot point.
      const pivot = part.pivot ?? part.pos;
      const group = new Group();
      group.name = part.name ?? '';
      group.position.set(pivot[0] - parentOrigin[0], pivot[1] - parentOrigin[1], pivot[2] - parentOrigin[2]);
      group.userData.modelOrigin = pivot;
      mesh.position.set(part.pos[0] - pivot[0], part.pos[1] - pivot[1], part.pos[2] - pivot[2]);
      group.add(mesh);
      parent.add(group);
      if (part.name) model.parts.set(part.name, group);
    } else {
      mesh.position.set(part.pos[0] - parentOrigin[0], part.pos[1] - parentOrigin[1], part.pos[2] - parentOrigin[2]);
      parent.add(mesh);
    }
  }
}

function worldOffsetOf(model: BlockModel, name: string): Vec3 {
  return (model.parts.get(name)?.userData.modelOrigin as Vec3 | undefined) ?? [0, 0, 0];
}

const gltfLoader = new GLTFLoader();

function loadGltfInto(model: BlockModel, url: string): void {
  gltfLoader.load(
    url,
    (gltf) => {
      gltf.scene.traverse((obj) => {
        if (obj instanceof Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material instanceof MeshStandardMaterial) {
            obj.material.userData.baseOpacity = obj.material.opacity;
            model.trackMaterial(obj.material);
          }
        }
        // Named nodes from Blockbench can be animated just like named parts.
        if (obj.name) model.parts.set(obj.name, obj);
      });
      model.root.add(gltf.scene);
    },
    undefined,
    (err) => console.error(`Could not load model ${url}`, err),
  );
}

/** Free GPU memory for an object tree (shared geometries are kept). */
export function disposeObject(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      if (!obj.geometry.userData.shared) obj.geometry.dispose();
      const mats: Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m.dispose();
    }
  });
}
