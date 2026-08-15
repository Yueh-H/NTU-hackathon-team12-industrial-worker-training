# Lembar Kerja Mesin｜工業現場零件訓練

NTU Hackathon Team 12。把 Practice Cat 的間隔複習引擎，做成手機優先的 Web App：工人用印尼文認防火門零件，主管看進度和弱項。

真實教材來自生產製造表 **FM720102 / 11507010-9**（60A 平面防火遮煙視窗扇・子母扇 1724×2202）。圖面已遮客戶／工地名稱；原 PDF 不進 git。

## 兩條介面

- `/learn` 員工：點名進入 → 看工程圖 hotspot → 零件卡 → 測驗（看圖選名／看名選圖／在圖上點位置）→ `Lupa` / `Ragu-ragu` / `Ingat`
- `/admin` 主管：指派進度、今日／逾期、測驗正確率、弱項、需要協助的人

複習契約沿用 Practice Cat：第一次學會才排程；D+1／3／7／30；忘記或答錯加隔日 rescue，**不搬動原里程碑**。

## 本機執行

```bash
npm install
npm test
npm run dev
```

瀏覽器開 http://localhost:5173 。沒接雲端時：同一瀏覽器兩個分頁即可。接上 Supabase 後：手機開 `/learn/agus`，筆電開 `/admin`。

## 接中央資料庫（Supabase）

沒有 `.env` 時自動用 `localStorage`。要跨裝置同步：

1. 開一個免費 [Supabase](https://supabase.com) 專案
2. SQL Editor 貼上並執行 `supabase/schema.sql`
3. Settings → API 複製 Project URL 與 anon key
4. 在專案根目錄建立 `.env`（不要提交）：

```bash
cp .env.example .env
```

填入 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，然後重開 `npm run dev`。

首頁徽章會顯示「中央資料庫已連線」。第一次連線會自動寫入 12 個零件與三份 demo 進度。這份 schema 的 RLS 是 hackathon demo 用（anon 可寫進度），正式上線要改 Auth。

## 教材來源

- `public/11507010-9.pdf` 原製造表
- `public/drawing.png` 工程圖
- `src/data/seed.json` 12 個零件、3 名員工、1 名主管

## 刻意不做（當天）

登入 PIN／QR、AI 自動產教材、離線同步、多家工廠、HR 整合。
