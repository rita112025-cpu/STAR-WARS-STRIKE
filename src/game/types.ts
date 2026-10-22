export type GameState = 'menu' | 'countdown' | 'playing' | 'stageclear' | 'gameover';
export type EnemyType = 'basic' | 'interceptor';
export type PowerupType = 'shield' | 'double' | 'repair';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Player extends Point, Size {}

export interface Bullet extends Point {
  speed: number;
  color: string;
}

export interface EnemyBullet extends Point {
  vx: number;
  vy: number;
  color: string;
}

export interface Enemy extends Point, Size {
  type: EnemyType;
  hp: number;
  speed: number;
  zigzag: boolean;
  zigzagTimer: number;
  shootTimer: number;
}

export interface Boss extends Point, Size {
  hp: number;
  maxHp: number;
  speed: number;
  entering: boolean;
  shootTimer: number;
  moveDir: number;
  moveTimer: number;
}

export interface Powerup extends Point {
  type: PowerupType;
  color: string;
  speed: number;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
}

export interface Star extends Point {
  speed: number;
  size: number;
  brightness: number;
}

/** 跨場保存的進度 */
export interface Progress {
  totalScore: number;
  highScore: number;
  bestStage: number;
}

/** 每次重新開始都會重置的欄位 */
export interface RunState {
  stage: number;
  score: number;
  settledScore: number; // 已計入 totalScore 的分數，避免重複累積
  stageBonus: number;
  combo: number;
  maxCombo: number;
  lives: number;
  gameTime: number; // 本關剩餘秒數
  notice: string;
  noticeUntil: number;
  lastWaveTime: number;
  lastBossTime: number;
  lastPowerupTime: number;
  lastProtonTime: number;
  shieldActive: boolean;
  shieldTimer: number;
  doubleLaser: boolean;
  doubleLaserTimer: number;
  invincible: boolean;
  invincibleTimer: number;
  screenShake: number;
  protonAnimTimer: number;
  shootTimer: number;
  player: Player;
  bullets: Bullet[];
  enemyBullets: EnemyBullet[];
  enemies: Enemy[];
  particles: Particle[];
  powerups: Powerup[];
  boss: Boss | null;
}

export interface GameSession extends Progress, RunState {
  gameState: GameState;
  countdownStart: number;
  stageClearAt: number;
  runEndedAt: number;
}
