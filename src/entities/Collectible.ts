import { Container, Rectangle, Sprite } from 'pixi.js';
import { COLLECTIBLE, DESIGN, HITBOX, PLAYER, REWARD } from '../config';
import { tex } from '../core/assets';
import { randInt, rectCircleHit } from '../core/util';

export type CollectibleType = 'dollar' | 'paypalCard';

/**
 * A floating money pickup. `dollar` awards a fixed amount; `paypalCard`
 * awards a random amount in the configured range. Bobs and pulses while idle;
 * on pickup it pops and fades out.
 */
export class Collectible extends Container {
  private sprite!: Sprite;
  private pulseTime = 0;
  private baseScale: number = COLLECTIBLE.BASE_SCALE;

  type: CollectibleType = 'dollar';
  collected = false;
  private collectAnim = 0;

  init(yOffset: number, type: CollectibleType): void {
    this.type = type;

    this.sprite = new Sprite(tex(type === 'dollar' ? 'dollar' : 'paypalLogo'));
    this.sprite.anchor.set(0.5, 0.5);
    this.baseScale =
      COLLECTIBLE.BASE_SCALE *
      (type === 'dollar' ? 1 : COLLECTIBLE.CARD_SCALE_FACTOR);
    this.sprite.scale.set(this.baseScale);
    this.addChild(this.sprite);

    this.y = DESIGN.HEIGHT - PLAYER.GROUND_Y - COLLECTIBLE.LANE_HEIGHT - yOffset;
    this.pulseTime = Math.random() * Math.PI * 2;
  }

  /** Money value granted when picked up. */
  get value(): number {
    return this.type === 'dollar'
      ? REWARD.DOLLAR_VALUE
      : randInt(REWARD.PAYPAL_CARD_MIN, REWARD.PAYPAL_CARD_MAX);
  }

  update(dtMs: number, worldSpeed: number): void {
    if (this.collected) {
      // Pop up and fade out.
      this.collectAnim += dtMs;
      const t = Math.min(this.collectAnim / 250, 1);
      this.sprite.scale.set(this.baseScale * (1 + t * 0.8));
      this.alpha = 1 - t;
      this.y -= (200 * dtMs) / 1000;
      return;
    }

    this.x -= (worldSpeed * dtMs) / 1000;

    this.pulseTime += dtMs * COLLECTIBLE.PULSE_SPEED;
    const pulse =
      COLLECTIBLE.PULSE_MIN +
      (Math.sin(this.pulseTime) * 0.5 + 0.5) *
        (COLLECTIBLE.PULSE_MAX - COLLECTIBLE.PULSE_MIN);
    this.sprite.scale.set(this.baseScale * pulse);
    this.sprite.y = Math.sin(this.pulseTime * 2) * COLLECTIBLE.BOB_AMPLITUDE;
  }

  /** Circle-vs-rect test against the player's hitbox (world space). */
  isCollectedBy(playerBox: Rectangle): boolean {
    if (this.collected) return false;
    const pos = this.getGlobalPosition();
    const scale = this.worldTransform.a;
    return rectCircleHit(
      playerBox,
      pos.x,
      pos.y,
      HITBOX.COLLECTIBLE_RADIUS * scale,
    );
  }

  collect(): void {
    this.collected = true;
    this.collectAnim = 0;
  }

  isDone(): boolean {
    return (this.collected && this.alpha <= 0) || this.x < -200;
  }
}
