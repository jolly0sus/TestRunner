import {
  Container,
  Graphics,
  Sprite,
  Text,
  type Texture,
  type ContainerChild,
} from 'pixi.js';
import { CTA_URL, DESIGN, STRINGS } from '../config';
import { tex, type AssetKey } from '../core/assets';
import { MAX_WIDTH, stage } from '../core/stage';
import { randRange } from '../core/util';

interface Confetto {
  sprite: Sprite;
  vx: number;
  vy: number;
  vr: number;
}

const CONFETTI_KEYS: AssetKey[] = [
  'confetti1',
  'confetti2',
  'confetti3',
  'confetti4',
  'confetti5',
  'confetti6',
];

const CONTENT_WIDTH = 600;

/** Win / lose end card with confetti, reward total and a pulsing CTA. */
export class EndScreen extends Container {
  private confetti: Confetto[] = [];
  private confettiLayer!: Container;

  private title!: Text;
  private subtitle!: Text;
  private disclaimer!: Text;
  private rewardCard!: Container;
  private rewardText!: Text;
  private failBadge!: Sprite;
  private cta!: Container;
  private replay!: Text;
  private ctaPulse = 0;

  /** Elements that stay horizontally centered on the stage. */
  private centered: ContainerChild[] = [];

  private isWin = false;

  onReplay: (() => void) | null = null;

  build(): void {
    // Dim overlay covering the whole viewport (incl. any letterbox bars).
    const overlay = new Graphics()
      .rect(-MAX_WIDTH, 0, MAX_WIDTH * 3, DESIGN.HEIGHT)
      .fill({ color: 0x2b1a45, alpha: 0.82 });
    this.addChild(overlay);

    this.confettiLayer = new Container();
    this.addChild(this.confettiLayer);

    this.title = new Text({
      text: STRINGS.win.title,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 96,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x1c1030, width: 12, join: 'round' },
        align: 'center',
      },
    });
    this.title.anchor.set(0.5);
    this.title.y = DESIGN.HEIGHT * 0.2;
    this.addChild(this.title);

    this.failBadge = new Sprite(tex('fail'));
    this.failBadge.anchor.set(0.5);
    // Midway between the "Try again!" title (0.2H) and the CTA button (0.63H).
    this.failBadge.y = DESIGN.HEIGHT * 0.415;
    this.failBadge.scale.set(1.1);
    this.failBadge.visible = false;
    this.addChild(this.failBadge);

    this.buildRewardCard();
    this.buildCTA();

    this.subtitle = new Text({
      text: STRINGS.win.subtitle,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 34,
        fill: 0xf3e9ff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CONTENT_WIDTH,
      },
    });
    this.subtitle.anchor.set(0.5);
    this.subtitle.y = DESIGN.HEIGHT * 0.78;
    this.addChild(this.subtitle);

    this.disclaimer = new Text({
      text: STRINGS.disclaimer,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xbca9d6,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CONTENT_WIDTH,
      },
    });
    this.disclaimer.anchor.set(0.5, 1);
    this.disclaimer.y = DESIGN.HEIGHT - 24;
    this.addChild(this.disclaimer);

    this.replay = new Text({
      text: '↻  Replay',
      style: { fontFamily: 'GameFont, Arial', fontSize: 34, fill: 0xffffff },
    });
    this.replay.anchor.set(0.5);
    this.replay.y = DESIGN.HEIGHT * 0.85;
    this.replay.eventMode = 'static';
    this.replay.cursor = 'pointer';
    this.replay.on('pointertap', (e) => {
      e.stopPropagation();
      this.onReplay?.();
    });
    this.addChild(this.replay);

    this.centered = [
      this.title,
      this.failBadge,
      this.rewardCard,
      this.cta,
      this.subtitle,
      this.disclaimer,
      this.replay,
    ];
    this.layout();
    this.visible = false;
  }

  layout(): void {
    const cx = stage.width / 2;
    for (const el of this.centered) el.x = cx;
  }

  private buildRewardCard(): void {
    const card = new Container();
    const paypalCard = new Sprite(tex('paypalCard'));
    paypalCard.anchor.set(0.5);
    paypalCard.scale.set(0.62);
    card.addChild(paypalCard);

    this.rewardText = new Text({
      text: '$0',
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 72,
        fontWeight: '900',
        fill: 0x14a800,
        stroke: { color: 0xffffff, width: 8, join: 'round' },
      },
    });
    this.rewardText.anchor.set(0.5);
    // To the right of the PayPal wordmark, on the same line.
    this.rewardText.x = 128;
    this.rewardText.y = 26;
    card.addChild(this.rewardText);

    card.y = DESIGN.HEIGHT * 0.42;
    this.rewardCard = card;
    this.addChild(card);
  }

  private buildCTA(): void {
    const cta = new Container();
    const w = 460;
    const h = 116;
    const bg = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, h / 2)
      .fill(0x16b34a)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.85 });
    const label = new Text({
      text: STRINGS.win.cta,
      style: {
        fontFamily: 'GameFont, Arial',
        fontSize: 44,
        fontWeight: '900',
        fill: 0xffffff,
      },
    });
    label.anchor.set(0.5);
    cta.addChild(bg, label);
    cta.y = DESIGN.HEIGHT * 0.63;
    cta.eventMode = 'static';
    cta.cursor = 'pointer';
    cta.on('pointertap', (e) => {
      e.stopPropagation();
      window.open(CTA_URL, '_blank', 'noopener');
    });
    this.cta = cta;
    this.addChild(cta);
  }

  show(win: boolean, balance: number): void {
    this.isWin = win;
    this.visible = true;

    this.title.text = win ? STRINGS.win.title : STRINGS.lose.title;
    this.subtitle.text = win ? STRINGS.win.subtitle : STRINGS.lose.subtitle;
    this.failBadge.visible = !win;
    this.rewardCard.visible = win;
    this.rewardText.text = '$' + balance.toLocaleString('en-US');

    this.confettiLayer.visible = win;
    if (win) this.spawnConfetti();
  }

  private spawnConfetti(): void {
    this.confettiLayer.removeChildren();
    this.confetti = [];
    for (let i = 0; i < 90; i++) {
      const t = tex(
        CONFETTI_KEYS[Math.floor(Math.random() * CONFETTI_KEYS.length)],
      ) as Texture;
      const s = new Sprite(t);
      s.anchor.set(0.5);
      s.scale.set(randRange(1.2, 2.6));
      s.x = randRange(0, stage.width);
      s.y = randRange(-DESIGN.HEIGHT, 0);
      s.rotation = randRange(0, Math.PI * 2);
      this.confettiLayer.addChild(s);
      this.confetti.push({
        sprite: s,
        vx: randRange(-40, 40),
        vy: randRange(120, 300),
        vr: randRange(-4, 4),
      });
    }
  }

  update(dtMs: number): void {
    if (!this.visible) return;
    const dt = dtMs / 1000;

    if (this.isWin) {
      for (const c of this.confetti) {
        c.sprite.x += c.vx * dt;
        c.sprite.y += c.vy * dt;
        c.sprite.rotation += c.vr * dt;
        if (c.sprite.y > DESIGN.HEIGHT + 20) {
          c.sprite.y = -20;
          c.sprite.x = randRange(0, stage.width);
        }
      }
    }

    // Pulse the CTA.
    this.ctaPulse += dtMs * 0.005;
    const pulse = 1 + Math.sin(this.ctaPulse) * 0.05;
    this.cta.scale.set(pulse);
  }

  hide(): void {
    this.visible = false;
  }
}
