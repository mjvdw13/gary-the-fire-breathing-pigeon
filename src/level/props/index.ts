import { Registry } from '../../core/Registry';
import type { PartsModelDef } from '../../rendering/ModelFactory';
import { sym } from '../../rendering/modelHelpers';

type Vec3 = [number, number, number];

/**
 * Props are reusable level objects: a model + solid boxes to bump into.
 * Positions are relative to the prop's base (y = 0 is the floor it sits on), facing +Z.
 * Use them in a level with  { type: 'acUnit', pos: [x, 0, z], rotY: 0 }.
 */
export interface PropDef {
  id: string;
  model: PartsModelDef;
  /** Solid boxes (center + size). Leave empty for walk-through decoration. */
  colliders: { pos: Vec3; size: Vec3 }[];
}

// ---------- Rooftop (Chapter 1) — from the 2D game's background ----------

const acUnit: PropDef = {
  id: 'acUnit',
  model: {
    parts: [
      { pos: [0, 0.7, 0], size: [2, 1.4, 1.6], color: '#c9ced6', surface: 'metal' },
      { pos: [0, 1.41, 0], size: [1.9, 0.02, 1.5], color: '#9aa1ab', surface: 'metal' },
      { shape: 'cylinder', pos: [0, 1.43, 0], size: [1.1, 0.04, 1.1], color: '#3b4048' },
      { pos: [0, 1.46, 0], size: [1.0, 0.03, 0.1], color: '#8a9099' },
      { pos: [0, 1.46, 0], size: [0.1, 0.03, 1.0], color: '#8a9099' },
      ...[0.3, 0.5, 0.7, 0.9].map((y) => ({ pos: [0, y, 0.81] as Vec3, size: [1.7, 0.06, 0.02] as Vec3, color: '#8a9099' })),
    ],
  },
  colliders: [{ pos: [0, 0.7, 0], size: [2, 1.4, 1.6] }],
};

const vent: PropDef = {
  id: 'vent',
  model: {
    parts: [
      { shape: 'cylinder', pos: [0, 0.6, 0], size: [0.5, 1.2, 0.5], color: '#a4abb4', surface: 'metal' },
      { shape: 'cone', pos: [0, 1.4, 0], size: [0.9, 0.35, 0.9], color: '#7d848d', surface: 'metal' },
      { shape: 'cylinder', pos: [0, 1.25, 0], size: [0.3, 0.1, 0.3], color: '#3b4048' },
    ],
  },
  colliders: [{ pos: [0, 0.7, 0], size: [0.5, 1.4, 0.5] }],
};

const rooftopDoor: PropDef = {
  id: 'rooftopDoor',
  model: {
    parts: [
      { pos: [0, 1.4, 0], size: [3, 2.8, 3], color: '#b7a58f', surface: 'brick' },
      { pos: [0, 2.9, 0], size: [3.3, 0.2, 3.3], color: '#6e6258', surface: 'concrete' },
      { pos: [0, 1.05, 1.51], size: [1.1, 2.1, 0.05], color: '#5a6b7c', surface: 'metal' },
      { pos: [0.4, 1.05, 1.55], size: [0.1, 0.1, 0.06], color: '#d4af37', surface: 'metal' },
      { pos: [0, 2.35, 1.52], size: [0.5, 0.15, 0.04], color: '#2ecc71', glow: true },
    ],
  },
  colliders: [{ pos: [0, 1.5, 0], size: [3.3, 3, 3.3] }],
};

const satelliteDish: PropDef = {
  id: 'satelliteDish',
  model: {
    parts: [
      { pos: [0, 0.15, 0], size: [1, 0.3, 1], color: '#7d848d', surface: 'metal' },
      { shape: 'cylinder', pos: [0, 0.8, 0], size: [0.15, 1.2, 0.15], color: '#a4abb4', surface: 'metal' },
      { shape: 'sphere', pos: [0, 1.7, 0.1], size: [2, 2, 0.5], rot: [-0.5, 0, 0], color: '#e8ebef' },
      { shape: 'cylinder', pos: [0, 2.0, 0.65], size: [0.05, 1, 0.05], rot: [1.0, 0, 0], color: '#7d848d' },
      { pos: [0, 2.25, 1.05], size: [0.14, 0.14, 0.14], color: '#ff4444', glow: true },
    ],
  },
  colliders: [{ pos: [0, 0.9, 0], size: [1, 1.8, 1] }],
};

const waterTower: PropDef = {
  id: 'waterTower',
  model: {
    parts: [
      ...sym({ pos: [1, 2, 1], size: [0.2, 4, 0.2], color: '#5a4a3a', surface: 'wood' }),
      ...sym({ pos: [1, 2, -1], size: [0.2, 4, 0.2], color: '#5a4a3a', surface: 'wood' }),
      { pos: [0, 4.1, 0], size: [2.6, 0.2, 2.6], color: '#6e5a46', surface: 'wood' },
      { shape: 'cylinder', pos: [0, 5.4, 0], size: [2.8, 2.4, 2.8], color: '#8b6b4a', surface: 'wood' },
      { shape: 'cylinder', pos: [0, 4.8, 0], size: [2.85, 0.1, 2.85], color: '#3b3b3b', surface: 'metal' },
      { shape: 'cylinder', pos: [0, 6, 0], size: [2.85, 0.1, 2.85], color: '#3b3b3b', surface: 'metal' },
      { shape: 'cone', pos: [0, 7.0, 0], size: [3.2, 0.9, 3.2], color: '#5a4636', surface: 'wood' },
    ],
  },
  colliders: [
    { pos: [0, 5.4, 0], size: [2.6, 2.6, 2.6] },
    ...[
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ].map(([x, z]) => ({ pos: [x, 2, z] as Vec3, size: [0.2, 4, 0.2] as Vec3 })),
  ],
};

const skylight: PropDef = {
  id: 'skylight',
  model: {
    parts: [
      { pos: [0, 0.3, 0], size: [3, 0.6, 2], color: '#9aa1ab', surface: 'metal' },
      { pos: [0, 0.62, 0], size: [2.8, 0.05, 1.8], color: '#8fd3ff', opacity: 0.6, surface: 'glass' },
    ],
  },
  colliders: [{ pos: [0, 0.32, 0], size: [3, 0.64, 2] }],
};

// ---------- Construction site (Chapter 2) ----------

const crate: PropDef = {
  id: 'crate',
  model: {
    parts: [
      { pos: [0, 0.6, 0], size: [1.2, 1.2, 1.2], color: '#b07a3e', surface: 'wood' },
      { pos: [0, 0.6, 0.61], size: [1.1, 0.12, 0.02], rot: [0, 0, 0.75], color: '#7a5226', surface: 'wood' },
      { pos: [0, 0.6, -0.61], size: [1.1, 0.12, 0.02], rot: [0, 0, 0.75], color: '#7a5226', surface: 'wood' },
    ],
  },
  colliders: [{ pos: [0, 0.6, 0], size: [1.2, 1.2, 1.2] }],
};

const cementMixer: PropDef = {
  id: 'cementMixer',
  model: {
    parts: [
      { pos: [0, 0.5, 0], size: [1.4, 0.3, 2.2], color: '#5a6066', surface: 'metal' },
      ...sym({ shape: 'cylinder', pos: [0.75, 0.35, 0.6], size: [0.6, 0.2, 0.6], rot: [0, 0, Math.PI / 2], color: '#222222' }),
      ...sym({ shape: 'cylinder', pos: [0.75, 0.35, -0.6], size: [0.6, 0.2, 0.6], rot: [0, 0, Math.PI / 2], color: '#222222' }),
      { shape: 'cylinder', pos: [0, 1.3, 0], size: [1.3, 1.6, 1.3], rot: [0.9, 0, 0], color: '#ff8a1a', surface: 'metal' },
      { shape: 'cone', pos: [0, 2.0, 0.55], size: [0.9, 0.6, 0.9], rot: [0.9, 0, 0], color: '#e07010', surface: 'metal' },
    ],
  },
  colliders: [{ pos: [0, 1, 0], size: [1.5, 2, 2.2] }],
};

const trafficCone: PropDef = {
  id: 'trafficCone',
  model: {
    parts: [
      { pos: [0, 0.03, 0], size: [0.5, 0.06, 0.5], color: '#ff6a00' },
      { shape: 'cone', pos: [0, 0.4, 0], size: [0.4, 0.7, 0.4], color: '#ff6a00' },
      { shape: 'cylinder', pos: [0, 0.42, 0], size: [0.27, 0.12, 0.27], color: '#ffffff' },
    ],
  },
  colliders: [],
};

const pipeStack: PropDef = {
  id: 'pipeStack',
  model: {
    parts: [
      ...[-0.6, 0, 0.6].map((x) => ({
        shape: 'cylinder' as const,
        pos: [x, 0.3, 0] as Vec3,
        size: [0.6, 3, 0.6] as Vec3,
        rot: [Math.PI / 2, 0, 0] as Vec3,
        color: '#7d8b99',
        surface: 'metal' as const,
      })),
      ...[-0.3, 0.3].map((x) => ({
        shape: 'cylinder' as const,
        pos: [x, 0.82, 0] as Vec3,
        size: [0.6, 3, 0.6] as Vec3,
        rot: [Math.PI / 2, 0, 0] as Vec3,
        color: '#8e9caa',
        surface: 'metal' as const,
      })),
    ],
  },
  colliders: [{ pos: [0, 0.55, 0], size: [1.8, 1.1, 3] }],
};

const portaPotty: PropDef = {
  id: 'portaPotty',
  model: {
    parts: [
      { pos: [0, 1.2, 0], size: [1.2, 2.4, 1.2], color: '#2f80ed' },
      { pos: [0, 2.45, 0], size: [1.3, 0.1, 1.3], color: '#ffffff' },
      { pos: [0, 1.1, 0.61], size: [0.9, 2, 0.02], color: '#2464be' },
      { pos: [0.3, 1.9, 0.63], size: [0.2, 0.1, 0.02], color: '#ff3b30' },
    ],
  },
  colliders: [{ pos: [0, 1.25, 0], size: [1.3, 2.5, 1.3] }],
};

const barrier: PropDef = {
  id: 'barrier',
  model: {
    parts: [
      { pos: [0, 0.2, 0], size: [2, 0.4, 0.7], color: '#c8c8c0', surface: 'concrete' },
      { pos: [0, 0.65, 0], size: [2, 0.5, 0.4], color: '#d8d8d0', surface: 'concrete' },
      { pos: [0, 0.65, 0.21], size: [1.6, 0.12, 0.02], color: '#ff6a00' },
    ],
  },
  colliders: [{ pos: [0, 0.45, 0], size: [2, 0.9, 0.7] }],
};

export const PROPS = new Registry<PropDef>('prop').register(
  acUnit,
  vent,
  rooftopDoor,
  satelliteDish,
  waterTower,
  skylight,
  crate,
  cementMixer,
  trafficCone,
  pipeStack,
  portaPotty,
  barrier,
);
