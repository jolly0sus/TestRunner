import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { DESIGN, HITBOX, OBSTACLE, PLAYER } from '../config';
import { tex } from '../core/assets';

/**
 * A static ground hazard (traffic cone) with a pulsing red glow behind it to
 * draw the eye. Scrolls left at the world speed; the player must jump it.
 */
export class Obstacle extends Container {
  private glow!: Sprite;
  private cone!: Sprite;
  private warning: Container | null = null;
  private pulseTime = 0;

  private readonly groundY =
    DESIGN.HEIGHT - PLAYER.GROUND_Y - OBSTACLE.GROUND_LIFT;

  init(showWarning = false): void {
    this.glow = new Sprite(tex('coneGlow'));
    this.glow.anchor.set(0.5, 1);
    this.glow.scale.set(OBSTACLE.GLOW_SCALE);
    this.glow.alpha = 0.8;
    this.addChild(this.glow);

    this.cone = new Sprite(tex('cone'));
    this.cone.anchor.set(0.5, 1);
    this.cone.scale.set(OBSTACLE.BASE_SCALE);
    this.addChild(this.cone);

    if (showWarning) this.addWarning();

    this.y = this.groundY;
    this.pulseTime = Math.random() * Math.PI * 2;
  }

  /** A "!" bubble floating above the cone, drawing attention to the jump. */
  private addWarning(): void {
    const bubble = new Container();
    const circle = new Graphics().circle(0, 0, 34).fill(0xffcc00).stroke({
      width: 5,
      color: 0xffffff,
    });
    const mark = new Text({
      text: '!',
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 46,
        fontWeight: '900',
        fill: 0x8a2b00,
      },
    });
    mark.anchor.set(0.5);
    bubble.addChild(circle, mark);
    bubble.y = -260;
    this.warning = bubble;
    this.addChild(bubble);
  }

  update(dtMs: number, worldSpeed: number): void {
    this.x -= (worldSpeed * dtMs) / 1000;

    this.pulseTime += dtMs * OBSTACLE.PULSE_SPEED;
    const t = (Math.sin(this.pulseTime) + 1) / 2;
    const s =
      OBSTACLE.GLOW_SCALE *
      (OBSTACLE.PULSE_MIN + t * (OBSTACLE.PULSE_MAX - OBSTACLE.PULSE_MIN));
    this.glow.scale.set(s);

    if (this.warning) this.warning.y = -260 + Math.sin(this.pulseTime * 2) * 10;
  }

  getHitbox(): Rectangle {
    // Only the cone itself is solid — exclude the pulsing glow halo and the
    // floating "!" warning bubble, which would otherwise inflate the box up
    // into the jump arc and make warning cones impossible to clear.
    const b = this.cone.getBounds();
    const shrink = HITBOX.OBSTACLE_SHRINK;
    return new Rectangle(
      b.x + shrink,
      b.y + shrink,
      b.width - shrink * 2,
      b.height - shrink * 2,
    );
  }

  isOffScreen(): boolean {
    return this.x < -200;
  }
}
