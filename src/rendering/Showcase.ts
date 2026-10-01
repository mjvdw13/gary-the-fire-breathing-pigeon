import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import type { CharacterDef } from '../player/CharacterDef';
import { animateCreature } from './animation';
import { BlockModel, buildModel, disposeObject } from './ModelFactory';

/**
 * The little 3D stage used on the menus: the selected character spins on a pedestal.
 */
export class Showcase {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(40, 1, 0.1, 100);
  private model: BlockModel | null = null;
  private time = 0;

  constructor() {
    this.scene.background = new Color('#1a0a2e');
    this.scene.add(new HemisphereLight(0xffffff, 0x442266, 1.6));
    const key = new DirectionalLight(0xffffff, 2.5);
    key.position.set(3, 5, 4);
    this.scene.add(key);
    const rim = new DirectionalLight(0xff66cc, 1.5);
    rim.position.set(-4, 2, -3);
    this.scene.add(rim);

    const pedestal = new Mesh(
      new CylinderGeometry(1.1, 1.25, 0.4, 40),
      new MeshStandardMaterial({ color: '#3a2a5a', roughness: 0.4 }),
    );
    pedestal.position.y = -0.2;
    this.scene.add(pedestal);

    this.camera.position.set(0, 1.4, 4.4);
    this.camera.lookAt(0, 0.4, 0);
  }

  setCharacter(def: CharacterDef): void {
    if (this.model) {
      this.scene.remove(this.model.root);
      disposeObject(this.model.root);
    }
    this.model = buildModel(def.model);
    this.scene.add(this.model.root);
    this.scene.background = new Color(def.color).lerp(new Color('#1a0a2e'), 0.82);
  }

  update(dt: number): void {
    this.time += dt;
    if (!this.model) return;
    this.model.root.rotation.y = this.time * 0.8;
    this.model.root.position.y = Math.max(0, Math.sin(this.time * 2.2)) * 0.15;
    animateCreature(this.model, {
      speed: 0,
      grounded: this.model.root.position.y < 0.02,
      time: this.time,
    });
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
