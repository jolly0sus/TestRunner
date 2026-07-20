import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { DESIGN, PLAYER, STRINGS } from '../config';
import { tex } from '../core/assets';
import { stage } from '../core/stage';

/** Branding banner: full-width bar pinned flush to the bottom of the screen. */
const BANNER_HEIGHT = 140;
/** Fixed top row for HP / money / mute. */
const TOP_ROW = 54;

const HEART_FULL = 0xff3b5c;
const HEART_EMPTY = 0x6b6b6b;

/** Top-of-screen HUD: branding banner, HP hearts, animated money balance. */
export class HUD extends Container {
  private hearts: Graphics[] = [];
  private banner!: Sprite;
  private balanceText!: Text;
  private muteButton!: Container;
  private muteSlash!: Graphics;

  private displayedBalance = 0;
  private targetBalance = 0;

  onMuteToggle: (() => boolean) | null = null;

  build(): void {
    // Small branding banner, pinned to the bottom of the screen.
    this.banner = new Sprite(tex('banner'));
    this.banner.anchor.set(0.5, 1);
    this.addChild(this.banner);

    const top = TOP_ROW;

    // HP hearts (top-left).
    const heartSize = 30;
    for (let i = 0; i < PLAYER.MAX_HP; i++) {
      const h = this.makeHeart(heartSize, HEART_FULL);
      h.x = 40 + i * (heartSize * 2 + 14);
      h.y = top + heartSize;
      this.addChild(h);
      this.hearts.push(h);
    }

    // Money balance (top-right).
    this.balanceText = new Text({
      text: STRINGS.balancePrefix + '0',
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 52,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x2b1a45, width: 8, join: 'round' },
      },
    });
    this.balanceText.anchor.set(1, 0.5);
    this.balanceText.y = top + heartSize;
    this.addChild(this.balanceText);

    this.buildMuteButton(top);
    this.layout();
  }

  /** Reposition width-dependent elements (called on build + resize). */
  layout(): void {
    // Full-width banner bar, stretched edge-to-edge, flush to the bottom.
    this.banner.width = stage.width;
    this.banner.height = BANNER_HEIGHT;
    this.banner.x = stage.width / 2;
    this.banner.y = DESIGN.HEIGHT;

    this.balanceText.x = stage.width - 40;
    this.muteButton.x = stage.width - 40;
  }

  private buildMuteButton(top: number): void {
    const btn = new Container();
    const bg = new Graphics().circle(0, 0, 26).fill({ color: 0x000000, alpha: 0.28 });
    const speaker = new Graphics()
      .poly([-10, -6, -4, -6, 3, -12, 3, 12, -4, 6, -10, 6])
      .fill(0xffffff);
    const wave = new Graphics()
      .arc(4, 0, 8, -0.9, 0.9)
      .stroke({ width: 3, color: 0xffffff });
    this.muteSlash = new Graphics()
      .moveTo(-14, -14)
      .lineTo(14, 14)
      .stroke({ width: 4, color: 0xff4444 });
    this.muteSlash.visible = false;

    btn.addChild(bg, speaker, wave, this.muteSlash);
    btn.y = top + 90;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', (e) => {
      e.stopPropagation();
      const muted = this.onMuteToggle?.();
      this.muteSlash.visible = !!muted;
    });
    this.muteButton = btn;
    this.addChild(btn);
  }

  private makeHeart(size: number, color: number): Graphics {
    const r = size / 2;
    const g = new Graphics();
    g.circle(-r * 0.5, -r * 0.15, r * 0.6)
      .circle(r * 0.5, -r * 0.15, r * 0.6)
      .fill(color);
    g.poly([-r * 1.02, r * 0.05, r * 1.02, r * 0.05, 0, r * 1.25]).fill(color);
    return g;
  }

  setHP(hp: number): void {
    this.hearts.forEach((h, i) => {
      const r = 15;
      const color = i < hp ? HEART_FULL : HEART_EMPTY;
      h.clear();
      h.circle(-r * 0.5, -r * 0.15, r * 0.6)
        .circle(r * 0.5, -r * 0.15, r * 0.6)
        .fill(color);
      h.poly([-r * 1.02, r * 0.05, r * 1.02, r * 0.05, 0, r * 1.25]).fill(color);
    });
  }

  setBalance(value: number): void {
    this.targetBalance = value;
  }

  update(dtMs: number): void {
    if (this.displayedBalance !== this.targetBalance) {
      const step = Math.max(1, (this.targetBalance - this.displayedBalance) * 0.15);
      this.displayedBalance = Math.min(
        this.targetBalance,
        Math.round(this.displayedBalance + step),
      );
      this.balanceText.text =
        STRINGS.balancePrefix + this.displayedBalance.toLocaleString('en-US');
      // Little pop on change.
      this.balanceText.scale.set(1.12);
    }
    if (this.balanceText.scale.x > 1) {
      this.balanceText.scale.set(
        Math.max(1, this.balanceText.scale.x - dtMs * 0.0015),
      );
    }
  }

  reset(): void {
    this.displayedBalance = 0;
    this.targetBalance = 0;
    this.balanceText.text = STRINGS.balancePrefix + '0';
    this.setHP(PLAYER.MAX_HP);
  }
}
