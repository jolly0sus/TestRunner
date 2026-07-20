import { AnimatedSprite, Container, Rectangle, type Texture } from 'pixi.js';
import { DESIGN, ENEMY, HITBOX, PLAYER } from '../config';
import { sheet } from '../core/assets';

/**
 * A rival runner coming the other way. Moves left at the world speed plus a
 * chase bonus, so it closes on the player faster than static obstacles. The
 * sprite is mirrored on X so it faces the player.
 */
export class Enemy extends Container {
  private sprite!: AnimatedSprite;
  isTutorialEnemy = false;
  passed = false;

  private readonly groundY = DESIGN.HEIGHT - PLAYER.GROUND_Y - 20;

  init(): void {
    const anims = sheet('enemyAtlas').animations as Record<string, Texture[]>;
    const frames = anims.default ?? Object.values(anims)[0];

    this.sprite = new AnimatedSprite(frames);
    this.sprite.anchor.set(0.5, 1);
    const s = PLAYER.SCALE * ENEMY.SCALE_FACTOR;
    this.sprite.scale.set(-s, s); // mirror horizontally
    this.sprite.animationSpeed = ENEMY.ANIMATION_SPEED;
    this.sprite.play();
    this.addChild(this.sprite);

    this.y = this.groundY;
  }

  play(): void {
    this.sprite.play();
  }

  stop(): void {
    this.sprite.stop();
  }

  update(dtMs: number, worldSpeed: number): void {
    this.x -= ((worldSpeed + ENEMY.CHASE_SPEED) * dtMs) / 1000;
  }

  getHitbox(): Rectangle {
    const b = this.sprite.getBounds();
    const w = b.width * HITBOX.ENEMY_SCALE.X;
    const h = b.height * HITBOX.ENEMY_SCALE.Y;
    const ox = (b.width - w) / 2 + b.width * HITBOX.ENEMY_OFFSET.X;
    const oy = b.height - h + b.height * HITBOX.ENEMY_OFFSET.Y;
    return new Rectangle(b.x + ox, b.y + oy, w, h);
  }

  isOffScreen(): boolean {
    return this.x < -200;
  }
}
