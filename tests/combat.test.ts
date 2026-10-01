import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { applyDamage, CombatSystem } from '../src/combat/CombatSystem';
import { EventBus } from '../src/core/EventBus';
import type { GameEvents } from '../src/core/events';
import type { GameContext } from '../src/core/GameContext';
import { Entity } from '../src/world/Entity';
import { World } from '../src/world/World';
import { Hazard } from '../src/world/components/Hazard';
import { Health } from '../src/world/components/Health';
import type { Team } from '../src/world/components/Team';

class Dummy extends Entity {
  constructor(team: Team, x: number, tag: string, hp = 3, invincibleAfterHit = 0) {
    super(tag);
    this.team = team;
    this.position.set(x, 0, 0);
    this.health = new Health(hp, invincibleAfterHit);
    this.hitbox = { radius: 0.5, height: 1 };
  }
}

function makeCtx(godMode = false) {
  const ctx = {
    scene: new Scene(),
    world: new World(),
    events: new EventBus<GameEvents>(),
    godMode,
    random: () => 0.5,
  } as unknown as GameContext;
  return ctx;
}

describe('combat', () => {
  it('hazards only hurt the other team, once per activation', () => {
    const ctx = makeCtx();
    const enemy = ctx.world.add(new Dummy('enemy', 0, 'enemy'), ctx);
    const otherEnemy = ctx.world.add(new Dummy('enemy', 0.5, 'enemy'), ctx);
    const player = ctx.world.add(new Dummy('player', 1, 'player'), ctx);

    const sweep = new Hazard('enemy', 1, { kind: 'cylinder', base: new Vector3(1, 0, 0), radius: 1, height: 1 });
    sweep.activate();
    enemy.hazards.push(sweep);
    enemy.contactDamage = 0;
    otherEnemy.contactDamage = 0;

    const combat = new CombatSystem();
    combat.update(ctx);
    combat.update(ctx);
    expect(player.health!.current).toBe(2);
    expect(otherEnemy.health!.current).toBe(3);

    sweep.activate(); // next swing
    combat.update(ctx);
    expect(player.health!.current).toBe(1);
  });

  it('contact damage respects invincibility frames', () => {
    const ctx = makeCtx();
    const enemy = ctx.world.add(new Dummy('enemy', 0, 'enemy'), ctx);
    enemy.contactDamage = 1;
    const player = ctx.world.add(new Dummy('player', 0.5, 'player', 5, 1.5), ctx);
    const combat = new CombatSystem();
    for (let i = 0; i < 10; i++) combat.update(ctx);
    expect(player.health!.current).toBe(4);
  });

  it('god mode protects the player but not enemies', () => {
    const ctx = makeCtx(true);
    const player = ctx.world.add(new Dummy('player', 0, 'player'), ctx);
    const enemy = ctx.world.add(new Dummy('enemy', 10, 'enemy'), ctx);
    expect(applyDamage(ctx, player, 1)).toBe(false);
    expect(applyDamage(ctx, enemy, 1)).toBe(true);
    expect(player.health!.current).toBe(3);
    expect(enemy.health!.current).toBe(2);
  });

  it('calls onDeath and emits events when health runs out', () => {
    const ctx = makeCtx();
    const enemy = ctx.world.add(new Dummy('enemy', 0, 'enemy', 1), ctx);
    let damagedEvents = 0;
    ctx.events.on('entityDamaged', () => damagedEvents++);
    applyDamage(ctx, enemy, 5);
    expect(enemy.alive).toBe(false);
    expect(damagedEvents).toBe(1);
    ctx.world.removeDead(ctx);
    expect(ctx.world.countTag('enemy')).toBe(0);
  });
});

describe('Health', () => {
  it('ignores damage while invincible, then recovers', () => {
    const h = new Health(5, 1.5);
    expect(h.takeDamage(1)).toBe(true);
    expect(h.takeDamage(1)).toBe(false);
    h.update(1.6);
    expect(h.takeDamage(1)).toBe(true);
    expect(h.current).toBe(3);
  });
});
