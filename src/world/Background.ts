import { Container, Sprite } from 'pixi.js';
import { DESIGN, LAMP_SPACING, LAYERS, SCREEN_BUFFER } from '../config';
import { tex, type AssetKey } from '../core/assets';
import { stage } from '../core/stage';
import { randRange } from '../core/util';

interface Tile {
  sprite: Sprite;
  mirrored: boolean;
  slotLeft: number;
}

interface Prop {
  sprite: Sprite;
  baseSpan: number;
}

/**
 * Scrolling scenery: a seamless mirror-tiled landscape (sky + city + road)
 * plus recycled roadside props (lamps, trees, bushes). Everything scrolls at
 * the world speed, matching the reference's flat side-scroller depth.
 */
export class Background extends Container {
  private tiles: Tile[] = [];
  private tileW = 0;
  private bgScale = 1;

  private lamps: Prop[] = [];
  private trees: Prop[] = [];
  private bushes: Prop[] = [];

  private paused = false;

  /** Approximate horizon where the road meets the field, in design px. */
  private readonly horizonY = DESIGN.HEIGHT * 0.55;

  build(): void {
    this.buildTiledBackground();
    this.buildLamps();
    this.buildTrees();
    this.buildBushes();
  }

  private buildTiledBackground(): void {
    const t = tex('bg');
    this.bgScale = Math.max(stage.width / t.width, DESIGN.HEIGHT / t.height);
    this.tileW = t.width * this.bgScale;
    const y = (DESIGN.HEIGHT - t.height * this.bgScale) / 2;
    const count = Math.ceil((stage.width * 2) / this.tileW) + 2;

    for (let i = 0; i < count; i++) {
      const mirrored = i % 2 === 1;
      const sprite = new Sprite(t);
      sprite.anchor.set(0, 0);
      sprite.y = y;
      sprite.scale.set(mirrored ? -this.bgScale : this.bgScale, this.bgScale);
      sprite.zIndex = LAYERS.FAR_BACKGROUND;
      const slotLeft = i * this.tileW;
      sprite.x = mirrored ? slotLeft + this.tileW : slotLeft;
      this.addChild(sprite);
      this.tiles.push({ sprite, mirrored, slotLeft });
    }
  }

  private buildLamps(): void {
    const span = stage.width * 2 + SCREEN_BUFFER * 2;
    const count = Math.ceil(span / LAMP_SPACING) + 1;
    for (let i = 0; i < count; i++) {
      const sprite = new Sprite(tex('lamp'));
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(1.0);
      sprite.zIndex = LAYERS.NEAR_BACKGROUND;
      sprite.x = i * LAMP_SPACING - SCREEN_BUFFER;
      sprite.y = this.horizonY + 30;
      this.addChild(sprite);
      this.lamps.push({ sprite, baseSpan: count * LAMP_SPACING });
    }
  }

  private buildTrees(): void {
    const keys: AssetKey[] = ['tree1', 'tree2'];
    const minGap = 520;
    const maxGap = 820;
    let x = -SCREEN_BUFFER;
    const end = stage.width * 2 + SCREEN_BUFFER;
    while (x < end) {
      const sprite = new Sprite(tex(keys[Math.floor(Math.random() * keys.length)]));
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(randRange(0.85, 1.1));
      sprite.zIndex = LAYERS.MID_BACKGROUND;
      sprite.x = x;
      sprite.y = this.horizonY + 20;
      this.addChild(sprite);
      x += randRange(minGap, maxGap);
    }
    const span = x + SCREEN_BUFFER;
    this.children
      .filter((c) => c.zIndex === LAYERS.MID_BACKGROUND)
      .forEach((c) => this.trees.push({ sprite: c as Sprite, baseSpan: span }));
  }

  private buildBushes(): void {
    const keys: AssetKey[] = ['bush1', 'bush2', 'bush3'];
    let x = -SCREEN_BUFFER + 100;
    const end = stage.width * 2 + SCREEN_BUFFER;
    while (x < end) {
      const groupSize = Math.random() > 0.3 ? 3 : 2;
      for (let a = 0; a < groupSize; a++) {
        if (a > 0 && Math.random() < 0.2) continue;
        const sprite = new Sprite(tex(keys[a % keys.length]));
        sprite.anchor.set(0.5, 1);
        sprite.scale.set(randRange(0.5, 0.75));
        sprite.zIndex = LAYERS.NEAR_BACKGROUND;
        sprite.x = x + a * 70 + randRange(0, 30);
        sprite.y = this.horizonY + 70;
        this.addChild(sprite);
      }
      x += randRange(460, 600);
    }
    const span = x + SCREEN_BUFFER;
    this.children
      .filter(
        (c) =>
          c.zIndex === LAYERS.NEAR_BACKGROUND && !this.lamps.some((l) => l.sprite === c),
      )
      .forEach((c) => this.bushes.push({ sprite: c as Sprite, baseSpan: span }));
  }

  update(dtMs: number, worldSpeed: number): void {
    if (this.paused) return;
    const r = (worldSpeed * dtMs) / 1000;
    const total = this.tiles.length * this.tileW;

    for (const t of this.tiles) {
      t.slotLeft -= r;
      if (t.slotLeft < -this.tileW) t.slotLeft += total;
      t.sprite.x = t.mirrored ? t.slotLeft + this.tileW : t.slotLeft;
    }

    this.recycle(this.lamps, r);
    this.recycle(this.trees, r);
    this.recycle(this.bushes, r);
  }

  private recycle(props: Prop[], r: number): void {
    for (const p of props) {
      p.sprite.x -= r;
      if (p.sprite.x < -SCREEN_BUFFER) p.sprite.x += p.baseSpan + SCREEN_BUFFER;
    }
  }

  /** Recreate scenery for the current stage width (orientation change). */
  rebuild(): void {
    this.removeChildren();
    this.tiles = [];
    this.lamps = [];
    this.trees = [];
    this.bushes = [];
    this.build();
  }

  /** Restore scenery to its initial layout for a fresh run. */
  reset(): void {
    this.rebuild();
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }
}
