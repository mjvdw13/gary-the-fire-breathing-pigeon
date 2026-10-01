import { describe, expect, it } from 'vitest';
import { Ability, AbilityTrigger } from '../src/abilities/Ability';
import { EventBus } from '../src/core/EventBus';
import { Registry } from '../src/core/Registry';
import { StateMachine } from '../src/core/StateMachine';
import type { GameContext } from '../src/core/GameContext';
import type { Player } from '../src/player/Player';
import { CHARACTERS } from '../src/player/characters';
import { ENEMIES } from '../src/enemies';
import { LEVELS } from '../src/level/levels';
import { PROPS } from '../src/level/props';
import { STORY_CHAPTERS } from '../src/gameplay/chapters';

describe('EventBus', () => {
  it('delivers events and can unsubscribe', () => {
    const bus = new EventBus<{ ping: { n: number } }>();
    const got: number[] = [];
    const off = bus.on('ping', ({ n }) => got.push(n));
    bus.emit('ping', { n: 1 });
    off();
    bus.emit('ping', { n: 2 });
    expect(got).toEqual([1]);
  });
});

describe('Registry', () => {
  it('finds items and rejects duplicates / unknown ids', () => {
    const r = new Registry<{ id: string }>('thing').register({ id: 'a' });
    expect(r.get('a').id).toBe('a');
    expect(() => r.get('b')).toThrow(/Unknown thing "b"/);
    expect(() => r.register({ id: 'a' })).toThrow(/twice/);
  });
});

describe('StateMachine', () => {
  it('runs enter/update/exit and tracks time in state', () => {
    const calls: string[] = [];
    const fsm = new StateMachine<null, 'a' | 'b'>(
      null,
      {
        a: { enter: () => calls.push('enter a'), exit: () => calls.push('exit a') },
        b: { enter: () => calls.push('enter b'), update: () => calls.push('update b') },
      },
      'a',
    );
    fsm.update(0.5);
    expect(fsm.time).toBe(0.5);
    fsm.change('b');
    fsm.update(0.1);
    expect(calls).toEqual(['enter a', 'exit a', 'enter b', 'update b']);
    expect(fsm.time).toBeCloseTo(0.1);
  });
});

describe('Ability cooldowns', () => {
  class Counter extends Ability {
    readonly name = 'Counter';
    readonly trigger: AbilityTrigger = { action: 'fire', mode: 'held' };
    uses = 0;
    constructor() {
      super();
      this.cooldown = 0.3;
    }
    protected activate() {
      this.uses++;
    }
  }

  it('fires at most once per cooldown while held', () => {
    const ability = new Counter();
    const player = {} as Player;
    const ctx = {} as GameContext;
    const dt = 1 / 60;
    for (let t = 0; t < 1; t += dt) {
      ability.update(player, ctx, dt);
      ability.tryActivate(player, ctx, dt);
    }
    // t = 0, 0.3, 0.6, 0.9
    expect(ability.uses).toBe(4);
  });
});

describe('content wiring', () => {
  it('every story chapter points at a real level and boss', () => {
    for (const ch of STORY_CHAPTERS) {
      expect(LEVELS.has(ch.level)).toBe(true);
      expect(ENEMIES.get(ch.boss).spawn).toBe('boss');
      for (const id of ch.enemyPool) expect(ENEMIES.has(id)).toBe(true);
    }
  });

  it('every level uses props that exist', () => {
    for (const level of LEVELS.list()) for (const p of level.props) expect(PROPS.has(p.type)).toBe(true);
  });

  it('every character has a shooting ability', () => {
    for (const c of CHARACTERS.list()) {
      expect(c.abilities().some((a) => a.trigger.action === 'fire')).toBe(true);
    }
  });
});
