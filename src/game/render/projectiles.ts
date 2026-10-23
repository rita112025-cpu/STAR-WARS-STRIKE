import { POWERUP_STYLES } from '../config.ts';
import type { Bullet, EnemyBullet, Particle, Powerup } from '../types.ts';

export function drawPlayerBullet(ctx: CanvasRenderingContext2D, b: Bullet): void {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = b.color;
  ctx.fillStyle = b.color;
  ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
  // 光輝尾跡
  ctx.globalAlpha = 0.4;
  ctx.fillRect(b.x - 1, b.y - 12, 2, 18);
  ctx.restore();
}

export function drawEnemyBullet(ctx: CanvasRenderingContext2D, b: EnemyBullet): void {
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = b.color;
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.globalAlpha = p.life;
  ctx.shadowBlur = 5;
  ctx.shadowColor = p.color;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPowerup(ctx: CanvasRenderingContext2D, p: Powerup, now: number): void {
  const style = POWERUP_STYLES[p.type];
  const pulse = Math.sin(now * 0.005) * 3;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowBlur = 15;
  ctx.shadowColor = style.color;
  ctx.beginPath();
  ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.fillStyle = style.color;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(style.label, 0, 4);
  ctx.restore();
}
