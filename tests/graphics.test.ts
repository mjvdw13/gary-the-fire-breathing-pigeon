import { beforeEach, describe, expect, it } from 'vitest';
import { BufferGeometry, Mesh, MeshStandardMaterial } from 'three';
import { GRAPHICS } from '../src/config/graphics';
import { AutoQuality } from '../src/rendering/AutoQuality';
import { buildModel } from '../src/rendering/ModelFactory';
import { mergeStatic } from '../src/rendering/mergeStatic';

/** Pretend `seconds` of frames went by at `fps`. */
function play(quality: AutoQuality, fps: number, seconds: number) {
  for (let t = 0; t < seconds; t += 1 / fps) quality.update(1 / fps);
}

describe('AutoQuality', () => {
  beforeEach(() => {
    GRAPHICS.autoQuality = true;
  });

  it('steps down when the game is slow, and back up when it is smooth', () => {
    const quality = new AutoQuality();
    quality['apply'](0);
    play(quality, 30, 2.1);
    expect(quality.step).toBe(1);
    expect(GRAPHICS.resolution).toBeLessThan(1);

    play(quality, 60, 9);
    expect(quality.step).toBe(0);
    expect(GRAPHICS.resolution).toBe(1);
  });

  it('waits longer before trying again after a step up was too much', () => {
    const quality = new AutoQuality();
    quality['apply'](1);
    play(quality, 60, 8.1); // smooth → tries step 0
    expect(quality.step).toBe(0);
    play(quality, 30, 2.1); // too slow → back to step 1
    expect(quality.step).toBe(1);
    play(quality, 60, 8.1); // 8 s isn't enough any more
    expect(quality.step).toBe(1);
    play(quality, 60, 8.1); // 16 s is
    expect(quality.step).toBe(0);
  });

  it('ignores huge pauses (hidden tab) and does nothing when turned off', () => {
    const quality = new AutoQuality();
    quality['apply'](0);
    for (let i = 0; i < 10; i++) quality.update(1);
    expect(quality.step).toBe(0);
    GRAPHICS.autoQuality = false;
    play(quality, 20, 5);
    expect(quality.step).toBe(0);
  });
});

describe('mergeStatic', () => {
  it('glues plain parts into one mesh per surface, but leaves glowing parts alone', () => {
    const model = buildModel({
      parts: [
        { pos: [0, 0.5, 0], size: [1, 1, 1], color: '#ff0000' },
        { pos: [2, 0.5, 0], size: [1, 1, 1], color: '#00ff00' },
        { pos: [4, 0.5, 0], size: [1, 1, 1], color: '#0000ff', surface: 'wood' },
        { pos: [0, 2, 0], size: [0.2, 0.2, 0.2], color: '#ffff00', glow: true },
      ],
    });
    mergeStatic(model.root);

    const meshes: Mesh<BufferGeometry, MeshStandardMaterial>[] = [];
    model.root.traverse((o) => {
      if (o instanceof Mesh) meshes.push(o as Mesh<BufferGeometry, MeshStandardMaterial>);
    });
    expect(meshes).toHaveLength(3); // plastic, wood, and the glowing part
    const plastic = meshes.find((m) => m.material.userData.surface === 'plastic' && !m.material.userData.glow)!;
    expect(plastic.material.vertexColors).toBe(true);
    // The second box was moved 2 m to the right when glued in.
    plastic.geometry.computeBoundingBox();
    expect(plastic.geometry.boundingBox!.max.x).toBeCloseTo(2.5);
  });
});
