/**
 * Central game configuration.
 *
 * The reference runner is authored around a 720x1280 portrait design
 * resolution. Everything below (positions, speeds, spawn distances) is
 * expressed in those design units; the renderer is scaled to fit the
 * viewport at runtime (see `Viewport`).
 */

export const DESIGN = {
  WIDTH: 720,
  HEIGHT: 1280,
} as const;

/** Global stacking order for the scene graph. */
export const LAYERS = {
  FAR_BACKGROUND: 0,
  MID_BACKGROUND: 5,
  NEAR_BACKGROUND: 8,
  GROUND: 10,
  COLLECTIBLES: 20,
  OBSTACLES: 30,
  FINISH_LINE: 35,
  ENEMIES: 40,
  WARNING_LABEL: 50,
  PLAYER: 70,
  OVERLAY: 85,
  CONFETTI: 90,
  HUD: 100,
} as const;

/** Player character (the running woman). */
export const PLAYER = {
  /** Horizontal position as a fraction of the design width. */
  X_POSITION: 0.18,
  /** Distance of the ground line from the bottom edge. */
  GROUND_Y: 280,
  /** Peak height of a jump arc. */
  JUMP_HEIGHT: 300,
  /** Duration of a full jump arc, in milliseconds. */
  JUMP_DURATION: 800,
  /** Invincibility window after taking a hit, in milliseconds. */
  INVINCIBILITY_TIME: 500,
  SCALE: 0.54,
  ANIMATION_SPEED: 0.15,
  MAX_HP: 3,
} as const;

/** World scrolling. */
export const WORLD = {
  /** Base scroll speed in design px / second. */
  BASE_SPEED: 600,
  /** Multiplier applied to the ground/near props for scroll speed. */
  GROUND_PARALLAX: 1,
  /** Slowest far background layer relative to ground. */
  BG_PARALLAX: 0.12,
  /** How fast the world sheds speed once the course ends. */
  DECELERATION_RATE: 0.965,
  /** Below this speed the world is considered stopped. */
  MIN_SPEED: 40,
} as const;

/** Extra chase speed added to enemies so they close in faster than props. */
export const ENEMY = {
  CHASE_SPEED: 300,
  SCALE_FACTOR: 1.3,
  ANIMATION_SPEED: 0.2,
} as const;

/** Traffic-cone obstacle (static, with a pulsing red glow). */
export const OBSTACLE = {
  BASE_SCALE: 1.0,
  GLOW_SCALE: 1.2,
  PULSE_SPEED: 0.003,
  PULSE_MIN: 0.9,
  PULSE_MAX: 1.1,
  /** Lifted slightly off the exact ground line, like the player/enemy. */
  GROUND_LIFT: 20,
} as const;

/** Floating money collectibles (dollar bills / PayPal marks). */
export const COLLECTIBLE = {
  BASE_SCALE: 0.15,
  CARD_SCALE_FACTOR: 1.2,
  /** Height of the collectible lane above the ground line. */
  LANE_HEIGHT: 200,
  PULSE_SPEED: 0.0005,
  PULSE_MIN: 0.95,
  PULSE_MAX: 1.05,
  BOB_AMPLITUDE: 5,
} as const;

/** Hitbox tuning — fraction of the sprite bounds used for collisions. */
export const HITBOX = {
  PLAYER_SCALE: { X: 0.25, Y: 0.7 },
  PLAYER_OFFSET: { X: 0, Y: -0.15 },
  ENEMY_SCALE: { X: 0.3, Y: 0.5 },
  ENEMY_OFFSET: { X: 0, Y: 0.2 },
  OBSTACLE_SHRINK: 10,
  COLLECTIBLE_RADIUS: 60,
} as const;

/** Money awarded by each collectible type. */
export const REWARD = {
  DOLLAR_VALUE: 20,
  PAYPAL_CARD_MIN: 5,
  PAYPAL_CARD_MAX: 50,
  START_BALANCE: 0,
  /** Probability a collectible is a plain dollar vs. a PayPal card. */
  DOLLAR_CHANCE: 0.6,
} as const;

/** Tutorial pacing. */
export const TUTORIAL = {
  /** When the first enemy gets this close (design px) the game pauses. */
  PAUSE_DISTANCE: 340,
} as const;

/** One design-width of travel equals one "distance" unit in the pattern. */
export const DISTANCE_UNIT = DESIGN.WIDTH;

/** Total course length — the run decelerates to a stop once travel reaches this. */
export const COURSE_LENGTH = 19 * DISTANCE_UNIT;

/** Horizontal spacing between repeating near-props (lamps). */
export const LAMP_SPACING = 900;
export const SCREEN_BUFFER = 400;

export type SpawnType = 'collectible' | 'obstacle' | 'enemy' | 'finish';

export interface SpawnDef {
  type: SpawnType;
  /** Position along the course, in distance units. */
  distance: number;
  /** Vertical offset above the ground for floating collectibles. */
  yOffset?: number;
  /** Show a "!" warning before this entity arrives. */
  warningLabel?: boolean;
  /** First enemy pauses the world for the jump tutorial. */
  pauseForTutorial?: boolean;
}

/**
 * The full course layout, ordered by distance. Collectibles are arranged in
 * gentle arcs (via yOffset) between the enemies and obstacles the player must
 * jump. The run ends once travel reaches COURSE_LENGTH.
 */
export const COURSE: SpawnDef[] = [
  // Warm-up collectibles.
  { type: 'collectible', distance: 1 },
  { type: 'collectible', distance: 2 },

  // Hazards are placed every 2 distance units, alternating enemy / cone, so
  // two things never need to be jumped at once — the run is always passable.
  // Enemies move faster than the world (chase), so they arrive a little early;
  // the 2-unit spacing keeps a comfortable gap even after that.
  { type: 'enemy', distance: 3, pauseForTutorial: true },

  // gap 3 -> 5 (cone)
  { type: 'collectible', distance: 3.7, yOffset: 60 },
  { type: 'collectible', distance: 4.0, yOffset: 150 },
  { type: 'collectible', distance: 4.3, yOffset: 60 },
  { type: 'obstacle', distance: 5, warningLabel: true },

  // gap 5 -> 7 (enemy)
  { type: 'collectible', distance: 5.7, yOffset: 60 },
  { type: 'collectible', distance: 6.0, yOffset: 150 },
  { type: 'collectible', distance: 6.3, yOffset: 60 },
  { type: 'enemy', distance: 7 },

  // gap 7 -> 9 (cone)
  { type: 'collectible', distance: 7.7, yOffset: 80 },
  { type: 'collectible', distance: 8.0, yOffset: 200 },
  { type: 'collectible', distance: 8.3, yOffset: 80 },
  { type: 'obstacle', distance: 9, warningLabel: true },

  // gap 9 -> 11 (enemy)
  { type: 'collectible', distance: 9.7, yOffset: 60 },
  { type: 'collectible', distance: 10.0, yOffset: 150 },
  { type: 'collectible', distance: 10.3, yOffset: 60 },
  { type: 'enemy', distance: 11 },

  // gap 11 -> 13 (cone)
  { type: 'collectible', distance: 11.7, yOffset: 60 },
  { type: 'collectible', distance: 12.0, yOffset: 150 },
  { type: 'collectible', distance: 12.3, yOffset: 60 },
  { type: 'obstacle', distance: 13, warningLabel: true },

  // gap 13 -> 15 (enemy)
  { type: 'collectible', distance: 13.7, yOffset: 80 },
  { type: 'collectible', distance: 14.0, yOffset: 200 },
  { type: 'collectible', distance: 14.3, yOffset: 80 },
  { type: 'enemy', distance: 15 },

  // gap 15 -> 17 (cone)
  { type: 'collectible', distance: 15.7, yOffset: 60 },
  { type: 'collectible', distance: 16.0, yOffset: 150 },
  { type: 'collectible', distance: 16.3, yOffset: 60 },
  { type: 'obstacle', distance: 17 },

  // run-out to the finish
  { type: 'collectible', distance: 17.7 },
  { type: 'collectible', distance: 18.2, yOffset: 80 },
  { type: 'finish', distance: 19 },
];

/** Finite states the game moves through. */
export enum GameState {
  Loading = 'loading',
  Intro = 'intro',
  Running = 'running',
  Paused = 'paused',
  EndWin = 'end_win',
  EndLose = 'end_lose',
}

/** Player animation clips (keys inside the woman spritesheet atlas). */
export enum PlayerAnim {
  Idle = 'idle',
  Run = 'run',
  Jump = 'jump',
  Hurt = 'hurt',
}

/** UI copy. Reference ships en/es/it; English is the default locale. */
export const STRINGS = {
  loading: 'Loading...',
  tapToStart: 'TAP TO START',
  tutorial: 'TAP TO JUMP!',
  balancePrefix: '$',
  win: {
    title: 'Play Now!',
    cta: 'Install & Earn',
    subtitle: 'Next payment in one minute',
  },
  lose: {
    title: 'Try again!',
    subtitle: 'Play now in the app!',
  },
  disclaimer:
    'Actual payout and amount depend on playing and interacting with the app.',
} as const;

/** Store / redirect target used by the CTA (placeholder). */
export const CTA_URL = 'https://playbox.play.plbx.ai/playoff/runner';
