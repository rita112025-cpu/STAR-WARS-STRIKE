import { CANVAS_H, CANVAS_W, COUNTDOWN_SECONDS, STAGE_DURATION } from '../config.ts';
import { pointsToNextRank, rankName, stageName } from '../progression.ts';
import type { GameSession } from '../types.ts';
import { drawXWing } from './ships.ts';

// 選單、倒數、過關、結束等全螢幕畫面。

const TITLE_FONT = '"Courier New", monospace';
const CENTER_X = CANVAS_W / 2;

const blinkOn = (now: number, speed: number) => Math.sin(now * speed) > 0;

function glowText(ctx: CanvasRenderingContext2D, text: string, y: number, color: string, font: string) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.font = font;
  ctx.fillText(text, CENTER_X, y);
}

export function drawMenu(ctx: CanvasRenderingContext2D, s: GameSession, now: number): void {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.textAlign = 'center';
  glowText(ctx, '銀河遠征 · 無限關卡', CANVAS_H / 3 - 40, '#FFE81F', `bold 28px ${TITLE_FONT}`);
  glowText(ctx, 'STAR WARS STRIKE', CANVAS_H / 3, '#FFE81F', `bold 32px ${TITLE_FONT}`);

  drawXWing(ctx, CENTER_X, CANVAS_H / 2 - 20, now, { shield: s.shieldActive, invincible: s.invincible });

  ctx.shadowBlur = 10;
  if (blinkOn(now, 0.005)) glowText(ctx, '點擊 / 按任意鍵 開始', CANVAS_H * 0.7, '#00ff88', `16px ${TITLE_FONT}`);
  glowText(ctx, `最高分: ${s.highScore}`, CANVAS_H * 0.8, '#FFE81F', `14px ${TITLE_FONT}`);
  ctx.fillStyle = '#00ccff';
  ctx.font = '13px monospace';
  ctx.fillText(`累積 ${s.totalScore} 分 · ${rankName(s.totalScore)} · 最遠第 ${s.bestStage} 關`, CENTER_X, CANVAS_H * 0.84);

  // 操作說明
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#888888';
  ctx.font = `11px ${TITLE_FONT}`;
  ctx.fillText('WASD/方向鍵 移動 | SPACE/點擊 射擊', CENTER_X, CANVAS_H * 0.88);
  ctx.fillText('Q = 質子魚雷 | 手機：觸控拖曳+自動射擊', CENTER_X, CANVAS_H * 0.92);
  ctx.restore();
}

export function drawCountdown(ctx: CanvasRenderingContext2D, s: GameSession, now: number): void {
  drawXWing(ctx, s.player.x, s.player.y, now, { shield: s.shieldActive, invincible: s.invincible });

  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#FFE81F';
  ctx.fillStyle = '#FFE81F';
  ctx.font = `bold 80px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const elapsed = (now - s.countdownStart) / 1000;
  const remaining = Math.ceil(COUNTDOWN_SECONDS - elapsed);
  if (remaining > 0) {
    const scale = 1 + (1 - (elapsed % 1)) * 0.3;
    ctx.save();
    ctx.translate(CENTER_X, CANVAS_H / 2);
    ctx.scale(scale, scale);
    ctx.fillText(remaining.toString(), 0, 0);
    ctx.restore();
  } else {
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.fillText('GO!', CENTER_X, CANVAS_H / 2);
  }

  ctx.font = '18px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText(`第 ${s.stage} 關 · ${stageName(s.stage)}`, CENTER_X, CANVAS_H / 2 + 90);
  ctx.font = '13px monospace';
  ctx.fillText(`生存 ${STAGE_DURATION} 秒過關 · 每關恢復 1 生命`, CENTER_X, CANVAS_H / 2 + 120);
  ctx.restore();
}

export function drawStageClear(ctx: CanvasRenderingContext2D, s: GameSession): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#FFE81F';
  ctx.font = 'bold 32px monospace';
  ctx.fillText(`第 ${s.stage} 關完成！`, CENTER_X, 210);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`通關 + 生存獎勵：+${s.stageBonus}`, CENTER_X, 265);
  ctx.fillText(`本次遠征分數：${s.score}`, CENTER_X, 300);
  ctx.fillStyle = '#00ccff';
  ctx.fillText(`累積：${s.totalScore} · ${rankName(s.totalScore)}`, CENTER_X, 345);

  const toNext = pointsToNextRank(s.totalScore);
  ctx.font = '14px monospace';
  ctx.fillText(toNext === null ? '已達最高軍階！挑戰更遠的銀河' : `距離下一軍階還差 ${toNext} 分`, CENTER_X, 380);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`下一關：${stageName(s.stage + 1)}`, CENTER_X, 440);
  ctx.fillText('恢復 1 生命 · 魚雷充能 · 開場護盾', CENTER_X, 475);
  ctx.fillStyle = '#FFE81F';
  ctx.fillText('點擊 / 按 Enter 繼續遠征', CENTER_X, 545);
  ctx.restore();
}

export function drawGameOver(ctx: CanvasRenderingContext2D, s: GameSession, now: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.shadowBlur = 20;

  const top = CANVAS_H / 3;
  glowText(ctx, 'GAME OVER', top, '#ff0044', `bold 36px ${TITLE_FONT}`);
  glowText(ctx, `最終分數: ${s.score}`, top + 50, '#FFE81F', `bold 22px ${TITLE_FONT}`);
  glowText(ctx, `最高連擊: ${s.maxCombo}x`, top + 80, '#ff8800', `16px ${TITLE_FONT}`);
  glowText(ctx, `最高分: ${s.highScore}`, top + 110, '#00ff88', `16px ${TITLE_FONT}`);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText(`抵達第 ${s.stage} 關 · 累積 ${s.totalScore} 分`, CENTER_X, 440);
  const toNext = pointsToNextRank(s.totalScore);
  ctx.fillText(`${rankName(s.totalScore)}${toNext === null ? ' · 最高軍階' : ` · 升階還差 ${toNext} 分`}`, CENTER_X, 470);

  if (s.score >= s.highScore && s.score > 0 && blinkOn(now, 0.008)) {
    glowText(ctx, '★ 新紀錄！★', top + 140, '#FFE81F', `bold 18px ${TITLE_FONT}`);
  }
  if (blinkOn(now, 0.005)) {
    glowText(ctx, '點擊 / 按任意鍵 重新開始', CANVAS_H * 0.75, '#00ff88', `16px ${TITLE_FONT}`);
  }
  ctx.restore();
}
