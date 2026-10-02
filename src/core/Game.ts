import { Scene, Vector3 } from 'three';
import { Audio } from '../audio/Audio';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { CombatSystem } from '../combat/CombatSystem';
import { DebugPanel } from '../debug/DebugPanel';
import { Enemy } from '../enemies/Enemy';
import { BatCompanion } from '../enemies/companions/BatCompanion';
import { MODES } from '../gameplay/modes';
import type { GameMode, WaveHost } from '../gameplay/modes/GameMode';
import { spawnEnemy } from '../gameplay/WaveSpawner';
import { Input } from '../input/Input';
import { buildLevel, Level } from '../level/LevelBuilder';
import { LEVELS } from '../level/levels';
import { Physics } from '../physics/Physics';
import { CHARACTERS } from '../player/characters';
import { Player } from '../player/Player';
import { Particles } from '../rendering/effects/Particles';
import { Renderer } from '../rendering/Renderer';
import { Showcase } from '../rendering/Showcase';
import { SaveData } from '../save/SaveData';
import { HUD } from '../ui/HUD';
import { CharacterSelect } from '../ui/screens/CharacterSelect';
import { MessageScreen } from '../ui/screens/MessageScreen';
import { ModeSelect } from '../ui/screens/ModeSelect';
import { World } from '../world/World';
import { EventBus } from './EventBus';
import type { GameEvents } from './events';
import type { GameContext } from './GameContext';
import { StateMachine } from './StateMachine';

/** The big screens/moments of the game. */
type Flow = 'charSelect' | 'modeSelect' | 'splash' | 'playing' | 'paused' | 'chapterTransition' | 'victory' | 'gameOver';

const CONTROLS: [string, string][] = [
  ['WASD', 'Move'],
  ['Mouse', 'Look / aim'],
  ['Click', 'Shoot (hold for auto-fire)'],
  ['Space', 'Jump (hold to fly)'],
  ['Shift', 'Special (Fang: dash)'],
  ['Esc', 'Pause'],
  ['G', 'God mode'],
  ['M', 'Mute'],
];

/**
 * Owns all the systems and decides what happens each tick based on the current
 * screen (menus → playing → victory...). It does NOT contain any specific
 * character, enemy or level code — those live in their own folders.
 */
export class Game implements GameContext {
  // ----- GameContext (the toolbox entities get) -----
  readonly scene: Scene;
  physics: Physics;
  readonly world = new World();
  readonly events = new EventBus<GameEvents>();
  readonly input: Input;
  readonly camera: ThirdPersonCamera;
  readonly particles: Particles;
  level!: Level;
  player: Player | null = null;
  godMode = false;
  time = 0;
  random = Math.random;

  // ----- Systems -----
  private renderer: Renderer;
  private combat = new CombatSystem();
  private showcase = new Showcase();
  private save = new SaveData();
  private audio: Audio;
  private debug: DebugPanel;

  // ----- UI -----
  private hud: HUD;
  private charSelect: CharacterSelect;
  private modeSelect: ModeSelect;
  private message: MessageScreen;

  // ----- Current run -----
  private flow: StateMachine<Game, Flow>;
  private mode: GameMode | null = null;
  private modeIndex = 0;
  score = 0;
  private waveLabel = '';
  /** Something to do after a short delay (e.g. show victory after the boss explodes). */
  private pending: { at: number; run: () => void } | null = null;
  /** Chapter title to flash on screen when play starts. */
  private pendingBanner: string | null = null;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new Renderer(canvas);
    this.scene = this.renderer.scene;
    this.input = new Input(canvas);
    this.camera = new ThirdPersonCamera(this.renderer.aspect);
    this.particles = new Particles(this.scene);
    this.physics = new Physics();
    this.audio = new Audio(this.events);
    this.renderer.onResize = (aspect) => {
      this.camera.resize(aspect);
      this.showcase.resize(aspect);
    };
    this.showcase.resize(this.renderer.aspect);

    this.hud = new HUD(uiRoot, this.events);
    this.charSelect = new CharacterSelect(
      uiRoot,
      CHARACTERS.list(),
      (i) => this.showcase.setCharacter(CHARACTERS.list()[i]),
      () => this.flow.change('modeSelect'),
    );
    this.modeSelect = new ModeSelect(
      uiRoot,
      MODES,
      this.save,
      (i) => {
        this.modeIndex = i;
        this.startRun();
        this.flow.change('splash');
      },
      () => this.flow.change('charSelect'),
    );
    this.message = new MessageScreen(uiRoot);
    this.debug = new DebugPanel(this);

    this.listenToEvents();
    this.showcase.setCharacter(CHARACTERS.list()[0]);

    this.flow = new StateMachine<Game, Flow>(this, this.flowStates(), 'charSelect');
  }

  get character() {
    return CHARACTERS.list()[this.charSelect.selected];
  }

  // =====================================================================
  // Main loop hooks
  // =====================================================================

  update(dt: number): void {
    if (this.input.pressed('mute')) this.audio.toggleMute();
    if (this.input.pressed('debugPanel')) this.debug.toggle();
    this.flow.update(dt);
    this.input.endTick();
  }

  render(alpha: number, frameDt: number): void {
    const inMenus = this.flow.is('charSelect') || this.flow.is('modeSelect');
    if (inMenus) {
      this.showcase.update(frameDt);
      this.renderer.render(this.showcase.camera, this.showcase.scene);
      return;
    }

    const playing = this.flow.is('playing');
    if (playing) this.world.syncVisuals(alpha);
    if (!this.flow.is('paused')) this.particles.update(frameDt);

    const focus = this.player ? this.player.object3D.position : new Vector3();
    if (this.flow.is('splash')) this.camera.yaw += frameDt * 0.25; // slow orbit on the title screen
    this.camera.update(this.input, this.physics, focus, frameDt, playing && this.input.pointerLocked);
    this.renderer.followWithShadows(focus);
    this.debug.update();
    this.renderer.render(this.camera.camera, this.renderer.scene, frameDt);

    if (playing || this.flow.is('paused')) {
      this.hud.update({
        player: this.player,
        score: this.score,
        label: this.waveLabel,
        boss: this.findBoss(),
        godMode: this.godMode,
        pointerLocked: this.input.pointerLocked,
        muted: this.audio.muted,
      });
    }
  }

  // =====================================================================
  // Game flow (which screen we're on)
  // =====================================================================

  private flowStates() {
    const showOnly = (screen: { show(): void } | null) => {
      for (const s of [this.charSelect, this.modeSelect, this.message]) if (s !== screen) s.hide();
      screen?.show();
    };

    return {
      charSelect: {
        enter: (g: Game) => {
          g.endRun();
          showOnly(g.charSelect);
          g.hud.hide();
          g.input.wantsPointerLock = false;
          g.input.releasePointer();
          g.showcase.setCharacter(g.character);
        },
        update: (g: Game) => g.charSelect.handleInput(g.input),
      },
      modeSelect: {
        enter: (g: Game) => showOnly(g.modeSelect),
        update: (g: Game) => g.modeSelect.handleInput(g.input),
      },
      splash: {
        enter: (g: Game) => {
          const c = g.character;
          showOnly(g.message);
          g.message.open(
            {
              title: `${c.name.toUpperCase()}`,
              subtitle: c.title.toUpperCase(),
              tone: 'splash',
              controls: CONTROLS,
              hint: 'Press SPACE or click to start',
            },
            { onConfirm: () => g.flow.change('playing'), onBack: () => g.flow.change('modeSelect') },
          );
        },
        update: (g: Game) => g.message.handleInput(g.input),
      },
      playing: {
        enter: (g: Game) => {
          showOnly(null);
          g.hud.show();
          g.input.wantsPointerLock = true;
          g.grabPointer();
          if (g.pendingBanner) {
            // Start of a chapter: put the camera behind the bird.
            if (g.player) g.camera.snapBehind(g.player.yaw);
            g.hud.showBanner(g.pendingBanner, 'chapter');
            g.pendingBanner = null;
          }
        },
        update: (g: Game, dt: number) => g.tickPlaying(dt),
      },
      paused: {
        enter: (g: Game) => {
          showOnly(g.message);
          g.message.open(
            {
              title: 'Paused',
              tone: 'paused',
              controls: CONTROLS,
              hint: 'Click or press SPACE to resume  ·  ESC to quit',
            },
            { onConfirm: () => g.flow.change('playing'), onBack: () => g.flow.change('charSelect') },
          );
        },
        update: (g: Game) => g.message.handleInput(g.input),
      },
      chapterTransition: {
        enter: (g: Game) => {
          g.hud.hide();
          g.input.releasePointer();
          const mode = g.mode!;
          const [finished] = mode.chapterTitle();
          mode.nextChapter(g.waveHost);
          const [title, subtitle] = mode.chapterTitle();
          showOnly(g.message);
          g.message.open(
            {
              title: `${finished} complete!`,
              subtitle: `Next: ${title} — ${subtitle}`,
              lines: [`Score: ${g.score.toLocaleString()}`],
              tone: 'chapter',
              hint: 'Press SPACE to continue',
            },
            {
              confirmDelay: 1,
              onConfirm: () => {
                g.loadChapter();
                g.pendingBanner = `${title}: ${subtitle}`;
                g.flow.change('playing');
              },
            },
          );
        },
        update: (g: Game) => g.message.handleInput(g.input),
      },
      victory: {
        enter: (g: Game) => g.showEnding(true),
        update: (g: Game) => g.message.handleInput(g.input),
      },
      gameOver: {
        enter: (g: Game) => g.showEnding(false),
        update: (g: Game) => g.message.handleInput(g.input),
      },
    };
  }

  private showEnding(won: boolean): void {
    this.hud.hide();
    this.input.wantsPointerLock = false;
    this.input.releasePointer();
    const modeId = this.mode?.id ?? 'story';
    const newBest = this.save.submitScore(modeId, this.score);
    this.charSelect.hide();
    this.modeSelect.hide();
    this.message.open(
      {
        title: won ? 'Victory!' : 'Game Over',
        subtitle: won ? `${this.character.name} saved the city!` : `Wave ${this.mode?.wave ?? 0}`,
        lines: [
          `Score: ${this.score.toLocaleString()}`,
          newBest ? '★ New high score! ★' : `Best: ${this.save.highScore(modeId).toLocaleString()}`,
        ],
        tone: won ? 'victory' : 'gameover',
        hint: 'SPACE to play again  ·  ESC to change bird',
      },
      {
        confirmDelay: 1,
        onConfirm: () => {
          this.startRun();
          this.flow.change('playing');
        },
        onBack: () => this.flow.change('charSelect'),
      },
    );
  }

  // =====================================================================
  // Playing
  // =====================================================================

  private tickPlaying(dt: number): void {
    // Lost the mouse (Esc) → pause.
    if (this.input.pressed('back')) return this.flow.change('paused');
    if (this.input.pressed('godMode')) this.godMode = !this.godMode;
    if (this.input.pressed('debugKillAll') && this.debug.enabled) this.killAllEnemies();

    this.time += dt;
    this.world.update(this, dt);
    this.combat.update(this);
    this.physics.step();
    this.mode?.update(this.waveHost, dt);
    this.world.removeDead(this);

    if (this.pending && this.time >= this.pending.at) {
      const run = this.pending.run;
      this.pending = null;
      run();
    }
  }

  /** Start a brand-new run with the selected character and mode. */
  private startRun(): void {
    this.endRun();
    this.mode = MODES[this.modeIndex]();
    this.mode.start(this.waveHost);
    this.score = 0;
    this.time = 0;
    this.waveLabel = '';
    const [title, subtitle] = this.mode.chapterTitle();
    this.pendingBanner = `${title}: ${subtitle}`;
    this.loadChapter();
  }

  /** Build the current chapter's level and put the player (and bat buddy) in it. */
  private loadChapter(): void {
    const keepHealth = this.player?.health?.current;
    this.clearLevel();

    this.physics = new Physics();
    const def = LEVELS.get(this.mode!.levelId());
    this.renderer.setSky(def.sky);
    this.level = buildLevel(def, this);

    this.player = this.world.add(new Player(this.character, def.playerSpawn.clone()), this);
    if (keepHealth !== undefined && keepHealth > 0) this.player.health!.current = keepHealth;
    this.camera.snapBehind(Math.PI); // look toward the middle of the arena (-Z)
    this.player.yaw = Math.PI;
    this.spawnCompanionIfUnlocked();
    this.physics.step();
  }

  private spawnCompanionIfUnlocked(): void {
    if (!this.player || !this.save.hasCompanion('bat') || this.character.allowsCompanion === false) return;
    if (this.world.countTag('companion') > 0) return;
    this.world.add(new BatCompanion(this.player.position.clone().add(new Vector3(0, 2, 0))), this);
  }

  private clearLevel(): void {
    this.world.clear(this);
    this.particles.clear();
    if (this.level) this.level.dispose(this);
    this.physics.dispose();
    this.player = null;
    this.pending = null;
  }

  private endRun(): void {
    if (!this.mode) return;
    this.clearLevel();
    this.physics = new Physics();
    this.mode = null;
  }

  private grabPointer(): void {
    if (!this.input.pointerLocked) {
      document.getElementById('game-canvas')?.requestPointerLock()?.catch?.(() => {});
    }
  }

  /** What game modes see of the game (spawning, counting, announcing). */
  private waveHost: WaveHost = {
    spawnEnemies: (ids) => ids.forEach((id) => spawnEnemy(this, id)),
    enemiesAlive: () => this.world.countTag('enemy'),
    random: () => this.random(),
    onWaveStarted: (info) => {
      const [title] = this.mode!.chapterTitle();
      this.waveLabel = info.isBoss ? `${title} · Boss` : `${title} · Wave ${info.wave}`;
      this.events.emit('waveStarted', info);
    },
    onWaveCleared: (wave) => this.events.emit('waveCleared', { wave }),
    onChapterComplete: (chapter) => {
      this.events.emit('chapterComplete', { chapter });
      this.after(2.5, () => this.flow.change('chapterTransition'));
    },
    onVictory: () => {
      this.events.emit('victory', { score: this.score });
      this.after(2.5, () => this.flow.change('victory'));
    },
  };

  private after(seconds: number, run: () => void): void {
    this.pending = { at: this.time + seconds, run };
  }

  private listenToEvents(): void {
    this.events.on('enemyKilled', ({ points }) => {
      this.score += points;
      this.events.emit('scoreChanged', { score: this.score });
    });
    this.events.on('bossDefeated', () => {
      // Beating the first boss unlocks the bat buddy (like the 2D game).
      if (this.mode?.chapter === 1 && this.save.unlockCompanion('bat')) {
        this.events.emit('companionUnlocked', { id: 'bat' });
        this.spawnCompanionIfUnlocked();
      }
    });
    this.events.on('playerDied', () => this.after(1.5, () => this.flow.change('gameOver')));
    this.events.on('cameraShake', ({ strength }) => this.camera.addShake(strength));

    // Pressing Esc while the mouse is captured releases it — treat that as pause.
    document.addEventListener('pointerlockchange', () => {
      if (!this.input.pointerLocked && this.flow?.is('playing')) this.flow.change('paused');
    });
    // Clicking the pause screen resumes (and re-grabs the mouse).
    this.message.root.addEventListener('click', () => {
      if (this.flow.is('paused')) this.flow.change('playing');
    });
  }

  // =====================================================================
  // Helpers (also used by the debug panel)
  // =====================================================================

  findBoss(): Enemy | null {
    for (const e of this.world.withTag('boss')) if (e instanceof Enemy) return e;
    return null;
  }

  killAllEnemies(): void {
    for (const e of [...this.world.withTag('enemy')]) {
      if (e.health) {
        e.health.current = 0;
        e.onDeath(this);
      }
    }
  }
}
