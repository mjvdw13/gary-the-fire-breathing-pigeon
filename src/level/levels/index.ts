import { Registry } from '../../core/Registry';
import type { LevelDef } from '../LevelDef';
import { constructionSite } from './constructionSite';
import { rooftop } from './rooftop';

/** Every level, by id. New level? Copy rooftop.ts, change it, and add it here. */
export const LEVELS = new Registry<LevelDef>('level').register(rooftop, constructionSite);
