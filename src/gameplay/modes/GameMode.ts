/**
 * What a game mode needs from the game. Keeping this small means modes can be
 * tested without a browser (see tests/modes.test.ts).
 */
export interface WaveHost {
  /** Spawn enemies by id (from enemies/index.ts). */
  spawnEnemies(ids: string[]): void;
  /** How many enemies (including bosses) are still alive. */
  enemiesAlive(): number;
  random(): number;
  onWaveStarted(info: { wave: number; chapter: number; isBoss: boolean }): void;
  onWaveCleared(wave: number): void;
  /** Story only: a boss is beaten and there's another chapter. */
  onChapterComplete(chapter: number): void;
  /** Story only: the final boss is beaten. */
  onVictory(): void;
}

/** A plan for one wave: which enemies to spawn. */
export interface WavePlan {
  enemies: string[];
  isBoss: boolean;
}

/**
 * Rules for a way to play (Story, Endless...). Add new modes in gameplay/modes/
 * and list them in modes/index.ts — e.g. a "Boss Rush" mode.
 */
export interface GameMode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Emoji/icon for the mode select screen. */
  readonly icon: string;
  readonly wave: number;
  readonly chapter: number;
  /** Level to load for the current chapter. */
  levelId(): string;
  /** Title card shown before a chapter, e.g. ["Chapter 2", "Construction Chaos"]. */
  chapterTitle(): [string, string];
  /** Start from the very beginning. */
  start(host: WaveHost): void;
  /** Called every tick while playing. */
  update(host: WaveHost, dt: number): void;
  /** Story: move on to the next chapter after the transition screen. */
  nextChapter(host: WaveHost): void;
}
