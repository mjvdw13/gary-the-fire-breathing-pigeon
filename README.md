# Gary the Fire Pigeon 3D 🐦🔥

The 3D, third-person version of Gary the Fire Pigeon. Pick a bird, fight through waves of
rats, drones and park rangers on the rooftop, beat the Giant Cat, then take on the
Construction Worker. Or see how long you last in Endless mode.

## Play

**Online:** https://mjvdw13.github.io/gary-the-fire-breathing-pigeon/

Or run it on your own computer:

```bash
npm install     # first time only
npm run dev     # opens http://localhost:5173
```

## Controls

| Key | Action |
|---|---|
| WASD | Move |
| Mouse | Look around / aim (click the game to capture the mouse) |
| Left click (hold) | Shoot |
| Space | Jump — double jump (Gary, Fang), hold to fly (Violet, Quacks) |
| Shift | Dash (Fang) |
| Scroll wheel | Zoom camera |
| Esc | Pause |
| G | God mode |
| M | Mute |
| ` | Debug panel |

## Birds

| | Shot | Movement |
|---|---|---|
| **Gary** – The Fire Pigeon | Fireballs | Double jump |
| **Violet** – The Laser Bat | Rapid lasers | Flight |
| **Fang** – The Lightning Falcon | Lightning (3 dmg) | Double jump + dash |
| **Quacks** – The Feather Duck | 3 homing feathers | Long flight |

Beat Chapter 1 to unlock a bat buddy who flies with you and zaps enemies.

## Making changes

See **CLAUDE.md**. It explains how the code is organized and has step-by-step recipes for
adding characters, abilities, enemies, bosses, levels, and game modes.

```bash
npm test            # run the tests
npm run typecheck   # check for mistakes
npm run build       # make a version you can share (in dist/)
```

Every push to `main` automatically tests the game and publishes it to the link above
(see `.github/workflows/deploy.yml`). If the tests fail, the old version stays online.

The original 2D game is in `legacy-2d/` (open `legacy-2d/index.html` in a browser).
