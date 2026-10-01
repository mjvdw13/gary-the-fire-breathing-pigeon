# Gary the Fire Pigeon 3D

A 3D, third-person (Roblox-style) remake of the 2D canvas game in `legacy-2d/`.
TypeScript + three.js (rendering) + Rapier (physics) + Vite (dev server). Single-player.

The person extending this game is a kid learning to make games with Claude. Keep code
readable, keep comments friendly and short, and prefer adding a new file over making an
existing one more complicated.

## Commands

- `npm run dev` – start the game at http://localhost:5173 (reloads on save)
- `npm test` – run the tests (Vitest, no browser needed)
- `npm run typecheck` – check types (run this after every change)
- `npm run build` – make a shareable static build in `dist/`

Node.js is installed at `C:\Program Files\nodejs`. If `npm` isn't found in Git Bash, run
`export PATH="/c/Program Files/nodejs:$PATH"` first.

## Golden rules (why the code is shaped this way)

1. **Content = one file + one registry line.** Characters, enemies, projectiles, levels,
   props and chapters are each registered in their folder's `index.ts` (or `definitions.ts`
   / `chapters.ts`). Adding content should never require editing `core/`.
2. **Core code never checks for a specific type.** No `instanceof Rat` in `Game.ts` or
   `CombatSystem.ts`. Things interact through shared pieces on `Entity`:
   `health`, `team`, `hitbox`, `hazards` (damaging areas), `contactDamage`, and `Projectile`.
3. **Characters are a list of abilities.** `ShootAbility`, `DoubleJump`, `Flight`, `Dash`…
   mix and match them in a character file.
4. **Systems talk through events.** `ctx.events.emit(...)` / `ctx.events.on(...)`; all event
   names live in `src/core/events.ts`. Score, sound, HUD banners and unlocks are listeners.
5. **Fixed timestep.** Game logic runs in `update(ctx, dt)` at exactly 60 ticks/sec.
   Never use `setTimeout` or frame time for gameplay. Use timers that count `dt`.
6. **Everything an entity needs is on `ctx` (GameContext):** `world`, `physics`, `events`,
   `input`, `camera`, `particles`, `level`, `player`, `godMode`, `random`.

## Units & directions

- 1 unit = 1 meter. Speeds in m/s. Time in seconds. `px()` in `config/tuning.ts` converts
  old 2D pixel numbers (40 px = 1 m).
- +Y is up. A model's **front faces +Z**. `yaw = 0` means facing +Z; `yaw = atan2(dx, dz)`.
- Entity `position` is at the **feet**. Floors' top surface is at y = 0.

## Folder map

```
src/
  main.ts                 boot: init physics → new Game → GameLoop
  config/tuning.ts        global numbers (gravity, health, camera, wave delay)
  core/                   Game (flow + systems), GameLoop, EventBus, events, StateMachine, Registry, math
  world/                  Entity base class, World (entity list), components/ (Health, Hazard, Team, shapes)
  physics/                Physics (Rapier wrapper, raycasts), CharacterMotor (walk/jump/collide)
  input/                  Input (keys/mouse/pointer lock), Actions (key bindings)
  camera/                 ThirdPersonCamera (orbit, zoom, wall pull-in, shake)
  player/                 Player, CharacterDef, characters/ (gary, violet, fang, quacks + index)
  abilities/              Ability base + ShootAbility, DoubleJump, Flight, Dash
  combat/                 CombatSystem (damage rules), aim helpers, Shockwave, GroundTelegraph,
                          projectiles/ (Projectile class + definitions registry)
  enemies/                Enemy base, types/ (rat, drone, parkRanger), bosses/, companions/, index (registry)
  gameplay/               chapters.ts (story), WaveSpawner, modes/ (Story, Endless, WaveRunner)
  level/                  LevelDef, LevelBuilder, levels/ (rooftop, constructionSite), props/ (+ FadingCloud)
  rendering/              Renderer, ModelFactory (part-list models / .glb), animation, Showcase, effects/ (particles)
  ui/                     HUD, Screen base, screens/ (CharacterSelect, ModeSelect, MessageScreen)
  audio/Audio.ts          code-generated sound effects, driven by events
  save/SaveData.ts        localStorage: unlocks + high scores
  debug/DebugPanel.ts     lil-gui panel (` key): cheats, tuning sliders, collider view
tests/                    Vitest tests (physics motor, combat, modes, core, content wiring)
legacy-2d/                the original 2D game — reference for stats and behaviors
```

## Recipes

### Add a playable character
1. Copy `src/player/characters/gary.ts` to `src/player/characters/<name>.ts`.
2. Change `id`, `name`, `title`, `description`, `color`, `stats`, `muzzle`, the `model`
   parts, and the `abilities` list (reuse existing abilities or make a new one).
3. Import it in `src/player/characters/index.ts` and add it to `.register(...)`.
That's it — it shows up on the character select screen.

### Add an ability
1. New file in `src/abilities/`, `extends Ability`. Set `name` and `trigger`
   (`{ action: 'fire' | 'jump' | 'special', mode: 'pressed' | 'held', airOnly? }`).
2. Write `activate(player, ctx, dt)`. Use `this.cooldown` for cooldowns, override
   `canActivate` for extra rules (fuel, charges), `update` for recharging, `onLand` for
   resets, `hud()` to show a meter.
3. Add it to a character's `abilities: () => [...]`.
New action/key? Add it to `Action` + `DEFAULT_BINDINGS` in `src/input/Actions.ts`.

### Add a projectile
Add a `ProjectileDef` in `src/combat/projectiles/definitions.ts` and register it. Options:
`speed, damage, radius, lifetime, gravity, bounces, bounciness, homing, piercing,
alignToVelocity, spin, trail, impact, model`. Use it with
`new ShootAbility({ projectile: '<id>', ... })` or `new Projectile(def, team, pos, dir)`.

### Add an enemy
1. Copy `src/enemies/types/rat.ts` (simplest) or `parkRanger.ts` (has an attack Hazard).
2. Pass stats + model to `super({...}, position)`. Write `think(ctx, dt)`: set
   `this.motor.velocity`, turn with `this.faceToward(...)`, walk with `this.moveToward(...)`.
   For melee attacks, create a `Hazard`, push it to `this.hazards`, and `activate()` /
   `deactivate()` it. For ranged attacks, `ctx.world.add(new Projectile(...), ctx)`.
3. Register in `src/enemies/index.ts` with `spawn: 'ground' | 'air'`.
4. Add its id to a chapter's `enemyPool` in `src/gameplay/chapters.ts`.

### Add a boss
Like an enemy, but pass `boss: true`, register with `spawn: 'boss'`, and use a
`StateMachine` for its attack pattern (see `bosses/giantCat.ts`). Useful pieces:
`Shockwave` (expanding ring), `GroundTelegraph` (red warning circle), `lobVelocity`
(throwing in an arc), and `this.anger` (0→1 as health drops). Put its id in a chapter's `boss`.

### Add a level
1. Copy `src/level/levels/rooftop.ts`. Edit size, colors, `blocks` (solid boxes),
   `props` (from `level/props/index.ts`), `clouds` (fading platforms, top surface),
   spawns, `airHeight`, and optional `scenery` (decoration, no collisions).
2. Register in `src/level/levels/index.ts`, then use it in a chapter (or an EndlessMode).
Tip: a jump is ~2.3–2.6 m, so stack platforms about 2.3 m apart.
Enemies won't spawn inside solid things (`physics.isSpaceFree`), but keep boss spawns clear.

### Add a prop
Add a `PropDef` (model parts + collider boxes, base at y = 0, facing +Z) to
`src/level/props/index.ts` and register it.

### Add a story chapter
Add an entry to `STORY_CHAPTERS` in `src/gameplay/chapters.ts` (level, boss, waves, enemy pool).

### Add a game mode
Make a class in `src/gameplay/modes/` that `extends WaveRunner implements GameMode`
(see `EndlessMode.ts`), then add `() => new YourMode()` to `MODES` in `modes/index.ts`.

### Add a sound / particle effect / event
- Particles: add a preset in `rendering/effects/presets.ts`, use `ctx.particles.burst('name', pos)`.
- Sounds: add a listener in `audio/Audio.ts` (`events.on('someEvent', () => this.tone(...))`).
- Events: add to `GameEvents` in `core/events.ts`, then `ctx.events.emit(...)`.

### Use a real 3D model (Blockbench)
Export `.glb` into `public/assets/models/`, then set `model: { gltf: 'assets/models/<file>.glb', scale: 1 }`.
Name the bones/groups `legL`, `legR`, `wingL`, `wingR`, `armL`, `armR`, `body`, `tail`, `head` to get the built-in animations.

## Testing & checking work

- Always run `npm run typecheck` and `npm test` after changes.
- Pure logic (modes, combat rules, abilities) should get a Vitest test in `tests/`.
  Physics works in tests too (`await initPhysics()` — see `tests/CharacterMotor.test.ts`).
- In the browser console, `window.game` is the live Game (e.g. `game.godMode = true`,
  `game.killAllEnemies()`). The debug panel (` key) has cheats and tuning sliders.

## Not done yet / ideas

- Multiplayer: the fixed-timestep loop and event bus are the right starting point; the next
  step would be a server owning `World` and sending entity positions to clients.
- Performance: static level meshes are separate draw calls (~360/frame); merging them
  (`BufferGeometryUtils.mergeGeometries`) would help on slow laptops.
- Enemy pathfinding is simple (walk straight, sidestep when blocked).
- Real sound files, settings menu (key rebinding: `input.bindings`), touch controls.
