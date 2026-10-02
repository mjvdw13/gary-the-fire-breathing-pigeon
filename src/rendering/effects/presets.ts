/**
 * Particle effect recipes. Add a new one here and use it with
 * ctx.particles.burst('yourEffect', position).
 */
export interface ParticlePreset {
  count: number;
  colors: string[];
  /** [min, max] cube size in meters. */
  size: [number, number];
  /** [min, max] seconds each particle lives. */
  life: [number, number];
  /** [min, max] starting speed in m/s, in a random direction. */
  speed: [number, number];
  /** Extra upward speed. */
  upward: number;
  /** Pull down per second (negative floats up). */
  gravity: number;
  /** Air resistance — higher slows down faster. */
  drag: number;
  /** How far from the center particles start. */
  spread: number;
  /** Extra brightness so the particles glow (bloom). 1 = normal, 3 = very bright. */
  glow?: number;
}

const preset = (p: ParticlePreset) => p;

export const PARTICLE_PRESETS = {
  /** Enemy defeated (the 2D "poof"). */
  poof: preset({
    count: 28,
    colors: ['#ffffff', '#e8e8e8', '#cccccc', '#ffd27a'],
    size: [0.15, 0.35],
    life: [0.35, 0.8],
    speed: [2, 6],
    upward: 2,
    gravity: 4,
    drag: 3,
    spread: 0.3,
  }),
  bigExplosion: preset({
    count: 90,
    colors: ['#ff5a1f', '#ffb000', '#fff3a0', '#ffffff', '#555555'],
    size: [0.25, 0.6],
    life: [0.6, 1.4],
    speed: [4, 12],
    upward: 4,
    gravity: 6,
    drag: 2,
    spread: 1,
    glow: 1.8,
  }),
  hit: preset({
    count: 8,
    colors: ['#ffffff', '#ffe08a'],
    size: [0.06, 0.14],
    life: [0.15, 0.3],
    speed: [3, 6],
    upward: 0,
    gravity: 0,
    drag: 4,
    spread: 0.05,
  }),
  fireTrail: preset({
    count: 2,
    colors: ['#ff3d00', '#ff8a00', '#ffd000', '#fff2a8'],
    size: [0.08, 0.2],
    life: [0.15, 0.35],
    speed: [0.2, 1],
    upward: 1,
    gravity: -2,
    drag: 2,
    spread: 0.1,
    glow: 1.8,
  }),
  goldTrail: preset({
    count: 2,
    colors: ['#ffd700', '#fff6b0', '#ffffff'],
    size: [0.08, 0.2],
    life: [0.2, 0.4],
    speed: [0.2, 1],
    upward: 0.5,
    gravity: -1,
    drag: 2,
    spread: 0.1,
    glow: 1.8,
  }),
  laserTrail: preset({
    count: 1,
    colors: ['#ff4dff', '#ff9cff', '#ffffff'],
    size: [0.05, 0.1],
    life: [0.1, 0.2],
    speed: [0, 0.5],
    upward: 0,
    gravity: 0,
    drag: 1,
    spread: 0.05,
    glow: 1.8,
  }),
  sparks: preset({
    count: 3,
    colors: ['#7fd4ff', '#ffffff', '#3aa0ff', '#fff47a'],
    size: [0.05, 0.12],
    life: [0.15, 0.4],
    speed: [1, 5],
    upward: 0,
    gravity: 3,
    drag: 2,
    spread: 0.15,
    glow: 1.8,
  }),
  featherTrail: preset({
    count: 1,
    colors: ['#ffffff', '#f4f4f4', '#ffe9a8'],
    size: [0.06, 0.12],
    life: [0.25, 0.5],
    speed: [0, 0.4],
    upward: 0,
    gravity: 1,
    drag: 2,
    spread: 0.05,
  }),
  dust: preset({
    count: 30,
    colors: ['#b9a58c', '#a08a70', '#d8c8b0'],
    size: [0.2, 0.45],
    life: [0.4, 0.9],
    speed: [3, 7],
    upward: 1,
    gravity: 2,
    drag: 3,
    spread: 0.5,
  }),
  jumpPuff: preset({
    count: 8,
    colors: ['#ffffff', '#dddddd'],
    size: [0.1, 0.2],
    life: [0.2, 0.4],
    speed: [1, 2.5],
    upward: 0,
    gravity: 0,
    drag: 4,
    spread: 0.2,
  }),
  cloudPuff: preset({
    count: 20,
    colors: ['#ffffff', '#f0f8ff', '#e3eef8'],
    size: [0.25, 0.5],
    life: [0.4, 0.8],
    speed: [1, 3],
    upward: 0.5,
    gravity: 0,
    drag: 3,
    spread: 1,
  }),
  hairballTrail: preset({
    count: 1,
    colors: ['#aa8866', '#88aa77'],
    size: [0.06, 0.12],
    life: [0.2, 0.4],
    speed: [0, 0.5],
    upward: 0,
    gravity: 2,
    drag: 1,
    spread: 0.1,
  }),
  playerHurt: preset({
    count: 20,
    colors: ['#ff3355', '#ffffff', '#ff8899'],
    size: [0.08, 0.18],
    life: [0.3, 0.6],
    speed: [2, 5],
    upward: 2,
    gravity: 6,
    drag: 2,
    spread: 0.3,
  }),
};

export type ParticlePresetName = keyof typeof PARTICLE_PRESETS;
