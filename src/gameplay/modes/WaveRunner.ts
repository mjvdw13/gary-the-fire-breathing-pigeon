import { TUNING } from '../../config/tuning';
import type { WaveHost, WavePlan } from './GameMode';

/**
 * Shared wave timing used by every mode:
 *   countdown → spawn wave → wait until all enemies are gone → countdown → ...
 * Modes only decide WHAT each wave contains (planWave) and what happens after.
 */
export abstract class WaveRunner {
  wave = 0;
  chapter = 1;
  private phase: 'countdown' | 'fighting' | 'finished' = 'countdown';
  private timer = 0;
  private currentIsBoss = false;

  /** Which enemies should wave number `wave` have? */
  protected abstract planWave(wave: number, random: () => number): WavePlan;

  /** Called after a wave is fully cleared. Return false to stop spawning (chapter over). */
  protected abstract afterWaveCleared(host: WaveHost, wasBoss: boolean): boolean;

  start(host: WaveHost): void {
    this.chapter = 1;
    this.restartChapter(host);
  }

  update(host: WaveHost, dt: number): void {
    switch (this.phase) {
      case 'countdown':
        this.timer += dt;
        if (this.timer >= TUNING.waves.delayBetween) this.startNextWave(host);
        break;
      case 'fighting':
        if (host.enemiesAlive() === 0) {
          host.onWaveCleared(this.wave);
          const keepGoing = this.afterWaveCleared(host, this.currentIsBoss);
          this.phase = keepGoing ? 'countdown' : 'finished';
          this.timer = 0;
        }
        break;
      case 'finished':
        break;
    }
  }

  nextChapter(host: WaveHost): void {
    this.chapter++;
    this.restartChapter(host);
  }

  protected restartChapter(_host: WaveHost): void {
    this.wave = 0;
    this.phase = 'countdown';
    this.timer = 0;
  }

  private startNextWave(host: WaveHost): void {
    this.wave++;
    const plan = this.planWave(this.wave, () => host.random());
    this.currentIsBoss = plan.isBoss;
    host.spawnEnemies(plan.enemies);
    host.onWaveStarted({ wave: this.wave, chapter: this.chapter, isBoss: plan.isBoss });
    this.phase = 'fighting';
  }
}

/** Pick `count` random enemy ids from a pool. */
export function randomEnemies(pool: string[], count: number, random: () => number): string[] {
  return Array.from({ length: count }, () => pool[Math.floor(random() * pool.length)]);
}
