import { CANVAS_H, CANVAS_W, PROTON_FLASH_FRAMES } from '../config.ts';
import type { GameSession } from '../types.ts';
import { drawBackground, type Starfield } from './background.ts';
import { drawHUD } from './hud.ts';
import { drawEnemyBullet, drawParticle, drawPlayerBullet, drawPowerup } from './projectiles.ts';
import { drawCountdown, drawGameOver, drawMenu, drawStageClear } from './screens.ts';
import { drawStarDestroyer, drawTIE, drawXWing } from './ships.ts';

function drawWorld(ctx: CanvasRenderingContext2D, s: GameSession, now: number) {
  s.powerups.forEach(p => drawPowerup(ctx, p, now));
  s.enemies.forEach(e => drawTIE(ctx, e.x, e.y, e.type));
  if (s.boss) drawStarDestroyer(ctx, s.boss, now);
  s.bullets.forEach(b => drawPlayerBullet(ctx, b));
  s.enemyBullets.forEach(b => drawEnemyBullet(ctx, b));
  s.particles.forEach(p => drawParticle(ctx, p));
  drawXWing(ctx, s.player.x, s.player.y, now, { shield: s.shieldActive, invincible: s.invincible });
}

function drawProtonFlash(ctx: CanvasRenderingContext2D, timer: number) {
  ctx.save();
  ctx.globalAlpha = timer / PROTON_FLASH_FRAMES;
  ctx.fillStyle = '#ffaa00';
  ctx.shadowBlur = 50;
  ctx.shadowColor = '#ffaa00';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

/** 依目前遊戲狀態畫出整個畫面。 */
export function renderFrame(ctx: CanvasRenderingContext2D, s: GameSession, starfield: Starfield, now: number): void {
  ctx.save();
  if (s.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * s.screenShake, (Math.random() - 0.5) * s.screenShake);
  }

  drawBackground(ctx, starfield);

  switch (s.gameState) {
    case 'menu':
      drawMenu(ctx, s, now);
      break;
    case 'countdown':
      drawCountdown(ctx, s, now);
      break;
    case 'playing':
      drawWorld(ctx, s, now);
      drawHUD(ctx, s, now);
      break;
    case 'stageclear':
      drawWorld(ctx, s, now);
      drawStageClear(ctx, s);
      break;
    case 'gameover':
      drawWorld(ctx, s, now);
      drawHUD(ctx, s, now);
      drawGameOver(ctx, s, now);
      break;
  }

  if (s.protonAnimTimer > 0) drawProtonFlash(ctx, s.protonAnimTimer);
  ctx.restore();
}
