import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

// Exercise the actual canvas game closure with a deterministic clock.
const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const body = source.split('  useEffect(() => {')[1].split('  }, []);')[0];
function game(saved = {}, blocked = false) {
  let now = 10000;
  const storage = { ...saved };
  const context = new Proxy({}, { get: () => () => {}, set: () => true });
  const canvas = { getContext: () => context, parentElement: { clientWidth: 480, clientHeight: 720 }, style: {}, addEventListener() {}, removeEventListener() {} };
  const sandbox = {
    canvasRef: { current: canvas }, performance: { now: () => now },
    Date: { now: () => now }, Math, Number,
    window: { addEventListener() {}, removeEventListener() {} },
    localStorage: { getItem(k) { if (blocked) throw Error('blocked'); return storage[k] ?? null; }, setItem(k, v) { if (blocked) throw Error('blocked'); storage[k] = v; } },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  };
  const instrumented = body.replace('    // 清理', `
    globalThis.api = {
      get state() { return { gameState, stage, score, totalScore, lives, highScore, bestStage, shieldActive, maxCombo, combo, bossRef, enemies }; },
      set(values) { if ('gameState' in values) gameState = values.gameState; if ('score' in values) score = values.score; if ('lives' in values) lives = values.lives; if ('gameTime' in values) gameTime = values.gameTime; if ('deltaTime' in values) deltaTime = values.deltaTime; if ('bossRef' in values) bossRef = values.bossRef; if ('enemies' in values) enemies = values.enemies; },
      clearStage, nextStage, finishRun, resetGame, update, fireProtonTorpedo, spawnWave, rankIndex
    };
    // 清理`);
  vm.runInNewContext(stripTypeScriptTypes(`(function () {${instrumented}})()`), sandbox);
  return { api: sandbox.api, storage, advance: ms => { now += ms; } };
}

test('timer clears stage; rewards bank once; next stage heals and preserves score', () => {
  const { api, advance } = game();
  api.set({ gameState: 'playing', score: 1000, lives: 2, gameTime: 0.01, deltaTime: 20 });
  api.update();
  assert.equal(api.state.gameState, 'stageclear');
  assert.equal(api.state.score, 3500);
  assert.equal(api.state.totalScore, 3500);
  api.clearStage();
  assert.equal(api.state.totalScore, 3500);
  api.nextStage();
  assert.equal(api.state.stage, 1);
  advance(801); api.nextStage();
  assert.equal(api.state.stage, 2);
  assert.equal(api.state.lives, 3);
  assert.equal(api.state.shieldActive, true);
  assert.equal(api.state.score, 3500);
  api.set({ gameState: 'playing', score: 4000 }); api.finishRun(); api.finishRun();
  assert.equal(api.state.totalScore, 4000);
  api.resetGame();
  assert.equal(api.state.stage, 1);
  assert.equal(api.state.score, 0);
  assert.equal(api.state.totalScore, 4000);
});

test('scores persist across sessions and rank advances', () => {
  const { api, storage } = game();
  api.set({ gameState: 'playing', score: 12000 }); api.finishRun();
  const reload = game(storage).api;
  assert.equal(reload.state.totalScore, 12000);
  assert.equal(reload.state.highScore, 12000);
  assert.equal(reload.rankIndex(), 1);
});

test('blocked or corrupt storage still allows play', () => {
  for (const setup of [game({}, true), game({ sw_strike_total: 'oops', sw_strike_highscore: '-9' })]) {
    setup.api.set({ gameState: 'playing', score: 100 }); setup.api.finishRun();
    assert.equal(setup.api.state.totalScore, 100);
  }
});

test('torpedo immediately awards enemy, combo milestone and boss kills exactly once', () => {
  const { api } = game();
  api.set({ gameState: 'playing', enemies: Array.from({ length: 10 }, () => ({ hp: 1, x: 100, y: 100, type: 'basic' })), bossRef: { hp: 10, x: 240, y: 100 } });
  api.fireProtonTorpedo();
  assert.equal(api.state.enemies.length, 0);
  assert.equal(api.state.bossRef, null);
  assert.equal(api.state.score, 11000);
  assert.equal(api.state.maxCombo, 20);
  api.fireProtonTorpedo();
  assert.equal(api.state.score, 11000);
});
