import { Application, Container, Rectangle } from 'pixi.js';
import {
  GameState,
  LAYERS,
  PLAYER,
  REWARD,
  TUTORIAL,
  WORLD,
  type SpawnDef,
} from './config';
import { loadAllAssets } from './core/assets';
import { AudioManager } from './core/AudioManager';
import { Viewport } from './core/Viewport';
import { rectsIntersect } from './core/util';
import { Collectible } from './entities/Collectible';
import { Enemy } from './entities/Enemy';
import { FinishLine } from './entities/FinishLine';
import { Obstacle } from './entities/Obstacle';
import { Player } from './entities/Player';
import { Background } from './world/Background';
import { Spawner } from './world/Spawner';
import { EndScreen } from './ui/EndScreen';
import { HUD } from './ui/HUD';
import { LoadingScreen } from './ui/LoadingScreen';
import { Tutorial } from './ui/Tutorial';

/**
 * Top-level orchestrator: owns the PixiJS app, the scene graph, the finite
 * state machine and the fixed-timestep-ish update loop that drives the runner.
 */
export class Game {
  private app = new Application();
  private root = new Container();
  private world = new Container();
  private entities = new Container();
  private ui = new Container();

  private audio = new AudioManager();
  private viewport!: Viewport;

  private background = new Background();
  private player = new Player();
  private spawner = new Spawner();

  private hud = new HUD();
  private tutorial = new Tutorial();
  private endScreen = new EndScreen();
  private loading = new LoadingScreen();

  private enemies: Enemy[] = [];
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private finishLine: FinishLine | null = null;

  private state: GameState = GameState.Loading;
  private currentSpeed: number = WORLD.BASE_SPEED;
  private distanceTraveled = 0;
  private hp: number = PLAYER.MAX_HP;
  private balance: number = REWARD.START_BALANCE;

  private jumpingEnabled = false;
  private decelerating = false;
  private tutorialEnemy: Enemy | null = null;
  private tutorialTriggered = false;
  private winScheduled = false;

  /** QA flag (?nohit): the player takes no damage, for testing the win path. */
  private readonly noHit = new URLSearchParams(location.search).has('nohit');
  /** QA flag (?autojump): the game jumps hazards on its own, to demo the run. */
  private readonly autoJump = new URLSearchParams(location.search).has('autojump');

  async start(mount: HTMLElement): Promise<void> {
    await this.app.init({
      background: '#1c1030',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
    });
    mount.appendChild(this.app.canvas);

    // Scene graph: world (scrolling) below UI (fixed).
    this.world.sortableChildren = true;
    this.entities.sortableChildren = true;
    this.background.zIndex = LAYERS.FAR_BACKGROUND;
    this.entities.zIndex = LAYERS.GROUND;
    this.player.zIndex = LAYERS.PLAYER;
    this.world.addChild(this.background, this.entities, this.player);
    this.root.addChild(this.world, this.ui);
    this.app.stage.addChild(this.root);

    this.viewport = new Viewport(this.app, this.root);

    // Loading screen first.
    this.loading.build();
    this.ui.addChild(this.loading);

    this.setupInput();

    // Load assets, then build the rest.
    this.audio.load();
    await loadAllAssets((p) => this.loading.setProgress(p));

    this.background.build();
    this.player.init();

    this.hud.build();
    this.hud.onMuteToggle = () => this.audio.toggleMute();
    this.tutorial.build();
    this.endScreen.build();
    this.endScreen.onReplay = () => this.restart();
    this.ui.addChild(this.hud, this.tutorial, this.endScreen);
    this.hud.visible = false;

    this.player.idle(true);
    this.loading.showStartPrompt();
    this.state = GameState.Intro;

    // Now that every component exists, react to orientation / size changes.
    this.viewport.onResize = () => this.relayout();

    this.app.ticker.add((ticker) => this.update(ticker.deltaMS));
  }

  // ----- input -------------------------------------------------------------

  private setupInput(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen as Rectangle;
    // Only a tap on empty play area drives gameplay. Taps that land on an
    // interactive UI control (mute / CTA / replay) resolve to that control as
    // the event target, so they toggle/click without also firing a jump.
    this.app.stage.on('pointerdown', (e) => {
      if (e.target === this.app.stage) this.onTap();
    });
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.onTap();
      }
    });
  }

  private onTap(): void {
    switch (this.state) {
      case GameState.Intro:
        this.beginRun();
        break;
      case GameState.Paused:
        this.resumeFromTutorial();
        break;
      case GameState.Running:
        // Jump stays available right up until the finish tape is crossed
        // (deceleration). Gating on the finish merely *spawning* would disable
        // jumping too early — the finish spawns far off-screen (a big lead in
        // landscape), before the last cone even arrives.
        if (this.jumpingEnabled && this.player.isOnGround && !this.decelerating) {
          this.player.jump();
          this.audio.play('jump');
        }
        break;
      default:
        break;
    }
  }

  // ----- flow --------------------------------------------------------------

  private beginRun(): void {
    this.loading.visible = false;
    this.hud.visible = true;
    this.state = GameState.Running;
    this.player.run();
    this.audio.startMusic();
  }

  private triggerTutorialPause(): void {
    this.tutorialTriggered = true;
    this.state = GameState.Paused;
    this.background.pause();
    this.enemies.forEach((e) => e.stop());
    this.tutorial.show();
  }

  private resumeFromTutorial(): void {
    this.tutorial.hide();
    this.jumpingEnabled = true;
    this.background.resume();
    this.enemies.forEach((e) => e.play());
    this.state = GameState.Running;
    this.player.run();
    // Auto-jump the tutorial enemy so the lesson lands.
    this.player.jump();
    this.audio.play('jump');
  }

  private startDeceleration(): void {
    this.decelerating = true;
    this.finishLine?.breakTape();
  }

  private handleWin(): void {
    this.state = GameState.EndWin;
    this.player.idle(true);
    this.audio.stopMusic();
    this.audio.play('win');
    this.endScreen.show(true, this.balance);
  }

  private handleLose(): void {
    this.state = GameState.EndLose;
    this.audio.stopMusic();
    this.audio.play('lose');
    this.endScreen.show(false, this.balance);
  }

  private restart(): void {
    // Clear entities.
    [...this.enemies, ...this.obstacles, ...this.collectibles].forEach((e) =>
      e.destroy(),
    );
    this.finishLine?.destroy();
    this.enemies = [];
    this.obstacles = [];
    this.collectibles = [];
    this.finishLine = null;
    this.entities.removeChildren();

    // Reset state.
    this.spawner.reset();
    this.currentSpeed = WORLD.BASE_SPEED;
    this.distanceTraveled = 0;
    this.hp = PLAYER.MAX_HP;
    this.balance = REWARD.START_BALANCE;
    this.jumpingEnabled = false;
    this.decelerating = false;
    this.tutorialEnemy = null;
    this.tutorialTriggered = false;
    this.winScheduled = false;

    this.player.reset();
    this.hud.reset();
    this.background.reset();
    this.endScreen.hide();

    this.beginRun();
  }

  /**
   * Re-layout width-dependent elements after an orientation / size change.
   * The world height is fixed, so vertical gameplay is untouched — only
   * horizontal positions and the scenery need to adapt.
   */
  private relayout(): void {
    this.player.layout();
    this.background.rebuild();
    this.hud.layout();
    this.tutorial.layout();
    this.endScreen.layout();
    this.loading.layout();
  }

  // ----- update loop -------------------------------------------------------

  private update(dtMs: number): void {
    const dt = Math.min(dtMs, 50); // clamp large frame gaps

    this.player.update(dt);
    this.hud.update(dt);
    this.loading.update(dt);
    this.tutorial.update(dt);
    this.endScreen.update(dt);

    if (this.state !== GameState.Running) return;

    if (this.decelerating) {
      this.currentSpeed *= WORLD.DECELERATION_RATE;
      if (this.currentSpeed < WORLD.MIN_SPEED && !this.winScheduled) {
        this.currentSpeed = 0;
        this.winScheduled = true;
        this.player.idle(true);
        window.setTimeout(() => this.handleWin(), 500);
      }
    }

    this.background.update(dt, this.currentSpeed);
    this.distanceTraveled += (this.currentSpeed * dt) / 1000;

    this.checkSpawns();
    this.updateEntities(dt);
    if (this.autoJump) this.autoPlayJump();
    this.checkTutorialTrigger();

    if (
      this.finishLine &&
      !this.decelerating &&
      this.finishLine.tapeBreakX <= this.player.x
    ) {
      this.startDeceleration();
    }

    this.checkCollisions();
    this.cleanup();
  }

  private checkSpawns(): void {
    const leadDistance = Spawner.spawnX - this.player.x;
    for (const def of this.spawner.collect(this.distanceTraveled, leadDistance)) {
      this.spawnEntity(def);
    }
  }

  private spawnEntity(def: SpawnDef): void {
    const x = Spawner.spawnX;
    switch (def.type) {
      case 'enemy': {
        const e = new Enemy();
        e.init();
        e.x = x;
        e.zIndex = LAYERS.ENEMIES;
        this.enemies.push(e);
        this.entities.addChild(e);
        if (def.pauseForTutorial && !this.tutorialTriggered) {
          e.isTutorialEnemy = true;
          this.tutorialEnemy = e;
        }
        break;
      }
      case 'obstacle': {
        const o = new Obstacle();
        o.init(!!def.warningLabel);
        o.x = x;
        o.zIndex = LAYERS.OBSTACLES;
        this.obstacles.push(o);
        this.entities.addChild(o);
        break;
      }
      case 'collectible': {
        const c = new Collectible();
        const type = Math.random() < REWARD.DOLLAR_CHANCE ? 'dollar' : 'paypalCard';
        c.init(def.yOffset ?? 0, type);
        c.x = x;
        c.zIndex = LAYERS.COLLECTIBLES;
        this.collectibles.push(c);
        this.entities.addChild(c);
        break;
      }
      case 'finish': {
        const f = new FinishLine();
        f.init();
        f.x = x;
        f.zIndex = LAYERS.FINISH_LINE;
        this.finishLine = f;
        this.entities.addChild(f);
        break;
      }
    }
  }

  private updateEntities(dt: number): void {
    for (const e of this.enemies) e.update(dt, this.currentSpeed);
    for (const o of this.obstacles) o.update(dt, this.currentSpeed);
    for (const c of this.collectibles) c.update(dt, this.currentSpeed);
    this.finishLine?.update(dt, this.currentSpeed);
  }

  /** QA auto-player: jump when the nearest hazard enters a safe trigger band. */
  private autoPlayJump(): void {
    if (!this.jumpingEnabled || !this.player.isOnGround || this.decelerating) {
      return;
    }
    let nearest = Infinity;
    for (const e of this.enemies) {
      const d = e.x - this.player.x;
      if (d > 0 && d < nearest) nearest = d;
    }
    for (const o of this.obstacles) {
      const d = o.x - this.player.x;
      if (d > 0 && d < nearest) nearest = d;
    }
    if (nearest >= 70 && nearest <= 340) {
      this.player.jump();
      this.audio.play('jump');
    }
  }

  private checkTutorialTrigger(): void {
    if (!this.tutorialEnemy || this.tutorialTriggered) return;
    if (this.tutorialEnemy.x - this.player.x <= TUTORIAL.PAUSE_DISTANCE) {
      this.triggerTutorialPause();
    }
  }

  private checkCollisions(): void {
    const playerBox = this.player.getHitbox();

    // Collectibles.
    for (const c of this.collectibles) {
      if (!c.collected && c.isCollectedBy(playerBox)) {
        this.balance += c.value;
        this.hud.setBalance(this.balance);
        this.audio.play('coin');
        c.collect();
      }
    }

    if (this.player.isInvincible) return;

    // Enemies + obstacles: taking a hit costs HP.
    for (const e of this.enemies) {
      if (!e.passed && rectsIntersect(playerBox, e.getHitbox())) {
        e.passed = true;
        this.damage();
        return;
      }
    }
    for (const o of this.obstacles) {
      if (rectsIntersect(playerBox, o.getHitbox())) {
        this.damage();
        return;
      }
    }
  }

  private damage(): void {
    if (this.noHit) {
      this.player.hurt();
      return;
    }
    this.hp -= 1;
    this.hud.setHP(this.hp);
    this.player.hurt();
    if (this.hp <= 0) {
      this.audio.play('hurt');
      this.handleLose();
    } else {
      this.audio.play('hurt');
    }
  }

  private cleanup(): void {
    this.enemies = this.filterEntities(this.enemies, (e) => e.isOffScreen());
    this.obstacles = this.filterEntities(this.obstacles, (o) => o.isOffScreen());
    this.collectibles = this.filterEntities(this.collectibles, (c) => c.isDone());
  }

  private filterEntities<T extends { destroy: () => void }>(
    list: T[],
    isDead: (e: T) => boolean,
  ): T[] {
    const alive: T[] = [];
    for (const e of list) {
      if (isDead(e)) e.destroy();
      else alive.push(e);
    }
    return alive;
  }
}
