import { Group, Vector3 } from 'three';
import { buildModel, PartDef } from '../../rendering/ModelFactory';
import type { BlockDef, LevelDef } from '../LevelDef';

const STEEL = '#c0392b';
const STEEL_DARK = '#8e2a20';

/** A red steel beam you can walk on, held up by two columns. `y` = top of the beam. */
function beam(x: number, y: number, z: number, length: number, rotY = 0): BlockDef[] {
  const along = (d: number): [number, number] => [x + Math.sin(rotY + Math.PI / 2) * d, z + Math.cos(rotY + Math.PI / 2) * d];
  const [x1, z1] = along(length / 2 - 0.4);
  const [x2, z2] = along(-length / 2 + 0.4);
  return [
    { pos: [x, y - 0.2, z], size: [length, 0.4, 1.4], color: STEEL, surface: 'metal', rotY },
    { pos: [x1, (y - 0.4) / 2, z1], size: [0.4, y - 0.4, 0.4], color: STEEL_DARK, surface: 'metal', rotY },
    { pos: [x2, (y - 0.4) / 2, z2], size: [0.4, y - 0.4, 0.4], color: STEEL_DARK, surface: 'metal', rotY },
  ];
}

/** Chapter 2 — a dusty construction site with steel beams to climb. */
export const constructionSite: LevelDef = {
  id: 'constructionSite',
  name: 'Construction Site',
  sky: { skyColor: '#f4c99a', groundColor: '#7a5c3a', fogNear: 60, fogFar: 200, sunIntensity: 2.3 },
  width: 46,
  depth: 46,
  floorColor: '#a08660',
  floorSurface: 'dirt',
  edge: { color: '#c8c8c0', height: 1.1, surface: 'concrete' },
  playerSpawn: new Vector3(0, 0.1, 15),
  bossSpawn: new Vector3(0, 0.1, -17),
  airHeight: [5, 9],
  blocks: [
    // Gravel and concrete pads (decoration)
    { pos: [-10, 0.01, -10], size: [10, 0.02, 8], color: '#b3b3ab', surface: 'concrete', collide: false },
    { pos: [12, 0.01, 10], size: [8, 0.02, 10], color: '#8f7752', surface: 'dirt', collide: false },
    // Steel beams: low tier (~2.3 m) and high tier (~4.6 m)
    ...beam(-9, 2.3, 4, 7),
    ...beam(9, 2.3, -3, 7, Math.PI / 2),
    ...beam(2, 2.3, -12, 6),
    ...beam(-14, 4.6, -6, 6, Math.PI / 2),
    ...beam(12, 4.6, 8, 6),
    ...beam(0, 4.6, 0, 8, Math.PI / 4),
  ],
  props: [
    { type: 'cementMixer', pos: [15, 0, -15], rotY: 0.6 },
    { type: 'crate', pos: [-17, 0, 14] },
    { type: 'crate', pos: [-15.6, 0, 14] },
    { type: 'crate', pos: [-16.3, 1.2, 14], rotY: 0.3 },
    { type: 'crate', pos: [17, 0, 2] },
    { type: 'pipeStack', pos: [-17, 0, -2], rotY: 0.2 },
    { type: 'portaPotty', pos: [18, 0, 17], rotY: -Math.PI / 2 },
    { type: 'portaPotty', pos: [18, 0, 15.5], rotY: -Math.PI / 2 },
    { type: 'barrier', pos: [5, 0, 6], rotY: 0.3 },
    { type: 'barrier', pos: [-4, 0, -4], rotY: -0.5 },
    { type: 'trafficCone', pos: [3, 0, 10] },
    { type: 'trafficCone', pos: [6, 0, 11] },
    { type: 'trafficCone', pos: [-6, 0, 9] },
    { type: 'trafficCone', pos: [-2, 0, -16] },
  ],
  // A few clouds up high for the top tier.
  clouds: [
    [-6, 6.9, -9],
    [8, 6.9, 0],
    [-4, 6.9, 10],
  ],
  scenery: siteScenery,
};

/** A tower crane and an unfinished building outside the fence. */
function siteScenery(root: Group): void {
  const yellow = '#f2c230';
  const parts: PartDef[] = [
    // Ground outside the fence
    { pos: [0, -0.6, 0], size: [400, 1, 400], color: '#8a7354', surface: 'dirt' },
    // Crane tower + jib + counterweight
    { pos: [-36, 20, -30], size: [2, 40, 2], color: yellow },
    { pos: [-30, 40.5, -30], size: [34, 1.2, 1.2], color: yellow },
    { pos: [-44, 39, -30], size: [4, 3, 2.4], color: '#666666' },
    { pos: [-36, 42, -30], size: [3, 3, 3], color: '#e0e0e0' },
    { pos: [-17, 34, -30], size: [0.1, 12, 0.1], color: '#333333' },
    { pos: [-17, 27.8, -30], size: [1.2, 0.8, 1.2], color: STEEL },
  ];
  // Unfinished building skeleton
  for (let floor = 0; floor < 6; floor++) {
    const y = floor * 4;
    parts.push({ pos: [40, y + 4, 25], size: [22, 0.5, 16], color: '#b9b9b0', surface: 'concrete' });
    for (const [dx, dz] of [
      [-10, -7],
      [10, -7],
      [-10, 7],
      [10, 7],
      [0, -7],
      [0, 7],
    ]) {
      parts.push({ pos: [40 + dx, y + 2, 25 + dz], size: [0.6, 4, 0.6], color: STEEL, surface: 'metal' });
    }
  }
  const model = buildModel({ parts });
  model.root.traverse((o) => {
    o.castShadow = false;
  });
  root.add(model.root);
}
