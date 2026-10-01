/** Small math helpers shared around the game. */

/** Smoothly turn an angle toward a target, taking the short way around. `lambda` = how fast. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-lambda * dt));
}

/** Random number between min and max. */
export const randRange = (random: () => number, min: number, max: number): number => min + random() * (max - min);

/** Pick a random item from a list. */
export const pick = <T>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)];
