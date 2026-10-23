import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../src/game/Game.ts';
import { pointsToNextRank, rankIndex, stageClearBonus, stageName } from '../src/game/progression.ts';

// 以假 canvas、可控時鐘與記憶體 storage 驅動真正的遊戲邏輯。
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

function fakeCanvas() {
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  return {
    getContext: () => ctx,
    parentElement: { clientWidth: 480, clientHeight: 720 },
    style: {},
    addEventListener() {},
    removeEventListener() {},
  };
}

function setup(saved = {}, blocked = false) {
  let now = 10000;
  const data = { ...saved };
  const storage = {
    getItem(k) { if (blocked) throw Error('blocked'); return data[k] ?? null; },
    setItem(k, v) { if (blocked) throw Error('blocked'); data[k] = v; },
  };
  const game = createGame(fakeCanvas(), { now: () => now, storage });
  return { game, s: game.session, data, advance: ms => { now += ms; } };
}

test('timer clears stage; rewards bank once; next stage heals and preserves score', () => {
  const { game, s, advance } = setup();
  Object.assign(s, { gameState: 'playing', score: 1000, lives: 2, gameTime: 0.01 });
  game.update(20);
  assert.equal(s.gameState, 'stageclear');
  assert.equal(s.score, 3500);
  assert.equal(s.totalScore, 3500);
  game.clearStage();
  assert.equal(s.totalScore, 3500);
  game.nextStage();
  assert.equal(s.stage, 1);
  advance(801); game.nextStage();
  assert.equal(s.stage, 2);
  assert.equal(s.lives, 3);
  assert.equal(s.shieldActive, true);
  assert.equal(s.score, 3500);
  Object.assign(s, { gameState: 'playing', score: 4000 }); game.finishRun(); game.finishRun();
  assert.equal(s.totalScore, 4000);
  game.resetRun();
  assert.equal(s.stage, 1);
  assert.equal(s.score, 0);
  assert.equal(s.totalScore, 4000);
});

test('scores persist across sessions and rank advances', () => {
  const { game, s, data } = setup();
  Object.assign(s, { gameState: 'playing', score: 12000 }); game.finishRun();
  const reload = setup(data).s;
  assert.equal(reload.totalScore, 12000);
  assert.equal(reload.highScore, 12000);
  assert.equal(rankIndex(reload.totalScore), 1);
});

test('blocked or corrupt storage still allows play', () => {
  for (const { game, s } of [setup({}, true), setup({ sw_strike_total: 'oops', sw_strike_highscore: '-9' })]) {
    Object.assign(s, { gameState: 'playing', score: 100 }); game.finishRun();
    assert.equal(s.totalScore, 100);
  }
});

test('torpedo immediately awards enemy, combo milestone and boss kills exactly once', () => {
  const { game, s } = setup();
  Object.assign(s, {
    gameState: 'playing',
    enemies: Array.from({ length: 10 }, () => ({ hp: 1, x: 100, y: 100, type: 'basic' })),
    boss: { hp: 10, x: 240, y: 100 },
  });
  game.fireProtonTorpedo();
  assert.equal(s.enemies.length, 0);
  assert.equal(s.boss, null);
  assert.equal(s.score, 11000);
  assert.equal(s.maxCombo, 20);
  game.fireProtonTorpedo();
  assert.equal(s.score, 11000);
});

test('progression helpers: stage names wrap, bonus and rank distance', () => {
  assert.equal(stageName(1), '外環巡邏');
  assert.equal(stageName(6), '外環巡邏');
  assert.equal(stageClearBonus(3, 2), 5500);
  assert.equal(pointsToNextRank(0), 10000);
  assert.equal(pointsToNextRank(400000), null);
});
