import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { DESIGN, STRINGS } from '../config';
import { tex } from '../core/assets';
import { MAX_WIDTH, stage } from '../core/stage';

/**
 * Full-screen tutorial overlay. Dims the scene, pulses a pointing hand and a
 * "TAP TO JUMP!" prompt. Purely visual — the Game drives pause/resume.
 */
export class Tutorial extends Container {
  private hand!: Sprite;
  private prompt!: Text;
  private time = 0;
  private readonly handBaseY = DESIGN.HEIGHT * 0.52;

  build(): void {
    // Cover well beyond the visible stage so letterbox bars are dimmed too.
    const dim = new Graphics()
      .rect(-MAX_WIDTH, 0, MAX_WIDTH * 3, DESIGN.HEIGHT)
      .fill({ color: 0x000000, alpha: 0.45 });
    this.addChild(dim);

    this.prompt = new Text({
      text: STRINGS.tutorial,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 72,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x2b1a45, width: 10, join: 'round' },
        align: 'center',
      },
    });
    this.prompt.anchor.set(0.5);
    this.prompt.y = DESIGN.HEIGHT * 0.4;
    this.addChild(this.prompt);

    this.hand = new Sprite(tex('hand'));
    this.hand.anchor.set(0.35, 0.15);
    this.hand.scale.set(0.28);
    this.hand.y = this.handBaseY;
    this.addChild(this.hand);

    this.layout();
    this.visible = false;
  }

  layout(): void {
    this.prompt.x = stage.width / 2;
    this.hand.x = stage.width / 2;
  }

  show(): void {
    this.visible = true;
    this.time = 0;
  }

  hide(): void {
    this.visible = false;
  }

  update(dtMs: number): void {
    if (!this.visible) return;
    this.time += dtMs;
    // Tap gesture: hand dips down and back on a loop.
    const t = (Math.sin(this.time * 0.006) + 1) / 2;
    this.hand.y = this.handBaseY + t * 40;
    this.hand.scale.set(0.28 - t * 0.03);
    this.prompt.alpha = 0.7 + t * 0.3;
  }
}
