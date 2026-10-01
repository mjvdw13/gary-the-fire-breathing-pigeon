/**
 * Which side something is on. Damage only happens between different teams,
 * so enemy hairballs never hurt other enemies and your fireballs never hurt you.
 */
export type Team = 'player' | 'enemy';

export function areEnemies(a: Team | undefined, b: Team | undefined): boolean {
  return a !== undefined && b !== undefined && a !== b;
}
