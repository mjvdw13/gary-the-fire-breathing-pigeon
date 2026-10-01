import { Registry } from '../../core/Registry';
import type { CharacterDef } from '../CharacterDef';
import { fang } from './fang';
import { gary } from './gary';
import { quacks } from './quacks';
import { violet } from './violet';

/**
 * All playable characters, in the order they appear on the character select screen.
 * New character? Make a file next to these (copy gary.ts), then add it here.
 */
export const CHARACTERS = new Registry<CharacterDef>('character').register(gary, violet, fang, quacks);
