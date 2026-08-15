# 學習小助手：Codex 無頭模式

這個小服務讓網頁右下角的「學習小助手」、中文朗讀複核與主管的「大工單 → 學習」介面，透過本機 Codex CLI 呼叫 `gpt-5.6-luna`。學習小助手使用純文字；中文朗讀複核與大工單分析使用 JSON，且不把 API key 放進前端。

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

桌寵的 `POST /ask` 會收到學習狀態摘要與使用者問題，問題可以使用中文、English 或 Bahasa Indonesia；Codex 會依使用者問題的主要語言回答，前端也會用相近語言朗讀回答。

可用環境變數覆寫：

```bash
AI_ALIS_CODEX_MODEL=gpt-5.6-luna \
AI_ALIS_CODEX_REASONING=low \
npm run ai:headless
```

主管大工單預設使用 `gpt-5.6-luna` + `reasoning.effort=max`：

```bash
AI_WORKORDER_CODEX_MODEL=gpt-5.6-luna \
AI_WORKORDER_CODEX_REASONING=max \
npm run ai:headless
```

中文朗讀複核預設也使用 `gpt-5.6-luna` + `reasoning.effort=max`。瀏覽器先做即時語音轉文字，只有結果不完全吻合時才送到 `POST http://127.0.0.1:8787/judge-speech` 讓 Codex 複核；服務未啟動時仍使用瀏覽器本機的寬鬆比對。

可用環境變數覆寫：

```bash
AI_SPEECH_CODEX_MODEL=gpt-5.6-luna \
AI_SPEECH_CODEX_REASONING=max \
npm run ai:headless
```

端點：`POST http://127.0.0.1:8787/analyze-workorder`。若服務未啟動，主管頁會顯示「示範拆解」並仍可完成當天 demo；正式使用前請確認結果已標示為 Codex AI。

健康檢查：

```bash
curl http://127.0.0.1:8787/health
```

這是本機整合；GitHub Pages 只會部署靜態網頁，不能在使用者的瀏覽器裡執行你的 Codex CLI。部署後若要讓所有人使用 AI，需要另外部署受保護的後端服務，並在後端保存憑證，不要把 key 放在 `VITE_*` 或前端程式碼裡。
