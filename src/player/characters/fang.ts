import { Dash } from '../../abilities/Dash';
import { DoubleJump } from '../../abilities/DoubleJump';
import { ShootAbility } from '../../abilities/ShootAbility';
import { px } from '../../config/tuning';
import { sym } from '../../rendering/modelHelpers';
import type { CharacterDef } from '../CharacterDef';

/** Fang — the fastest bird. Slow but powerful lightning, double jump, and a dash (Shift). */
export const fang: CharacterDef = {
  id: 'fang',
  name: 'Fang',
  title: 'The Lightning Falcon',
  description: 'Lightning blasts (3 dmg). Shift to dash!',
  color: '#4A3728',
  stats: {
    moveSpeed: px(400),
    jumpSpeed: px(480),
    radius: 0.4,
    height: 1.2,
  },
  muzzle: [0, 1.0, 0.6],
  abilities: () => [
    new ShootAbility({ name: 'Lightning', projectile: 'lightning', cooldown: 0.4 }),
    new DoubleJump(),
    new Dash({ speed: px(800), duration: 0.15, cooldown: 0.8 }),
  ],
  allowsCompanion: true,
  model: {
    parts: [
      ...sym({ name: 'leg', pos: [0.13, 0.16, 0], pivot: [0.13, 0.32, 0], size: [0.09, 0.32, 0.09], color: '#f0c020' }),
      ...sym({ parent: 'legL', pos: [0.13, 0.03, 0.07], size: [0.18, 0.05, 0.24], color: '#f0c020' }),
      { name: 'body', pos: [0, 0.6, 0], size: [0.58, 0.56, 0.8], color: '#4a3728' },
      // Spotted cream chest
      { parent: 'body', pos: [0, 0.56, 0.3], size: [0.44, 0.44, 0.24], color: '#e8d8b8' },
      ...sym({ parent: 'body', pos: [0.1, 0.6, 0.43], size: [0.06, 0.06, 0.02], color: '#4a3728' }),
      ...sym({ parent: 'body', pos: [0.05, 0.46, 0.43], size: [0.06, 0.06, 0.02], color: '#4a3728' }),
      // Head with dark "mask" and hooked beak
      { name: 'head', parent: 'body', pos: [0, 1.05, 0.25], size: [0.42, 0.38, 0.44], color: '#3a2a1e' },
      { parent: 'head', pos: [0, 0.98, 0.42], size: [0.36, 0.14, 0.12], color: '#e8d8b8' },
      { parent: 'head', pos: [0, 1.02, 0.52], size: [0.14, 0.12, 0.14], color: '#f0c020' },
      { parent: 'head', pos: [0, 0.95, 0.6], size: [0.08, 0.1, 0.06], color: '#222222' },
      ...sym({ parent: 'head', pos: [0.15, 1.1, 0.46], size: [0.1, 0.1, 0.03], color: '#ffd84a' }),
      ...sym({ parent: 'head', pos: [0.15, 1.1, 0.475], size: [0.05, 0.05, 0.02], color: '#111111' }),
      // Long pointed wings with electric tips
      ...sym({ name: 'wing', parent: 'body', pivot: [0.3, 0.82, 0.05], pos: [0.34, 0.62, -0.1], size: [0.1, 0.46, 0.78], color: '#5c4433' }),
      ...sym({ parent: 'wingL', pos: [0.35, 0.44, -0.45], size: [0.08, 0.12, 0.2], color: '#7fd4ff', glow: true }),
      { name: 'tail', parent: 'body', pivot: [0, 0.62, -0.38], pos: [0, 0.6, -0.6], size: [0.34, 0.08, 0.46], color: '#3a2a1e' },
    ],
  },
};
