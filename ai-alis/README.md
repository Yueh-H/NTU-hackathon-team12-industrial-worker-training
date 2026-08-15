# AI Alis｜學習伴讀桌寵

AI Alis 是從 `practice-cat` 的 macOS 桌寵模式拆出的獨立 MVP：一個 always-on-top 的小寵物，定期讀取學習 snapshot，依照「逾期 → 今日到期 → 新卡 → 完成」的優先順序提醒你。

這個資料夾不依賴工訓 Web App，也不會修改 `practice-cat`。角色 atlas 重用 `practice-cat/Resources/Pet/spritesheet.webp` 的 8×11 動畫格式；核心邏輯則拆成可測試的 `AIAlisCore` library。

## 快速啟動

```bash
cd /Users/jenyueh/Developer/ai-alis
./scripts/test.sh
./scripts/build.sh
./scripts/run.sh
```

第一次啟動會在：

```text
~/Library/Application Support/AIAlis/learning-status.json
```

建立 demo 狀態。桌寵會顯示在所有 Space 的最上層；點擊查看學習情況，拖曳移動位置，右鍵開啟選單。

## 網頁版與獨立版的資料邊界

工訓 Web App 的 `/learn/:employeeId` 頁面會直接把 AI Alis 固定顯示在右下角，從 React `useShop()` 讀取目前學習狀態；網頁互動不需要 JSON bridge，也不需要另外按同步按鈕。

這個資料夾的 macOS 獨立桌寵則是另一種 always-on-top 模式。它不讀瀏覽器狀態，仍可透過一個本機 JSON 狀態檔獨立運作，適合要把桌寵放在其他 App 上方的情境。

AI Alis 只讀一個 JSON 檔，不讀瀏覽器 localStorage，也不把資料送到雲端。把 Web App 產出的 snapshot 放到上面的路徑，或啟動時指定檔案：

```bash
AI_ALIS_STATUS_FILE="/path/to/learning-status.json" ./scripts/run.sh
```

可參考 [Bridge/learning-status.schema.json](/Users/jenyueh/Developer/ai-alis/Bridge/learning-status.schema.json) 與 [Demo/learning-status.json](/Users/jenyueh/Developer/ai-alis/Demo/learning-status.json)。AI Alis 每 20 秒重新讀取；桌寵右鍵也可以立即重新讀取。

## 模組邊界

- `Sources/AIAlisCore/Models`：跨 UI 的 `LearningSnapshot` 資料契約。
- `Sources/AIAlisCore/Services/StatusFileProvider.swift`：檔案 provider；日後可替換成 Firebase／HTTP provider。
- `Sources/AIAlisCore/Services/ReminderEngine.swift`：本機可解釋提醒規則，不需要 API key。
- `Sources/AIAlis`：macOS `NSPanel`、atlas 動畫、狀態 bubble、Menu Bar 與設定。
- `Tests/AIAlisCoreTests`：無 XCTest 依賴的 assertion runner，符合目前 Command Line Tools 環境。

目前的「AI」是本機的學習狀態判讀與提醒角色，沒有假裝接 LLM。若之後要接模型，只需新增一個 message provider，不要讓模型直接改寫學習資料。
