import GUI from 'lil-gui';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments } from 'three';
import { GRAPHICS } from '../config/graphics';
import { TUNING } from '../config/tuning';
import { SPEED } from '../rendering/AutoQuality';
import type { Game } from '../core/Game';

/**
 * Developer tools. Press ` (the key under Esc) to show/hide.
 * Tweak numbers live, see collision shapes, kill all enemies (K), etc.
 * Add your own buttons/sliders in the constructor!
 */
export class DebugPanel {
  enabled = false;
  private gui: GUI;
  showColliders = false;
  private lines: LineSegments;

  constructor(private game: Game) {
    this.gui = new GUI({ title: 'Debug (` to hide)' });
    this.gui.hide();

    const cheats = this.gui.addFolder('Cheats');
    cheats.add(game, 'godMode').name('God mode (G)').listen();
    cheats.add({ kill: () => game.killAllEnemies() }, 'kill').name('Kill all enemies (K)');
    cheats.add({ heal: () => game.player?.health?.reset() }, 'heal').name('Full health');

    const tune = this.gui.addFolder('Tuning');
    tune.add(TUNING, 'gravity', 5, 60, 0.5).name('Gravity');
    tune.add(TUNING.player, 'acceleration', 2, 40, 1).name('Player acceleration');
    tune.add(TUNING.player, 'turnSpeed', 2, 30, 1).name('Player turn speed');
    tune.add(TUNING.camera, 'mouseSensitivity', 0.0005, 0.008, 0.0001).name('Mouse sensitivity');
    tune.add(TUNING.waves, 'delayBetween', 0, 10, 0.5).name('Seconds between waves');
    const playerStats = {
      get moveSpeed() {
        return game.player?.stats.moveSpeed ?? 0;
      },
      set moveSpeed(v: number) {
        if (game.player) game.player.stats.moveSpeed = v;
      },
      get jumpSpeed() {
        return game.player?.stats.jumpSpeed ?? 0;
      },
      set jumpSpeed(v: number) {
        if (game.player) game.player.stats.jumpSpeed = v;
      },
    };
    tune.add(playerStats, 'moveSpeed', 1, 25, 0.5).name('Current bird speed').listen();
    tune.add(playerStats, 'jumpSpeed', 4, 25, 0.5).name('Current bird jump').listen();

    const view = this.gui.addFolder('View');
    view.add(this, 'showColliders').name('Show collision shapes');

    const gfx = this.gui.addFolder('Graphics');
    gfx.add(SPEED, 'fps').name('Frames per second').disable().listen();
    gfx.add(SPEED, 'qualityStep').name('Auto quality step (0 = best)').disable().listen();
    gfx.add(GRAPHICS, 'autoQuality').name('Auto quality');
    gfx.add(GRAPHICS, 'resolution', 0.5, 1, 0.05).name('Resolution').listen();
    gfx.add(GRAPHICS, 'effects').name('All effects');
    gfx.add(GRAPHICS, 'ambientOcclusion').name('Ambient occlusion').listen();
    gfx.add(GRAPHICS, 'bloom').name('Bloom (glow)').listen();
    gfx.add(GRAPHICS, 'skyLighting').name('Sky lighting');
    gfx.add(GRAPHICS, 'colorGrading').name('Color grading');

    this.lines = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ vertexColors: true }));
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    game.scene.add(this.lines);
  }

  toggle(): void {
    this.enabled = !this.enabled;
    if (this.enabled) this.gui.show();
    else this.gui.hide();
  }

  /** Called every frame. */
  update(): void {
    this.lines.visible = this.enabled && this.showColliders;
    if (!this.lines.visible) return;
    const { vertices, colors } = this.game.physics.world.debugRender();
    const geo = this.lines.geometry;
    geo.setAttribute('position', new BufferAttribute(vertices, 3));
    geo.setAttribute('color', new BufferAttribute(colors, 4));
  }
}
