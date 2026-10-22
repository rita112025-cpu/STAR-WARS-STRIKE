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

## 銀河遠征與累積進度

- 每關生存 60 秒即可繼續下一關；五個任務名稱循環，敵機數、出現頻率與 BOSS 血量隨關卡增加，並設有難度上限。
- 通關獎勵為「關卡 × 1,500 + 剩餘生命 × 500」分；下一關恢復 1 生命（上限 5）、魚雷充能，並獲得 3 秒護盾。
- 每 10 連擊額外獲得「關卡 × 500」分；雷射和魚雷皆可計分。
- 本次遠征分數會在通關或陣亡時加入歷次累積分數；各關只結算新增分數，避免重複計入。
- 累積軍階：新兵 0、飛行員 10,000、王牌 50,000、中隊長 150,000、銀河傳奇 400,000 分。
- 最高分、累積分數與最遠抵達關卡保存在目前瀏覽器的 localStorage；換裝置、清除網站資料不會保留，未結算就關閉頁面的本關分數不會入帳。
- 通關後點擊畫面或按 Enter／空白鍵繼續；陣亡重玩由第一關開始，累積分數保留。

### 驗證

`npm test` 使用 Node.js 22.13+ 的內建 TypeScript 移除與測試工具，檢查實際遊戲邏輯中的通關、獎勵、存檔、重玩及魚雷擊殺計分，無需下載測試套件。

完整檢查：`npm ci`、`npm run typecheck`、`npm run build`。
