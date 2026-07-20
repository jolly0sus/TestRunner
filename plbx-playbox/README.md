# @plbx/playbox

Device-mockup preview harness for **playable ads** — wraps any dev URL in a
simulated phone frame, à la the internal plbx playbox. Switch devices, flip
orientation, mute, reload, and scan a QR to open the playable on a real phone.

Framework-agnostic: it just loads your game in an `<iframe>`, so it works with
PixiJS, Phaser, Three.js, plain Canvas — anything served over HTTP.

## Install

```bash
npm i -D @plbx/playbox
```

## Use

Run your game's dev server as usual, then point playbox at it:

```bash
# your game (e.g. Vite) is on :5173
playbox --target http://localhost:5173 --open
```

Open the printed preview URL (default `http://localhost:6060/`).

### Options

| Flag | Default | Description |
| --- | --- | --- |
| `-t, --target <url>` | `http://localhost:5173` | URL of the playable to preview |
| `-p, --port <n>` | `6060` | Preview server port |
| `--host <addr>` | `0.0.0.0` | Bind address |
| `-d, --device <id>` | `s23ultra` | Initial device preset |
| `-o, --open` | — | Open the preview in your browser |

### Recommended: an npm script

```jsonc
// package.json
{
  "scripts": {
    "dev": "vite",
    "preview:box": "playbox --target http://localhost:5173 --open"
  }
}
```

Run `npm run dev` in one terminal and `npm run preview:box` in another.

## Features

- **Device presets** — Samsung Galaxy S23 / S23 Ultra, Pixel 7/8, iPhone
  14/15/15 Pro Max/SE, iPad Mini/Pro. Add your own in `public/devices.js`.
- **Orientation** — portrait ⇄ landscape.
- **Reload** — reloads the playable without touching the frame.
- **QR / on-device** — the QR encodes your machine's **LAN** address (loopback
  hosts are auto-swapped for the Wi-Fi IP), so a phone on the same network can
  open the real playable.
- **Frame toggle** ("👁") — hide the bezel for a clean capture.
- **Mute** — best-effort (see below).

## Why the iframe isn't proxied

The target is loaded **directly by the browser**, not proxied through this
server, so Vite HMR / WebSocket keeps working untouched. The trade-off is that
the preview shell and the playable are on **different origins**, so cross-frame
JS (e.g. forcing audio mute) can't reach into the game directly.

### Muting (opt-in)

The mute button `postMessage`s the playable. Have your game listen:

```js
window.addEventListener('message', (e) => {
  if (e.data?.source === 'playbox' && e.data.type === 'playbox:mute') {
    audio.muted = e.data.muted; // wire to your AudioManager / Howler.mute()
  }
});
```

Without this listener the button toggles state but has no audible effect.

## Customising devices

Edit `public/devices.js` — each entry is
`{ id, name, w, h, camera }` where `w`/`h` are CSS logical pixels in portrait
and `camera` is `punch` | `notch` | `island` | `none`.
