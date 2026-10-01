import { DoubleJump } from '../../abilities/DoubleJump';
import { ShootAbility } from '../../abilities/ShootAbility';
import { px } from '../../config/tuning';
import { sym } from '../../rendering/modelHelpers';
import type { CharacterDef } from '../CharacterDef';

/** Gary — the original fire-breathing pigeon. Balanced: fireballs + double jump. */
export const gary: CharacterDef = {
  id: 'gary',
  name: 'Gary',
  title: 'The Fire Pigeon',
  description: 'Fire-breathing pigeon. Double jump!',
  color: '#8899AA',
  stats: {
    moveSpeed: px(300), // 7.5 m/s
    jumpSpeed: px(500), // ~2.6 m high
    radius: 0.4,
    height: 1.1,
  },
  muzzle: [0, 0.95, 0.6],
  abilities: () => [
    new ShootAbility({ name: 'Fire Breath', projectile: 'fireball', cooldown: 0.3 }),
    new DoubleJump(),
  ],
  allowsCompanion: true,
  model: {
    parts: [
      // Legs (pink) with feet
      ...sym({ name: 'leg', pos: [0.13, 0.15, 0], pivot: [0.13, 0.3, 0], size: [0.08, 0.3, 0.08], color: '#e8737f' }),
      ...sym({ parent: 'legL', pos: [0.13, 0.02, 0.06], size: [0.16, 0.04, 0.22], color: '#e8737f' }),
      // Body
      { name: 'body', pos: [0, 0.55, 0], size: [0.6, 0.5, 0.75], color: '#8c99a8' },
      { parent: 'body', pos: [0, 0.45, 0.12], size: [0.5, 0.32, 0.58], color: '#a3afbd' },
      // Shiny green/purple neck
      { parent: 'body', pos: [0, 0.8, 0.24], size: [0.4, 0.16, 0.34], color: '#3f8f7a' },
      { parent: 'body', pos: [0, 0.72, 0.3], size: [0.42, 0.08, 0.3], color: '#7a5a9a' },
      // Head
      { name: 'head', parent: 'body', pos: [0, 0.98, 0.3], size: [0.4, 0.36, 0.42], color: '#6f7d8c' },
      { parent: 'head', pos: [0, 0.94, 0.57], size: [0.13, 0.09, 0.16], color: '#e2c9a0' },
      { parent: 'head', pos: [0, 0.92, 0.66], size: [0.09, 0.07, 0.06], color: '#4a4a4a' },
      ...sym({ parent: 'head', pos: [0.201, 1.02, 0.4], size: [0.02, 0.11, 0.11], color: '#ff7a1a' }),
      ...sym({ parent: 'head', pos: [0.212, 1.02, 0.41], size: [0.02, 0.05, 0.05], color: '#111111' }),
      // Wings with dark bars
      ...sym({ name: 'wing', parent: 'body', pivot: [0.3, 0.74, 0.05], pos: [0.34, 0.56, -0.04], size: [0.1, 0.4, 0.62], color: '#7a8796' }),
      ...sym({ parent: 'wingL', pos: [0.35, 0.5, -0.1], size: [0.1, 0.06, 0.5], color: '#3d4552' }),
      ...sym({ parent: 'wingL', pos: [0.35, 0.4, -0.1], size: [0.1, 0.06, 0.5], color: '#3d4552' }),
      // Tail
      { name: 'tail', parent: 'body', pivot: [0, 0.6, -0.35], pos: [0, 0.58, -0.5], size: [0.4, 0.1, 0.32], color: '#4b5563' },
    ],
  },
};
