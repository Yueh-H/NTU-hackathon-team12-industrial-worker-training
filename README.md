# Lembar Kerja Mesin｜工業現場零件訓練

NTU Hackathon Team 12。把 Practice Cat 的間隔複習引擎，做成手機優先的 Web App：工人用印尼文認防火門零件，主管看進度和弱項。

真實教材來自生產製造表 **FM720102 / 11507010-9**（60A 平面防火遮煙視窗扇・子母扇 1724×2202）。圖面已遮客戶／工地名稱；原 PDF 不進 git。

## 兩條介面

- `/learn` 員工：點名進入 → 工單 64 張單字卡 → 測驗（看圖選名／看名選圖／圖上點位置）→ `Lupa` / `Ragu-ragu` / `Ingat`
- `/admin` 主管：指派進度、今日／逾期、測驗正確率、弱項、需要協助的人

員工頁內建「學習小助手」桌寵：進入 `/learn/:employeeId` 後會固定在右下角顯示圖案，會用瀏覽器語音說出提醒；點擊可查看目前進度、重播語音與開始下一張卡。網頁版直接讀取 React 學習狀態，不使用 JSON 同步流程。

複習契約沿用 Practice Cat：第一次學會才排程；D+1／3／7／30；忘記或答錯加隔日 rescue，**不搬動原里程碑**。

## 本機執行

```bash
npm install
npm test
npm run dev
```

瀏覽器開 http://localhost:5173 。沒接雲端時：同一瀏覽器兩個分頁即可。接上 Supabase 後：手機開 `/learn/agus`，筆電開 `/admin`。

## Demo 網址

https://yueh-h.github.io/NTU-hackathon-team12-industrial-worker-training/

`main` 一推就會由 GitHub Actions 部署到 GitHub Pages。員工頁 `/learn`，主管頁 `/admin`。

## 資料持久化（Firebase Firestore）

沒有 `.env` 時用瀏覽器 `localStorage`。有 Firebase 設定時，學習進度寫進 Firestore，主管頁即時更新。

專案：`ntu-team12-trainer`。本機：

```bash
cp .env.example .env
```

填入 Project settings 裡的 web app 金鑰，重開 `npm run dev`。GitHub Pages 由 Actions secrets 注入同一組 `VITE_FIREBASE_*`。

規則在 `firestore.rules`：hackathon demo 允許讀寫進度。正式上線要改 Auth。

## 教材來源

- `public/11507010-9.pdf` 原製造表
- `public/drawing.png` 工程圖
- `src/data/seed.json` 3 名員工、1 名主管
- `src/data/workorder-cards.json` / `parts-cards/deck/` 工單 64 張卡（構造／材料／五金／動詞／欄位／讀行）

## 刻意不做（當天）

登入 PIN／QR、AI 自動產教材、離線同步、多家工廠、HR 整合。
