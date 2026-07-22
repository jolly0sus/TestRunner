import { Container, Graphics } from 'pixi.js';
import { DESIGN, PLAYER } from '../config';

const POST_WIDTH = 16;
const POST_HEIGHT = 130;
const POST_COLOR = 0xcbbfa6;
const POST_SHADE = 0x9c8f74;
const POST_CAP_COLOR = 0x4a4238;

const TAPE_COLOR = 0xf4c430;
const TAPE_EDGE = 0xb8860b;
const TAPE_THICKNESS = 16;

const CHECKER_SIZE = 38;
/** How far right + up the far post sits relative to the near one, giving the
 * gate its diagonal tilt (matching the reference's angled tape + stripe). */
const DIAGONAL_OFFSET_X = 100;
const DIAGONAL_RISE = 130;

/**
 * Finish line: a checkered stripe laid across the lane as a sheared
 * parallelogram — its top and bottom edges stay horizontal, while its left
 * (and right) edge runs from the near post's base up to the far post's base,
 * matching the reference's "flag seen face-on" look. A gold rope is strung
 * between the two post tops; crossing snaps it.
 */
export class FinishLine extends Container {
  private readonly groundY = DESIGN.HEIGHT - PLAYER.GROUND_Y;
  private readonly nearY = this.groundY - 20;
  private readonly farY = this.nearY - DIAGONAL_RISE;

  private stripe!: Graphics;
  private tape!: Graphics;
  private broken = false;
  private breakAnim = 0;

  init(): void {
    const nearPostTop = this.nearY - POST_HEIGHT;
    const farPostTop = this.farY - POST_HEIGHT * 0.8;

    // Checkered ground stripe, painted on the road from the start (matching
    // the reference: it's there before the tape is even crossed) — a sheared
    // parallelogram whose bottom-left corner sits at the near post's base and
    // whose top-left corner sits at the far post's base, stretched a bit
    // further right past the gate rather than stopping right at it.
    const stripeLength = DIAGONAL_OFFSET_X + 260;
    this.stripe = new Graphics();
    this.drawChecker(this.stripe, stripeLength);
    this.stripe.y = this.nearY;
    this.addChild(this.stripe);

    this.addChild(this.makePost(0, this.nearY, POST_HEIGHT));
    this.addChild(this.makePost(DIAGONAL_OFFSET_X, this.farY, POST_HEIGHT * 0.8));

    // Gold tape strung between the two post tops.
    this.tape = new Graphics()
      .moveTo(0, nearPostTop)
      .lineTo(DIAGONAL_OFFSET_X, farPostTop)
      .stroke({ width: TAPE_THICKNESS, color: TAPE_COLOR, cap: 'round' })
      .moveTo(0, nearPostTop)
      .lineTo(DIAGONAL_OFFSET_X, farPostTop)
      .stroke({ width: 3, color: TAPE_EDGE, alpha: 0.6, cap: 'round' });
    this.addChild(this.tape);
  }

  /**
   * Fill a Graphics with an alternating black/white checkerboard sheared into
   * a parallelogram: local (0, 0) is the bottom-left corner (the near post's
   * base) and local (DIAGONAL_OFFSET_X, -DIAGONAL_RISE) is the top-left
   * corner (the far post's base). Each row is offset horizontally so the top
   * and bottom edges stay perfectly horizontal while the left/right edges
   * follow the near→far post line.
   */
  private drawChecker(g: Graphics, length: number): void {
    const rows = Math.max(1, Math.round(DIAGONAL_RISE / CHECKER_SIZE));
    const rowHeight = DIAGONAL_RISE / rows;
    const cols = Math.ceil(length / CHECKER_SIZE) + 1;
    for (let r = 0; r < rows; r++) {
      const yBottom = -r * rowHeight;
      const yTop = -(r + 1) * rowHeight;
      const shearBottom = (DIAGONAL_OFFSET_X * r) / rows;
      const shearTop = (DIAGONAL_OFFSET_X * (r + 1)) / rows;
      for (let c = 0; c < cols; c++) {
        const dark = (r + c) % 2 === 0;
        g.poly([
          shearBottom + c * CHECKER_SIZE,
          yBottom,
          shearBottom + (c + 1) * CHECKER_SIZE,
          yBottom,
          shearTop + (c + 1) * CHECKER_SIZE,
          yTop,
          shearTop + c * CHECKER_SIZE,
          yTop,
        ]).fill(dark ? 0x1a1a1a : 0xf5f5f5);
      }
    }
  }

  private makePost(x: number, groundY: number, height: number): Container {
    const post = new Container();
    const shadow = new Graphics()
      .ellipse(0, 0, POST_WIDTH * 0.9, POST_WIDTH * 0.35)
      .fill({ color: 0x000000, alpha: 0.2 });
    const body = new Graphics()
      .roundRect(-POST_WIDTH / 2, -height, POST_WIDTH, height, POST_WIDTH / 3)
      .fill(POST_COLOR)
      .stroke({ width: 2, color: POST_SHADE, alpha: 0.6 });
    const cap = new Graphics()
      .roundRect(-POST_WIDTH / 2 - 2, -height - 10, POST_WIDTH + 4, 12, 4)
      .fill(POST_CAP_COLOR);
    post.addChild(shadow, body, cap);
    post.x = x;
    post.y = groundY;
    return post;
  }

  /** Snap the tape and reveal the checkered stripe underfoot. */
  breakTape(): void {
    this.broken = true;
  }

  update(dtMs: number, worldSpeed: number): void {
    this.x -= (worldSpeed * dtMs) / 1000;

    if (this.broken && this.breakAnim < 1) {
      this.breakAnim = Math.min(this.breakAnim + dtMs / 300, 1);
      const ease = 1 - (1 - this.breakAnim) * (1 - this.breakAnim);
      this.tape.alpha = 1 - ease;
      this.tape.y = ease * 40;
    }
  }
}
