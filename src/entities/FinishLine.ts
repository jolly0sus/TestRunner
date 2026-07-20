import { Container, Graphics, Sprite } from 'pixi.js';
import { DESIGN, PLAYER } from '../config';
import { tex } from '../core/assets';
import { stage } from '../core/stage';

const STRIPE_HEIGHT = 46;

// Two metal cylindrical posts standing right at the crossing point (local
// x = 0 of this container): one at the near (closer-to-viewer) corner, one
// at the far corner, so the runner passes both posts at the same instant.
const POST_HEIGHT = 130;
const POST_RADIUS = 10;

const METAL_BASE = 0xc9ced6;
const METAL_SHADOW = 0x8f96a1;
const METAL_DARK = 0x767d89;
const METAL_HIGHLIGHT = 0xffffff;

// Red tape strung between the two posts, near their tops.
const TAPE_COLOR = 0xe4362b;
const TAPE_EDGE = 0xa62319;
const TAPE_THICKNESS = 7;
const TAPE_DROP_ANGLE = 2.35; // radians each half swings open on break

/**
 * Finish line: two cylindrical metal posts (near + far corner, same x) with
 * a red tape strung between them near the top. The runner crosses at the
 * posts' x — that moment snaps the tape (it swings open, pinned at each
 * post) — and from there a checkered stripe is laid down on the ground,
 * growing under her feet until the run fully stops.
 */
export class FinishLine extends Container {
  private readonly groundY = DESIGN.HEIGHT - PLAYER.GROUND_Y;
  private readonly stripeY = this.groundY - 55;
  private readonly half = STRIPE_HEIGHT / 2;
  private readonly nearY = this.stripeY + this.half;
  private readonly farY = this.stripeY - this.half;
  private readonly tapeAttachOffset = POST_HEIGHT - 18;

  private stripe!: Sprite;
  private tapeNear!: Graphics;
  private tapeFar!: Graphics;
  private broken = false;
  private breakAnim = 0;

  init(): void {
    // Checkered ground stripe — hidden until the tape breaks, then grows
    // from the posts (local x = 0) out to wherever the runner currently is.
    this.stripe = new Sprite(tex('finish'));
    this.stripe.anchor.set(0, 0.5);
    this.stripe.x = 0;
    this.stripe.y = this.stripeY;
    this.stripe.height = STRIPE_HEIGHT;
    this.stripe.width = 0;
    this.stripe.visible = false;
    this.addChild(this.stripe);

    this.addChild(this.makeCylinderPost(this.nearY));
    this.addChild(this.makeCylinderPost(this.farY));

    const nearAttachY = this.nearY - this.tapeAttachOffset;
    const farAttachY = this.farY - this.tapeAttachOffset;
    const midY = (nearAttachY + farAttachY) / 2;

    // Pinned at the near post (local origin = attach point); free end
    // reaches up to the midpoint until it snaps.
    this.tapeNear = new Graphics()
      .roundRect(
        -TAPE_THICKNESS / 2,
        midY - nearAttachY,
        TAPE_THICKNESS,
        nearAttachY - midY,
        TAPE_THICKNESS / 2,
      )
      .fill(TAPE_COLOR)
      .stroke({ width: 1.5, color: TAPE_EDGE });
    this.tapeNear.x = 0;
    this.tapeNear.y = nearAttachY;
    this.addChild(this.tapeNear);

    // Pinned at the far post; free end reaches down to the midpoint.
    this.tapeFar = new Graphics()
      .roundRect(-TAPE_THICKNESS / 2, 0, TAPE_THICKNESS, midY - farAttachY, TAPE_THICKNESS / 2)
      .fill(TAPE_COLOR)
      .stroke({ width: 1.5, color: TAPE_EDGE });
    this.tapeFar.x = 0;
    this.tapeFar.y = farAttachY;
    this.addChild(this.tapeFar);
  }

  /** A chrome-look cylindrical post: rounded body + shaded bands + elliptical
   * caps, so it reads as a round metal tube rather than a flat rectangle. */
  private makeCylinderPost(y: number): Container {
    const post = new Container();
    const r = POST_RADIUS;

    const shadow = new Graphics()
      .ellipse(0, 0, r + 4, 4)
      .fill({ color: 0x000000, alpha: 0.22 });

    const body = new Graphics()
      .roundRect(-r, -POST_HEIGHT, r * 2, POST_HEIGHT, r)
      .fill(METAL_BASE);
    const darkBand = new Graphics()
      .roundRect(r * 0.35, -POST_HEIGHT, r * 0.65, POST_HEIGHT, r * 0.5)
      .fill({ color: METAL_DARK, alpha: 0.8 });
    const shadeBand = new Graphics()
      .roundRect(-r, -POST_HEIGHT, r * 0.5, POST_HEIGHT, r * 0.5)
      .fill({ color: METAL_SHADOW, alpha: 0.45 });
    const highlight = new Graphics()
      .roundRect(-r * 0.25, -POST_HEIGHT + 6, r * 0.4, POST_HEIGHT - 12, r * 0.2)
      .fill({ color: METAL_HIGHLIGHT, alpha: 0.75 });
    const outline = new Graphics()
      .roundRect(-r, -POST_HEIGHT, r * 2, POST_HEIGHT, r)
      .stroke({ width: 2, color: METAL_SHADOW, alpha: 0.9 });

    const capTop = new Graphics()
      .ellipse(0, -POST_HEIGHT, r + 1, r * 0.55)
      .fill(0xe4e8ee)
      .stroke({ width: 1.5, color: METAL_SHADOW });
    const capShine = new Graphics()
      .ellipse(-r * 0.25, -POST_HEIGHT - r * 0.1, r * 0.4, r * 0.2)
      .fill({ color: METAL_HIGHLIGHT, alpha: 0.85 });

    post.addChild(shadow, body, shadeBand, darkBand, highlight, outline, capTop, capShine);
    post.x = 0;
    post.y = y;
    return post;
  }

  /** World x of the posts / tape — the run begins decelerating once the
   * player reaches this point. */
  get tapeBreakX(): number {
    return this.x;
  }

  /** Snap the tape: both halves swing open from their post pins. */
  breakTape(): void {
    this.broken = true;
  }

  update(dtMs: number, worldSpeed: number): void {
    this.x -= (worldSpeed * dtMs) / 1000;

    if (this.broken && this.breakAnim < 1) {
      this.breakAnim = Math.min(this.breakAnim + dtMs / 350, 1);
      const ease = 1 - (1 - this.breakAnim) * (1 - this.breakAnim);
      const angle = TAPE_DROP_ANGLE * ease;
      this.tapeNear.rotation = angle;
      this.tapeFar.rotation = -angle;
    }

    // Grow the checkered stripe from the posts out to the runner's current
    // position (converted into this container's local space), so it reads
    // as the ground she has already covered since crossing the tape.
    const localPlayerX = stage.width * PLAYER.X_POSITION - this.x;
    if (localPlayerX > 0) {
      this.stripe.visible = true;
      this.stripe.width = localPlayerX;
    }
  }
}
