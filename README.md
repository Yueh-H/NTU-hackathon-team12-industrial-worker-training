# Lembar Kerja Mesin｜工業現場零件訓練

NTU Hackathon Team 12。把 Practice Cat 的間隔複習引擎，做成手機優先的 Web App：工人用印尼文認防火門零件，主管看進度和弱項。

真實教材來自生產製造表 **FM-DEMO / DEMO-001**（60A 平面防火遮煙視窗扇・子母扇 1724×2202）。原 PDF 不進 git。

## 兩條介面

- `/learn` 員工：點名進入 → 工單 64 張單字卡 → 測驗（看圖選名／看名選圖／圖上點位置）→ `Lupa` / `Ragu-ragu` / `Ingat`
- `/admin` 主管：指派進度、今日／逾期、測驗正確率、弱項、需要協助的人

員工頁內建「學習小助手」桌寵：進入 `/learn/:employeeId` 後會固定在右下角顯示圖案，會用瀏覽器語音說出提醒；點擊可查看目前進度、輸入問題、用中文／English／Bahasa Indonesia 問 AI，並開始下一張卡。網頁版直接讀取 React 學習狀態，不使用 JSON 同步流程。

複習契約沿用 Practice Cat：第一次學會才排程；D+1／3／7／30；忘記或答錯加隔日 rescue，**不搬動原里程碑**。

## 本機執行

```bash
npm install
npm test
npm run dev
```

瀏覽器開 http://localhost:5173 。沒接雲端時：同一瀏覽器兩個分頁即可。接上 Supabase 後：手機開 `/learn/agus`，筆電開 `/admin`。

要讓「學習小助手」與主管的「大工單 → 學習」介面使用 Codex，另外開一個終端機執行 `npm run ai:headless`；詳細設定見 [`ai-alis/headless/README.md`](ai-alis/headless/README.md)。學習小助手預設使用 `gpt-5.6-luna`／`low`，大工單拆解預設使用 `gpt-5.6-luna`／`reasoning max`。服務只在本機 `127.0.0.1` 運作，不把 API key 放入前端。

## Demo 網址

https://yueh-h.github.io/NTU-hackathon-team12-industrial-worker-training/

`main` 一推就會由 GitHub Actions 部署到 GitHub Pages。員工頁 `/learn`，主管頁 `/admin`。

## 資料持久化（本機）

學習進度與工單文字存在瀏覽器 `localStorage`。同一台電腦開兩個分頁會同步；換裝置或清掉網站資料就沒了。Firebase 已關掉，GitHub Pages 也不再注入雲端金鑰。

主管可從 `/admin/workorders` 上傳 PDF／PNG 或貼文字。PDF 只在瀏覽器抽字，檔案不上雲。結果頁可切到 `/learn/workorder/{workOrderId}`。

`firestore.rules` 與 `storage.rules` 現在預設全拒。若專案裡還留著舊的公開讀寫規則，請在有 Firebase CLI 的機器執行：

```bash
firebase deploy --only firestore:rules,storage
```

## 教材來源

- 工程圖與 PDF 不進 git；學習頁熱點板不嵌入工單圖
- `src/data/seed.json` 10 名員工、1 名主管，並含多種學習進度／逾期／弱項 demo 狀態
- `src/data/workorder-cards.json` / `parts-cards/deck/` 工單 64 張卡（構造／材料／五金／動詞／欄位／讀行）

## 刻意不做（當天）

登入 PIN／QR、正式權限控管、多家工廠、HR 整合。Firebase Firestore／Storage rules 目前仍是 hackathon demo 的公開讀寫，正式上線前必須接 Firebase Auth 並限制 org／工單範圍。
