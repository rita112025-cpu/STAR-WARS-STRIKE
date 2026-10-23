import { STORAGE_KEYS } from './config.ts';
import type { Progress } from './types.ts';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 私密模式或封鎖儲存時可能拿不到 localStorage，此時回傳 undefined 仍可遊玩。 */
export function browserStorage(): KeyValueStore | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readCount(store: KeyValueStore | undefined, key: string): number {
  try {
    const value = Number(store?.getItem(key));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function writeCount(store: KeyValueStore | undefined, key: string, value: number): void {
  try {
    store?.setItem(key, String(value));
  } catch {
    // 寫入失敗不影響本場遊戲
  }
}

export function loadProgress(store: KeyValueStore | undefined): Progress {
  return {
    totalScore: readCount(store, STORAGE_KEYS.totalScore),
    highScore: readCount(store, STORAGE_KEYS.highScore),
    bestStage: Math.max(1, readCount(store, STORAGE_KEYS.bestStage)),
  };
}

export function saveProgress(store: KeyValueStore | undefined, progress: Progress): void {
  writeCount(store, STORAGE_KEYS.totalScore, progress.totalScore);
  writeCount(store, STORAGE_KEYS.highScore, progress.highScore);
  writeCount(store, STORAGE_KEYS.bestStage, progress.bestStage);
}
