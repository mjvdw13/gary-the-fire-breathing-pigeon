import { Registry } from '../../core/Registry';
import type { ProjectileDef } from './Projectile';

/**
 * Every projectile in the game. To make a new one, copy one of these,
 * change the id and numbers, and add it to the register() call at the bottom.
 * (2D game speeds are noted for reference — 3D arenas are bigger, so things fly faster.)
 */

/** Gary's fireball. 2D: 500 px/s, 1 damage (2 in god mode). */
export const fireball: ProjectileDef = {
  id: 'fireball',
  speed: 22,
  damage: 1,
  radius: 0.3,
  lifetime: 2.5,
  trail: 'fireTrail',
  goldTrail: 'goldTrail',
  impact: 'poof',
  spin: 8,
  model: {
    parts: [
      { shape: 'sphere', size: [0.45, 0.45, 0.45], pos: [0, 0, 0], color: '#ff6a00', glow: true },
      { shape: 'sphere', size: [0.28, 0.28, 0.28], pos: [0, 0, 0.05], color: '#fff2a8', glow: true },
    ],
  },
};

/** Violet's laser. 2D: 700 px/s, rapid fire. */
export const laser: ProjectileDef = {
  id: 'laser',
  speed: 34,
  damage: 1,
  radius: 0.15,
  lifetime: 1.5,
  alignToVelocity: true,
  trail: 'laserTrail',
  impact: 'hit',
  model: {
    parts: [
      { size: [0.12, 0.12, 0.9], pos: [0, 0, 0], color: '#ff3dff', glow: true },
      { size: [0.05, 0.05, 0.95], pos: [0, 0, 0], color: '#ffffff', glow: true },
    ],
  },
};

/** Fang's lightning ball. 2D: 600 px/s, 3 damage! */
export const lightning: ProjectileDef = {
  id: 'lightning',
  speed: 26,
  damage: 3,
  radius: 0.4,
  lifetime: 2,
  trail: 'sparks',
  impact: 'sparks',
  spin: 14,
  model: {
    parts: [
      { shape: 'sphere', size: [0.5, 0.5, 0.5], pos: [0, 0, 0], color: '#3aa0ff', glow: true },
      { shape: 'sphere', size: [0.3, 0.3, 0.3], pos: [0, 0, 0], color: '#ffffff', glow: true },
      { size: [0.9, 0.06, 0.06], pos: [0, 0, 0], color: '#bfe8ff', glow: true },
      { size: [0.06, 0.9, 0.06], pos: [0, 0, 0], color: '#bfe8ff', glow: true },
    ],
  },
};

/** Quacks' homing feather. 2D: 350 px/s, tracks enemies within 300 px. */
export const feather: ProjectileDef = {
  id: 'feather',
  speed: 18,
  damage: 1,
  radius: 0.25,
  lifetime: 3,
  alignToVelocity: true,
  homing: { turnRate: 4, range: 18 },
  trail: 'featherTrail',
  impact: 'hit',
  model: {
    parts: [
      { size: [0.03, 0.03, 0.6], pos: [0, 0, 0], color: '#d8c8a0' },
      { size: [0.2, 0.03, 0.45], pos: [0, 0, -0.03], color: '#ffffff' },
      { size: [0.1, 0.035, 0.1], pos: [0, 0, 0.25], color: '#ffe680', glow: true },
    ],
  },
};

/** Giant Cat's bouncing hairball. 2D: bounced 3 times. */
export const hairball: ProjectileDef = {
  id: 'hairball',
  speed: 13,
  damage: 1,
  radius: 0.4,
  lifetime: 6,
  gravity: 15,
  bounces: 3,
  bounciness: 0.8,
  trail: 'hairballTrail',
  impact: 'dust',
  spin: 6,
  model: {
    parts: [
      { shape: 'sphere', size: [0.75, 0.75, 0.75], pos: [0, 0, 0], color: '#aa8866' },
      { size: [0.3, 0.3, 0.3], pos: [0.25, 0.2, 0], color: '#ccaa88' },
      { size: [0.25, 0.25, 0.25], pos: [-0.2, -0.15, 0.2], color: '#886644' },
      { size: [0.2, 0.2, 0.2], pos: [0, 0.1, -0.3], color: '#88aa77' },
    ],
  },
};

/** Construction Worker's thrown nail. */
export const nail: ProjectileDef = {
  id: 'nail',
  speed: 15,
  damage: 1,
  radius: 0.22,
  lifetime: 4,
  gravity: 4,
  alignToVelocity: true,
  impact: 'hit',
  model: {
    parts: [
      { size: [0.07, 0.07, 0.6], pos: [0, 0, 0], color: '#9aa4ad' },
      { size: [0.2, 0.2, 0.05], pos: [0, 0, -0.3], color: '#7a838c' },
      { shape: 'cone', size: [0.08, 0.15, 0.08], pos: [0, 0, 0.36], rot: [Math.PI / 2, 0, 0], color: '#c9d2da' },
    ],
  },
};

export const PROJECTILES = new Registry<ProjectileDef>('projectile').register(
  fireball,
  laser,
  lightning,
  feather,
  hairball,
  nail,
);
