import { CANVAS_H, CANVAS_W, PROTON_COOLDOWN, STAGE_DURATION } from '../config.ts';
import { stageName } from '../progression.ts';
import type { GameSession } from '../types.ts';

const HUD_FONT = '"Courier New", monospace';

function drawLives(ctx: CanvasRenderingContext2D, lives: number) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  for (let i = 0; i < lives; i++) {
    const x = i * 22;
    ctx.beginPath();
    ctx.moveTo(10 + x, CANVAS_H - 20);
    ctx.lineTo(16 + x, CANVAS_H - 30);
    ctx.lineTo(22 + x, CANVAS_H - 20);
    ctx.lineTo(16 + x, CANVAS_H - 24);
    ctx.closePath();
    ctx.fill();
  }
}

function drawProtonStatus(ctx: CanvasRenderingContext2D, s: GameSession, now: number) {
  const elapsed = now - s.lastProtonTime;
  const ready = elapsed >= PROTON_COOLDOWN;
  ctx.fillStyle = ready ? '#ffaa00' : '#444444';
  ctx.shadowColor = ready ? '#ffaa00' : 'transparent';
  ctx.font = `12px ${HUD_FONT}`;
  ctx.textAlign = 'right';
  const label = ready ? '[Q] 質子魚雷 就緒' : `[Q] 冷卻中 ${Math.ceil((PROTON_COOLDOWN - elapsed) / 1000)}s`;
  ctx.fillText(label, CANVAS_W - 10, CANVAS_H - 15);
}

function drawStatusEffects(ctx: CanvasRenderingContext2D, s: GameSession) {
  const effects = [
    { active: s.shieldActive, color: '#0088ff', label: `🛡 護盾 ${Math.ceil(s.shieldTimer / 60)}s` },
    { active: s.doubleLaser, color: '#ff4400', label: `⚡ 雙發 ${Math.ceil(s.doubleLaserTimer / 60)}s` },
  ];
  ctx.font = `11px ${HUD_FONT}`;
  ctx.textAlign = 'left';
  let y = 65;
  for (const effect of effects.filter(e => e.active)) {
    ctx.fillStyle = effect.color;
    ctx.shadowColor = effect.color;
    ctx.fillText(effect.label, 10, y);
    y += 15;
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, s: GameSession, now: number): void {
  ctx.save();

  // 分數
  ctx.fillStyle = '#FFE81F';
  ctx.shadowColor = '#FFE81F';
  ctx.shadowBlur = 5;
  ctx.font = `bold 18px ${HUD_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`分數: ${s.score}`, 10, 25);

  if (s.combo > 1) {
    ctx.fillStyle = '#ff8800';
    ctx.shadowColor = '#ff8800';
    ctx.font = `bold 14px ${HUD_FONT}`;
    ctx.fillText(`連擊 x${s.combo}`, 10, 45);
  }

  // 剩餘時間
  const timeColor = s.gameTime < 10 ? '#ff4444' : '#00ff88';
  ctx.fillStyle = timeColor;
  ctx.shadowColor = timeColor;
  ctx.font = `bold 18px ${HUD_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(s.gameTime)}s`, CANVAS_W - 10, 25);

  // 關卡與進度條
  ctx.font = '12px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText(`第 ${s.stage} 關 · ${stageName(s.stage)}`, CANVAS_W - 10, 45);
  ctx.fillStyle = '#183344';
  ctx.fillRect(10, 52, CANVAS_W - 20, 3);
  ctx.fillStyle = '#00ccff';
  ctx.fillRect(10, 52, (CANVAS_W - 20) * (1 - s.gameTime / STAGE_DURATION), 3);

  if (now < s.noticeUntil) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFE81F';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(s.notice, CANVAS_W / 2, 145);
  }

  drawLives(ctx, s.lives);
  drawProtonStatus(ctx, s, now);
  drawStatusEffects(ctx, s);

  ctx.restore();
}
