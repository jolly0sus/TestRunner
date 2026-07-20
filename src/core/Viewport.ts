import type { Application, Container } from 'pixi.js';
import { resolveStage, stage } from './stage';

/**
 * Fits the design stage into the real viewport. The stage height is fixed
 * (1280) and its width tracks the window aspect (see `stage`), so the scene
 * scales uniformly by height and fills the width in both orientations. All
 * gameplay code works in design coordinates under the scaled `root`.
 *
 * `onResize` fires whenever the stage width changes so the game can re-layout
 * width-dependent elements (HUD, background, overlays, player position).
 */
export class Viewport {
  scale = 1;
  onResize: (() => void) | null = null;

  constructor(
    private readonly app: Application,
    private readonly root: Container,
  ) {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
  }

  resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.app.renderer.resize(w, h);
    const changed = resolveStage(w, h);

    this.scale = Math.min(w / stage.width, h / stage.height);
    this.root.scale.set(this.scale);
    this.root.x = (w - stage.width * this.scale) / 2;
    this.root.y = (h - stage.height * this.scale) / 2;

    if (changed) this.onResize?.();
  };

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
  }
}
