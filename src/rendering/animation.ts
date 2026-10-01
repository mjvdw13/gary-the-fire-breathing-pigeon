import type { BlockModel } from './ModelFactory';

/**
 * Simple code-driven animations that work on any model with the right part names:
 *   legL / legR   – swing when walking
 *   wingL / wingR – flap (fast when flying)
 *   armL / armR   – swing opposite to legs
 *   body          – bobs while walking
 *   tail          – wags
 * Missing parts are simply skipped, so every model can use these.
 */
export interface AnimState {
  /** Horizontal speed in m/s. */
  speed: number;
  grounded: boolean;
  flying?: boolean;
  /** Seconds, keeps increasing. */
  time: number;
}

export function animateCreature(model: BlockModel, s: AnimState): void {
  const walking = s.grounded && s.speed > 0.3;
  const stride = walking ? Math.sin(s.time * (6 + s.speed * 1.2)) * 0.7 : 0;

  model.part('legL').rotation.x = stride;
  model.part('legR').rotation.x = -stride;
  model.part('armL').rotation.x = -stride * 0.8;
  model.part('armR').rotation.x = stride * 0.8;

  const bob = walking ? Math.abs(Math.sin(s.time * (6 + s.speed * 1.2))) * 0.06 : 0;
  model.part('body').position.y = (model.part('body').userData.modelOrigin?.[1] ?? 0) + bob;

  // Wings: tucked when walking, flapping in the air, frantic when flying.
  let flap = 0;
  if (s.flying) flap = Math.sin(s.time * 30) * 0.9;
  else if (!s.grounded) flap = Math.sin(s.time * 16) * 0.6;
  else flap = Math.sin(s.time * 2) * 0.05;
  model.part('wingL').rotation.z = flap;
  model.part('wingR').rotation.z = -flap;

  model.part('tail').rotation.y = Math.sin(s.time * 4) * 0.25;
}

/** Spin named propellers/rotors ('prop1', 'prop2', ...). */
export function spinParts(model: BlockModel, prefix: string, count: number, angle: number): void {
  for (let i = 1; i <= count; i++) model.part(`${prefix}${i}`).rotation.y = angle * (i % 2 ? 1 : -1);
}
