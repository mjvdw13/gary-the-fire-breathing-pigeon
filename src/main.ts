import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';
import { initPhysics } from './physics/Physics';

/** Entry point: load the physics engine, create the game, start the loop. */
async function main(): Promise<void> {
  await initPhysics();

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui-root') as HTMLElement;
  const game = new Game(canvas, uiRoot);

  new GameLoop(
    (dt) => game.update(dt),
    (alpha, frameDt) => game.render(alpha, frameDt),
  ).start();

  // Handy for poking at the game from the browser console: window.game
  (window as unknown as { game: Game }).game = game;
}

main().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend', `<pre class="fatal">Oops! The game crashed:\n${err}</pre>`);
});
