import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Enemy } from '../enemies/Enemy';
import type { Player } from '../player/Player';
import { h } from './dom';

export interface HudState {
  player: Player | null;
  score: number;
  label: string;
  boss: Enemy | null;
  godMode: boolean;
  pointerLocked: boolean;
  muted: boolean;
}

/**
 * The in-game overlay: hearts, score, wave, boss health, ability meters, crosshair.
 * `update()` is called every frame with the latest numbers.
 */
export class HUD {
  readonly root: HTMLDivElement;
  private hearts = h('div', { class: 'hearts' });
  private score = h('div', { class: 'score' });
  private label = h('div', { class: 'wave-label' });
  private bossBar = h('div', { class: 'boss-bar' });
  private bossFill = h('div', { class: 'boss-fill' });
  private bossName = h('div', { class: 'boss-name' });
  private meters = h('div', { class: 'meters' });
  private badges = h('div', { class: 'badges' });
  private banner = h('div', { class: 'banner' });
  private hint = h('div', { class: 'aim-hint' }, 'Click to aim with the mouse');
  private hurt = h('div', { class: 'hurt-flash' });
  private bannerTimer: number | undefined;
  private lastHearts = '';

  constructor(parent: HTMLElement, events: EventBus<GameEvents>) {
    this.bossBar.append(this.bossName, h('div', { class: 'boss-track' }, this.bossFill));
    this.root = h(
      'div',
      { class: 'hud' },
      h('div', { class: 'hud-top-left' }, this.hearts, this.badges),
      h('div', { class: 'hud-top-center' }, this.label, this.bossBar),
      this.score,
      h('div', { class: 'crosshair' }),
      this.meters,
      this.banner,
      this.hint,
      this.hurt,
    );
    parent.append(this.root);

    events.on('waveStarted', ({ wave, isBoss }) =>
      this.showBanner(isBoss ? 'BOSS FIGHT!' : `Wave ${wave}`, isBoss ? 'boss' : ''),
    );
    events.on('waveCleared', () => this.showBanner('Wave cleared!', 'good'));
    events.on('companionUnlocked', () => this.showBanner('Bat buddy unlocked!', 'good'));
    events.on('playerDamaged', () => {
      this.hurt.classList.remove('active');
      void this.hurt.offsetWidth; // restart the CSS animation
      this.hurt.classList.add('active');
    });
  }

  show(): void {
    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  showBanner(text: string, tone = ''): void {
    this.banner.textContent = text;
    this.banner.className = `banner visible ${tone}`;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('visible'), 1800);
  }

  update(s: HudState): void {
    const health = s.player?.health;
    if (health) {
      const key = `${health.current}/${health.max}`;
      if (key !== this.lastHearts) {
        this.lastHearts = key;
        this.hearts.replaceChildren(
          ...Array.from({ length: health.max }, (_, i) =>
            h('span', { class: `heart ${i < health.current ? 'full' : 'empty'}` }, '♥'),
          ),
        );
      }
    }
    this.score.textContent = s.score.toLocaleString();
    this.label.textContent = s.label;

    this.bossBar.classList.toggle('visible', !!s.boss);
    if (s.boss) {
      this.bossName.textContent = s.boss.name;
      this.bossFill.style.width = `${s.boss.health!.fraction * 100}%`;
    }

    const meters = (s.player?.abilities ?? []).map((a) => a.hud()).filter((m) => m !== null);
    this.meters.replaceChildren(
      ...meters.map((m) =>
        h(
          'div',
          { class: 'meter' },
          h('span', {}, m.label),
          h('div', { class: 'meter-track' }, h('div', { class: 'meter-fill', style: `width:${m.fraction * 100}%;background:${m.color}` })),
        ),
      ),
    );

    const badges: string[] = [];
    if (s.godMode) badges.push('GOD MODE');
    if (s.muted) badges.push('MUTED');
    this.badges.textContent = badges.join('  ·  ');
    this.hint.classList.toggle('visible', !s.pointerLocked);
  }
}
