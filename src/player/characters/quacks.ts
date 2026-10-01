import { Flight } from '../../abilities/Flight';
import { ShootAbility } from '../../abilities/ShootAbility';
import { px } from '../../config/tuning';
import { sym } from '../../rendering/modelHelpers';
import type { CharacterDef } from '../CharacterDef';

/** Quacks — fires 3 homing feathers at once, and can fly longer than Violet. */
export const quacks: CharacterDef = {
  id: 'quacks',
  name: 'Quacks',
  title: 'The Feather Duck',
  description: '3 homing feathers. Hold jump to fly!',
  color: '#FFFFFF',
  stats: {
    moveSpeed: px(280),
    jumpSpeed: px(380),
    radius: 0.4,
    height: 1.05,
  },
  muzzle: [0, 0.9, 0.7],
  abilities: () => [
    new ShootAbility({ name: 'Feathers', projectile: 'feather', cooldown: 0.5, count: 3, spread: 0.25 }),
    new Flight({ flySpeed: px(220), maxFlyTime: 3, rechargeRate: 0.8 }),
  ],
  allowsCompanion: true,
  model: {
    parts: [
      ...sym({ name: 'leg', pos: [0.14, 0.12, 0], pivot: [0.14, 0.24, 0], size: [0.07, 0.24, 0.07], color: '#ff8c00' }),
      ...sym({ parent: 'legL', pos: [0.14, 0.02, 0.08], size: [0.22, 0.04, 0.26], color: '#ff8c00' }),
      { name: 'body', pos: [0, 0.48, -0.02], size: [0.62, 0.46, 0.8], color: '#ffffff' },
      { parent: 'body', pos: [0, 0.38, 0.05], size: [0.52, 0.3, 0.66], color: '#e6e6e6' },
      { name: 'head', parent: 'body', pos: [0, 0.9, 0.28], size: [0.38, 0.38, 0.38], color: '#ffffff' },
      { parent: 'body', pos: [0, 0.7, 0.24], size: [0.26, 0.2, 0.26], color: '#ffffff' },
      // Wide orange bill
      { parent: 'head', pos: [0, 0.84, 0.54], size: [0.26, 0.07, 0.22], color: '#ff8c00' },
      { parent: 'head', pos: [0, 0.79, 0.52], size: [0.22, 0.04, 0.18], color: '#dd6600' },
      ...sym({ parent: 'head', pos: [0.13, 0.96, 0.43], size: [0.08, 0.08, 0.04], color: '#111111' }),
      ...sym({ parent: 'head', pos: [0.145, 0.98, 0.45], size: [0.03, 0.03, 0.02], color: '#ffffff' }),
      ...sym({ name: 'wing', parent: 'body', pivot: [0.31, 0.66, 0], pos: [0.34, 0.5, -0.08], size: [0.08, 0.34, 0.6], color: '#eeeeee' }),
      ...sym({ parent: 'wingL', pos: [0.35, 0.4, -0.25], size: [0.08, 0.12, 0.25], color: '#cccccc' }),
      // Perky little tail
      { name: 'tail', parent: 'body', pivot: [0, 0.6, -0.4], pos: [0, 0.68, -0.5], size: [0.3, 0.14, 0.18], rot: [-0.6, 0, 0], color: '#f2f2f2' },
    ],
  },
};
