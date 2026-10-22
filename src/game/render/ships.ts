import type { Boss, EnemyType } from '../types.ts';

type Polygon = [number, number][];

function tracePolygon(ctx: CanvasRenderingContext2D, points: Polygon) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

const mirrorX = (points: Polygon): Polygon => points.map(([x, y]) => [-x, y]);

// ========== X-Wing（玩家） ==========
const X_WING_LEFT_LOWER: Polygon = [[-5, 5], [-25, 20], [-22, 15], [-5, 0]];
const X_WING_LEFT_UPPER: Polygon = [[-5, -5], [-22, -15], [-20, -10], [-5, -2]];
const X_WING_WINGS = [X_WING_LEFT_LOWER, mirrorX(X_WING_LEFT_LOWER), X_WING_LEFT_UPPER, mirrorX(X_WING_LEFT_UPPER)];
const X_WING_BODY: Polygon = [[0, -25], [-8, 10], [-6, 20], [6, 20], [8, 10]];

export interface XWingEffects {
  shield: boolean;
  invincible: boolean;
}

export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, effects: XWingEffects): void {
  ctx.save();
  ctx.translate(x, y);

  // 受傷後無敵：半透明閃爍
  if (effects.invincible && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = 0.5;

  // 引擎光焰
  const flicker = Math.sin(now * 0.02) * 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00aaff';
  ctx.fillStyle = '#00ccff';
  ctx.fillRect(-18, 18, 4, 8 + flicker);
  ctx.fillRect(14, 18, 4, 8 + flicker);
  ctx.fillRect(-8, 20, 3, 6 + flicker);
  ctx.fillRect(5, 20, 3, 6 + flicker);

  // 四翼
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00ff88';
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#004422';
  X_WING_WINGS.forEach(wing => {
    tracePolygon(ctx, wing);
    ctx.fill();
    ctx.stroke();
  });

  // 機身
  ctx.shadowBlur = 10;
  tracePolygon(ctx, X_WING_BODY);
  ctx.fillStyle = '#003322';
  ctx.fill();
  ctx.stroke();

  // 駕駛艙
  ctx.beginPath();
  ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#006644';
  ctx.fill();
  ctx.strokeStyle = '#00ffaa';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (effects.shield) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#0088ff';
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 136, 255, ${0.4 + Math.sin(now * 0.01) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

// ========== TIE 戰機（敵機） ==========
const INTERCEPTOR_LEFT_PANEL: Polygon = [[-15, -12], [-18, 12], [-12, 10], [-10, -10]];

function hexagon(cx: number, radius: number): Polygon {
  return Array.from({ length: 6 }, (_, i): [number, number] => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

const TIE_LEFT_PANEL = hexagon(-16, 12);
const TIE_RIGHT_PANEL = hexagon(16, 12);

function drawTieCockpit(ctx: CanvasRenderingContext2D, radius: number, windowRadius: number) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#220011';
  ctx.fill();
  ctx.strokeStyle = '#ff4466';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, windowRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0044';
  ctx.fill();
}

export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, type: EnemyType): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff0044';
  ctx.strokeStyle = '#ff4466';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#330011';

  if (type === 'interceptor') {
    // TIE 攔截機：翼板加斜翼延伸
    for (const panel of [INTERCEPTOR_LEFT_PANEL, mirrorX(INTERCEPTOR_LEFT_PANEL)]) {
      tracePolygon(ctx, panel);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-15, -12);
    ctx.lineTo(-22, -18);
    ctx.moveTo(15, -12);
    ctx.lineTo(22, -18);
    ctx.moveTo(-18, 12);
    ctx.lineTo(-22, 18);
    ctx.moveTo(18, 12);
    ctx.lineTo(22, 18);
    ctx.stroke();
    drawTieCockpit(ctx, 8, 4);
  } else {
    // 標準 TIE/ln：六邊形翼板加連接桿
    for (const panel of [TIE_LEFT_PANEL, TIE_RIGHT_PANEL]) {
      tracePolygon(ctx, panel);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-4, 0);
    ctx.moveTo(4, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    drawTieCockpit(ctx, 7, 3);
  }
  ctx.restore();
}

// ========== 星際驅逐艦（BOSS） ==========
export function drawStarDestroyer(ctx: CanvasRenderingContext2D, boss: Boss, now: number): void {
  const { w, h, hp, maxHp } = boss;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#8844ff';

  // 楔形艦體
  tracePolygon(ctx, [[0, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]);
  ctx.fillStyle = '#1a0033';
  ctx.fill();
  ctx.strokeStyle = '#8844ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 艦橋塔
  ctx.fillStyle = '#220044';
  ctx.strokeStyle = '#aa66ff';
  ctx.fillRect(-15, -5, 30, 20);
  ctx.strokeRect(-15, -5, 30, 20);

  // 表面細節線條
  ctx.strokeStyle = 'rgba(136, 68, 255, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const yy = -h / 2 + (h / 5) * (i + 1);
    const xSpread = (w / 2) * ((i + 1) / 5);
    ctx.beginPath();
    ctx.moveTo(-xSpread, yy);
    ctx.lineTo(xSpread, yy);
    ctx.stroke();
  }

  // 引擎光
  const flicker = Math.sin(now * 0.015) * 2;
  ctx.fillStyle = '#8844ff';
  ctx.shadowBlur = 10;
  ctx.fillRect(-20, h / 2 - 5, 8, 5 + flicker);
  ctx.fillRect(-5, h / 2 - 5, 10, 8 + flicker);
  ctx.fillRect(12, h / 2 - 5, 8, 5 + flicker);

  // HP 條
  const barW = w * 0.8;
  const barH = 6;
  const barY = -h / 2 - 15;
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#330033';
  ctx.fillRect(-barW / 2, barY, barW, barH);
  ctx.fillStyle = hp > maxHp * 0.3 ? '#ff4444' : '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 5;
  ctx.fillRect(-barW / 2, barY, barW * (hp / maxHp), barH);

  ctx.restore();
}
