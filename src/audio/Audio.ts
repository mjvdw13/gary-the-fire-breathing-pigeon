import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';

type Wave = OscillatorType;

/**
 * Retro sound effects made with code (no sound files needed yet).
 * Sounds are triggered by game events, so nothing else in the game knows about audio.
 *
 * To use real sound files later: put .mp3/.ogg files in public/assets/sounds/
 * and play them here with `new window.Audio('assets/sounds/boom.mp3').play()`.
 */
export class Audio {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(events: EventBus<GameEvents>) {
    // Browsers only allow sound after the player clicks or presses a key.
    const unlock = () => this.ensureContext();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    events.on('projectileFired', ({ kind }) => {
      switch (kind) {
        case 'fireball':
          return this.tone(180, 0.15, 'sawtooth', 0.12, 70);
        case 'laser':
          return this.tone(1200, 0.08, 'square', 0.05, 500);
        case 'lightning':
          return this.tone(90, 0.25, 'sawtooth', 0.15, 900);
        case 'feather':
          return this.tone(700, 0.1, 'triangle', 0.08, 1100);
      }
    });
    events.on('playerJumped', ({ air }) => this.tone(air ? 520 : 380, 0.12, 'square', 0.05, air ? 900 : 700));
    events.on('playerDashed', () => this.noise(0.15, 0.12, 4000));
    events.on('enemyKilled', () => {
      this.tone(600, 0.1, 'square', 0.08, 1200);
      this.noise(0.15, 0.1, 1500);
    });
    events.on('entityDamaged', ({ entity }) => {
      if (!entity.hasTag('player')) this.tone(300, 0.05, 'square', 0.04, 200);
    });
    events.on('playerDamaged', () => this.tone(160, 0.3, 'sawtooth', 0.15, 60));
    events.on('bossDefeated', () => {
      this.noise(1.2, 0.3, 600);
      this.arpeggio([523, 659, 784, 1047], 0.12);
    });
    events.on('waveStarted', ({ isBoss }) =>
      isBoss ? this.arpeggio([196, 185, 175, 165], 0.18, 'sawtooth') : this.arpeggio([440, 554], 0.1),
    );
    events.on('companionUnlocked', () => this.arpeggio([659, 784, 988, 1319], 0.1));
    events.on('victory', () => this.arpeggio([523, 523, 784, 1047, 988, 1047], 0.14));
    events.on('playerDied', () => this.arpeggio([392, 330, 262, 196], 0.2, 'triangle'));
    events.on('cameraShake', ({ strength }) => {
      if (strength >= 0.5) this.noise(0.4, 0.25, 400);
    });
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.6;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** A beep that slides from `freq` to `slideTo`. */
  private tone(freq: number, duration: number, type: Wave, volume: number, slideTo?: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /** A burst of static — explosions, whooshes. */
  private noise(duration: number, volume: number, cutoff: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  }

  private arpeggio(notes: number[], step: number, type: Wave = 'square'): void {
    notes.forEach((n, i) => this.tone(n, step * 1.4, type, 0.08, undefined, i * step));
  }
}
