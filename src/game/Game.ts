import { createAudio } from './audio.ts';
import {
  AUTO_FIRE_FRAMES,
  BOSS_KILL_COMBO,
  BOSS_KILL_SCORE,
  BULLET_HITBOX,
  CANVAS_H,
  CANVAS_W,
  COUNTDOWN_GO_SECONDS,
  DOUBLE_LASER_FRAMES,
  ENEMY_BULLET_HITBOX,
  ENEMY_BULLET_SPEED,
  INPUT_LOCK_MS,
  INVINCIBLE_FRAMES,
  MANUAL_FIRE_FRAMES,
  MAX_LIVES,
  NOTICE_MS,
  PLAYER_HITBOX,
  PLAYER_SPEED,
  POWERUP_HITBOX,
  POWERUP_INTERVAL,
  PROTON_BOSS_DAMAGE,
  PROTON_COOLDOWN,
  PROTON_ENEMY_DAMAGE,
  PROTON_FLASH_FRAMES,
  SHIELD_FRAMES,
  STAGE_DURATION,
  STAGE_START_SHIELD_FRAMES,
  START_LIVES,
} from './config.ts';
import { addExplosion, addTrail, createBoss, createPlayerShots, createPowerup, createWave, overlaps } from './entities.ts';
import { attachInput, createInputState, releaseAll } from './input.ts';
import { bossInterval, comboMilestoneBonus, enemyKillScore, stageClearBonus, waveInterval } from './progression.ts';
import { createStarfield } from './render/background.ts';
import { renderFrame } from './render/scene.ts';
import { browserStorage, loadProgress, saveProgress, type KeyValueStore } from './storage.ts';
import type { Enemy, GameSession, RunState } from './types.ts';

export interface GameOptions {
  /** 遊戲邏輯使用的時鐘，測試時可注入固定時間。 */
  now?: () => number;
  storage?: KeyValueStore;
}

export interface Game {
  session: GameSession;
  update(deltaMs: number): void;
  startRun(): void;
  resetRun(): void;
  clearStage(): void;
  nextStage(): void;
  finishRun(): void;
  fireProtonTorpedo(): void;
  destroy(): void;
}

function createRunState(): RunState {
  return {
    stage: 1,
    score: 0,
    settledScore: 0,
    stageBonus: 0,
    combo: 0,
    maxCombo: 0,
    lives: START_LIVES,
    gameTime: STAGE_DURATION,
    notice: '',
    noticeUntil: 0,
    lastWaveTime: 0,
    lastBossTime: 0,
    lastPowerupTime: 0,
    lastProtonTime: -PROTON_COOLDOWN,
    shieldActive: false,
    shieldTimer: 0,
    doubleLaser: false,
    doubleLaserTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    screenShake: 0,
    protonAnimTimer: 0,
    shootTimer: 0,
    player: { x: CANVAS_W / 2, y: CANVAS_H - 100, w: 40, h: 50 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    powerups: [],
    boss: null,
  };
}

export function createGame(canvas: HTMLCanvasElement, options: GameOptions = {}): Game {
  const ctx = canvas.getContext('2d')!;
  const now = options.now ?? (() => Date.now());
  const storage = options.storage ?? browserStorage();
  const audio = createAudio();
  const input = createInputState();
  const starfield = createStarfield();
  const s: GameSession = {
    gameState: 'menu',
    countdownStart: 0,
    stageClearAt: 0,
    runEndedAt: 0,
    ...loadProgress(storage),
    ...createRunState(),
  };

  const isInputLocked = (since: number) => now() - since < INPUT_LOCK_MS;

  // ========== 進度與關卡流程 ==========

  /** 把尚未結算的分數計入累積分數並存檔；可重複呼叫，不會重複累積。 */
  function bankScore() {
    s.totalScore += Math.max(0, s.score - s.settledScore);
    s.settledScore = s.score;
    s.highScore = Math.max(s.highScore, s.score);
    saveProgress(storage, s);
  }

  function resetRun() {
    Object.assign(s, createRunState());
  }

  function startRun() {
    audio.init();
    resetRun();
    s.gameState = 'countdown';
    s.countdownStart = now();
  }

  function finishRun() {
    if (s.gameState !== 'playing') return;
    s.gameState = 'gameover';
    s.runEndedAt = now();
    bankScore();
  }

  function clearStage() {
    if (s.gameState !== 'playing') return;
    s.stageBonus = stageClearBonus(s.stage, s.lives);
    s.score += s.stageBonus;
    s.bestStage = Math.max(s.bestStage, s.stage);
    bankScore();
    s.gameState = 'stageclear';
    s.stageClearAt = now();
    releaseAll(input);
    audio.powerup();
  }

  function nextStage() {
    if (isInputLocked(s.stageClearAt)) return;
    s.stage++;
    s.bestStage = Math.max(s.bestStage, s.stage);
    saveProgress(storage, s);
    Object.assign(s, {
      gameTime: STAGE_DURATION,
      lives: Math.min(MAX_LIVES, s.lives + 1),
      bullets: [],
      enemyBullets: [],
      enemies: [],
      powerups: [],
      particles: [],
      boss: null,
      shieldActive: true,
      shieldTimer: STAGE_START_SHIELD_FRAMES,
      invincible: false,
      doubleLaser: false,
      lastProtonTime: -PROTON_COOLDOWN,
      shootTimer: 0,
      gameState: 'countdown',
      countdownStart: now(),
    } satisfies Partial<GameSession>);
    s.player.x = CANVAS_W / 2;
    s.player.y = CANVAS_H - 100;
  }

  // ========== 戰鬥 ==========

  // 雷射和魚雷共用擊殺結算，避免漏分或重複計分。
  function defeatEnemy(e: Enemy) {
    s.combo++;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    const bonus = comboMilestoneBonus(s.combo, s.stage);
    if (bonus > 0) {
      s.score += bonus;
      s.notice = `${s.combo} 連擊！獎勵 +${bonus}`;
      s.noticeUntil = now() + NOTICE_MS;
    }
    s.score += enemyKillScore(e.type, s.combo);
    audio.explosion();
    addExplosion(s.particles, e.x, e.y, '#ff4400', 20);
  }

  function defeatBoss() {
    const boss = s.boss;
    if (!boss) return;
    s.score += BOSS_KILL_SCORE;
    s.combo += BOSS_KILL_COMBO;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    audio.explosion();
    addExplosion(s.particles, boss.x, boss.y, '#8844ff', 50);
    addExplosion(s.particles, boss.x - 30, boss.y + 20, '#ff4400', 30);
    addExplosion(s.particles, boss.x + 30, boss.y - 20, '#ffaa00', 30);
    s.screenShake = 20;
    s.boss = null;
  }

  function fireProtonTorpedo() {
    if (now() - s.lastProtonTime < PROTON_COOLDOWN) return;
    s.lastProtonTime = now();
    s.protonAnimTimer = PROTON_FLASH_FRAMES;
    audio.proton();

    s.enemyBullets = [];
    s.enemies = s.enemies.filter(e => {
      e.hp -= PROTON_ENEMY_DAMAGE;
      addExplosion(s.particles, e.x, e.y, '#ffaa00', 10);
      if (e.hp > 0) return true;
      defeatEnemy(e);
      return false;
    });
    if (s.boss) {
      s.boss.hp -= PROTON_BOSS_DAMAGE;
      addExplosion(s.particles, s.boss.x, s.boss.y, '#ffaa00', 30);
      if (s.boss.hp <= 0) defeatBoss();
    }
    s.screenShake = 15;
  }

  function playerHit() {
    if (s.shieldActive) {
      s.shieldActive = false;
      addExplosion(s.particles, s.player.x, s.player.y, '#0088ff', 15);
      return;
    }
    if (s.invincible) return;
    s.lives--;
    s.invincible = true;
    s.invincibleTimer = INVINCIBLE_FRAMES;
    s.combo = 0;
    s.screenShake = 10;
    audio.explosion();
    addExplosion(s.particles, s.player.x, s.player.y, '#00ff88', 25);
    if (s.lives <= 0) finishRun();
  }

  // ========== 每幀更新 ==========

  function movePlayer() {
    let dx = 0;
    let dy = 0;
    const { keys } = input;
    if (keys.ArrowLeft || keys.KeyA) dx -= PLAYER_SPEED;
    if (keys.ArrowRight || keys.KeyD) dx += PLAYER_SPEED;
    if (keys.ArrowUp || keys.KeyW) dy -= PLAYER_SPEED;
    if (keys.ArrowDown || keys.KeyS) dy += PLAYER_SPEED;
    if (input.touchActive) {
      // 觸控：平滑追隨手指位置
      dx = (input.pointerX - s.player.x) * 0.15;
      dy = (input.pointerY - s.player.y) * 0.15;
    }
    s.player.x = Math.max(25, Math.min(CANVAS_W - 25, s.player.x + dx));
    s.player.y = Math.max(CANVAS_H * 0.4, Math.min(CANVAS_H - 30, s.player.y + dy));
  }

  function firePlayerLasers() {
    const holdingFire = input.keys.Space || input.pointerDown || input.touchActive;
    s.shootTimer++;
    if (s.shootTimer % (holdingFire ? MANUAL_FIRE_FRAMES : AUTO_FIRE_FRAMES) !== 0) return;
    audio.laser();
    s.bullets.push(...createPlayerShots(s.player, s.doubleLaser));
  }

  function updateEnemyBullets() {
    s.enemyBullets = s.enemyBullets.filter(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (overlaps(b, ENEMY_BULLET_HITBOX, s.player, PLAYER_HITBOX)) {
        playerHit();
        return false;
      }
      return b.y < CANVAS_H + 20;
    });
  }

  function spawnOnSchedule() {
    const t = now();
    if (t - s.lastWaveTime > waveInterval(s.stage)) {
      s.enemies.push(...createWave(s.stage, s.gameTime));
      s.lastWaveTime = t;
    }
    if (t - s.lastBossTime > bossInterval(s.stage)) {
      if (!s.boss) s.boss = createBoss(s.stage);
      s.lastBossTime = t;
    }
    if (t - s.lastPowerupTime > POWERUP_INTERVAL) {
      s.powerups.push(createPowerup());
      s.lastPowerupTime = t;
    }
  }

  /** 回傳 false 表示敵機應被移除。 */
  function updateEnemy(e: Enemy): boolean {
    if (s.gameState !== 'playing') return true;
    e.y += e.speed;
    if (e.zigzag) {
      e.zigzagTimer += 0.05;
      e.x += Math.sin(e.zigzagTimer) * 2;
    }

    e.shootTimer--;
    if (e.shootTimer <= 0 && e.y > 0 && e.y < CANVAS_H * 0.7) {
      e.shootTimer = 60 + Math.random() * 60;
      s.enemyBullets.push({ x: e.x, y: e.y + 12, vx: 0, vy: ENEMY_BULLET_SPEED, color: '#ff0044' });
    }

    // 每幀最多被一發雷射擊中
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bullet = s.bullets[i];
      if (!overlaps(bullet, BULLET_HITBOX, e, e)) continue;
      s.bullets.splice(i, 1);
      e.hp--;
      addExplosion(s.particles, bullet.x, e.y, '#ffaa00', 5);
      if (e.hp <= 0) {
        defeatEnemy(e);
        return false;
      }
      break;
    }

    if (overlaps(e, e, s.player, PLAYER_HITBOX)) {
      playerHit();
      addExplosion(s.particles, e.x, e.y, '#ff4400', 15);
      return false;
    }
    return e.y < CANVAS_H + 40;
  }

  function updateBoss() {
    const boss = s.boss;
    if (!boss) return;
    if (boss.entering) {
      boss.y += 1;
      if (boss.y >= 100) boss.entering = false;
      return;
    }

    boss.moveTimer++;
    if (boss.moveTimer > 60) {
      boss.moveDir *= -1;
      boss.moveTimer = 0;
    }
    boss.x = Math.max(boss.w / 2, Math.min(CANVAS_W - boss.w / 2, boss.x + boss.moveDir * 1.5));

    // 扇形彈幕
    boss.shootTimer++;
    if (boss.shootTimer > 20) {
      boss.shootTimer = 0;
      for (let i = -2; i <= 2; i++) {
        s.enemyBullets.push({
          x: boss.x + i * 20,
          y: boss.y + boss.h / 2,
          vx: i * 0.8,
          vy: ENEMY_BULLET_SPEED + 1,
          color: '#ff0044',
        });
      }
    }

    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bullet = s.bullets[i];
      if (!overlaps(bullet, BULLET_HITBOX, boss, boss)) continue;
      s.bullets.splice(i, 1);
      boss.hp--;
      addExplosion(s.particles, bullet.x, bullet.y, '#ffaa00', 3);
      if (boss.hp <= 0) {
        defeatBoss();
        break;
      }
    }
  }

  function updatePowerups() {
    s.powerups = s.powerups.filter(p => {
      p.y += p.speed;
      if (!overlaps(p, POWERUP_HITBOX, s.player, s.player)) return p.y < CANVAS_H + 30;
      audio.powerup();
      if (p.type === 'shield') {
        s.shieldActive = true;
        s.shieldTimer = SHIELD_FRAMES;
      } else if (p.type === 'double') {
        s.doubleLaser = true;
        s.doubleLaserTimer = DOUBLE_LASER_FRAMES;
      } else {
        s.lives = Math.min(s.lives + 1, MAX_LIVES);
      }
      addExplosion(s.particles, p.x, p.y, p.color, 10);
      return false;
    });
  }

  function tickTimers() {
    if (s.invincible && --s.invincibleTimer <= 0) s.invincible = false;
    if (s.shieldActive && --s.shieldTimer <= 0) s.shieldActive = false;
    if (s.doubleLaser && --s.doubleLaserTimer <= 0) s.doubleLaser = false;
    if (s.screenShake > 0) s.screenShake--;
    if (s.protonAnimTimer > 0) s.protonAnimTimer--;
  }

  function update(deltaMs: number) {
    if (s.gameState !== 'playing') return;

    s.gameTime -= deltaMs / 1000;
    if (s.gameTime <= 0) {
      s.gameTime = 0;
      clearStage();
      return;
    }

    movePlayer();
    firePlayerLasers();
    addTrail(s.particles, s.player.x - 16, s.player.y + 20, '#00aaff');
    addTrail(s.particles, s.player.x + 16, s.player.y + 20, '#00aaff');

    s.bullets = s.bullets.filter(b => {
      b.y -= b.speed;
      return b.y > -20;
    });
    updateEnemyBullets();
    if (s.gameState !== 'playing') return;

    spawnOnSchedule();
    s.enemies = s.enemies.filter(updateEnemy);
    if (s.gameState !== 'playing') return;

    updateBoss();
    updatePowerups();
    s.particles = s.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      return p.life > 0;
    });
    tickTimers();
  }

  // ========== 輸入 ==========

  const detachInput = attachInput(canvas, input, {
    onKeyDown(code, repeat) {
      if (repeat && s.gameState !== 'playing') return;
      if (s.gameState === 'stageclear') {
        if (code === 'Enter' || code === 'Space') nextStage();
        return;
      }
      input.keys[code] = true;
      if (s.gameState === 'menu' || (s.gameState === 'gameover' && !isInputLocked(s.runEndedAt))) {
        startRun();
      } else if (code === 'KeyQ' && s.gameState === 'playing') {
        fireProtonTorpedo();
      }
    },
    onPress() {
      audio.init();
      if (s.gameState === 'stageclear') {
        nextStage();
        return true;
      }
      if (s.gameState === 'gameover' && isInputLocked(s.runEndedAt)) return true;
      if (s.gameState === 'menu' || s.gameState === 'gameover') {
        startRun();
        return true;
      }
      return false;
    },
  });

  // ========== 迴圈與畫布 ==========

  function fitCanvas() {
    const container = canvas.parentElement!;
    const scale = Math.min(container.clientWidth / CANVAS_W, container.clientHeight / CANVAS_H);
    canvas.style.width = `${CANVAS_W * scale}px`;
    canvas.style.height = `${CANVAS_H * scale}px`;
  }

  let lastFrame = performance.now();
  let animationId = 0;

  function frame(timestamp: number) {
    let deltaMs = timestamp - lastFrame;
    lastFrame = timestamp;
    if (deltaMs > 100) deltaMs = 16; // 分頁切回時避免時間大跳

    if (s.gameState === 'countdown' && (now() - s.countdownStart) / 1000 >= COUNTDOWN_GO_SECONDS) {
      s.gameState = 'playing';
      s.lastWaveTime = s.lastBossTime = s.lastPowerupTime = now();
    }

    update(deltaMs);
    renderFrame(ctx, s, starfield, now());
    animationId = requestAnimationFrame(frame);
  }

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  animationId = requestAnimationFrame(frame);

  return {
    session: s,
    update,
    startRun,
    resetRun,
    clearStage,
    nextStage,
    finishRun,
    fireProtonTorpedo,
    destroy() {
      cancelAnimationFrame(animationId);
      audio.close();
      detachInput();
      window.removeEventListener('resize', fitCanvas);
    },
  };
}
