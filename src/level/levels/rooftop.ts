import { Group, Vector3 } from 'three';
import { pick, randRange } from '../../core/math';
import { buildModel, PartDef } from '../../rendering/ModelFactory';
import type { LevelDef } from '../LevelDef';

/** Chapter 1 — a city rooftop with fading clouds to climb, like the 2D game. */
export const rooftop: LevelDef = {
  id: 'rooftop',
  name: 'Rooftop',
  sky: { skyColor: '#87c8ff', groundColor: '#6b5a48', fogNear: 70, fogFar: 220 },
  width: 44,
  depth: 44,
  floorColor: '#8d9299',
  floorSurface: 'concrete',
  edge: { color: '#a8826a', height: 1, surface: 'brick' },
  playerSpawn: new Vector3(0, 0.1, 14),
  bossSpawn: new Vector3(0, 0.1, -12),
  airHeight: [5, 8.5],
  blocks: [
    // Darker tar patches (decoration only)
    { pos: [-6, 0.01, 4], size: [6, 0.02, 4], color: '#7b8087', surface: 'concrete', collide: false },
    { pos: [9, 0.01, 6], size: [4, 0.02, 7], color: '#7b8087', surface: 'concrete', collide: false },
    { pos: [3, 0.01, -8], size: [8, 0.02, 3], color: '#80858c', surface: 'concrete', collide: false },
  ],
  props: [
    { type: 'rooftopDoor', pos: [-16, 0, -16], rotY: Math.PI / 4 },
    { type: 'acUnit', pos: [10, 0, -14] },
    { type: 'acUnit', pos: [13, 0, -14] },
    { type: 'acUnit', pos: [-13, 0, 9], rotY: Math.PI / 2 },
    { type: 'vent', pos: [5, 0, 9] },
    { type: 'vent', pos: [-5, 0, -6] },
    { type: 'vent', pos: [17, 0, 2] },
    { type: 'satelliteDish', pos: [16, 0, 15], rotY: -Math.PI * 0.75 },
    { type: 'waterTower', pos: [-16, 0, 16] },
    { type: 'skylight', pos: [0, 0, -16] },
  ],
  // Three tiers of clouds, each reachable from the one below (a jump is ~2.6 m).
  clouds: [
    [-8, 2.3, 1],
    [0, 2.3, 6],
    [8, 2.3, -1],
    [-1, 2.3, -9],
    [-12, 4.6, -4],
    [4, 4.6, 13],
    [13, 4.6, 6],
    [-4, 4.6, 3],
    [5, 4.6, -7],
    [-7, 6.9, -11],
    [7, 6.9, -9],
    [0, 6.9, 9],
  ],
  scenery: citySkyline,
};

/** A ring of buildings around the roof, plus the building we're standing on. */
function citySkyline(root: Group, random: () => number): void {
  const parts: PartDef[] = [
    // Our building, below the roof
    { pos: [0, -31, 0], size: [46.5, 60, 46.5], color: '#9c8f80', surface: 'brick' },
  ];
  // Rows of windows on our building
  for (let y = -3; y > -40; y -= 3.5) {
    for (const [x, z, w, d] of [
      [0, 23.3, 44, 0.1],
      [0, -23.3, 44, 0.1],
      [23.3, 0, 0.1, 44],
      [-23.3, 0, 0.1, 44],
    ]) {
      parts.push({ pos: [x, y, z], size: [w, 1.4, d], color: '#5a7a9a', surface: 'glass' });
    }
  }

  const palette = ['#b8b0a4', '#8f9aa6', '#c4a484', '#7d8a96', '#a39181', '#d1c7b7', '#6f7c8a'];
  for (let i = 0; i < 46; i++) {
    const angle = (i / 46) * Math.PI * 2 + randRange(random, -0.05, 0.05);
    const dist = randRange(random, 45, 110);
    const w = randRange(random, 8, 18);
    const d = randRange(random, 8, 18);
    const top = randRange(random, -18, dist > 70 ? 45 : 20);
    const bottom = -80;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const color = pick(random, palette);
    parts.push({ pos: [x, (top + bottom) / 2, z], size: [w, top - bottom, d], rot: [0, -angle, 0], color, surface: 'concrete' });
    // Window stripes on the side facing us
    for (let y = top - 2.5; y > top - 20; y -= 3.5) {
      const fx = x - Math.cos(angle) * (w / 2 + 0.05);
      const fz = z - Math.sin(angle) * (w / 2 + 0.05);
      parts.push({ pos: [fx, y, fz], size: [0.1, 1.2, d * 0.8], rot: [0, -angle, 0], color: '#6d8fb3', surface: 'glass' });
    }
  }
  const model = buildModel({ parts });
  model.root.traverse((o) => {
    o.castShadow = false;
  });
  root.add(model.root);
}
