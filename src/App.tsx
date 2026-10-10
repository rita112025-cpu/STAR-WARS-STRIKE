import { useEffect, useRef } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // ========== 遊戲常數設定 ==========
    const CANVAS_W = 480;
    const CANVAS_H = 720;
    const PLAYER_SPEED = 5;
    const BULLET_SPEED = 10;
    const ENEMY_BULLET_SPEED = 4;
    const PROTON_COOLDOWN = 15000; // 15秒冷卻
    const BOSS_INTERVAL = 45000; // 45秒出BOSS
    const WAVE_INTERVAL = 3000; // 每3秒一波敵人
    const POWERUP_INTERVAL = 8000; // 每8秒出道具
    const GAME_DURATION = 60; // 60秒生存

    // ========== 遊戲狀態 ==========
    let gameState: 'menu' | 'countdown' | 'playing' | 'gameover' = 'menu';
    let countdownTimer = 3;
    let countdownStart = 0;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let highScore = parseInt(localStorage.getItem('sw_strike_highscore') || '0');
    let lives = 3;
    let gameTime = GAME_DURATION;
    let lastTime = 0;
    let deltaTime = 0;
    let lastWaveTime = 0;
    let lastBossTime = 0;
    let lastPowerupTime = 0;
    let lastProtonTime = -PROTON_COOLDOWN;
    let shieldActive = false;
    let shieldTimer = 0;
    let doubleLaser = false;
    let doubleLaserTimer = 0;
    let invincible = false;
    let invincibleTimer = 0;
    let screenShake = 0;
    let protonAnimTimer = 0;

    // ========== 實體陣列 ==========
    let player = { x: CANVAS_W / 2, y: CANVAS_H - 100, w: 40, h: 50 };
    let bullets: any[] = [];
    let enemyBullets: any[] = [];
    let enemies: any[] = [];
    let particles: any[] = [];
    let powerups: any[] = [];
    let stars: any[] = [];
    let farStars: any[] = [];
    let bossRef: any = null;

    // ========== 輸入系統 ==========
    let keys: { [key: string]: boolean } = {};
    let mouseDown = false;
    let mouseX = CANVAS_W / 2;
    let mouseY = CANVAS_H - 100;
    let touchActive = false;
    let touchOffsetX = 0;
    let touchOffsetY = 0;

    // ========== 音訊系統 (Web Audio API) ==========
    let audioCtx: AudioContext | null = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    }

    // 雷射音效
    function playLaser() {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    }

    // 爆炸音效
    function playExplosion() {
      if (!audioCtx) return;
      const bufferSize = audioCtx.sampleRate * 0.3;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      const gain = audioCtx.createGain();
      source.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      source.start();
    }

    // 質子魚雷音效
    function playProton() {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }

    // 道具音效
    function playPowerup() {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }

    // ========== 星空背景初始化 ==========
    function initStars() {
      stars = [];
      farStars = [];
      for (let i = 0; i < 80; i++) {
        stars.push({
          x: Math.random() * CANVAS_W,
          y: Math.random() * CANVAS_H,
          speed: 1 + Math.random() * 2,
          size: 0.5 + Math.random() * 1.5,
          brightness: 0.3 + Math.random() * 0.7
        });
      }
      for (let i = 0; i < 40; i++) {
        farStars.push({
          x: Math.random() * CANVAS_W,
          y: Math.random() * CANVAS_H,
          speed: 0.3 + Math.random() * 0.5,
          size: 0.3 + Math.random() * 0.8,
          brightness: 0.1 + Math.random() * 0.3
        });
      }
    }

    // ========== 粒子系統 ==========
    function createExplosion(x: number, y: number, color: string, count: number = 20) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.02 + Math.random() * 0.03,
          color,
          size: 2 + Math.random() * 3
        });
      }
    }

    function createTrail(x: number, y: number, color: string) {
      particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 1 + Math.random() * 2,
        life: 1,
        decay: 0.05,
        color,
        size: 1 + Math.random() * 2
      });
    }

    // ========== 繪製函數 ==========

    // 繪製星空背景
    function drawBackground() {
      // 深空漸層
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#000011');
      grad.addColorStop(0.5, '#000022');
      grad.addColorStop(1, '#000033');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 遠景星球（死星剪影）
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(CANVAS_W - 80, 120, 60, 0, Math.PI * 2);
      ctx.fillStyle = '#444466';
      ctx.fill();
      // 死星凹槽
      ctx.beginPath();
      ctx.arc(CANVAS_W - 80, 120, 60, -0.3, 0.3);
      ctx.strokeStyle = '#666688';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 小行星
      ctx.beginPath();
      ctx.arc(60, 200, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#333355';
      ctx.fill();
      ctx.restore();

      // 遠景星星
      farStars.forEach(s => {
        s.y += s.speed;
        if (s.y > CANVAS_H) { s.y = 0; s.x = Math.random() * CANVAS_W; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 150, 200, ${s.brightness})`;
        ctx.fill();
      });

      // 近景星星
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > CANVAS_H) { s.y = 0; s.x = Math.random() * CANVAS_W; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${s.brightness})`;
        ctx.fill();
      });
    }

    // 繪製X-Wing戰機
    function drawXWing(x: number, y: number) {
      ctx.save();
      ctx.translate(x, y);

      // 引擎光焰
      const flicker = Math.sin(Date.now() * 0.02) * 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00aaff';
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(-18, 18, 4, 8 + flicker);
      ctx.fillRect(14, 18, 4, 8 + flicker);
      ctx.fillRect(-8, 20, 3, 6 + flicker);
      ctx.fillRect(5, 20, 3, 6 + flicker);

      // 機翼（四翼X造型）
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ff88';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      // 左翼
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(-25, 20);
      ctx.lineTo(-22, 15);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fillStyle = '#004422';
      ctx.fill();
      ctx.stroke();
      // 右翼
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.lineTo(25, 20);
      ctx.lineTo(22, 15);
      ctx.lineTo(5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 上翼
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(-22, -15);
      ctx.lineTo(-20, -10);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.lineTo(22, -15);
      ctx.lineTo(20, -10);
      ctx.lineTo(5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 機身
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-6, 20);
      ctx.lineTo(6, 20);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fillStyle = '#003322';
      ctx.fill();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 駕駛艙
      ctx.beginPath();
      ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#006644';
      ctx.fill();
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 護盾效果
      if (shieldActive) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0088ff';
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 136, 255, ${0.4 + Math.sin(Date.now() * 0.01) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 無敵閃爍
      if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      ctx.restore();
    }

    // 繪製TIE戰機
    function drawTIE(x: number, y: number, type: string) {
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff0044';

      if (type === 'interceptor') {
        // TIE攔截機 - 有斜翼
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 2;
        // 左翼板
        ctx.beginPath();
        ctx.moveTo(-15, -12);
        ctx.lineTo(-18, 12);
        ctx.lineTo(-12, 10);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fillStyle = '#330011';
        ctx.fill();
        ctx.stroke();
        // 右翼板
        ctx.beginPath();
        ctx.moveTo(15, -12);
        ctx.lineTo(18, 12);
        ctx.lineTo(12, 10);
        ctx.lineTo(10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 斜翼延伸
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
        // 座艙
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#220011';
        ctx.fill();
        ctx.strokeStyle = '#ff4466';
        ctx.stroke();
        // 窗口
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0044';
        ctx.fill();
      } else {
        // 標準TIE/ln
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 2;
        // 左翼板（六邊形）
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = -16 + Math.cos(angle) * 12;
          const py = Math.sin(angle) * 12;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#330011';
        ctx.fill();
        ctx.stroke();
        // 右翼板
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = 16 + Math.cos(angle) * 12;
          const py = Math.sin(angle) * 12;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 連接桿
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-4, 0);
        ctx.moveTo(4, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        // 座艙球
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#220011';
        ctx.fill();
        ctx.strokeStyle = '#ff4466';
        ctx.stroke();
        // 窗口
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0044';
        ctx.fill();
      }
      ctx.restore();
    }

    // 繪製星際驅逐艦（BOSS）
    function drawStarDestroyer(x: number, y: number, w: number, h: number, hp: number, maxHp: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#8844ff';

      // 艦體（楔形）
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.closePath();
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
      const flicker = Math.sin(Date.now() * 0.015) * 2;
      ctx.fillStyle = '#8844ff';
      ctx.shadowColor = '#8844ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-20, h / 2 - 5, 8, 5 + flicker);
      ctx.fillRect(-5, h / 2 - 5, 10, 8 + flicker);
      ctx.fillRect(12, h / 2 - 5, 8, 5 + flicker);

      // HP條
      ctx.shadowBlur = 0;
      const barW = w * 0.8;
      const barH = 6;
      const barY = -h / 2 - 15;
      ctx.fillStyle = '#330033';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = hp > maxHp * 0.3 ? '#ff4444' : '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 5;
      ctx.fillRect(-barW / 2, barY, barW * (hp / maxHp), barH);

      ctx.restore();
    }

    // 繪製雷射子彈
    function drawBullet(b: any) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
      // 光輝尾跡
      ctx.globalAlpha = 0.4;
      ctx.fillRect(b.x - 1, b.y - 12, 2, 18);
      ctx.restore();
    }

    // 繪製道具
    function drawPowerup(p: any) {
      ctx.save();
      ctx.translate(p.x, p.y);
      const pulse = Math.sin(Date.now() * 0.005) * 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;

      if (p.type === 'shield') {
        // 藍色護盾 - R2D2風格
        ctx.beginPath();
        ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 136, 255, 0.3)';
        ctx.fill();
        ctx.fillStyle = '#0088ff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('S', 0, 4);
      } else if (p.type === 'double') {
        // 紅色雙發
        ctx.beginPath();
        ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 68, 0, 0.3)';
        ctx.fill();
        ctx.fillStyle = '#ff4400';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('2x', 0, 4);
      } else {
        // 黃色R2修復
        ctx.beginPath();
        ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+1', 0, 4);
      }
      ctx.restore();
    }

    // ========== 遊戲邏輯 ==========

    // 生成敵機波次
    function spawnWave() {
      const waveNum = Math.floor((GAME_DURATION - gameTime) / 10);
      const count = 3 + waveNum * 2;

      for (let i = 0; i < count; i++) {
        const isInterceptor = Math.random() < 0.3 + waveNum * 0.05;
        enemies.push({
          x: 40 + Math.random() * (CANVAS_W - 80),
          y: -30 - i * 40,
          w: isInterceptor ? 30 : 36,
          h: isInterceptor ? 24 : 24,
          type: isInterceptor ? 'interceptor' : 'basic',
          hp: isInterceptor ? 2 : 1,
          speed: isInterceptor ? 3 : 1.5 + waveNum * 0.2,
          zigzag: isInterceptor,
          zigzagTimer: Math.random() * Math.PI * 2,
          shootTimer: Math.random() * 60 + 30
        });
      }
    }

    // 生成BOSS
    function spawnBoss() {
      if (bossRef) return;
      const bossHp = 100 + Math.floor((GAME_DURATION - gameTime) / 15) * 20;
      bossRef = {
        x: CANVAS_W / 2,
        y: -80,
        w: 120,
        h: 160,
        hp: bossHp,
        maxHp: bossHp,
        speed: 1,
        entering: true,
        shootTimer: 0,
        moveDir: 1,
        moveTimer: 0
      };
    }

    // 生成道具
    function spawnPowerup() {
      const types = ['shield', 'double', 'repair'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colors: any = { shield: '#0088ff', double: '#ff4400', repair: '#ffcc00' };
      powerups.push({
        x: 30 + Math.random() * (CANVAS_W - 60),
        y: -20,
        type,
        color: colors[type],
        speed: 1.5
      });
    }

    // 玩家射擊
    let shootTimer = 0;
    function playerShoot() {
      shootTimer++;
      if (shootTimer % 6 !== 0) return; // 每6幀射一次

      playLaser();
      if (doubleLaser) {
        bullets.push({ x: player.x - 10, y: player.y - 20, speed: BULLET_SPEED, color: '#00ff88' });
        bullets.push({ x: player.x + 10, y: player.y - 20, speed: BULLET_SPEED, color: '#00ff88' });
      } else {
        bullets.push({ x: player.x, y: player.y - 25, speed: BULLET_SPEED, color: '#00ff88' });
      }
    }

    // 質子魚雷
    function fireProtonTorpedo() {
      const now = Date.now();
      if (now - lastProtonTime < PROTON_COOLDOWN) return;
      lastProtonTime = now;
      protonAnimTimer = 30;
      playProton();

      // 清除所有敵機子彈
      enemyBullets = [];

      // 對所有敵機造成大量傷害
      enemies.forEach(e => {
        e.hp -= 5;
        createExplosion(e.x, e.y, '#ffaa00', 10);
      });
      if (bossRef) {
        bossRef.hp -= 20;
        createExplosion(bossRef.x, bossRef.y, '#ffaa00', 30);
      }

      // 全屏閃光效果
      screenShake = 15;
    }

    // 碰撞檢測
    function checkCollision(a: any, b: any, aw: number, ah: number, bw: number, bh: number) {
      return Math.abs(a.x - b.x) < (aw + bw) / 2 &&
             Math.abs(a.y - b.y) < (ah + bh) / 2;
    }

    // 玩家受傷
    function playerHit() {
      if (invincible || shieldActive) {
        if (shieldActive) {
          shieldActive = false;
          createExplosion(player.x, player.y, '#0088ff', 15);
        }
        return;
      }
      lives--;
      invincible = true;
      invincibleTimer = 120; // 2秒無敵
      combo = 0;
      screenShake = 10;
      playExplosion();
      createExplosion(player.x, player.y, '#00ff88', 25);

      if (lives <= 0) {
        gameState = 'gameover';
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('sw_strike_highscore', highScore.toString());
        }
      }
    }

    // ========== 更新邏輯 ==========
    function update() {
      if (gameState !== 'playing') return;

      const now = Date.now();

      // 更新遊戲時間
      gameTime -= deltaTime / 1000;
      if (gameTime <= 0) {
        gameTime = 0;
        gameState = 'gameover';
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('sw_strike_highscore', highScore.toString());
        }
        return;
      }

      // 玩家移動
      let dx = 0, dy = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= PLAYER_SPEED;
      if (keys['ArrowRight'] || keys['KeyD']) dx += PLAYER_SPEED;
      if (keys['ArrowUp'] || keys['KeyW']) dy -= PLAYER_SPEED;
      if (keys['ArrowDown'] || keys['KeyS']) dy += PLAYER_SPEED;

      if (touchActive) {
        const targetX = mouseX;
        const targetY = mouseY;
        dx = (targetX - player.x) * 0.15;
        dy = (targetY - player.y) * 0.15;
      }

      player.x = Math.max(25, Math.min(CANVAS_W - 25, player.x + dx));
      player.y = Math.max(CANVAS_H * 0.4, Math.min(CANVAS_H - 30, player.y + dy));

      // 自動射擊 + 手動射擊
      if (keys['Space'] || mouseDown || touchActive) {
        playerShoot();
      } else {
        // 自動射擊（較慢）
        shootTimer++;
        if (shootTimer % 12 === 0) {
          playLaser();
          if (doubleLaser) {
            bullets.push({ x: player.x - 10, y: player.y - 20, speed: BULLET_SPEED, color: '#00ff88' });
            bullets.push({ x: player.x + 10, y: player.y - 20, speed: BULLET_SPEED, color: '#00ff88' });
          } else {
            bullets.push({ x: player.x, y: player.y - 25, speed: BULLET_SPEED, color: '#00ff88' });
          }
        }
      }

      // 引擎尾跡
      createTrail(player.x - 16, player.y + 20, '#00aaff');
      createTrail(player.x + 16, player.y + 20, '#00aaff');

      // 更新子彈
      bullets = bullets.filter(b => {
        b.y -= b.speed;
        return b.y > -20;
      });

      // 更新敵機子彈
      enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx || 0;
        b.y += b.vy || ENEMY_BULLET_SPEED;
        // 碰撞玩家
        if (checkCollision(b, player, 6, 6, 30, 40)) {
          playerHit();
          return false;
        }
        return b.y < CANVAS_H + 20;
      });

      // 生成波次
      if (now - lastWaveTime > WAVE_INTERVAL) {
        spawnWave();
        lastWaveTime = now;
      }

      // 生成BOSS
      if (now - lastBossTime > BOSS_INTERVAL) {
        spawnBoss();
        lastBossTime = now;
      }

      // 生成道具
      if (now - lastPowerupTime > POWERUP_INTERVAL) {
        spawnPowerup();
        lastPowerupTime = now;
      }

      // 更新敵機
      enemies = enemies.filter(e => {
        e.y += e.speed;
        if (e.zigzag) {
          e.zigzagTimer += 0.05;
          e.x += Math.sin(e.zigzagTimer) * 2;
        }

        // 敵機射擊
        e.shootTimer--;
        if (e.shootTimer <= 0 && e.y > 0 && e.y < CANVAS_H * 0.7) {
          e.shootTimer = 60 + Math.random() * 60;
          enemyBullets.push({
            x: e.x, y: e.y + 12,
            vx: 0, vy: ENEMY_BULLET_SPEED,
            color: '#ff0044'
          });
        }

        // 子彈碰撞敵機
        for (let i = bullets.length - 1; i >= 0; i--) {
          if (checkCollision(bullets[i], e, 4, 12, e.w, e.h)) {
            bullets.splice(i, 1);
            e.hp--;
            createExplosion(bullets[i]?.x || e.x, e.y, '#ffaa00', 5);
            if (e.hp <= 0) {
              combo++;
              maxCombo = Math.max(maxCombo, combo);
              score += (e.type === 'interceptor' ? 200 : 100) * Math.min(combo, 10);
              playExplosion();
              createExplosion(e.x, e.y, '#ff4400', 20);
              return false;
            }
            break;
          }
        }

        // 敵機碰撞玩家
        if (checkCollision(e, player, e.w, e.h, 30, 40)) {
          playerHit();
          createExplosion(e.x, e.y, '#ff4400', 15);
          return false;
        }

        return e.y < CANVAS_H + 40;
      });

      // 更新BOSS
      if (bossRef) {
        if (bossRef.entering) {
          bossRef.y += 1;
          if (bossRef.y >= 100) bossRef.entering = false;
        } else {
          // BOSS移動
          bossRef.moveTimer++;
          if (bossRef.moveTimer > 60) {
            bossRef.moveDir *= -1;
            bossRef.moveTimer = 0;
          }
          bossRef.x += bossRef.moveDir * 1.5;
          bossRef.x = Math.max(bossRef.w / 2, Math.min(CANVAS_W - bossRef.w / 2, bossRef.x));

          // BOSS射擊
          bossRef.shootTimer++;
          if (bossRef.shootTimer > 20) {
            bossRef.shootTimer = 0;
            // 扇形彈幕
            for (let i = -2; i <= 2; i++) {
              enemyBullets.push({
                x: bossRef.x + i * 20,
                y: bossRef.y + bossRef.h / 2,
                vx: i * 0.8,
                vy: ENEMY_BULLET_SPEED + 1,
                color: '#ff0044'
              });
            }
          }

          // 子彈碰撞BOSS
          for (let i = bullets.length - 1; i >= 0; i--) {
            if (checkCollision(bullets[i], bossRef, 4, 12, bossRef.w, bossRef.h)) {
              bullets.splice(i, 1);
              bossRef.hp--;
              createExplosion(bullets[i]?.x || bossRef.x, bullets[i]?.y || bossRef.y, '#ffaa00', 3);
              if (bossRef.hp <= 0) {
                score += 5000;
                combo += 10;
                playExplosion();
                createExplosion(bossRef.x, bossRef.y, '#8844ff', 50);
                createExplosion(bossRef.x - 30, bossRef.y + 20, '#ff4400', 30);
                createExplosion(bossRef.x + 30, bossRef.y - 20, '#ffaa00', 30);
                screenShake = 20;
                bossRef = null;
                break;
              }
            }
          }
        }
      }

      // 更新道具
      powerups = powerups.filter(p => {
        p.y += p.speed;
        if (checkCollision(p, player, 24, 24, 40, 50)) {
          playPowerup();
          if (p.type === 'shield') {
            shieldActive = true;
            shieldTimer = 600; // 10秒
          } else if (p.type === 'double') {
            doubleLaser = true;
            doubleLaserTimer = 480; // 8秒
          } else {
            lives = Math.min(lives + 1, 5);
          }
          createExplosion(p.x, p.y, p.color, 10);
          return false;
        }
        return p.y < CANVAS_H + 30;
      });

      // 更新粒子
      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        return p.life > 0;
      });

      // 更新計時器
      if (invincible) {
        invincibleTimer--;
        if (invincibleTimer <= 0) invincible = false;
      }
      if (shieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) shieldActive = false;
      }
      if (doubleLaser) {
        doubleLaserTimer--;
        if (doubleLaserTimer <= 0) doubleLaser = false;
      }
      if (screenShake > 0) screenShake--;
      if (protonAnimTimer > 0) protonAnimTimer--;
    }

    // ========== 渲染 ==========
    function render() {
      ctx.save();

      // 螢幕震動
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 背景
      drawBackground();

      if (gameState === 'menu') {
        drawMenu();
      } else if (gameState === 'countdown') {
        drawCountdown();
      } else if (gameState === 'playing') {
        drawGame();
        drawHUD();
      } else if (gameState === 'gameover') {
        drawGame();
        drawHUD();
        drawGameOver();
      }

      // 質子魚雷動畫
      if (protonAnimTimer > 0) {
        ctx.save();
        ctx.globalAlpha = protonAnimTimer / 30;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#ffaa00';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
      }

      ctx.restore();
    }

    function drawMenu() {
      // 標題
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFE81F';
      ctx.fillStyle = '#FFE81F';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEON SERPENT', CANVAS_W / 2, CANVAS_H / 3 - 40);
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.fillText('STAR WARS STRIKE', CANVAS_W / 2, CANVAS_H / 3);

      // 裝飾X-Wing
      drawXWing(CANVAS_W / 2, CANVAS_H / 2 - 20);

      // 提示
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff88';
      ctx.fillStyle = '#00ff88';
      ctx.font = '16px "Courier New", monospace';
      const blink = Math.sin(Date.now() * 0.005) > 0;
      if (blink) {
        ctx.fillText('點擊 / 按任意鍵 開始', CANVAS_W / 2, CANVAS_H * 0.7);
      }

      // 最高分
      ctx.shadowColor = '#FFE81F';
      ctx.fillStyle = '#FFE81F';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(`最高分: ${highScore}`, CANVAS_W / 2, CANVAS_H * 0.8);

      // 操作說明
      ctx.fillStyle = '#888888';
      ctx.shadowBlur = 0;
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('WASD/方向鍵 移動 | SPACE/點擊 射擊', CANVAS_W / 2, CANVAS_H * 0.88);
      ctx.fillText('Q = 質子魚雷 | 手機：觸控拖曳+自動射擊', CANVAS_W / 2, CANVAS_H * 0.92);

      ctx.restore();
    }

    function drawCountdown() {
      drawBackground();
      drawXWing(player.x, player.y);

      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#FFE81F';
      ctx.fillStyle = '#FFE81F';
      ctx.font = 'bold 80px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const elapsed = (Date.now() - countdownStart) / 1000;
      const remaining = Math.ceil(3 - elapsed);

      if (remaining > 0) {
        const scale = 1 + (1 - (elapsed % 1)) * 0.3;
        ctx.save();
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
        ctx.scale(scale, scale);
        ctx.fillText(remaining.toString(), 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.fillText('GO!', CANVAS_W / 2, CANVAS_H / 2);
      }
      ctx.restore();
    }

    function drawGame() {
      // 道具
      powerups.forEach(drawPowerup);

      // 敵機
      enemies.forEach(e => drawTIE(e.x, e.y, e.type));

      // BOSS
      if (bossRef) {
        drawStarDestroyer(bossRef.x, bossRef.y, bossRef.w, bossRef.h, bossRef.hp, bossRef.maxHp);
      }

      // 玩家子彈
      bullets.forEach(drawBullet);

      // 敵機子彈
      enemyBullets.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 粒子
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 玩家
      drawXWing(player.x, player.y);
    }

    function drawHUD() {
      ctx.save();
      ctx.shadowBlur = 0;

      // 分數
      ctx.fillStyle = '#FFE81F';
      ctx.shadowColor = '#FFE81F';
      ctx.shadowBlur = 5;
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`分數: ${score}`, 10, 25);

      // 連擊
      if (combo > 1) {
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText(`連擊 x${combo}`, 10, 45);
      }

      // 時間
      ctx.fillStyle = gameTime < 10 ? '#ff4444' : '#00ff88';
      ctx.shadowColor = ctx.fillStyle;
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.ceil(gameTime)}s`, CANVAS_W - 10, 25);

      // 生命
      ctx.textAlign = 'left';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      for (let i = 0; i < lives; i++) {
        ctx.beginPath();
        ctx.moveTo(10 + i * 22, CANVAS_H - 20);
        ctx.lineTo(16 + i * 22, CANVAS_H - 30);
        ctx.lineTo(22 + i * 22, CANVAS_H - 20);
        ctx.lineTo(16 + i * 22, CANVAS_H - 24);
        ctx.closePath();
        ctx.fill();
      }

      // 質子魚雷冷卻
      const protonReady = Date.now() - lastProtonTime >= PROTON_COOLDOWN;
      ctx.fillStyle = protonReady ? '#ffaa00' : '#444444';
      ctx.shadowColor = protonReady ? '#ffaa00' : 'transparent';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'right';
      if (protonReady) {
        ctx.fillText('[Q] 質子魚雷 就緒', CANVAS_W - 10, CANVAS_H - 15);
      } else {
        const cd = Math.ceil((PROTON_COOLDOWN - (Date.now() - lastProtonTime)) / 1000);
        ctx.fillText(`[Q] 冷卻中 ${cd}s`, CANVAS_W - 10, CANVAS_H - 15);
      }

      // 狀態效果
      let statusY = 65;
      if (shieldActive) {
        ctx.fillStyle = '#0088ff';
        ctx.shadowColor = '#0088ff';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`🛡 護盾 ${Math.ceil(shieldTimer / 60)}s`, 10, statusY);
        statusY += 15;
      }
      if (doubleLaser) {
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff4400';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ 雙發 ${Math.ceil(doubleLaserTimer / 60)}s`, 10, statusY);
      }

      ctx.restore();
    }

    function drawGameOver() {
      ctx.save();
      // 半透明遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.textAlign = 'center';

      // 標題
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0044';
      ctx.fillStyle = '#ff0044';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 3);

      // 分數
      ctx.shadowColor = '#FFE81F';
      ctx.fillStyle = '#FFE81F';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText(`最終分數: ${score}`, CANVAS_W / 2, CANVAS_H / 3 + 50);

      // 最高連擊
      ctx.fillStyle = '#ff8800';
      ctx.shadowColor = '#ff8800';
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText(`最高連擊: ${maxCombo}x`, CANVAS_W / 2, CANVAS_H / 3 + 80);

      // 最高分
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.fillText(`最高分: ${highScore}`, CANVAS_W / 2, CANVAS_H / 3 + 110);

      // 新紀錄
      if (score >= highScore && score > 0) {
        const blink = Math.sin(Date.now() * 0.008) > 0;
        if (blink) {
          ctx.fillStyle = '#FFE81F';
          ctx.shadowColor = '#FFE81F';
          ctx.font = 'bold 18px "Courier New", monospace';
          ctx.fillText('★ 新紀錄！★', CANVAS_W / 2, CANVAS_H / 3 + 140);
        }
      }

      // 重新開始
      const blink2 = Math.sin(Date.now() * 0.005) > 0;
      if (blink2) {
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText('點擊 / 按任意鍵 重新開始', CANVAS_W / 2, CANVAS_H * 0.75);
      }

      ctx.restore();
    }

    // ========== 遊戲循環 ==========
    function gameLoop(timestamp: number) {
      deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      if (deltaTime > 100) deltaTime = 16; // 防止大跳

      // 倒數計時
      if (gameState === 'countdown') {
        const elapsed = (Date.now() - countdownStart) / 1000;
        if (elapsed >= 3.5) {
          gameState = 'playing';
          lastWaveTime = Date.now();
          lastBossTime = Date.now();
          lastPowerupTime = Date.now();
        }
      }

      update();
      render();
      requestAnimationFrame(gameLoop);
    }

    // ========== 重置遊戲 ==========
    function resetGame() {
      score = 0;
      combo = 0;
      maxCombo = 0;
      lives = 3;
      gameTime = GAME_DURATION;
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 100;
      bullets = [];
      enemyBullets = [];
      enemies = [];
      particles = [];
      powerups = [];
      bossRef = null;
      shieldActive = false;
      doubleLaser = false;
      invincible = false;
      screenShake = 0;
      protonAnimTimer = 0;
      lastProtonTime = -PROTON_COOLDOWN;
      shootTimer = 0;
    }

    function startCountdown() {
      initAudio();
      resetGame();
      gameState = 'countdown';
      countdownStart = Date.now();
    }

    // ========== 輸入事件 ==========
    function handleKeyDown(e: KeyboardEvent) {
      keys[e.code] = true;

      if (gameState === 'menu') {
        startCountdown();
      } else if (gameState === 'gameover') {
        startCountdown();
      }

      if (e.code === 'KeyQ' && gameState === 'playing') {
        fireProtonTorpedo();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
    }

    function handleMouseDown(e: MouseEvent) {
      mouseDown = true;
      initAudio();
      if (gameState === 'menu' || gameState === 'gameover') {
        startCountdown();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top) * scaleY;
    }

    function handleMouseUp() {
      mouseDown = false;
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top) * scaleY;
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault();
      touchActive = true;
      initAudio();
      if (gameState === 'menu' || gameState === 'gameover') {
        startCountdown();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const touch = e.touches[0];
      mouseX = (touch.clientX - rect.left) * scaleX;
      mouseY = (touch.clientY - rect.top) * scaleY;
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const touch = e.touches[0];
      mouseX = (touch.clientX - rect.left) * scaleX;
      mouseY = (touch.clientY - rect.top) * scaleY;
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault();
      touchActive = false;
    }

    // ========== Canvas縮放 ==========
    function resizeCanvas() {
      const container = canvas.parentElement!;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const scale = Math.min(maxW / CANVAS_W, maxH / CANVAS_H);
      canvas.style.width = `${CANVAS_W * scale}px`;
      canvas.style.height = `${CANVAS_H * scale}px`;
    }

    // ========== 初始化 ==========
    function init() {
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      initStars();
      resizeCanvas();

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('resize', resizeCanvas);

      lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    }

    init();

    // 清理
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'crosshair'
        }}
      />
    </div>
  );
}
