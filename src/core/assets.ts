import { Assets, type Spritesheet, type Texture } from 'pixi.js';

/** Logical asset keys mapped to files under /public/assets. */
export const ASSET_URLS = {
  playerAtlas: 'assets/player.json',
  enemyAtlas: 'assets/enemy.json',
  bg: 'assets/bg.png',
  tree1: 'assets/tree1.png',
  tree2: 'assets/tree2.png',
  bush1: 'assets/bush1.png',
  bush2: 'assets/bush2.png',
  bush3: 'assets/bush3.png',
  lamp: 'assets/lamp.png',
  finish: 'assets/finish.png',
  hand: 'assets/hand.png',
  fail: 'assets/fail.png',
  glow: 'assets/glow.png',
  cone: 'assets/cone.webp',
  coneGlow: 'assets/cone_glow.webp',
  dollar: 'assets/dollar.png',
  ctaButton: 'assets/cta_button.png',
  paypalLogo: 'assets/paypal_logo.webp',
  paypalCard: 'assets/paypal_card.webp',
  banner: 'assets/banner.webp',
  confetti1: 'assets/confetti1.png',
  confetti2: 'assets/confetti2.png',
  confetti3: 'assets/confetti3.png',
  confetti4: 'assets/confetti4.png',
  confetti5: 'assets/confetti5.png',
  confetti6: 'assets/confetti6.png',
} as const;

export type AssetKey = keyof typeof ASSET_URLS;

/** Background music + one-shot sound effects (loaded by Howler separately). */
export const AUDIO_URLS = {
  music: 'assets/audio/audio_8.mp3',
  jump: 'assets/audio/audio_4.mp3',
  coin: 'assets/audio/audio.mp3',
  hurt: 'assets/audio/audio_3.mp3',
  win: 'assets/audio/audio_6.mp3',
  lose: 'assets/audio/audio_7.mp3',
  button: 'assets/audio/audio_5.mp3',
} as const;

export type SoundKey = keyof typeof AUDIO_URLS;

const cache = new Map<AssetKey, unknown>();

/**
 * Load every texture / spritesheet, reporting progress in [0, 1].
 * Fonts are loaded via the CSS @font-face + the document.fonts API.
 */
export async function loadAllAssets(
  onProgress?: (p: number) => void,
): Promise<void> {
  const entries = Object.entries(ASSET_URLS) as [AssetKey, string][];
  let done = 0;

  await Promise.all(
    entries.map(async ([key, url]) => {
      const asset = await Assets.load(url);
      cache.set(key, asset);
      done += 1;
      onProgress?.(done / entries.length);
    }),
  );

  // Ensure the custom display font is ready before we build any Text.
  try {
    await document.fonts.load('40px "GameFont"');
    await document.fonts.ready;
  } catch {
    /* font is optional — fall back to system fonts */
  }
}

export function tex(key: AssetKey): Texture {
  return cache.get(key) as Texture;
}

export function sheet(key: AssetKey): Spritesheet {
  return cache.get(key) as Spritesheet;
}
