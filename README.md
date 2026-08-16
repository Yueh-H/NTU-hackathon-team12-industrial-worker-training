# Lembar Kerja Mesin｜工程訓練單

NTU Hackathon Team 12。手機優先的零件學習與複習 Web App：員工用中印雙語認零件、做測驗；主管看進度和弱項。

教材是通用示範資料，不含來源單位或客戶識別。

## 兩條介面

- `/learn` 員工：點名進入 → 單字卡 → 測驗（看圖選名／看名選圖／圖上點位置）→ `Lupa` / `Ragu-ragu` / `Ingat`
- `/admin` 主管：指派進度、今日／逾期、測驗正確率、弱項、需要協助的人

員工頁內建「學習小助手」：進入 `/learn/:employeeId` 後固定在右下角。圖案是本專案原創 SVG（`public/helper.svg`，CC0），會用瀏覽器語音說出提醒；點擊可查看目前進度、輸入問題、用中文／English／Bahasa Indonesia 問 AI，並開始下一張卡。網頁版直接讀取 React 學習狀態。

複習契約：第一次學會才排程；D+1／3／7／30；忘記或答錯加隔日 rescue，**不搬動原里程碑**。

## 本機執行

```bash
npm install
npm test
npm run dev
```

瀏覽器開 http://localhost:5173 。同一瀏覽器兩個分頁即可對看員工與主管畫面。

要讓學習小助手與工單拆解使用本機 AI，另開終端機執行 `npm run ai:headless`。服務只在 `127.0.0.1`，不把 API key 放進前端。

## Demo 網址

https://yueh-h.github.io/NTU-hackathon-team12-industrial-worker-training/

`main` 一推就由 GitHub Actions 部署到 GitHub Pages。員工頁 `/learn`，主管頁 `/admin`。

## 資料

學習進度存在瀏覽器 `localStorage`。換裝置或清掉網站資料就沒了。

## 刻意不做（當天）

登入 PIN／QR、正式權限控管。
