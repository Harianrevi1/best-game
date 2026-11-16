# EMBERFALL — catch the embers, dodge the ash

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Harianrevi1/best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Harianrevi1/best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original arcade game built for the [make.fun bounty "Make the best game"](https://make.fun/bounty/best-game-01) (best-game-01).

## The game

A dark indigo night sky. Embers fall from above, glowing orange and gold, trailing sparks. You move a brazier along the bottom — mouse, arrow keys, or A/D — and catch them.

- **Catch embers** to score. Catches in a row build a **combo** (multiplier x2 up to x5).
- **Golden embers** are worth +50.
- **Ash embers** (grey) must be dodged — catching one costs a life and resets your combo.
- **Flare** (Spacebar) clears the screen, a limited charge that refills each level.
- **Levels** rise every 300 points: embers fall faster, more of them, more ash.
- **3 lives.** Lose them all and the fire goes out — game over, with your score and a restart (R or click).

Synthesized WebAudio sounds (no audio files): a catch blip that rises in pitch with your combo, a golden chime, an ash thud, a Flare whoosh, a game-over toll. Mute with M.

## Running it

Node 22, standard library only. No network, nothing to install.

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static HTTP server and open `game/index.html`.

## Layout

- `main.ts` — entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` via the vendored make.fun library.
- `game/index.html` — the page.
- `game/src/main.js` — game loop, state, deterministic shot modes.
- `game/src/player.js` — the brazier.
- `game/src/embers.js` — ember spawning, falling, collisions.
- `game/src/particles.js` — sparks and trails.
- `game/src/audio.js` — synthesized sounds.
- `game/src/hud.js` — HUD, title screen, game-over screen.
- `game/src/style.css` — page styling.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — 1-start, 2-play, 3-end, real renders of the game.

## License

MIT — see `LICENSE`.
