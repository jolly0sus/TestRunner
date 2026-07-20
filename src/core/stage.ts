/**
 * Runtime "design stage" dimensions.
 *
 * The world is authored at a FIXED height (1280 design units) so all vertical
 * gameplay — ground line, jump arc, character/obstacle sizes — is identical in
 * every orientation. Only the WIDTH varies: it tracks the window's aspect ratio
 * so the stage fills the viewport with no letterbox bars in the common range.
 *
 *   portrait  phone (9:16)  -> width  ~720
 *   landscape phone (16:9)  -> width ~2276
 *
 * The width is clamped so extreme windows letterbox instead of stretching.
 */
export const WORLD_HEIGHT = 1280;
export const MIN_WIDTH = 560; // ~ up to 20:9 portrait
export const MAX_WIDTH = 2400; // ~ up to 21:9 landscape

export const stage = {
  width: 720,
  height: WORLD_HEIGHT,
  get isLandscape(): boolean {
    return this.width > this.height;
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Recompute the stage width from the current window size.
 * Returns true if the width actually changed (i.e. a re-layout is needed).
 */
export function resolveStage(winW: number, winH: number): boolean {
  const aspect = winW / Math.max(1, winH);
  const width = Math.round(clamp(WORLD_HEIGHT * aspect, MIN_WIDTH, MAX_WIDTH));
  const changed = width !== stage.width;
  stage.width = width;
  stage.height = WORLD_HEIGHT;
  return changed;
}
