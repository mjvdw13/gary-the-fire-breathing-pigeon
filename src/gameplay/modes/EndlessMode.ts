import type { GameMode, WaveHost, WavePlan } from './GameMode';
import { WaveRunner, randomEnemies } from './WaveRunner';

/** Endless: waves keep coming and keep growing (up to 10 enemies). How long can you last? */
export class EndlessMode extends WaveRunner implements GameMode {
  readonly id = 'endless';
  readonly name = 'Endless';
  readonly description = 'Survive infinite waves';
  readonly icon = '♾️';

  constructor(
    private level = 'rooftop',
    private enemyPool = ['drone', 'rat', 'parkRanger'],
  ) {
    super();
  }

  levelId(): string {
    return this.level;
  }

  chapterTitle(): [string, string] {
    return ['Endless', 'Survive!'];
  }

  protected planWave(wave: number, random: () => number): WavePlan {
    const count = Math.min(2 + wave, 10);
    return { enemies: randomEnemies(this.enemyPool, count, random), isBoss: false };
  }

  protected afterWaveCleared(_host: WaveHost): boolean {
    return true;
  }
}
