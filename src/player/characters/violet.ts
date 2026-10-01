import { Flight } from '../../abilities/Flight';
import { ShootAbility } from '../../abilities/ShootAbility';
import { px } from '../../config/tuning';
import type { ModelDef } from '../../rendering/ModelFactory';
import { sym } from '../../rendering/modelHelpers';
import type { CharacterDef } from '../CharacterDef';

/** Violet's look — also used (smaller) for the bat companion. */
export const batModel: ModelDef = {
  parts: [
    ...sym({ name: 'leg', pos: [0.1, 0.1, 0], pivot: [0.1, 0.2, 0], size: [0.06, 0.2, 0.06], color: '#2e1f38' }),
    { name: 'body', pos: [0, 0.5, 0], size: [0.48, 0.55, 0.42], color: '#6a4a7a' },
    { parent: 'body', pos: [0, 0.45, 0.12], size: [0.36, 0.38, 0.22], color: '#8a6a9a' },
    { name: 'head', parent: 'body', pos: [0, 0.92, 0.04], size: [0.44, 0.36, 0.38], color: '#6a4a7a' },
    // Big pointy ears
    ...sym({ parent: 'head', pos: [0.15, 1.2, 0], size: [0.12, 0.26, 0.08], rot: [0, 0, -0.2], color: '#6a4a7a' }),
    ...sym({ parent: 'head', pos: [0.15, 1.18, 0.03], size: [0.06, 0.16, 0.04], rot: [0, 0, -0.2], color: '#e49ac4' }),
    // Glowing pink eyes + fangs
    ...sym({ parent: 'head', pos: [0.1, 0.96, 0.23], size: [0.09, 0.09, 0.04], color: '#ff4dff', glow: true }),
    { parent: 'head', pos: [0, 0.88, 0.235], size: [0.08, 0.06, 0.04], color: '#2e1f38' },
    ...sym({ parent: 'head', pos: [0.05, 0.8, 0.22], size: [0.03, 0.06, 0.03], color: '#ffffff' }),
    // Big leathery wings
    ...sym({ name: 'wing', parent: 'body', pivot: [0.22, 0.7, 0], pos: [0.5, 0.52, -0.02], size: [0.58, 0.5, 0.06], color: '#4a3060' }),
    ...sym({ parent: 'wingL', pos: [0.5, 0.75, -0.02], size: [0.6, 0.05, 0.08], color: '#2e1f38' }),
    ...sym({ parent: 'wingL', pos: [0.62, 0.42, -0.02], size: [0.05, 0.4, 0.08], color: '#2e1f38' }),
  ],
};

/** Violet — a speedy bat with rapid-fire lasers who can fly for a short time. */
export const violet: CharacterDef = {
  id: 'violet',
  name: 'Violet',
  title: 'The Laser Bat',
  description: 'Rapid-fire lasers. Hold jump to fly!',
  color: '#6A4A7A',
  stats: {
    moveSpeed: px(350),
    jumpSpeed: px(350),
    radius: 0.38,
    height: 1.1,
  },
  muzzle: [0, 0.95, 0.4],
  abilities: () => [
    new ShootAbility({ name: 'Laser', projectile: 'laser', cooldown: 0.15 }),
    new Flight({ flySpeed: px(250), maxFlyTime: 2, rechargeRate: 1 }),
  ],
  allowsCompanion: false,
  model: batModel,
};
