# 學習小助手：Codex 無頭模式

這個小服務讓網頁右下角的「學習小助手」在使用者按下「問學習小助手」時，透過本機 Codex CLI 呼叫 `gpt-5.6-luna`。網頁與服務之間使用 `text/plain`，不使用 JSON，也不把 API key 放進前端。

## 啟動

先確認 Codex CLI 已登入，再開兩個終端機：

```bash
npm run ai:headless
npm run dev
```

服務只監聽 `127.0.0.1:8787`，本機開發頁與專案的 GitHub Pages 網址都已列入 CORS 白名單；預設設定是：

- model：`gpt-5.6-luna`
- reasoning effort：`low`
- sandbox：`read-only`
- `--ephemeral`：每次請求使用暫存工作目錄，完成後清理

可用環境變數覆寫：

```bash
AI_ALIS_CODEX_MODEL=gpt-5.6-luna \
AI_ALIS_CODEX_REASONING=low \
npm run ai:headless
```

健康檢查：

```bash
curl http://127.0.0.1:8787/health
```

這是本機整合；GitHub Pages 只會部署靜態網頁，不能在使用者的瀏覽器裡執行你的 Codex CLI。部署後若要讓所有人使用 AI，需要另外部署受保護的後端服務，並在後端保存憑證，不要把 key 放在 `VITE_*` 或前端程式碼裡。
