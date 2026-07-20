import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN, STRINGS } from '../config';
import { MAX_WIDTH, stage } from '../core/stage';

/** Loading progress bar, then a "TAP TO START" prompt once ready. */
export class LoadingScreen extends Container {
  private barFill!: Graphics;
  private track!: Graphics;
  private loadingLabel!: Text;
  private startPrompt!: Text;
  private promptTime = 0;
  private progress = 0;
  private readonly barW = 440;
  private readonly barH = 18;
  private readonly cy = DESIGN.HEIGHT / 2;

  build(): void {
    const bg = new Graphics()
      .rect(-MAX_WIDTH, 0, MAX_WIDTH * 3, DESIGN.HEIGHT)
      .fill(0x1c1030);
    this.addChild(bg);

    this.loadingLabel = new Text({
      text: STRINGS.loading,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 44,
        fontWeight: '900',
        fill: 0xffffff,
      },
    });
    this.loadingLabel.anchor.set(0.5);
    this.loadingLabel.y = this.cy - 60;
    this.addChild(this.loadingLabel);

    this.track = new Graphics();
    this.addChild(this.track);
    this.barFill = new Graphics();
    this.addChild(this.barFill);

    this.startPrompt = new Text({
      text: STRINGS.tapToStart,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 56,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x2b1a45, width: 8, join: 'round' },
      },
    });
    this.startPrompt.anchor.set(0.5);
    this.startPrompt.y = this.cy;
    this.startPrompt.visible = false;
    this.addChild(this.startPrompt);

    this.layout();
  }

  private get cx(): number {
    return stage.width / 2;
  }

  layout(): void {
    this.loadingLabel.x = this.cx;
    this.startPrompt.x = this.cx;
    this.track
      .clear()
      .roundRect(this.cx - this.barW / 2, this.cy, this.barW, this.barH, this.barH / 2)
      .fill({ color: 0xffffff, alpha: 0.15 });
    this.drawBar();
  }

  private drawBar(): void {
    const w = Math.max(0, Math.min(1, this.progress)) * this.barW;
    this.barFill
      .clear()
      .roundRect(this.cx - this.barW / 2, this.cy, w, this.barH, this.barH / 2)
      .fill(0x16b34a);
  }

  setProgress(p: number): void {
    this.progress = p;
    this.drawBar();
  }

  showStartPrompt(): void {
    this.loadingLabel.visible = false;
    this.track.visible = false;
    this.barFill.visible = false;
    this.startPrompt.visible = true;
  }

  update(dtMs: number): void {
    if (!this.startPrompt.visible) return;
    this.promptTime += dtMs;
    this.startPrompt.alpha =
      0.55 + ((Math.sin(this.promptTime * 0.006) + 1) / 2) * 0.45;
  }
}
