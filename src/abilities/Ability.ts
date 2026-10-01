import type { GameContext } from '../core/GameContext';
import type { Action } from '../input/Actions';
import type { Player } from '../player/Player';

/**
 * Which button triggers an ability, and how.
 *  - 'pressed': once per button press (double jump, dash)
 *  - 'held':    every tick while held down (auto-fire, flying)
 */
export interface AbilityTrigger {
  action: Action;
  mode: 'pressed' | 'held';
  /** Only works while in the air (double jump, flight). */
  airOnly?: boolean;
}

/** What the HUD shows for an ability. */
export interface AbilityHud {
  label: string;
  /** 0..1 how full / ready it is. */
  fraction: number;
  /** Color of the bar. */
  color: string;
}

/**
 * A power a character has: shooting, double jump, flying, dashing...
 * Characters are just a list of abilities, so you can mix and match them!
 *
 * To make a new ability: extend this class, set `trigger`, and write `activate()`.
 */
export abstract class Ability {
  abstract readonly name: string;
  abstract readonly trigger: AbilityTrigger;
  /** Seconds between uses. */
  cooldown = 0;
  protected cooldownLeft = 0;

  /** Can it be used right now? Override for extra rules (e.g. needs fuel). */
  canActivate(_player: Player, _ctx: GameContext): boolean {
    return this.cooldownLeft <= 0;
  }

  /** Called by the Player when the trigger button is pressed/held. Returns true if it fired. */
  tryActivate(player: Player, ctx: GameContext, dt: number): boolean {
    if (!this.canActivate(player, ctx)) return false;
    this.activate(player, ctx, dt);
    this.cooldownLeft = this.cooldown;
    return true;
  }

  /** Do the thing! */
  protected abstract activate(player: Player, ctx: GameContext, dt: number): void;

  /** Called every tick whether or not the button is pressed (cooldowns, recharging). */
  update(_player: Player, _ctx: GameContext, dt: number): void {
    this.cooldownLeft = Math.max(0, this.cooldownLeft - dt);
  }

  /** Called when the player touches the ground after being in the air. */
  onLand(_player: Player): void {}

  /** Return something to show a meter on the HUD, or null for none. */
  hud(): AbilityHud | null {
    return null;
  }
}
