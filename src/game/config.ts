import type { PowerupType } from './types.ts';

// ========== 畫面 ==========
export const CANVAS_W = 480;
export const CANVAS_H = 720;

// ========== 玩家與武器 ==========
export const PLAYER_SPEED = 5;
export const BULLET_SPEED = 10;
export const ENEMY_BULLET_SPEED = 4;
export const MANUAL_FIRE_FRAMES = 6; // 按住射擊：每 6 幀一發
export const AUTO_FIRE_FRAMES = 12; // 自動射擊：每 12 幀一發
export const PROTON_COOLDOWN = 15000; // 毫秒
export const START_LIVES = 3;
export const MAX_LIVES = 5;

// ========== 狀態持續時間（以 60fps 幀數計） ==========
export const SHIELD_FRAMES = 600; // 10 秒
export const STAGE_START_SHIELD_FRAMES = 180; // 3 秒
export const DOUBLE_LASER_FRAMES = 480; // 8 秒
export const INVINCIBLE_FRAMES = 120; // 2 秒
export const PROTON_FLASH_FRAMES = 30;

// ========== 節奏 ==========
export const STAGE_DURATION = 60; // 每關秒數
export const COUNTDOWN_SECONDS = 3;
export const COUNTDOWN_GO_SECONDS = 3.5; // 顯示 GO! 後開始
export const WAVE_INTERVAL = 3000;
export const BOSS_INTERVAL = 45000;
export const POWERUP_INTERVAL = 8000;
export const INPUT_LOCK_MS = 800; // 過關 / 結束畫面防誤觸
export const NOTICE_MS = 1800;

// ========== 計分 ==========
export const BOSS_KILL_SCORE = 5000;
export const BOSS_KILL_COMBO = 10;
export const PROTON_ENEMY_DAMAGE = 5;
export const PROTON_BOSS_DAMAGE = 20;

// ========== 碰撞箱 ==========
export const PLAYER_HITBOX = { w: 30, h: 40 };
export const BULLET_HITBOX = { w: 4, h: 12 };
export const ENEMY_BULLET_HITBOX = { w: 6, h: 6 };
export const POWERUP_HITBOX = { w: 24, h: 24 };

// ========== 進度 ==========
export const STAGE_NAMES = ['外環巡邏', '小行星伏擊', '帝國封鎖線', '死星突擊', '銀河決戰'];
export const RANK_THRESHOLDS = [0, 10000, 50000, 150000, 400000];
export const RANK_NAMES = ['新兵', '飛行員', '王牌', '中隊長', '銀河傳奇'];

export const STORAGE_KEYS = {
  totalScore: 'sw_strike_total',
  highScore: 'sw_strike_highscore',
  bestStage: 'sw_strike_stage',
} as const;

// ========== 道具外觀 ==========
export const POWERUP_STYLES: Record<PowerupType, { color: string; fill: string; label: string }> = {
  shield: { color: '#0088ff', fill: 'rgba(0, 136, 255, 0.3)', label: 'S' },
  double: { color: '#ff4400', fill: 'rgba(255, 68, 0, 0.3)', label: '2x' },
  repair: { color: '#ffcc00', fill: 'rgba(255, 204, 0, 0.3)', label: '+1' },
};
