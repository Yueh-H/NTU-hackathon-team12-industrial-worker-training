# Lembar Kerja Mesin｜工業現場零件訓練

NTU Hackathon Team 12。把 Practice Cat 的間隔複習引擎，做成手機優先的 Web App：工人用印尼文認防火門零件，主管看進度和弱項。

真實教材來自生產製造表 **FM-DEMO / DEMO-001**（60A 平面防火遮煙視窗扇・子母扇 1724×2202）。原 PDF 不進 git。

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

瀏覽器開 http://localhost:5173 。Demo 建議兩個分頁：一邊 `/learn/agus` 答題，一邊 `/admin` 看數字動。

資料存在瀏覽器 `localStorage`（`shop-trainer-v1`）。首頁可重設 demo。下一步才接 Supabase。

## 教材來源

- `public/demo-sheet.pdf` 原製造表
- `public/drawing.png` 工程圖
- `src/data/seed.json` 12 個零件、3 名員工、1 名主管

## 刻意不做（當天）

登入 PIN／QR、AI 自動產教材、離線同步、多家工廠、HR 整合。
