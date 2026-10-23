import { BOSS_INTERVAL, RANK_NAMES, RANK_THRESHOLDS, STAGE_DURATION, STAGE_NAMES, WAVE_INTERVAL } from './config.ts';
import type { EnemyType } from './types.ts';

// 純函式：遊戲數值與難度曲線，集中在此方便調整與測試。

export function rankIndex(totalScore: number): number {
  return RANK_THRESHOLDS.reduce((rank, threshold, i) => (totalScore >= threshold ? i : rank), 0);
}

export function rankName(totalScore: number): string {
  return RANK_NAMES[rankIndex(totalScore)];
}

/** 距離下一軍階的分數；已達最高軍階時回傳 null。 */
export function pointsToNextRank(totalScore: number): number | null {
  const next = RANK_THRESHOLDS[rankIndex(totalScore) + 1];
  return next === undefined ? null : next - totalScore;
}

export function stageName(stage: number): string {
  return STAGE_NAMES[(stage - 1) % STAGE_NAMES.length];
}

export function stageClearBonus(stage: number, lives: number): number {
  return stage * 1500 + lives * 500;
}

/** 每 10 連擊給一次獎勵，其他連擊數回傳 0。 */
export function comboMilestoneBonus(combo: number, stage: number): number {
  return combo % 10 === 0 ? 500 * stage : 0;
}

export function enemyKillScore(type: EnemyType, combo: number): number {
  return (type === 'interceptor' ? 200 : 100) * Math.min(combo, 10);
}

/** 波次強度：隨本關經過時間與關卡數提高。 */
export function waveLevel(stage: number, timeLeft: number): number {
  return Math.floor((STAGE_DURATION - timeLeft) / 15) + Math.min(stage - 1, 8);
}

export function waveInterval(stage: number): number {
  return Math.max(1600, WAVE_INTERVAL - (stage - 1) * 150);
}

export function bossInterval(stage: number): number {
  return Math.max(25000, BOSS_INTERVAL - (stage - 1) * 3000);
}

export function bossMaxHp(stage: number): number {
  return 70 + Math.min(stage - 1, 10) * 20;
}
