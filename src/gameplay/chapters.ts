/**
 * The story, chapter by chapter. Add a chapter by adding an entry here!
 * Each chapter: a level, a few waves of regular enemies, then a boss.
 */
export interface ChapterDef {
  title: string;
  subtitle: string;
  /** Level id from level/levels/index.ts */
  level: string;
  /** Enemy id of the boss from enemies/index.ts */
  boss: string;
  /** Waves before the boss shows up. */
  regularWaves: number;
  /** Enemy ids that can appear in regular waves. */
  enemyPool: string[];
}

export const STORY_CHAPTERS: ChapterDef[] = [
  {
    title: 'Chapter 1',
    subtitle: 'Rooftop Rumble',
    level: 'rooftop',
    boss: 'giantCat',
    regularWaves: 3,
    enemyPool: ['drone', 'rat', 'parkRanger'],
  },
  {
    title: 'Chapter 2',
    subtitle: 'Construction Chaos',
    level: 'constructionSite',
    boss: 'constructionWorker',
    regularWaves: 3,
    enemyPool: ['drone', 'rat', 'parkRanger'],
  },
];
