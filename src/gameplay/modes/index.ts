import { EndlessMode } from './EndlessMode';
import type { GameMode } from './GameMode';
import { StoryMode } from './StoryMode';

/** Modes on the mode select screen, in order. Each entry builds a fresh mode for a new run. */
export const MODES: (() => GameMode)[] = [() => new StoryMode(), () => new EndlessMode()];
