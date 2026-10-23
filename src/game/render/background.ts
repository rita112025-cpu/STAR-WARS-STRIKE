import { CANVAS_H, CANVAS_W } from '../config.ts';
import type { Star } from '../types.ts';

export interface Starfield {
  near: Star[];
  far: Star[];
}

function createStars(count: number, speed: [number, number], size: [number, number], brightness: [number, number]): Star[] {
  const between = ([min, range]: [number, number]) => min + Math.random() * range;
  return Array.from({ length: count }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H,
    speed: between(speed),
    size: between(size),
    brightness: between(brightness),
  }));
}

export function createStarfield(): Starfield {
  return {
    near: createStars(80, [1, 2], [0.5, 1.5], [0.3, 0.7]),
    far: createStars(40, [0.3, 0.5], [0.3, 0.8], [0.1, 0.3]),
  };
}

function scrollAndDrawStars(ctx: CanvasRenderingContext2D, stars: Star[], rgb: string) {
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > CANVAS_H) {
      s.y = 0;
      s.x = Math.random() * CANVAS_W;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb}, ${s.brightness})`;
    ctx.fill();
  });
}

/** 深空漸層、遠景星球與捲動星空。每次呼叫會讓星星往下移動一幀。 */
export function drawBackground(ctx: CanvasRenderingContext2D, starfield: Starfield): void {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#000011');
  grad.addColorStop(0.5, '#000022');
  grad.addColorStop(1, '#000033');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 遠景星球（死星剪影）與小行星
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(CANVAS_W - 80, 120, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#444466';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CANVAS_W - 80, 120, 60, -0.3, 0.3);
  ctx.strokeStyle = '#666688';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(60, 200, 25, 0, Math.PI * 2);
  ctx.fillStyle = '#333355';
  ctx.fill();
  ctx.restore();

  scrollAndDrawStars(ctx, starfield.far, '150, 150, 200');
  scrollAndDrawStars(ctx, starfield.near, '200, 220, 255');
}
