import { AnimatedSprite, Container, Rectangle, type Texture } from 'pixi.js';
import { DESIGN, HITBOX, PLAYER, PlayerAnim } from '../config';
import { sheet } from '../core/assets';
import { stage } from '../core/stage';

const TINT_NORMAL = 0xffffff;
const TINT_HIT = 0xff5f44;

/**
 * The running woman. Fixed horizontally; the world scrolls past her.
 * Jumps follow a time-based sine arc (not gravity) so the height and airtime
 * are perfectly deterministic — matching the reference feel.
 */
export class Player extends Container {
  private sprite!: AnimatedSprite;
  private anims!: Record<string, Texture[]>;
  private current: PlayerAnim | null = null;

  private readonly groundY = DESIGN.HEIGHT - PLAYER.GROUND_Y;

  private jumping = false;
  private jumpProgress = 0;
  private jumpStartY = 0;

  private invincible = false;
  private invincibilityTimer = 0;
  private blinkTimer = 0;

  init(): void {
    this.anims = sheet('playerAtlas').animations as Record<string, Texture[]>;

    this.sprite = new AnimatedSprite(this.anims[PlayerAnim.Idle]);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(PLAYER.SCALE);
    this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED;
    this.sprite.play();
    this.addChild(this.sprite);

    this.x = stage.width * PLAYER.X_POSITION;
    this.y = this.groundY;
    this.current = PlayerAnim.Idle;
  }

  /** Keep the player anchored at its fractional x when the width changes. */
  layout(): void {
    this.x = stage.width * PLAYER.X_POSITION;
  }

  private playAnimation(name: PlayerAnim): void {
    if (this.current === name) return;
    const frames = this.anims[name];
    if (!frames) return;

    this.current = name;
    this.sprite.textures = frames;
    // Any leftover hurt/jump completion callback is no longer relevant.
    this.sprite.onComplete = undefined;

    switch (name) {
      case PlayerAnim.Jump:
        this.sprite.loop = false;
        this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED * 1.5;
        break;
      case PlayerAnim.Hurt:
        this.sprite.loop = false;
        this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED * 2;
        break;
      default:
        this.sprite.loop = true;
        this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED;
    }
    this.sprite.gotoAndPlay(0);
  }

  jump(): void {
    if (this.jumping) return;
    this.jumping = true;
    this.jumpStartY = this.y;
    this.jumpProgress = 0;
    this.playAnimation(PlayerAnim.Jump);
  }

  run(): void {
    if (!this.jumping && this.current !== PlayerAnim.Hurt) {
      this.playAnimation(PlayerAnim.Run);
    }
  }

  idle(force = false): void {
    if (force || (!this.jumping && this.current !== PlayerAnim.Hurt)) {
      this.playAnimation(PlayerAnim.Idle);
    }
  }

  /** Take a hit: play the hurt clip and become briefly invincible. */
  hurt(): void {
    if (this.invincible) return;

    this.playAnimation(PlayerAnim.Hurt);
    this.invincible = true;
    this.invincibilityTimer = PLAYER.INVINCIBILITY_TIME;

    // When the (non-looping) hurt clip finishes, resume running — but only if
    // grounded. If the hit happened mid-jump, the landing logic in update()
    // restores the run cycle instead (so we never freeze on a hurt frame).
    this.sprite.onComplete = () => {
      this.sprite.onComplete = undefined;
      if (!this.jumping) this.playAnimation(PlayerAnim.Run);
    };
  }

  update(dtMs: number): void {
    if (this.jumping) {
      this.jumpProgress += dtMs / PLAYER.JUMP_DURATION;
      if (this.jumpProgress >= 1) {
        this.jumping = false;
        this.y = this.groundY;
        this.jumpProgress = 0;
        // Back on the ground: resume running. Handles both a normal landing
        // (current === Jump) and the case where a mid-air hit left us on the
        // hurt clip (current === Hurt) — otherwise the run cycle never resumes.
        if (this.current === PlayerAnim.Jump || this.current === PlayerAnim.Hurt) {
          this.playAnimation(PlayerAnim.Run);
        }
      } else {
        const arc = Math.sin(this.jumpProgress * Math.PI) * PLAYER.JUMP_HEIGHT;
        this.y = this.jumpStartY - arc;
      }
    }

    if (this.invincible) {
      this.invincibilityTimer -= dtMs;
      this.blinkTimer += dtMs;
      if (this.blinkTimer >= 100) {
        this.blinkTimer = 0;
        this.sprite.tint =
          this.sprite.tint === TINT_NORMAL ? TINT_HIT : TINT_NORMAL;
      }
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
        this.sprite.tint = TINT_NORMAL;
      }
    }
  }

  /** A tightened AABB (in world space) used for collision tests. */
  getHitbox(): Rectangle {
    const b = this.sprite.getBounds();
    const w = b.width * HITBOX.PLAYER_SCALE.X;
    const h = b.height * HITBOX.PLAYER_SCALE.Y;
    const ox = (b.width - w) / 2 + b.width * HITBOX.PLAYER_OFFSET.X;
    const oy = b.height - h + b.height * HITBOX.PLAYER_OFFSET.Y;
    return new Rectangle(b.x + ox, b.y + oy, w, h);
  }

  get isOnGround(): boolean {
    return !this.jumping;
  }

  get isInvincible(): boolean {
    return this.invincible;
  }

  /** Reset to a fresh run (used on restart). */
  reset(): void {
    this.jumping = false;
    this.jumpProgress = 0;
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.sprite.tint = TINT_NORMAL;
    this.y = this.groundY;
    this.idle(true);
  }
}
