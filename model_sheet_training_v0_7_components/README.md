# 模型單閱讀訓練 v0.7 — 部件拆分

## 檔案結構

- `index.html`：頁面骨架，只保留外框與載入順序。
- `styles.css`：全部視覺樣式。
- `screens.js`：所有教學/題目內容與畫面資料。
- `progress.js`：朗讀 1 星、區域全對 2 星、下一區閘門。
- `speech.js`：中文朗讀辨識。
- `app.js`：流程控制、上一頁/下一頁、作答與回饋邏輯。
- `assets/top_table.png`：模型單上方表格裁切。
- `assets/item_list.png`：8-1～8-10 項次區域裁切。

## 星星規則

- 一張卡朗讀對 = 1 顆星。
- 這一區全部題答對 = 這一區（與區內卡片）變成 2 顆星。
- 上一區還沒 2 顆星，不能進下一區。

## 建議的功能部件

1. **AppShell**
   - 手機外框、進度條、返回鍵。

2. **LessonScreen**
   - 中印雙語標題與教學內容。

3. **DoorDiagram**
   - 母扇/子扇、鉸鏈側、鎖側等圖像。

4. **TapQuiz**
   - 直接點門片/門邊的互動題。

5. **ChoiceQuiz**
   - 規格、數量、用途等選擇題。

6. **WorkOrderViewer**
   - 顯示模型單局部裁切。

7. **WorkOrderBreakdown**
   - 把 8-5 拆成項次、材料、尺寸、數量、用途。

8. **FeedbackPanel**
   - 答對/答錯訊息與下一步。

9. **CompletionScreen**
   - 測試完成頁。

## 後續最好再拆的資料層

如果要擴充到 Level 2 / Level 3，建議把 `screens.js` 再拆成：
- `lessons/door-basics.js`
- `lessons/hinge-side.js`
- `lessons/work-order-basics.js`
- `lessons/item-reading.js`

這樣新增課程時不必改 `app.js`。
