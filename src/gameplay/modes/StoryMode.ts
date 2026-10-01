import { ChapterDef, STORY_CHAPTERS } from '../chapters';
import type { GameMode, WaveHost, WavePlan } from './GameMode';
import { WaveRunner, randomEnemies } from './WaveRunner';

/**
 * Story: each chapter has a few regular waves, then a boss.
 * Beat the boss → next chapter. Beat the last boss → victory!
 * (2D rules: wave N has N+1 enemies, plus 1 extra per chapter after the first.)
 */
export class StoryMode extends WaveRunner implements GameMode {
  readonly id = 'story';
  readonly name = 'Story';
  readonly description = `Battle through ${STORY_CHAPTERS.length} chapters`;
  readonly icon = '👑';

  constructor(private chapters: ChapterDef[] = STORY_CHAPTERS) {
    super();
  }

  get chapterDef(): ChapterDef {
    return this.chapters[this.chapter - 1];
  }

  levelId(): string {
    return this.chapterDef.level;
  }

  chapterTitle(): [string, string] {
    return [this.chapterDef.title, this.chapterDef.subtitle];
  }

  protected planWave(wave: number, random: () => number): WavePlan {
    const ch = this.chapterDef;
    if (wave <= ch.regularWaves) {
      const count = wave + 1 + (this.chapter - 1);
      return { enemies: randomEnemies(ch.enemyPool, count, random), isBoss: false };
    }
    return { enemies: [ch.boss], isBoss: true };
  }

  protected afterWaveCleared(host: WaveHost, wasBoss: boolean): boolean {
    if (!wasBoss) return true;
    if (this.chapter < this.chapters.length) host.onChapterComplete(this.chapter);
    else host.onVictory();
    return false;
  }
}
