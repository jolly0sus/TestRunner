# Playoff Runner (PixiJS)

A 2D side-scrolling endless-runner playable, recreated in **PixiJS v8 +
TypeScript** from the reference at
`https://playbox.play.plbx.ai/playoff/runner`, using the supplied asset pack.

The player (a running woman) auto-runs while the world scrolls past. Tap /
click / Space to **jump** over rival runners and traffic cones, grab floating
money (dollar bills & PayPal marks) to build a balance, survive on 3 hearts,
and cross the finish line to the reward end-card.

## Run it

```bash
npm install
npm run dev      # dev server with HMR at http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

Requires Node 18+.

## Controls

- **Tap / Click / Space / ↑ / W** — start, jump, and dismiss the tutorial.

## Game flow

1. **Loading** → progress bar, then `TAP TO START`.
2. **Run** — collect money automatically; jumping is locked until the tutorial.
3. **Tutorial** — the first rival freezes the world with a `TAP TO JUMP!`
   prompt; tapping resumes and auto-jumps the lesson.
4. **Course** — a fixed layout of collectibles, cones (with `!` warnings),
   rival runners (which chase faster than the world) and money arcs.
5. **Finish** — reaching the checkered gate snaps the tape, the world
   decelerates to a stop and the **win** card appears (confetti + balance +
   CTA). Losing all 3 hearts shows the **FAIL** card.

Tunable constants (speeds, jump arc, spawn layout, rewards, hitboxes) live in
[`src/config.ts`](src/config.ts).

## Architecture

```
src/
  main.ts               bootstrap
  config.ts             all constants + the COURSE spawn table + enums
  Game.ts               state machine, update loop, spawning, collisions
  core/
    assets.ts           asset manifest + loader + typed accessors
    AudioManager.ts     Howler wrapper (music + SFX, mute)
    Viewport.ts         letterbox-fit the 720x1280 design stage to the window
    util.ts             AABB / circle collision + rng helpers
  entities/
    Player.ts           sine-arc jump, idle/run/jump/hurt anims, i-frames
    Enemy.ts            mirrored rival runner, chase speed
    Obstacle.ts         traffic cone + pulsing glow + "!" warning
    Collectible.ts      floating dollar / PayPal pickup, bob + pulse
    FinishLine.ts       checkered gate with a breakable tape
  world/
    Background.ts       seamless mirror-tiled scenery + recycled props
    Spawner.ts          distance-driven course walker
  ui/
    HUD.ts              banner, HP hearts, animated money counter, mute
    Tutorial.ts         dim overlay + pointing-hand prompt
    EndScreen.ts        win/lose card, confetti, reward, CTA, replay
    LoadingScreen.ts    progress bar + start prompt
```

### Rendering / scaling — portrait **and** landscape

The world is authored at a **fixed height of 1280** design units; the **width
tracks the window's aspect ratio** (`src/core/stage.ts`), so the scene fills the
viewport in both orientations with no letterbox bars in the normal range
(clamped at the extremes). `Viewport` scales the root container by height and
recentres it on every resize.

Because the height is fixed, all vertical gameplay — ground line, jump arc,
character and obstacle sizes — is **identical in every orientation**; landscape
simply reveals more of the course ahead (wider view), which suits a runner.
On an orientation / size change, `Game.relayout()` re-flows only the
width-dependent parts (HUD, background scenery, full-screen overlays, the
player's x) — live, without restarting the run.

### QA flags

Append to the URL (both off by default, no effect otherwise):

- `?nohit` — the player takes no damage (demo the win end-card freely).
- `?autojump` — the game jumps hazards on its own, to demo a full clean run.

The course places a hazard (enemy **or** cone) every 2 distance units,
alternating types, so two things never need to be jumped at once and the run
is always completable.

### Character animation

The two character sprite sheets ship with TexturePacker-style frame atlases
(`public/assets/player.json`, `enemy.json`). The woman's atlas defines four
clips — `idle` (18f), `run` (8f), `jump` (10f), `hurt` (5f) — played via
`AnimatedSprite`. Jumps use a deterministic sine arc (fixed height + airtime)
rather than gravity, matching the reference's crisp feel.

## Asset mapping

| Role | File |
| --- | --- |
| Player (woman) sheet | `player.png` + `player.json` |
| Enemy (rival) sheet | `enemy.png` + `enemy.json` |
| Background scenery | `bg.png` |
| Trees / bushes / lamp (decor) | `tree1/2`, `bush1/2/3`, `lamp` |
| Obstacle (cone + glow) | `cone.webp`, `cone_glow.webp` |
| Collectibles | `dollar.png`, `paypal_logo.webp` |
| Finish stripe | `finish.png` |
| Tutorial hand | `hand.png` |
| Lose badge | `fail.png` |
| End-card branding | `banner.webp`, `paypal_card.webp` |
| Confetti | `confetti1..6.png` |
| Font | `font.ttf` (CSS `@font-face`, family `GameFont`) |
| Audio | `audio/audio*.mp3` (Howler) |

## Notes

- The end-card CTA links to the reference URL as a placeholder for the store
  redirect.
- UI copy is English by default; all strings are centralised in
  `STRINGS` in `src/config.ts` for easy localisation (the reference bundles
  en/es/it).
