import { DataTexture, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, Texture } from 'three';

/**
 * Surfaces are like Roblox materials: Plastic, Wood, Brick, Concrete...
 * Give any model part (or level block) `surface: 'wood'` and it gets a texture,
 * little bumps (a normal map) and the right shininess.
 *
 * All textures are DRAWN BY CODE when the game starts — no image files needed.
 * Each texture is grey: it is multiplied by the part's color, so wood can be any color.
 *
 * Add your own: write a function that fills `tone` (brightness, 0..1) and `height`
 * (bumps, 0..1) for every pixel, then add it to SURFACES at the bottom.
 */

export type SurfaceName = 'plastic' | 'smooth' | 'concrete' | 'wood' | 'brick' | 'metal' | 'grass' | 'dirt' | 'glass';

export interface Surface {
  /** Brightness pattern (multiplied with the part's color). */
  map?: Texture;
  /** Bumps that catch the light. */
  normalMap?: Texture;
  /** 0 = mirror-shiny, 1 = totally matte. */
  roughness: number;
  /** 0 = plastic/wood/stone, 1 = metal. */
  metalness: number;
}

/** What a surface recipe draws. `size` is pixels per side; the texture covers `meters` x `meters`. */
interface SurfaceRecipe {
  meters: number;
  roughness: number;
  metalness: number;
  /** How deep the bumps look. */
  bumpiness: number;
  draw?: (tone: Float32Array, height: Float32Array, size: number, rand: () => number) => void;
}

const SIZE = 256;

// ---------- Noise helpers (wrap around, so textures tile without seams) ----------

function makeRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Smooth random blobs. `cells` = how many blobs across the texture. */
function noise(size: number, cells: number, rand: () => number): Float32Array {
  const grid = Array.from({ length: cells * cells }, rand);
  const out = new Float32Array(size * size);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = smooth(gx - x0);
      const ty = smooth(gy - y0);
      const at = (i: number, j: number) => grid[(j % cells) * cells + (i % cells)];
      const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
      const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
      out[y * size + x] = top * (1 - ty) + bottom * ty;
    }
  }
  return out;
}

/** Big blobs + small blobs + tiny blobs added together ("fractal" noise), 0..1. */
function fractalNoise(size: number, cells: number, octaves: number, rand: () => number): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 0.5;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const layer = noise(size, cells << o, rand);
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

// ---------- The recipes ----------

const plastic: SurfaceRecipe = {
  meters: 2,
  roughness: 0.5,
  metalness: 0,
  bumpiness: 0.6,
  draw(tone, height, size, rand) {
    const n = fractalNoise(size, 8, 3, rand);
    for (let i = 0; i < n.length; i++) {
      tone[i] = 0.95 + n[i] * 0.05;
      height[i] = n[i] * 0.15;
    }
  },
};

const concrete: SurfaceRecipe = {
  meters: 4,
  roughness: 0.92,
  metalness: 0,
  bumpiness: 1,
  draw(tone, height, size, rand) {
    const blotches = fractalNoise(size, 4, 4, rand);
    const grain = fractalNoise(size, 32, 2, rand);
    for (let i = 0; i < tone.length; i++) {
      const pit = grain[i] < 0.25 ? 1 : 0; // a few little holes
      tone[i] = 0.84 + blotches[i] * 0.16 - pit * 0.04;
      height[i] = grain[i] * 0.2 + blotches[i] * 0.3 - pit * 0.1;
    }
  },
};

const dirt: SurfaceRecipe = {
  meters: 4,
  roughness: 1,
  metalness: 0,
  bumpiness: 1.2,
  draw(tone, height, size, rand) {
    const blotches = fractalNoise(size, 6, 4, rand);
    const pebbles = noise(size, 48, rand);
    for (let i = 0; i < tone.length; i++) {
      const stone = Math.max(0, pebbles[i] - 0.8) * 3; // a few bumps poking up
      tone[i] = 0.8 + blotches[i] * 0.2 + stone * 0.08;
      height[i] = blotches[i] * 0.5 + stone;
    }
  },
};

const grass: SurfaceRecipe = {
  meters: 2,
  roughness: 1,
  metalness: 0,
  bumpiness: 3,
  draw(tone, height, size, rand) {
    const patches = fractalNoise(size, 6, 3, rand);
    for (let i = 0; i < tone.length; i++) {
      const blade = rand();
      tone[i] = 0.7 + patches[i] * 0.2 + blade * 0.1;
      height[i] = blade * 0.6 + patches[i] * 0.4;
    }
  },
};

/** Planks running left-right, 8 boards per texture, with grain and dark gaps. */
const wood: SurfaceRecipe = {
  meters: 2,
  roughness: 0.75,
  metalness: 0,
  bumpiness: 3,
  draw(tone, height, size, rand) {
    const boards = 8;
    const boardH = size / boards;
    const grain = noise(size, 16, rand);
    const boardShade = Array.from({ length: boards }, () => 0.85 + rand() * 0.15);
    const seamAt = Array.from({ length: boards }, () => Math.floor(rand() * size));
    for (let y = 0; y < size; y++) {
      const b = Math.floor(y / boardH);
      const inBoard = (y % boardH) / boardH;
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        // Grain = stretched stripes that wobble a little
        const stripe = Math.sin((y + grain[(y % size) * size + ((x >> 3) % size)] * 12) * 1.7) * 0.5 + 0.5;
        const gap = inBoard < 0.06 || Math.abs(x - seamAt[b]) < 1.5;
        tone[i] = gap ? 0.45 : boardShade[b] * (0.88 + stripe * 0.12);
        height[i] = gap ? 0 : 0.8 + stripe * 0.1;
      }
    }
  },
};

/** Bricks in rows, every other row shifted half a brick, with sunken mortar. */
const brick: SurfaceRecipe = {
  meters: 1,
  roughness: 0.88,
  metalness: 0,
  bumpiness: 4,
  draw(tone, height, size, rand) {
    const rows = 4;
    const perRow = 2;
    const rowH = size / rows;
    const brickW = size / perRow;
    const speckle = fractalNoise(size, 32, 2, rand);
    const shade = Array.from({ length: rows * perRow * 2 }, () => 0.82 + rand() * 0.18);
    for (let y = 0; y < size; y++) {
      const row = Math.floor(y / rowH);
      const shift = row % 2 ? brickW / 2 : 0;
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const bx = (x + shift) % size;
        const col = Math.floor(bx / brickW);
        const mortar = y % rowH < 4 || bx % brickW < 4;
        tone[i] = mortar ? 0.62 : shade[(row * perRow + col) % shade.length] * (0.9 + speckle[i] * 0.1);
        height[i] = mortar ? 0 : 0.9 + speckle[i] * 0.1;
      }
    }
  },
};

/** Brushed metal: fine streaks going one way, plus a panel seam. */
const metal: SurfaceRecipe = {
  meters: 2,
  roughness: 0.38,
  metalness: 0.65,
  bumpiness: 1.5,
  draw(tone, height, size, rand) {
    const streaks = Array.from({ length: size }, rand);
    const blotches = fractalNoise(size, 4, 3, rand);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const seam = x % (size / 2) < 2;
        tone[i] = seam ? 0.6 : 0.88 + streaks[y] * 0.06 + blotches[i] * 0.06;
        height[i] = seam ? 0 : 0.8 + streaks[y] * 0.05;
      }
    }
  },
};

const SURFACES: Record<SurfaceName, SurfaceRecipe> = {
  plastic,
  smooth: { meters: 1, roughness: 0.35, metalness: 0, bumpiness: 0 },
  concrete,
  dirt,
  grass,
  wood,
  brick,
  metal,
  glass: { meters: 1, roughness: 0.08, metalness: 0.9, bumpiness: 0 },
};

// ---------- Turning recipes into textures (only once per surface) ----------

const cache = new Map<SurfaceName, Surface>();

export function getSurface(name: SurfaceName): Surface {
  let surface = cache.get(name);
  if (!surface) {
    surface = bake(SURFACES[name], name.length * 7919);
    cache.set(name, surface);
  }
  return surface;
}

function bake(recipe: SurfaceRecipe, seed: number): Surface {
  const surface: Surface = { roughness: recipe.roughness, metalness: recipe.metalness };
  if (!recipe.draw) return surface;

  const tone = new Float32Array(SIZE * SIZE);
  const height = new Float32Array(SIZE * SIZE);
  recipe.draw(tone, height, SIZE, makeRandom(seed));

  const color = new Uint8Array(SIZE * SIZE * 4);
  const normal = new Uint8Array(SIZE * SIZE * 4);
  const h = (x: number, y: number) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      const t = Math.round(Math.min(1, Math.max(0, tone[i])) * 255);
      color.set([t, t, t, 255], i * 4);
      // Slope of the bumps → which way the surface tilts (a "normal map")
      const dx = (h(x - 1, y) - h(x + 1, y)) * recipe.bumpiness;
      const dy = (h(x, y + 1) - h(x, y - 1)) * recipe.bumpiness;
      const len = Math.hypot(dx, dy, 1);
      normal.set([((dx / len) * 0.5 + 0.5) * 255, ((dy / len) * 0.5 + 0.5) * 255, ((1 / len) * 0.5 + 0.5) * 255, 255], i * 4);
    }
  }
  surface.map = texture(color, recipe.meters);
  surface.normalMap = texture(normal, recipe.meters);
  return surface;
}

function texture(data: Uint8Array, meters: number): Texture {
  const tex = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  // Model UVs are in meters, so one texture covers `meters` meters.
  tex.repeat.set(1 / meters, 1 / meters);
  tex.needsUpdate = true;
  return tex;
}
