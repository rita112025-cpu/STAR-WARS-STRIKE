import { BULLET_SPEED, CANVAS_W, POWERUP_STYLES } from './config.ts';
import { bossMaxHp, waveLevel } from './progression.ts';
import type { Boss, Bullet, Enemy, Particle, Point, Powerup, PowerupType, Size } from './types.ts';

// 實體生成、粒子效果與碰撞判定。

const PLAYER_LASER_COLOR = '#00ff88';
const POWERUP_TYPES: PowerupType[] = ['shield', 'double', 'repair'];

export function createWave(stage: number, timeLeft: number): Enemy[] {
  const level = waveLevel(stage, timeLeft);
  const count = Math.min(14, 3 + level);
  return Array.from({ length: count }, (_, i): Enemy => {
    const isInterceptor = Math.random() < 0.3 + level * 0.05;
    return {
      x: 40 + Math.random() * (CANVAS_W - 80),
      y: -30 - i * 40,
      w: isInterceptor ? 30 : 36,
      h: 24,
      type: isInterceptor ? 'interceptor' : 'basic',
      hp: isInterceptor ? 2 : 1,
      speed: isInterceptor ? 3 : 1.5 + level * 0.2,
      zigzag: isInterceptor,
      zigzagTimer: Math.random() * Math.PI * 2,
      shootTimer: Math.random() * 60 + 30,
    };
  });
}

export function createBoss(stage: number): Boss {
  const hp = bossMaxHp(stage);
  return {
    x: CANVAS_W / 2,
    y: -80,
    w: 120,
    h: 160,
    hp,
    maxHp: hp,
    speed: 1,
    entering: true,
    shootTimer: 0,
    moveDir: 1,
    moveTimer: 0,
  };
}

export function createPowerup(): Powerup {
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return {
    x: 30 + Math.random() * (CANVAS_W - 60),
    y: -20,
    type,
    color: POWERUP_STYLES[type].color,
    speed: 1.5,
  };
}

export function createPlayerShots(player: Point, doubleLaser: boolean): Bullet[] {
  const shot = (dx: number, dy: number): Bullet => ({
    x: player.x + dx,
    y: player.y + dy,
    speed: BULLET_SPEED,
    color: PLAYER_LASER_COLOR,
  });
  return doubleLaser ? [shot(-10, -20), shot(10, -20)] : [shot(0, -25)];
}

export function addExplosion(particles: Particle[], x: number, y: number, color: string, count = 20): void {
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

export function addTrail(particles: Particle[], x: number, y: number, color: string): void {
  particles.push({
    x: x + (Math.random() - 0.5) * 4,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 1 + Math.random() * 2,
    life: 1,
    decay: 0.05,
    color,
    size: 1 + Math.random() * 2,
  });
}

/** 以中心點與寬高判斷兩個矩形是否重疊。 */
export function overlaps(a: Point, aSize: Size, b: Point, bSize: Size): boolean {
  return Math.abs(a.x - b.x) < (aSize.w + bSize.w) / 2 && Math.abs(a.y - b.y) < (aSize.h + bSize.h) / 2;
}
