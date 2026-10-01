import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/config/tuning';
import { STORY_CHAPTERS } from '../src/gameplay/chapters';
import { EndlessMode } from '../src/gameplay/modes/EndlessMode';
import type { WaveHost } from '../src/gameplay/modes/GameMode';
import { StoryMode } from '../src/gameplay/modes/StoryMode';

/** A pretend game: records spawns and lets the test "kill" everything. */
function fakeHost() {
  const log = {
    waves: [] as { wave: number; chapter: number; isBoss: boolean; enemies: string[] }[],
    chaptersCompleted: [] as number[],
    victory: false,
    alive: 0,
    lastSpawn: [] as string[],
  };
  const host: WaveHost = {
    spawnEnemies: (ids) => {
      log.alive += ids.length;
      log.lastSpawn = ids;
    },
    enemiesAlive: () => log.alive,
    random: () => 0.5,
    onWaveStarted: (info) => log.waves.push({ ...info, enemies: log.lastSpawn }),
    onWaveCleared: () => {},
    onChapterComplete: (c) => log.chaptersCompleted.push(c),
    onVictory: () => (log.victory = true),
  };
  return { host, log };
}

const dt = 1 / 60;
function wait(mode: { update(h: WaveHost, dt: number): void }, host: WaveHost, seconds: number) {
  for (let t = 0; t < seconds; t += dt) mode.update(host, dt);
}

describe('StoryMode', () => {
  it('runs regular waves, then a boss, through every chapter to victory', () => {
    const { host, log } = fakeHost();
    const mode = new StoryMode();
    mode.start(host);

    for (let chapter = 1; chapter <= STORY_CHAPTERS.length; chapter++) {
      const def = STORY_CHAPTERS[chapter - 1];
      for (let wave = 1; wave <= def.regularWaves + 1; wave++) {
        wait(mode, host, TUNING.waves.delayBetween + 0.1);
        const w = log.waves.at(-1)!;
        expect(w).toMatchObject({ wave, chapter });
        if (wave <= def.regularWaves) {
          // 2D rules: wave N has N+1 enemies, +1 per chapter after the first.
          expect(w.enemies).toHaveLength(wave + 1 + (chapter - 1));
          expect(w.isBoss).toBe(false);
        } else {
          expect(w.enemies).toEqual([def.boss]);
          expect(w.isBoss).toBe(true);
        }
        log.alive = 0; // everything defeated
        mode.update(host, dt);
      }
      if (chapter < STORY_CHAPTERS.length) {
        expect(log.chaptersCompleted).toEqual(Array.from({ length: chapter }, (_, i) => i + 1));
        // Nothing spawns while waiting on the chapter screen.
        const before = log.waves.length;
        wait(mode, host, 5);
        expect(log.waves.length).toBe(before);
        mode.nextChapter(host);
        expect(mode.levelId()).toBe(STORY_CHAPTERS[chapter].level);
      }
    }
    expect(log.victory).toBe(true);
  });

  it('waits for every enemy to be gone before the next wave', () => {
    const { host, log } = fakeHost();
    const mode = new StoryMode();
    mode.start(host);
    wait(mode, host, TUNING.waves.delayBetween + 0.1);
    expect(log.waves).toHaveLength(1);
    log.alive = 1;
    wait(mode, host, 10);
    expect(log.waves).toHaveLength(1);
  });
});

describe('EndlessMode', () => {
  it('grows waves by one enemy each time, capped at 10', () => {
    const { host, log } = fakeHost();
    const mode = new EndlessMode();
    mode.start(host);
    for (let i = 0; i < 12; i++) {
      wait(mode, host, TUNING.waves.delayBetween + 0.1);
      log.alive = 0;
      mode.update(host, dt);
    }
    expect(log.waves.map((w) => w.enemies.length)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 10]);
    expect(log.waves.every((w) => !w.isBoss)).toBe(true);
    expect(log.victory).toBe(false);
  });
});
