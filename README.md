# 🚀 NEON SERPENT: STAR WARS STRIKE
### 星際大戰 · 霓虹太空射擊

A Star Wars-inspired neon space shooter that runs entirely in your browser. **One HTML file, no install, no server.**

> 致敬《星際大戰》+ 延續 `neon-serpent` 單檔即玩的架構，X-Wing 對決 TIE 大軍。

![Preview](https://img.shields.io/badge/Playable-One%20HTML-00ff88?style=for-the-badge)
![Platform](https://img.shields.io/badge/PC%20%2B%20Mobile-Ready-FFE81F?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

#### 🎮 線上試玩
直接把 `index.html` 拖進瀏覽器就能玩。

### ✨ 特色
- **60秒生存分數制**：跟 `neon-serpent` 一樣，限時生存衝最高分
- **經典星戰機體**：玩家 X-Wing，敵人 TIE/ln、TIE Interceptor、每45秒登場的 Star Destroyer BOSS
- **霓虹發光系統**：Canvas `shadowBlur` 實作雷射光跡、護盾、爆炸粒子，保留上一代的霓虹感
- **完整遊戲循環**：選單 → 3秒倒數 → 遊戲 → 結算，跟你之前的一模一樣
- **連擊與紀錄**：Combo 連擊、localStorage 最高分儲存
- **手機完整支援**：手指拖曳移動 + 自動射擊

### 🕹️ 操作
| 動作 | PC | 手機 |
| :--- | :--- | :--- |
| 移動 | WASD / 方向鍵 / 滑鼠 | 手指拖曳 |
| 射擊 | 空白鍵 / 滑鼠左鍵 長按連發 | 自動射擊 |
| 大招 | Q = 質子魚雷清屏 | 右下角 ULT 按鈕 |
| 暫停 | P | 右上角按鈕 |

### 💎 道具系統
- 🔵 藍 = 護盾 (6秒無敵 + 青色光罩)
- 🔴 紅 = 雙發雷射 (8秒三重射擊)
- 🟡 黃 = R2-D2 修復 +1 命 (最高5命)

### 👾 敵人
- TIE/ln：1 HP，直線衝刺，100分
- TIE Interceptor：2 HP，Z字高速，250分
- Star Destroyer：100 HP，5向彈幕，5000分

### 🛠️ 技術規格 (延續 neon-serpent)
- 單一 `index.html` 可執行，無外部圖片
- Vanilla JS + Canvas + requestAnimationFrame 60FPS
- 粒子系統：爆炸、引擎尾焰、得分飄字
- Web Audio API 自製音效：pew 雷射 / 爆炸，無 mp3
- 繁體中文註解，模組化函式：`spawnWave()`, `updatePlayer()`, `createExplosion()`

### 🚀 快速開始
```bash
# 1. 複製專案
git clone https://github.com/rita112025-cpu/neon-serpent.git
# 2. 用瀏覽器打開
# 直接雙擊 index.html